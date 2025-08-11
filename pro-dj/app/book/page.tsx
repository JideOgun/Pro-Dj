"use client";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function BookPage() {
  const { data } = useSession();
  const loggedIn = !!data?.user;
  const params = useSearchParams();

  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    const type = params.get("type");
    if (type) setEventType(type);
  }, [params]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, eventDate, message }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Booking request sent");
      setTimeout(() => router.push("/dashboard/bookings"), 1500);
    }

    setMsg(res.ok ? "Request Sent" : data?.error ?? "Failed");
  }

  if (!loggedIn) {
    return (
      <main style={{ padding: "1.25rem" }}>
        <h1>Book Jay Baba</h1>
        <p style={{ opacity: 0.7, margin: ".5rem 0 1rem" }}>
          Please sign in to request a booking.
        </p>
        <button onClick={() => signIn("google", { callbackUrl: "/book" })}>
          Continue with Google
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: "1.25rem" }}>
      <h1>Book Jay Baba</h1>
      <form
        onSubmit={submit}
        style={{ display: "grid", gap: ".6rem", maxWidth: 520 }}
      >
        <input
          placeholder="Event type"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          required
        />
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <button type="submit">Submit</button>
      </form>
      {msg && <p>{msg}</p>}
    </main>
  );
}
