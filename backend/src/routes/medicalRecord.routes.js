import express from 'express';
import medicalRecordController from '../controllers/medicalRecord.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/upload', medicalRecordController.uploadRecord);
router.get('/', medicalRecordController.getRecords);

export default router;
