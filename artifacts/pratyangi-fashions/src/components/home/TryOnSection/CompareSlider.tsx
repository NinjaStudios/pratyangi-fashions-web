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
  /** Extra controls rendered over the top-right of the "before" side. */
  beforeAction?: ReactNode;
  className?: string;
};

/** Before/after image comparison with a draggable (and keyboard-accessible) divider. */
export function CompareSlider({ before, after, beforeLabel = "Your Photo", afterLabel = "AI Try-On", beforeAlt, afterAlt, beforeAction, className }: CompareSliderProps) {
  const [position, setPosition] = useState(50);

  return (
    <div className={`${styles.compare} ${className ?? ""}`} style={{ "--split": `${position}%` } as CSSProperties}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.after} src={after} alt={afterAlt} draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.before} src={before} alt={beforeAlt} draggable={false} />
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
