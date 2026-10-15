import Image from "next/image";
import styles from "./SocialVideos.module.css";

const natural = { width: "auto", height: "auto" } as const;

const channels = [
  { title: ["Styling", "Ideas"], icon: "social-instagram.svg", size: [24, 24], image: "hero-model-right1.png", platform: "Instagram" },
  { title: ["Behind", "The Scenes"], icon: "social-youtube.svg", size: [24.0032, 16.0096], image: "hero-model-center.png", platform: "YouTube" },
  { title: ["New", "Collections"], icon: "social-facebook.svg", size: [12, 24], image: "hero-model-left1.png", platform: "Facebook" },
  { title: ["Product", "Stories"], icon: "social-linkedin.svg", size: [24, 24], image: "hero-model-left2.png", platform: "LinkedIn" },
  { title: ["Community", "Updates"], icon: "social-x.svg", size: [24, 24], image: "hero-model-right2.png", platform: "X" },
];

export function SocialVideos() {
  return (
    <section className={styles.section} id="socials" aria-labelledby="socials-title">
      <div className={styles.background} aria-hidden="true">
        <Image src="/images/figma/home/videos-background.png" alt="" fill sizes="100vw" />
      </div>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div>
            <p className={styles.kicker}>LATEST FROM OUR SOCIALS <span aria-hidden="true" /></p>
            <h2 id="socials-title">See Pratyangi Fashions <br />in motion.</h2>
          </div>
          <p className={styles.lead}>From new launches to styling ideas <span aria-hidden="true" /> follow us for a closer look at our world.</p>
        </div>
        <ul className={styles.cards}>
          {channels.map((channel) => (
            <li className={styles.card} key={channel.platform}>
              <Image className={styles.photo} src={`/images/reference/${channel.image}`} alt="" fill sizes="(max-width: 700px) 62vw, 242px" />
              <div className={styles.cardBody}>
                <span className={styles.icon}><Image src={`/images/figma/home/${channel.icon}`} alt={channel.platform} width={channel.size[0]} height={channel.size[1]} style={natural} /></span>
                <h3>{channel.title[0]}<br />{channel.title[1]}</h3>
                <p>Coming Soon</p>
                <span className={styles.arrow} aria-hidden="true"><Image src="/images/figma/home/social-arrow.svg" alt="" width={32} height={32} style={natural} /></span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
