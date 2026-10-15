"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronRight, X } from "lucide-react";
import { CustomerReviews } from "@/components/home/CustomerReviews/CustomerReviews";
import { ExclusiveOffers } from "@/components/home/ExclusiveOffers/ExclusiveOffers";
import { Hero } from "@/components/home/Hero/Hero";
import { JoinOurWorld } from "@/components/home/JoinOurWorld/JoinOurWorld";
import { SocialVideos } from "@/components/home/SocialVideos/SocialVideos";
import { TryOnShowcase } from "@/components/home/TryOnShowcase/TryOnShowcase";
import { SiteFooter } from "@/components/layout/SiteFooter/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader/SiteHeader";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { WhyPratyangi } from "@/components/sections/WhyPratyangi/WhyPratyangi";
import { ProductCard } from "@/components/ui/ProductCard/ProductCard";
import { useBag } from "@/lib/bag";
import { findProduct, formatRs, homeProducts as products } from "@/lib/catalog";
import { easeOutExpo } from "@/lib/motion/presets";
import styles from "./page.module.css";

const categories = [
  { name: "Uppada", image: "/images/reference/category-uppada.png", position: "center 18%" },
  { name: "Banarasi", image: "/images/reference/category-banarasi.png", position: "center 12%" },
  { name: "Kanchipuram Pattu", image: "/images/reference/category-kanchipuram.png", position: "center 8%" },
  { name: "Dharmavaram", image: "/images/reference/category-dharmavaram.png", position: "center 15%" },
  { name: "Soft Silk", image: "/images/reference/category-soft-silk.png", position: "center 10%" },
  { name: "Bridal Sarees", image: "/images/reference/category-bridal.png", position: "center 12%" },
];

const collectionRows = [
  { title: "New Arrivals", id: "new-arrivals" },
  { title: "Wedding Collection", id: "wedding-collection" },
  { title: "Festive Collections", id: "festive-collections" },
  { title: "Best Sellers", id: "best-sellers" },
];

export default function HomePage() {
  const reduceMotion = useReducedMotion();
  const categoryTrack = useRef<HTMLDivElement>(null);
  const bag = useBag();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const heroScene = useRef<HTMLDivElement>(null);
  const heroPin = useRef<HTMLDivElement>(null);
  const sceneProgress = useMotionValue(0);
  const headingOpacity = useTransform(sceneProgress, [0.3, 0.75], [0, 1]);
  const headingY = useTransform(sceneProgress, [0.3, 0.75], [14, 0]);
  const veilOpacity = useTransform(sceneProgress, [0.05, 0.8], [0, 1]);

  useEffect(() => {
    const scene = heroScene.current;
    const pin = heroPin.current;
    if (!scene || !pin) return;
    const update = () => {
      scene.parentElement?.style.setProperty("--hero-h", `${pin.offsetHeight}px`);
      const travel = scene.offsetHeight - pin.offsetHeight;
      const pinTop = parseFloat(getComputedStyle(pin).top) || 0;
      const progress = travel > 0 ? (pinTop - scene.getBoundingClientRect().top) / travel : 1;
      sceneProgress.set(Math.min(1, Math.max(0, progress)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    observer.observe(pin);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [sceneProgress]);

  useEffect(() => {
    const track = categoryTrack.current;
    if (!track) return;
    const setWidth = () => {
      const cards = track.querySelectorAll<HTMLElement>("a");
      return cards[categories.length] ? cards[categories.length].offsetLeft - cards[0].offsetLeft : 0;
    };
    const recenter = () => {
      const width = setWidth();
      if (!width) return;
      if (track.scrollLeft < width * 0.5) track.scrollLeft += width;
      else if (track.scrollLeft >= width * 1.5) track.scrollLeft -= width;
    };
    track.scrollLeft = setWidth();
    let settle = 0;
    const onScroll = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(recenter, 140);
    };
    const onResize = () => {
      const width = setWidth();
      if (width) track.scrollLeft = width + (track.scrollLeft % width);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(onResize);
    observer.observe(track);
    return () => {
      window.clearTimeout(settle);
      track.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const moveCategories = (direction: number) => {
    const track = categoryTrack.current;
    if (!track) return;
    const card = track.querySelector("a");
    const step = card ? card.getBoundingClientRect().width - 2 : 248;
    track.scrollBy({ left: direction * step, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const addToBag = (productId: string) => {
    bag.add(productId);
    setCartOpen(true);
  };

  const submitNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newsletterEmail.trim()) {
      setNewsletterMessage("Please enter your email address.");
      return;
    }
    setNewsletterMessage("Thanks for joining us — this is a local demo, no subscription was sent.");
    setNewsletterEmail("");
  };

  const scrollToTryOn = () => {
    document.getElementById("try-on")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <main className={styles.page}>
      <SiteHeader bagCount={bag.count} />

      <div className={styles.heroCategory}>
      <div className={styles.heroScene} ref={heroScene}>
        <div className={styles.heroPin} ref={heroPin}>
          <Hero onTryLook={scrollToTryOn} progress={sceneProgress} />
          <motion.div className={styles.heroVeil} style={{ opacity: veilOpacity }} aria-hidden="true" />
          <motion.div className={styles.sceneHeading} style={{ opacity: headingOpacity, y: headingY }}>
            <h1 id="shop-by-category">Shop by Category</h1>
          </motion.div>
        </div>
      </div>

      <section className={styles.categorySection} id="categories" aria-labelledby="shop-by-category">
        <div className={styles.categoryBand}>
          <div className={styles.categoryViewport}>
            <button className={`${styles.carouselArrow} ${styles.leftArrow}`} type="button" aria-label="Scroll categories left" onClick={() => moveCategories(-1)}><ArrowLeft size={22} strokeWidth={2.2} /></button>
            <div className={styles.categoryTrack} ref={categoryTrack} tabIndex={0} aria-label="Categories, horizontally scrollable">
              {[0, 1, 2].flatMap((copy) => categories.map((category) => (
                <Link
                  className={styles.categoryCard}
                  key={`${copy}-${category.name}`}
                  href="/new-arrivals"
                  aria-label={`Browse ${category.name}`}
                  aria-hidden={copy !== 1 || undefined}
                  tabIndex={copy !== 1 ? -1 : undefined}
                >
                  <div className={styles.categoryPhoto}>
                    <Image src={category.image} alt="" fill sizes="(max-width: 700px) 72vw, 250px" style={{ objectPosition: category.position }} />
                  </div>
                  <div className={styles.categoryLabel}>
                    <span>{category.name}</span>
                    <ChevronRight size={22} strokeWidth={2} aria-hidden="true" />
                  </div>
                </Link>
              )))}
            </div>
            <button className={`${styles.carouselArrow} ${styles.rightArrow}`} type="button" aria-label="Scroll categories right" onClick={() => moveCategories(1)}><ArrowRight size={22} strokeWidth={2.2} /></button>
          </div>
          <div className={styles.trackAccent} aria-hidden="true"><span /></div>
        </div>
      </section>
      </div>

      <section className={styles.arrivalsSection} id="arrivals">
        {collectionRows.map((row, rowIndex) => (
          <ScrollReveal key={row.id} delay={rowIndex * 0.06} className={styles.collectionRow} id={row.id}>
            <div className={styles.sectionHeading}>
              <h2>{row.title}</h2>
              <Link href="/new-arrivals" className={styles.seeAll}>See all <ChevronRight size={14} /></Link>
            </div>
            <div className={styles.productGrid}>
              {products.map((product, productIndex) => (
                <ProductCard
                  key={`${row.id}-${productIndex}`}
                  id={product.id}
                  title={product.name}
                  imageSrc={product.image}
                  priceInr={product.priceInr}
                  compareAtInr={product.compareAtInr}
                  onAddToCart={() => addToBag(product.id)}
                />
              ))}
            </div>
          </ScrollReveal>
        ))}
      </section>

      <CustomerReviews />
      <TryOnShowcase />
      <ExclusiveOffers />
      <JoinOurWorld />
      <SocialVideos />

      <div className={styles.benefitsSection}>
        <WhyPratyangi id="why-pratyangi" />
      </div>

      <ScrollReveal>
      <section className={styles.newsletter} id="newsletter">
        <div className={styles.newsletterContent}>
          <h2>Step into the <strong>PRATYANGI FASHIONS</strong> circle</h2>
          <form className={styles.newsletterForm} onSubmit={submitNewsletter}>
            <label className={styles.srOnly} htmlFor="newsletter-email">Your email address</label>
            <input id="newsletter-email" type="email" required placeholder="Enter your Email address" value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} />
            <button type="submit">Subscribe <ArrowRight size={15} /></button>
          </form>
          <p className={styles.newsletterNote} aria-live="polite">{newsletterMessage || "Get exclusive offers, new arrivals and styling tips delivered to you every week."}</p>
          <p className={styles.localNotice}>Local demo only — no subscription is sent.</p>
        </div>
      </section>
      </ScrollReveal>

      <SiteFooter />

      <AnimatePresence>
      {cartOpen && (
        <motion.div
          className={styles.scrim}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}
        >
          <motion.section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label="Your bag"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: easeOutExpo }}
          >
            <button type="button" className={styles.closeButton} onClick={() => setCartOpen(false)} aria-label="Close panel"><X size={20} /></button>
            <h2>Added to your bag</h2>
            <p className={styles.dialogNote}>This bag is stored in this browser for demo purposes only. Checkout, orders, and payments are not available.</p>
            {bag.message && <p className={styles.dialogNote} role="status">{bag.message}</p>}
            {bag.lines.length === 0 ? <p className={styles.emptyState}>Your bag is empty.</p> : (
              <ul className={styles.cartItems}>
                {bag.lines.map((line) => {
                  const product = findProduct(line.id);
                  if (!product) return null;
                  return (
                    <li key={product.id}>
                      <span>{product.name}<br /><small>{formatRs(product.priceInr)} × {line.quantity}</small></span>
                      <button type="button" onClick={() => bag.remove(product.id)} aria-label={`Remove ${product.name} from bag`}>Remove</button>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link className={styles.viewBag} href="/bag">View Bag <ArrowRight size={15} /></Link>
          </motion.section>
        </motion.div>
      )}
      </AnimatePresence>
    </main>
  );
}
