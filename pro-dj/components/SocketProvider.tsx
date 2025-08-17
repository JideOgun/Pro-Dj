"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emitBookingUpdate: (bookingId: string, status: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  emitBookingUpdate: () => {},
});

export const useSocketContext = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
  userId?: string;
  role?: string;
}

export function SocketProvider({
  children,
  userId,
  role,
}: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId || !role) return;

    // Initialize socket connection
    const newSocket = io({
      path: "/api/socket",
      transports: ["websocket"],
      timeout: 20000,
      forceNew: true,
      reconnection: false, // Disable automatic reconnection
      autoConnect: false, // Don't auto-connect
    });

    setSocket(newSocket);

    // Manually connect
    newSocket.connect();

    // Connection events
    newSocket.on("connect", () => {
      console.log("🔗 Socket connected:", newSocket.id);
      setIsConnected(true);

      // Join user-specific room
      newSocket.emit("join-room", { userId, role });
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [userId, role]);

  const emitBookingUpdate = (bookingId: string, status: string) => {
    if (socket && isConnected) {
      socket.emit("booking-updated", { bookingId, status });
    }
  };

  const value = {
    socket,
    isConnected,
    emitBookingUpdate,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
