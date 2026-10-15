import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import styles from "./CustomerReviews.module.css";

const reviews = [
  {
    product: "Kanchipuram Pattu",
    image: "/images/reference/category-kanchipuram.png",
    position: "center 12%",
    copy: "The zari border is rich and the colour matched the photos exactly. Packed beautifully with a barcode tag.",
  },
  {
    product: "Banarasi Silk",
    image: "/images/reference/category-banarasi.png",
    position: "center 14%",
    copy: "Lightweight yet grand. The weave feels authentic and the drape was easy for a full day of festivities.",
  },
  {
    product: "Soft Silk",
    image: "/images/reference/category-soft-silk.png",
    position: "center 12%",
    copy: "Soft, elegant and comfortable. Delivery was quick and the blouse piece was included as promised.",
  },
  {
    product: "Bridal Collection",
    image: "/images/reference/category-bridal.png",
    position: "center 12%",
    copy: "Perfect for the wedding. The contrast pallu stood out in every photo and the finish was flawless.",
  },
];

export function CustomerReviews() {
  return (
    <section className={styles.section} id="reviews" aria-labelledby="reviews-title">
      <div className={styles.heading}>
        <h2 id="reviews-title">Loved by our Customers</h2>
        <Link href="/new-arrivals" className={styles.seeAll}>See all <ChevronRight size={16} /></Link>
      </div>
      <div className={styles.grid}>
        {reviews.map((review) => (
          <article className={styles.card} key={review.product}>
            <Image className={styles.glow} src="/images/figma/home/review-glow.svg" alt="" width={430} height={717} aria-hidden="true" />
            <div className={styles.photo}>
              <Image src={review.image} alt={`${review.product} saree`} fill sizes="(max-width: 700px) 70vw, 238px" style={{ objectPosition: review.position }} />
            </div>
            <Image className={styles.stars} src="/images/figma/home/review-stars.svg" alt="Rated 5 out of 5" width={176} height={32} />
            <h3>{review.product.toUpperCase()}</h3>
            <p>{review.copy}</p>
          </article>
        ))}
      </div>
      <p className={styles.note}>Sample reviews shown for this demo storefront.</p>
    </section>
  );
}
