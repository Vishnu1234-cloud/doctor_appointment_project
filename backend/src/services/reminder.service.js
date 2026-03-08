import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';

class ReminderService {
  constructor() {
    this.reminderQueue = null;
    this.initQueue();
  }

  initQueue() {
    const redisClient = getRedisClient();
    
    if (!redisClient) {
      logger.warn('[REMINDER] Redis not available. Reminders disabled.');
      return;
    }

    try {
      this.reminderQueue = new Queue('appointment-reminders', {
        connection: redisClient,
      });
      logger.info('[REMINDER] Queue initialized');
    } catch (error) {
      logger.error('[REMINDER] Failed to initialize queue:', error.message);
    }
  }

  // Schedule reminders for an appointment
  async scheduleReminders(appointmentId, date, time) {
    if (!this.reminderQueue) {
      logger.warn('[REMINDER] Queue not initialized. Skipping reminders.');
      return;
    }

    try {
      // Parse appointment datetime
      const appointmentDateTime = new Date(`${date} ${time}`);
      const now = new Date();

      // Schedule 1-hour reminder
      const oneHourBefore = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);
      if (oneHourBefore > now) {
        await this.reminderQueue.add(
          '1-hour-reminder',
          {
            appointmentId,
            type: '1-hour',
          },
          {
            jobId: `${appointmentId}-1hour`,
            delay: oneHourBefore.getTime() - now.getTime(),
            removeOnComplete: true,
            removeOnFail: false,
          }
        );
        logger.info(`[REMINDER] Scheduled 1-hour reminder for ${appointmentId}`);
      }

      // Schedule 10-minute reminder
      const tenMinutesBefore = new Date(appointmentDateTime.getTime() - 10 * 60 * 1000);
      if (tenMinutesBefore > now) {
        await this.reminderQueue.add(
          '10-minute-reminder',
          {
            appointmentId,
            type: '10-minute',
          },
          {
            jobId: `${appointmentId}-10min`,
            delay: tenMinutesBefore.getTime() - now.getTime(),
            removeOnComplete: true,
            removeOnFail: false,
          }
        );
        logger.info(`[REMINDER] Scheduled 10-minute reminder for ${appointmentId}`);
      }
    } catch (error) {
      logger.error(`[REMINDER] Failed to schedule reminders:`, error.message);
    }
  }

  // Cancel reminders for an appointment
  async cancelReminders(appointmentId) {
    if (!this.reminderQueue) {
      return;
    }

    try {
      await this.reminderQueue.remove(`${appointmentId}-1hour`);
      await this.reminderQueue.remove(`${appointmentId}-10min`);
      logger.info(`[REMINDER] Cancelled reminders for ${appointmentId}`);
    } catch (error) {
      logger.error(`[REMINDER] Failed to cancel reminders:`, error.message);
    }
  }
}

export default new ReminderService();
