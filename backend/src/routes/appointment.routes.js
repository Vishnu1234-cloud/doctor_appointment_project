import express from 'express';
import appointmentController from '../controllers/appointment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All appointment routes require authentication
router.use(authMiddleware);

router.post('/', appointmentController.createAppointment);
router.get('/', appointmentController.getAppointments);
router.get('/:appointment_id', appointmentController.getAppointment);
router.put('/:appointment_id/status', appointmentController.updateStatus);
router.put('/:appointment_id/reschedule', appointmentController.reschedule);
router.delete('/:appointment_id', appointmentController.cancel);
router.post('/:appointment_id/join', appointmentController.joinConsultation);

export default router;
