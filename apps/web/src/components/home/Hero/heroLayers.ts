/** The hero is a 1440 x 591 artboard: one empty stage picture plus seven model cut-outs standing on it. */
export const HERO_WIDTH = 1440;
export const HERO_HEIGHT = 591;

export const heroStage = {
  src: "/images/hero/stage.webp",
  alt: "Seven models in traditional sarees on a maroon showroom stage with gold plinths and a central white pedestal",
};

export type HeroModel = {
  id: string;
  src: string;
  /** Position and size on the artboard, in artboard pixels (measured from the approved design). */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Stacking order; the centre model is in front. */
  z: number;
  /** How far the model drifts sideways by the end of the transition, in artboard pixels (negative = left). */
  travel: number;
  /** Scroll progress range over which the model fades out, and the opacity it ends at. Omit to stay visible. */
  fade?: { from: number; to: number; end: number };
};

/**
 * Outer models travel further than inner ones, so on the way out they spread apart and never cross.
 * Only the centre model fades; the side models leave by moving.
 */
export const heroModels: HeroModel[] = [
  { id: "left-3", src: "/images/hero/left-3.webp", x: 0, y: 134, width: 72, height: 260, z: 3, travel: -490 },
  { id: "left-2", src: "/images/hero/left-2.webp", x: 104, y: 99, width: 189, height: 330, z: 4, travel: -374 },
  { id: "left-1", src: "/images/hero/left-1.webp", x: 326, y: 64, width: 229, height: 400, z: 5, travel: -288 },
  { id: "center", src: "/images/hero/center.webp", x: 587, y: 128, width: 267, height: 400, z: 7, travel: 0, fade: { from: 0.08, to: 0.7, end: 0 } },
  { id: "right-1", src: "/images/hero/right-1.webp", x: 886, y: 64, width: 214, height: 400, z: 5, travel: 288 },
  { id: "right-2", src: "/images/hero/right-2.webp", x: 1132, y: 99, width: 197, height: 330, z: 4, travel: 374 },
  { id: "right-3", src: "/images/hero/right-3.webp", x: 1361, y: 134, width: 79, height: 260, z: 3, travel: 490 },
];
