"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { easeOutExpo } from "@/lib/motion/presets";

type RevealHeadingProps = {
  title: string;
  /** Where "See all" goes. */
  href: string;
  /** The page's own heading class (layout and look stay in the page stylesheet). */
  className: string;
  seeAllClassName: string;
};

/**
 * Section heading that eases in when it scrolls into view: the title rises, sharpens from a soft blur and fades in,
 * then "See all" follows a moment later. Used by every home-page section title so they all move the same way.
 * The hidden state is the same with or without reduced motion (only the duration changes), so server and client match.
 */
export function RevealHeading({ title, href, className, seeAllClassName }: RevealHeadingProps) {
  const reduceMotion = useReducedMotion();
  const transition = (delay: number) => (reduceMotion ? { duration: 0 } : { duration: 0.8, ease: easeOutExpo, delay });

  return (
    <motion.div className={className} initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.6 }}>
      <motion.h2
        variants={{
          hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
          shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: transition(0) },
        }}
      >
        {title}
      </motion.h2>
      <motion.a
        href={href}
        className={seeAllClassName}
        variants={{
          hidden: { opacity: 0, x: -10 },
          shown: { opacity: 1, x: 0, transition: transition(0.25) },
        }}
      >
        See all <ChevronRight size={14} />
      </motion.a>
    </motion.div>
  );
}
