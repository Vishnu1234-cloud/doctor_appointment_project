import logger from '../utils/logger.js';
import config from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  // Log error with explicit Trace ID
  logger.error({
    reqId: req.id,
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Default Standard Response Base
  const response = {
    success: false,
    reqId: req.id,
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      ...response,
      detail: 'Validation error',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
        details: Object.values(err.errors).map((e) => e.message),
      }
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      ...response,
      detail: `${field} already exists`,
      error: {
        code: 'DUPLICATE_KEY_ERROR',
        message: `${field} already exists`,
      }
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ ...response, detail: 'Invalid token', error: { code: 'INVALID_TOKEN' } });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ ...response, detail: 'Token expired', error: { code: 'TOKEN_EXPIRED' } });
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ ...response, detail: 'CORS policy violation', error: { code: 'CORS_VIOLATION' } });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const isProd = config.nodeEnv === 'production';
  res.status(statusCode).json({
    ...response,
    detail: isProd && statusCode >= 500 ? 'Internal server error' : err.message,
    error: {
      code: statusCode >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR',
      message: isProd && statusCode >= 500 ? 'Internal server error' : err.message,
    },
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    reqId: req.id,
    detail: `Route ${req.originalUrl} not found`,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`
    }
  });
};

export default errorHandler;
