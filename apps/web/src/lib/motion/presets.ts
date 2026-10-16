export const easeOutExpo = [0.22, 1, 0.36, 1] as const;

/**
 * The initial (hidden) state is the same whether or not the visitor prefers reduced motion, so the
 * server-rendered HTML always matches the client. Reduced motion only makes the reveal instant.
 */
const revealTransition = (reduceMotion: boolean | null, duration: number, delay: number) =>
  reduceMotion ? { duration: 0 } : { duration, delay, ease: easeOutExpo };

// Reveals are not "once": an element eases in whenever it scrolls into view and eases out as it leaves, so the page
// feels alive in both scroll directions (not only the first time down).
export const fadeUp = (reduceMotion: boolean | null, delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount: 0.2 },
  transition: revealTransition(reduceMotion, 0.55, delay),
});

export const fadeIn = (reduceMotion: boolean | null, delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: false, amount: 0.15 },
  transition: revealTransition(reduceMotion, 0.45, delay),
});
