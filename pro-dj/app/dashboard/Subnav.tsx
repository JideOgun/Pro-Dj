"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./subnav.module.css";

export default function Subnav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";

  const is = (p: string) => pathname.startsWith(p);

  return (
    <div className={styles.nav}>
      <Link
        href="/dashboard/bookings"
        className={`${styles.tab} ${
          is("/dashboard/bookings") ? styles.active : ""
        }`}
      >
        Bookings
      </Link>
      <Link
        href="/dashboard/media"
        className={`${styles.tab} ${
          is("/dashboard/media") ? styles.active : ""
        }`}
      >
        Media
      </Link>
      <Link
        href="/dashboard/posts"
        className={`${styles.tab} ${
          is("/dashboard/posts") ? styles.active : ""
        }`}
      >
        Posts
      </Link>

      {isAdmin && !is("/dashboard/dj") && (
        <Link
          href="/dashboard/pricing"
          className={`${styles.tab} ${
            is("/dashboard/pricing") ? styles.active : ""
          }`}
        >
          Pricing
        </Link>
      )}
    </div>
  );
}
