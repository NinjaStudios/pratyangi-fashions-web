"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField, TextField } from "@/components/auth/Fields";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Welcome, describeError, useAuthFlow } from "@/components/auth/useAuthFlow";
import { authClient, authMode, googleClientId, notConnectedMessage, validateEmail } from "@/lib/auth";
import styles from "@/components/auth/Auth.module.css";

type Errors = Partial<Record<"email" | "password", string>>;

/** Sign in with email and password, or continue with Google. */
export function LoginView() {
  const { fromCheckout, welcome, finish, query } = useAuthFlow();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (task: () => Promise<void>) => {
    setFormError("");
    setNotice("");
    setBusy(true);
    try {
      await task();
    } catch (error) {
      const { message, errors: fieldErrors } = describeError(error);
      setErrors({ email: fieldErrors.email, password: fieldErrors.password });
      // a message that belongs to an input is shown at that input; everything else at the top of the form
      if (!fieldErrors.email && !fieldErrors.password) setFormError(message);
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found: Errors = { email: validateEmail(email) || undefined, password: password ? undefined : "Enter your password." };
    setErrors(found);
    if (found.email || found.password) {
      requestAnimationFrame(() => event.currentTarget.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    void run(async () => finish(await authClient.signIn(email.trim().toLowerCase(), password)));
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

          {authMode === "off" && <p className={styles.notice} role="status">{notConnectedMessage}</p>}

          <GoogleButton text="signin_with" clientId={googleClientId} disabled={busy} onCredential={onGoogle} onUnavailable={setNotice} />
          <div className={styles.divider}>or sign in with email</div>

          <form className={styles.form} onSubmit={submit} noValidate>
            {formError && <p className={styles.alert} role="alert">{formError}</p>}
            {notice && <p className={styles.notice} role="status">{notice}</p>}
            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: undefined })); }}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              error={errors.email}
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
          </form>

          <p className={styles.switch}>New to Pratyangi Fashions? <Link href={`/signup${query}`}>Create an account</Link></p>
          {authMode === "demo" && <p className={styles.demoNote}>Demo mode: accounts are kept only in this browser. This is not real sign-in.</p>}
        </>
      )}
    </AuthShell>
  );
}
