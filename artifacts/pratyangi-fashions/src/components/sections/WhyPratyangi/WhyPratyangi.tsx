import Image from "next/image";
import styles from "./WhyPratyangi.module.css";

const benefits = [
  { title: "Authentic Silk", body: "Certified pure silk sourced directly from weavers.", icon: "/images/figma/why-authentic.svg", width: 32 },
  { title: "Handwoven", body: "Each piece is handcrafted by master artisans.", icon: "/images/figma/why-handwoven.svg", width: 36 },
  { title: "Secure Payments", body: "100% secure checkout with multiple options.", icon: "/images/figma/why-secure.svg", width: 32 },
  { title: "Fast Delivery", body: "Express shipping across India in 3–5 days.", icon: "/images/figma/why-delivery.svg", width: 40 },
  { title: "WhatsApp Support", body: "Get help instantly via WhatsApp chat.", icon: "/images/figma/why-whatsapp.svg", width: 32 },
];

export function WhyPratyangi({ id }: { id?: string }) {
  return (
    <section className={styles.section} id={id}>
      <h2>Why PRATYANGI FASHIONS</h2>
      <div className={styles.grid}>
        {benefits.map((benefit) => (
          <article className={styles.card} key={benefit.title}>
            <Image src={benefit.icon} alt="" width={benefit.width} height={32} />
            <h3>{benefit.title}</h3>
            <p>{benefit.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
