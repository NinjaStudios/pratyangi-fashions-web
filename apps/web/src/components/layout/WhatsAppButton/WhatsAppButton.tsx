import Image from "next/image";
import { getWhatsAppHref } from "@/lib/siteConfig";
import styles from "./WhatsAppButton.module.css";

export function WhatsAppButton() {
  const href = getWhatsAppHref();
  const icon = <Image src="/images/figma/home/whatsapp.svg" alt="" width={24} height={24} priority />;

  if (!href) {
    return (
      <button type="button" className={styles.button} disabled aria-label="WhatsApp support (not configured yet)" title="WhatsApp support is not configured yet">
        {icon}
      </button>
    );
  }

  return (
    <a
      className={styles.button}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      {icon}
    </a>
  );
}
