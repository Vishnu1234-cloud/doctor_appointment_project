import axios from 'axios';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import NotificationLog from '../models/NotificationLog.js';
import { generateId } from '../utils/helpers.js';

class EmailService {
  // Send OTP via Resend
  async sendOTP(email, otp, userName) {
    if (!config.email.enabled) {
      logger.warn('[EMAIL] Service disabled. OTP:', config.nodeEnv === 'development' ? otp : '***');
      return false;
    }

    if (!config.email.apiKey) {
      logger.warn('[EMAIL] Resend API key not configured');
      return false;
    }

    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: config.email.from,
          to: [email],
          subject: 'Your HealthLine Verification Code',
          html: this.getOTPEmailTemplate(otp, userName),
        },
        {
          headers: {
            Authorization: `Bearer ${config.email.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.status === 200) {
        logger.info(`[EMAIL] OTP sent to ${email}`);
        await this.logNotification('email', 'otp', email, 'sent');
        return true;
      } else {
        logger.error('[EMAIL] Resend API error:', response.data);
        await this.logNotification('email', 'otp', email, 'failed');
        return false;
      }
    } catch (error) {
      logger.error('[EMAIL] Failed to send OTP:', error.message);
      await this.logNotification('email', 'otp', email, 'failed', error.message);
      return false;
    }
  }

  // Send appointment notification
  async sendAppointmentEmail(email, userName, data) {
    if (!config.email.enabled || !config.email.apiKey) {
      logger.warn('[EMAIL] Service not configured');
      return false;
    }

    try {
      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: config.email.from,
          to: [email],
          subject: 'HealthLine Appointment Confirmation',
          html: this.getAppointmentEmailTemplate(userName, data),
        },
        {
          headers: {
            Authorization: `Bearer ${config.email.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.status === 200) {
        logger.info(`[EMAIL] Appointment notification sent to ${email}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[EMAIL] Failed to send appointment email:', error.message);
      return false;
    }
  }

  // OTP Email Template
  getOTPEmailTemplate(otp, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0F766E 0%, #14B8A6 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">HealthLine</h1>
          </div>
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Hi ${userName},</h2>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
              Your verification code is:
            </p>
            <div style="background: #f1f5f9; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
              <h1 style="color: #0F766E; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              This code will expire in ${config.otp.expiryMinutes} minutes.
            </p>
            <p style="color: #64748b; font-size: 14px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © 2026 HealthLine. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Appointment Email Template
  getAppointmentEmailTemplate(userName, data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0F766E 0%, #14B8A6 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">HealthLine</h1>
          </div>
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Hi ${userName},</h2>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
              Your appointment has been confirmed!
            </p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Date:</strong> ${data.date}</p>
              <p style="margin: 10px 0;"><strong>Time:</strong> ${data.time}</p>
              <p style="margin: 10px 0;"><strong>Type:</strong> ${data.consultation_type}</p>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              Please be available at the scheduled time. You'll receive reminders before your appointment.
            </p>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © 2026 HealthLine. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
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

export default new EmailService();
