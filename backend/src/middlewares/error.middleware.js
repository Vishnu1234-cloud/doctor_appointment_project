import logger from '../utils/logger.js';
import config from '../config/env.js';

// Global error handler
export const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      detail: 'Validation error',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      detail: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ detail: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ detail: 'Token expired' });
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ detail: 'CORS policy violation' });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    detail: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    detail: `Route ${req.originalUrl} not found`,
  });
};

export default errorHandler;
