import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** A random session token for the cookie (256 bits). Only `sha256(token)` is stored in the database. */
export const newSessionToken = () => randomBytes(32).toString("base64url");

/** A six-digit code from a secure random source. */
export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
