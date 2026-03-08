import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import User from '../models/User.js';
import { generateId, sanitizeUser } from '../utils/helpers.js';
import logger from '../utils/logger.js';

class AuthService {
  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Generate JWT access token
  generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user.email,
        role: user.role,
        id: user.id,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiration }
    );
  }

  // Generate refresh token
  generateRefreshToken(user) {
    return jwt.sign(
      {
        sub: user.email,
        type: 'refresh',
      },
      config.jwtSecret,
      { expiresIn: config.jwtRefreshExpiration }
    );
  }

  // Register user
  async register(userData) {
    // Check if user exists
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      throw new Error('Email already registered');
    }

    // Create user
    const userId = generateId();
    const hashedPassword = userData.password
      ? await this.hashPassword(userData.password)
      : undefined;

    const user = await User.create({
      id: userId,
      email: userData.email,
      full_name: userData.full_name,
      password: hashedPassword,
      role: userData.role || 'patient',
      phone: userData.phone,
      auth_provider: userData.auth_provider || 'local',
      google_id: userData.google_id,
      otp_verified: false,
      phone_verified: false,
    });

    logger.info(`User registered: ${user.email}`);
    return sanitizeUser(user.toObject());
  }

  // Login user
  async login(email, password) {
    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.password) {
      throw new Error('Please use OAuth login');
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate token
    const token = this.generateAccessToken(user);

    logger.info(`User logged in: ${user.email}`);
    return {
      token,
      user: sanitizeUser(user.toObject()),
    };
  }

  // Get user by ID
  async getUserById(userId) {
    const user = await User.findOne({ id: userId }).select('-password');
    return user ? sanitizeUser(user.toObject()) : null;
  }

  // Get user by email
  async getUserByEmail(email) {
    const user = await User.findOne({ email }).select('-password');
    return user ? sanitizeUser(user.toObject()) : null;
  }

  // Update user
  async updateUser(userId, updates) {
    const user = await User.findOneAndUpdate(
      { id: userId },
      { $set: updates },
      { new: true }
    ).select('-password');

    return user ? sanitizeUser(user.toObject()) : null;
  }
}

export default new AuthService();
