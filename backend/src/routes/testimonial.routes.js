import express from 'express';
import testimonialController from '../controllers/testimonial.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public route
router.get('/', testimonialController.getTestimonials);

// Protected route
router.post('/', authMiddleware, testimonialController.createTestimonial);

export default router;
