"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketProps {
  userId?: string;
  role?: string;
}

export function useSocket({ userId, role }: UseSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId || !role) return;

    // Check if we're in production (Vercel) where WebSockets aren't supported
    const isProduction = process.env.NODE_ENV === 'production' || 
                        window.location.hostname !== 'localhost';

    if (isProduction) {
      console.log("🌐 Production environment detected - WebSockets disabled");
      // In production, we'll use polling or other fallback methods
      // For now, we'll just set connected to false and handle gracefully
      setIsConnected(false);
      return;
    }

    // Only initialize WebSocket in development
    try {
      // Initialize socket connection
      const socket = io({
        path: "/api/socket",
      });

      socketRef.current = socket;

      // Connection events
      socket.on("connect", () => {
        console.log("🔗 Socket connected in development:", socket.id);
        setIsConnected(true);

        // Join user-specific room
        socket.emit("join-room", { userId, role });
      });

      socket.on("disconnect", () => {
        console.log("🔌 Socket disconnected");
        setIsConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        setIsConnected(false);
      });

      // Cleanup on unmount
      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    } catch (error) {
      console.error("❌ Failed to initialize WebSocket:", error);
      setIsConnected(false);
    }
  }, [userId, role]);

  // Function to emit booking updates
  const emitBookingUpdate = (bookingId: string, status: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("booking-updated", { bookingId, status });
    } else {
      // In production, we could implement a fallback like making an API call
      console.log("📡 Booking update (production fallback):", { bookingId, status });
    }
  };

  // Function to listen for booking status changes
  const onBookingStatusChange = (
    callback: (data: { bookingId: string; status: string }) => void
  ) => {
    if (socketRef.current) {
      socketRef.current.on("booking-status-changed", callback);
    }
  };

  // Function to remove booking status change listener
  const offBookingStatusChange = (
    callback: (data: { bookingId: string; status: string }) => void
  ) => {
    if (socketRef.current) {
      socketRef.current.off("booking-status-changed", callback);
    }
  };

  return {
    isConnected,
    emitBookingUpdate,
    onBookingStatusChange,
    offBookingStatusChange,
  };
}
