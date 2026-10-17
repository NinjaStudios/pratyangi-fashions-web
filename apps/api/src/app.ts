import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { createAddressService } from "./addresses/service.js";
import { createGoogleVerifier, type GoogleVerifier } from "./auth/google.js";
import { createAuthService } from "./auth/service.js";
import { cookieName, createSessionStore, toPublicCustomer, type PublicCustomer } from "./auth/sessions.js";
import type { Config } from "./config.js";
import type { Db } from "./db.js";
import { HttpError, forbidden, unauthorized } from "./errors.js";
import type { Mailer } from "./mailer.js";
import { addressSchema, forgotSchema, googleSchema, loginSchema, parse, resetSchema, signupSchema } from "./validation.js";

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
  limits?: Partial<Record<"login" | "signup" | "google" | "reset", number>>;
};

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function createApp({ config, db, mailer, google, limits = {} }: AppDeps) {
  const app = express();
  if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY));
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.webOrigins, credentials: true }));
  app.use(express.json({ limit: "20kb" }));
  app.use(cookieParser());

  // CSRF defence, on top of the SameSite=Lax cookie: a request that changes anything must come from our own website.
  app.use((req, _res, next) => {
    if (unsafeMethods.has(req.method) && !config.webOrigins.includes(String(req.headers.origin ?? "").replace(/\/$/, ""))) {
      return next(forbidden("This request did not come from the Pratyangi Fashions website."));
    }
    next();
  });

  const sessions = createSessionStore(db, config.SESSION_DAYS);
  const auth = createAuthService({ db, sessions, mailer, google: google === undefined ? createGoogleVerifier(config.GOOGLE_CLIENT_ID) : google });
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

  // who is signed in? (looks at the cookie on every request; routes below decide whether they need someone)
  app.use(async (req, _res, next) => {
    const token = req.cookies?.[cookieName];
    if (typeof token === "string" && token) req.customer = ((found) => (found ? toPublicCustomer(found.customer) : undefined))(await sessions.find(token));
    next();
  });
  const requireCustomer: RequestHandler = (req, _res, next) => next(req.customer ? undefined : unauthorized());

  app.get("/health", (_req, res) => void res.json({ ok: true }));

  // ---- accounts -------------------------------------------------------------------------------------------------
  const signedIn = (res: Response, started: { customer: PublicCustomer; token: string; expiresAt: Date }, status = 200) => {
    setCookie(res, started.token, started.expiresAt);
    res.status(status).json({ user: started.customer });
  };

  app.post("/auth/signup", limiter("signup", 10, 60), async (req, res) => {
    signedIn(res, await auth.signUp(parse(signupSchema, req.body), req.get("user-agent")), 201);
  });
  app.post("/auth/login", limiter("login", 10, 15), async (req, res) => {
    signedIn(res, await auth.signIn(parse(loginSchema, req.body), req.get("user-agent")));
  });
  app.post("/auth/google", limiter("google", 20, 15), async (req, res) => {
    signedIn(res, await auth.signInWithGoogle(parse(googleSchema, req.body).credential, req.get("user-agent")));
  });
  app.post("/auth/logout", async (req, res) => {
    const token = req.cookies?.[cookieName];
    if (typeof token === "string" && token) await sessions.destroy(token);
    res.clearCookie(cookieName, { httpOnly: true, secure: config.isProduction, sameSite: "lax", path: "/" });
    res.status(204).end();
  });
  app.get("/auth/me", (req, res) => {
    if (!req.customer) throw unauthorized();
    res.json({ user: req.customer });
  });
  app.post("/auth/password/forgot", limiter("reset", 5, 15), async (req, res) => {
    await auth.requestPasswordReset(parse(forgotSchema, req.body).email);
    res.json({ message: "If an account matches, we have emailed a 6-digit code." });
  });
  app.post("/auth/password/reset", limiter("reset", 5, 15), async (req, res) => {
    await auth.resetPassword(parse(resetSchema, req.body));
    res.status(204).end();
  });

  // ---- address book (signed-in customers only) ----------------------------------------------------------------
  const owner = (req: Request) => (req.customer as PublicCustomer).id;
  app.use("/addresses", requireCustomer);
  // an address id is a whole number; anything else cannot exist
  app.param("id", (_req, _res, next, id: string) => next(/^\d{1,18}$/.test(id) ? undefined : new HttpError(404, "We could not find that address. It may have been deleted.")));
  app.get("/addresses", async (req, res) => void res.json({ addresses: await addresses.list(owner(req)) }));
  app.post("/addresses", async (req, res) => void res.status(201).json({ address: await addresses.create(owner(req), parse(addressSchema, req.body)) }));
  app.put("/addresses/:id", async (req, res) => void res.json({ address: await addresses.update(owner(req), String(req.params.id), parse(addressSchema, req.body)) }));
  app.delete("/addresses/:id", async (req, res) => {
    await addresses.remove(owner(req), String(req.params.id));
    res.status(204).end();
  });
  app.post("/addresses/:id/default", async (req, res) => void res.json({ addresses: await addresses.setDefault(owner(req), String(req.params.id)) }));

  app.use((_req, _res, next) => next(new HttpError(404, "That page does not exist.")));

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      res.status(error.status).json({ message: error.message, ...(error.field ? { field: error.field } : {}), ...(error.errors ? { errors: error.errors } : {}) });
      return;
    }
    if ((error as { type?: string }).type === "entity.parse.failed") {
      res.status(400).json({ message: "The request could not be read. Please try again." });
      return;
    }
    console.error(error);
    res.status(500).json({ message: "Something went wrong on our side. Please try again in a moment." });
  });

  return app;
}
