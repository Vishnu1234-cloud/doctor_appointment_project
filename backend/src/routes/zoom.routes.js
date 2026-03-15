import express from 'express';
import { generateZoomSignature, createZoomMeeting } from '../controllers/zoom.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Generate Zoom SDK signature
router.post('/signature', authenticate, generateZoomSignature);

// Create meeting number for appointment
router.post('/meeting', authenticate, createZoomMeeting);

export default router;