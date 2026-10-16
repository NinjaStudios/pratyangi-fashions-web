"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp } from "@/lib/motion/presets";
import { ParallaxLayer } from "@/components/motion/ParallaxLayer";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import styles from "./SocialFeed.module.css";

const feed = [
  { title: "Styling Ideas", lines: ["Styling", "Ideas"], platform: "Instagram", icon: "/images/figma/home/social-instagram.svg", iconSize: [24, 24], image: "/images/reference/hero-model-right1.webp" },
  { title: "Behind The Scenes", lines: ["Behind", "The Scenes"], platform: "YouTube", icon: "/images/figma/home/social-youtube.svg", iconSize: [24, 16], image: "/images/reference/hero-model-center.webp" },
  { title: "New Collections", lines: ["New", "Collections"], platform: "Facebook", icon: "/images/figma/home/social-facebook.svg", iconSize: [12, 24], image: "/images/reference/hero-model-left1.webp" },
  { title: "Product Stories", lines: ["Product", "Stories"], platform: "LinkedIn", icon: "/images/figma/home/social-linkedin.svg", iconSize: [24, 24], image: "/images/reference/hero-model-right1.webp" },
  { title: "Community Updates", lines: ["Community", "Updates"], platform: "X", icon: "/images/figma/home/social-x.svg", iconSize: [24, 24], image: "/images/reference/hero-model-center.webp" },
];

export function SocialFeed() {
  const reduceMotion = useReducedMotion();

  return (
    <section className={styles.section} id="socials" aria-labelledby="socials-heading">
      <ScrollReveal className={styles.inner}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>LATEST FROM OUR SOCIALS <span aria-hidden="true" /></p>
            <h2 id="socials-heading">See Pratyangi Fashions<br />in motion.</h2>
          </div>
          <p className={styles.aside}>From new launches to styling ideas — follow us for a closer look at our world.</p>
        </div>
        <div className={styles.grid}>
          {feed.map((item, index) => (
            <motion.article className={styles.card} key={item.title} {...fadeUp(reduceMotion, 0.08 + index * 0.1)}>
              <ParallaxLayer className={styles.photoLayer} range={2.5}>
                <Image src={item.image} alt="" fill sizes="(max-width: 700px) 70vw, 19vw" className={styles.photo} />
              </ParallaxLayer>
              <div className={styles.content}>
                <span className={styles.platform} aria-hidden="true">
                  <Image src={item.icon} alt="" width={item.iconSize[0]} height={item.iconSize[1]} />
                </span>
                <h3>{item.lines[0]}<br />{item.lines[1]}</h3>
                <span className={styles.soon}>Coming Soon</span>
                <span className={styles.arrow} aria-label={`${item.platform} ${item.title}: coming soon`}>
                  <Image src="/images/figma/home/social-arrow.svg" alt="" width={32} height={32} aria-hidden="true" />
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
