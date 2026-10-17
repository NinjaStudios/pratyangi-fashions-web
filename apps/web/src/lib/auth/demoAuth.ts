import { AuthError, type AuthClient, type AuthUser } from "./types";
import { isEmail, normaliseIdentifier } from "./validation";

/**
 * DEMO accounts used until the real API exists (set NEXT_PUBLIC_API_URL to switch to it, see ./index.ts).
 * No SMS or email is sent: every code is the one below, and the pages say so. Accounts live only in this browser's storage.
 * Passwords are salted and hashed with SHA-256 so no plain password is saved, but this is a stand-in for local review, not real
 * security. The real server hashes with Argon2 or bcrypt, makes a random code per request, limits attempts and expires codes.
 */
export const demoCode = "123456";

const usersKey = "pratyangi-demo-users";
const sessionKey = "pratyangi-demo-session";

type StoredUser = { id: string; name: string; email: string; phone: string; salt: string; hash: string };

const readUsers = (): StoredUser[] => {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(usersKey) ?? "[]");
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
  } catch {
    return [];
  }
};
const writeUsers = (users: StoredUser[]) => window.localStorage.setItem(usersKey, JSON.stringify(users));

const toHex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
const randomSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
async function hash(password: string, salt: string) {
  if (!window.crypto?.subtle) throw new AuthError("Sign-in needs a secure connection (https) in this browser.");
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${password}`)));
}

const publicUser = (user: StoredUser): AuthUser => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, provider: "password" });
const startSession = (user: AuthUser) => {
  window.localStorage.setItem(sessionKey, JSON.stringify(user));
  return user;
};
const findByIdentifier = (identifier: string) => {
  const wanted = normaliseIdentifier(identifier);
  return readUsers().find((user) => (isEmail(identifier) ? user.email === wanted : user.phone === wanted));
};

// signups and resets waiting for their codes; lost on reload, like a real server's short expiry
const pendingSignups = new Map<string, { name: string; email: string; phone: string; password: string }>();
const pendingResets = new Map<string, string>();
const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const expired = () => new AuthError("This has expired. Please start again.");

const maskEmail = (email: string) => {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}${"*".repeat(Math.max(2, local.length - 1))}@${domain}`;
};
const maskPhone = (phone: string) => `+91 ${"*".repeat(Math.max(0, phone.length - 3))}${phone.slice(-3)}`;

/** Reads the (unverified) claims of a Google ID token. Demo only: the real API verifies the token with Google. */
function decodeGoogleCredential(credential: string): { name?: string; email?: string; picture?: string; sub?: string } {
  try {
    const payload = credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new AuthError("Google sign-in did not return a valid response. Please try again.");
  }
}

export const demoAuth: AuthClient = {
  async signIn(identifier, password) {
    const user = findByIdentifier(identifier);
    // the same message for "no such account" and "wrong password", so the form never reveals who has an account
    const wrong = new AuthError("The email or mobile number, or the password, is incorrect.");
    if (!user) throw wrong;
    if ((await hash(password, user.salt)) !== user.hash) throw wrong;
    return startSession(publicUser(user));
  },

  async startSignup(input) {
    const email = input.email.trim().toLowerCase();
    const users = readUsers();
    if (users.some((user) => user.email === email)) throw new AuthError("An account with this email already exists. Try signing in.", "email");
    if (users.some((user) => user.phone === input.phone)) throw new AuthError("An account with this mobile number already exists. Try signing in.", "phone");
    const signupId = newId("signup");
    pendingSignups.set(signupId, { name: input.name.trim(), email, phone: input.phone, password: input.password });
    return { signupId };
  },

  async resendSignupCode(signupId) {
    if (!pendingSignups.has(signupId)) throw expired();
  },

  async verifySignup({ signupId, phoneCode, emailCode }) {
    const pending = pendingSignups.get(signupId);
    if (!pending) throw expired();
    if (phoneCode !== demoCode) throw new AuthError("That mobile code is not correct. Please check it and try again.", "phoneCode");
    if (emailCode !== demoCode) throw new AuthError("That email code is not correct. Please check it and try again.", "emailCode");
    const salt = randomSalt();
    const user: StoredUser = { id: newId("demo"), name: pending.name, email: pending.email, phone: pending.phone, salt, hash: await hash(pending.password, salt) };
    writeUsers([...readUsers(), user]);
    pendingSignups.delete(signupId);
    return startSession(publicUser(user));
  },

  async sendLoginCode(phone) {
    if (!readUsers().some((user) => user.phone === phone)) {
      throw new AuthError("We could not find an account with this mobile number. Create an account first.", "phone");
    }
  },

  async verifyLoginCode(phone, code) {
    const user = readUsers().find((candidate) => candidate.phone === phone);
    if (!user || code !== demoCode) throw new AuthError("That code is not correct. Please check it and try again.", "code");
    return startSession(publicUser(user));
  },

  async startPasswordReset(identifier) {
    const resetId = newId("reset");
    pendingResets.set(resetId, identifier);
    // the answer is the same whether or not the account exists
    const wanted = normaliseIdentifier(identifier);
    return { resetId, sentTo: isEmail(identifier) ? maskEmail(wanted) : maskPhone(wanted) };
  },

  async finishPasswordReset({ resetId, code, password }) {
    const identifier = pendingResets.get(resetId);
    const user = identifier ? findByIdentifier(identifier) : undefined;
    if (!user || code !== demoCode) throw new AuthError("That code is not correct. Please check it and try again.", "code");
    const salt = randomSalt();
    const hashed = await hash(password, salt);
    writeUsers(readUsers().map((stored) => (stored.id === user.id ? { ...stored, salt, hash: hashed } : stored)));
    pendingResets.delete(resetId);
  },

  async signInWithGoogle(credential) {
    const claims = decodeGoogleCredential(credential);
    if (!claims.email) throw new AuthError("Google did not share an email address, so we cannot sign you in.");
    return startSession({ id: `google-${claims.sub ?? claims.email}`, name: claims.name ?? claims.email, email: claims.email, provider: "google", picture: claims.picture });
  },

  async signOut() {
    window.localStorage.removeItem(sessionKey);
  },

  async current() {
    try {
      const saved = window.localStorage.getItem(sessionKey);
      return saved ? (JSON.parse(saved) as AuthUser) : null;
    } catch {
      return null;
    }
  },
};
