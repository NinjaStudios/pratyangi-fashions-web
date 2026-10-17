"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpField, PasswordField, TextField } from "@/components/auth/Fields";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Welcome, describeError, useAuthFlow, useCountdown } from "@/components/auth/useAuthFlow";
import {
  authClient, authMode, formatPhone, googleClientId, normaliseIdentifier, normalisePhone, otpLength,
  validateIdentifier, validateOtp, validatePhone,
} from "@/lib/auth";
import { demoCode } from "@/lib/auth/demoAuth";
import styles from "@/components/auth/Auth.module.css";

type Errors = Partial<Record<"identifier" | "password" | "phone" | "code", string>>;

/**
 * Sign in. The usual way is email or mobile number plus password. "Sign in with a mobile code" is there for people who
 * would rather not type a password: it texts a code, and is never forced on anyone.
 */
export function LoginView() {
  const { fromCheckout, welcome, finish, query } = useAuthFlow();
  const [method, setMethod] = useState<"password" | "code">("password");
  const [codeSent, setCodeSent] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, startCountdown] = useCountdown();

  const fail = (error: unknown) => {
    const { field, message } = describeError(error);
    if (field === "phone" || field === "code" || field === "identifier" || field === "password") setErrors({ [field]: message });
    else setFormError(message);
  };
  const run = async (task: () => Promise<void>) => {
    setFormError("");
    setNotice("");
    setBusy(true);
    try {
      await task();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };
  const switchTo = (next: "password" | "code") => {
    setMethod(next);
    setCodeSent(false);
    setErrors({});
    setFormError("");
    setNotice("");
  };

  const signInWithPassword = (event: FormEvent) => {
    event.preventDefault();
    const found = { identifier: validateIdentifier(identifier) || undefined, password: password ? undefined : "Enter your password" };
    setErrors(found);
    if (found.identifier || found.password) return;
    void run(async () => finish(await authClient.signIn(normaliseIdentifier(identifier), password)));
  };

  const sendCode = (event?: FormEvent) => {
    event?.preventDefault();
    const problem = validatePhone(phone);
    setErrors({ phone: problem || undefined });
    if (problem) return;
    void run(async () => {
      await authClient.sendLoginCode(normalisePhone(phone));
      setCode("");
      setCodeSent(true);
      startCountdown(30);
      setNotice(authMode === "demo" ? `Demo mode: no SMS is sent. Use the code ${demoCode}.` : `We sent a ${otpLength}-digit code to +91 ${formatPhone(normalisePhone(phone))}.`);
    });
  };

  const verifyCode = (event: FormEvent) => {
    event.preventDefault();
    const problem = validateOtp(code);
    setErrors({ code: problem || undefined });
    if (problem) return;
    void run(async () => finish(await authClient.verifyLoginCode(normalisePhone(phone), code)));
  };

  const onGoogle = (credential: string) => void run(async () => finish(await authClient.signInWithGoogle(credential)));

  return (
    <AuthShell>
      {welcome ? (
        <Welcome {...welcome} />
      ) : (
        <>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.lead}>{fromCheckout ? "Please sign in to continue to checkout. Your bag is saved." : "Sign in to track your orders, save addresses and try sarees on with AI."}</p>

          <GoogleButton text="signin_with" clientId={googleClientId} disabled={busy} onCredential={onGoogle} onUnavailable={setNotice} />
          <div className={styles.divider}>or sign in with {method === "password" ? "email or mobile" : "a mobile code"}</div>

          {method === "password" ? (
            <form className={styles.form} onSubmit={signInWithPassword} noValidate>
              {formError && <p className={styles.alert} role="alert">{formError}</p>}
              {notice && <p className={styles.notice} role="status">{notice}</p>}
              <TextField
                label="Email or mobile number"
                value={identifier}
                onChange={(event) => { setIdentifier(event.target.value); setErrors((current) => ({ ...current, identifier: undefined })); }}
                placeholder="you@example.com or 98765 43210"
                autoComplete="username"
                error={errors.identifier}
                required
              />
              <PasswordField
                label="Password"
                value={password}
                onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })); }}
                placeholder="Your password"
                autoComplete="current-password"
                error={errors.password}
                required
                labelAside={<Link className={styles.inlineLink} href={`/forgot-password${query}`}>Forgot password?</Link>}
              />
              <button type="submit" className={styles.submit} disabled={busy}>
                {busy ? <><span className={styles.spinner} aria-hidden="true" />Signing in…</> : "Sign In"}
              </button>
              <button type="button" className={styles.altAction} onClick={() => switchTo("code")}>Sign in with a mobile code instead</button>
            </form>
          ) : !codeSent ? (
            <form className={styles.form} onSubmit={sendCode} noValidate>
              {formError && <p className={styles.alert} role="alert">{formError}</p>}
              {notice && <p className={styles.notice} role="status">{notice}</p>}
              <TextField
                label="Mobile number"
                prefix="+91"
                type="tel"
                value={phone}
                onChange={(event) => { setPhone(event.target.value); setErrors({}); }}
                placeholder="98765 43210"
                autoComplete="tel-national"
                inputMode="tel"
                error={errors.phone}
                hint="We will text you a 6-digit code. No password needed."
                required
              />
              <button type="submit" className={styles.submit} disabled={busy}>
                {busy ? <><span className={styles.spinner} aria-hidden="true" />Sending code…</> : "Send OTP"}
              </button>
              <button type="button" className={styles.altAction} onClick={() => switchTo("password")}>Use my password instead</button>
            </form>
          ) : (
            <form className={styles.form} onSubmit={verifyCode} noValidate>
              {formError && <p className={styles.alert} role="alert">{formError}</p>}
              {notice && <p className={styles.notice} role="status">{notice}</p>}
              <OtpField
                label="One-time code"
                value={code}
                length={otpLength}
                onChange={(value) => { setCode(value); setErrors({}); }}
                error={errors.code}
                autoFocus
              />
              <p className={styles.resend}>
                Did not get the code?{" "}
                <button type="button" className={styles.inlineLink} disabled={resendIn > 0 || busy} onClick={() => sendCode()}>
                  {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
                </button>
              </p>
              <button type="submit" className={styles.submit} disabled={busy}>
                {busy ? <><span className={styles.spinner} aria-hidden="true" />Verifying…</> : "Verify & Sign In"}
              </button>
              <button type="button" className={styles.altAction} onClick={() => { setCodeSent(false); setErrors({}); setNotice(""); setFormError(""); }}>Change number</button>
            </form>
          )}

          <p className={styles.switch}>New to Pratyangi Fashions? <Link href={`/signup${query}`}>Create an account</Link></p>
          {authMode === "demo" && <p className={styles.demoNote}>Demo mode: accounts are kept only in this browser until the store server is connected.</p>}
        </>
      )}
    </AuthShell>
  );
}
