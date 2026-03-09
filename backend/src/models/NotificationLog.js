import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    appointment_id: String,
    user_id: String,
    channel: {
      type: String,
      enum: ['sms', 'email', 'whatsapp'],
      required: true,
    },
    type: {
      type: String,
      enum: ['otp', 'booking', 'reminder', 'meeting_link', 'meeting_joined', 'completed', 'prescription'],
    },
    recipient: String,
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
    },
    error: String,
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'notification_logs',
  }
);

// Indexes
notificationLogSchema.index({ appointment_id: 1, user_id: 1 });
notificationLogSchema.index({ created_at: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30-day TTL

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

export default NotificationLog;
