import dotenv from "dotenv";
import request from "supertest";
import { apiPrefix, createApp, type AppDeps } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createDb } from "../src/db.js";
import type { GoogleProfile, GoogleVerifier } from "../src/auth/google.js";
import type { Mailer } from "../src/mailer.js";

dotenv.config({ path: ".env.test", override: true });

export const origin = "http://localhost:3000";
export const config = loadConfig({ ...process.env, NODE_ENV: "test" });
const databaseName = new URL(config.DATABASE_URL).pathname.slice(1);
if (!databaseName.endsWith("_test")) throw new Error(`Refusing to run: the database "${databaseName}" must end in _test because the tests empty its tables.`);

export const db = createDb(config);

/** Empties every shop_ table (children first). The migrations were already applied by test/global-setup.ts. */
export async function resetDatabase() {
  await db.passwordReset.deleteMany();
  await db.emailVerification.deleteMany();
  await db.address.deleteMany();
  await db.session.deleteMany();
  await db.customerIdentity.deleteMany();
  await db.customer.deleteMany();
}

/** Collects the emails the server tries to send, so a test can read the code or link out of them. */
export function captureMailer() {
  const sent: { to: string; subject: string; text: string }[] = [];
  const mailer: Mailer = { send: async (to, subject, text) => void sent.push({ to, subject, text }) };
  return {
    sent,
    mailer,
    lastCode: () => /(\d{6})/.exec(sent.at(-1)?.text ?? "")?.[1] ?? "",
    lastToken: () => /token=([\w-]+)/.exec(sent.at(-1)?.text ?? "")?.[1] ?? "",
  };
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
  const app = createApp({ config, db, mailer: mail.mailer, google: fakeGoogle, limits: { login: 1000, signup: 1000, google: 1000, reset: 1000, verify: 1000 }, ...overrides });
  return { app, ...mail };
}

/** A browser-like client: keeps cookies between calls and sends the website's Origin header like a real browser does. Paths are under /api/v1. */
export function browser(app: ReturnType<typeof createApp>) {
  const agent = request.agent(app);
  return {
    get: (path: string) => agent.get(apiPrefix + path).set("Origin", origin),
    post: (path: string, body?: object) => agent.post(apiPrefix + path).set("Origin", origin).send(body ?? {}),
    put: (path: string, body?: object) => agent.put(apiPrefix + path).set("Origin", origin).send(body ?? {}),
    delete: (path: string) => agent.delete(apiPrefix + path).set("Origin", origin),
  };
}

export const person = (n = 1) => ({ name: `Test Buyer ${n}`, email: `buyer${n}@example.com`, password: "Saree2026" });
