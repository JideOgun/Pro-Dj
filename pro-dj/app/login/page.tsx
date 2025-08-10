"use client";
import { signIn } from "next-auth/react";
import { useState, FormEvent } from "react";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("jideogun93@gmail.com");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function handleCredentials(e: FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setErr("Invalid email or password");
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <main className={styles.wrapper}>
      <section className={styles.card}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}> Sign in to manage Pro-Dj</p>
        <div className={styles.stack}>
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className={`${styles.button} ${styles.ghost}`}
          >
            Continue with Google
          </button>
          <div className={styles.separator}>or use email</div>
          <form
            className={styles.stack}
            onSubmit={handleCredentials}
            noValidate
          >
            <div className={styles.row}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className={styles.input}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className={styles.row}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className={styles.input}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                placeholder="xxxxxxxx"
                required
              />
            </div>
            {err && <p className={styles.error}>{err}</p>}

            <button type="submit" className={styles.button}>
              Sign in
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
