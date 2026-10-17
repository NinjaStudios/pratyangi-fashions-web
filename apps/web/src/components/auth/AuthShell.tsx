"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, MapPin, Package, Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader/SiteHeader";
import { useBag } from "@/lib/bag";
import { easeOutExpo } from "@/lib/motion/presets";
import styles from "./Auth.module.css";

const perks = [
  { Icon: Package, text: "Track every order from your account" },
  { Icon: MapPin, text: "Save addresses for a faster checkout" },
  { Icon: Sparkles, text: "Try sarees on with AI before you buy" },
  { Icon: Heart, text: "Keep a wishlist of your favourites" },
];

/** The page frame for sign-in and sign-up: the site header and footer around a brand panel and the form card. */
export function AuthShell({ children }: { children: ReactNode }) {
  const bag = useBag();
  const reduceMotion = useReducedMotion();
  const enter = (delay: number, x = 0) => ({
    initial: { opacity: 0, y: 24, x },
    animate: { opacity: 1, y: 0, x: 0 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.7, ease: easeOutExpo, delay },
  });

  return (
    <main className={styles.page}>
      <SiteHeader bagCount={bag.count} />
      <section className={styles.stage}>
        <motion.aside className={styles.brand} aria-label="Why create an account" {...enter(0.05, -24)}>
          <Image className={styles.brandPhoto} src="/images/figma/home/join-background.webp" alt="" fill priority sizes="(max-width: 960px) 0px, 45vw" />
          <div className={styles.brandShade} aria-hidden="true" />
          <div className={styles.brandContent}>
            <Image src="/images/reference/brand-emblem.webp" alt="" width={64} height={64} />
            <p className={styles.brandName}>PRATYANGI FASHIONS</p>
            <h2>Where Tradition Meets Elegance</h2>
            <ul>
              {perks.map(({ Icon, text }, index) => (
                <motion.li key={text} {...enter(0.35 + index * 0.1)}>
                  <Icon size={18} aria-hidden="true" />
                  {text}
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.aside>
        <motion.div className={styles.card} {...enter(0.15, 24)}>
          {children}
        </motion.div>
      </section>
      <SiteFooter />
    </main>
  );
}
