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

  const [types, setTypes] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState("");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const [bookingType, setBookingType] = useState<BookingType | "">("");
  const [packages, setPackages] = useState<
    Array<{ key: string; label: string; priceCents: number }>
  >([]);
  const [packageKey, setPackageKey] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const typeConfig = bookingType ? BOOKING_CONFIG[bookingType] : null;

  // load types from db
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/pricing/types", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.ok) setTypes(json.data as string[]);
    })();
  }, []);

  // prefill bookingType from type
  useEffect(() => {
    const type = params.get("type");
    if (type) setBookingType(type as BookingType);
  }, [params]);

  // load packages whenever booking type changes
  useEffect(() => {
    setPackages([]);
    setPackageKey("");

    if (!bookingType) return;
    (async () => {
      const res = await fetch(
        `/api/pricing?type=${encodeURIComponent(bookingType)}`,
        {
          cache: "no-store",
        }
      );
      const json = await res.json();
      if (res.ok && json.ok) setPackages(json.data);
    })();
  }, [bookingType]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    console.log("SUBMIT", { bookingType, packageKey, eventDate, message });

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingType,
        packageKey,
        eventDate,
        message,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Booking request sent");
      setTimeout(() => router.push("/dashboard/bookings"), 1500);
    }

    setMsg(res.ok ? "Request Sent 🎉" : data?.error ?? "Failed");
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
        <select
          value={bookingType}
          onChange={(e) => setBookingType(e.target.value as BookingType)}
          required
        >
          <option value="">Select Booking Type</option>
          {types.map((type) => {
            return (
              <option key={type} value={type}>
                {type}
              </option>
            );
          })}
        </select>
        {packages.length > 0 && (
          <select
            value={packageKey}
            onChange={(e) => setPackageKey(e.target.value)}
            required
          >
            <option value="">Choose a package</option>
            {packages.map((pkg) => (
              <option key={pkg.key} value={pkg.key}>
                {pkg.label} - ${(pkg.priceCents / 100).toFixed(2)}
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
