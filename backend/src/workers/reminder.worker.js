import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import whatsappService from '../services/whatsapp.service.js';
import emailService from '../services/email.service.js';
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
      // Get appointment
      const appointment = await Appointment.findOne({ id: appointmentId });
      if (!appointment) {
        logger.warn(`[REMINDER] Appointment ${appointmentId} not found`);
        return;
      }

      // Skip if cancelled or completed
      if (['cancelled', 'completed'].includes(appointment.status)) {
        logger.info(`[REMINDER] Skipping reminder for ${appointment.status} appointment`);
        return;
      }

      // Get patient
      const patient = await User.findOne({ id: appointment.patient_id });
      if (!patient) {
        logger.warn(`[REMINDER] Patient not found for appointment ${appointmentId}`);
        return;
      }

      const reminderData = {
        patient_name: patient.full_name,
        date: appointment.date,
        time: appointment.time,
      };

      // Send reminder via WhatsApp or Email
      if (patient.phone) {
        if (type === '1-hour') {
          await whatsappService.sendOneHourReminder(patient.phone, reminderData);
        } else if (type === '10-minute') {
          await whatsappService.sendTenMinuteReminder(patient.phone, reminderData);
        }
      } else if (patient.email) {
        await emailService.sendAppointmentEmail(
          patient.email,
          patient.full_name,
          {
            ...reminderData,
            reminder: type,
          }
        );
      }

      logger.info(`[REMINDER] ${type} reminder sent for appointment ${appointmentId}`);
    } catch (error) {
      logger.error(`[REMINDER] Failed to process reminder:`, error.message);
      throw error; // Re-throw for retry
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
