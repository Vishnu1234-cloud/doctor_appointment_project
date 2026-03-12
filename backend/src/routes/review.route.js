import express from 'express';
import {
  createReview, getDoctorReviews, editReview, deleteReview,
  toggleHelpful, reportReview, doctorReply,
  adminGetAllReviews, adminApproveReview, adminRejectReview,
} from '../controllers/review.controller.js';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public
router.get('/doctor/:doctorId', getDoctorReviews);

// Patient (login required)
router.post('/',                      authMiddleware, requireRole('patient'), createReview);
router.put('/:reviewId',              authMiddleware, requireRole('patient'), editReview);
router.delete('/:reviewId',           authMiddleware, requireRole('patient'), deleteReview);
router.post('/:reviewId/helpful',     authMiddleware, toggleHelpful);
router.post('/:reviewId/report',      authMiddleware, reportReview);

// Doctor
router.post('/:reviewId/reply',       authMiddleware, requireRole('doctor', 'admin'), doctorReply);

// Admin
router.get('/admin/all',              authMiddleware, requireRole('admin'), adminGetAllReviews);
router.patch('/admin/:reviewId/approve', authMiddleware, requireRole('admin'), adminApproveReview);
router.patch('/admin/:reviewId/reject',  authMiddleware, requireRole('admin'), adminRejectReview);

export default router;