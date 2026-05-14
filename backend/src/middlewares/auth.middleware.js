import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { isTokenBlacklisted, isTokenIssuedBeforeInvalidation } from '../services/tokenBlacklist.service.js';

export const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // ✅ FIX: Pehle httpOnly cookie check karo, phir Authorization header
    if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    } else {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ detail: 'No token provided' });
    }

    // ✅ FIX: Logout ke baad blacklisted token reject karo
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({ detail: 'Token has been revoked. Please login again.' });
    }

    // Token verify karo
    const decoded = jwt.verify(token, config.jwtSecret);

    // ✅ FIX: Password reset ke baad purane tokens reject karo
    const issuedBeforeReset = await isTokenIssuedBeforeInvalidation(decoded.id, decoded.iat);
    if (issuedBeforeReset) {
      return res.status(401).json({ detail: 'Session expired after password change. Please login again.' });
    }

    // Database se user lo
    const user = await User.findOne({ email: decoded.sub }).select('-password');

    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }

    if (!user.is_active) {
      return res.status(401).json({ detail: 'User account is inactive' });
    }

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
