import { randomUUID } from "node:crypto";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { pino } from "pino";
import { pinoHttp } from "pino-http";
import { createAddressService } from "./addresses/service.js";
import { createGoogleVerifier, type GoogleVerifier } from "./auth/google.js";
import { createAuthService } from "./auth/service.js";
import { cookieName, createSessionStore, toPublicCustomer, type PublicCustomer } from "./auth/sessions.js";
import type { Config } from "./config.js";
import type { Db } from "./db.js";
import { HttpError, forbidden, unauthorized } from "./errors.js";
import type { Mailer } from "./mailer.js";
import { addressSchema, forgotSchema, googleSchema, loginSchema, parse, resetSchema, signupSchema, verifyEmailSchema } from "./validation.js";

declare global {
  namespace Express {
    interface Request {
      customer?: PublicCustomer;
    }
  }
}

export type AppDeps = {
  config: Config;
  db: Db;
  mailer: Mailer | null;
  /** Defaults to the real Google check; tests pass their own. */
  google?: GoogleVerifier | null;
  /** Requests allowed per window for each sensitive route. Defaults are for production; tests raise them. */
  limits?: Partial<Record<"login" | "signup" | "google" | "reset" | "verify", number>>;
};

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** All routes live under /api/v1 so a future v2 can run beside it. `/health` is also served at the root for load balancers. */
export const apiPrefix = "/api/v1";

export function createApp({ config, db, mailer, google, limits = {} }: AppDeps) {
  const app = express();
  const logger = pino({
    level: config.logLevel,
    // nothing secret ever reaches the logs: no cookies, no authorization header, no request bodies (they hold passwords and codes)
    redact: { paths: ["req.headers.cookie", "req.headers.authorization", 'res.headers["set-cookie"]'], censor: "[hidden]" },
  });

  if (config.TRUST_PROXY > 0) app.set("trust proxy", config.TRUST_PROXY);
  app.disable("x-powered-by");
  app.use(pinoHttp({ logger, genReqId: (req, res) => {
    const id = String(req.headers["x-request-id"] ?? randomUUID()).slice(0, 64);
    res.setHeader("X-Request-Id", id);
    return id;
  }, customLogLevel: (_req, res, error) => (error || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info") }));
  app.use(helmet());
  app.use(cors({ origin: config.webOrigins, credentials: true }));
  app.use(express.json({ limit: "20kb" }));
  app.use(cookieParser());

  const sessions = createSessionStore(db, config.SESSION_DAYS);
  const auth = createAuthService({
    db, config, sessions, mailer,
    google: google === undefined ? createGoogleVerifier(config.GOOGLE_CLIENT_ID) : google,
    log: (message, error) => logger.warn({ err: error }, message),
  });
  const addresses = createAddressService(db);

  const limiter = (key: keyof NonNullable<AppDeps["limits"]>, max: number, minutes: number): RequestHandler =>
    rateLimit({
      windowMs: minutes * 60_000,
      limit: limits[key] ?? max,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, _res, next) => next(new HttpError(429, "Too many attempts. Please wait a few minutes and try again.")),
    });

  const setCookie = (res: Response, token: string, expires: Date) =>
    res.cookie(cookieName, token, { httpOnly: true, secure: config.isProduction, sameSite: "lax", path: "/", expires });

  app.get("/health", (_req, res) => void res.json({ ok: true }));

  const api = express.Router();

  // CSRF defence, on top of the SameSite=Lax cookie: a request that changes anything must come from our own website.
  api.use((req, _res, next) => {
    if (unsafeMethods.has(req.method) && !config.webOrigins.includes(String(req.headers.origin ?? "").replace(/\/$/, ""))) {
      return next(forbidden("This request did not come from the Pratyangi Fashions website."));
    }
    next();
  });

  // who is signed in? (looks at the cookie on every request; routes below decide whether they need someone)
  api.use(async (req, _res, next) => {
    const token = req.cookies?.[cookieName];
    if (typeof token === "string" && token) {
      const customer = await sessions.find(token);
      if (customer) req.customer = toPublicCustomer(customer);
    }
    next();
  });
  const requireCustomer: RequestHandler = (req, _res, next) => next(req.customer ? undefined : unauthorized());

  api.get("/health", (_req, res) => void res.json({ ok: true }));

  // ---- accounts -------------------------------------------------------------------------------------------------
  const signedIn = (res: Response, started: { customer: PublicCustomer; token: string; expiresAt: Date }, status = 200, extra: object = {}) => {
    setCookie(res, started.token, started.expiresAt);
    res.status(status).json({ user: started.customer, ...extra });
  };

  api.post("/auth/signup", limiter("signup", 10, 60), async (req, res) => {
    const { verificationEmailSent, ...started } = await auth.signUp(parse(signupSchema, req.body), req.get("user-agent"));
    signedIn(res, started, 201, { verificationEmailSent });
  });
  api.post("/auth/login", limiter("login", 10, 15), async (req, res) => {
    signedIn(res, await auth.signIn(parse(loginSchema, req.body), req.get("user-agent")));
  });
  api.post("/auth/google", limiter("google", 20, 15), async (req, res) => {
    signedIn(res, await auth.signInWithGoogle(parse(googleSchema, req.body).credential, req.get("user-agent")));
  });
  api.post("/auth/logout", async (req, res) => {
    const token = req.cookies?.[cookieName];
    if (typeof token === "string" && token) await sessions.destroy(token);
    res.clearCookie(cookieName, { httpOnly: true, secure: config.isProduction, sameSite: "lax", path: "/" });
    res.status(204).end();
  });
  api.get("/auth/me", (req, res) => {
    if (!req.customer) throw unauthorized();
    res.json({ user: req.customer });
  });
  api.post("/auth/email/verify", limiter("verify", 20, 15), async (req, res) => {
    res.json(await auth.verifyEmail(parse(verifyEmailSchema, req.body).token));
  });
  api.post("/auth/email/resend", requireCustomer, limiter("verify", 20, 15), async (req, res) => {
    const { alreadyVerified } = await auth.resendVerification(Number((req.customer as PublicCustomer).id));
    res.json({ message: alreadyVerified ? "Your email is already verified." : "We have sent a new verification link to your email." });
  });
  api.post("/auth/password/forgot", limiter("reset", 5, 15), async (req, res) => {
    await auth.requestPasswordReset(parse(forgotSchema, req.body).email);
    res.json({ message: "If an account matches, we have emailed a 6-digit code." });
  });
  api.post("/auth/password/reset", limiter("reset", 5, 15), async (req, res) => {
    await auth.resetPassword(parse(resetSchema, req.body));
    res.status(204).end();
  });

  // ---- address book (signed-in customers only) ----------------------------------------------------------------
  const owner = (req: Request) => Number((req.customer as PublicCustomer).id);
  api.use("/addresses", requireCustomer);
  // an address id is a whole number; anything else cannot exist
  api.param("id", (_req, _res, next, id: string) => next(/^\d{1,9}$/.test(id) ? undefined : new HttpError(404, "We could not find that address. It may have been deleted.")));
  api.get("/addresses", async (req, res) => void res.json({ addresses: await addresses.list(owner(req)) }));
  api.post("/addresses", async (req, res) => void res.status(201).json({ address: await addresses.create(owner(req), parse(addressSchema, req.body)) }));
  api.put("/addresses/:id", async (req, res) => void res.json({ address: await addresses.update(owner(req), Number(req.params.id), parse(addressSchema, req.body)) }));
  api.delete("/addresses/:id", async (req, res) => {
    await addresses.remove(owner(req), Number(req.params.id));
    res.status(204).end();
  });
  api.post("/addresses/:id/default", async (req, res) => void res.json({ addresses: await addresses.setDefault(owner(req), Number(req.params.id)) }));

  app.use(apiPrefix, api);
  app.use((_req, _res, next) => next(new HttpError(404, "That page does not exist.")));

  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({ message: error.message, ...(error.field ? { field: error.field } : {}), ...(error.errors ? { errors: error.errors } : {}) });
      return;
    }
    if ((error as { type?: string }).type === "entity.parse.failed") {
      res.status(400).json({ message: "The request could not be read. Please try again." });
      return;
    }
    req.log.error({ err: error }, "unhandled error");
    res.status(500).json({ message: "Something went wrong on our side. Please try again in a moment." });
  });

  return app;
}
