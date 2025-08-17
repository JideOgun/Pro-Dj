"use client";

import { useState } from "react";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";

export default function TimeoutManagement() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const processExpiredBookings = async () => {
    setIsProcessing(true);
    setMessage(null);

    try {
      const response = await fetch("/api/bookings/timeout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          text: "Successfully processed expired bookings",
          type: "success",
        });
        // Refresh the page after a short delay
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage({
          text: data.error || "Failed to process expired bookings",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({ text: "Network error occurred", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const checkExpiredCount = async () => {
    setIsChecking(true);
    setMessage(null);

    try {
      const response = await fetch("/api/bookings/timeout");
      const data = await response.json();

      if (response.ok) {
        setMessage({
          text: `Found ${data.data.expiredCount} expired pending bookings`,
          type: "success",
        });
      } else {
        setMessage({
          text: data.error || "Failed to check expired count",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({ text: "Network error occurred", type: "error" });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-violet-400">
          Booking Timeout Management
        </h2>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h3 className="font-medium text-white mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timeout Settings
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Standard Events:</span>
              <span className="ml-2 text-white">48 hours</span>
            </div>
            <div>
              <span className="text-gray-400">Urgent Events (≤7 days):</span>
              <span className="ml-2 text-white">24 hours</span>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-900/30 text-green-200 border border-green-700/30"
                : "bg-red-900/30 text-red-200 border border-red-700/30"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {message.text}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={processExpiredBookings}
            disabled={isProcessing}
            className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                Process Expired Bookings
              </>
            )}
          </button>
          <button
            onClick={checkExpiredCount}
            disabled={isChecking}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isChecking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Checking...
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                Check Expired Count
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Expired pending bookings will be automatically declined and recovery
          suggestions will be sent to clients.
        </p>
      </div>
    </div>
  );
}
