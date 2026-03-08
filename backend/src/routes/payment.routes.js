import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { paymentLimiter } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/create-order', paymentLimiter, paymentController.createOrder);
router.post('/verify', paymentLimiter, paymentController.verifyPayment);

export default router;
