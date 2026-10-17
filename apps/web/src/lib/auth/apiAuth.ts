import { AuthError, type AuthClient, type AuthUser, type ResetStarted, type SignupStarted } from "./types";

/**
 * The real account system: talks to the store's API (apps/api, planned; contract in docs/BACKEND_PLAN.md).
 * The server keeps the session in an httpOnly cookie, so no token is ever stored by this code.
 */
export function createApiAuth(baseUrl: string): AuthClient {
  async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: init?.method ?? "GET",
        credentials: "include",
        headers: init?.body ? { "Content-Type": "application/json" } : undefined,
        body: init?.body ? JSON.stringify(init.body) : undefined,
      });
    } catch {
      throw new AuthError("We could not reach the server. Check your connection and try again.");
    }
    const data = (await response.json().catch(() => ({}))) as { message?: string; field?: AuthError["field"] } & T;
    if (!response.ok) throw new AuthError(data.message ?? "Something went wrong. Please try again.", data.field);
    return data;
  }
  const user = (data: { user: AuthUser }) => data.user;

  return {
    signIn: async (identifier, password) => user(await call("/auth/login", { method: "POST", body: { identifier, password } })),
    startSignup: (input) => call<SignupStarted>("/auth/signup/start", { method: "POST", body: input }),
    resendSignupCode: async (signupId, channel) => {
      await call("/auth/signup/resend", { method: "POST", body: { signupId, channel } });
    },
    verifySignup: async (input) => user(await call("/auth/signup/verify", { method: "POST", body: input })),
    sendLoginCode: async (phone) => {
      await call("/auth/otp/send", { method: "POST", body: { phone } });
    },
    verifyLoginCode: async (phone, code) => user(await call("/auth/otp/verify", { method: "POST", body: { phone, code } })),
    startPasswordReset: (identifier) => call<ResetStarted>("/auth/password/forgot", { method: "POST", body: { identifier } }),
    finishPasswordReset: async (input) => {
      await call("/auth/password/reset", { method: "POST", body: input });
    },
    signInWithGoogle: async (credential) => user(await call("/auth/google", { method: "POST", body: { credential } })),
    signOut: async () => {
      await call("/auth/logout", { method: "POST" });
    },
    current: async () => {
      try {
        return user(await call("/auth/me"));
      } catch {
        return null;
      }
    },
  };
}
