"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader/SiteHeader";
import { WhyPratyangi } from "@/components/sections/WhyPratyangi/WhyPratyangi";
import { ProductCard } from "@/components/ui/ProductCard/ProductCard";
import { useBag } from "@/lib/bag";
import { coupons, freeShippingThreshold } from "@/lib/checkout";
import { discountPercent, findProduct, formatInr, homeProducts } from "@/lib/catalog";
import styles from "./bag.module.css";

const shippingFee = 99;

export function BagView() {
  const bag = useBag();
  const [couponOpen, setCouponOpen] = useState(true);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [status, setStatus] = useState("");

  const items = bag.lines.flatMap((line) => {
    const product = findProduct(line.id);
    return product ? [{ ...line, product }] : [];
  });
  const subtotal = items.reduce((total, item) => total + item.product.priceInr * item.quantity, 0);
  const discount = appliedCoupon ? Math.round(subtotal * coupons[appliedCoupon]) : 0;
  const shipping = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const total = subtotal - discount + shipping;
  const itemLabel = `${bag.count} ${bag.count === 1 ? "item" : "items"}`;

  const applyCoupon = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponMessage("Please enter a coupon code.");
    } else if (coupons[code]) {
      setAppliedCoupon(code);
      try { window.localStorage.setItem("pratyangi-demo-coupon", code); } catch { /* storage unavailable: the coupon simply is not carried over */ }
      setCouponMessage(`${code} applied — ${coupons[code] * 100}% off your subtotal.`);
    } else {
      setAppliedCoupon(null);
      try { window.localStorage.removeItem("pratyangi-demo-coupon"); } catch { /* ignore */ }
      setCouponMessage(`${code} is not a valid coupon code.`);
    }
  };

  const moveToWishlist = (id: string, name: string) => {
    bag.remove(id);
    setStatus(`${name} moved to your wishlist (local demo only).`);
  };

  const addRecommended = (id: string) => {
    bag.add(id);
    setStatus("Added to your bag.");
  };

  return (
    <main className={styles.page}>
      <div className={styles.announcement}>
        <p>Free Shipping on Orders Above ₹1,999 &nbsp; | &nbsp; Easy Returns &nbsp; | &nbsp; Authentic Handlooms</p>
        <p className={styles.announcementLinks}>Track Order &nbsp; | &nbsp; Help &nbsp; | &nbsp; Store Locator</p>
      </div>
      <SiteHeader bagCount={bag.count} />

      <section className={styles.bag} aria-labelledby="bag-title">
        <div className={styles.intro}>
          <div className={styles.titleRow}>
            <h1 id="bag-title">Your Bag <span>({itemLabel})</span></h1>
            <Link className={styles.continue} href="/new-arrivals">
              <Image src="/images/figma/arrow-left.svg" alt="" width={20} height={20} />
              Continue Shopping
            </Link>
          </div>
          <p>{items.length ? "Great choice! These beautiful pieces are waiting for you." : "Your bag is empty — discover something beautiful."}</p>
        </div>

        {bag.message && <p className={styles.status} role="status">{bag.message}</p>}
        {status && <p className={styles.status} role="status">{status}</p>}

        <div className={styles.layout}>
          <div className={styles.items}>
            {bag.ready && items.length === 0 && (
              <div className={styles.empty}>
                <p>There are no sarees in your bag yet.</p>
                <Link href="/new-arrivals">Shop New Arrivals</Link>
              </div>
            )}
            {items.map(({ product, quantity }) => (
              <article className={styles.item} key={product.id}>
                <div className={styles.photo}>
                  <Image src={product.image} alt={product.name} fill sizes="204px" style={{ objectPosition: product.imagePosition ?? "center top" }} />
                </div>
                <div className={styles.info}>
                  <div className={styles.details}>
                    <h2>{product.name}</h2>
                    <p>{product.subtitle}</p>
                  </div>
                  <div className={styles.tags}>
                    <span className={styles.tagGold}>{product.tags[0]}</span>
                    <span className={styles.tagRose}>{product.tags[1]}</span>
                  </div>
                  <p className={styles.size}>Size: Free Size &nbsp; | &nbsp; Saree Length: 5.5 m</p>
                  <div className={styles.actions}>
                    <div className={styles.quantity} role="group" aria-label={`Quantity for ${product.name}`}>
                      <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => bag.setQuantity(product.id, quantity - 1)}>−</button>
                      <output aria-live="polite">{quantity}</output>
                      <button type="button" aria-label="Increase quantity" disabled={quantity >= bag.maxQuantity} onClick={() => bag.setQuantity(product.id, quantity + 1)}>+</button>
                    </div>
                    <div className={styles.secondary}>
                      <button type="button" onClick={() => moveToWishlist(product.id, product.name)}>
                        <Image src="/images/figma/wishlist-heart.svg" alt="" width={22} height={22} />
                        Move to Wishlist
                      </button>
                      <button type="button" onClick={() => bag.remove(product.id)}>
                        <Image src="/images/figma/trash.svg" alt="" width={19} height={19} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                <div className={styles.price}>
                  <strong>{formatInr(product.priceInr * quantity)}</strong>
                  <del>{formatInr(product.compareAtInr * quantity)}</del>
                  <span>{discountPercent(product)}% OFF</span>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.panels}>
            <div className={styles.summary}>
              <h2>Order Summary</h2>
              <dl className={styles.breakdown}>
                <div><dt>Subtotal ({itemLabel})</dt><dd>{formatInr(subtotal)}</dd></div>
                <div><dt>Discount{appliedCoupon ? ` (${appliedCoupon})` : ""}</dt><dd className={styles.positive}>- {formatInr(discount)}</dd></div>
                <div>
                  <dt>Shipping <span title={`Free shipping on orders above ${formatInr(freeShippingThreshold)}`}>ⓘ</span></dt>
                  <dd className={styles.positive}>{shipping ? formatInr(shipping) : "FREE"}</dd>
                </div>
              </dl>
              <hr />
              <div className={styles.total}><span>Total Amount</span><strong>{formatInr(total)}</strong></div>
              {items.length ? (
                <Link className={styles.checkout} href="/checkout">
                  Proceed to Checkout
                  <Image src="/images/figma/checkout-arrow.svg" alt="" width={27} height={27} />
                </Link>
              ) : (
                <button type="button" className={styles.checkout} disabled>
                  Proceed to Checkout
                  <Image src="/images/figma/checkout-arrow.svg" alt="" width={27} height={27} />
                </button>
              )}
              <div className={styles.assurance}>
                <p className={styles.secure}><Image src="/images/figma/lock-keyhole.svg" alt="" width={18} height={18} />Secure Checkout</p>
                <p>100% Secure Payments &nbsp; | &nbsp; Easy Returns<br />Order Tracking</p>
              </div>
            </div>

            <div className={styles.coupon}>
              <button type="button" className={styles.couponHeading} aria-expanded={couponOpen} aria-controls="coupon-form" onClick={() => setCouponOpen(!couponOpen)}>
                <span><Image src="/images/figma/badge-percent.svg" alt="" width={22} height={22} />Have a Coupon Code?</span>
                <Image className={styles.couponChevron} src="/images/figma/chevron-up.svg" alt="" width={18} height={18} />
              </button>
              {couponOpen && (
                <form id="coupon-form" className={styles.couponForm} onSubmit={applyCoupon}>
                  <label className={styles.srOnly} htmlFor="coupon-code">Coupon code</label>
                  <input id="coupon-code" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Enter coupon code" autoComplete="off" />
                  <button type="submit">Apply</button>
                </form>
              )}
              {couponOpen && couponMessage && <p className={styles.couponMessage} role="status">{couponMessage}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.recommended} aria-labelledby="recommended-title">
        <div className={styles.recommendedIntro}>
          <h2 id="recommended-title">You May Also Like</h2>
          <p>Complete your look with these beautiful sarees</p>
        </div>
        <div className={styles.recommendedGrid}>
          {homeProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              revealIndex={index}
              id={product.id}
              title={product.name}
              imageSrc={product.image}
              priceInr={product.priceInr}
              compareAtInr={product.compareAtInr}
              onAddToCart={addRecommended}
            />
          ))}
        </div>
      </section>

      <WhyPratyangi />
      <SiteFooter />
    </main>
  );
}
