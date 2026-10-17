import dotenv from "dotenv";
import request from "supertest";
import { createApp, type AppDeps } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createPool } from "../src/db.js";
import type { GoogleProfile, GoogleVerifier } from "../src/auth/google.js";
import type { Mailer } from "../src/mailer.js";
import { migrate } from "../src/migrate.js";

dotenv.config({ path: ".env.test", override: true });

export const origin = "http://localhost:3000";
export const config = loadConfig({ ...process.env, NODE_ENV: "test" });
if (!config.DB_NAME.endsWith("_test")) throw new Error(`Refusing to run: DB_NAME "${config.DB_NAME}" must end in _test because the tests empty the tables.`);

export const db = createPool(config, { multipleStatements: true });

export async function resetDatabase() {
  await migrate(db, () => undefined);
  await db.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of ["shop_password_resets", "shop_customer_addresses", "shop_sessions", "shop_customer_identities", "shop_customers"]) {
    await db.query(`TRUNCATE TABLE ${table}`);
  }
  await db.query("SET FOREIGN_KEY_CHECKS = 1");
}

/** Collects the emails the server tries to send, so a test can read the reset code out of them. */
export function captureMailer() {
  const sent: { to: string; subject: string; text: string }[] = [];
  const mailer: Mailer = { send: async (to, subject, text) => void sent.push({ to, subject, text }) };
  return { sent, mailer, lastCode: () => /(\d{6})/.exec(sent.at(-1)?.text ?? "")?.[1] ?? "" };
}

/** Stands in for Google's token check: a "credential" here is just JSON describing the profile Google would have vouched for. */
export const fakeGoogle: GoogleVerifier = async (credential) => {
  let profile: GoogleProfile;
  try {
    profile = JSON.parse(credential) as GoogleProfile;
  } catch {
    throw new Error("bad token");
  }
  return profile;
};
export const googleToken = (profile: Partial<GoogleProfile> & { email: string }) =>
  JSON.stringify({ sub: `sub-${profile.email}`, emailVerified: true, name: "Google Person", ...profile });

export function makeApp(overrides: Partial<AppDeps> = {}) {
  const mail = captureMailer();
  const app = createApp({ config, db, mailer: mail.mailer, google: fakeGoogle, limits: { login: 1000, signup: 1000, google: 1000, reset: 1000 }, ...overrides });
  return { app, ...mail };
}

/** A browser-like client: keeps cookies between calls and sends the website's Origin header like a real browser does. */
export function browser(app: ReturnType<typeof createApp>) {
  const agent = request.agent(app);
  return {
    get: (path: string) => agent.get(path).set("Origin", origin),
    post: (path: string, body?: object) => agent.post(path).set("Origin", origin).send(body ?? {}),
    put: (path: string, body?: object) => agent.put(path).set("Origin", origin).send(body ?? {}),
    delete: (path: string) => agent.delete(path).set("Origin", origin),
  };
}

export const person = (n = 1) => ({ name: `Test Buyer ${n}`, email: `buyer${n}@example.com`, password: "Saree2026" });
