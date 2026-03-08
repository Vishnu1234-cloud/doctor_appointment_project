import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Generate secure OTP
export const generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

// Hash OTP for storage
export const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

// Verify OTP
export const verifyOTP = (otp, hash) => {
  return hashOTP(otp) === hash;
};

// Generate unique ID
export const generateId = () => {
  return uuidv4();
};

// Format phone number (remove spaces, +)
export const formatPhoneNumber = (phone) => {
  return phone.replace(/[\s+]/g, '');
};

// Validate Indian phone number
export const isValidIndianPhone = (phone) => {
  const cleaned = formatPhoneNumber(phone);
  return /^(91)?[6-9]\d{9}$/.test(cleaned);
};

// Add delay (for rate limiting simulation)
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Check if user enumeration should be prevented
export const preventUserEnumeration = () => {
  // Always return generic message to prevent enumeration
  return 'If an account exists, you will receive an OTP';
};

// Sanitize user data for response
export const sanitizeUser = (user) => {
  const sanitized = { ...user };
  delete sanitized.password;
  delete sanitized.__v;
  return sanitized;
};
