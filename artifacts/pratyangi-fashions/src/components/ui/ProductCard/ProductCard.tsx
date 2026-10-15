"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, Heart } from "lucide-react";
import { formatRs } from "@/lib/catalog";
import styles from "./ProductCard.module.css";

export type ProductCardProps = {
  id: string;
  title: string;
  imageSrc: string;
  priceInr: number;
  compareAtInr?: number;
  onAddToCart?: (id: string) => void;
};

export function ProductCard({
  id,
  title,
  imageSrc,
  priceInr,
  compareAtInr = 30000,
  onAddToCart,
}: ProductCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className={styles.card}
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
