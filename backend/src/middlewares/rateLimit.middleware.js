import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      detail: 'Too many requests, please try again later',
    });
  },
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased for testing - was 5
  skipSuccessfulRequests: false,
  message: 'Too many authentication attempts, please try again later',
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      detail: 'Too many authentication attempts, please try again after 15 minutes',
    });
  },
});

// OTP rate limiter (per IP)
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 OTP requests per hour per IP
  message: 'Too many OTP requests',
  handler: (req, res) => {
    logger.warn(`OTP rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      detail: 'Too many OTP requests. Please try again after 1 hour',
    });
  },
});

// Payment rate limiter
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many payment requests',
  handler: (req, res) => {
    logger.warn(`Payment rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      detail: 'Too many payment attempts, please try again later',
    });
  },
});

export default apiLimiter;
