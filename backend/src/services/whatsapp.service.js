import axios from 'axios';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { formatPhoneNumber } from '../utils/helpers.js';
import NotificationLog from '../models/NotificationLog.js';
import { generateId } from '../utils/helpers.js';

/**
 * WhatsApp Service - FOR APPOINTMENT REMINDERS ONLY
 * CRITICAL: NEVER use for OTP delivery
 */
class WhatsAppService {
  // Send appointment reminder (NOT OTP!)
  async sendAppointmentReminder(phone, templateName, variables) {
    if (!config.whatsapp.enabled) {
      logger.warn('[WHATSAPP] Service disabled');
      return false;
    }

    if (!config.whatsapp.accessToken || !config.whatsapp.phoneNumberId) {
      logger.warn('[WHATSAPP] Business API credentials not configured');
      return false;
    }

    const cleanPhone = formatPhoneNumber(phone);

    try {
      const url = `https://graph.facebook.com/v18.0/${config.whatsapp.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [],
        },
      };

      // Add variables if provided
      if (variables && Object.keys(variables).length > 0) {
        payload.template.components = [
          {
            type: 'body',
            parameters: Object.values(variables).map((v) => ({
              type: 'text',
              text: String(v),
            })),
          },
        ];
      }

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${config.whatsapp.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        logger.info(`[WHATSAPP] Message sent to ${cleanPhone}: ${templateName}`);
        await this.logNotification('whatsapp', 'reminder', cleanPhone, 'sent');
        return true;
      } else {
        logger.error('[WHATSAPP] API error:', response.data);
        await this.logNotification('whatsapp', 'reminder', cleanPhone, 'failed');
        return false;
      }
    } catch (error) {
      logger.error('[WHATSAPP] Failed to send message:', error.message);
      await this.logNotification('whatsapp', 'reminder', cleanPhone, 'failed', error.message);
      return false;
    }
  }

  // Send booking confirmation
  async sendBookingConfirmation(phone, appointmentData) {
    return await this.sendAppointmentReminder(
      phone,
      'appointment_booking',
      {
        patient_name: appointmentData.patient_name,
        date: appointmentData.date,
        time: appointmentData.time,
      }
    );
  }

  // Send reminder (1 hour before)
  async sendOneHourReminder(phone, appointmentData) {
    return await this.sendAppointmentReminder(
      phone,
      'appointment_reminder',
      {
        patient_name: appointmentData.patient_name,
        date: appointmentData.date,
        time: appointmentData.time,
        reminder: '1 hour',
      }
    );
  }

  // Send reminder (10 minutes before)
  async sendTenMinuteReminder(phone, appointmentData) {
    return await this.sendAppointmentReminder(
      phone,
      'appointment_reminder',
      {
        patient_name: appointmentData.patient_name,
        date: appointmentData.date,
        time: appointmentData.time,
        reminder: '10 minutes',
      }
    );
  }

  // Log notification
  async logNotification(channel, type, recipient, status, error = null) {
    try {
      await NotificationLog.create({
        id: generateId(),
        channel,
        type,
        recipient,
        status,
        error,
      });
    } catch (err) {
      logger.error('Failed to log notification:', err.message);
    }
  }
}

export default new WhatsAppService();
