import axios from 'axios';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { generateId } from '../utils/helpers.js';
import NotificationLog from '../models/NotificationLog.js';

class SMSService {
  // ✅ Fast2SMS se OTP bhejo
  async sendOTP(phone, otp) {
    if (!config.sms.enabled) {
      logger.warn('[SMS] Service disabled. OTP:', config.nodeEnv === 'development' ? otp : '***');
      return false;
    }

    if (!process.env.FAST2SMS_API_KEY) {
      logger.warn('[SMS] Fast2SMS API key not configured');
      return false;
    }

    // Phone number clean karo — sirf digits
    let cleanPhone = phone.toString().replace(/\D/g, '');
    // +91 ya 91 prefix hatao
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      cleanPhone = cleanPhone.slice(2);
    }

    // 10 digit hona chahiye
    if (cleanPhone.length !== 10) {
      logger.error('[SMS] Invalid phone number:', phone);
      return false;
    }

    try {
      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          variables_values: otp,
          route: 'otp',
          numbers: cleanPhone,
        },
        {
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data.return === true) {
        logger.info(`[SMS] OTP sent to ${cleanPhone} via Fast2SMS`);
        await this.logNotification('sms', 'otp', cleanPhone, 'sent');
        return true;
      } else {
        logger.error('[SMS] Fast2SMS error:', response.data);
        await this.logNotification('sms', 'otp', cleanPhone, 'failed', JSON.stringify(response.data));
        return false;
      }
    } catch (error) {
      logger.error('[SMS] Fast2SMS failed:', error.message);
      await this.logNotification('sms', 'otp', cleanPhone, 'failed', error.message);
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