import express from 'express';
import chatController from '../controllers/chat.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/messages', chatController.sendMessage);
router.get('/messages/:appointment_id', chatController.getMessages);

export default router;
