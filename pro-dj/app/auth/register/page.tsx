"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });
    const j = await res.json();
    if (!res.ok || !j.ok) {
      setMsg(j?.error ?? "Failed to register");
      return;
    }
    // Auto sign-in with Credentials after successful registration
    const signed = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/",
    });
    if (signed?.ok) window.location.href = "/"; // Go to homepage to book a DJ
    else setMsg("Registered, but login failed—try signing in.");
  }

  return (
    <main className="p-5 max-w-sm mx-auto text-gray-200">
      <h1 className="text-2xl font-semibold mb-4">Create your account</h1>
      <form onSubmit={submit} className="grid gap-3">
        <input
          className="border border-gray-700 rounded px-3 py-2 bg-transparent"
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="border border-gray-700 rounded px-3 py-2 bg-transparent"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="border border-gray-700 rounded px-3 py-2 bg-transparent"
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="bg-violet-600 rounded px-3 py-2">
          Create account
        </button>
        {msg && <p className="text-sm text-red-400">{msg}</p>}
      </form>

      <p className="text-sm mt-3 opacity-80">
        Already have an account?{" "}
        <Link href="/auth/login" className="underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
