"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { Hero } from "@/components/home/Hero/Hero";
import { SocialFeed } from "@/components/home/SocialFeed/SocialFeed";
import { TryOnSection } from "@/components/home/TryOnSection/TryOnSection";
import { ParallaxLayer } from "@/components/motion/ParallaxLayer";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { SiteFooter } from "@/components/layout/SiteFooter/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader/SiteHeader";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton/WhatsAppButton";
import { WhyPratyangi } from "@/components/sections/WhyPratyangi/WhyPratyangi";
import { ProductCard } from "@/components/ui/ProductCard/ProductCard";
import { useBag } from "@/lib/bag";
import { homeProducts } from "@/lib/catalog";
import { getWhatsAppHref, siteConfig, type SocialKey } from "@/lib/siteConfig";
import styles from "./page.module.css";

const categories = [
  { name: "Uppada", image: "/images/reference/category-uppada.png", position: "center 18%" },
  { name: "Banarasi", image: "/images/reference/category-banarasi.png", position: "center 12%" },
  { name: "Kanchipuram Pattu", image: "/images/reference/category-kanchipuram.png", position: "center 8%" },
  { name: "Dharmavaram", image: "/images/reference/category-dharmavaram.png", position: "center 15%" },
  { name: "Soft Silk", image: "/images/reference/category-soft-silk.png", position: "center 10%" },
  { name: "Bridal Sarees", image: "/images/reference/category-bridal.png", position: "center 12%" },
  { name: "Gadwal", image: "/images/figma/categories/gadwal.jpg", position: "center top" },
  { name: "Men's Ethnic Wear", image: "/images/figma/categories/mens-ethnic.jpg", position: "center top" },
  { name: "Jewellery & Accessories", image: "/images/figma/categories/jewellery.jpg", position: "center top" },
  { name: "Half Sarees", image: "/images/figma/categories/half-sarees.jpg", position: "center top" },
];

const collectionRows = [
  { title: "New Arrivals", id: "new-arrivals-row" },
  { title: "Wedding Collection", id: "wedding-collection" },
  { title: "Festive Collections", id: "festive-collections" },
  { title: "Best Sellers", id: "best-sellers" },
];
const reviewText = "Ordered and I am super impressed. The branded barcoded packaging ensures it's genuine. 📦✨";
const joinLinks: { name: string; key: SocialKey; icon: string; dark?: boolean }[] = [
  { name: "Instagram", key: "instagram", icon: "/images/figma/home/instagram.svg" },
  { name: "LinkedIn", key: "linkedin", icon: "/images/figma/home/linkedin.svg" },
  { name: "Twitter", key: "x", icon: "/images/figma/home/x.svg", dark: true },
  { name: "YouTube", key: "youtube", icon: "/images/figma/home/youtube.svg" },
  { name: "Facebook", key: "facebook", icon: "/images/figma/home/facebook.svg" },
];
const whatsappHref = getWhatsAppHref();
const socialsPending = joinLinks.some((platform) => !siteConfig.social[platform.key]);
const joinStrip = ["FASHION INSPIRATION", "REAL STORIES", "A STRONGER COMMUNITY"];

export default function HomePage() {
  const reduceMotion = useReducedMotion();
  const categoryTrack = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLElement>(null);
  // The hero is pinned, so the category section covers it by exactly the distance scrolled. Progress is that
  // distance over the hero's height (the category's offsetTop inside the layered wrapper): 0 at the top of the page,
  // 1 once the hero is fully covered. It drives the hero's recede and the heading's soft focus.
  const { scrollY } = useScroll();
  const coverProgress = useTransform(scrollY, (y) => {
    const heroHeight = categoryRef.current?.offsetTop ?? 0;
    return heroHeight > 0 ? Math.min(1, Math.max(0, y / heroHeight)) : 0;
  });
  const headingBlur = useTransform(coverProgress, [0.25, 0.5, 0.8], [0, reduceMotion ? 0 : 2.5, 0]);
  const headingFilter = useTransform(headingBlur, (value) => (value > 0.05 ? `blur(${value}px)` : "none"));
  const headingOpacity = useTransform(coverProgress, [0.25, 0.5, 0.8], [1, reduceMotion ? 1 : 0.7, 1]);
  const [categoryScroll, setCategoryScroll] = useState({ atStart: true, atEnd: false });
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const bag = useBag();

  const syncCategoryScroll = () => {
    const track = categoryTrack.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    setCategoryScroll({
      atStart: track.scrollLeft <= 2,
      atEnd: maxScroll <= 2 || track.scrollLeft >= maxScroll - 2,
    });
  };

  useEffect(() => {
    const track = categoryTrack.current;
    if (!track) return;
    syncCategoryScroll();
    track.addEventListener("scroll", syncCategoryScroll, { passive: true });
    const observer = new ResizeObserver(syncCategoryScroll);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", syncCategoryScroll);
      observer.disconnect();
    };
  }, []);

  const moveCategories = (direction: number) => {
    const track = categoryTrack.current;
    if (!track) return;
    const cards = track.querySelectorAll("a");
    const step = cards[0] ? cards[0].getBoundingClientRect().width : 248;
    const target = track.scrollLeft + direction * step;
    track.scrollTo({ left: target, behavior: reduceMotion ? "auto" : "smooth" });
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

  return (
    <main className={styles.page}>
      <SiteHeader bagCount={bag.count} />

      {/* Layered reveal: the hero is pinned behind while Shop by Category and the collections scroll up over it. */}
      <div className={styles.layered}>
      <Hero coverProgress={coverProgress} />

      <section className={styles.categorySection} id="categories" aria-label="Shop by category" ref={categoryRef}>
          <motion.div className={styles.categoryHeading} style={{ filter: headingFilter, opacity: headingOpacity }}>
            <h1>Shop by Category</h1>
          </motion.div>
          <div className={styles.categoryBand}>
            <div className={styles.categoryViewport}>
              <button className={`${styles.carouselArrow} ${styles.leftArrow}`} type="button" aria-label="Scroll categories left" disabled={categoryScroll.atStart} onClick={() => moveCategories(-1)}><ArrowLeft size={22} strokeWidth={2.2} /></button>
              <div className={styles.categoryTrack} ref={categoryTrack} tabIndex={0} aria-label="Categories, horizontally scrollable">
                {categories.map((category) => (
                  <a className={styles.categoryCard} key={category.name} href="#arrivals" aria-label={`Browse ${category.name}`}>
                    <div className={styles.categoryPhoto}>
                      <Image src={category.image} alt="" fill sizes="(max-width: 700px) 72vw, 250px" style={{ objectPosition: category.position }} />
                    </div>
                    <div className={styles.categoryLabel}>
                      <span>{category.name}</span>
                      <ChevronRight size={22} strokeWidth={2} aria-hidden="true" />
                    </div>
                  </a>
                ))}
              </div>
              <button className={`${styles.carouselArrow} ${styles.rightArrow}`} type="button" aria-label="Scroll categories right" disabled={categoryScroll.atEnd} onClick={() => moveCategories(1)}><ArrowRight size={22} strokeWidth={2.2} /></button>
            </div>
            <div className={styles.trackAccent} aria-hidden="true"><span /></div>
          </div>
      </section>

      <section className={styles.arrivalsSection} id="arrivals">
        {collectionRows.map((row, rowIndex) => (
          <ScrollReveal key={row.title} delay={rowIndex * 0.06} className={styles.collectionRow} id={row.id}>
            <div className={styles.sectionHeading}>
              <h2>{row.title}</h2>
              <a href="#arrivals" className={styles.seeAll}>See all <ChevronRight size={14} /></a>
            </div>
            <div className={styles.productGrid}>
              {homeProducts.map((product) => (
                <ProductCard
                  key={`${row.title}-${product.id}`}
                  id={product.id}
                  title={product.name}
                  imageSrc={product.image}
                  priceInr={product.priceInr}
                  compareAtInr={product.compareAtInr}
                  onAddToCart={bag.add}
                />
              ))}
            </div>
          </ScrollReveal>
        ))}
      </section>
      </div>

      <ScrollReveal>
        <section className={styles.reviewsSection} id="reviews">
          <div className={styles.sectionHeading}>
            <h2>Loved by our Customers</h2>
            <a href="#reviews" className={styles.seeAll}>See all <ChevronRight size={14} /></a>
          </div>
          <div className={styles.reviewGrid}>
            {[0, 1, 2, 3].map((item) => (
              <article className={styles.reviewCard} key={item}>
                <div className={styles.reviewImage}><Image src="/images/figma/home/review-pattern.jpg" alt="" fill sizes="(max-width: 700px) 74vw, 20vw" /></div>
                <div className={styles.stars} role="img" aria-label="5 out of 5 stars"><Image src="/images/figma/home/review-stars.svg" alt="" width={176} height={32} /></div>
                <p className={styles.reviewBrand}>TRADITION MEETS ELEGANCE</p>
                <p className={styles.reviewCopy}>{reviewText}</p>
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <TryOnSection bag={bag.lines.map((line) => line.id)} onAddToBag={bag.add} />

      <section className={styles.exclusiveSection} id="exclusives">
        <ScrollReveal className={styles.exclusiveOffers}>
          <h2>Exclusive Offers</h2>
          <div className={styles.offerGrid}>
            {[
              { icon: "20%", title: "Flat 20% Off", detail: <>On first order using code<br /><b>FIRST20</b></> },
              { icon: <Image src="/images/figma/home/offer-party.svg" alt="" width={48} height={48} />, title: "Festival Special", detail: <>Free blouse piece with every saree this season</> },
              { icon: <Image src="/images/figma/home/offer-discount.svg" alt="" width={48} height={48} />, title: "Flat 20% Off", detail: <>Extra 15% off on bridal collections above ₹15,000</> },
            ].map((offer, index) => (
              <article className={styles.offerCard} key={`${offer.title}-${index}`}>
                <span className={styles.offerMark}>{offer.icon}</span><h3>{offer.title}</h3><p>{offer.detail}</p>
                <button type="button" onClick={() => setOfferMessage(index === 0 ? "Local demo only — code FIRST20 is displayed but cannot be redeemed." : "Local demo only — this offer is not redeemable.")}>Claim Offer</button>
              </article>
            ))}
          </div>
          {offerMessage && <p className={styles.offerMessage} role="status">{offerMessage}</p>}
        </ScrollReveal>

        <ScrollReveal className={styles.socialStory} id="join">
          <div className={styles.socialCopy}>
            <span className={styles.eyebrow}>JOIN OUR WORLD <span aria-hidden="true" /></span>
            <h2>Where Tradition Meets <em>Tomorrow</em></h2>
            <p>Follow us for new collections, styling inspiration, behind-the-scenes moments, product videos and exclusive updates.</p>
            <div className={styles.socialLinks} aria-label="Social platforms">
              {joinLinks.map((platform) => {
                const href = siteConfig.social[platform.key];
                const content = (
                  <>
                    <span className={styles.socialName}>
                      <span className={platform.dark ? styles.socialIconDark : styles.socialIcon}>
                        <Image src={platform.icon} alt="" width={20} height={20} />
                      </span>
                      {platform.name}
                    </span>
                    <ChevronRight size={14} />
                  </>
                );
                return href ? (
                  <a key={platform.name} href={href} target="_blank" rel="noopener noreferrer">{content}</a>
                ) : (
                  <button key={platform.name} type="button" disabled title={`${platform.name} link is pending configuration`}>{content}</button>
                );
              })}
            </div>
            {whatsappHref ? (
              <a className={styles.whatsapp} href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <Image src="/images/figma/home/whatsapp.svg" alt="" width={24} height={24} />
                Chat on Whatsapp
              </a>
            ) : (
              <button className={styles.whatsapp} type="button" disabled title="WhatsApp number is pending configuration">
                <Image src="/images/figma/home/whatsapp.svg" alt="" width={24} height={24} />
                Chat on Whatsapp
              </button>
            )}
            {(socialsPending || !whatsappHref) && <p className={styles.socialDemo}>Social links and WhatsApp are pending configuration.</p>}
            <div className={styles.joinStrip}>
              <p>BE A PART OF OUR STORY</p>
              <ul>
                {joinStrip.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
          <div className={styles.portrait}>
            <ParallaxLayer className={styles.portraitLayer} range={3}>
              <Image src="/images/figma/home/join-background.png" alt="Woman in an embroidered sheer saree, looking over her shoulder" fill sizes="(max-width: 700px) 100vw, 60vw" />
            </ParallaxLayer>
          </div>
        </ScrollReveal>
      </section>

      <SocialFeed />

      <div className={styles.whyWrap}>
        <WhyPratyangi id="why-pratyangi" />
      </div>

      <ScrollReveal>
        <section className={styles.newsletter} id="newsletter">
          <div className={styles.newsletterContent}>
            <h2>Step into the <strong>PRATYANGI FASHIONS</strong> circle</h2>
            <form className={styles.newsletterForm} onSubmit={submitNewsletter}>
              <label className={styles.srOnly} htmlFor="newsletter-email">Your email address</label>
              <input id="newsletter-email" type="email" required placeholder="Enter your Email address" value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} />
              <button type="submit">Subscribe</button>
            </form>
            <p className={styles.newsletterNote} aria-live="polite">{newsletterMessage || "Get exclusive offers, new arrivals and styling tips delivered to you every week."}</p>
            <p className={styles.localNotice}>Local demo only — no subscription is sent.</p>
          </div>
        </section>
      </ScrollReveal>

      <SiteFooter />
      <WhatsAppButton />
    </main>
  );
}
