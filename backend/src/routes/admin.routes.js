import express from 'express';
import adminController from '../controllers/admin.controller.js';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(requireRole('admin'));

router.get('/stats', adminController.getStats);

export default router;
