"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { easeOutExpo, fadeUp } from "@/lib/motion/presets";
import styles from "./WhyPratyangi.module.css";

const benefits = [
  { title: "Authentic Silk", body: "Certified pure silk sourced directly from weavers.", icon: "/images/figma/why-authentic.svg", width: 32 },
  { title: "Handwoven", body: "Each piece is handcrafted by master artisans.", icon: "/images/figma/why-handwoven.svg", width: 36 },
  { title: "Secure Payments", body: "100% secure checkout with multiple options.", icon: "/images/figma/why-secure.svg", width: 32 },
  { title: "Fast Delivery", body: "Express shipping across India in 3–5 days.", icon: "/images/figma/why-delivery.svg", width: 40 },
  { title: "WhatsApp Support", body: "Get help instantly via WhatsApp chat.", icon: "/images/figma/why-whatsapp.svg", width: 32 },
];

export function WhyPratyangi({ id }: { id?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className={styles.section} id={id}>
      <motion.h2 {...fadeUp(reduceMotion, 0)}>Why PRATYANGI FASHIONS</motion.h2>
      <div className={styles.grid}>
        {benefits.map((benefit, index) => (
          <motion.article
            className={styles.card}
            key={benefit.title}
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            whileHover={reduceMotion ? undefined : { y: -3, transition: { duration: 0.25 } }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: easeOutExpo, delay: 0.1 + index * 0.09 }}
          >
            {/* the icon pops in a moment after its card */}
            <motion.span
              style={{ display: "flex", width: "fit-content" }}
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: easeOutExpo, delay: 0.3 + index * 0.09 }}
            >
              <Image src={benefit.icon} alt="" width={benefit.width} height={32} />
            </motion.span>
            <h3>{benefit.title}</h3>
            <p>{benefit.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
