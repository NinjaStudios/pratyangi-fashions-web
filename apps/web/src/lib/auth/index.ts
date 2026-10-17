"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createApiAuth } from "./apiAuth";
import { demoAuth } from "./demoAuth";
import { AuthError, type AuthClient, type AuthUser } from "./types";

export * from "./types";
export * from "./validation";

/**
 * Which account system the site talks to:
 *  - "api":  the store API at NEXT_PUBLIC_API_URL (the real thing)
 *  - "demo": the in-browser stand-in, ONLY when NEXT_PUBLIC_AUTH_DEMO=true (local review, tests). Not real authentication.
 *  - "off":  neither is set. Nothing pretends to work: the forms explain that accounts are not connected yet.
 */
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
export const authMode: "api" | "demo" | "off" = apiBaseUrl ? "api" : process.env.NEXT_PUBLIC_AUTH_DEMO === "true" ? "demo" : "off";

export const notConnectedMessage = "Accounts are not connected yet: the store server has not been set up, so signing in is not available right now.";
const notConnected = (): never => {
  throw new AuthError(notConnectedMessage);
};
const offAuth: AuthClient = {
  signIn: async () => notConnected(),
  signUp: async () => notConnected(),
  signInWithGoogle: async () => notConnected(),
  startPasswordReset: async () => notConnected(),
  finishPasswordReset: async () => notConnected(),
  signOut: async () => undefined,
  current: async () => null,
};

export const authClient: AuthClient = authMode === "api" ? createApiAuth(apiBaseUrl) : authMode === "demo" ? demoAuth : offAuth;
export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

// ---- the signed-in user, shared by the header, the account pages and the forms -----------------------------------------
// undefined = not known yet (first paint), null = signed out. The server render always sees "not known yet".
let current: AuthUser | null | undefined;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Call after a successful sign-in, sign-up or sign-out. */
export function setSessionUser(user: AuthUser | null) {
  current = user;
  loaded = true;
  emit();
}

/** The signed-in user (or null), plus `ready` once we have asked who is signed in. */
export function useSession() {
  const user = useSyncExternalStore(subscribe, () => current, () => undefined);
  useEffect(() => {
    if (loaded) return;
    loaded = true;
    authClient.current().then((found) => {
      current = found;
      emit();
    });
  }, []);
  return { user: user ?? null, ready: user !== undefined };
}

export async function signOutUser() {
  await authClient.signOut();
  setSessionUser(null);
}
