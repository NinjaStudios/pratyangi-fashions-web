import type { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { inTransaction, type Db } from "../db.js";
import { HttpError, badRequest, conflict, unauthorized, unavailable } from "../errors.js";
import type { Mailer } from "../mailer.js";
import { hashPassword, verifyAgainstDecoy, verifyPassword } from "../security/password.js";
import { newCode, safeEqualHex, sha256 } from "../security/tokens.js";
import type { GoogleVerifier } from "./google.js";
import { toPublicCustomer, type CustomerRow, type PublicCustomer, type SessionStore } from "./sessions.js";

type FullRow = CustomerRow & { email_verified: number };
type Started = { customer: PublicCustomer; token: string; expiresAt: Date };

const resetMinutes = 10;
const maxResetAttempts = 5;
const wrongLogin = "The email or password is incorrect.";
const isDuplicate = (error: unknown) => (error as { code?: string }).code === "ER_DUP_ENTRY";

export type AuthService = ReturnType<typeof createAuthService>;

export function createAuthService(deps: { db: Db; sessions: SessionStore; mailer: Mailer | null; google: GoogleVerifier | null }) {
  const { db, sessions, mailer, google } = deps;

  const byEmail = async (email: string, connection: Db | PoolConnection = db) => {
    const [rows] = await connection.execute("SELECT id, name, email, password_hash, email_verified, picture_url FROM shop_customers WHERE email = ?", [email]);
    return (rows as FullRow[])[0] ?? null;
  };

  const start = async (row: CustomerRow, userAgent: string | undefined): Promise<Started> => {
    const { token, expiresAt } = await sessions.create(String(row.id), userAgent);
    return { customer: toPublicCustomer(row), token, expiresAt };
  };

  return {
    /** Email + password signup. One account per email address, whichever way it was first created. */
    async signUp(input: { name: string; email: string; password: string }, userAgent?: string): Promise<Started> {
      const taken = (existing: FullRow) =>
        conflict(
          existing.password_hash
            ? "An account with this email already exists. Please sign in instead."
            : "This email is already registered through Google. Please use Continue with Google.",
          "email",
        );
      const existing = await byEmail(input.email);
      if (existing) throw taken(existing);
      const passwordHash = await hashPassword(input.password);
      try {
        const [result] = await db.execute<ResultSetHeader>("INSERT INTO shop_customers (name, email, password_hash) VALUES (?, ?, ?)", [input.name, input.email, passwordHash]);
        return await start({ id: result.insertId, name: input.name, email: input.email, password_hash: passwordHash, picture_url: null }, userAgent);
      } catch (error) {
        // two signups with the same email at the same moment: the UNIQUE key lets exactly one through
        if (isDuplicate(error)) throw conflict("An account with this email already exists. Please sign in instead.", "email");
        throw error;
      }
    },

    async signIn(input: { email: string; password: string }, userAgent?: string): Promise<Started> {
      const row = await byEmail(input.email);
      if (!row) {
        await verifyAgainstDecoy(input.password);
        throw unauthorized(wrongLogin);
      }
      if (!row.password_hash) {
        throw unauthorized("This account signs in with Google. Please use Continue with Google, or choose Forgot password to add a password.");
      }
      if (!(await verifyPassword(row.password_hash, input.password))) throw unauthorized(wrongLogin);
      return start(row, userAgent);
    },

    /**
     * "Continue with Google". A first-time Google user gets an account; a returning one signs in to the same account, found by
     * Google's stable user id, and otherwise by the (Google-verified) email so one email never becomes two accounts.
     */
    async signInWithGoogle(credential: string, userAgent?: string): Promise<Started> {
      if (!google) throw unavailable("Google sign-in is not set up on the server yet.");
      let profile;
      try {
        profile = await google(credential);
      } catch {
        throw unauthorized("Google sign-in could not be verified. Please try again.");
      }
      const email = profile.email.trim().toLowerCase(); // the unique key is on the lower-case form
      if (!profile.emailVerified) throw unauthorized("Your Google email address is not verified, so we cannot sign you in with it.");

      const row = await inTransaction(db, async (connection) => {
        const [identities] = await connection.execute(
          `SELECT c.id, c.name, c.email, c.password_hash, c.email_verified, c.picture_url
             FROM shop_customer_identities i JOIN shop_customers c ON c.id = i.customer_id
            WHERE i.provider = 'google' AND i.provider_user_id = ?`,
          [profile.sub],
        );
        const linked = (identities as FullRow[])[0];
        if (linked) return linked;

        const existing = await byEmail(email, connection);
        if (existing) {
          await connection.execute("INSERT INTO shop_customer_identities (customer_id, provider, provider_user_id) VALUES (?, 'google', ?)", [existing.id, profile.sub]);
          if (!existing.email_verified) {
            // Someone may have registered this address with a password before its owner ever proved it. Google has now
            // proved the owner, so that password is thrown away and any session opened with it is ended.
            await connection.execute("UPDATE shop_customers SET email_verified = 1, password_hash = NULL WHERE id = ?", [existing.id]);
            await connection.execute("DELETE FROM shop_sessions WHERE customer_id = ?", [existing.id]);
            return { ...existing, email_verified: 1, password_hash: null };
          }
          return existing;
        }

        const name = profile.name?.trim().slice(0, 80) || email.split("@")[0] || "Customer";
        const [created] = await connection.execute<ResultSetHeader>("INSERT INTO shop_customers (name, email, email_verified, picture_url) VALUES (?, ?, 1, ?)", [name, email, profile.picture ?? null]);
        await connection.execute("INSERT INTO shop_customer_identities (customer_id, provider, provider_user_id) VALUES (?, 'google', ?)", [created.insertId, profile.sub]);
        return { id: created.insertId, name, email, password_hash: null, email_verified: 1, picture_url: profile.picture ?? null };
      }).catch((error) => {
        if (isDuplicate(error)) throw conflict("This Google account is already linked. Please try again.");
        throw error;
      });
      return start(row, userAgent);
    },

    /** Emails a six-digit code. Answers the same way whether or not the email has an account. */
    async requestPasswordReset(email: string): Promise<void> {
      if (!mailer) throw unavailable("Password reset by email is not set up on the server yet.");
      const row = await byEmail(email);
      if (!row) return;
      const code = newCode();
      await db.execute("DELETE FROM shop_password_resets WHERE customer_id = ?", [row.id]);
      await db.execute("INSERT INTO shop_password_resets (customer_id, code_hash, expires_at) VALUES (?, ?, ?)", [row.id, sha256(code), new Date(Date.now() + resetMinutes * 60_000)]);
      await mailer.send(
        email,
        "Your Pratyangi Fashions password reset code",
        `Your code is ${code}. It works for ${resetMinutes} minutes.\n\nIf you did not ask to reset your password, you can ignore this email.`,
      );
    },

    /** Checks the code and sets the new password. Every session of that customer ends, so they sign in again. */
    async resetPassword(input: { email: string; code: string; password: string }): Promise<void> {
      const invalid = () => new HttpError(400, "That code is not correct or has expired. Please request a new one.", "code");
      const row = await byEmail(input.email);
      if (!row) throw invalid();
      const [rows] = await db.execute("SELECT id, code_hash, attempts FROM shop_password_resets WHERE customer_id = ? AND expires_at > ? ORDER BY id DESC LIMIT 1", [row.id, new Date()]);
      const reset = (rows as { id: number; code_hash: string; attempts: number }[])[0];
      if (!reset) throw invalid();
      if (reset.attempts >= maxResetAttempts) {
        await db.execute("DELETE FROM shop_password_resets WHERE id = ?", [reset.id]);
        throw badRequest("Too many wrong codes. Please request a new one.", "code");
      }
      if (!safeEqualHex(reset.code_hash, sha256(input.code))) {
        await db.execute("UPDATE shop_password_resets SET attempts = attempts + 1 WHERE id = ?", [reset.id]);
        throw new HttpError(400, "That code is not correct. Please check it and try again.", "code");
      }
      const passwordHash = await hashPassword(input.password);
      await inTransaction(db, async (connection) => {
        await connection.execute("UPDATE shop_customers SET password_hash = ?, email_verified = 1 WHERE id = ?", [passwordHash, row.id]);
        await connection.execute("DELETE FROM shop_password_resets WHERE customer_id = ?", [row.id]);
        await connection.execute("DELETE FROM shop_sessions WHERE customer_id = ?", [row.id]);
      });
    },
  };
}
