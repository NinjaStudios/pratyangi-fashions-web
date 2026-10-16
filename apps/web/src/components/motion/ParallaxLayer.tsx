"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

type ParallaxLayerProps = {
  children: ReactNode;
  className?: string;
  /** Maximum travel, as a percentage of the layer's own height, in each direction. */
  range?: number;
  /** Below this viewport width the layer stays still. */
  minWidth?: number;
};

/**
 * Gentle vertical parallax driven by scroll progress (transform only, no state updates per frame).
 * The layer must be larger than its clipping parent by at least `range`% so no edge is exposed.
 */
export function ParallaxLayer({ children, className, range = 4, minWidth = 701 }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [wideEnough, setWideEnough] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${-range}%`, `${range}%`]);

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => setWideEnough(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [minWidth]);

  const active = wideEnough && !reduceMotion;

  return (
    <motion.div ref={ref} className={className} style={active ? { y } : undefined}>
      {children}
    </motion.div>
  );
}
