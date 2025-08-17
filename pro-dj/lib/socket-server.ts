import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return io;
}

export function setIO(socketIO: SocketIOServer) {
  io = socketIO;
}

export function emitBookingUpdate(bookingId: string, status: string) {
  if (io) {
    io.emit("booking-status-changed", { bookingId, status });
    console.log("📡 WebSocket event emitted:", { bookingId, status });
  }
}
