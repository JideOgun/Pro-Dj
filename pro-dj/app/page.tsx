import Image from "next/image";

import styles from "./home.module.css";

export default function Home() {
  return (
    <main className={`${styles.main} container mx-auto py-16 md:py-24`}>
      <h1 className={`${styles.title} tracking-tight`}>Jay Baba • Pro-DJ</h1>
      <p className={`${styles.subtitle} max-w-2xl leading-relaxed`}>
        Afrobeats • Amapiano • High-energy club sets. Based in your city, ready
        for your event.
      </p>

      <div className={`${styles.ctaContainer}`}>
        {/* Desktop hover menu (already added earlier) */}
        <div className={styles.menu}>
          <a href="/book" className={`${styles.ctaPrimary} ${styles.trigger} transition hover:brightness-105`}>
            Book Me
          </a>
          <div className={styles.dropdown} aria-label="Event types">
            <a className={styles.item} href="/book?type=Wedding">Wedding</a>
            <a className={styles.item} href="/book?type=Club%20Night">Club</a>
            <a className={styles.item} href="/book?type=Corporate">Corporate</a>
            <a className={styles.item} href="/book?type=Birthday">Birthday</a>
            <a className={styles.item} href="/book?type=Private%20Party">Private Party</a>
          </div>
        </div>

        {/* Mobile/touch-friendly details dropdown */}
        <details className={styles.details}>
          <summary className={styles.summary}>
            <span className={`${styles.ctaPrimary} ${styles.summaryButton}`}>Book Me</span>
          </summary>
          <div className={styles.panel} aria-label="Event types">
            <a className={styles.menuItem} href="/book?type=Wedding">Wedding</a>
            <a className={styles.menuItem} href="/book?type=Club%20Night">Club</a>
            <a className={styles.menuItem} href="/book?type=Corporate">Corporate</a>
            <a className={styles.menuItem} href="/book?type=Birthday">Birthday</a>
            <a className={styles.menuItem} href="/book?type=Private%20Party">Private Party</a>
            <a className={styles.menuItem} href="/book">Just Book</a>
          </div>
        </details>
        <a
          href="/mixes"
          className={`${styles.ctaSecondary} transition hover:brightness-110`}
        >
          Listen to Mixes
        </a>
        <a
          href="/posts"
          className={`${styles.ctaSecondary} transition hover:brightness-110`}
        >
          Read the Blog
        </a>
      </div>
    </main>
  );
}
