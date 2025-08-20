import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return io;
}

export function setIO(socketIO: SocketIOServer) {
  io = socketIO;
}

export function emitBookingUpdate(
  bookingId: string,
  status: string,
  isPaid?: boolean
) {
  if (io) {
    io.emit("booking-status-changed", { bookingId, status, isPaid });
    console.log("📡 WebSocket event emitted:", { bookingId, status, isPaid });
  }
}
