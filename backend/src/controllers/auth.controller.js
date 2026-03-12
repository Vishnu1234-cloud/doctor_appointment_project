import authService from '../services/auth.service.js';
import otpService from '../services/otp.service.js';
import logger from '../utils/logger.js';

class AuthController {
  // Register
  async register(req, res, next) {
    try {
      const { email, full_name, password, phone, role } = req.body;

      const user = await authService.register({
        email,
        full_name,
        password,
        phone,
        role: role || 'patient',
        auth_provider: 'local',
      });

      if (password) {
        try {
          const otpResult = await otpService.sendOTP(
            user.id,
            'email',
            email,
            full_name
          );

          return res.status(201).json({
            ...user,
            otp_id: otpResult.otpId,
            message: 'User registered. OTP sent to email for verification.',
          });
        } catch (otpError) {
          logger.error('OTP send failed during registration:', otpError.message);
          return res.status(201).json({
            ...user,
            message: 'User registered successfully.',
          });
        }
      }

      res.status(201).json(user);
    } catch (error) {
      if (error.message === 'Email already registered') {
        return res.status(400).json({ detail: error.message });
      }
      next(error);
    }
  }

  // Login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      if (error.message === 'Invalid credentials' || error.message === 'Please use OAuth login') {
        return res.status(401).json({ detail: error.message });
      }
      next(error);
    }
  }

  // Get current user
  async getMe(req, res) {
    res.json(req.user);
  }

  // Request OTP
  async requestOTP(req, res, next) {
    try {
      const { email, delivery_channel } = req.body;

      const user = await authService.getUserByEmail(email);
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account exists, you will receive an OTP',
        });
      }

      const recipient = delivery_channel === 'sms' ? user.phone : user.email;
      if (!recipient) {
        return res.status(400).json({
          detail: `${delivery_channel === 'sms' ? 'Phone number' : 'Email'} not found for this user`,
        });
      }

      const result = await otpService.sendOTP(
        user.id,
        delivery_channel,
        recipient,
        user.full_name
      );

      // ✅ user_id return karo frontend ke liye
      res.json({
        ...result,
        user_id: user.id,
      });
    } catch (error) {
      if (error.message.includes('Too many') || error.message.includes('wait')) {
        return res.status(429).json({ detail: error.message });
      }
      next(error);
    }
  }

  // Verify OTP
  async verifyOTP(req, res, next) {
    try {
      const { user_id, otp_id, otp } = req.body;

      const result = await otpService.verifyOTP(user_id, otp_id, otp);

      // ✅ Token return karo
      const user = await authService.getUserById(user_id);
      if (user) {
        const tokenResult = await authService.generateTokenForUser(user);
        return res.json({
          ...result,
          token: tokenResult.token,
          user: tokenResult.user,
        });
      }

      res.json(result);
    } catch (error) {
      if (
        error.message.includes('not found') ||
        error.message.includes('Invalid') ||
        error.message.includes('expired') ||
        error.message.includes('used') ||
        error.message.includes('locked') ||
        error.message.includes('exceeded')
      ) {
        return res.status(400).json({ detail: error.message });
      }
      next(error);
    }
  }

  // Resend OTP
  async resendOTP(req, res, next) {
    try {
      const { user_id, delivery_channel } = req.body;

      const user = await authService.getUserById(user_id);
      if (!user) {
        return res.status(404).json({ detail: 'User not found' });
      }

      const recipient = delivery_channel === 'sms' ? user.phone : user.email;
      if (!recipient) {
        return res.status(400).json({
          detail: `${delivery_channel === 'sms' ? 'Phone' : 'Email'} not available`,
        });
      }

      const result = await otpService.resendOTP(
        user_id,
        delivery_channel,
        recipient,
        user.full_name
      );

      res.json(result);
    } catch (error) {
      if (error.message.includes('wait') || error.message.includes('Too many')) {
        return res.status(429).json({ detail: error.message });
      }
      next(error);
    }
  }

  // ✅ Forgot Password — Step 1: OTP bhejo
  async forgotPassword(req, res, next) {
    try {
      const { email, delivery_channel } = req.body;

      const user = await authService.getUserByEmail(email);
      if (!user) {
        return res.json