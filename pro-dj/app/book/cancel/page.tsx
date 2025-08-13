"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CancelPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bid");

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-yellow-400 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
        <p className="text-gray-300 mb-6">
          Your payment was cancelled. Your booking is still pending and you can
          complete the payment later.
        </p>

        {bookingId && (
          <p className="text-sm text-gray-400 mb-6">
            Booking ID: <span className="font-mono">{bookingId}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-lg text-center"
          >
            Return to Homepage
          </Link>
          <Link
            href="/book"
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg text-center"
          >
            Book Another Event
          </Link>
        </div>
      </div>
    </div>
  );
}
