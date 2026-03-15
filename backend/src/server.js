import http from 'http';
import { Server } from 'socket.io';
import { WebSocketServer } from 'ws';
import { Redis } from 'ioredis';
import app from './app.js';
import config from './config/env.js';
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';
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

  if (pathname.startsWith('/ws/consultation/') || pathname.startsWith('/api/ws/consultation/')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

const createRedisSubClient = () => {
  if (config.redis.url) {
    // URL se db number hatao aur force db=0 karo
    const cleanUrl = config.redis.url.replace(/\/\d+$/, '');
    return new Redis(cleanUrl, {
      db: 0,
      tls: {},
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
  }

  return new Redis({
    host: config.redis.host,
    port: config.redis.port,
    username: config.redis.username || 'default',
    password: config.redis.password,
    tls: config.nodeEnv === 'production' ? {} : undefined,
    db: 0,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });
};

// Connect to databases
const startServer = async () => {
  try {
    await connectDB();

    const redisClient = await connectRedis();

    if (redisClient) {
      const pubClient = redisClient;
      const subClient = createRedisSubClient();

      subClient.on('error', (err) => {
        logger.error({ err: err.message }, 'Redis subClient error');
      });

      subClient.on('ready', () => {
        logger.info('Redis subClient ready');
      });

      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO bound to Redis Adapter');
    } else {
      logger.warn('Redis not available. Running without Redis adapter.');
    }

    server.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
      logger.info(`📚 API Documentation: http://localhost:${config.port}/api`);
    });
  } catch (error) {
    logger.error({ err: error.message }, 'Failed to start server');
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    io.close();
    wss.close();

    await reminderWorker.close();

    logger.info('Graceful shutdown complete');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught Exception detected. Shutting down gracefully...');
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled Promise Rejection detected. Shutting down gracefully...');
  gracefulShutdown('unhandledRejection');
});

startServer();