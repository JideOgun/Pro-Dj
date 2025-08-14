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
  const [contactEmail, setContactEmail] = useState("");
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
        extra: { contactEmail },
      }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Booking request sent");
      setTimeout(() => router.push("/dashboard/client"), 1500);
    }

    setMsg(res.ok ? "Request Sent 🎉" : data?.error ?? "Failed");
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="text-6xl mb-4">🎵</div>
            <h1 className="text-2xl font-bold mb-4">Book Your Event</h1>
            <p className="text-gray-300 mb-6">
              Please sign in to request a booking and start planning your
              perfect event.
            </p>
            <button
              onClick={() => signIn("google", { callbackUrl: "/book" })}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Book Your Event</h1>
          <p className="text-xl text-gray-300">
            Let&apos;s create something amazing together
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-gray-800 rounded-lg p-8 max-w-2xl mx-auto">
          <form onSubmit={submit} className="space-y-6">
            {/* Event Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event Type *
              </label>
              <select
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value as BookingType)}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="">Select your event type</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Package Selection */}
            {packages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Package *
                </label>
                <select
                  value={packageKey}
                  onChange={(e) => setPackageKey(e.target.value)}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  <option value="">Choose your package</option>
                  {packages.map((pkg) => (
                    <option key={pkg.key} value={pkg.key}>
                      {pkg.label} - ${(pkg.priceCents / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Extra Fields */}
            {typeConfig?.extraFields.map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {field}
                </label>
                <input
                  type="text"
                  placeholder={field}
                  value={extra[field] ?? ""}
                  onChange={(e) =>
                    setExtra({ ...extra, [field]: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            ))}

            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event Date *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                placeholder="your-email@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event Details *
              </label>
              <textarea
                placeholder="Tell us about your event, special requirements, venue details, etc."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
            >
              Submit Booking Request
            </button>
          </form>

          {/* Status Message */}
          {msg && (
            <div
              className={`mt-6 p-4 rounded-lg text-center ${
                msg.includes("🎉")
                  ? "bg-green-900/50 text-green-200 border border-green-500/30"
                  : "bg-red-900/50 text-red-200 border border-red-500/30"
              }`}
            >
              {msg}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-3 text-violet-400">
              What happens next?
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div>
                <div className="text-2xl mb-2">📝</div>
                <p>
                  We&apos;ll review your request and get back to you within 24
                  hours
                </p>
              </div>
              <div>
                <div className="text-2xl mb-2">💰</div>
                <p>
                  You&apos;ll receive a custom quote based on your event details
                </p>
              </div>
              <div>
                <div className="text-2xl mb-2">✅</div>
                <p>Once confirmed, secure your booking with a payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
