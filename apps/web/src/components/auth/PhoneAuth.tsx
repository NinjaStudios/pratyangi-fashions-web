"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { TextField } from "@/components/auth/Fields";
import { GoogleButton } from "@/components/auth/GoogleButton";
import {
  AuthError, authClient, authMode, formatPhone, googleClientId, normalisePhone, otpLength, safeNext, setSessionUser,
  validateName, validateOtp, validatePhone, type AuthUser,
} from "@/lib/auth";
import { demoOtpCode } from "@/lib/auth/demoAuth";
import styles from "@/components/auth/Auth.module.css";

const resendSeconds = 30;
type Errors = Partial<Record<"phone" | "name" | "code", string>>;

/**
 * Sign in and create account are one flow: mobile number, then the 6-digit code texted to it (or Google).
 * A number with no account yet is asked for a name on the code step and gets an account when the code checks out.
 * `mode` only changes the wording and the link to the other page.
 */
export function PhoneAuth({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [fromCheckout, setFromCheckout] = useState(false);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [welcome, setWelcome] = useState<{ user: AuthUser; created: boolean } | null>(null);

  useEffect(() => {
    setFromCheckout(new URLSearchParams(window.location.search).get("next") === "/checkout");
    return () => clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const tick = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(tick);
  }, [resendIn]);

  const digits = normalisePhone(phone);
  const query = fromCheckout ? "?next=/checkout" : "";

  const finish = (user: AuthUser, created: boolean) => {
    setSessionUser(user);
    setWelcome({ user, created });
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    timer.current = setTimeout(() => router.push(next), 1200);
  };

  const fail = (error: unknown) => {
    if (error instanceof AuthError) {
      if (error.field) setErrors({ [error.field]: error.message });
      else setFormError(error.message);
    } else {
      setFormError("Something went wrong. Please try again.");
    }
  };

  const sendCode = async (event?: FormEvent) => {
    event?.preventDefault();
    setFormError("");
    setNotice("");
    const problem = validatePhone(phone);
    setErrors({ phone: problem || undefined });
    if (problem) return;
    setBusy(true);
    try {
      const sent = await authClient.sendOtp(digits);
      setIsNew(sent.isNew);
      setCode("");
      setStep("code");
      setResendIn(resendSeconds);
      setNotice(authMode === "demo" ? `Demo mode: no SMS is sent. Use the code ${demoOtpCode}.` : `We sent a ${otpLength}-digit code to +91 ${formatPhone(digits)}.`);
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    const found: Errors = { code: validateOtp(code) || undefined, name: isNew ? validateName(name) || undefined : undefined };
    setErrors(found);
    if (found.code || found.name) return;
    setBusy(true);
    try {
      finish(await authClient.verifyOtp({ phone: digits, code, name: isNew ? name : undefined }), isNew);
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
      finish(await authClient.signInWithGoogle(credential), false);
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const changeNumber = () => {
    setStep("phone");
    setCode("");
    setErrors({});
    setFormError("");
    setNotice("");
  };

  const signup = mode === "signup";
  const title = signup ? "Create your account" : "Welcome back";
  const lead = fromCheckout
    ? "Please sign in to continue to checkout. Your bag is saved."
    : signup
      ? "Join Pratyangi Fashions for faster checkout, order tracking and AI try-on."
      : "Sign in to track your orders, save addresses and try sarees on with AI.";

  return (
    <AuthShell>
      {welcome ? (
        <div className={styles.success} role="status">
          <CircleCheck size={48} aria-hidden="true" />
          <h2>{welcome.created ? "Welcome" : "Welcome back"}, {welcome.user.name.split(" ")[0]}!</h2>
          <p>{welcome.created ? "Your account is ready. Taking you there…" : "Taking you there…"}</p>
        </div>
      ) : step === "phone" ? (
        <>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.lead}>{lead}</p>

          <GoogleButton text={signup ? "signup_with" : "signin_with"} clientId={googleClientId} disabled={busy} onCredential={onGoogle} onUnavailable={setNotice} />
          <div className={styles.divider}>or continue with your mobile number</div>

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
              hint="We will text you a 6-digit code to confirm it is you."
              required
            />
            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? <><span className={styles.spinner} aria-hidden="true" />Sending code…</> : "Send OTP"}
            </button>
          </form>

          <p className={styles.terms}>By continuing you agree to our <span className={styles.strong}>Terms &amp; Conditions</span> and <span className={styles.strong}>Privacy Policy</span>.</p>
          <p className={styles.switch}>
            {signup ? <>Already have an account? <Link href={`/login${query}`}>Sign in</Link></> : <>New to Pratyangi Fashions? <Link href={`/signup${query}`}>Create an account</Link></>}
          </p>
        </>
      ) : (
        <>
          <h1 className={styles.title}>Verify your number</h1>
          <p className={styles.lead}>
            Enter the {otpLength}-digit code sent to +91 {formatPhone(digits)}.{" "}
            <button type="button" className={styles.inlineLink} onClick={changeNumber}>Change number</button>
          </p>

          <form className={styles.form} onSubmit={verify} noValidate>
            {formError && <p className={styles.alert} role="alert">{formError}</p>}
            {notice && <p className={styles.notice} role="status">{notice}</p>}
            {isNew && (
              <TextField
                label="Full name"
                value={name}
                onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: undefined })); }}
                placeholder="Gaurav Kumar"
                autoComplete="name"
                error={errors.name}
                hint="This number has no account yet, so we will create one."
                required
              />
            )}
            <TextField
              label="One-time code"
              value={code}
              onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, otpLength)); setErrors((current) => ({ ...current, code: undefined })); }}
              placeholder="······"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={otpLength}
              error={errors.code}
              required
              labelAside={
                <button type="button" className={styles.inlineLink} disabled={resendIn > 0 || busy} onClick={() => sendCode()}>
                  {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
                </button>
              }
            />
            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? <><span className={styles.spinner} aria-hidden="true" />Verifying…</> : isNew ? "Verify & Create Account" : "Verify & Sign In"}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
