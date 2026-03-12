import express from 'express';
import adminController from '../controllers/admin.controller.js';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(requireRole('admin'));

// ── Stats / Analytics ──────────────────────────────
router.get('/stats', adminController.getStats);

// ── User Management ────────────────────────────────
router.get('/users', adminController.getUsers);
router.get('/users/:user_id', adminController.getUserDetail);
router.patch('/users/:user_id/block', adminController.blockUser);
router.patch('/users/:user_id/activate', adminController.activateUser);
router.delete('/users/:user_id', adminController.deleteUser);

// ── Doctor Management ──────────────────────────────
router.get('/doctors', adminController.getDoctors);
router.patch('/doctors/:doctor_id/approve', adminController.approveDoctor);
router.patch('/doctors/:doctor_id/reject', adminController.rejectDoctor);
router.patch('/doctors/:doctor_id/suspend', adminController.suspendDoctor);
router.patch('/doctors/:doctor_id/fee', adminController.setDoctorFee);

// ── Appointment Management ─────────────────────────
router.get('/appointments', adminController.getAppointments);
router.patch('/appointments/:appointment_id/cancel', adminController.cancelAppointment);
router.patch('/appointments/:appointment_id/status', adminController.updateAppointmentStatus);

// ── Review Moderation ──────────────────────────────
router.get('/reviews', adminController.getReviews);
router.patch('/reviews/:review_id/approve', adminController.approveReview);
router.patch('/reviews/:review_id/reject', adminController.rejectReview);
router.delete('/reviews/:review_id', adminController.deleteReview);

export default router;