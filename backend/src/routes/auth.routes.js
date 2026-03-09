import express from 'express';
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

// Public routes
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/google', authLimiter, authController.googleAuth);

// OTP routes
router.post('/request-otp', otpLimiter, validate(requestOtpSchema), authController.requestOTP);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOTP);
router.post('/resend-otp', otpLimiter, validate(resendOtpSchema), authController.resendOTP);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);

export default router;
