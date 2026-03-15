import { Redis } from 'ioredis';
import config from './env.js';
import logger from '../utils/logger.js';

let redisClient = null;

const connectRedis = async () => {
  try {
    if (config.redis.url) {
      // URL se db number hatao aur force db=0 karo
      const cleanUrl = config.redis.url.replace(/\/\d+$/, '');
      redisClient = new Redis(cleanUrl, {
        db: 0,
        tls: {},
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
      });
    } else {
      redisClient = new Redis({
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
    }

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });
    redisClient.on('ready', () => {
      logger.info('Redis ready');
    });
    redisClient.on('error', (err) => {
      logger.error({ err: err.message }, 'Redis connection error');
    });
    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    await redisClient.ping();
    return redisClient;
  } catch (error) {
    logger.warn({ err: error.message }, 'Redis not available. Continuing without Redis.');
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => redisClient;

export { connectRedis, getRedisClient };
export default connectRedis;