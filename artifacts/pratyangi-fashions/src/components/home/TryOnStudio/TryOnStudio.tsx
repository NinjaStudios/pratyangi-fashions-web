"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Download, ImageUp, RotateCcw, ShoppingBag, Sparkles } from "lucide-react";
import { CompareSlider } from "@/components/home/TryOnSection/CompareSlider";
import { requestTryOn, type TryOnTier } from "@/lib/tryOn";
import styles from "./TryOnStudio.module.css";

type Status = "idle" | "loading" | "done" | "error";

type TryOnStudioProps = {
  /** Tiers the customer can currently try on. */
  tiers: TryOnTier[];
  initialTier: TryOnTier;
  inBag: (productId: string) => boolean;
  onAddToBag: (productId: string) => void;
};

export function TryOnStudio({ tiers, initialTier, inBag, onAddToBag }: TryOnStudioProps) {
  const [tier, setTier] = useState(initialTier);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  const resetResult = () => {
    setResult("");
    setError("");
    setStatus("idle");
  };

  const choosePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      setStatus("error");
      return;
    }
    setPhoto(file);
    setPhotoUrl(URL.createObjectURL(file));
    resetResult();
  };

  const chooseTier = (next: TryOnTier) => {
    if (next.id === tier.id || status === "loading") return;
    setTier(next);
    resetResult();
  };

  const generate = async () => {
    if (!photo) return;
    setStatus("loading");
    setError("");
    try {
      setResult(await requestTryOn(tier.id, photo, tier.image));
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong creating your look.");
      setStatus("error");
    }
  };

  const added = inBag(tier.productId);

  return (
    <div className={styles.studio}>
      <p className={styles.intro}>Upload a clear, full-body photo, choose a saree, and see your look instantly.</p>

      {tiers.length > 1 && (
        <div className={styles.tierPicker} role="radiogroup" aria-label="Choose a saree">
          {tiers.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={option.id === tier.id}
              className={option.id === tier.id ? styles.tierActive : undefined}
              onClick={() => chooseTier(option)}
              disabled={status === "loading"}
            >
              {option.name}
            </button>
          ))}
        </div>
      )}

      {result && photoUrl ? (
        <CompareSlider
          className={styles.resultCompare}
          before={photoUrl}
          after={result}
          beforeAlt="Your uploaded photo"
          afterAlt={`AI preview of you wearing the ${tier.name} saree`}
        />
      ) : (
        <div className={styles.previews}>
          <figure>
            <div className={styles.frame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tier.image} alt={`${tier.name} saree`} />
            </div>
            <figcaption>{tier.name} saree</figcaption>
          </figure>
          <figure>
            <label className={`${styles.frame} ${styles.upload}`} htmlFor="try-on-photo">
              {photoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={photoUrl} alt="Your uploaded photo" />
                : <span><ImageUp size={26} />Upload your photo</span>}
            </label>
            <figcaption>{photo ? "Your photo · tap to change" : "Your photo"}</figcaption>
            <input id="try-on-photo" className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} disabled={status === "loading"} />
          </figure>
        </div>
      )}

      {!result && (
        <button className={styles.generate} type="button" disabled={!photo || status === "loading"} onClick={generate}>
          {status === "loading"
            ? <><span className={styles.spinner} aria-hidden="true" />Creating your look…</>
            : <><Sparkles size={15} />Generate my look</>}
        </button>
      )}

      <div aria-live="polite">
        {status === "loading" && <p className={styles.hint}>This usually takes 10–30 seconds.</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>

      {result && (
        <>
          <button className={styles.generate} type="button" onClick={() => onAddToBag(tier.productId)} disabled={added}>
            <ShoppingBag size={15} />{added ? "Added to bag" : `Add ${tier.name} saree to bag`}
          </button>
          <div className={styles.resultActions}>
            <a href={result} download={`pratyangi-${tier.id}-try-on.png`}><Download size={14} />Save image</a>
            <button type="button" onClick={resetResult}><RotateCcw size={14} />Try another photo</button>
          </div>
        </>
      )}

      <p className={styles.privacy}>
        Your photo is sent to Google Gemini only to create this preview and is not saved by Pratyangi Fashions.
        AI previews are approximate — colours and drape may differ from the actual saree.
      </p>
    </div>
  );
}
