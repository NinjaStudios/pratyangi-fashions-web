"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, Check, ChevronDown, CreditCard, Info, LockKeyhole, MapPin, Pencil, ShieldCheck, Ticket, Trash2, Truck } from "lucide-react";
import { AddressDialog } from "@/components/checkout/AddressDialog";
import { SiteFooter } from "@/components/layout/SiteFooter/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader/SiteHeader";
import { useSession } from "@/lib/auth";
import { useBag } from "@/lib/bag";
import { findProduct, formatInr } from "@/lib/catalog";
import { addressLines, coupons, deliveryOptions, demoAddresses, type SavedAddress } from "@/lib/checkout";
import { easeOutExpo } from "@/lib/motion/presets";
import styles from "./checkout.module.css";

const steps = ["Delivery", "Payment", "Review & Place Order"];
const quantities = Array.from({ length: 10 }, (_, index) => index + 1);
const paymentMethods = [
  { id: "upi", name: "UPI", note: "Pay with GPay, PhonePe or any UPI app" },
  { id: "card", name: "Credit / Debit card", note: "Visa, Mastercard and RuPay" },
  { id: "netbanking", name: "Net banking", note: "All major Indian banks" },
  { id: "cod", name: "Cash on delivery", note: "Pay when your order arrives" },
];

export function CheckoutView() {
  const bag = useBag();
  const router = useRouter();
  const session = useSession();
  const reduceMotion = useReducedMotion();
  const [addresses, setAddresses] = useState<SavedAddress[]>(demoAddresses);
  const [addressId, setAddressId] = useState(demoAddresses[0].id);
  const [deliveryId, setDeliveryId] = useState<"standard" | "express">("standard");
  // null = closed; { address: null } = adding a new address; { address } = editing that one
  const [dialog, setDialog] = useState<{ address: SavedAddress | null } | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [status, setStatus] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentId, setPaymentId] = useState("upi");

  // checkout needs an account: signed-out visitors go to sign in and come straight back
  useEffect(() => {
    if (session.ready && !session.user) router.replace("/login?next=/checkout");
  }, [session.ready, session.user, router]);

  const items = bag.lines.flatMap((line) => {
    const product = findProduct(line.id);
    return product ? [{ ...line, product }] : [];
  });
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.product.priceInr * item.quantity, 0);
  const discount = appliedCoupon ? Math.round(subtotal * coupons[appliedCoupon]) : 0;
  const standardFee = 0;
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

  // a coupon applied in the bag carries over
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("pratyangi-demo-coupon");
      if (saved && coupons[saved]) {
        setAppliedCoupon(saved);
        setCouponInput(saved);
        setCouponMessage(`${saved} applied — ${Math.round(coupons[saved] * 100)}% off your subtotal.`);
      }
    } catch { /* storage unavailable */ }
  }, []);

  const saveAddress = (saved: Omit<SavedAddress, "id"> & { id?: string }) => {
    const id = saved.id ?? `new-${Date.now()}`;
    const next: SavedAddress = { ...saved, id };
    setAddresses((current) => {
      const others = current.filter((address) => address.id !== id).map((address) => (next.isDefault ? { ...address, isDefault: false } : address));
      // an edited address stays where it was in the list; a new one goes to the end
      const index = current.findIndex((address) => address.id === id);
      return index === -1 ? [...others, next] : [...others.slice(0, index), next, ...others.slice(index)];
    });
    setAddressId(id);
    setDialog(null);
    setStatus(saved.id ? "Address updated." : "Address saved and selected for delivery.");
  };

  const removeAddress = (id: string) => {
    const remaining = addresses.filter((address) => address.id !== id);
    setAddresses(remaining);
    if (addressId === id) setAddressId(remaining[0]?.id ?? "");
  };

  const makeDefault = (id: string) => setAddresses((current) => current.map((address) => ({ ...address, isDefault: address.id === id })));

  const chosenAddress = addresses.find((address) => address.id === addressId);
  const chosenDelivery = deliveryOptions.find((option) => option.id === deliveryId);
  const chosenPayment = paymentMethods.find((method) => method.id === paymentId);

  const goTo = (next: 1 | 2 | 3) => {
    setStatus("");
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const proceed = () => {
    if (step === 1) {
      if (!chosenAddress) setStatus("Please choose or add a delivery address first.");
      else goTo(2);
    } else if (step === 2) {
      goTo(3);
    } else {
      setStatus("Placing orders is not available in this local demo — no order or payment was created.");
    }
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
              <li key={label} className={index + 1 <= step ? styles.stepActive : undefined} aria-current={index + 1 === step ? "step" : undefined}>
                <span className={styles.stepNumber}>{index + 1 < step ? <Check size={16} aria-hidden="true" /> : index + 1}</span>
                <span className={styles.stepLabel}>{label}</span>
              </li>
            ))}
          </ol>
        </div>

        {status && <p className={styles.status} role="status">{status}</p>}

        <div className={styles.layout}>
          <div className={styles.main}>
            {step === 1 && (<>
            <motion.section className={styles.card} aria-labelledby="address-title" {...reveal(0.05)}>
              <div className={styles.cardHeading}>
                <MapPin className={styles.cardIcon} size={28} strokeWidth={1.5} aria-hidden="true" />
                <div className={styles.cardTitle}>
                  <h2 id="address-title">Delivery Address</h2>
                  <p>Where should we deliver your order?</p>
                </div>
                <button type="button" className={styles.addAddress} aria-haspopup="dialog" onClick={() => setDialog({ address: null })}>
                  <span aria-hidden="true">+</span> Add New Address
                </button>
              </div>

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
                          <span className={styles.addressText}>{addressLines(address)}<br />{address.phone}</span>
                        </span>
                      </label>
                      <div className={styles.addressActions}>
                        <button type="button" onClick={() => setDialog({ address })}><Pencil size={15} aria-hidden="true" /> Edit</button>
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
            </>)}

            {step === 2 && (
              <motion.section className={styles.card} aria-labelledby="payment-title" {...reveal(0.05)}>
                <div className={styles.cardHeading}>
                  <CreditCard className={styles.cardIcon} size={28} strokeWidth={1.5} aria-hidden="true" />
                  <div className={styles.cardTitle}>
                    <h2 id="payment-title">Payment Method</h2>
                    <p>Choose how you would like to pay</p>
                  </div>
                </div>
                <div className={styles.deliveryChoices} role="radiogroup" aria-label="Payment methods">
                  {paymentMethods.map((method) => (
                    <label key={method.id} className={`${styles.deliveryChoice} ${method.id === paymentId ? styles.selectedDelivery : ""}`}>
                      <input type="radio" name="payment" checked={method.id === paymentId} onChange={() => setPaymentId(method.id)} />
                      <CreditCard size={28} strokeWidth={1.5} aria-hidden="true" />
                      <span className={styles.deliveryText}>
                        <span className={styles.deliveryTop}><strong>{method.name}</strong></span>
                        <span>{method.note}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <button type="button" className={styles.backLink} onClick={() => goTo(1)}>← Back to delivery</button>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section className={styles.card} aria-labelledby="review-title" {...reveal(0.05)}>
                <div className={styles.cardHeading}>
                  <BadgeCheck className={styles.cardIcon} size={28} strokeWidth={1.5} aria-hidden="true" />
                  <div className={styles.cardTitle}>
                    <h2 id="review-title">Review &amp; Place Order</h2>
                    <p>Check everything before you place your order</p>
                  </div>
                </div>
                <dl className={styles.reviewList}>
                  <div>
                    <dt>Delivering to</dt>
                    <dd>{chosenAddress ? `${chosenAddress.name} — ${addressLines(chosenAddress)}, ${chosenAddress.phone}` : "No address selected"}</dd>
                    <button type="button" onClick={() => goTo(1)}>Change</button>
                  </div>
                  <div>
                    <dt>Delivery</dt>
                    <dd>{chosenDelivery ? `${chosenDelivery.name} (${chosenDelivery.window})` : ""}</dd>
                    <button type="button" onClick={() => goTo(1)}>Change</button>
                  </div>
                  <div>
                    <dt>Payment</dt>
                    <dd>{chosenPayment?.name}</dd>
                    <button type="button" onClick={() => goTo(2)}>Change</button>
                  </div>
                </dl>
                <div className={styles.backLinks}>
                  <button type="button" className={styles.backLink} onClick={() => goTo(2)}>← Back to payment</button>
                  <button type="button" className={styles.backLink} onClick={() => goTo(1)}>← Back to delivery</button>
                </div>
              </motion.section>
            )}
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
                  <dt>Shipping Charges <Info size={14} aria-label={`Standard delivery is always free`} /></dt>
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
              {step === 1 ? "Proceed to Pay" : step === 2 ? "Review Order" : "Place Order"}
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

      <AnimatePresence>
        {dialog && (
          <AddressDialog
            addresses={addresses}
            selectedId={addressId}
            editing={dialog.address}
            onSelect={setAddressId}
            onSave={saveAddress}
            onDelete={removeAddress}
            onSetDefault={makeDefault}
            onClose={() => setDialog(null)}
            prefill={{ name: session.user?.name, phone: session.user?.phone }}
          />
        )}
      </AnimatePresence>

      <SiteFooter />
    </main>
  );
}
