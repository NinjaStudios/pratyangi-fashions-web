"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./Auth.module.css";

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  error?: string;
  hint?: string;
  /** Text shown at the left inside the box, e.g. the +91 of a phone number. */
  prefix?: string;
  /** Something to place at the right of the label. */
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

type OtpFieldProps = {
  label: string;
  value: string;
  length: number;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
};

/**
 * Six boxes that fill as the code is typed or pasted. It is one real input laid over the boxes, so the phone keyboard,
 * paste and the SMS auto-fill suggestion (autocomplete="one-time-code") all work like any normal field.
 */
export function OtpField({ label, value, length, onChange, error, autoFocus }: OtpFieldProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.required}>{label}</label>
      <div className={`${styles.otp} ${error ? styles.otpInvalid : ""}`}>
        <input
          id={id}
          className={styles.otpInput}
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, length))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          autoFocus={autoFocus}
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {Array.from({ length }, (_, index) => (
          <span key={index} aria-hidden="true" className={`${styles.otpBox} ${focused && index === Math.min(value.length, length - 1) ? styles.otpBoxActive : ""}`}>
            {value[index] ?? ""}
          </span>
        ))}
      </div>
      {error && <p className={styles.error} id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}
