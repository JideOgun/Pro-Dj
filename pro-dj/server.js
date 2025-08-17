/* eslint-disable */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { setIO } = require('./lib/socket-server.js');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Set up Socket.IO
  const io = new Server(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket'],
    allowEIO3: true,
  });

  console.log('🔌 Socket.IO server initialized');

  // Store the io instance globally
  setIO(io);

  io.on('connection', (socket) => {
    console.log('🔗 Client connected:', socket.id);

    socket.on('join-room', (data) => {
      const room = `${data.role}-${data.userId}`;
      socket.join(room);
      console.log(`👤 User ${data.userId} joined room: ${room}`);
    });

    socket.on('booking-updated', (data) => {
      console.log('📊 Booking updated:', data);
      io.emit('booking-status-changed', data);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
