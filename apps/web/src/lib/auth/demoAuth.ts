import { AuthError, type AuthClient, type AuthUser, type SignUpInput } from "./types";

/**
 * DEMO sign-in used until the real API exists (set NEXT_PUBLIC_API_URL to switch to it, see ./index.ts).
 * Accounts live only in this browser's storage. Passwords are salted and hashed with SHA-256 so no plain password is
 * saved, but this is a stand-in for local review, not real security: a real server must hash with Argon2 or bcrypt.
 */
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

const publicUser = (user: StoredUser): AuthUser => ({ id: user.id, name: user.name, email: user.email, provider: "password" });
const startSession = (user: AuthUser) => {
  window.localStorage.setItem(sessionKey, JSON.stringify(user));
  return user;
};

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
    const user = readUsers().find((candidate) => candidate.email === email.trim().toLowerCase());
    // the same message for "no such email" and "wrong password", so the form never reveals which emails exist
    const wrong = new AuthError("The email or password is incorrect.");
    if (!user) throw wrong;
    if ((await hash(password, user.salt)) !== user.hash) throw wrong;
    return startSession(publicUser(user));
  },

  async signUp(input: SignUpInput) {
    const email = input.email.trim().toLowerCase();
    const users = readUsers();
    if (users.some((candidate) => candidate.email === email)) {
      throw new AuthError("An account with this email already exists. Try signing in.", "email");
    }
    const salt = randomSalt();
    const user: StoredUser = { id: `demo-${Date.now()}`, name: input.name.trim(), email, phone: input.phone, salt, hash: await hash(input.password, salt) };
    writeUsers([...users, user]);
    return startSession(publicUser(user));
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
