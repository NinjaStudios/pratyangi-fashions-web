import "dotenv/config";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DB_HOST: z.string().default("127.0.0.1"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1, "DB_USER is required"),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().min(1, "DB_NAME is required"),

  /** The website's address(es), comma separated. Only these may call the API with cookies (CORS) and make changes (CSRF check). */
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  SESSION_DAYS: z.coerce.number().int().positive().default(30),
  /** Needed only for "Continue with Google". Leave empty and the Google route answers 503 "not configured". */
  GOOGLE_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  /** Needed only for password-reset emails, e.g. smtps://user:pass@smtp.example.com:465. Empty in development: codes are printed to this console. */
  SMTP_URL: z.preprocess(emptyToUndefined, z.string().optional()),
  MAIL_FROM: z.string().default("Pratyangi Fashions <no-reply@pratyangifashions.com>"),
});

export type Config = z.infer<typeof schema> & { webOrigins: string[]; isProduction: boolean };

/** Reads and checks the environment once; a missing or invalid value stops the server at start-up with a clear message. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `  ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(`Invalid server settings (see apps/api/.env.example):\n${problems}`);
  }
  const webOrigins = parsed.data.WEB_ORIGIN.split(",").map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean);
  return { ...parsed.data, webOrigins, isProduction: parsed.data.NODE_ENV === "production" };
}
