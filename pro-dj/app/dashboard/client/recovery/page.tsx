"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

interface RecoverySuggestion {
  id: string;
  recoveryType: string;
  suggestedDj?: {
    id: string;
    stageName: string;
    genres: string[];
    basePriceCents: number;
  };
  status: string;
  originalBooking: {
    id: string;
    eventType: string;
    eventDate: string;
    startTime: string;
    endTime: string;
  };
}

function RecoveryPageContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [recoveries, setRecoveries] = useState<RecoverySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchRecoveries();
    }
  }, [bookingId]);

  const fetchRecoveries = async () => {
    try {
      const response = await fetch(`/api/recovery?bookingId=${bookingId}`);
      const data = await response.json();

      if (data.ok) {
        setRecoveries(data.data);
      } else {
        toast.error("Failed to load recovery suggestions");
      }
    } catch (error) {
      toast.error("Error loading recovery suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryAction = async (
    recoveryId: string,
    action: "accept" | "decline",
    response?: string
  ) => {
    setResponding(recoveryId);

    try {
      const res = await fetch("/api/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recoveryId,
          action,
          response: response || "",
        }),
      });

      const data = await res.json();

      if (data.ok) {
        toast.success(data.message);
        // Refresh recoveries
        fetchRecoveries();
      } else {
        toast.error(data.error || "Failed to process action");
      }
    } catch (error) {
      toast.error("Error processing action");
    } finally {
      setResponding(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">
              Loading recovery suggestions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Invalid Recovery Request
            </h1>
            <p className="text-gray-400">
              No booking ID provided for recovery suggestions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (recoveries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-green-400 mb-4">
              No Recovery Needed
            </h1>
            <p className="text-gray-400">
              No pending recovery suggestions for this booking.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-violet-400 mb-2">
            Booking Recovery Options
          </h1>
          <p className="text-gray-400">
            One of your DJs has declined their booking. Here are some options to
            help you recover:
          </p>
        </div>

        <div className="space-y-6">
          {recoveries.map((recovery) => (
            <div
              key={recovery.id}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {recovery.recoveryType === "EXTEND_DJ" &&
                      "Extend Existing DJ"}
                    {recovery.recoveryType === "NEW_DJ" && "Book New DJ"}
                    {recovery.recoveryType === "REFUND" && "Process Refund"}
                  </h3>

                  <div className="text-gray-300 mb-4">
                    <p>
                      <strong>Event:</strong>{" "}
                      {recovery.originalBooking.eventType}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(
                        recovery.originalBooking.eventDate
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Time:</strong>{" "}
                      {new Date(
                        recovery.originalBooking.startTime
                      ).toLocaleTimeString()}{" "}
                      -{" "}
                      {new Date(
                        recovery.originalBooking.endTime
                      ).toLocaleTimeString()}
                    </p>
                  </div>

                  {recovery.suggestedDj && (
                    <div className="bg-gray-700 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-white mb-2">
                        Suggested DJ: {recovery.suggestedDj.stageName}
                      </h4>
                      <p className="text-gray-400 text-sm mb-2">
                        Genres: {recovery.suggestedDj.genres.join(", ")}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Base Rate: $
                        {(recovery.suggestedDj.basePriceCents / 100).toFixed(2)}
                        /hr
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      recovery.status === "PENDING_ADMIN_REVIEW"
                        ? "bg-yellow-900 text-yellow-300"
                        : recovery.status === "DJ_ASSIGNED"
                        ? "bg-green-900 text-green-300"
                        : "bg-red-900 text-red-300"
                    }`}
                  >
                    {recovery.status}
                  </span>
                </div>
              </div>

              {recovery.status === "PENDING_ADMIN_REVIEW" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRecoveryAction(recovery.id, "accept")}
                    disabled={responding === recovery.id}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {responding === recovery.id ? "Processing..." : "Accept"}
                  </button>
                  <button
                    onClick={() => handleRecoveryAction(recovery.id, "decline")}
                    disabled={responding === recovery.id}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {responding === recovery.id ? "Processing..." : "Decline"}
                  </button>
                </div>
              )}

              {recovery.status !== "PENDING_ADMIN_REVIEW" && (
                <div className="text-sm text-gray-400">
                  <p>
                    <strong>Status:</strong> {recovery.status}
                  </p>
                  {recovery.status === "DJ_ASSIGNED" && (
                    <p className="text-green-400 mt-1">
                      ✓ Recovery action has been processed successfully
                    </p>
                  )}
                  {recovery.status === "CANCELLED" && (
                    <p className="text-red-400 mt-1">
                      ✗ Recovery suggestion was declined
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href="/dashboard/client"
            className="inline-block bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default function RecoveryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <RecoveryPageContent />
    </Suspense>
  );
}
