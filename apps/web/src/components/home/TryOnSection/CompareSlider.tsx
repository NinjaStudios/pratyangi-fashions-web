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
   * Where the middle of the face is in each picture, as a fraction of its width (0 to 1). When given, the pictures are
   * enlarged a little and shifted so both faces sit exactly under the divider at the start: the left half of one face
   * and the right half of the other.
   */
  beforeFaceX?: number;
  afterFaceX?: number;
  /** Extra controls rendered over the top-right of the "before" side. */
  beforeAction?: ReactNode;
  className?: string;
};

/** Before/after image comparison with a draggable (and keyboard-accessible) divider. */
export function CompareSlider({ before, after, beforeLabel = "Your Photo", afterLabel = "AI Try-On", beforeAlt, afterAlt, beforeAction, beforeFaceX, afterFaceX, className }: CompareSliderProps) {
  const [position, setPosition] = useState(50);
  // 12% larger than the frame leaves room to slide a picture sideways without showing an edge
  const zoom = 1.12;
  const aligned = (faceX?: number): CSSProperties | undefined =>
    faceX === undefined
      ? undefined
      : { top: 0, right: "auto", bottom: "auto", width: `${zoom * 100}%`, height: "auto", left: `calc(50% - ${faceX * zoom * 100}%)` };

  return (
    <div className={`${styles.compare} ${className ?? ""}`} style={{ "--split": `${position}%` } as CSSProperties}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.after} style={aligned(afterFaceX)} src={after} alt={afterAlt} draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.before} style={aligned(beforeFaceX)} src={before} alt={beforeAlt} draggable={false} />
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
