import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Generate JWT secret if not provided
const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8001', 10),

  // Database
  mongoUrl: process.env.MONGO_URL,
  dbName: process.env.DB_NAME || 'healthline_db',

  // JWT - CRASH if missing or weak
  jwtSecret: (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET must be provided in environment and be at least 32 characters long');
    }
    return secret;
  })(),
  jwtExpiration: process.env.JWT_EXPIRATION || '72h',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',

  // CORS - Strict in production
  corsOrigins: process.env.NODE_ENV === 'production' && process.env.CORS_ORIGINS === '*'
    ? (() => { throw new Error('CORS_ORIGINS cannot be "*" in production'); })()
    : (process.env.CORS_ORIGINS || '*').split(','),

  // Redis
  redis: {
  url: process.env.REDIS_URL || '',
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  username: process.env.REDIS_USERNAME || 'default',
},

  // OTP
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10),
    maxPerHour: parseInt(process.env.OTP_MAX_PER_HOUR || '5', 10),
    maxPerDay: parseInt(process.env.OTP_MAX_PER_DAY || '10', 10),
  },

  // SMS (MSG91)
  sms: {
    enabled: process.env.SMS_ENABLED === 'true',
    apiKey: process.env.MSG91_API_KEY || '',
    senderId: process.env.MSG91_SENDER_ID || '',
    templateId: process.env.MSG91_TEMPLATE_ID || '',
    route: process.env.MSG91_ROUTE || 'otp',
  },

  // Email (Resend)
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    apiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'noreply@healthline.com',
  },

  // WhatsApp (Reminders Only)
  whatsapp: {
    enabled: process.env.WHATSAPP_ENABLED === 'true',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  },

  // Payment
  payment: {
    testMode: process.env.PAYMENT_TEST_MODE !== 'false',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },

  // AI Chatbot
  chatbot: {
    enabled: process.env.CHATBOT_ENABLED === 'true',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
  },

  // WebRTC
  webrtc: {
    turnUrls: (process.env.TURN_URLS || 'stun:stun.l.google.com:19302').split(','),
    turnUsername: process.env.TURN_USERNAME || '',
    turnCredential: process.env.TURN_CREDENTIAL || '',
  },

 // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8001/api/auth/google/callback',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate critical config
if (!config.mongoUrl) {
  throw new Error('MONGO_URL is required');
}

// Environment successfully loaded
export default config;
