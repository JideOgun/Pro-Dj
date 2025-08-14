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
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const [bookingType, setBookingType] = useState<BookingType | "">("");
  const [packages, setPackages] = useState<
    Array<{ key: string; label: string; priceCents: number }>
  >([]);
  const [packageKey, setPackageKey] = useState("");
  const [selectedDjs, setSelectedDjs] = useState<
    Array<{
      djId: string;
      startTime: string;
      endTime: string;
      packageKey: string;
      dj: {
        id: string;
        stageName: string;
        genres: string[];
        basePriceCents: number;
      };
    }>
  >([]);
  const [djs, setDjs] = useState<
    Array<{
      id: string;
      stageName: string;
      genres: string[];
      basePriceCents: number;
    }>
  >([]);
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [contactEmail, setContactEmail] = useState("");
  const typeConfig = bookingType ? BOOKING_CONFIG[bookingType] : null;

  // Function to calculate duration in hours
  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    let duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Handle overnight events (end time before start time)
    if (duration < 0) {
      duration += 24;
    }

    return Math.round(duration * 100) / 100; // Round to 2 decimal places
  };

  // Function to auto-select package based on duration
  const autoSelectPackage = (duration: number): string => {
    if (duration <= 0) return "";

    // Find the best matching package based on duration
    const matchingPackage = packages.find((pkg) => {
      // Extract duration from package label (e.g., "2 Hour Package" -> 2)
      const durationMatch = pkg.label.match(/(\d+)\s*hour/i);
      if (durationMatch) {
        const packageDuration = parseInt(durationMatch[1]);
        return packageDuration >= duration;
      }
      return false;
    });

    return matchingPackage?.key || "";
  };

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

  // load available DJs
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/djs", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.ok) setDjs(json.data);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    if (selectedDjs.length === 0) {
      setMsg("Please select at least one DJ for your event");
      return;
    }

    console.log("SUBMIT", {
      bookingType,
      packageKey,
      eventDate,
      message,
      selectedDjs,
    });

    // Validate that all DJs have packages selected
    const djsWithoutPackages = selectedDjs.filter((dj) => !dj.packageKey);
    if (djsWithoutPackages.length > 0) {
      setMsg("Please select a package for each DJ");
      return;
    }

    // Create multiple bookings - one for each DJ
    const bookingPromises = selectedDjs.map((djBooking) =>
      fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType,
          packageKey: djBooking.packageKey, // Use individual DJ package
          eventDate,
          startTime: `${eventDate}T${djBooking.startTime}`,
          endTime: `${eventDate}T${djBooking.endTime}`,
          message,
          djId: djBooking.djId,
          extra: { contactEmail },
        }),
      })
    );

    try {
      const responses = await Promise.all(bookingPromises);
      const results = await Promise.all(responses.map((res) => res.json()));

      const successCount = results.filter((result) => result.ok).length;

      if (successCount === selectedDjs.length) {
        toast.success(
          `${successCount} booking request${
            successCount > 1 ? "s" : ""
          } sent successfully!`
        );
        setTimeout(() => router.push("/dashboard/client"), 1500);
      } else {
        toast.error(
          `Some bookings failed. ${successCount}/${selectedDjs.length} successful.`
        );
      }

      setMsg(
        successCount === selectedDjs.length
          ? "All Requests Sent 🎉"
          : "Some requests failed"
      );
    } catch (error) {
      toast.error("Failed to send booking requests");
      setMsg("Failed to send requests");
    }
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

  // Restrict booking to CLIENT users only
  if (data?.user?.role !== "CLIENT") {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
            <p className="text-gray-300 mb-6">
              Booking is only available for client accounts. DJs and admins
              cannot create booking requests.
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Go Back
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

            {/* Multi-DJ Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select DJs for Your Event *
              </label>

              {/* DJ Selection Interface */}
              <div className="space-y-4">
                {/* Available DJs */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">
                    Available DJs
                  </h4>
                  <div className="grid gap-3">
                    {djs.map((dj) => {
                      const isSelected = selectedDjs.some(
                        (sd) => sd.djId === dj.id
                      );
                      return (
                        <div
                          key={dj.id}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-violet-500 bg-violet-900/20"
                              : "border-gray-600 bg-gray-700 hover:border-gray-500"
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedDjs(
                                selectedDjs.filter((sd) => sd.djId !== dj.id)
                              );
                            } else {
                              const newDj = {
                                djId: dj.id,
                                startTime: startTime,
                                endTime: endTime,
                                packageKey: "", // Will be auto-selected if times are set
                                dj: dj,
                              };

                              // Auto-select package if both times are available
                              if (startTime && endTime) {
                                const duration = calculateDuration(
                                  startTime,
                                  endTime
                                );
                                newDj.packageKey = autoSelectPackage(duration);
                              }

                              setSelectedDjs([...selectedDjs, newDj]);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-white">
                                {dj.stageName}
                              </div>
                              <div className="text-sm text-gray-400">
                                {dj.genres.join(", ")}
                              </div>
                              <div className="text-xs text-gray-500">
                                Base: ${(dj.basePriceCents / 100).toFixed(2)}/hr
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? "border-violet-500 bg-violet-500"
                                  : "border-gray-400"
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected DJs with Time Slots */}
                {selectedDjs.length > 0 && (
                  <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-violet-300 mb-3">
                      Selected DJs & Time Slots
                    </h4>
                    <div className="space-y-3">
                      {selectedDjs.map((selectedDj, index) => (
                        <div
                          key={selectedDj.djId}
                          className="bg-gray-800 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-medium text-white">
                                {selectedDj.dj.stageName}
                              </div>
                              <div className="text-sm text-gray-400">
                                {selectedDj.dj.genres.join(", ")}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                setSelectedDjs(
                                  selectedDjs.filter((_, i) => i !== index)
                                )
                              }
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                Start Time
                              </label>
                              <input
                                type="time"
                                value={selectedDj.startTime}
                                onChange={(e) => {
                                  const updated = [...selectedDjs];
                                  updated[index].startTime = e.target.value;

                                  // Auto-select package based on duration
                                  if (updated[index].endTime) {
                                    const duration = calculateDuration(
                                      e.target.value,
                                      updated[index].endTime
                                    );
                                    updated[index].packageKey =
                                      autoSelectPackage(duration);
                                  }

                                  setSelectedDjs(updated);
                                }}
                                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                End Time
                              </label>
                              <input
                                type="time"
                                value={selectedDj.endTime}
                                onChange={(e) => {
                                  const updated = [...selectedDjs];
                                  updated[index].endTime = e.target.value;

                                  // Auto-select package based on duration
                                  if (updated[index].startTime) {
                                    const duration = calculateDuration(
                                      updated[index].startTime,
                                      e.target.value
                                    );
                                    updated[index].packageKey =
                                      autoSelectPackage(duration);
                                  }

                                  setSelectedDjs(updated);
                                }}
                                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                              />
                            </div>
                          </div>

                          {/* Duration Display */}
                          {selectedDj.startTime && selectedDj.endTime && (
                            <div className="text-xs text-gray-400 mb-2">
                              Duration:{" "}
                              {calculateDuration(
                                selectedDj.startTime,
                                selectedDj.endTime
                              )}{" "}
                              hours
                            </div>
                          )}

                          {/* Package Selection for this DJ */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Package *
                            </label>
                            <select
                              value={selectedDj.packageKey}
                              onChange={(e) => {
                                const updated = [...selectedDjs];
                                updated[index].packageKey = e.target.value;
                                setSelectedDjs(updated);
                              }}
                              className={`w-full bg-gray-700 border rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500 ${
                                selectedDj.packageKey
                                  ? "border-green-500"
                                  : "border-gray-600"
                              }`}
                              required
                            >
                              <option value="">Select a package</option>
                              {packages.map((pkg) => {
                                const durationMatch =
                                  pkg.label.match(/(\d+)\s*hour/i);
                                const packageDuration = durationMatch
                                  ? parseInt(durationMatch[1])
                                  : 0;
                                const currentDuration = calculateDuration(
                                  selectedDj.startTime,
                                  selectedDj.endTime
                                );
                                const isRecommended =
                                  packageDuration >= currentDuration &&
                                  currentDuration > 0;

                                return (
                                  <option key={pkg.key} value={pkg.key}>
                                    {pkg.label} - $
                                    {(pkg.priceCents / 100).toFixed(2)}
                                    {isRecommended ? " (Recommended)" : ""}
                                  </option>
                                );
                              })}
                            </select>
                            {selectedDj.packageKey && (
                              <div className="text-xs text-green-400 mt-1">
                                ✓ Package auto-selected based on duration
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Select one or more DJs and set their individual time slots.
                Packages will be auto-selected based on duration. Each DJ will
                receive a separate booking request.
              </p>
            </div>

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
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {/* Event Overview Time (for reference) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Start Time (Reference)
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="When your event starts"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event End Time (Reference)
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="When your event ends"
                />
              </div>
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
