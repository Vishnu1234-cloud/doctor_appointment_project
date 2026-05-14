import { getRedisClient } from '../config/redis.js';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const BLACKLIST_PREFIX = 'blacklist:';

// Ek token blacklist karo (logout pe use karo)
export const blacklistToken = async (token) => {
  const redis = getRedisClient();
  if (!redis) {
    logger.warn('Redis unavailable — token blacklisting skipped');
    return;
  }
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return;
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.setex(`${BLACKLIST_PREFIX}${token}`, ttl, '1');
      logger.info(`Token blacklisted for: ${decoded.sub}`);
    }
  } catch (err) {
    logger.error('blacklistToken error:', err.message);
  }
};

// Check karo token blacklisted hai ya nahi
export const isTokenBlacklisted = async (token) => {
  const redis = getRedisClient();
  if (!redis) return false;
  try {
    const result = await redis.get(`${BLACKLIST_PREFIX}${token}`);
    return result === '1';
  } catch (err) {
    logger.error('isTokenBlacklisted error:', err.message);
    return false;
  }
};

// Password reset pe — user ke saare purane tokens invalidate karo
export const blacklistAllUserTokens = async (userId) => {
  const redis = getRedisClient();
  if (!redis) {
    logger.warn('Redis unavailable — user token invalidation skipped');
    return;
  }
  try {
    const key = `user_token_invalidated:${userId}`;
    await redis.setex(key, 7 * 24 * 60 * 60, String(Math.floor(Date.now() / 1000)));
    logger.info(`All tokens invalidated for user: ${userId}`);
  } catch (err) {
    logger.error('blacklistAllUserTokens error:', err.message);
  }
};

// Check karo token password reset se pehle issue hua tha
export const isTokenIssuedBeforeInvalidation = async (userId, tokenIssuedAt) => {
  const redis = getRedisClient();
  if (!redis) return false;
  try {
    const key = `user_token_invalidated:${userId}`;
    const invalidatedAt = await redis.get(key);
    if (!invalidatedAt) return false;
    return tokenIssuedAt < parseInt(invalidatedAt);
  } catch (err) {
    logger.error('isTokenIssuedBeforeInvalidation error:', err.message);
    return false;
  }
};
