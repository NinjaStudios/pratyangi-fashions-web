"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import styles from "./TryOnShowcase.module.css";

const natural = { width: "auto", height: "auto" } as const;

const icon = (name: string) => `/images/figma/home/${name}`;

const features = [
  { label: "Private & Secure", icon: "try-private.svg", width: 20, height: 22.5 },
  { label: "Realistic Preview", icon: "try-realistic.svg", width: 21.5, height: 21.5 },
  { label: "Shop with Confidence", icon: "try-shop-small.svg", width: 18, height: 22 },
];

const steps = [
  { title: "Upload Photo", text: "Add a clear full-body photo", icon: "try-upload.svg", width: 32, height: 32 },
  { title: "Choose a Saree", text: "Select from eligible collections", icon: "try-dress.svg", width: 32, height: 32 },
  { title: "AI Try-On", text: "See your look instantly", icon: "try-sparkles.svg", width: 32, height: 32 },
  { title: "Shop with Confidence", text: "Save or add your favourite to bag", icon: "try-shop.svg", width: 23.3333, height: 28.6667 },
];

const tiers = [
  {
    name: "Silver", status: "AVAILABLE", detail: "Try all our beautiful silver sarees today.", progress: "Available to all",
    image: "tier-silver.png", badge: "tier-tick.svg", badgeSize: [32, 32], glow: null, available: true, tone: "silver",
  },
  {
    name: "Platinum", status: "UNLOCKABLE", detail: "Purchase a Silver saree to unlock Platinum Try-On.", progress: "Unlocked after a Silver purchase",
    image: "tier-platinum.png", badge: "tier-lock.svg", badgeSize: [21.875, 26.875], glow: "tier-glow-platinum.svg", available: false, tone: "platinum",
  },
  {
    name: "Gold", status: "NOT AVAILABLE FOR TRY-ON", detail: "Available for direct purchase only.", progress: "AI Try-On unavailable",
    image: "tier-gold.png", badge: "tier-block.svg", badgeSize: [27, 27], glow: "tier-glow-gold.svg", available: false, tone: "gold",
  },
] as const;

const demoMessage = "Illustrative demo only. Photo upload and AI try-on are not available yet.";

export function TryOnShowcase() {
  const [message, setMessage] = useState("");

  return (
    <section className={styles.section} id="try-on" aria-labelledby="try-on-title">
      <h2 className={styles.title} id="try-on-title">Try on using AI</h2>

      <div className={styles.panel}>
        <div className={styles.intro}>
          <p className={styles.kicker}>TRY BEFORE YOU BUY <span aria-hidden="true" /></p>
          <h3>See the Saree on You</h3>
          <p className={styles.lead}>Upload your photo and preview selected handcrafted sarees before you buy.</p>
          <button className={styles.primary} type="button" onClick={() => setMessage(demoMessage)}>
            Try AI Now <Image src={icon("try-arrow.svg")} alt="" width={20} height={20} style={natural} />
          </button>
          <ul className={styles.features}>
            {features.map((feature) => (
              <li key={feature.label}>
                <Image src={icon(feature.icon)} alt="" width={feature.width} height={feature.height} style={natural} />
                {feature.label}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.compare} aria-label="Example before and after try-on preview">
          <figure>
            <Image src={icon("try-your-photo.png")} alt="Customer photo before try-on" fill sizes="(max-width: 700px) 45vw, 205px" />
            <figcaption>Your Photo</figcaption>
            <span className={styles.share}><Image src={icon("try-share-small.svg")} alt="" width={18} height={18} style={natural} /></span>
          </figure>
          <figure>
            <Image src={icon("try-ai-result.png")} alt="The same customer wearing a maroon silk saree" fill sizes="(max-width: 700px) 45vw, 205px" />
            <figcaption>AI Try-On</figcaption>
          </figure>
          <span className={styles.handle}><Image src={icon("try-compare.svg")} alt="" width={17.5} height={11.5} style={natural} /></span>
        </div>

        <div className={styles.how}>
          <h3>How it works</h3>
          <ol>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.stepIcon}><Image src={icon(step.icon)} alt="" width={step.width} height={step.height} style={natural} /></span>
                <span><strong>{step.title}</strong>{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className={styles.accessHeading}>
        <h2>Your Try-On Access</h2>
        <p>Your access depends on the collection you choose.</p>
      </div>
      <div className={styles.tiers}>
        {tiers.map((tier) => (
          <article className={`${styles.tier} ${styles[tier.tone]}`} key={tier.name}>
            <Image className={styles.tierImage} src={icon(tier.image)} alt="" fill sizes="(max-width: 900px) 100vw, 411px" />
            {tier.glow && <Image className={styles.tierGlow} src={icon(tier.glow)} alt="" width={626} height={626} aria-hidden="true" />}
            <span className={styles.tierBadge}><Image src={icon(tier.badge)} alt="" width={tier.badgeSize[0]} height={tier.badgeSize[1]} style={natural} /></span>
            <div className={styles.tierBody}>
              <h3>{tier.name}</h3>
              <span className={styles.status}>{tier.status}</span>
              <p>{tier.detail}</p>
              <button type="button" disabled={!tier.available} onClick={() => setMessage(demoMessage)}>
                Try Your Look <ArrowRight size={18} />
              </button>
            </div>
          </article>
        ))}
      </div>

      <h2 className={styles.title}>How your Try-On access grows</h2>
      <div className={styles.journey}>
        <ol>
          {tiers.map((tier, index) => (
            <li key={tier.name}>
              {index > 0 && <ArrowRight className={styles.journeyArrow} size={28} aria-hidden="true" />}
              <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
              <span className={`${styles.journeyIcon} ${styles[tier.tone]}`}><Image src={icon(tier.badge)} alt="" width={tier.badgeSize[0]} height={tier.badgeSize[1]} style={natural} /></span>
              <span><strong>{tier.name}</strong>{tier.progress}</span>
            </li>
          ))}
        </ol>
        <p>Purchase a Silver saree to unlock virtual Try-On for Silver and Platinum collections.</p>
      </div>
      <p className={styles.note} role="status">{message || "Illustrative frontend demo only. No photo upload, purchase verification, or AI request is available."}</p>
    </section>
  );
}
