"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
  likes: number;
  dislikes: number;
  userLiked?: boolean;
  userDisliked?: boolean;
  replies?: Comment[];
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emitBookingUpdate: (bookingId: string, status: string) => void;
  // Mix-related functions
  joinMixRoom: (mixId: string) => void;
  leaveMixRoom: (mixId: string) => void;
  emitMixLiked: (
    mixId: string,
    userId: string,
    liked: boolean,
    likeCount: number
  ) => void;
  emitMixPlayed: (mixId: string, playCount: number) => void;
  emitCommentAdded: (
    mixId: string,
    commentId: string,
    commentCount: number,
    comment: Comment
  ) => void;
  emitCommentUpdated: (
    mixId: string,
    commentId: string,
    commentCount: number,
    action: "edited" | "deleted",
    comment?: Comment
  ) => void;
  emitCommentLiked: (
    mixId: string,
    commentId: string,
    userId: string,
    liked: boolean,
    likeCount: number
  ) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  emitBookingUpdate: () => {},
  joinMixRoom: () => {},
  leaveMixRoom: () => {},
  emitMixLiked: () => {},
  emitMixPlayed: () => {},
  emitCommentAdded: () => {},
  emitCommentUpdated: () => {},
  emitCommentLiked: () => {},
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
      setIsConnected(true);

      // Join user-specific room
      newSocket.emit("join-room", { userId, role });
    });

    newSocket.on("disconnect", () => {
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

  const joinMixRoom = (mixId: string) => {
    if (socket && isConnected) {
      socket.emit("join-mix-room", { mixId });
    }
  };

  const leaveMixRoom = (mixId: string) => {
    if (socket && isConnected) {
      socket.emit("leave-mix-room", { mixId });
    }
  };

  const emitMixLiked = (
    mixId: string,
    userId: string,
    liked: boolean,
    likeCount: number
  ) => {
    if (socket && isConnected) {
      socket.emit("mix-liked", { mixId, userId, liked, likeCount });
    }
  };

  const emitMixPlayed = (mixId: string, playCount: number) => {
    if (socket && isConnected) {
      socket.emit("mix-played", { mixId, playCount });
    }
  };

  const emitCommentAdded = (
    mixId: string,
    commentId: string,
    commentCount: number,
    comment: Comment
  ) => {
    if (socket && isConnected) {
      socket.emit("comment-added", { mixId, commentId, commentCount, comment });
    }
  };

  const emitCommentUpdated = (
    mixId: string,
    commentId: string,
    commentCount: number,
    action: "edited" | "deleted",
    comment?: Comment
  ) => {
    if (socket && isConnected) {
      socket.emit("comment-updated", {
        mixId,
        commentId,
        commentCount,
        action,
        comment,
      });
    }
  };

  const emitCommentLiked = (
    mixId: string,
    commentId: string,
    userId: string,
    liked: boolean,
    likeCount: number
  ) => {
    if (socket && isConnected) {
      socket.emit("comment-liked", {
        mixId,
        commentId,
        userId,
        liked,
        likeCount,
      });
    }
  };

  const value = {
    socket,
    isConnected,
    emitBookingUpdate,
    joinMixRoom,
    leaveMixRoom,
    emitMixLiked,
    emitMixPlayed,
    emitCommentAdded,
    emitCommentUpdated,
    emitCommentLiked,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
