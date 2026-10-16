"use client";

import Image from "next/image";
import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { easeOutExpo } from "@/lib/motion/presets";
import styles from "./Hero.module.css";

type HeroProps = {
  /** 0 at the top of the page, 1 once Shop by Category has fully covered the hero. */
  coverProgress: MotionValue<number>;
};

export function Hero({ coverProgress }: HeroProps) {
  const reduceMotion = useReducedMotion();

  // The hero stays pinned (sticky, see Hero.module.css) while the sections after it scroll up over it. As it is
  // covered it recedes: a gentle dim tied to the same scroll progress, so it reverses exactly when scrolling back up.
  // Same style shape with or without reduced motion (the value just stays at 1).
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
      <motion.div className={styles.stage} style={{ opacity: stageOpacity }}>
        <Image
          src="/images/reference/hero-showroom-figma.webp"
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
