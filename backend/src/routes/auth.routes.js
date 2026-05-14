import express from 'express';
import passport from '../config/passport.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { z } from 'zod';
import authController from '../controllers/auth.controller.js';
import authService from '../services/auth.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authLimiter, otpLimiter } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { blacklistToken } from '../services/tokenBlacklist.service.js';

const router = express.Router();

// ── Cookie config ───────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,       // ✅ XSS protection — JS se accessible nahi
  secure: true,         // ✅ HTTPS only
  sameSite: 'strict',   // ✅ CSRF protection
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

const setTokenCookie = (res, token) => res.cookie('auth_token', token, COOKIE_OPTIONS);
const clearTokenCookie = (res) => res.clearCookie('auth_token', { path: '/' });

// ── Validation Schemas ──────────────────────────────────────
const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Z]/, 'Must contain uppercase letter.')
  .regex(/[a-z]/, 'Must contain lowercase letter.')
  .regex(/[0-9]/, 'Must contain a number.')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character.');

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    full_name: z.string().min(2).max(100), // ✅ max length fix
    password: strongPassword.optional(),
    phone: z.string().optional(),
    role: z.enum(['patient', 'doctor']).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const requestOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    delivery_channel: z.enum(['sms', 'email']),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    user_id: z.string(),
    otp_id: z.string(),
    otp: z.string().length(6),
  }),
});

const resendOtpSchema = z.object({
  body: z.object({
    user_id: z.string(),
    delivery_channel: z.enum(['sms', 'email']),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    delivery_channel: z.enum(['sms', 'email']),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    user_id: z.string(),
    otp_id: z.string(),
    otp: z.string().length(6),
    new_password: strongPassword, // ✅ strong password validation reset pe bhi
  }),
});

// ── Public Routes ───────────────────────────────────────────
router.post('/register', authLimiter, validate(registerSchema), authController.register);

// ✅ FIX: Login — token httpOnly cookie mein set karo
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    setTokenCookie(res, result.token);
    // Token response mein bhi bhejo (mobile/Postman ke liye)
    res.json({ success: true, token: result.token, user: result.user });
  } catch (error) {
    if (error.message === 'Invalid credentials' || error.message === 'Please use OAuth login') {
      return res.status(401).json({ detail: error.message });
    }
    next(error);
  }
});

// ✅ NEW: Logout — backend token blacklist karo
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.cookies?.auth_token || req.headers.authorization?.substring(7);
    if (token) {
      await blacklistToken(token);
    }
    clearTokenCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    clearTokenCookie(res);
    res.json({ success: true, message: 'Logged out' });
  }
});

// ── Google OAuth ────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
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
      setTokenCookie(res, token);
      const redirectUrl = req.user.role === 'pending'
        ? `${config.frontendUrl}/auth/role-select`
        : req.user.role === 'doctor'
          ? `${config.frontendUrl}/doctor/dashboard`
          : `${config.frontendUrl}/patient/dashboard`;
      res.redirect(redirectUrl);
    } catch (error) {
      res.redirect(`${config.frontendUrl}/login?error=token_failed`);
    }
  }
);

// ── OTP Routes ──────────────────────────────────────────────
router.post('/request-otp', otpLimiter, validate(requestOtpSchema), authController.requestOTP);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOTP);
router.post('/resend-otp', otpLimiter, validate(resendOtpSchema), authController.resendOTP);

// ── Forgot Password ─────────────────────────────────────────
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// ── Protected Routes ────────────────────────────────────────
router.get('/me', authMiddleware, authController.getMe);

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
