"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import styles from "./navbar.module.css";

export default function Navbar() {
  const { data } = useSession();
  const role = data?.user?.role ?? "GUEST";

  return (
    <nav className={styles.bar}>
      <div className={styles.brand}>Pro-DJ</div>

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
    </nav>
  );
}
