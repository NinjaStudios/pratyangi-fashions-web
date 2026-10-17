"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField, PasswordStrength, TextField } from "@/components/auth/Fields";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Welcome, describeError, useAuthFlow } from "@/components/auth/useAuthFlow";
import { authClient, authMode, googleClientId, notConnectedMessage, validateConfirm, validateEmail, validateName, validatePassword } from "@/lib/auth";
import styles from "@/components/auth/Auth.module.css";

type Errors = Partial<Record<"name" | "email" | "password" | "confirm" | "terms", string>>;

/**
 * Create an account with a name, an email and a password (or continue with Google). One account per email address:
 * if the email is already registered, by any method, the form says so next to the email field.
 * The delivery mobile number is not asked here; it belongs to each delivery address at checkout.
 */
export function SignupView() {
  const { fromCheckout, welcome, finish, query } = useAuthFlow();
  const [values, setValues] = useState({ name: "", email: "", password: "", confirm: "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof values) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const run = async (task: () => Promise<void>) => {
    setFormError("");
    setNotice("");
    setBusy(true);
    try {
      await task();
    } catch (error) {
      const { message, errors: fieldErrors } = describeError(error);
      setErrors({ name: fieldErrors.name, email: fieldErrors.email, password: fieldErrors.password });
      if (!fieldErrors.name && !fieldErrors.email && !fieldErrors.password) setFormError(message);
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found: Errors = {
      name: validateName(values.name) || undefined,
      email: validateEmail(values.email) || undefined,
      password: validatePassword(values.password) || undefined,
      confirm: validateConfirm(values.password, values.confirm) || undefined,
      terms: terms ? undefined : "Please accept the terms to continue.",
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      requestAnimationFrame(() => event.currentTarget.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    void run(async () => finish(await authClient.signUp({ name: values.name.trim(), email: values.email.trim().toLowerCase(), password: values.password }), true));
  };

  const onGoogle = (credential: string) => void run(async () => finish(await authClient.signInWithGoogle(credential)));

  return (
    <AuthShell>
      {welcome ? (
        <Welcome {...welcome} />
      ) : (
        <>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.lead}>{fromCheckout ? "Create an account to continue to checkout. Your bag is saved." : "Join Pratyangi Fashions for faster checkout, order tracking and AI try-on."}</p>

          {authMode === "off" && <p className={styles.notice} role="status">{notConnectedMessage}</p>}

          <GoogleButton text="signup_with" clientId={googleClientId} disabled={busy} onCredential={onGoogle} onUnavailable={setNotice} />
          <div className={styles.divider}>or sign up with email</div>

          <form className={styles.form} onSubmit={submit} noValidate>
            {formError && <p className={styles.alert} role="alert">{formError}</p>}
            {notice && <p className={styles.notice} role="status">{notice}</p>}
            <TextField label="Full name" value={values.name} onChange={set("name")} placeholder="Gaurav Kumar" autoComplete="name" error={errors.name} required />
            <TextField label="Email address" type="email" value={values.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" inputMode="email" error={errors.email} required />
            <div>
              <PasswordField label="Password" value={values.password} onChange={set("password")} placeholder="Create a password" autoComplete="new-password" error={errors.password} required />
              <PasswordStrength value={values.password} />
            </div>
            <PasswordField label="Confirm password" value={values.confirm} onChange={set("confirm")} placeholder="Re-enter your password" autoComplete="new-password" error={errors.confirm} required />

            <div>
              <label className={`${styles.check} ${errors.terms ? styles.checkInvalid : ""}`}>
                <input type="checkbox" checked={terms} onChange={(event) => { setTerms(event.target.checked); setErrors((current) => ({ ...current, terms: undefined })); }} aria-invalid={errors.terms ? true : undefined} aria-describedby={errors.terms ? "terms-error" : undefined} />
                <span className={styles.box} aria-hidden="true" />
                <span>I agree to the <span className={styles.strong}>Terms &amp; Conditions</span> and <span className={styles.strong}>Privacy Policy</span>.</span>
              </label>
              {errors.terms && <p className={styles.error} id="terms-error" role="alert">{errors.terms}</p>}
            </div>

            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? <><span className={styles.spinner} aria-hidden="true" />Creating your account…</> : "Create Account"}
            </button>
          </form>

          <p className={styles.switch}>Already have an account? <Link href={`/login${query}`}>Sign in</Link></p>
          {authMode === "demo" && <p className={styles.demoNote}>Demo mode: accounts are kept only in this browser. This is not real sign-in.</p>}
        </>
      )}
    </AuthShell>
  );
}
