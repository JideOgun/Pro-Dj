import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";

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

      // Handle booking updates
      socket.on(
        "booking-updated",
        (data: { bookingId: string; status: string }) => {
          console.log("📊 Booking updated:", data);
          // Broadcast to all connected clients
          io.emit("booking-status-changed", data);
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
