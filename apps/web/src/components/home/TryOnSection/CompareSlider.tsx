"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import styles from "./CompareSlider.module.css";

type CompareSliderProps = {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  beforeAlt: string;
  afterAlt: string;
  /**
   * Where the face is in each picture. When given, each picture is scaled and placed so that both faces are the same size,
   * their eyes sit on the same line, and the middle of each face is exactly under the divider at the start: the left half
   * of one face joined to the right half of the other.
   */
  beforeFace?: FacePlacement;
  afterFace?: FacePlacement;
  /** Extra controls rendered over the top-right of the "before" side. */
  beforeAction?: ReactNode;
  className?: string;
};

/** Face measurements of a picture, as fractions of that picture: x = middle of the face, eyeLine = height of the eyes, eyeGap = distance between the eyes (relative to the picture's width). */
export type FacePlacement = { x: number; eyeLine: number; eyeGap: number };

// Both pictures are drawn so the eyes are this far apart (share of the frame width) and sit this far down the frame.
const FACE_EYE_GAP = 0.085;
const FACE_EYE_LINE = 0.3;

const placeFace = (face?: FacePlacement): CSSProperties | undefined =>
  face && {
    top: `${FACE_EYE_LINE * 100}%`,
    left: "50%",
    right: "auto",
    bottom: "auto",
    width: `${(FACE_EYE_GAP / face.eyeGap) * 100}%`,
    height: "auto",
    maxWidth: "none",
    transform: `translate(${-face.x * 100}%, ${-face.eyeLine * 100}%)`,
  };

/** Before/after image comparison with a draggable (and keyboard-accessible) divider. */
export function CompareSlider({ before, after, beforeLabel = "Your Photo", afterLabel = "AI Try-On", beforeAlt, afterAlt, beforeAction, beforeFace, afterFace, className }: CompareSliderProps) {
  const [position, setPosition] = useState(50);

  return (
    <div className={`${styles.compare} ${className ?? ""}`} style={{ "--split": `${position}%` } as CSSProperties}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.after} style={placeFace(afterFace)} src={after} alt={afterAlt} draggable={false} />
      {/* the clip sits on a wrapper the size of the frame, so the seam is exactly at the divider whatever the picture's own size */}
      <div className={styles.beforeClip}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.before} style={placeFace(beforeFace)} src={before} alt={beforeAlt} draggable={false} />
      </div>
      <span className={`${styles.pill} ${styles.pillBefore}`}>{beforeLabel}</span>
      <span className={`${styles.pill} ${styles.pillAfter}`}>{afterLabel}</span>
      <span className={styles.divider} aria-hidden="true">
        <span className={styles.handle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/figma/try-on/icon-compare.svg" alt="" width={17.5} height={11.5} />
        </span>
      </span>
      <input
        className={styles.range}
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label={`Compare ${beforeLabel} and ${afterLabel}`}
      />
      {beforeAction && <div className={styles.action}>{beforeAction}</div>}
    </div>
  );
}
