"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { passwordRules, passwordStrength, strengthLabels } from "@/lib/auth";
import styles from "./Auth.module.css";

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  error?: string;
  hint?: string;
  /** Text shown at the left inside the box, e.g. the +91 of a phone number. */
  prefix?: string;
  /** Something to place at the right of the label, e.g. "Forgot password?". */
  labelAside?: ReactNode;
};

export function TextField({ label, error, hint, prefix, labelAside, required, ...input }: FieldProps) {
  const id = useId();
  const describedBy = [error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={required ? styles.required : undefined}>{label}</label>
        {labelAside}
      </div>
      <div className={`${styles.control} ${error ? styles.invalid : ""}`}>
        {prefix && <span className={styles.prefix} aria-hidden="true">{prefix}</span>}
        <input id={id} aria-required={required || undefined} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...input} />
      </div>
      {hint && !error && <p className={styles.hint} id={`${id}-hint`}>{hint}</p>}
      {error && <p className={styles.error} id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}

export function PasswordField({ label, error, hint, labelAside, required, ...input }: Omit<FieldProps, "prefix" | "type">) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const describedBy = [error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={required ? styles.required : undefined}>{label}</label>
        {labelAside}
      </div>
      <div className={`${styles.control} ${error ? styles.invalid : ""}`}>
        <input id={id} type={shown ? "text" : "password"} aria-required={required || undefined} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...input} />
        <button type="button" className={styles.reveal} onClick={() => setShown(!shown)} aria-pressed={shown} aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>
          {shown ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {hint && !error && <p className={styles.hint} id={`${id}-hint`}>{hint}</p>}
      {error && <p className={styles.error} id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}

/** Four bars that fill as the password gets stronger, with the rules ticked off underneath. */
export function PasswordStrength({ value }: { value: string }) {
  const score = passwordStrength(value);
  return (
    <div className={styles.strength} data-score={score}>
      <div className={styles.bars} aria-hidden="true">
        {[1, 2, 3, 4].map((bar) => <span key={bar} className={bar <= score ? styles.barOn : undefined} />)}
      </div>
      <p className={styles.strengthLabel} role="status" aria-live="polite">{value ? `Password strength: ${strengthLabels[score]}` : "Use at least 8 characters with a letter and a number."}</p>
      <ul className={styles.rules} aria-label="Password rules">
        {passwordRules.map((rule) => (
          <li key={rule.id} className={rule.test(value) ? styles.ruleMet : undefined}>
            <span aria-hidden="true">{rule.test(value) ? "✓" : "○"}</span> {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
