import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { sendAppointmentReminderEmail } from '../services/email.service.js';
import logger from '../utils/logger.js';

class ReminderWorker {
  constructor() {
    this.worker = null;
    // Constructor mein directly initWorker nahi karte
    // Server.js se startWorker() call hoga Redis ready hone ke baad
  }

  startWorker() {
    const redisClient = getRedisClient();
    if (!redisClient) {
      logger.warn('[REMINDER WORKER] Redis not available. Worker not started.');
      return;
    }
    if (this.worker) {
      logger.info('[REMINDER WORKER] Worker already running.');
      return;
    }
    try {
      this.worker = new Worker(
        'appointment-reminders',
        async (job) => {
          await this.processReminder(job);
        },
        {
          connection: {
            host: redisClient.options?.host,
            port: redisClient.options?.port,
            password: redisClient.options?.password,
            tls: redisClient.options?.tls,
            db: 0,
          },
          concurrency: 5,
        }
      );

      this.worker.on('completed', (job) => {
        logger.info(`[REMINDER WORKER] Job ${job.id} completed`);
      });

      this.worker.on('failed', (job, err) => {
        logger.error(`[REMINDER WORKER] Job ${job?.id} failed:`, err.message);
      });

      logger.info('[REMINDER WORKER] Worker started successfully ✅');
    } catch (error) {
      logger.error('[REMINDER WORKER] Failed to start worker:', error.message);
    }
  }

  async processReminder(job) {
    const { appointmentId, type } = job.data;
    logger.info(`[REMINDER] Processing ${type} reminder for ${appointmentId}`);
    try {
      const appointment = await Appointment.findOne({ id: appointmentId });
      if (!appointment) {
        logger.warn(`[REMINDER] Appointment ${appointmentId} not found`);
        return;
      }

      if (['cancelled', 'completed'].includes(appointment.status)) {
        logger.info(`[REMINDER] Skipping — appointment is ${appointment.status}`);
        return;
      }

      const patient = await User.findOne({ id: appointment.patient_id });
      if (!patient) {
        logger.warn(`[REMINDER] Patient not found for ${appointmentId}`);
        return;
      }

      const doctor = await User.findOne({ role: 'doctor' });

      if ((type === '10-minute' || type === '1-hour') && patient.email) {
        await sendAppointmentReminderEmail({
          patientEmail: patient.email,
          patientName: patient.full_name || 'Patient',
          doctorName: doctor?.full_name || 'Doctor',
          date: appointment.date,
          time: appointment.time,
          consultationType: appointment.consultation_type || 'video',
          appointmentId: appointment.id,
        });
        logger.info(`[REMINDER] ${type} email sent to ${patient.email}`);
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