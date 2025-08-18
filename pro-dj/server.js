/* eslint-disable */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { setIO } = require('./lib/socket-server.js');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Memory monitoring and cleanup
const logMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  console.log("Memory Usage:", {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)} MB`,
  });
};

// Log memory usage every 5 minutes
setInterval(logMemoryUsage, 5 * 60 * 1000);

// Force garbage collection when memory usage is high
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  
  if (heapUsedMB > 1024) { // If heap usage is over 1GB
    console.log("High memory usage detected, forcing garbage collection...");
    if (global.gc) {
      global.gc();
      logMemoryUsage();
    }
  }
}, 30 * 1000); // Check every 30 seconds

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  logMemoryUsage();
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  logMemoryUsage();
  process.exit(1);
});

// When app is ready, then create a custom server and set the request handler
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // Handle large file uploads
      if (pathname === "/api/mixes/upload" && req.method === "POST") {
        // Set timeout for large uploads
        req.setTimeout(300000); // 5 minutes
        res.setTimeout(300000); // 5 minutes
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling request:", err);
      logMemoryUsage();
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    path: "/api/socket",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Set the IO instance for use in other parts of the app
  setIO(io);

  // Initialize socket event handlers
  require('./lib/socket-server.js');

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server initialized on /api/socket`);
      logMemoryUsage();
    });
});
