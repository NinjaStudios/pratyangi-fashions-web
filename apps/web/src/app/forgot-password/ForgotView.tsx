"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { CircleCheck, KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpField, PasswordField, PasswordStrength, TextField } from "@/components/auth/Fields";
import { describeError, useAuthFlow, useCountdown } from "@/components/auth/useAuthFlow";
import {
  authClient, authMode, normaliseIdentifier, otpLength, validateIdentifier, validateOtp, validatePassword, type ResetStarted,
} from "@/lib/auth";
import { demoCode } from "@/lib/auth/demoAuth";
import styles from "@/components/auth/Auth.module.css";

type Errors = Partial<Record<"identifier" | "code" | "password" | "confirm", string>>;

/**
 * Reset a forgotten password without leaving the page: say which account, type the code that arrives by email or SMS,
 * choose a new password. Whether or not the account exists the page behaves the same, so nobody can use it to look
 * up who has an account.
 */
export function ForgotView() {
  const { query } = useAuthFlow();
  const [step, setStep] = useState<"identify" | "reset" | "done">("identify");
  const [identifier, setIdentifier] = useState("");
  const [started, setStarted] = useState<ResetStarted | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, startCountdown] = useCountdown();

  const run = async (task: () => Promise<void>) => {
    setFormError("");
    setBusy(true);
    try {
      await task();
    } catch (error) {
      const { field, message } = describeError(error);
      if (field === "code" || field === "password" || field === "identifier") setErrors({ [field]: message });
      else setFormError(message);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = (event?: FormEvent) => {
    event?.preventDefault();
    const problem = validateIdentifier(identifier);
    setErrors({ identifier: problem || undefined });
    if (problem) return;
    void run(async () => {
      const result = await authClient.startPasswordReset(normaliseIdentifier(identifier));
      setStarted(result);
      setCode("");
      setStep("reset");
      startCountdown(30);
      setNotice(authMode === "demo" ? `Demo mode: nothing is sent. Use the code ${demoCode}.` : "");
    });
  };

  const reset = (event: FormEvent) => {
    event.preventDefault();
    const found: Errors = {
      code: validateOtp(code) || undefined,
      password: validatePassword(password) || undefined,
      confirm: !confirm ? "Re-enter your new password" : confirm !== password ? "The two passwords do not match" : undefined,
    };
    setErrors(found);
    if (Object.values(found).some(Boolean) || !started) return;
    void run(async () => {
      await authClient.finishPasswordReset({ resetId: started.resetId, code, password });
      setStep("done");
    });
  };

  return (
    <AuthShell>
      {step === "done" ? (
        <div className={styles.success} role="status">
          <CircleCheck size={48} aria-hidden="true" />
          <h2>Password updated</h2>
          <p>You can now sign in with your new password.</p>
          <Link className={styles.submit} href={`/login${query}`}>Sign In</Link>
        </div>
      ) : step === "identify" ? (
        <>
          <span className={styles.badge} aria-hidden="true"><KeyRound size={26} /></span>
          <h1 className={styles.title}>Forgot your password?</h1>
          <p className={styles.lead}>Enter the email or mobile number on your account and we will send you a code to set a new one.</p>

          <form className={styles.form} onSubmit={sendCode} noValidate>
            {formError && <p className={styles.alert} role="alert">{formError}</p>}
            <TextField
              label="Email or mobile number"
              value={identifier}
              onChange={(event) => { setIdentifier(event.target.value); setErrors({}); }}
              placeholder="you@example.com or 98765 43210"
              autoComplete="username"
              error={errors.identifier}
              required
            />
            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? <><span className={styles.spinner} aria-hidden="true" />Sending code…</> : "Send code"}
            </button>
          </form>
          <p className={styles.switch}><Link href={`/login${query}`}>Back to sign in</Link></p>
        </>
      ) : (
        <>
          <span className={styles.badge} aria-hidden="true"><KeyRound size={26} /></span>
          <h1 className={styles.title}>Set a new password</h1>
          <p className={styles.lead}>
            If an account matches, we sent a {otpLength}-digit code to {started?.sentTo}.{" "}
            <button type="button" className={styles.inlineLink} onClick={() => { setStep("identify"); setErrors({}); setNotice(""); }}>Change</button>
          </p>

          <form className={styles.form} onSubmit={reset} noValidate>
            {formError && <p className={styles.alert} role="alert">{formError}</p>}
            {notice && <p className={styles.notice} role="status">{notice}</p>}
            <div>
              <OtpField label="Code" value={code} length={otpLength} onChange={(value) => { setCode(value); setErrors((current) => ({ ...current, code: undefined })); }} error={errors.code} autoFocus />
              <p className={styles.resend}>
                <button type="button" className={styles.inlineLink} disabled={resendIn > 0 || busy} onClick={() => sendCode()}>
                  {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                </button>
              </p>
            </div>
            <div>
              <PasswordField label="New password" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })); }} placeholder="Create a new password" autoComplete="new-password" error={errors.password} required />
              <PasswordStrength value={password} />
            </div>
            <PasswordField label="Confirm new password" value={confirm} onChange={(event) => { setConfirm(event.target.value); setErrors((current) => ({ ...current, confirm: undefined })); }} placeholder="Re-enter your new password" autoComplete="new-password" error={errors.confirm} required />
            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? <><span className={styles.spinner} aria-hidden="true" />Updating…</> : "Reset Password"}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
