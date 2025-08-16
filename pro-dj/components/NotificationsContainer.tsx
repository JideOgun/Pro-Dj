"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import NotificationCard from "./NotificationCard";

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

interface NotificationsContainerProps {
  initialNotifications: Notification[];
}

export default function NotificationsContainer({
  initialNotifications,
}: NotificationsContainerProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);

  const handleDismiss = (notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId)
    );
  };

  const handleDismissAll = async () => {
    try {
      // Mark all notifications as read
      await Promise.all(
        notifications.map((notification) =>
          fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              notificationId: notification.id,
              action: "mark-read",
            }),
          })
        )
      );

      // Clear all notifications from state
      setNotifications([]);
    } catch (error) {
      console.error("Error dismissing all notifications:", error);
    }
  };

  // Hide the entire section if no notifications
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-yellow-400">
          <AlertTriangle className="w-5 h-5 inline mr-2" />
          Important Notifications ({notifications.length})
        </h2>
        <button
          onClick={handleDismissAll}
          className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
        >
          Dismiss All
        </button>
      </div>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}
