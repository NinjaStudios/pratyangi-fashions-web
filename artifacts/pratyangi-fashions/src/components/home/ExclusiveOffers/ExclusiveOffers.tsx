"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./ExclusiveOffers.module.css";

const offers = [
  { mark: "20%", title: "Flat 20% Off", detail: "On first order using code", code: "FIRST20", message: "Local demo only — code FIRST20 can be applied on the Bag page." },
  { icon: "/images/figma/home/offer-party.svg", title: "Festival Special", detail: "Free blouse piece with every saree this season", message: "Local demo only — this offer is not redeemable." },
  { icon: "/images/figma/home/offer-discount.svg", title: "Flat 20% Off", detail: "Extra 15% off on bridal collections above ₹15,000", message: "Local demo only — this offer is not redeemable." },
];

export function ExclusiveOffers() {
  const [message, setMessage] = useState("");

  return (
    <section className={styles.section} id="exclusives" aria-labelledby="exclusives-title">
      <h2 id="exclusives-title">Exclusive Offers</h2>
      <div className={styles.grid}>
        {offers.map((offer, index) => (
          <article className={styles.card} key={`${offer.title}-${index}`}>
            {offer.mark ? <span className={styles.mark}>{offer.mark}</span> : <Image src={offer.icon!} alt="" width={48} height={48} />}
            <h3>{offer.title}</h3>
            <p>{offer.detail}{offer.code && <b>{offer.code}</b>}</p>
            <button type="button" onClick={() => setMessage(offer.message)}>Claim Offer</button>
          </article>
        ))}
      </div>
      {message && <p className={styles.message} role="status">{message}</p>}
    </section>
  );
}
