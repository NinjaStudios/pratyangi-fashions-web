"use client";

import { useId } from "react";
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
