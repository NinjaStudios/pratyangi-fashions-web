"use client";

import Image from "next/image";
import { cubicBezier, motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { easeOutExpo } from "@/lib/motion/presets";
import { HERO_HEIGHT, HERO_WIDTH, heroModels, heroStage, type HeroModel } from "./heroLayers";
import styles from "./Hero.module.css";

type HeroProps = {
  /** 0 at the top of the page, 1 once Shop by Category has fully covered the hero. */
  coverProgress: MotionValue<number>;
};

// Soft start and soft finish, so the models ease into and out of their drift instead of moving at a constant rate.
const soft = cubicBezier(0.45, 0, 0.2, 1);

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

// Seconds before each model's entrance on page load: the centre first, then outwards to the edges.
const introDelay = (id: string) => (id === "center" ? 0.25 : id.endsWith("-1") ? 0.4 : id.endsWith("-2") ? 0.55 : 0.7);

function HeroModelLayer({ model, progress, still }: { model: HeroModel; progress: MotionValue<number>; still: boolean }) {
  // Sideways drift is a percentage of the model's own width, so it scales with the artboard.
  const travel = still ? 0 : (model.travel / model.width) * 100;
  const x = useTransform(progress, [0, 1], ["0%", `${travel}%`], { ease: soft });
  const fade = model.fade;
  const plinth = model.plinth;
  const reduce = Boolean(useReducedMotion());
  const opacity = useTransform(progress, fade ? [fade.from, fade.to] : [0, 1], [1, fade && !still ? fade.end : 1], { ease: soft });

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
      <motion.div
        className={styles.modelIntro}
        initial={{ opacity: 0, y: 56 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 1, ease: easeOutExpo, delay: introDelay(model.id) }}
      >
      {plinth && (
        <div
          className={styles.plinth}
          style={{
            left: pct(plinth.x - model.x, model.width),
            top: pct(plinth.y - model.y, model.height),
            width: pct(plinth.width, model.width),
            height: pct(plinth.height, model.height),
          }}
        >
          <Image src={plinth.src} alt="" fill priority sizes="20vw" aria-hidden="true" />
        </div>
      )}
      <Image src={model.src} alt="" fill priority sizes="30vw" aria-hidden="true" />
      </motion.div>
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
  const stageOpacity = useTransform(coverProgress, [0.25, 1], [1, reduceMotion ? 1 : 0.6], { ease: soft });

  return (
    <motion.section
      className={styles.hero}
      id="top"
      aria-label="Pratyangi Fashions virtual showroom"
    >
      <motion.div className={styles.stage} style={{ opacity: stageOpacity }}>
        <div className={styles.scene}>
          <motion.div
            className={styles.plateIntro}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 1, ease: easeOutExpo }}
          >
            <Image className={styles.plate} src={heroStage.src} alt={heroStage.alt} fill priority sizes="100vw" />
          </motion.div>
          {heroModels.map((model) => (
            <HeroModelLayer key={model.id} model={model} progress={coverProgress} still={reduceMotion} />
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}
