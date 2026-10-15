"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./JoinOurWorld.module.css";

const natural = { width: "auto", height: "auto" } as const;

const platforms = [
  { name: "Instagram", icon: "instagram.svg" },
  { name: "LinkedIn", icon: "linkedin.svg" },
  { name: "Twitter", icon: "x.svg" },
  { name: "YouTube", icon: "youtube.svg" },
  { name: "Facebook", icon: "facebook.svg" },
];

const pillars = [["FASHION", "INSPIRATION"], ["REAL", "STORIES"], ["A STRONGER", "COMMUNITY"]];

export function JoinOurWorld() {
  const [message, setMessage] = useState("");
  const showDemo = () => setMessage("Social and WhatsApp links are not connected in this demo.");

  return (
    <section className={styles.section} id="join-our-world" aria-labelledby="join-title">
      <Image className={styles.background} src="/images/figma/home/join-background.png" alt="Woman in an embroidered tissue saree standing in a sunlit arch" fill sizes="100vw" />
      <Image className={styles.ellipseOne} src="/images/figma/home/join-ellipse-1.svg" alt="" width={1179} height={1550} aria-hidden="true" />
      <Image className={styles.ellipseTwo} src="/images/figma/home/join-ellipse-2.svg" alt="" width={888} height={641} aria-hidden="true" />

      <div className={styles.content}>
        <p className={styles.kicker}>JOIN OUR WORLD <span aria-hidden="true" /></p>
        <h2 id="join-title">Where Tradition Meets <em>Tomorrow</em></h2>
        <p className={styles.lead}>Follow us for new collections, styling inspiration, behind-the-scenes moments, product videos and exclusive updates.</p>

        <div className={styles.links}>
          {platforms.map((platform) => (
            <button type="button" key={platform.name} onClick={showDemo}>
              <span><Image src={`/images/figma/home/${platform.icon}`} alt="" width={24} height={24} style={natural} />{platform.name}</span>
              <Image src="/images/figma/home/link-arrow.svg" alt="" width={20} height={20} style={natural} />
            </button>
          ))}
        </div>
        <button className={styles.whatsapp} type="button" onClick={showDemo}>
          <Image src="/images/figma/home/whatsapp.svg" alt="" width={23.814} height={24} style={natural} />Chat on Whatsapp
        </button>
        <p className={styles.status} role="status">{message}</p>

        <p className={styles.storyTitle}>BE A PART OF OUR STORY</p>
        <ul className={styles.pillars}>
          {pillars.map(([first, second]) => <li key={first}>{first}<br />{second}</li>)}
        </ul>
      </div>
    </section>
  );
}
