import express from 'express';
import authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authLimiter, otpLimiter } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/google', authLimiter, authController.googleAuth);

// OTP routes
router.post('/request-otp', otpLimiter, authController.requestOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', otpLimiter, authController.resendOTP);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);

export default router;
