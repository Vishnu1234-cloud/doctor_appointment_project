import http from 'http';
import { Server } from 'socket.io';
import { WebSocketServer } from 'ws';
import app from './app.js';
import config from './config/env.js';
import connectDB from './config/db.js';
import { connectRedis, getRedisClient } from './config/redis.js';
import { createAdapter } from '@socket.io/redis-adapter';
import logger from './utils/logger.js';
import reminderWorker from './workers/reminder.worker.js';
import { setupSocketIO } from './socket.js';
import { setupVideoSignaling } from './ws.video.js';

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO for real-time chat
const io = new Server(server, {
  cors: {
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Setup Socket.IO handlers
setupSocketIO(io);

// Setup WebSocket for video signaling
const wss = new WebSocketServer({ noServer: true });
setupVideoSignaling(wss);

// Handle upgrade for WebSocket
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  // Support both /ws/consultation/ and /api/ws/consultation/ for ingress compatibility
  if (pathname.startsWith('/ws/consultation/') || pathname.startsWith('/api/ws/consultation/')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Connect to databases
const startServer = async () => {
  try {
    // Connect MongoDB
    await connectDB();

    // Connect Redis (optional - for reminders)
    connectRedis();

    // Attempt to inject Redis horizontally scale Socket.IO
    const pubClient = getRedisClient();
    if (pubClient) {
      const subClient = pubClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO successfully bound to Redis Adapter for horizontal scaling');
    }

    // Start server
    server.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
      logger.info(`📚 API Documentation: http://localhost:${config.port}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    // Close WebSocket servers
    io.close();
    wss.close();

    // Close reminder worker
    await reminderWorker.close();

    logger.info('Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Safe handling for fatal architecture crashes
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught Exception detected. Shutting down gracefully...');
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled Promise Rejection detected. Shutting down gracefully...');
  gracefulShutdown('unhandledRejection');
});

// Start server
startServer();
