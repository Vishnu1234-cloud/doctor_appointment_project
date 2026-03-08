import { Redis } from 'ioredis';
import config from './env.js';
import logger from '../utils/logger.js';

let redisClient = null;

const connectRedis = () => {
  try {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
      logger.info(`Redis connected: ${config.redis.host}:${config.redis.port}`);
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err.message);
      // Don't crash app if Redis fails (graceful degradation)
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    return redisClient;
  } catch (error) {
    logger.error('Redis initialization failed:', error.message);
    logger.warn('Continuing without Redis - scheduled reminders will be disabled');
    return null;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    logger.warn('Redis client not initialized');
  }
  return redisClient;
};

export { connectRedis, getRedisClient };
export default connectRedis;
