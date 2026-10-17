"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthError, authClient, authMode, notConnectedMessage, setSessionUser, useSession } from "@/lib/auth";
import styles from "@/components/auth/Auth.module.css";

type State =
  | { kind: "checking" }
  | { kind: "verified"; name: string }
  | { kind: "failed"; message: string }
  | { kind: "missing" };

/**
 * The page the emailed link opens. Shows one of four outcomes: checking, verified, the link did not work (invalid, expired or
 * already used), or no link at all. The token is read from the address bar in the browser, because the site is exported as static files.
 */
export function VerifyEmailView() {
  const session = useSession();
  const [state, setState] = useState<State>({ kind: "checking" });
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // React runs effects twice in development; a link may only be used once
    started.current = true;
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState({ kind: "missing" });
      return;
    }
    authClient
      .verifyEmail(token)
      .then((customer) => {
        // if this browser is signed in as the same customer, its account page stops asking for verification
        authClient.current().then((signedIn) => signedIn && signedIn.id === customer.id && setSessionUser(signedIn));
        setState({ kind: "verified", name: customer.name.split(" ")[0] ?? "" });
      })
      .catch((error: unknown) => setState({ kind: "failed", message: error instanceof AuthError ? error.message : "Something went wrong. Please try again." }));
  }, []);

  const resend = async () => {
    setResending(true);
    setResendMessage("");
    try {
      setResendMessage(await authClient.resendVerification());
    } catch (error) {
      setResendMessage(error instanceof AuthError ? error.message : "Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell>
      {authMode === "off" && <p className={styles.notice} role="status">{notConnectedMessage}</p>}

      {state.kind === "checking" && (
        <div className={styles.success} role="status" aria-live="polite">
          <span className={styles.spinner} style={{ borderColor: "rgba(183, 112, 1, 0.3)", borderTopColor: "#b77001", width: 32, height: 32 }} aria-hidden="true" />
          <h1 className={styles.title}>Checking your link…</h1>
        </div>
      )}

      {state.kind === "verified" && (
        <div className={styles.success} role="status">
          <CircleCheck size={48} aria-hidden="true" />
          <h1 className={styles.title}>Email verified</h1>
          <p>Thank you{state.name ? `, ${state.name}` : ""}. Your email address is confirmed.</p>
          <Link className={styles.submit} href={session.user ? "/account" : "/login"}>{session.user ? "Go to my account" : "Sign In"}</Link>
        </div>
      )}

      {state.kind === "failed" && (
        <div className={styles.success}>
          <CircleAlert size={48} aria-hidden="true" style={{ color: "#a1112f" }} />
          <h1 className={styles.title}>This link did not work</h1>
          <p role="alert">{state.message}</p>
          {session.user ? (
            <>
              <button type="button" className={styles.submit} onClick={resend} disabled={resending}>
                {resending ? <><span className={styles.spinner} aria-hidden="true" />Sending…</> : "Send me a new link"}
              </button>
              {resendMessage && <p role="status">{resendMessage}</p>}
            </>
          ) : (
            <Link className={styles.submit} href="/login?next=/account">Sign in to request a new link</Link>
          )}
        </div>
      )}

      {state.kind === "missing" && (
        <div className={styles.success}>
          <MailCheck size={48} aria-hidden="true" style={{ color: "#b77001" }} />
          <h1 className={styles.title}>Open the link from your email</h1>
          <p>This page confirms your email address. Use the link in the message we emailed you.</p>
          <Link className={styles.submit} href={session.user ? "/account" : "/login"}>{session.user ? "Go to my account" : "Sign In"}</Link>
        </div>
      )}
    </AuthShell>
  );
}
