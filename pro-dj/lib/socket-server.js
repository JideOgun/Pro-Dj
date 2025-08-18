const { Server } = require("socket.io");

let io = null;

function getIO() {
  return io;
}

function setIO(socketIO) {
  io = socketIO;
  
  // Set up socket event handlers
  io.on("connection", (socket) => {
    console.log("🔗 New socket connection:", socket.id);

    // Join user-specific room
    socket.on("join-room", (data) => {
      const { userId, role } = data;
      const room = `user-${userId}-${role}`;
      socket.join(room);
      console.log(`👤 User ${userId} (${role}) joined room: ${room}`);
    });

    // Join mix-specific room for real-time updates
    socket.on("join-mix-room", (data) => {
      const room = `mix-${data.mixId}`;
      socket.join(room);
      console.log(`🎵 User ${socket.id} joined mix room: ${room}`);
      console.log(`👥 Users in room ${room}:`, io.sockets.adapter.rooms.get(room)?.size || 0);
    });

    // Leave mix-specific room
    socket.on("leave-mix-room", (data) => {
      const room = `mix-${data.mixId}`;
      socket.leave(room);
      console.log(`🎵 User ${socket.id} left mix room: ${room}`);
    });

    // Handle mix like updates
    socket.on("mix-liked", (data) => {
      console.log("❤️ Mix liked event received:", data);
      console.log("📡 Broadcasting mix like update globally");
      // Broadcast to ALL connected users for comprehensive real-time updates
      io.emit("mix-like-updated", data);
      console.log("✅ Mix like update broadcasted globally");
    });

    // Handle mix play count updates
    socket.on("mix-played", (data) => {
      console.log("▶️ Mix played:", data);
      io.to(`mix-${data.mixId}`).emit("mix-play-count-updated", data);
    });

    // Handle comment updates (add)
    socket.on("comment-added", (data) => {
      console.log("💬 Comment added:", data);
      io.to(`mix-${data.mixId}`).emit("comment-added", data);
    });

    // Handle comment updates (edit/delete)
    socket.on("comment-updated", (data) => {
      console.log("💬 Comment updated:", data);
      io.to(`mix-${data.mixId}`).emit("comment-updated", data);
    });

    // Handle comment like updates
    socket.on("comment-liked", (data) => {
      console.log("👍 Comment liked:", data);
      io.to(`mix-${data.mixId}`).emit("comment-like-updated", data);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected:", socket.id);
    });
  });
}

function emitBookingUpdate(bookingId, status) {
  if (io) {
    io.emit("booking-status-changed", { bookingId, status });
    console.log("📡 WebSocket event emitted:", { bookingId, status });
  }
}

module.exports = {
  getIO,
  setIO,
  emitBookingUpdate,
};
