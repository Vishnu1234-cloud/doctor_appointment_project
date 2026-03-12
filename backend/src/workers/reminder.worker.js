import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { sendAppointmentReminderEmail } from '../services/email.service.js';
import logger from '../utils/logger.js';

class ReminderWorker {
  constructor() {
    this.worker = null;
    this.initWorker();
  }

  initWorker() {
    const redisClient = getRedisClient();

    if (!redisClient) {
      logger.warn('[REMINDER WORKER] Redis not available. Worker not started.');
      return;
    }

    try {
      this.worker = new Worker(
        'appointment-reminders',
        async (job) => {
          await this.processReminder(job);
        },
        {
          connection: redisClient,
          concurrency: 5,
        }
      );

      this.worker.on('completed', (job) => {
        logger.info(`[REMINDER WORKER] Job ${job.id} completed`);
      });

      this.worker.on('failed', (job, err) => {
        logger.error(`[REMINDER WORKER] Job ${job?.id} failed:`, err.message);
      });

      logger.info('[REMINDER WORKER] Worker started');
    } catch (error) {
      logger.error('[REMINDER WORKER] Failed to start worker:', error.message);
    }
  }

  async processReminder(job) {
    const { appointmentId, type } = job.data;

    logger.info(`[REMINDER] Processing ${type} reminder for ${appointmentId}`);

    try {
      // Appointment lo
      const appointment = await Appointment.findOne({ id: appointmentId });
      if (!appointment) {
        logger.warn(`[REMINDER] Appointment ${appointmentId} not found`);
        return;
      }

      // Cancel/complete hoga toh skip karo
      if (['cancelled', 'completed'].includes(appointment.status)) {
        logger.info(`[REMINDER] Skipping — appointment is ${appointment.status}`);
        return;
      }

      // Patient lo
      const patient = await User.findOne({ id: appointment.patient_id });
      if (!patient) {
        logger.warn(`[REMINDER] Patient not found for ${appointmentId}`);
        return;
      }

      // Doctor lo
      const doctor = await User.findOne({ role: 'doctor' });

      // ✅ Sirf 10-minute reminder pe email bhejo
      if (type === '10-minute' && patient.email) {
        await sendAppointmentReminderEmail({
          patientEmail: patient.email,
          patientName: patient.full_name || 'Patient',
          doctorName: doctor?.full_name || 'Doctor',
          date: appointment.date,
          time: appointment.time,
          consultationType: appointment.consultation_type || 'video',
          appointmentId: appointment.id,
        });
        logger.info(`[REMINDER] 10-min email sent to ${patient.email}`);
      }

      // ✅ 1-hour reminder pe bhi email bhejo
      if (type === '1-hour' && patient.email) {
        await sendAppointmentReminderEmail({
          patientEmail: patient.email,
          patientName: patient.full_name || 'Patient',
          doctorName: doctor?.full_name || 'Doctor',
          date: appointment.date,
          time: appointment.time,
          consultationType: appointment.consultation_type || 'video',
          appointmentId: appointment.id,
        });
        logger.info(`[REMINDER] 1-hour email sent to ${patient.email}`);
      }

      logger.info(`[REMINDER] ${type} reminder done for ${appointmentId}`);
    } catch (error) {
      logger.error(`[REMINDER] Failed:`, error.message);
      throw error;
    }
  }

  async close() {
    if (this.worker) {
      await this.worker.close();
      logger.info('[REMINDER WORKER] Worker closed');
    }
  }
}

export default new ReminderWorker();