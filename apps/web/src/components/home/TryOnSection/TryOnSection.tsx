"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { TryOnStudio } from "@/components/home/TryOnStudio/TryOnStudio";
import { easeOutExpo } from "@/lib/motion/presets";
import { isTierAvailable, silverProductIds, tryOnTiers, type TryOnTier, type TryOnTierId } from "@/lib/tryOn";
import { CompareSlider } from "./CompareSlider";
import styles from "./TryOnSection.module.css";

const asset = (name: string) => `/images/figma/try-on/${name}`;

const features = [
  { label: "Private & Secure", icon: asset("icon-private.svg"), width: 20, height: 22.5 },
  { label: "Realistic Preview", icon: asset("icon-realistic.svg"), width: 21.5, height: 21.5 },
  { label: "Shop with Confidence", icon: asset("icon-shop.svg"), width: 18, height: 22 },
];

const howItWorks = [
  { title: "Upload Photo", body: "Add a clear full-body photo", icon: asset("step-upload.svg"), width: 32, height: 32 },
  { title: "Choose a Saree", body: "Select from eligible collections", icon: asset("step-saree.svg"), width: 32, height: 32 },
  { title: "AI Try-On", body: "See your look instantly", icon: asset("step-ai.svg"), width: 32, height: 32 },
  { title: "Shop with Confidence", body: "Save or add your favourite to bag", icon: asset("step-shop.svg"), width: 23.3333, height: 28.6667 },
];

const growthIcons: Record<TryOnTierId, { src: string; width: number; height: number }> = {
  silver: { src: asset("icon-tick.svg"), width: 32, height: 32 },
  platinum: { src: asset("steps-lock.svg"), width: 21.5, height: 26.5 },
  gold: { src: asset("steps-block.svg"), width: 26.5, height: 26.5 },
};

const cardIconSize: Record<TryOnTierId, { width: number; height: number }> = {
  silver: { width: 32, height: 32 },
  platinum: { width: 21.875, height: 26.875 },
  gold: { width: 27, height: 27 },
};

type DialogView = { kind: "studio"; tier: TryOnTier } | { kind: "locked" } | { kind: "gold" };

type TryOnSectionProps = {
  bag: string[];
  onAddToBag: (productId: string) => void;
};

export function TryOnSection({ bag, onAddToBag }: TryOnSectionProps) {
  const reduceMotion = useReducedMotion();
  const [view, setView] = useState<DialogView | null>(null);

  const availableTiers = tryOnTiers.filter((tier) => isTierAvailable(tier.id, bag));
  const platinumUnlocked = isTierAvailable("platinum", bag);
  const silver = tryOnTiers[0];
  const platinum = tryOnTiers[1];
  const gold = tryOnTiers[2];

  useEffect(() => {
    if (!view) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setView(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);

  const openTier = (tier: TryOnTier) => {
    if (tier.id === "gold") setView({ kind: "gold" });
    else if (isTierAvailable(tier.id, bag)) setView({ kind: "studio", tier });
    else setView({ kind: "locked" });
  };

  const unlockPlatinum = () => {
    onAddToBag(silverProductIds[0]);
    setView({ kind: "studio", tier: platinum });
  };

  const badge = (id: TryOnTierId) =>
    id === "silver" ? "AVAILABLE" : id === "gold" ? "NOT AVAILABLE FOR TRY-ON" : platinumUnlocked ? "UNLOCKED" : "UNLOCKABLE";

  return (
    <section className={styles.section} id="try-on">
      <ScrollReveal>
        <h2 className={styles.heading}>Try on using AI</h2>
        <div className={styles.panel}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>TRY BEFORE YOU BUY <span aria-hidden="true" /></p>
            <h3>See the Saree on You</h3>
            <p className={styles.lead}>Upload your photo and preview selected handcrafted sarees before you buy.</p>
            <button className={styles.primary} type="button" onClick={() => openTier(silver)}>
              Try AI Now
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("arrow-forward.svg")} alt="" width={20} height={20} />
            </button>
            <ul className={styles.features}>
              {features.map((feature) => (
                <li key={feature.label}>
                  <span className={styles.featureIcon}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={feature.icon} alt="" width={feature.width} height={feature.height} />
                  </span>
                  {feature.label}
                </li>
              ))}
            </ul>
          </div>

          <CompareSlider
            className={styles.compare}
            before={asset("compare-photo.webp")}
            beforeFaceX={0.52}
            afterFaceX={0.48}
            after={asset("compare-result.webp")}
            beforeAlt="Example customer photo"
            afterAlt="Example AI try-on of the customer wearing a maroon silk saree"
            beforeAction={(
              <button className={styles.uploadButton} type="button" aria-label="Upload your photo to try on" onClick={() => openTier(silver)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset("icon-upload-small.svg")} alt="" width={18} height={18} />
              </button>
            )}
          />

          <div className={styles.how}>
            <h3>How it works</h3>
            <ol>
              {howItWorks.map((step, index) => (
                <li key={step.title}>
                  <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.stepIcon}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={step.icon} alt="" width={step.width} height={step.height} />
                  </span>
                  <span className={styles.stepText}><strong>{step.title}</strong>{step.body}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className={styles.accessHeading}>
          <h2 className={styles.heading}>Your Try-On Access</h2>
          <p>Your access depends on the collection you choose.</p>
        </div>
        <div className={styles.cards}>
          {tryOnTiers.map((tier) => (
            <article className={`${styles.card} ${styles[tier.id]}`} key={tier.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.cardBg} src={tier.cardImage} alt="" />
              <div className={styles.cardBody}>
                <div className={styles.cardHead}>
                  <span className={styles.cardIcon}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tier.id === "platinum" && platinumUnlocked ? asset("icon-tick.svg") : tier.icon} alt="" {...(tier.id === "platinum" && platinumUnlocked ? cardIconSize.silver : cardIconSize[tier.id])} />
                  </span>
                  <div className={styles.cardTitle}>
                    <h3>{tier.name}</h3>
                    <span className={styles.badge}>{badge(tier.id)}</span>
                  </div>
                </div>
                <div className={styles.cardText}>
                  <p>{tier.id === "platinum" && platinumUnlocked ? "Thanks for choosing Silver — Platinum Try-On is unlocked." : tier.detail}</p>
                  <button className={styles.tierButton} type="button" onClick={() => openTier(tier)}>
                    <span className={styles.tierButtonTrack}>
                      {[0, 1].map((copy) => (
                        <span className={styles.tierButtonLabel} key={copy} aria-hidden={copy === 1 || undefined}>
                          Try Your Look
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={asset("btn-arrow.svg")} alt="" width={19.8268} height={19.8268} />
                        </span>
                      ))}
                    </span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <h2 className={`${styles.heading} ${styles.growthHeading}`}>How your Try-On access grows</h2>
        <div className={styles.growth}>
          <ol>
            {tryOnTiers.map((tier, index) => (
              <li key={tier.id} className={styles[tier.id]}>
                <span className={styles.growthNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.cardIcon}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={growthIcons[tier.id].src} alt="" width={growthIcons[tier.id].width} height={growthIcons[tier.id].height} />
                </span>
                <span className={styles.growthText}><strong>{tier.name}</strong>{tier.status}</span>
                {index < tryOnTiers.length - 1 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.growthArrow} src={asset("steps-arrow.svg")} alt="" width={32} height={32} />
                )}
              </li>
            ))}
          </ol>
          <p>Purchase a Silver saree to unlock virtual Try-On for Silver and Platinum collections.</p>
        </div>
      </ScrollReveal>

      <AnimatePresence>
        {view && (
          <motion.div
            className={styles.scrim}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onMouseDown={(event) => { if (event.target === event.currentTarget) setView(null); }}
          >
            <motion.section
              className={styles.dialog}
              role="dialog"
              aria-modal="true"
              aria-labelledby="try-on-dialog-title"
              initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.24, ease: easeOutExpo }}
            >
              <button type="button" className={styles.close} onClick={() => setView(null)} aria-label="Close"><X size={20} /></button>
              {view.kind === "studio" && <>
                <h2 id="try-on-dialog-title">AI Try-On</h2>
                <TryOnStudio
                  tiers={availableTiers}
                  initialTier={view.tier}
                  inBag={(productId) => bag.includes(productId)}
                  onAddToBag={onAddToBag}
                />
              </>}
              {view.kind === "locked" && <>
                <h2 id="try-on-dialog-title">Unlock Platinum Try-On</h2>
                <p className={styles.dialogText}>Platinum Try-On unlocks once a Silver saree is in your bag. Add one now to try on Platinum sarees straight away.</p>
                <div className={styles.dialogActions}>
                  <button className={styles.primary} type="button" onClick={unlockPlatinum}>Add Silver saree &amp; unlock</button>
                  <button className={styles.secondary} type="button" onClick={() => setView({ kind: "studio", tier: silver })}>Try Silver instead</button>
                </div>
              </>}
              {view.kind === "gold" && <>
                <h2 id="try-on-dialog-title">Gold Collection</h2>
                <p className={styles.dialogText}>Our Gold sarees are available for direct purchase only, so AI Try-On isn&apos;t offered for this collection.</p>
                <div className={styles.dialogActions}>
                  <button className={styles.primary} type="button" disabled={bag.includes(gold.productId)} onClick={() => { onAddToBag(gold.productId); setView(null); }}>
                    {bag.includes(gold.productId) ? "Gold saree in your bag" : "Add Gold saree to bag"}
                  </button>
                  <button className={styles.secondary} type="button" onClick={() => setView({ kind: "studio", tier: silver })}>Try Silver instead</button>
                </div>
              </>}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
