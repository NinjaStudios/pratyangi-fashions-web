"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, ChevronDown, House, MapPin, Pencil, X } from "lucide-react";
import { AddressError, type AddressDraft } from "@/lib/addressBook";
import { addressLines, demoPincodes, indianStates, normalisePhone, validatePhone, type AddressType, type SavedAddress } from "@/lib/checkout";
import { easeOutExpo } from "@/lib/motion/presets";
import styles from "./AddressDialog.module.css";

type AddressDialogProps = {
  addresses: SavedAddress[];
  /** The address chosen for delivery (shown ticked in "My Addresses"). */
  selectedId: string;
  /** The address to edit when the dialog opens, or null to start a new one. */
  editing: SavedAddress | null;
  onSelect: (id: string) => void;
  /** These may fail (the server refuses, or cannot be reached): throw an AddressError and the dialog shows it, at the right input when it names one. */
  onSave: (address: AddressDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  onClose: () => void;
  /** The signed-in customer's name: a new address starts with it filled in. The mobile is NOT prefilled: it is the delivery contact, not the login. */
  prefill?: { name?: string };
};

type Fields = { name: string; phone: string; pincode: string; house: string; street: string; city: string; state: string; label: string };
type Errors = Partial<Record<keyof Fields, string>>;

const typeOptions: { type: AddressType; note: string; Icon: typeof House }[] = [
  { type: "Home", note: "For everyday delivery", Icon: House },
  { type: "Office", note: "For workplace delivery", Icon: Building2 },
  { type: "Other", note: "For other purposes", Icon: MapPin },
];

const blank: Fields = { name: "", phone: "", pincode: "", house: "", street: "", city: "", state: "", label: "" };
const toFields = (address: SavedAddress | null, prefill?: { name?: string }): Fields =>
  address
    ? { name: address.name, phone: address.phone.replace(/^\+91\s*/, ""), pincode: address.pincode, house: address.house, street: address.street, city: address.city, state: address.state, label: address.label === address.type ? "" : address.label }
    : { ...blank, name: prefill?.name ?? "" };

const validate = (values: Fields): Errors => {
  const errors: Errors = {};
  const name = values.name.trim();
  if (!name) errors.name = "Enter the recipient's full name.";
  else if (name.length < 2) errors.name = "Enter the recipient's full name (at least 2 characters).";
  const phone = validatePhone(values.phone);
  if (phone) errors.phone = phone;
  const pincode = values.pincode.trim();
  if (!pincode) errors.pincode = "Enter the 6-digit PIN code.";
  else if (!/^[1-9]\d{5}$/.test(pincode)) errors.pincode = "Enter a valid 6-digit PIN code (it cannot start with 0).";
  if (!values.house.trim()) errors.house = "Enter the house, flat or building number.";
  if (!values.street.trim()) errors.street = "Enter the street, area or landmark.";
  if (values.city.trim().length < 2) errors.city = "Enter the city.";
  if (!values.state) errors.state = "Choose the state.";
  return errors;
};

function IndiaFlag() {
  return (
    <svg width="18" height="13" viewBox="0 0 18 13" aria-hidden="true" focusable="false">
      <rect width="18" height="4.34" fill="#ff9933" />
      <rect y="4.33" width="18" height="4.34" fill="#fff" />
      <rect y="8.66" width="18" height="4.34" fill="#138808" />
      <circle cx="9" cy="6.5" r="1.5" fill="none" stroke="#000080" strokeWidth="0.5" />
    </svg>
  );
}

/**
 * Address management dialog, as designed: "My Addresses" on the left (pick one for delivery, edit, set default, delete) and
 * the "Add new Address" form on the right (also used for editing).
 */
export function AddressDialog({ addresses, selectedId, editing, onSelect, onSave, onDelete, onSetDefault, onClose, prefill }: AddressDialogProps) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [editId, setEditId] = useState<string | null>(editing?.id ?? null);
  const [type, setType] = useState<AddressType>(editing?.type ?? "Home");
  const [makeDefault, setMakeDefault] = useState(editing?.isDefault ?? false);
  const [values, setValues] = useState<Fields>(toFields(editing, prefill));
  const [errors, setErrors] = useState<Errors>({});
  const [pincodeNote, setPincodeNote] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadAddress = (address: SavedAddress | null) => {
    setEditId(address?.id ?? null);
    setType(address?.type ?? "Home");
    setMakeDefault(address?.isDefault ?? false);
    setValues(toFields(address, prefill));
    setErrors({});
    setActionError("");
    setPincodeNote("");
  };

  /** Runs a save, delete or default change; a refusal is shown in the dialog instead of being lost. Returns whether it worked. */
  const attempt = async (task: () => Promise<void>) => {
    setActionError("");
    setBusy(true);
    try {
      await task();
      return true;
    } catch (error) {
      const failure = error instanceof AddressError ? error : new AddressError("Something went wrong. Please try again.");
      const named = Object.entries(failure.errors ?? {}).filter(([key]) => key in blank);
      if (named.length) {
        setErrors(Object.fromEntries(named) as Errors);
        setShake((count) => count + 1);
        requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      }
      setActionError(failure.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Keyboard: Esc closes the open menu first, then the dialog; Tab stays inside; focus returns to the opener on close.
  const menuOpenRef = useRef<string | null>(null);
  menuOpenRef.current = menuFor;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("input[type=text]")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (menuOpenRef.current) setMenuFor(null);
        else onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([type=radio]), select, textarea, input[type=radio]:checked");
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

  const checkPincode = () => {
    const pin = values.pincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      setErrors((current) => ({ ...current, pincode: pin ? "Enter a valid 6-digit PIN code (it cannot start with 0)." : "Enter the 6-digit PIN code." }));
      setPincodeNote("");
      return;
    }
    const found = demoPincodes[pin];
    if (found) setValues((current) => ({ ...current, city: found.city, state: found.state }));
    setErrors((current) => ({ ...current, pincode: undefined }));
    setPincodeNote(found ? `Delivery available in ${found.city}, ${found.state}` : "Delivery available to this pincode");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setShake((count) => count + 1);
      requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    void attempt(() => onSave({
      id: editId ?? undefined,
      type,
      label: values.label.trim() || type,
      isDefault: makeDefault,
      name: values.name.trim(),
      phone: "+91 " + normalisePhone(values.phone),
      house: values.house.trim(),
      street: values.street.trim(),
      city: values.city.trim(),
      state: values.state,
      pincode: values.pincode.trim(),
    }));
  };

  const stagger = (index: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.4, ease: easeOutExpo, delay: 0.1 + index * 0.04 },
  });

  const input = (key: keyof Fields, label: string, options: { required?: boolean; placeholder?: string; autoComplete?: string; inputMode?: "numeric" | "tel" | "text"; maxLength?: number } = {}) => (
    <>
      <label htmlFor={`address-${key}`} className={options.required !== false ? styles.required : undefined}>{label}</label>
      <input
        id={`address-${key}`}
        type="text"
        value={values[key]}
        onChange={set(key)}
        placeholder={options.placeholder}
        autoComplete={options.autoComplete}
        inputMode={options.inputMode}
        maxLength={options.maxLength}
        className={errors[key] ? styles.invalid : undefined}
        aria-required={options.required !== false || undefined}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `address-${key}-error` : undefined}
      />
      {errors[key] && <p className={styles.error} id={`address-${key}-error`} role="alert">{errors[key]}</p>}
    </>
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
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.98 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: easeOutExpo }}
      >
        <section className={styles.list} aria-labelledby="my-addresses-title" data-lenis-prevent>
          <h2 id="my-addresses-title">My Addresses</h2>
          <p className={styles.sub}>Manage your delivery addresses for a faster checkout.</p>
          <div role="radiogroup" aria-label="Choose the delivery address" className={styles.cards}>
            {addresses.map((address, index) => {
              const selected = address.id === selectedId;
              return (
                <motion.div key={address.id} layout className={`${styles.card} ${selected ? styles.cardSelected : ""} ${editId === address.id ? styles.cardEditing : ""}`} {...stagger(index)}>
                  <label className={styles.cardMain}>
                    <input type="radio" name="dialog-address" checked={selected} onChange={() => onSelect(address.id)} />
                    <span className={styles.radio} aria-hidden="true" />
                    <span className={styles.cardText}>
                      <span className={styles.cardTitle}>
                        {address.label}
                        {address.isDefault && <span className={styles.badge}>Default</span>}
                      </span>
                      <span className={styles.cardName}>{address.name}</span>
                      <span className={styles.cardAddress}>{addressLines(address)}<br />{address.phone}</span>
                    </span>
                  </label>
                  <div className={styles.cardActions}>
                    <button type="button" className={styles.editButton} onClick={() => loadAddress(address)} aria-label={`Edit ${address.label} address`}><Pencil size={13} aria-hidden="true" /> Edit</button>
                    <div className={styles.menuWrap}>
                      <button type="button" className={styles.kebab} aria-haspopup="menu" aria-expanded={menuFor === address.id} aria-label={`More options for ${address.label}`} onClick={() => setMenuFor(menuFor === address.id ? null : address.id)}>
                        <span aria-hidden="true">⋮</span>
                      </button>
                      <AnimatePresence>
                        {menuFor === address.id && (
                          <motion.div
                            className={styles.menu}
                            role="menu"
                            initial={{ opacity: 0, scale: 0.92, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            transition={{ duration: reduceMotion ? 0 : 0.16 }}
                          >
                            <button type="button" role="menuitem" disabled={address.isDefault} onClick={() => { setMenuFor(null); void attempt(() => onSetDefault(address.id)); }}>Set as default</button>
                            <button type="button" role="menuitem" className={styles.danger} onClick={() => { setMenuFor(null); void attempt(() => onDelete(address.id)).then((done) => { if (done && editId === address.id) loadAddress(null); }); }}>Delete</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {!addresses.length && <p className={styles.empty}>No saved addresses yet. Add one on the right.</p>}
          </div>
        </section>

        <section className={styles.formPane} aria-label={editId ? "Edit address" : "Add new address"} data-lenis-prevent>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close address dialog"><X size={22} /></button>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={editId ?? "new"} initial={reduceMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -12 }} transition={{ duration: reduceMotion ? 0 : 0.2 }}>
              <h2 id="address-dialog-title">{editId ? "Edit Address" : "Add new Address"}</h2>
              <p className={styles.sub}>Update your address details below.</p>
            </motion.div>
          </AnimatePresence>

          <motion.form key={shake} className={styles.form} onSubmit={submit} noValidate animate={shake && !reduceMotion ? { x: [0, -8, 8, -5, 5, 0] } : undefined} transition={{ duration: 0.35 }}>
            <motion.fieldset className={styles.types} {...stagger(0)}>
              <legend>Address Type</legend>
              {typeOptions.map(({ type: option, note, Icon }) => (
                <label key={option} className={`${styles.type} ${type === option ? styles.typeActive : ""}`}>
                  <input type="radio" name="address-type" checked={type === option} onChange={() => setType(option)} />
                  <span className={styles.typeIcon} aria-hidden="true"><Icon size={14} /></span>
                  <span className={styles.typeText}><strong>{option}</strong><small>{note}</small></span>
                </label>
              ))}
            </motion.fieldset>

            <div className={styles.row}>
              <motion.div className={styles.field} {...stagger(1)}>{input("name", "Full Name", { placeholder: "Gaurav Kumar", autoComplete: "name" })}</motion.div>
              <motion.div className={styles.field} {...stagger(2)}>
                <label htmlFor="address-phone" className={styles.required}>Phone Number</label>
                <div className={`${styles.phone} ${errors.phone ? styles.invalid : ""}`}>
                  <span className={styles.country}>
                    <IndiaFlag />
                    <select aria-label="Country code" defaultValue="+91"><option value="+91">+91</option></select>
                    <ChevronDown size={12} aria-hidden="true" />
                  </span>
                  <input
                    id="address-phone"
                    type="text"
                    value={values.phone}
                    onChange={set("phone")}
                    placeholder="98765 43210"
                    autoComplete="tel-national"
                    inputMode="tel"
                    aria-required="true"
                    aria-invalid={errors.phone ? true : undefined}
                    aria-describedby={errors.phone ? "address-phone-error" : undefined}
                  />
                </div>
                {errors.phone && <p className={styles.error} id="address-phone-error" role="alert">{errors.phone}</p>}
              </motion.div>
            </div>

            <motion.div className={styles.field} {...stagger(3)}>
              <label htmlFor="address-pincode" className={styles.required}>Pincode</label>
              <div className={styles.pincodeRow}>
                <input
                  id="address-pincode"
                  type="text"
                  value={values.pincode}
                  onChange={(event) => { set("pincode")(event); setPincodeNote(""); }}
                  placeholder="530013"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={6}
                  className={errors.pincode ? styles.invalid : undefined}
                  aria-required="true"
                  aria-invalid={errors.pincode ? true : undefined}
                  aria-describedby={errors.pincode ? "address-pincode-error" : pincodeNote ? "address-pincode-note" : undefined}
                />
                <button type="button" className={styles.linkButton} onClick={checkPincode}>Check Pincode</button>
              </div>
              {errors.pincode && <p className={styles.error} id="address-pincode-error" role="alert">{errors.pincode}</p>}
              {pincodeNote && <p className={styles.note} id="address-pincode-note" role="status">{pincodeNote}</p>}
            </motion.div>

            <motion.div className={styles.field} {...stagger(4)}>{input("house", "House / Flat / Building No.", { placeholder: "50-1-16", autoComplete: "address-line1" })}</motion.div>
            <motion.div className={styles.field} {...stagger(5)}>{input("street", "Street / Area / Landmark", { placeholder: "Eenadu Main Road, near Sivalayam", autoComplete: "address-line2" })}</motion.div>

            <div className={styles.row3}>
              <motion.div className={styles.field} {...stagger(6)}>{input("city", "City", { placeholder: "Visakhapatnam", autoComplete: "address-level2" })}</motion.div>
              <motion.div className={styles.field} {...stagger(7)}>
                <label htmlFor="address-state" className={styles.required}>State</label>
                <div className={styles.selectWrap}>
                  <select id="address-state" value={values.state} onChange={set("state")} className={errors.state ? styles.invalid : undefined} aria-required="true" aria-invalid={errors.state ? true : undefined} aria-describedby={errors.state ? "address-state-error" : undefined}>
                    <option value="">Select state</option>
                    {indianStates.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                  <ChevronDown size={18} aria-hidden="true" />
                </div>
                {errors.state && <p className={styles.error} id="address-state-error" role="alert">{errors.state}</p>}
              </motion.div>
              <motion.div className={styles.field} {...stagger(8)}>{input("label", "Address Type Label (Optional)", { required: false, placeholder: "e.g. Home, Office,", autoComplete: "off" })}</motion.div>
            </div>

            {actionError && <p className={styles.error} role="alert">{actionError}</p>}

            <motion.div className={styles.footer} {...stagger(9)}>
              <label className={styles.defaultToggle}>
                <input type="checkbox" checked={makeDefault} onChange={(event) => setMakeDefault(event.target.checked)} />
                <span className={styles.box} aria-hidden="true" />
                <span>
                  Set as default address
                  <small>This address will be selected by default at checkout.</small>
                </span>
              </label>
              <div className={styles.buttons}>
                <button type="button" className={styles.cancel} onClick={onClose}>Cancel</button>
                <button type="submit" className={styles.save} disabled={busy}>{busy ? "Saving…" : "Save Address"}</button>
              </div>
            </motion.div>
          </motion.form>
        </section>
      </motion.div>
    </motion.div>
  );
}
