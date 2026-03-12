import axios from 'axios';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { formatPhoneNumber, isValidIndianPhone, generateId } from '../utils/helpers.js';
import NotificationLog from '../models/NotificationLog.js';

class SMSService {
  // Send OTP via MSG91
  async sendOTP(phone, otp) {
    if (!config.sms.enabled) {
      logger.warn('[SMS] Service disabled. OTP:', config.nodeEnv === 'development' ? otp : '***');
      return false;
    }

    if (!config.sms.apiKey || !config.sms.templateId) {
      logger.warn('[SMS] MSG91 credentials not configured');
      return false;
    }

    if (!isValidIndianPhone(phone)) {
      logger.error('[SMS] Invalid Indian phone number:', phone);
      throw new Error('Invalid Indian phone number format');
    }

    const cleanPhone = formatPhoneNumber(phone);
    const mobileNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    try {
      const url = 'https://control.msg91.com/api/v5/otp';

      const payload = {
        template_id: config.sms.templateId,
        mobile: mobileNumber,
        authkey: config.sms.apiKey,
        otp,
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data.type === 'success') {
        logger.info(`[SMS] OTP sent to ${mobileNumber}`);
        await this.logNotification('sms', 'otp', mobileNumber, 'sent');
        return true;
      } else {
        logger.error('[SMS] MSG91 API error:', response.data);
        await this.logNotification('sms', 'otp', mobileNumber, 'failed', response.data.message);
        return false;
      }
    } catch (error) {
      logger.error('[SMS] Failed to send OTP:', error.message);
      await this.logNotification('sms', 'otp', mobileNumber, 'failed', error.message);
      return false;
    }
  }

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

const smsService = new SMSService();

export const sendOtpSms = (phone, otp) => smsService.sendOTP(phone, otp);
export default smsService;