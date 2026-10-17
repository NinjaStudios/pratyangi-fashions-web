"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpField, PasswordField, PasswordStrength, TextField } from "@/components/auth/Fields";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Welcome, describeError, useAuthFlow, useCountdown } from "@/components/auth/useAuthFlow";
import {
  authClient, authMode, formatPhone, googleClientId, normalisePhone, otpLength, validateEmail, validateName, validateOtp,
  validatePassword, validatePhone, type CodeChannel,
} from "@/lib/auth";
import { demoCode } from "@/lib/auth/demoAuth";
import styles from "@/components/auth/Auth.module.css";

type Errors = Partial<Record<"name" | "email" | "phone" | "password" | "confirm" | "terms" | "phoneCode" | "emailCode", string>>;

/**
 * Create account in two steps: your details, then proof that the mobile number and the email address are yours (a code
 * is texted to the one and emailed to the other, and both are typed on the same page). No account exists until both pass.
 */
export function SignupView() {
  const { fromCheckout, welcome, finish, query } = useAuthFlow();
  const [step, setStep] = useState<"details" | "verify">("details");
  const [values, setValues] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [terms, setTerms] = useState(false);
  const [signupId, setSignupId] = useState("");
  const [codes, setCodes] = useState({ phone: "", email: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [phoneResend, startPhoneCountdown] = useCountdown();
  const [emailResend, startEmailCountdown] = useCountdown();

  const set = (key: keyof typeof values) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const run = async (task: () => Promise<void>) => {
    setFormError("");
    setBusy(true);
    try {
      await task();
    } catch (error) {
      const { field, message } = describeError(error);
      if (field) setErrors({ [field]: message });
      else setFormError(message);
      // an email or mobile that is already registered is fixed on the details step
      if (field === "email" || field === "phone") setStep("details");
    } finally {
      setBusy(false);
    }
  };

  const digits = normalisePhone(values.phone);
  const email = values.email.trim().toLowerCase();

  const submitDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      requestAnimationFrame(() => event.currentTarget.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    void run(async () => {
      const started = await authClient.startSignup({ name: values.name, email, phone: digits, password: values.password });
      setSignupId(started.signupId);
      setCodes({ phone: "", email: "" });
      setStep("verify");
      startPhoneCountdown(30);
      startEmailCountdown(30);
      setNotice(authMode === "demo" ? `Demo mode: no SMS or email is sent. Use the code ${demoCode} in both boxes.` : "");
    });
  };

  const resend = (channel: CodeChannel) => void run(async () => {
    await authClient.resendSignupCode(signupId, channel);
    (channel === "phone" ? startPhoneCountdown : startEmailCountdown)(30);
    setNotice(`We sent a new code to your ${channel === "phone" ? "mobile" : "email"}.`);
  });

  const submitCodes = (event: FormEvent) => {
    event.preventDefault();
    const found: Errors = { phoneCode: validateOtp(codes.phone) || undefined, emailCode: validateOtp(codes.email) || undefined };
    setErrors(found);
    if (found.phoneCode || found.emailCode) return;
    void run(async () => finish(await authClient.verifySignup({ signupId, phoneCode: codes.phone, emailCode: codes.email }), true));
  };

  const onGoogle = (credential: string) => void run(async () => finish(await authClient.signInWithGoogle(credential)));

  return (
    <AuthShell>
      {welcome ? (
        <Welcome {...welcome} />
      ) : step === "details" ? (
        <>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.lead}>{fromCheckout ? "Create an account to continue to checkout. Your bag is saved." : "Join Pratyangi Fashions for faster checkout, order tracking and AI try-on."}</p>

          <GoogleButton text="signup_with" clientId={googleClientId} disabled={busy} onCredential={onGoogle} onUnavailable={setNotice} />
          <div className={styles.divider}>or sign up with email and mobile</div>

          <form className={styles.form} onSubmit={submitDetails} noValidate>
            {formError && <p className={styles.alert} role="alert">{formError}</p>}
            {notice && <p className={styles.notice} role="status">{notice}</p>}
            <TextField label="Full name" value={values.name} onChange={set("name")} placeholder="Gaurav Kumar" autoComplete="name" error={errors.name} required />
            <div className={styles.row}>
              <TextField label="Email address" type="email" value={values.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" inputMode="email" error={errors.email} required />
              <TextField label="Mobile number" prefix="+91" type="tel" value={values.phone} onChange={set("phone")} placeholder="98765 43210" autoComplete="tel-national" inputMode="tel" error={errors.phone} required />
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
              {busy ? <><span className={styles.spinner} aria-hidden="true" />Sending codes…</> : "Continue"}
            </button>
          </form>

          <p className={styles.switch}>Already have an account? <Link href={`/login${query}`}>Sign in</Link></p>
          {authMode === "demo" && <p className={styles.demoNote}>Demo mode: accounts are kept only in this browser until the store server is connected.</p>}
        </>
      ) : (
        <>
          <span className={styles.badge} aria-hidden="true"><ShieldCheck size={26} /></span>
          <h1 className={styles.title}>Verify your details</h1>
          <p className={styles.lead}>
            We sent a code to +91 {formatPhone(digits)} and another to {email}.{" "}
            <button type="button" className={styles.inlineLink} onClick={() => { setStep("details"); setErrors({}); setNotice(""); }}>Edit details</button>
          </p>

          <form className={styles.form} onSubmit={submitCodes} noValidate>
            {formError && <p className={styles.alert} role="alert">{formError}</p>}
            {notice && <p className={styles.notice} role="status">{notice}</p>}
            <div>
              <OtpField label="Mobile code" value={codes.phone} length={otpLength} onChange={(value) => { setCodes((current) => ({ ...current, phone: value })); setErrors((current) => ({ ...current, phoneCode: undefined })); }} error={errors.phoneCode} autoFocus />
              <p className={styles.resend}>
                <button type="button" className={styles.inlineLink} disabled={phoneResend > 0 || busy} onClick={() => resend("phone")}>
                  {phoneResend > 0 ? `Resend mobile code in ${phoneResend}s` : "Resend mobile code"}
                </button>
              </p>
            </div>
            <div>
              <OtpField label="Email code" value={codes.email} length={otpLength} onChange={(value) => { setCodes((current) => ({ ...current, email: value })); setErrors((current) => ({ ...current, emailCode: undefined })); }} error={errors.emailCode} />
              <p className={styles.resend}>
                <button type="button" className={styles.inlineLink} disabled={emailResend > 0 || busy} onClick={() => resend("email")}>
                  {emailResend > 0 ? `Resend email code in ${emailResend}s` : "Resend email code"}
                </button>
              </p>
            </div>
            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? <><span className={styles.spinner} aria-hidden="true" />Verifying…</> : "Verify & Create Account"}
            </button>
          </form>
          <p className={styles.terms}>Check your spam folder if the email does not arrive within a minute.</p>
        </>
      )}
    </AuthShell>
  );
}
