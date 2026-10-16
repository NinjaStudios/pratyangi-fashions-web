"use client";

import Image from "next/image";
import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { easeOutExpo } from "@/lib/motion/presets";
import styles from "./Hero.module.css";

type HeroProps = {
  /** 0 when Shop by Category starts entering the viewport, 1 when it has fully covered the hero. */
  coverProgress: MotionValue<number>;
};

export function Hero({ coverProgress }: HeroProps) {
  const reduceMotion = useReducedMotion();

  // The hero stays pinned (sticky, see Hero.module.css) while the sections after it scroll up over it. As it is
  // covered it recedes: a little blur and dimming tied to the same scroll progress, so the effect reverses
  // exactly when scrolling back up. Same style shape with or without reduced motion (values stay flat).
  const stageBlur = useTransform(coverProgress, [0.25, 1], [0, reduceMotion ? 0 : 4]);
  const stageFilter = useTransform(stageBlur, (value) => (value > 0.05 ? `blur(${value}px)` : "none"));
  const stageOpacity = useTransform(coverProgress, [0.25, 1], [1, reduceMotion ? 1 : 0.6]);

  return (
    <motion.section
      className={styles.hero}
      id="top"
      aria-label="Pratyangi Fashions virtual showroom"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: easeOutExpo }}
    >
      <motion.div className={styles.stage} style={{ filter: stageFilter, opacity: stageOpacity }}>
        <Image
          src="/images/reference/hero-showroom-figma.png"
          alt="Seven models in traditional sarees on a maroon showroom stage with gold plinths and a central white pedestal"
          fill
          priority
          sizes="100vw"
          className={styles.showroom}
        />
      </motion.div>
    </motion.section>
  );
}
