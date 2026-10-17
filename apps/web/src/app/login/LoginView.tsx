"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField, TextField } from "@/components/auth/Fields";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { AuthError, authClient, authMode, googleClientId, safeNext, setSessionUser, validateEmail, type AuthUser } from "@/lib/auth";
import styles from "@/components/auth/Auth.module.css";

export function LoginView() {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState<AuthUser | null>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const finish = (user: AuthUser) => {
    setSessionUser(user);
    setWelcome(user);
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    timer.current = setTimeout(() => router.push(next), 1100);
  };

  const fail = (error: unknown) => {
    if (error instanceof AuthError) {
      if (error.field === "email" || error.field === "password") setErrors({ [error.field]: error.message });
      else setFormError(error.message);
    } else {
      setFormError("Something went wrong. Please try again.");
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setNotice("");
    const found = { email: validateEmail(email) || undefined, password: password ? undefined : "Enter your password" };
    setErrors(found);
    if (found.email || found.password) {
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    setBusy(true);
    try {
      finish(await authClient.signIn(email, password));
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async (credential: string) => {
    setFormError("");
    setNotice("");
    setBusy(true);
    try {
      finish(await authClient.signInWithGoogle(credential));
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      {welcome ? (
        <div className={styles.success} role="status">
          <CircleCheck size={48} aria-hidden="true" />
          <h2>Welcome back, {welcome.name.split(" ")[0]}!</h2>
          <p>Taking you to your account…</p>
        </div>
      ) : (
        <>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.lead}>Sign in to track your orders, save addresses and try sarees on with AI.</p>

          <GoogleButton text="signin_with" clientId={googleClientId} disabled={busy} onCredential={onGoogle} onUnavailable={setNotice} />
          <div className={styles.divider}>or sign in with email</div>

          <form ref={form} className={styles.form} onSubmit={submit} noValidate>
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
              labelAside={
                <button type="button" className={styles.inlineLink} onClick={() => setNotice("Password reset will work once the store server is connected. Until then, you can create a new account with another email.")}>
                  Forgot password?
                </button>
              }
            />
            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? <><span className={styles.spinner} aria-hidden="true" />Signing in…</> : "Sign In"}
            </button>
          </form>

          <p className={styles.switch}>New to Pratyangi Fashions? <Link href="/signup">Create an account</Link></p>
          {authMode === "demo" && <p className={styles.demoNote}>Demo mode: accounts are kept only in this browser until the store server is connected.</p>}
        </>
      )}
    </AuthShell>
  );
}
