import "dotenv/config";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),

  /** MySQL connection, e.g. mysql://user:password@127.0.0.1:3306/pratyangi_shop (URL-encode special characters in the password). */
  DATABASE_URL: z.string({ error: "DATABASE_URL is required" }).startsWith("mysql://", { error: "DATABASE_URL must start with mysql://" }),

  /** The website's address(es), comma separated. Only these may call the API with cookies (CORS) and make changes (CSRF check). The first one is used in emailed links. */
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  SESSION_DAYS: z.coerce.number().int().positive().default(30),
  /** Needed only for "Continue with Google". Leave empty and the Google route answers 503 "not configured". */
  GOOGLE_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  /** Needed only for emails (verification links, password reset), e.g. smtps://user:pass@smtp.example.com:465. Empty in development: emails are printed to this console. */
  SMTP_URL: z.preprocess(emptyToUndefined, z.string().optional()),
  MAIL_FROM: z.string().default("Pratyangi Fashions <no-reply@pratyangifashions.com>"),
  /** Number of reverse proxies in front of the API (1 behind nginx or most hosts), so rate limits see the real visitor IP. 0 = none. */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

export type Config = z.infer<typeof schema> & { webOrigins: string[]; webUrl: string; isProduction: boolean; logLevel: string };

/** Reads and checks the environment once; a missing or invalid value stops the server at start-up with a clear message. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `  ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Invalid server settings (see apps/api/.env.example):\n${problems}`);
  }
  const webOrigins = parsed.data.WEB_ORIGIN.split(",").map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean);
  const isProduction = parsed.data.NODE_ENV === "production";
  return {
    ...parsed.data,
    webOrigins,
    webUrl: webOrigins[0] ?? "http://localhost:3000",
    isProduction,
    logLevel: parsed.data.LOG_LEVEL ?? (parsed.data.NODE_ENV === "test" ? "silent" : "info"),
  };
}
