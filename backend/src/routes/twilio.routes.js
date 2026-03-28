import express from 'express';
import { generateTwilioToken } from '../controllers/twilio.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/token', authMiddleware, generateTwilioToken);

export default router;