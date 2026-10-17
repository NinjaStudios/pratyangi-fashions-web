import { hash, verify } from "@node-rs/argon2";

/** Argon2id with the library defaults (memory-hard, salted per password). Plain passwords are never stored or logged. */
export const hashPassword = (password: string) => hash(password);

export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  try {
    return await verify(storedHash, password);
  } catch {
    return false;
  }
}

// A real hash of a throwaway password. When an email is unknown we still verify against it, so "no such account" and
// "wrong password" take the same time and the response time does not reveal which emails exist.
let decoy: Promise<string> | undefined;
export const verifyAgainstDecoy = async (password: string) => {
  decoy ??= hashPassword("decoy-password-for-timing-only");
  await verifyPassword(await decoy, password);
};
