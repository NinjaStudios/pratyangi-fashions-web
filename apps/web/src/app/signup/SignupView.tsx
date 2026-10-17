"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField, PasswordStrength, TextField } from "@/components/auth/Fields";
import { GoogleButton } from "@/components/auth/GoogleButton";
import {
  AuthError, authClient, authMode, googleClientId, normalisePhone, safeNext, setSessionUser,
  validateEmail, validateName, validatePassword, validatePhone, type AuthUser,
} from "@/lib/auth";
import styles from "@/components/auth/Auth.module.css";

type Errors = Partial<Record<"name" | "email" | "phone" | "password" | "confirm" | "terms", string>>;

export function SignupView() {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [values, setValues] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState<AuthUser | null>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const set = (key: keyof typeof values) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const finish = (user: AuthUser) => {
    setSessionUser(user);
    setWelcome(user);
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    timer.current = setTimeout(() => router.push(next), 1300);
  };

  const fail = (error: unknown) => {
    if (error instanceof AuthError) {
      if (error.field) setErrors({ [error.field]: error.message });
      else setFormError(error.message);
    } else {
      setFormError("Something went wrong. Please try again.");
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setNotice("");
    const found: Errors = {
      name: validateName(values.name) || undefined,
      email: validateEmail(values.email) || undefined,
      phone: validatePhone(values.phone) || undefined,
      password: validatePassword(values.password) || undefined,
      confirm: !values.confirm ? "Re-enter your password" : values.confirm !== values.password ? "The two passwords do not match" : undefined,
      terms: terms ? undefined : "Please accept the terms to continue",
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    setBusy(true);
    try {
      finish(await authClient.signUp({ name: values.name, email: values.email, phone: normalisePhone(values.phone), password: values.password }));
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
          <h2>Welcome, {welcome.name.split(" ")[0]}!</h2>
          <p>Your account is ready. Taking you there…</p>
        </div>
      ) : (
        <>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.lead}>Join Pratyangi Fashions for faster checkout, order tracking and AI try-on.</p>

          <GoogleButton text="signup_with" clientId={googleClientId} disabled={busy} onCredential={onGoogle} onUnavailable={setNotice} />
          <div className={styles.divider}>or sign up with email</div>

          <form ref={form} className={styles.form} onSubmit={submit} noValidate>
            {formError && <p className={styles.alert} role="alert">{formError}</p>}
            {notice && <p className={styles.notice} role="status">{notice}</p>}
            <TextField label="Full name" value={values.name} onChange={set("name")} placeholder="Gaurav Kumar" autoComplete="name" error={errors.name} required />
            <div className={styles.row}>
              <TextField label="Email address" type="email" value={values.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" inputMode="email" error={errors.email} required />
              <TextField label="Mobile number" prefix="+91" value={values.phone} onChange={set("phone")} placeholder="98765 43210" autoComplete="tel-national" inputMode="tel" error={errors.phone} required />
            </div>
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

          <p className={styles.switch}>Already have an account? <Link href="/login">Sign in</Link></p>
          {authMode === "demo" && <p className={styles.demoNote}>Demo mode: accounts are kept only in this browser until the store server is connected.</p>}
        </>
      )}
    </AuthShell>
  );
}
