import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';

class ReminderService {
  constructor() {
    this.queue = null;
  }

  getQueue() {
    if (!this.queue) {
      const redis = getRedisClient();
      if (!redis) return null;
      this.queue = new Queue('appointment-reminders', { connection: redis });
    }
    return this.queue;
  }

  async scheduleReminders(appointmentId, date, time) {
    const queue = this.getQueue();
    if (!queue) {
      logger.warn('[REMINDER] Queue not available — Redis missing');
      return;
    }

    try {
      // Appointment datetime banao
      const [hours, minutes] = time.split(':').map(Number);
      const appointmentDate = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);

      const now = new Date();

      // 10 minute pehle
      const tenMinBefore = new Date(appointmentDate.getTime() - 10 * 60 * 1000);
      const tenMinDelay = tenMinBefore.getTime() - now.getTime();

      // 1 hour pehle
      const oneHourBefore = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
      const oneHourDelay = oneHourBefore.getTime() - now.getTime();

      // 10-minute reminder
      if (tenMinDelay > 0) {
        await queue.add(
          'reminder',
          { appointmentId, type: '10-minute' },
          {
            delay: tenMinDelay,
            jobId: `reminder-10min-${appointmentId}`,
            removeOnComplete: true,
            removeOnFail: false,
          }
        );
        logger.info(`[REMINDER] 10-min reminder scheduled for ${appointmentId} at ${tenMinBefore.toISOString()}`);
      }

      // 1-hour reminder
      if (oneHourDelay > 0) {
        await queue.add(
          'reminder',
          { appointmentId, type: '1-hour' },
          {
            delay: oneHourDelay,
            jobId: `reminder-1hour-${appointmentId}`,
            removeOnComplete: true,
            removeOnFail: false,
          }
        );
        logger.info(`[REMINDER] 1-hour reminder scheduled for ${appointmentId} at ${oneHourBefore.toISOString()}`);
      }

    } catch (error) {
      logger.error('[REMINDER] Schedule failed:', error.message);
    }
  }

  async cancelReminders(appointmentId) {
    const queue = this.getQueue();
    if (!queue) return;

    try {
      const job10min = await queue.getJob(`reminder-10min-${appointmentId}`);
      const job1hour = await queue.getJob(`reminder-1hour-${appointmentId}`);

      if (job10min) await job10min.remove();
      if (job1hour) await job1hour.remove();

      logger.info(`[REMINDER] Reminders cancelled for ${appointmentId}`);
    } catch (error) {
      logger.error('[REMINDER] Cancel failed:', error.message);
    }
  }
}

export default new ReminderService();
```

---

## STEP 9 — Render Pe Env Variables Add Karo
```
Render Dashboard → Backend → Environment:

RESEND_API_KEY   = re_ZKiUCBmm_Je2Wfw5RaQRUxAjAVh2zoQw3
EMAIL_ENABLED    = true
EMAIL_FROM       = HealthLine <onboarding@resend.dev>