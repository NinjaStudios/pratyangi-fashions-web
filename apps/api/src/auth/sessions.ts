import type { Db } from "../db.js";
import { newSessionToken, sha256 } from "../security/tokens.js";

export type PublicCustomer = {
  id: string;
  name: string;
  email: string;
  provider: "password" | "google";
  picture?: string;
};

export type CustomerRow = { id: number | string; name: string; email: string; password_hash: string | null; picture_url: string | null };

/** `provider` is "google" for an account that has no password (it was created with Google), otherwise "password". */
export const toPublicCustomer = (row: CustomerRow): PublicCustomer => ({
  id: String(row.id),
  name: row.name,
  email: row.email,
  provider: row.password_hash ? "password" : "google",
  ...(row.picture_url ? { picture: row.picture_url } : {}),
});

const day = 24 * 60 * 60 * 1000;

export const cookieName = "pf_session";

export type SessionStore = ReturnType<typeof createSessionStore>;

export function createSessionStore(db: Db, sessionDays: number) {
  return {
    /** Starts a session for the customer and returns the token to put in the cookie. */
    async create(customerId: string, userAgent: string | undefined) {
      const token = newSessionToken();
      const expiresAt = new Date(Date.now() + sessionDays * day);
      await db.execute("INSERT INTO shop_sessions (customer_id, token_hash, expires_at, user_agent) VALUES (?, ?, ?, ?)", [
        customerId,
        sha256(token),
        expiresAt,
        userAgent?.slice(0, 255) ?? null,
      ]);
      return { token, expiresAt };
    },

    /** The customer a cookie token belongs to, or null when it is unknown or expired. */
    async find(token: string): Promise<{ customer: CustomerRow; sessionId: string } | null> {
      const [rows] = await db.execute(
        `SELECT s.id AS session_id, c.id, c.name, c.email, c.password_hash, c.picture_url
           FROM shop_sessions s JOIN shop_customers c ON c.id = s.customer_id
          WHERE s.token_hash = ? AND s.expires_at > ?`,
        [sha256(token), new Date()],
      );
      const row = (rows as (CustomerRow & { session_id: number | string })[])[0];
      return row ? { customer: row, sessionId: String(row.session_id) } : null;
    },

    async destroy(token: string) {
      await db.execute("DELETE FROM shop_sessions WHERE token_hash = ?", [sha256(token)]);
    },

    /** Ends every session of a customer, e.g. after a password change. */
    async destroyAll(customerId: string) {
      await db.execute("DELETE FROM shop_sessions WHERE customer_id = ?", [customerId]);
    },

    /** Housekeeping: removes sessions that have already expired. */
    async purgeExpired() {
      await db.execute("DELETE FROM shop_sessions WHERE expires_at <= ?", [new Date()]);
    },
  };
}
