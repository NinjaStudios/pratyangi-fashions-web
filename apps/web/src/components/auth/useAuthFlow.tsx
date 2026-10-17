"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { AuthError, safeNext, setSessionUser, type AuthUser } from "@/lib/auth";
import styles from "./Auth.module.css";

/** What the sign-in, sign-up and reset pages have in common: where to go afterwards, and the "Welcome" moment. */
export function useAuthFlow() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [fromCheckout, setFromCheckout] = useState(false);
  const [welcome, setWelcome] = useState<{ user: AuthUser; created: boolean } | null>(null);

  useEffect(() => {
    setFromCheckout(new URLSearchParams(window.location.search).get("next") === "/checkout");
    return () => clearTimeout(timer.current);
  }, []);

  /** Signs the customer in on this site, shows the welcome, then goes to `?next=` (same-site only) or the account. */
  const finish = useCallback((user: AuthUser, created = false) => {
    setSessionUser(user);
    setWelcome({ user, created });
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    timer.current = setTimeout(() => router.push(next), 1200);
  }, [router]);

  return { fromCheckout, welcome, finish, query: fromCheckout ? "?next=/checkout" : "" };
}

export function Welcome({ user, created }: { user: AuthUser; created: boolean }) {
  return (
    <div className={styles.success} role="status">
      <CircleCheck size={48} aria-hidden="true" />
      <h2>{created ? "Welcome" : "Welcome back"}, {user.name.split(" ")[0]}!</h2>
      <p>{created ? "Your account is ready. Taking you there…" : "Taking you there…"}</p>
    </div>
  );
}

/** What a failed call tells the form: a message for the whole form, and the messages for single inputs when the server named them. */
export function describeError(error: unknown): { message: string; field?: NonNullable<AuthError["field"]>; errors: NonNullable<AuthError["errors"]> } {
  if (!(error instanceof AuthError)) return { message: "Something went wrong. Please try again.", errors: {} };
  const errors = { ...(error.errors ?? {}), ...(error.field ? { [error.field]: error.errors?.[error.field] ?? error.message } : {}) };
  return { message: error.message, field: error.field, errors };
}

/** Counts down from `from` once a second; `start()` restarts it. Used for "Resend OTP in 29s". */
export function useCountdown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const tick = setTimeout(() => setLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(tick);
  }, [left]);
  return [left, (seconds: number) => setLeft(seconds)] as const;
}
