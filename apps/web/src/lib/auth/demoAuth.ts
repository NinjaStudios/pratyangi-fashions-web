import { AuthError, type AuthClient, type AuthUser } from "./types";

/**
 * DEMO sign-in used until the real API exists (set NEXT_PUBLIC_API_URL to switch to it, see ./index.ts).
 * No SMS is sent: every number accepts the code below, and the pages say so. Accounts live only in this browser's storage.
 * The real server generates a random code per request, sends it by SMS, limits attempts and expires it after a few minutes.
 */
export const demoOtpCode = "123456";

const usersKey = "pratyangi-demo-users";
const sessionKey = "pratyangi-demo-session";

type StoredUser = { id: string; name: string; phone: string };

const readUsers = (): StoredUser[] => {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(usersKey) ?? "[]");
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
  } catch {
    return [];
  }
};

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
  async sendOtp(phone) {
    return { isNew: !readUsers().some((user) => user.phone === phone) };
  },

  async verifyOtp({ phone, code, name }) {
    if (code !== demoOtpCode) throw new AuthError("That code is not correct. Please check it and try again.", "code");
    const users = readUsers();
    let user = users.find((candidate) => candidate.phone === phone);
    if (!user) {
      if (!name?.trim()) throw new AuthError("Enter your full name to create your account", "name");
      user = { id: `demo-${Date.now()}`, name: name.trim(), phone };
      window.localStorage.setItem(usersKey, JSON.stringify([...users, user]));
    }
    return startSession({ id: user.id, name: user.name, phone: user.phone, provider: "phone" });
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
