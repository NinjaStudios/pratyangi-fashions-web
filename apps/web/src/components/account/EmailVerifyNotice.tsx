"use client";

import { useState } from "react";
import { MailWarning } from "lucide-react";
import { AuthError, authClient, useSession } from "@/lib/auth";
import styles from "./EmailVerifyNotice.module.css";

/** Shown on the account page while the signed-in customer's email is not verified yet, with a button to send a new link. */
export function EmailVerifyNotice() {
  const { user } = useSession();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  if (!user || user.emailVerified) return null;

  const resend = async () => {
    setBusy(true);
    setMessage("");
    try {
      setMessage(await authClient.resendVerification());
    } catch (error) {
      setMessage(error instanceof AuthError ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.notice} role="region" aria-label="Email verification">
      <MailWarning size={22} aria-hidden="true" />
      <div>
        <p><strong>Please confirm your email address.</strong> We sent a link to {user.email}. Open it to finish setting up your account.</p>
        <button type="button" onClick={resend} disabled={busy}>{busy ? "Sending…" : "Send a new link"}</button>
        {message && <p className={styles.result} role="status">{message}</p>}
      </div>
    </div>
  );
}
