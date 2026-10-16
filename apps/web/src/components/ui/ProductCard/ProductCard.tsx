"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, Heart } from "lucide-react";
import { easeOutExpo } from "@/lib/motion/presets";
import { formatRs } from "@/lib/catalog";
import styles from "./ProductCard.module.css";

export type ProductCardProps = {
  id: string;
  title: string;
  imageSrc: string;
  priceInr: number;
  compareAtInr?: number;
  onAddToCart?: (id: string) => void;
  /** Position in its row; when set, the card fades up as it scrolls into view, one after another. */
  revealIndex?: number;
};

export function ProductCard({
  id,
  title,
  imageSrc,
  priceInr,
  compareAtInr = 30000,
  onAddToCart,
  revealIndex,
}: ProductCardProps) {
  const reduceMotion = useReducedMotion();
  const reveal = (index: number) => (reduceMotion ? { duration: 0 } : { duration: 0.7, ease: easeOutExpo, delay: (index % 4) * 0.09 });

  return (
    <motion.article
      className={styles.card}
      initial={revealIndex === undefined ? false : { opacity: 0, y: 36 }}
      whileInView={revealIndex === undefined ? undefined : { opacity: 1, y: 0, transition: reveal(revealIndex) }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -6% 0px" }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.22 }}
    >
      <div className={styles.photo}>
        <Image src={imageSrc} alt={title} fill sizes="(max-width: 700px) 48vw, 25vw" />
        <div className={styles.actions}>
          <button type="button" className={styles.actionBtn} aria-label="Add to wishlist">
            <Heart size={16} />
          </button>
          <button type="button" className={styles.actionBtn} aria-label="Quick view">
            <Eye size={16} />
          </button>
        </div>
        <button
          type="button"
          className={styles.addToCart}
          onClick={() => onAddToCart?.(id)}
          aria-label={`Add ${title} to cart`}
        >
          Add to cart
        </button>
      </div>
      <div className={styles.meta}>
        <h3>{title}</h3>
        <p className={styles.priceRow}>
          <span>{formatRs(priceInr)}</span>
          <del>{formatRs(compareAtInr)}</del>
        </p>
      </div>
    </motion.article>
  );
}
