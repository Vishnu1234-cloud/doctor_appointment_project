import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    otp_hash: {
      type: String,
      required: true,
    },
    delivery_channel: {
      type: String,
      enum: ['sms', 'email'],
      required: true,
    },
    recipient: {
      type: String,
      required: true,
    },
    expiry_time: {
      type: Date,
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    locked_until: Date,
  },
  {
    timestamps: { createdAt: 'created_at' },
    collection: 'otp_verifications',
  }
);

// Indexes
otpVerificationSchema.index({ user_id: 1, created_at: -1 });
otpVerificationSchema.index({ expiry_time: 1 }, { expireAfterSeconds: 0 }); // TTL index

const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);

export default OTPVerification;
