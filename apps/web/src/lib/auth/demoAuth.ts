import { AuthError, type AuthClient, type AuthUser } from "./types";

/**
 * DEMO accounts, for local review only. They are switched on by NEXT_PUBLIC_AUTH_DEMO=true and are NOT real authentication:
 * everything lives in this browser's storage, no email is sent, and every reset code is the one below. Without that setting
 * (and without NEXT_PUBLIC_API_URL) the site offers no sign-in at all rather than pretending, see ./index.ts.
 * Passwords are salted and hashed with SHA-256 so no plain password is saved; the real server uses Argon2.
 */
export const demoCode = "123456";

const usersKey = "pratyangi-demo-users";
const sessionKey = "pratyangi-demo-session";

type StoredUser = { id: string; name: string; email: string; salt: string; hash: string };

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

// the demo pretends nothing about email: every demo account counts as verified so no banner appears
const publicUser = (user: StoredUser): AuthUser => ({ id: user.id, name: user.name, email: user.email, provider: "password", emailVerified: true });
const startSession = (user: AuthUser) => {
  window.localStorage.setItem(sessionKey, JSON.stringify(user));
  return user;
};
const findByEmail = (email: string) => readUsers().find((user) => user.email === email.trim().toLowerCase());

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
  async signIn(email, password) {
    const user = findByEmail(email);
    // the same message for "no such account" and "wrong password", so the form never reveals who has an account
    const wrong = new AuthError("The email or password is incorrect.");
    if (!user) throw wrong;
    if ((await hash(password, user.salt)) !== user.hash) throw wrong;
    return startSession(publicUser(user));
  },

  async signUp({ name, email, password }) {
    const address = email.trim().toLowerCase();
    if (findByEmail(address)) throw new AuthError("An account with this email already exists. Please sign in instead.", "email");
    const salt = randomSalt();
    const user: StoredUser = { id: `demo-${Date.now()}`, name: name.trim(), email: address, salt, hash: await hash(password, salt) };
    writeUsers([...readUsers(), user]);
    return startSession(publicUser(user));
  },

  async signInWithGoogle(credential) {
    const claims = decodeGoogleCredential(credential);
    if (!claims.email) throw new AuthError("Google did not share an email address, so we cannot sign you in.");
    return startSession({ id: `google-${claims.sub ?? claims.email}`, name: claims.name ?? claims.email, email: claims.email, provider: "google", emailVerified: true, picture: claims.picture });
  },

  async startPasswordReset() {
    // nothing is sent; the page tells the reviewer the code to use
  },

  async finishPasswordReset({ email, code, password }) {
    const user = findByEmail(email);
    if (!user || code !== demoCode) throw new AuthError("That code is not correct. Please check it and try again.", "code");
    const salt = randomSalt();
    const hashed = await hash(password, salt);
    writeUsers(readUsers().map((stored) => (stored.id === user.id ? { ...stored, salt, hash: hashed } : stored)));
  },

  async verifyEmail(token) {
    // review only: the link `/verify-email?token=demo-valid-token-0123456789` shows the success screen, anything else the failure one
    if (token !== "demo-valid-token-0123456789") throw new AuthError("This verification link is invalid, has expired or was already used. If your email is not verified yet, sign in and request a new link.", "token");
    const saved = window.localStorage.getItem(sessionKey);
    return saved ? (JSON.parse(saved) as AuthUser) : { id: "demo", name: "Demo", email: "demo@example.com", provider: "password", emailVerified: true };
  },

  async resendVerification() {
    return "Your email is already verified.";
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
