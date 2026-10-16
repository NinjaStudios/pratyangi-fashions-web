import Image from "next/image";
import { Heart } from "lucide-react";
import { getWhatsAppHref, siteConfig } from "@/lib/siteConfig";
import styles from "./SiteFooter.module.css";

const columns = [
  { title: "COMPANY", items: ["About us", "Our Story", "Artisans", "Careers", "Blog"] },
  { title: "COLLECTIONS", items: ["Kanchipuram Pattu", "Banarasi", "Uppada", "Bridal Sarees", "New Arrivals"] },
  { title: "SUPPORT", items: ["FAQs", "Returns & Exchange", "Size Guide", "Track Order", "Contact us"] },
  { title: "LEGAL", items: ["Privacy Policy", "Terms & Conditions", "GST Information", "Shipping Policy"] },
];

const whatsappHref = getWhatsAppHref();
const socialIcons: { label: string; icon: string; width: number; height: number; href: string | null }[] = [
  { label: "Facebook", icon: "/images/figma/footer/facebook.svg", width: 18, height: 18, href: siteConfig.social.facebook || null },
  { label: "YouTube", icon: "/images/figma/footer/youtube.svg", width: 20, height: 14, href: siteConfig.social.youtube || null },
  { label: "Instagram", icon: "/images/figma/footer/instagram.svg", width: 18, height: 18, href: siteConfig.social.instagram || null },
  { label: "WhatsApp", icon: "/images/figma/footer/whatsapp.svg", width: 18, height: 18, href: whatsappHref },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerMain}>
        <div className={styles.footerBrand}>
          <div className={styles.footerLogo}>
            <Image src="/images/reference/brand-logo.webp" alt="" width={44} height={44} />
            <span className={styles.footerLogoText}>
              <strong>PRATYANGI FASHIONS</strong>
              <small>TRADITION MEETS ELEGANCE</small>
            </span>
          </div>
          <p>“Tradition Woven with Elegance” —<br />handcrafted silk sarees since 1985.</p>
          <div className={styles.footerSocial} aria-label="Social media">
            {socialIcons.map(({ label, icon, width, height, href }) => {
              const image = <img src={icon} alt="" width={width} height={height} />;
              return href ? (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>{image}</a>
              ) : (
                <span key={label} title={`${label} link is pending configuration`}>{image}</span>
              );
            })}
          </div>
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
        <div className={styles.storeBadges}>
          <span><img src="/images/figma/footer/apple.svg" alt="" width={14} height={17} /><small>Download on the<br /><strong>App Store</strong></small></span>
          <span><img src="/images/figma/footer/play-store.svg" alt="" width={15} height={17} /><small>GET IT ON<br /><strong>Google Play</strong></small></span>
        </div>
      </div>
      <div className={styles.copyright}>© 2026 PRATYANGI FASHIONS. All rights reserved. Made with <Heart size={12} fill="currentColor" /> in India.</div>
    </footer>
  );
}
