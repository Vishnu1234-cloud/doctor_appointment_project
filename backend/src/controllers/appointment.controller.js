import appointmentService from '../services/appointment.service.js';
import logger from '../utils/logger.js';

class AppointmentController {
  // Create appointment
  async createAppointment(req, res, next) {
    try {
      const { patient_id, date, time, consultation_type, reason } = req.body;

      // Verify user is creating appointment for themselves (or is admin/doctor)
      if (req.user.role === 'patient' && req.user.id !== patient_id) {
        return res.status(403).json({ detail: 'Cannot create appointment for another user' });
      }

      const appointment = await appointmentService.createAppointment({
        patient_id,
        date,
        time,
        consultation_type: consultation_type || 'video',
        reason,
      });

      res.status(201).json(appointment.toObject());
    } catch (error) {
      next(error);
    }
  }

  // Get appointments
  async getAppointments(req, res, next) {
    try {
      let query = {};

      if (req.user.role === 'patient') {
        query = { patient_id: req.user.id };
      } else if (req.user.role === 'doctor') {
        // Doctor sees all appointments
        query = {};
      }

      const appointments = await appointmentService.getAppointments(query);

      res.json(appointments.map((a) => a.toObject()));
    } catch (error) {
      next(error);
    }
  }

  // Get appointment by ID
  async getAppointment(req, res, next) {
    try {
      const { appointment_id } = req.params;

      const appointment = await appointmentService.getAppointmentById(appointment_id);

      if (!appointment) {
        return res.status(404).json({ detail: 'Appointment not found' });
      }

      // Check authorization
      if (
        req.user.role === 'patient' &&
        appointment.patient_id !== req.user.id
      ) {
        return res.status(403).json({ detail: 'Not authorized' });
      }

      res.json(appointment.toObject());
    } catch (error) {
      next(error);
    }
  }

  // Update appointment status
  async updateStatus(req, res, next) {
    try {
      const { appointment_id } = req.params;
      const { status } = req.body;

      // Only doctor/admin can update status
      if (!['doctor', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ detail: 'Not authorized' });
      }

      const appointment = await appointmentService.updateAppointmentStatus(
        appointment_id,
        status
      );

      if (!appointment) {
        return res.status(404).json({ detail: 'Appointment not found' });
      }

      res.json({ success: true, appointment: appointment.toObject() });
    } catch (error) {
      next(error);
    }
  }

  // Reschedule appointment
  async reschedule(req, res, next) {
    try {
      const { appointment_id } = req.params;
      const { date, time } = req.body;

      const appointment = await appointmentService.getAppointmentById(appointment_id);
      if (!appointment) {
        return res.status(404).json({ detail: 'Appointment not found' });
      }

      // Check authorization
      if (
        req.user.role === 'patient' &&
        appointment.patient_id !== req.user.id &&
        !['doctor', 'admin'].includes(req.user.role)
      ) {
        return res.status(403).json({ detail: 'Not authorized' });
      }

      const updated = await appointmentService.rescheduleAppointment(
        appointment_id,
        date,
        time
      );

      res.json({
        success: true,
        message: 'Appointment rescheduled successfully',
        appointment: updated.toObject(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancel appointment
  async cancel(req, res, next) {
    try {
      const { appointment_id } = req.params;
      const { reason } = req.body;

      const appointment = await appointmentService.getAppointmentById(appointment_id);
      if (!appointment) {
        return res.status(404).json({ detail: 'Appointment not found' });
      }

      // Check authorization
      if (
        req.user.role === 'patient' &&
        appointment.patient_id !== req.user.id &&
        !['doctor', 'admin'].includes(req.user.role)
      ) {
        return res.status(403).json({ detail: 'Not authorized' });
      }

      const updated = await appointmentService.cancelAppointment(
        appointment_id,
        reason
      );

      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        appointment: updated.toObject(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Join consultation
  async joinConsultation(req, res, next) {
    try {
      const { appointment_id } = req.params;

      const appointment = await appointmentService.getAppointmentById(appointment_id);

      if (!appointment) {
        return res.status(404).json({ detail: 'Appointment not found' });
      }

      // Update join timestamp
      const joinField = `${req.user.role}_joined_at`;
      appointment[joinField] = new Date();
      appointment.status = 'in_progress';
      await appointment.save();

      logger.info(`User ${req.user.id} (${req.user.role}) joined consultation ${appointment_id}`);

      res.json({
        success: true,
        message: 'Joined consultation',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AppointmentController();
