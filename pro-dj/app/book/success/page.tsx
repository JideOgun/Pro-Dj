"use client";

import { useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Booking {
  id: string;
  eventType: string;
  eventDate: string;
  status: string;
  quotedPriceCents: number;
  packageKey: string | null;
  details: Record<string, unknown>;
  createdAt: string;
  isPaid: boolean;
  paidAt: string | null;
  userId: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingId = searchParams.get("bid");

  useEffect(() => {
    if (!bookingId) {
      setError("No booking ID provided");
      setLoading(false);
      return;
    }

    async function fetchBooking() {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch booking");
        }
        const data = await response.json();
        setBooking(data.booking);
      } catch (err) {
        setError("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();

    // Refresh booking data every 2 seconds to catch webhook updates
    const interval = setInterval(() => {
      fetchBooking();
    }, 2000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p>Loading your booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-300 mb-6">
            {error || "Unable to load your booking details"}
          </p>
          <Link
            href="/"
            className="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-lg inline-block"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-green-400 text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-gray-300 text-lg">
            Your booking has been confirmed and payment received
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-violet-400">
            Booking Details
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-300 mb-2">
                Event Information
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400">Event Type:</span>
                  <span className="ml-2 text-white">{booking.eventType}</span>
                </div>
                <div>
                  <span className="text-gray-400">Date:</span>
                  <span className="ml-2 text-white">
                    {formatDate(booking.eventDate)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Package:</span>
                  <span className="ml-2 text-white">
                    {booking.packageKey || "Custom Package"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span className="ml-2 text-green-400 font-medium">
                    {booking.status}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-300 mb-2">
                Payment Information
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400">Amount Paid:</span>
                  <span className="ml-2 text-white font-semibold">
                    {formatPrice(booking.quotedPriceCents)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Payment Status:</span>
                  <span className="ml-2 text-green-400 font-medium">
                    {booking.isPaid ? "Paid" : "Pending"}
                  </span>
                </div>
                {booking.paidAt && (
                  <div>
                    <span className="text-gray-400">Paid On:</span>
                    <span className="ml-2 text-white">
                      {formatDate(booking.paidAt)}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Booking ID:</span>
                  <span className="ml-2 text-gray-300 font-mono text-sm">
                    {booking.id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details if available */}
          {booking.details && Object.keys(booking.details).length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="font-medium text-gray-300 mb-2">
                Contact Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {(booking.details.contactEmail as string) && (
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="ml-2 text-white">
                      {booking.details.contactEmail as string}
                    </span>
                  </div>
                )}
                {(booking.details.contactPhone as string) && (
                  <div>
                    <span className="text-gray-400">Phone:</span>
                    <span className="ml-2 text-white">
                      {booking.details.contactPhone as string}
                    </span>
                  </div>
                )}
                {(booking.details.venue as string) && (
                  <div>
                    <span className="text-gray-400">Venue:</span>
                    <span className="ml-2 text-white">
                      {booking.details.venue as string}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-violet-400">
            What&apos;s Next?
          </h2>
          <div className="space-y-3 text-gray-300">
            <p>✅ Your payment has been processed successfully</p>
            <p>📧 You&apos;ll receive a confirmation email shortly</p>
            <p>📞 Our DJ will contact you within 24 hours to discuss details</p>
            <p>📅 We&apos;ll send you a reminder 1 week before your event</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {session?.user && booking && session.user.id === booking.userId ? (
            <>
              {/* Current user owns this booking - show normal actions */}
              <Link
                href="/"
                className="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-lg text-center"
              >
                Return to Homepage
              </Link>
              <Link
                href={
                  session.user.role === "CLIENT"
                    ? "/dashboard/client"
                    : "/dashboard/bookings"
                }
                className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg text-center"
              >
                View All Bookings
              </Link>
            </>
          ) : session?.user && booking && session.user.id !== booking.userId ? (
            <>
              {/* Current user is different from booking owner - only allow sign out */}
              <div className="text-center w-full">
                <p className="text-yellow-400 mb-4">
                  ⚠️ You are logged in as a different user than the one who made
                  this payment.
                </p>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth" })}
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-center"
                >
                  Sign Out & Sign In as Correct User
                </button>
              </div>
            </>
          ) : (
            <>
              {/* No user logged in - show return to homepage */}
              <Link
                href="/"
                className="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-lg text-center"
              >
                Return to Homepage
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
