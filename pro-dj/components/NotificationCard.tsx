"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";

interface NotificationData {
  reason?: string;
  suggestions?: Array<{ message: string }>;
  [key: string]: any;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  data?: any; // Allow any type for Prisma JsonValue
  actionUrl?: string | null;
  createdAt: Date;
}

interface NotificationCardProps {
  notification: Notification;
  onDismiss: (notificationId: string) => void;
}

export default function NotificationCard({
  notification,
  onDismiss,
}: NotificationCardProps) {
  const [isDismissing, setIsDismissing] = useState(false);

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId: notification.id,
          action: "mark-read",
        }),
      });

      if (response.ok) {
        onDismiss(notification.id);
      } else {
        console.error("Failed to dismiss notification");
      }
    } catch (error) {
      console.error("Error dismissing notification:", error);
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 relative">
      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        disabled={isDismissing}
        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        title="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex justify-between items-start pr-8">
        <div className="flex-1">
          <h3 className="font-medium text-white mb-1">{notification.title}</h3>
          <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
          {notification.data && typeof notification.data === "object" && (
            <div className="text-xs text-gray-400">
              {"reason" in notification.data && notification.data.reason && (
                <p>
                  <strong>Reason:</strong> {String(notification.data.reason)}
                </p>
              )}
              {"suggestions" in notification.data &&
                Array.isArray(notification.data.suggestions) && (
                  <div className="mt-2">
                    <p className="font-medium text-yellow-300 mb-1">
                      Recovery Options:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {notification.data.suggestions.map(
                        (suggestion, index: number) => {
                          const typedSuggestion = suggestion as {
                            message: string;
                          };
                          return (
                            <li key={index} className="text-xs">
                              {typedSuggestion.message}
                            </li>
                          );
                        }
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {new Date(notification.createdAt).toLocaleDateString()}
        </span>
      </div>
      {notification.actionUrl && (
        <div className="mt-3">
          <Link
            href={notification.actionUrl}
            className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Take Action
          </Link>
        </div>
      )}
    </div>
  );
}
