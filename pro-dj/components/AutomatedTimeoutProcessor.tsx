"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export default function AutomatedTimeoutProcessor() {
  const { data: session } = useSession();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const processExpiredBookings = async () => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;

    try {
      const response = await fetch("/api/bookings/timeout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🕐 Automated timeout processing completed:", data.message);
      } else {
        console.error("❌ Automated timeout processing failed");
      }
    } catch (error) {
      console.error("❌ Error in automated timeout processing:", error);
    } finally {
      isProcessingRef.current = false;
    }
  };

  useEffect(() => {
    // Only run for admin users
    if (!session?.user || session.user.role !== "ADMIN") {
      return;
    }

    // Process expired bookings immediately when admin loads the page
    processExpiredBookings();

    // Set up periodic processing every 30 minutes
    intervalRef.current = setInterval(processExpiredBookings, 30 * 60 * 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session]);

  // This component doesn't render anything visible
  return null;
}
