import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Get user from database
    const user = await User.findOne({ email: decoded.sub }).select('-password');

    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }

    if (!user.is_active) {
      return res.status(401).json({ detail: 'User account is inactive' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      otp_verified: user.otp_verified,
      phone_verified: user.phone_verified,
      created_at: user.created_at,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ detail: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Token expired' });
    }
    logger.error('Auth middleware error:', error);
    return res.status(401).json({ detail: 'Authentication failed' });
  }
};

// Role-based authorization middleware
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ detail: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ detail: 'Insufficient permissions' });
    }

    next();
  };
};

export default authMiddleware;
