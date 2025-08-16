"use client";

import { useState } from "react";
import { AlertTriangle, Music, X, DollarSign } from "lucide-react";
import Link from "next/link";

interface DjTerminationNoticeProps {
  notification: {
    id: string;
    title: string;
    message: string;
    data: {
      bookingId: string;
      djName: string;
      eventDate: string;
      eventType: string;
      refundAmount?: number;
      terminationReason: string;
    };
    createdAt: string;
  };
  onDismiss?: (notificationId: string) => void;
}

export default function DjTerminationNotice({
  notification,
  onDismiss,
}: DjTerminationNoticeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRecoveryAction = async (
    action: "find_replacement" | "refund"
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/recovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "find_replacement" ? "accept" : "decline",
          recoveryId: notification.data.recoveryId,
          notificationId: notification.id,
          response:
            action === "find_replacement"
              ? "Client chose to find replacement DJ"
              : "Client chose refund",
        }),
      });

      if (response.ok) {
        // Handle success
        if (action === "find_replacement") {
          // Redirect to booking page with suggested DJ
          const suggestedDjId = notification.data.suggestedDjId;
          if (suggestedDjId) {
            window.location.href = `/book?djId=${suggestedDjId}&recovery=true`;
          } else {
            window.location.href = "/book?recovery=true";
          }
        } else {
          // Show refund confirmation
          alert(
            "Refund request submitted. You will receive confirmation shortly."
          );
        }

        // Dismiss notification
        if (onDismiss) {
          onDismiss(notification.id);
        }
      } else {
        const error = await response.json();
        alert(error.error || "Failed to process request");
      }
    } catch (error) {
      alert("Failed to process request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-red-200 font-semibold">{notification.title}</h3>
          </div>

          <p className="text-red-300 text-sm mb-3">{notification.message}</p>

          <div className="bg-red-900/30 rounded p-3 mb-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-red-400">DJ:</span>
                <span className="text-red-200 ml-2">
                  {notification.data.djName}
                </span>
              </div>
              <div>
                <span className="text-red-400">Event:</span>
                <span className="text-red-200 ml-2">
                  {notification.data.eventType}
                </span>
              </div>
              <div>
                <span className="text-red-400">Date:</span>
                <span className="text-red-200 ml-2">
                  {new Date(notification.data.eventDate).toLocaleDateString()}
                </span>
              </div>
              {notification.data.refundAmount && (
                <div>
                  <span className="text-red-400">Refund:</span>
                  <span className="text-red-200 ml-2">
                    ${(notification.data.refundAmount / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-red-400 hover:text-red-300 text-sm underline"
            >
              View recovery options
            </button>
          )}

          {isExpanded && (
            <div className="space-y-3">
              <h4 className="text-red-200 font-medium">Recovery Options:</h4>

              <div className="grid md:grid-cols-2 gap-3">
                <button
                  onClick={() => handleRecoveryAction("find_replacement")}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Music size={16} />
                  Get Suggestions
                </button>

                <button
                  onClick={() => (window.location.href = "/book?recovery=true")}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Music size={16} />
                  Browse All DJs
                </button>

                <button
                  onClick={() => handleRecoveryAction("refund")}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <DollarSign size={16} />
                  Request Refund
                </button>
              </div>

              <div className="text-xs text-red-400">
                <p>
                  • Get Suggestions: We'll suggest one DJ that matches your
                  event preferences to replace the original DJ
                </p>
                <p>
                  • Browse All DJs: Choose from all available DJs on the
                  platform (only one DJ per time slot)
                </p>
                <p>
                  • Request Refund: Get a full refund for your cancelled booking
                </p>
              </div>
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={() => onDismiss(notification.id)}
            className="text-red-400 hover:text-red-300 transition-colors ml-4"
            title="Dismiss notification"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
