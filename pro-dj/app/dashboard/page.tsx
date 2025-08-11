import styles from "./dashboard.module.css";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Subnav from "./Subnav";

export default async function DashboardPage() {
  const mixCount = await prisma.mix.count();
  const [postCount, bookingCount] = await Promise.all([
    prisma.post.count(),
    prisma.booking.count(),
  ]);

  return (
    <main className={styles.wrapper}>
      <h1 className={styles.title}>Admin Dashbaord</h1>
      <Subnav />
      <div className={styles.grid}>
        <div className={`${styles.card} ${styles.col4}`}>
          <div>Total Mixes</div>
          <div className={styles.kpi}>{mixCount}</div>
        </div>
        <div className={`${styles.card} ${styles.col4}`}>
          <div>Blog Posts</div>
          <div className={styles.kpi}>{postCount}</div>
        </div>
        <div className={`${styles.card} ${styles.col4}`}>
          <div>Bookings</div>
          <div className={styles.kpi}>{bookingCount}</div>
        </div>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <Link href="/dashboard/media">
          <button className={styles.button}>Upload Mix</button>
        </Link>
      </div>
    </main>
  );
}
