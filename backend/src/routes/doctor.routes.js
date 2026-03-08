import express from 'express';
import doctorController from '../controllers/doctor.controller.js';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/profile', doctorController.getProfile);
router.get('/availability', doctorController.getAvailability);

// Protected routes
router.put('/profile', authMiddleware, requireRole('doctor'), doctorController.updateProfile);

export default router;
