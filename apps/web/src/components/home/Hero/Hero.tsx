"use client";

import Image from "next/image";
import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { easeOutExpo } from "@/lib/motion/presets";
import { HERO_HEIGHT, HERO_WIDTH, heroModels, heroStage, type HeroModel } from "./heroLayers";
import styles from "./Hero.module.css";

type HeroProps = {
  /** 0 at the top of the page, 1 once Shop by Category has fully covered the hero. */
  coverProgress: MotionValue<number>;
};

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

function HeroModelLayer({ model, progress, still }: { model: HeroModel; progress: MotionValue<number>; still: boolean }) {
  // Sideways drift is a percentage of the model's own width, so it scales with the artboard.
  const travel = still ? 0 : (model.travel / model.width) * 100;
  const x = useTransform(progress, [0, 1], ["0%", `${travel}%`]);
  const fade = model.fade;
  const opacity = useTransform(progress, fade ? [fade.from, fade.to] : [0, 1], [1, fade && !still ? fade.end : 1]);

  return (
    <motion.div
      className={styles.model}
      style={{
        left: pct(model.x, HERO_WIDTH),
        top: pct(model.y, HERO_HEIGHT),
        width: pct(model.width, HERO_WIDTH),
        height: pct(model.height, HERO_HEIGHT),
        zIndex: model.z,
        x,
        opacity,
      }}
      data-hero-model={model.id}
    >
      <Image src={model.src} alt="" fill priority sizes="30vw" aria-hidden="true" />
    </motion.div>
  );
}

export function Hero({ coverProgress }: HeroProps) {
  const reduceMotion = Boolean(useReducedMotion());

  // The hero stays pinned (sticky, see Hero.module.css) while the sections after it scroll up over it. Everything
  // below is driven by the same scroll progress, so it reverses exactly when scrolling back up:
  //  - the whole scene dims gently as it is covered,
  //  - the centre model fades out,
  //  - the side models drift outward (left ones left, right ones right) and slip behind the category section.
  // With reduced motion the values stay flat (same markup, so server and client render the same).
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
        <div className={styles.scene}>
          <Image className={styles.plate} src={heroStage.src} alt={heroStage.alt} fill priority sizes="100vw" />
          {heroModels.map((model) => (
            <HeroModelLayer key={model.id} model={model} progress={coverProgress} still={reduceMotion} />
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}
