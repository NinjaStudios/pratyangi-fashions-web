"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, X } from "lucide-react";
import type { AddressType, SavedAddress } from "@/lib/checkout";
import { easeOutExpo } from "@/lib/motion/presets";
import styles from "./AddressDialog.module.css";

type AddressDialogProps = {
  /** The address being edited, or null to add a new one. */
  address: SavedAddress | null;
  onSave: (address: Omit<SavedAddress, "id"> & { id?: string }) => void;
  onClose: () => void;
};

type Fields = { name: string; phone: string; pincode: string; city: string; state: string; house: string; area: string; landmark: string };
const types: AddressType[] = ["Home", "Office", "Other"];

const validate = (values: Fields): Partial<Record<keyof Fields, string>> => {
  const errors: Partial<Record<keyof Fields, string>> = {};
  if (!values.name.trim()) errors.name = "Enter the full name";
  if (!/^\d{10}$/.test(values.phone.replace(/\D/g, "").slice(-10)) || values.phone.replace(/\D/g, "").length < 10) errors.phone = "Enter a 10-digit mobile number";
  if (!/^\d{6}$/.test(values.pincode.trim())) errors.pincode = "Enter a 6-digit pincode";
  if (!values.city.trim()) errors.city = "Enter the city";
  if (!values.state.trim()) errors.state = "Enter the state";
  if (!values.house.trim()) errors.house = "Enter the flat, house or building";
  if (!values.area.trim()) errors.area = "Enter the area or street";
  return errors;
};

/**
 * "Add New Address" / "Edit" dialog for checkout. This screen is not in the Figma file yet: it is built from the checkout
 * design's own cards, fields and buttons so it can be handed to the designer for review.
 */
export function AddressDialog({ address, onSave, onClose }: AddressDialogProps) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [type, setType] = useState<AddressType>(address?.label ?? "Home");
  const [makeDefault, setMakeDefault] = useState(address?.isDefault ?? false);
  const [values, setValues] = useState<Fields>({
    name: address?.name ?? "",
    phone: address?.phone.replace(/^\+91\s*/, "") ?? "",
    pincode: address?.pincode ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    house: address?.house ?? "",
    area: address?.area ?? "",
    landmark: address?.landmark ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [attempt, setAttempt] = useState(0);

  // Keyboard: Esc closes, Tab stays inside, focus starts on the first field and returns to the opener when it closes.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("input")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, textarea");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      root.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [onClose]);

  const set = (key: keyof Fields) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setAttempt((count) => count + 1);
      dialogRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    onSave({
      id: address?.id,
      label: type,
      isDefault: makeDefault,
      name: values.name.trim(),
      phone: "+91 " + values.phone.replace(/\D/g, "").slice(-10),
      house: values.house.trim(),
      area: values.area.trim(),
      landmark: values.landmark.trim() || undefined,
      city: values.city.trim(),
      state: values.state.trim(),
      pincode: values.pincode.trim(),
    });
  };

  const field = (key: keyof Fields, label: string, props: { autoComplete?: string; inputMode?: "numeric" | "tel" | "text"; maxLength?: number; optional?: boolean; wide?: boolean; prefix?: string } = {}) => (
    <motion.div
      className={`${styles.field} ${props.wide ? styles.wide : ""}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: easeOutExpo, delay: 0.12 + order.indexOf(key) * 0.04 }}
    >
      <label htmlFor={`address-${key}`}>{label}{props.optional && <span> (optional)</span>}</label>
      <div className={`${styles.control} ${errors[key] ? styles.invalid : ""}`}>
        {props.prefix && <span className={styles.prefix} aria-hidden="true">{props.prefix}</span>}
        <input
          id={`address-${key}`}
          value={values[key]}
          onChange={set(key)}
          autoComplete={props.autoComplete}
          inputMode={props.inputMode}
          maxLength={props.maxLength}
          aria-invalid={errors[key] ? true : undefined}
          aria-describedby={errors[key] ? `address-${key}-error` : undefined}
        />
      </div>
      {errors[key] && <p className={styles.error} id={`address-${key}-error`} role="alert">{errors[key]}</p>}
    </motion.div>
  );

  return (
    <motion.div
      className={styles.scrim}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25 }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <motion.div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-dialog-title"
        data-lenis-prevent
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.98 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: easeOutExpo }}
      >
        <div className={styles.header}>
          <MapPin className={styles.icon} size={28} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <h2 id="address-dialog-title">{address ? "Edit Address" : "Add New Address"}</h2>
            <p>Where should we deliver your order?</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close address dialog"><X size={20} /></button>
        </div>

        <motion.form key={attempt} className={styles.form} onSubmit={submit} noValidate animate={attempt && Object.keys(errors).length && !reduceMotion ? { x: [0, -8, 8, -5, 5, 0] } : undefined} transition={{ duration: 0.35 }}>
          <div className={styles.grid}>
            {field("name", "Full name", { autoComplete: "name" })}
            {field("phone", "Mobile number", { autoComplete: "tel-national", inputMode: "tel", prefix: "+91" })}
            {field("pincode", "Pincode", { autoComplete: "postal-code", inputMode: "numeric", maxLength: 6 })}
            {field("city", "City", { autoComplete: "address-level2" })}
            {field("state", "State", { autoComplete: "address-level1" })}
            {field("landmark", "Landmark", { optional: true })}
            {field("house", "Flat, house no., building", { autoComplete: "address-line1", wide: true })}
            {field("area", "Area, street, village", { autoComplete: "address-line2", wide: true })}
          </div>

          <motion.fieldset
            className={styles.types}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: easeOutExpo, delay: 0.5 }}
          >
            <legend>Address type</legend>
            {types.map((option) => (
              <label key={option} className={`${styles.type} ${type === option ? styles.typeActive : ""}`}>
                <input type="radio" name="address-type" checked={type === option} onChange={() => setType(option)} />
                {option}
              </label>
            ))}
          </motion.fieldset>

          <label className={styles.defaultToggle}>
            <input type="checkbox" checked={makeDefault} onChange={(event) => setMakeDefault(event.target.checked)} />
            <span className={styles.box} aria-hidden="true" />
            Make this my default address
          </label>

          <div className={styles.footer}>
            <button type="button" className={styles.cancel} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.save}>Save Address</button>
          </div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
}

const order: (keyof Fields)[] = ["name", "phone", "pincode", "city", "state", "landmark", "house", "area"];
