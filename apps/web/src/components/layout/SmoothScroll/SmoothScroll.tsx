"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Gives the whole site a gentle, inertial mouse-wheel / trackpad scroll (Lenis). It only eases the scroll position,
 * so every scroll-linked animation (hero, headings) simply follows it. Touch scrolling stays native, and nothing
 * runs when the visitor prefers reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.085,
      wheelMultiplier: 0.9,
      anchors: { offset: -80 },
    });

    // The frame loop only runs while there is something to animate, so an idle page costs nothing.
    let frame = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      frame = lenis.isScrolling ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener("wheel", wake, { passive: true });
    window.addEventListener("keydown", wake);
    window.addEventListener("click", wake);
    lenis.on("scroll", wake);

    return () => {
      window.removeEventListener("wheel", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("click", wake);
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
