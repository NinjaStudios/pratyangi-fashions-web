"use client";

import { useId } from "react";
import type { CSSProperties } from "react";
import styles from "./PriceRange.module.css";

type PriceRangeProps = {
  /** Lowest and highest price the slider can reach. */
  min: number;
  max: number;
  step: number;
  /** The chosen range. */
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
  /** Ready-made ranges shown as links under the slider; `null` on either end means no limit. */
  presets?: readonly { low: number | null; high: number | null }[];
  label?: string;
};

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const presetLabel = ({ low, high }: { low: number | null; high: number | null }) =>
  low === null && high !== null ? `Up to ${money(high)}` : high === null && low !== null ? `Over ${money(low)}` : `${money(low ?? 0)} – ${money(high ?? 0)}`;

/**
 * A two-handle price slider: drag either end, or focus a handle and use the arrow keys. Two native range inputs sit on top of
 * one track, so touch, keyboard and screen readers all work without extra code.
 */
export function PriceRange({ min, max, step, low, high, onChange, presets = [], label = "Price" }: PriceRangeProps) {
  const id = useId();
  const percent = (value: number) => ((value - min) / (max - min)) * 100;
  const changed = low !== min || high !== max;
  // when both handles meet at the top, the lower one must stay on top or it could never be dragged back
  const lowOnTop = low >= max - step * 2;

  return (
    <div className={styles.range}>
      <h3 className={styles.title} id={`${id}-title`}>{label}</h3>
      <p className={styles.value} aria-live="polite">{money(low)} – {money(high)}{high === max ? "+" : ""}</p>

      <div className={styles.slider} style={{ "--from": `${percent(low)}%`, "--to": `${percent(high)}%` } as CSSProperties} role="group" aria-labelledby={`${id}-title`}>
        <div className={styles.track} aria-hidden="true" />
        <input
          className={styles.handle}
          style={{ zIndex: lowOnTop ? 2 : 1 }}
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          aria-label="Minimum price"
          aria-valuetext={money(low)}
          onChange={(event) => onChange(Math.min(Number(event.target.value), high - step), high)}
        />
        <input
          className={styles.handle}
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          aria-label="Maximum price"
          aria-valuetext={money(high)}
          onChange={(event) => onChange(low, Math.max(Number(event.target.value), low + step))}
        />
      </div>

      <button type="button" className={styles.reset} onClick={() => onChange(min, max)} disabled={!changed}>Reset price range</button>

      {presets.length > 0 && (
        <ul className={styles.presets} aria-label="Quick price ranges">
          {presets.map((preset) => {
            const from = preset.low ?? min;
            const to = preset.high ?? max;
            const active = low === from && high === to;
            return (
              <li key={presetLabel(preset)}>
                <button type="button" className={active ? styles.presetActive : undefined} aria-pressed={active} onClick={() => onChange(from, to)}>
                  {presetLabel(preset)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
