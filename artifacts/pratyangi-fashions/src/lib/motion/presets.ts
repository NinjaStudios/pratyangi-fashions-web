export const easeOutExpo = [0.22, 1, 0.36, 1] as const;

export const fadeUp = (reduceMotion: boolean | null, delay = 0) =>
  reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.55, delay, ease: easeOutExpo },
      };

export const fadeIn = (reduceMotion: boolean | null, delay = 0) =>
  reduceMotion
    ? {}
    : {
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true, amount: 0.15 },
        transition: { duration: 0.45, delay, ease: easeOutExpo },
      };
