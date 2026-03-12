import express from 'express';
import passport from '../config/passport.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { z } from 'zod';
import authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authLimiter, otpLimiter } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = express.Router();

// Validation Schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    phone: z.string().optional(),
    role: z.enum(['patient', 'doctor', 'admin']).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const requestOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    delivery_channel: z.enum(['sms', 'email']),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    user_id: z.string(),
    otp_id: z.string(),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

const resendOtpSchema = z.object({
  body: z.object({
    user_id: z.string(),
    delivery_channel: z.enum(['sms', 'email']),
  }),
});

// ✅ Forgot Password Schemas
const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    delivery_channel: z.enum(['sms', 'email']),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    user_id: z.string(),
    otp_id: z.string(),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

// ── Public Routes ──────────────────────────────────────
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);

// ── Google OAuth Routes ────────────────────────────────
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${config.frontendUrl}/login?error=google_failed`,
  }),
  (req, res) => {
    try {
      const token = jwt.sign(
        { sub: req.user.email, id: req.user.id, role: req.user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiration }
      );

      const redirectUrl = req.user.role === 'pending'
        ? `${config.frontendUrl}/auth/role-select?token=${token}`
        : req.user.role === 'doctor'
          ? `${config.frontendUrl}/doctor/dashboard?token=${token}`
          : `${config.frontendUrl}/patient/dashboard?token=${token}`;

      res.redirect(redirectUrl);
    } catch (error) {
      res.redirect(`${config.frontendUrl}/login?error=token_failed`);
    }
  }
);

// ── OTP Routes ─────────────────────────────────────────
router.post('/request-otp', otpLimiter, validate(requestOtpSchema), authController.requestOTP);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOTP);
router.post('/resend-otp', otpLimiter, validate(resendOtpSchema), authController.resendOTP);

// ── Forgot Password Routes ─────────────────────────────
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// ── Protected Routes ───────────────────────────────────
router.get('/me', authMiddleware, authController.getMe);

// ── Google OAuth Role Update ───────────────────────────
router.patch('/update-role', authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({ detail: 'Invalid role' });
    }

    const db = mongoose.connection.db;
    await db.collection('users').updateOne(
      { email: req.user.email },
      { $set: { role, updated_at: new Date() } }
    );

    res.json({ success: true, message: 'Role updated successfully' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;