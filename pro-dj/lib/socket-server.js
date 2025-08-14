const { Server } = require("socket.io");

let io = null;

function getIO() {
  return io;
}

function setIO(socketIO) {
  io = socketIO;
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
