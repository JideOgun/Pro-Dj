"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import styles from "./navbar.module.css";
import Link from "next/link";

export default function Navbar() {
  const { data } = useSession();
  const role = data?.user?.role ?? "GUEST";
  const showDashbaord = role === "DJ" || role === "ADMIN";

  return (
    <nav className={styles.bar}>
      <div className={styles.brand}>Pro-DJ</div>
      <Link href="/" className={styles.link}>
        Pro-DJ
      </Link>

      <div className={styles.right}>
        <span className={styles.role}>Role: {role}</span>

        {!data?.user ? (
          <button className={styles.btn} onClick={() => signIn()}>
            Sign in
          </button>
        ) : (
          <button
            className={styles.btnGhost}
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </button>
        )}
      </div>
      <div>
        {showDashbaord && (
          <Link href="/dashboard" className={styles.link}>
            Dashboard
          </Link>
        )}
        {!data?.user && (
          <>
            <Link href="/auth/register" className={styles.btn}>
              Register
            </Link>
            <span className={styles.separator}>|</span>
            <Link href="/login" className={styles.btn}>
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
