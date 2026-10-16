"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, ChevronDown, Info, LockKeyhole, MapPin, Pencil, ShieldCheck, Ticket, Trash2, Truck } from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader/SiteHeader";
import { useBag } from "@/lib/bag";
import { findProduct, formatInr } from "@/lib/catalog";
import { coupons, deliveryOptions, demoAddresses, freeShippingThreshold, type SavedAddress } from "@/lib/checkout";
import { easeOutExpo } from "@/lib/motion/presets";
import styles from "./checkout.module.css";

const steps = ["Delivery", "Payment", "Review & Place Order"];
const quantities = Array.from({ length: 10 }, (_, index) => index + 1);
const emptyForm = { label: "Home", name: "", phone: "", lines: "" };
const standardShippingFee = 99;

export function CheckoutView() {
  const bag = useBag();
  const reduceMotion = useReducedMotion();
  const [addresses, setAddresses] = useState<SavedAddress[]>(demoAddresses);
  const [addressId, setAddressId] = useState(demoAddresses[0].id);
  const [deliveryId, setDeliveryId] = useState<"standard" | "express">("standard");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [status, setStatus] = useState("");

  const items = bag.lines.flatMap((line) => {
    const product = findProduct(line.id);
    return product ? [{ ...line, product }] : [];
  });
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.product.priceInr * item.quantity, 0);
  const discount = appliedCoupon ? Math.round(subtotal * coupons[appliedCoupon]) : 0;
  const standardFee = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : standardShippingFee;
  const expressFee = deliveryOptions.find((option) => option.id === "express")?.fee ?? 99;
  const feeFor = (id: string) => (id === "express" ? expressFee : standardFee);
  const shipping = subtotal === 0 ? 0 : feeFor(deliveryId);
  const total = subtotal - discount + shipping;
  const itemLabel = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;

  const applyCoupon = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponMessage("Please enter a coupon code.");
    } else if (coupons[code]) {
      setAppliedCoupon(code);
      setCouponMessage(`${code} applied — ${Math.round(coupons[code] * 100)}% off your subtotal.`);
    } else {
      setAppliedCoupon(null);
      setCouponMessage(`${code} is not a valid coupon code.`);
    }
  };

  const saveAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.lines.trim()) return;
    const created: SavedAddress = { id: `new-${Date.now()}`, label: form.label, name: form.name.trim(), phone: form.phone.trim(), lines: form.lines.trim() };
    setAddresses((current) => [...current, created]);
    setAddressId(created.id);
    setForm(emptyForm);
    setAdding(false);
  };

  const removeAddress = (id: string) => {
    const remaining = addresses.filter((address) => address.id !== id);
    setAddresses(remaining);
    if (addressId === id) setAddressId(remaining[0]?.id ?? "");
  };

  const proceed = () => {
    if (!addressId) setStatus("Please choose or add a delivery address first.");
    else setStatus("Payment is not available in this local demo — no order or payment was created.");
  };

  const reveal = (delay: number) => ({
    initial: reduceMotion ? false : ({ opacity: 0, y: 20 } as const),
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.55, ease: easeOutExpo, delay },
  });

  return (
    <main className={styles.page}>
      <div className={styles.announcement}>
        <p>Free Shipping on Orders Above ₹1,999 &nbsp; | &nbsp; Easy Returns &nbsp; | &nbsp; Authentic Handlooms</p>
        <p className={styles.announcementLinks}>Track Order &nbsp; | &nbsp; Help &nbsp; | &nbsp; Store Locator</p>
      </div>
      <SiteHeader bagCount={bag.count} />

      <section className={styles.workspace} aria-labelledby="checkout-title">
        <Image className={styles.ornament} src="/images/figma/heritage-lotus.svg" alt="" width={145} height={90} aria-hidden="true" />
        <div className={styles.top}>
          <div className={styles.heading}>
            <h1 id="checkout-title">Checkout</h1>
            <p>Complete your order in a few simple steps</p>
          </div>
          <ol className={styles.steps} aria-label="Checkout progress">
            {steps.map((label, index) => (
              <li key={label} className={index === 0 ? styles.stepActive : undefined} aria-current={index === 0 ? "step" : undefined}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <span className={styles.stepLabel}>{label}</span>
              </li>
            ))}
          </ol>
        </div>

        {status && <p className={styles.status} role="status">{status}</p>}

        <div className={styles.layout}>
          <div className={styles.main}>
            <motion.section className={styles.card} aria-labelledby="address-title" {...reveal(0.05)}>
              <div className={styles.cardHeading}>
                <MapPin className={styles.cardIcon} size={28} strokeWidth={1.5} aria-hidden="true" />
                <div className={styles.cardTitle}>
                  <h2 id="address-title">Delivery Address</h2>
                  <p>Where should we deliver your order?</p>
                </div>
                <button type="button" className={styles.addAddress} aria-expanded={adding} onClick={() => setAdding(!adding)}>
                  <span aria-hidden="true">+</span> Add New Address
                </button>
              </div>

              {adding && (
                <form className={styles.addressForm} onSubmit={saveAddress}>
                  <label>Address type
                    <select value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })}>
                      <option>Home</option><option>Office</option><option>Other</option>
                    </select>
                  </label>
                  <label>Full name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" required /></label>
                  <label>Phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} autoComplete="tel" inputMode="tel" required /></label>
                  <label className={styles.wide}>Address<textarea rows={3} value={form.lines} onChange={(event) => setForm({ ...form, lines: event.target.value })} autoComplete="street-address" required /></label>
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.primarySmall}>Save address</button>
                    <button type="button" className={styles.linkButton} onClick={() => setAdding(false)}>Cancel</button>
                  </div>
                </form>
              )}

              <div className={styles.addressList} role="radiogroup" aria-label="Saved addresses">
                {addresses.map((address) => {
                  const selected = address.id === addressId;
                  return (
                    <div key={address.id} className={`${styles.address} ${selected ? styles.selected : ""}`}>
                      <label className={styles.addressChoice}>
                        <input type="radio" name="address" checked={selected} onChange={() => setAddressId(address.id)} />
                        <span className={styles.radio} aria-hidden="true" />
                        <span className={styles.addressBody}>
                          <span className={styles.addressType}>
                            {address.label}
                            {address.isDefault && <span className={styles.badge}>DEFAULT</span>}
                          </span>
                          <span className={styles.recipient}>{address.name}</span>
                          <span className={styles.addressText}>{address.lines}<br />{address.phone}</span>
                        </span>
                      </label>
                      <div className={styles.addressActions}>
                        <button type="button" onClick={() => setStatus("Editing addresses is not available in this local demo.")}><Pencil size={15} aria-hidden="true" /> Edit</button>
                        <span aria-hidden="true" />
                        <button type="button" className={styles.deleteAction} onClick={() => removeAddress(address.id)}>Delete</button>
                      </div>
                    </div>
                  );
                })}
                {!addresses.length && <p className={styles.emptyNote}>No saved addresses yet — add one to continue.</p>}
              </div>
            </motion.section>

            <motion.section className={styles.card} aria-labelledby="delivery-title" {...reveal(0.12)}>
              <div className={styles.cardHeading}>
                <Truck className={styles.cardIcon} size={28} strokeWidth={1.5} aria-hidden="true" />
                <div className={styles.cardTitle}>
                  <h2 id="delivery-title">Delivery Options</h2>
                  <p>Choose a delivery option that works for you</p>
                </div>
              </div>
              <div className={styles.deliveryChoices} role="radiogroup" aria-label="Delivery options">
                {deliveryOptions.map((option) => {
                  const fee = subtotal === 0 ? 0 : feeFor(option.id);
                  return (
                    <label key={option.id} className={`${styles.deliveryChoice} ${option.id === deliveryId ? styles.selectedDelivery : ""}`}>
                      <input type="radio" name="delivery" checked={option.id === deliveryId} onChange={() => setDeliveryId(option.id)} />
                      <Truck size={28} strokeWidth={1.5} aria-hidden="true" />
                      <span className={styles.deliveryText}>
                        <span className={styles.deliveryTop}><strong>{option.name}</strong><b>{fee ? formatInr(fee) : "FREE"}</b></span>
                        <span>{option.window}</span>
                        <span>{option.note}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </motion.section>
          </div>

          <motion.aside className={`${styles.card} ${styles.summary}`} aria-labelledby="summary-title" {...reveal(0.18)}>
            <div className={styles.summaryHeading}>
              <h2 id="summary-title">Order Summary</h2>
              <p>{itemLabel} in your bag</p>
            </div>

            {bag.ready && !items.length ? (
              <div className={styles.emptyBag}>
                <p>Your bag is empty.</p>
                <Link href="/new-arrivals">Shop New Arrivals</Link>
              </div>
            ) : (
              <ul className={styles.lines}>
                {items.map(({ product, quantity }) => (
                  <li key={product.id} className={styles.line}>
                    <div className={styles.thumb}>
                      <Image src={product.image} alt={product.name} fill sizes="88px" style={{ objectPosition: product.imagePosition ?? "center top" }} />
                    </div>
                    <div className={styles.lineBody}>
                      <p className={styles.lineName}>{product.name}</p>
                      <p className={styles.lineSub}>{product.subtitle}</p>
                      <div className={styles.priceRow}>
                        <strong>{formatInr(product.priceInr * quantity)}</strong>
                        <label className={styles.qty}>
                          <span>Qty:</span>
                          <select value={quantity} aria-label={`Quantity for ${product.name}`} onChange={(event) => bag.setQuantity(product.id, Number(event.target.value))}>
                            {quantities.map((value) => <option key={value} value={value}>{value}</option>)}
                          </select>
                          <ChevronDown size={15} aria-hidden="true" />
                        </label>
                      </div>
                    </div>
                    <button type="button" className={styles.remove} aria-label={`Remove ${product.name}`} onClick={() => bag.remove(product.id)}>
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form className={styles.coupon} onSubmit={applyCoupon}>
              <p className={styles.couponTitle}><Ticket size={20} aria-hidden="true" /> Have a Coupon Code?</p>
              <div className={styles.couponRow}>
                <label className={styles.srOnly} htmlFor="checkout-coupon">Coupon code</label>
                <input id="checkout-coupon" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Enter coupon code" autoComplete="off" />
                <button type="submit">Apply</button>
              </div>
              {couponMessage && <p className={styles.couponMessage} role="status">{couponMessage}</p>}
            </form>

            <div className={styles.prices}>
              <h3>Price Details</h3>
              <dl>
                <div><dt>Subtotal ({itemLabel})</dt><dd>{formatInr(subtotal)}</dd></div>
                <div>
                  <dt>Shipping Charges <Info size={14} aria-label={`Standard shipping is free on orders above ${formatInr(freeShippingThreshold)}`} /></dt>
                  <dd className={shipping ? undefined : styles.positive}>{shipping ? formatInr(shipping) : "FREE"}</dd>
                </div>
                {appliedCoupon && <div><dt>Discount ({appliedCoupon})</dt><dd className={styles.positive}>- {formatInr(discount)}</dd></div>}
              </dl>
            </div>

            <div className={styles.total}>
              <p><span>Total Amount</span><strong>{formatInr(total)}</strong></p>
              <small>Inclusive of all taxes</small>
            </div>

            {discount > 0 && (
              <p className={styles.saving}><BadgeCheck size={22} aria-hidden="true" /> You are saving {formatInr(discount)} on this order!</p>
            )}

            <button type="button" className={styles.pay} disabled={!items.length} onClick={proceed}>
              <LockKeyhole size={20} aria-hidden="true" />
              Proceed to Pay
              <ArrowRight size={24} aria-hidden="true" />
            </button>
            <p className={styles.assurance}>
              <span><ShieldCheck size={17} aria-hidden="true" /> 100% Secure Payments</span>
              <span aria-hidden="true" className={styles.divider} />
              <span>Easy Returns within 7 days</span>
            </p>
          </motion.aside>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
