import express from 'express';
import { generateZoomSignature, createZoomMeeting } from '../controllers/zoom.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/signature', authMiddleware, generateZoomSignature);
router.post('/meeting', authMiddleware, createZoomMeeting);

export default router;