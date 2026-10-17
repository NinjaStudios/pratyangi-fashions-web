"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createApiAuth } from "./apiAuth";
import { demoAuth } from "./demoAuth";
import type { AuthClient, AuthUser } from "./types";

export * from "./types";
export * from "./validation";

/** Real API when NEXT_PUBLIC_API_URL is set (see .env.example), otherwise the in-browser demo. */
const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
export const authClient: AuthClient = apiUrl ? createApiAuth(apiUrl) : demoAuth;
export const authMode: "api" | "demo" = apiUrl ? "api" : "demo";
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
