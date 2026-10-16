/** The hero is a 1440 x 591 artboard: one empty stage picture plus seven model cut-outs standing on it. */
export const HERO_WIDTH = 1440;
export const HERO_HEIGHT = 591;

export const heroStage = {
  src: "/images/hero/stage.webp",
  alt: "Seven models in traditional sarees on a maroon showroom stage with gold plinths and a central white pedestal",
};

/** The gold stand a model stands on. It is drawn inside the model's layer, so it travels with the model. */
export type HeroPlinth = { src: string; x: number; y: number; width: number; height: number };

export type HeroModel = {
  id: string;
  src: string;
  /** Position and size on the artboard, in artboard pixels (measured from the approved design). */
  x: number;
  y: number;
  width: number;
  height: number;
  /** The stand under this model, if it has its own (the centre model stands on the fixed white podium). */
  plinth?: HeroPlinth;
  /** Stacking order; the centre model is in front. */
  z: number;
  /** How far the model drifts sideways by the end of the transition, in artboard pixels (negative = left). */
  travel: number;
  /** Scroll progress range over which the model fades out, and the opacity it ends at. Omit to stay visible. */
  fade?: { from: number; to: number; end: number };
};

/**
 * Outer models travel further than inner ones, so on the way out they spread apart and never cross.
 * Only the centre model fades; the side models leave by moving, each carrying its gold stand with it.
 */
export const heroModels: HeroModel[] = [
  { id: "left-3", src: "/images/hero/left-3.webp", x: 0, y: 134, width: 72, height: 260, plinth: { src: "/images/hero/plinth-left-3.webp", x: -27, y: 367, width: 121, height: 21 }, z: 3, travel: -490 },
  { id: "left-2", src: "/images/hero/left-2.webp", x: 104, y: 99, width: 189, height: 330, plinth: { src: "/images/hero/plinth-left-2.webp", x: 100, y: 399, width: 235, height: 41 }, z: 4, travel: -374 },
  { id: "left-1", src: "/images/hero/left-1.webp", x: 326, y: 64, width: 229, height: 400, plinth: { src: "/images/hero/plinth-left-1.webp", x: 337, y: 420, width: 262, height: 46 }, z: 5, travel: -288 },
  { id: "center", src: "/images/hero/center.webp", x: 587, y: 128, width: 267, height: 400, z: 7, travel: 0, fade: { from: 0.08, to: 0.7, end: 0 } },
  { id: "right-1", src: "/images/hero/right-1.webp", x: 886, y: 64, width: 214, height: 400, plinth: { src: "/images/hero/plinth-right-1.webp", x: 841, y: 420, width: 262, height: 46 }, z: 5, travel: 288 },
  { id: "right-2", src: "/images/hero/right-2.webp", x: 1132, y: 99, width: 197, height: 330, plinth: { src: "/images/hero/plinth-right-2.webp", x: 1121, y: 392, width: 229, height: 40 }, z: 4, travel: 374 },
  { id: "right-3", src: "/images/hero/right-3.webp", x: 1361, y: 134, width: 79, height: 260, plinth: { src: "/images/hero/plinth-right-3.webp", x: 1337, y: 369, width: 141, height: 25 }, z: 3, travel: 490 },
];
