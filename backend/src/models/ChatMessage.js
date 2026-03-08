import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    appointment_id: {
      type: String,
      required: true,
      index: true,
    },
    sender_id: {
      type: String,
      required: true,
    },
    sender_role: {
      type: String,
      enum: ['patient', 'doctor'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'chat_messages',
  }
);

// Indexes
chatMessageSchema.index({ appointment_id: 1, timestamp: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
