"use client";

import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { easeOutExpo } from "@/lib/motion/presets";
import styles from "./Hero.module.css";

type HeroProps = {
  onTryLook?: () => void;
  /** Scroll progress (0–1) of the hero-to-category transition. */
  progress?: MotionValue<number>;
};

export function Hero({ onTryLook: _onTryLook, progress }: HeroProps) {
  const reduceMotion = useReducedMotion();
  const still = useMotionValue(0);
  const sceneY = useTransform(progress ?? still, [0, 1], ["0%", "-6%"]);

  return (
    <motion.section
      className={styles.hero}
      id="top"
      aria-label="Pratyangi Fashions virtual showroom"
      {...(reduceMotion
        ? {}
        : {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.55, ease: easeOutExpo },
          })}
    >
      <motion.div className={styles.scene} style={progress ? { y: sceneY } : undefined}>
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
