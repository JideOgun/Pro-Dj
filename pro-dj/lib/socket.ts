import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";

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

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log("🔌 Setting up Socket.IO server...");
    const io = new SocketIOServer(res.socket.server, {
      path: "/api/socketio",
      addTrailingSlash: false,
    });

    io.on("connection", (socket) => {
      console.log("🔗 Client connected:", socket.id);

      // Join user to their role-specific room
      socket.on("join-room", (data: { userId: string; role: string }) => {
        const room = `${data.role}-${data.userId}`;
        socket.join(room);
        console.log(`👤 User ${data.userId} joined room: ${room}`);
      });

      // Join mix-specific room for real-time updates
      socket.on("join-mix-room", (data: { mixId: string }) => {
        const room = `mix-${data.mixId}`;
        socket.join(room);
        console.log(`🎵 User ${socket.id} joined mix room: ${room}`);
        console.log(
          `👥 Users in room ${room}:`,
          io.sockets.adapter.rooms.get(room)?.size || 0
        );
      });

      // Leave mix-specific room
      socket.on("leave-mix-room", (data: { mixId: string }) => {
        const room = `mix-${data.mixId}`;
        socket.leave(room);
        console.log(`🎵 User left mix room: ${room}`);
      });

      // Handle booking updates
      socket.on(
        "booking-updated",
        (data: { bookingId: string; status: string }) => {
          console.log("📊 Booking updated:", data);
          // Broadcast to all connected clients
          io.emit("booking-status-changed", data);
        }
      );

      // Handle mix like updates
      socket.on(
        "mix-liked",
        (data: {
          mixId: string;
          userId: string;
          liked: boolean;
          likeCount: number;
        }) => {
          console.log("❤️ Mix liked event received:", data);
          console.log("📡 Broadcasting mix like update globally");
          // Broadcast to ALL connected users for comprehensive real-time updates
          io.emit("mix-like-updated", data);
          console.log("✅ Mix like update broadcasted globally");
        }
      );

      // Handle mix play count updates
      socket.on("mix-played", (data: { mixId: string; playCount: number }) => {
        console.log("▶️ Mix played:", data);
        // Broadcast to all users in the mix room
        io.to(`mix-${data.mixId}`).emit("mix-play-count-updated", data);
      });

      // Handle comment updates
      socket.on(
        "comment-added",
        (data: {
          mixId: string;
          commentId: string;
          commentCount: number;
          comment: Comment;
        }) => {
          console.log("💬 Comment added:", data);
          // Broadcast to all users in the mix room
          io.to(`mix-${data.mixId}`).emit("comment-added", data);
        }
      );

      // Handle comment updates (edit/delete)
      socket.on(
        "comment-updated",
        (data: {
          mixId: string;
          commentId: string;
          commentCount: number;
          action: "edited" | "deleted";
          comment?: Comment;
        }) => {
          console.log("💬 Comment updated:", data);
          // Broadcast to all users in the mix room
          io.to(`mix-${data.mixId}`).emit("comment-updated", data);
        }
      );

      // Handle comment like updates
      socket.on(
        "comment-liked",
        (data: {
          mixId: string;
          commentId: string;
          userId: string;
          liked: boolean;
          likeCount: number;
        }) => {
          console.log("👍 Comment liked:", data);
          // Broadcast to all users in the mix room
          io.to(`mix-${data.mixId}`).emit("comment-like-updated", data);
        }
      );

      socket.on("disconnect", () => {
        console.log("🔌 Client disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default ioHandler;
