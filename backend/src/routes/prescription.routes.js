import express from 'express';
import prescriptionController from '../controllers/prescription.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/', prescriptionController.createPrescription);
router.get('/', prescriptionController.getPrescriptions);
router.get('/:prescription_id/pdf', prescriptionController.getPrescriptionPDF);

export default router;
