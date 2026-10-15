"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "@/lib/motion/presets";

type ScrollRevealProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
};

export function ScrollReveal({ children, delay = 0, ...rest }: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();
  const motionProps = fadeUp(reduceMotion, delay);

  return (
    <motion.div {...motionProps} {...rest}>
      {children}
    </motion.div>
  );
}
