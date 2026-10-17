"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { CircleCheck, KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpField, PasswordField, PasswordStrength, TextField } from "@/components/auth/Fields";
import { describeError, useAuthFlow, useCountdown } from "@/components/auth/useAuthFlow";
import { authClient, authMode, notConnectedMessage, otpLength, validateCode, validateConfirm, validateEmail, validatePassword } from "@/lib/auth";
import { demoCode } from "@/lib/auth/demoAuth";
import styles from "@/components/auth/Auth.module.css";

type Errors = Partial<Record<"email" | "code" | "password" | "confirm", string>>;

/**
 * Reset a forgotten password without leaving the page: give the email, type the 6-digit code that is emailed, choose a new
 * password. The page behaves the same whether or not the email has an account, so it cannot be used to look up who does.
 */
export function ForgotView() {
  const { query } = useAuthFlow();
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
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
      const { message, errors: fieldErrors } = describeError(error);
      setErrors({ email: fieldErrors.email, code: fieldErrors.code, password: fieldErrors.password });
      if (!fieldErrors.email && !fieldErrors.code && !fieldErrors.password) setFormError(message);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = (event?: FormEvent) => {
    event?.preventDefault();
    const problem = validateEmail(email);
    setErrors({ email: problem || undefined });
    if (problem) return;
    void run(async () => {
      await authClient.startPasswordReset(email.trim().toLowerCase());
      setCode("");
      setStep("reset");
      startCountdown(30);
      setNotice(authMode === "demo" ? `Demo mode: nothing is emailed. Use the code ${demoCode}.` : "");
    });
  };

  const reset = (event: FormEvent) => {
    event.preventDefault();
    const found: Errors = {
      code: validateCode(code) || undefined,
      password: validatePassword(password) || undefined,
      confirm: validateConfirm(password, confirm) || undefined,
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    void run(async () => {
      await authClient.finishPasswordReset({ email: email.trim().toLowerCase(), code, password });
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
      ) : step === "email" ? (
        <>
          <span className={styles.badge} aria-hidden="true"><KeyRound size={26} /></span>
          <h1 className={styles.title}>Forgot your password?</h1>
          <p className={styles.lead}>Enter the email on your account and we will send you a code to set a new password.</p>

          {authMode === "off" && <p className={styles.notice} role="status">{notConnectedMessage}</p>}

          <form className={styles.form} onSubmit={sendCode} noValidate>
            {formError && <p className={styles.alert} role="alert">{formError}</p>}
            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setErrors({}); }}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              error={errors.email}
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
            If an account matches, we emailed a {otpLength}-digit code to {email.trim().toLowerCase()}.{" "}
            <button type="button" className={styles.inlineLink} onClick={() => { setStep("email"); setErrors({}); setNotice(""); setFormError(""); }}>Change</button>
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
