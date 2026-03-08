import OTPVerification from '../models/OTPVerification.js';
import User from '../models/User.js';
import config from '../config/env.js';
import { generateOTP, hashOTP, verifyOTP, generateId } from '../utils/helpers.js';
import logger from '../utils/logger.js';
import smsService from './sms.service.js';
import emailService from './email.service.js';

class OTPService {
  // Create OTP record
  async createOTP(userId, deliveryChannel, recipient) {
    // Check recent OTP requests (anti-abuse)
    const recentOTPs = await this.getRecentOTPCount(userId);
    
    if (recentOTPs.hourly >= config.otp.maxPerHour) {
      throw new Error('Too many OTP requests. Please try again after 1 hour');
    }
    
    if (recentOTPs.daily >= config.otp.maxPerDay) {
      throw new Error('Too many OTP requests. Please try again tomorrow');
    }

    // Check resend cooldown
    const lastOTP = await OTPVerification.findOne({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(1);

    if (lastOTP) {
      const cooldownMs = config.otp.resendCooldownSeconds * 1000;
      const timeSinceLastOTP = Date.now() - new Date(lastOTP.created_at).getTime();
      
      if (timeSinceLastOTP < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastOTP) / 1000);
        throw new Error(`Please wait ${remainingSeconds} seconds before requesting new OTP`);
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const otpId = generateId();

    // Create record
    await OTPVerification.create({
      id: otpId,
      user_id: userId,
      otp_hash: otpHash,
      delivery_channel: deliveryChannel,
      recipient,
      expiry_time: new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000),
      attempts: 0,
      verified: false,
    });

    // Log OTP in development mode ONLY
    if (config.nodeEnv === 'development') {
      logger.info(`[DEV] OTP for ${recipient}: ${otp}`);
    }

    return { otp, otpId };
  }

  // Send OTP via chosen channel
  async sendOTP(userId, deliveryChannel, recipient, userName) {
    const { otp, otpId } = await this.createOTP(userId, deliveryChannel, recipient);

    let sent = false;

    try {
      if (deliveryChannel === 'sms') {
        sent = await smsService.sendOTP(recipient, otp);
      } else if (deliveryChannel === 'email') {
        sent = await emailService.sendOTP(recipient, otp, userName);
      }

      logger.info(`OTP sent via ${deliveryChannel} to ${recipient}`);
    } catch (error) {
      logger.error(`Failed to send OTP via ${deliveryChannel}:`, error.message);
      // Don't throw - OTP is logged in dev mode
    }

    return {
      success: true,
      otpId,
      deliveryChannel,
      message: sent
        ? `OTP sent to your ${deliveryChannel}`
        : `OTP delivery attempted. Check logs in development mode.`,
    };
  }

  // Verify OTP
  async verifyOTP(userId, otpId, otp) {
    const otpRecord = await OTPVerification.findOne({
      id: otpId,
      user_id: userId,
    });

    if (!otpRecord) {
      throw new Error('OTP record not found');
    }

    if (otpRecord.verified) {
      throw new Error('OTP already used');
    }

    // Check if locked due to too many attempts
    if (otpRecord.locked_until && new Date() < otpRecord.locked_until) {
      const remainingMinutes = Math.ceil(
        (otpRecord.locked_until - new Date()) / 60000
      );
      throw new Error(`Account locked. Try again in ${remainingMinutes} minutes`);
    }

    // Check expiry
    if (new Date() > otpRecord.expiry_time) {
      throw new Error('OTP expired');
    }

    // Check max attempts
    if (otpRecord.attempts >= config.otp.maxAttempts) {
      // Lock for 15 minutes
      otpRecord.locked_until = new Date(Date.now() + 15 * 60 * 1000);
      await otpRecord.save();
      throw new Error('Maximum attempts exceeded. Account locked for 15 minutes');
    }

    // Verify OTP
    const isValid = verifyOTP(otp, otpRecord.otp_hash);

    if (!isValid) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      const remainingAttempts = config.otp.maxAttempts - otpRecord.attempts;
      throw new Error(
        `Invalid OTP. ${remainingAttempts} attempt(s) remaining`
      );
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Update user verification status
    await User.findOneAndUpdate(
      { id: userId },
      { $set: { otp_verified: true } }
    );

    logger.info(`OTP verified for user: ${userId}`);
    return { success: true, message: 'OTP verified successfully' };
  }

  // Get recent OTP count (anti-abuse)
  async getRecentOTPCount(userId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const hourly = await OTPVerification.countDocuments({
      user_id: userId,
      created_at: { $gte: oneHourAgo },
    });

    const daily = await OTPVerification.countDocuments({
      user_id: userId,
      created_at: { $gte: oneDayAgo },
    });

    return { hourly, daily };
  }

  // Resend OTP
  async resendOTP(userId, deliveryChannel, recipient, userName) {
    return await this.sendOTP(userId, deliveryChannel, recipient, userName);
  }
}

export default new OTPService();
