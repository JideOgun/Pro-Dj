"use client";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { BOOKING_CONFIG, type BookingType } from "@/lib/booking-config";
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

  const [bookingType, setBookingType] = useState<BookingType | "">("");
  const [packageKey, setPackageKey] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const typeConfig = bookingType ? BOOKING_CONFIG[bookingType] : null;

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
      body: JSON.stringify({ bookingType, packageKey, eventDate, message, extra }),
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
        <select
          value={bookingType}
          onChange={(e) => setBookingType(e.target.value as BookingType)}
          required
        >
          <option value="">Select Booking Type</option>
          {Object.keys(BOOKING_CONFIG).map((type) => {
            return (
              <option key={type} value={type}>
                {type}
              </option>
            );
          })}
        </select>
        {typeConfig && (
          <select
            value={packageKey}
            onChange={(e) => setPackageKey(e.target.value)}
            required
          >
            <option value="">Choose a package</option>
            {typeConfig.packages.map((pkg) => (
              <option key={pkg.key} value={pkg.key}>
                {pkg.label}
              </option>
            ))}
          </select>
        )}
        {typeConfig?.extraFields.map((field) => (
          <input
            key={field}
            placeholder={field}
            value={extra[field] ?? ""}
            onChange={(e) => setExtra({ ...extra, [field]: e.target.value })}
          />
        ))}

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
