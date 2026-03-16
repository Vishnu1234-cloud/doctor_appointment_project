import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { generateId } from '../utils/helpers.js';
import logger from '../utils/logger.js';
import whatsappService from './whatsapp.service.js';
import emailService from './email.service.js';
import reminderService from './reminder.service.js';

class AppointmentService {
  // Create appointment
  async createAppointment(appointmentData) {
    const appointmentId = generateId();

    const appointment = await Appointment.create({
      id: appointmentId,
      ...appointmentData,
      status: 'pending',
      payment_status: 'pending',
    });

    // ✅ Patient aur Doctor dono fetch karo
    const patient = await User.findOne({ id: appointmentData.patient_id });
    const doctor = await User.findOne({ id: appointmentData.doctor_id });

    if (patient) {
      const notificationData = {
        patient_name: patient.full_name,
        doctor_name: doctor?.full_name || 'Doctor', // ✅ doctor_name add
        date: appointment.date,
        time: appointment.time,
        consultation_type: appointment.consultation_type,
      };

      // WhatsApp notification patient ko
      if (patient.phone) {
        await whatsappService.sendBookingConfirmation(
          patient.phone, 
          notificationData
        );
      }

      // ✅ Patient ko email — hamesha bhejo (else if nahi, seedha if)
      if (patient.email) {
        await emailService.sendAppointmentConfirmationEmail({
          patientEmail: patient.email,
          patientName: patient.full_name,
          doctorName: doctor?.full_name || 'Doctor',
          date: appointment.date,
          time: appointment.time,
          consultationType: appointment.consultation_type,
          appointmentId: appointmentId,
        });
      }

      // ✅ Doctor ko bhi email — pehle nahi tha, ab add kiya
      if (doctor?.email) {
        await emailService.sendAppointmentConfirmationEmail({
          patientEmail: doctor.email,
          patientName: doctor.full_name,
          doctorName: doctor.full_name,
          date: appointment.date,
          time: appointment.time,
          consultationType: appointment.consultation_type,
          appointmentId: appointmentId,
        });
      }

      // Reminders schedule karo
      await reminderService.scheduleReminders(
        appointmentId,
        appointment.date,
        appointment.time
      );
    }

    logger.info(`Appointment created: ${appointmentId}`);
    return appointment;
  }

  // Get appointments with pagination
  async getAppointments(query = {}, limit = 50, skip = 0) {
    const appointments = await Appointment.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return appointments;
  }

  // Get appointment by ID
  async getAppointmentById(appointmentId) {
    const appointment = await Appointment.findOne({ id: appointmentId }).lean();
    return appointment;
  }

  // Update appointment status
  async updateAppointmentStatus(appointmentId, status) {
    const appointment = await Appointment.findOneAndUpdate(
      { id: appointmentId },
      { $set: { status } },
      { new: true }
    );

    logger.info(`Appointment ${appointmentId} status updated to ${status}`);
    return appointment;
  }

  // Update payment status
  async updatePaymentStatus(appointmentId, paymentStatus, paymentId = null) {
    const updates = { payment_status: paymentStatus };
    if (paymentId) {
      updates.payment_id = paymentId;
    }
    if (paymentStatus === 'completed') {
      updates.status = 'confirmed';
    }

    const appointment = await Appointment.findOneAndUpdate(
      { id: appointmentId },
      { $set: updates },
      { new: true }
    );

    logger.info(`Appointment ${appointmentId} payment status: ${paymentStatus}`);
    return appointment;
  }

  // Reschedule appointment
  async rescheduleAppointment(appointmentId, newDate, newTime) {
    const appointment = await Appointment.findOneAndUpdate(
      { id: appointmentId },
      {
        $set: {
          date: newDate,
          time: newTime,
          status: 'rescheduled',
        },
      },
      { new: true }
    );

    await reminderService.cancelReminders(appointmentId);
    await reminderService.scheduleReminders(appointmentId, newDate, newTime);

    logger.info(`Appointment ${appointmentId} rescheduled`);
    return appointment;
  }

  // Cancel appointment
  async cancelAppointment(appointmentId, reason = null) {
    const appointment = await Appointment.findOneAndUpdate(
      { id: appointmentId },
      {
        $set: {
          status: 'cancelled',
          cancelled_at: new Date(),
          cancellation_reason: reason,
        },
      },
      { new: true }
    );

    await reminderService.cancelReminders(appointmentId);

    logger.info(`Appointment ${appointmentId} cancelled`);
    return appointment;
  }

  // Mark appointment as completed
  async completeAppointment(appointmentId) {
    const appointment = await Appointment.findOneAndUpdate(
      { id: appointmentId },
      {
        $set: {
          status: 'completed',
          completed_at: new Date(),
        },
      },
      { new: true }
    );

    logger.info(`Appointment ${appointmentId} completed`);
    return appointment;
  }

  // Get available time slots for a date
  async getAvailableSlots(date) {
    const bookedAppointments = await Appointment.find({
      date,
      status: { $nin: ['cancelled'] },
    }).select('time').lean();

    const bookedTimes = bookedAppointments.map((apt) => apt.time);

    const slots = [];
    for (let hour = 18; hour <= 20; hour++) {
      for (let minute of [0, 15, 30, 45]) {
        if (hour === 20 && minute > 0) break;
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        slots.push({
          date,
          time,
          available: !bookedTimes.includes(time),
        });
      }
    }

    return slots;
  }
}

export default new AppointmentService();