import express from 'express';
import doctorController from '../controllers/doctor.controller.js';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ── Public Routes ──────────────────────────────────
router.get('/profile', doctorController.getProfile);
router.get('/availability', doctorController.getAvailability);
router.get('/reviews', doctorController.getDoctorReviews);

// ── Protected Routes (Doctor only) ────────────────
router.put('/profile', authMiddleware, requireRole('doctor'), doctorController.updateProfile);
router.put('/availability', authMiddleware, requireRole('doctor'), doctorController.updateAvailability);
router.put('/fee', authMiddleware, requireRole('doctor'), doctorController.updateFee);
router.post('/photo', authMiddleware, requireRole('doctor'), doctorController.updatePhoto);

export default router;