import Image from "next/image";
import { Heart } from "lucide-react";
import styles from "./SiteFooter.module.css";

const columns = [
  { title: "COMPANY", items: ["About us", "Our Story", "Artisans", "Careers", "Blog"] },
  { title: "COLLECTIONS", items: ["Kanchipuram Pattu", "Banarasi", "Uppada", "Bridal Sarees", "New Arrivals"] },
  { title: "SUPPORT", items: ["FAQs", "Returns & Exchange", "Size Guide", "Track Order", "Contact us"] },
  { title: "LEGAL", items: ["Privacy Policy", "Terms & Conditions", "GST Information", "Shipping Policy"] },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerMain}>
        <div className={styles.footerBrand}>
          <Image src="/images/reference/brand-lockup.jpg" alt="Pratyangi Fashions — Tradition Meets Elegance" width={300} height={53} />
          <p>“Tradition Woven with Elegance” —<br />handcrafted silk sarees since 1985.</p>
          <div className={styles.footerSocial} aria-label="Social media"><span>f</span><span>▶</span><span>◎</span><span>◉</span></div>
        </div>
        {columns.map((column) => (
          <div className={styles.footerColumn} key={column.title}>
            <h3>{column.title}</h3>
            {column.items.map((item) => <span key={item}>{item}</span>)}
          </div>
        ))}
      </div>
      <div className={styles.paymentRow}>
        <div className={styles.paymentMethods}><span>Secure Payments:</span>{["Visa", "Mastercard", "UPI", "GPay", "PhonePe", "COD", "EMI"].map((method) => <b key={method}>{method}</b>)}</div>
        <div className={styles.storeBadges}><span> <small>Download on the<br /><strong>App Store</strong></small></span><span>▶ <small>GET IT ON<br /><strong>Google Play</strong></small></span></div>
      </div>
      <div className={styles.copyright}>© 2026 PRATYANGI FASHIONS. All rights reserved. Made with <Heart size={12} fill="currentColor" /> in India.</div>
    </footer>
  );
}
