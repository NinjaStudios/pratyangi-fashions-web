import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { apiPrefix } from "../src/app.js";
import { sha256 } from "../src/security/tokens.js";
import { browser, db, googleToken, makeApp, origin, person, resetDatabase } from "./helpers.js";

beforeEach(resetDatabase);
afterAll(() => db.$disconnect());

describe("email verification link", () => {
  it("signup emails a link, the account starts unverified, and opening the link verifies it once", async () => {
    const { app, sent, lastToken } = makeApp();
    const me = browser(app);
    const signup = await me.post("/auth/signup", person());
    expect(signup.body.user.emailVerified).toBe(false);
    expect(signup.body.verificationEmailSent).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe("buyer1@example.com");
    expect(sent[0]!.text).toContain("http://localhost:3000/verify-email?token=");

    // only a hash of the token is stored
    const token = lastToken();
    const stored = await db.emailVerification.findFirstOrThrow();
    expect(stored.tokenHash).toBe(sha256(token));
    expect(stored.tokenHash).not.toBe(token);

    const verified = await browser(app).post("/auth/email/verify", { token });
    expect(verified.status).toBe(200);
    expect(verified.body.customer.emailVerified).toBe(true);
    expect((await me.get("/auth/me")).body.user.emailVerified).toBe(true);
    expect((await db.customer.findFirstOrThrow()).emailVerifiedAt).not.toBeNull();

    // a link works once
    const again = await browser(app).post("/auth/email/verify", { token });
    expect(again.status).toBe(400);
    expect(again.body).toMatchObject({ field: "token" });
    expect(again.body.message).toMatch(/invalid, has expired or was already used/);
  });

  it("refuses an expired, a made-up and an incomplete link", async () => {
    const { app, lastToken } = makeApp();
    await browser(app).post("/auth/signup", person());
    await db.emailVerification.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await browser(app).post("/auth/email/verify", { token: lastToken() })).status).toBe(400);
    expect((await browser(app).post("/auth/email/verify", { token: "x".repeat(43) })).status).toBe(400);
    const short = await browser(app).post("/auth/email/verify", { token: "abc" });
    expect(short.status).toBe(422);
    expect(short.body.message).toBe("This verification link is incomplete.");
    expect((await db.customer.findFirstOrThrow()).emailVerifiedAt).toBeNull();
  });

  it("a signed-in customer can ask for a new link; an older link stops working", async () => {
    const { app, sent, lastToken } = makeApp();
    const me = browser(app);
    await me.post("/auth/signup", person());
    const first = lastToken();
    const resend = await me.post("/auth/email/resend");
    expect(resend.status).toBe(200);
    expect(sent).toHaveLength(2);
    expect(lastToken()).not.toBe(first);
    expect((await browser(app).post("/auth/email/verify", { token: first })).status).toBe(400);
    expect((await browser(app).post("/auth/email/verify", { token: lastToken() })).status).toBe(200);

    const done = await me.post("/auth/email/resend");
    expect(done.body.message).toBe("Your email is already verified.");
    expect(sent).toHaveLength(2);
    expect((await browser(app).post("/auth/email/resend")).status).toBe(401);
  });

  it("without an email service the account is still created, nothing is pretended, and resend says why", async () => {
    const { app } = makeApp({ mailer: null });
    const me = browser(app);
    const signup = await me.post("/auth/signup", person());
    expect(signup.status).toBe(201);
    expect(signup.body.verificationEmailSent).toBe(false);
    expect(signup.body.user.emailVerified).toBe(false);
    const resend = await me.post("/auth/email/resend");
    expect(resend.status).toBe(503);
    expect(resend.body.message).toMatch(/not set up on the server yet/);
  });

  it("a failing mail server does not stop signup", async () => {
    const { app } = makeApp({ mailer: { send: async () => { throw new Error("smtp down"); } } });
    const signup = await browser(app).post("/auth/signup", person());
    expect(signup.status).toBe(201);
    expect(signup.body.verificationEmailSent).toBe(false);
  });

  it("Google and a reset code also prove the email; a verification link is not needed after them", async () => {
    const { app, lastCode } = makeApp();
    const google = await browser(app).post("/auth/google", { credential: googleToken({ email: "meera@gmail.com" }) });
    expect(google.body.user.emailVerified).toBe(true);

    await browser(app).post("/auth/signup", person());
    expect((await db.customer.findUniqueOrThrow({ where: { email: "buyer1@example.com" } })).emailVerifiedAt).toBeNull();
    await browser(app).post("/auth/password/forgot", { email: "buyer1@example.com" });
    await browser(app).post("/auth/password/reset", { email: "buyer1@example.com", code: lastCode(), password: "NewSaree2027" });
    expect((await db.customer.findUniqueOrThrow({ where: { email: "buyer1@example.com" } })).emailVerifiedAt).not.toBeNull();
  });
});

describe("sessions and access control", () => {
  it("a session stops working when it expires, and expired ones can be purged", async () => {
    const { app } = makeApp();
    const me = browser(app);
    await me.post("/auth/signup", person());
    expect((await me.get("/auth/me")).status).toBe(200);

    await db.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await me.get("/auth/me")).status).toBe(401);
    expect((await me.get("/addresses")).status).toBe(401);
    expect(await db.session.count()).toBe(1);
    await (await import("../src/auth/sessions.js")).createSessionStore(db, 30).purgeExpired();
    expect(await db.session.count()).toBe(0);
  });

  it("the cookie lasts as long as SESSION_DAYS says", async () => {
    const { app } = makeApp();
    await browser(app).post("/auth/signup", person());
    const session = await db.session.findFirstOrThrow();
    const days = (session.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThanOrEqual(30);
  });

  it("every protected route refuses a stranger, and each reply carries a request id", async () => {
    const { app } = makeApp();
    const res = await request(app).get(`${apiPrefix}/addresses`).set("Origin", origin);
    expect(res.status).toBe(401);
    expect(res.headers["x-request-id"]).toBeTruthy();
    expect((await request(app).get(`${apiPrefix}/auth/me`)).status).toBe(401);
    expect((await request(app).get("/health")).body).toEqual({ ok: true });
    expect((await request(app).get(`${apiPrefix}/health`)).body).toEqual({ ok: true });
    // routes outside /api/v1 do not exist
    expect((await request(app).get("/auth/me")).status).toBe(404);
  });

  it("a malformed body and an unknown route get a plain JSON error, never a stack trace", async () => {
    const { app } = makeApp();
    const bad = await request(app).post(`${apiPrefix}/auth/login`).set("Origin", origin).set("Content-Type", "application/json").send("{not json");
    expect(bad.status).toBe(400);
    expect(bad.body).toEqual({ message: "The request could not be read. Please try again." });
    const missing = await request(app).get(`${apiPrefix}/nope`);
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ message: "That page does not exist." }); // just a message: no stack, path or SQL
  });
});
