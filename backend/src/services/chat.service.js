import ChatMessage from '../models/ChatMessage.js';
import { generateId } from '../utils/helpers.js';
import logger from '../utils/logger.js';

class ChatService {
  // Save chat message
  async saveMessage(appointmentId, senderId, senderRole, message) {
    const messageId = generateId();

    const chatMessage = await ChatMessage.create({
      id: messageId,
      appointment_id: appointmentId,
      sender_id: senderId,
      sender_role: senderRole,
      message,
      timestamp: new Date(),
    });

    return chatMessage;
  }

  // Get chat messages for an appointment
  async getMessages(appointmentId, limit = 50, skip = 0) {
    const messages = await ChatMessage.find({ appointment_id: appointmentId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    return messages.reverse();
  }

  // Delete messages (for cleanup)
  async deleteMessages(appointmentId) {
    await ChatMessage.deleteMany({ appointment_id: appointmentId });
    logger.info(`Chat messages deleted for appointment: ${appointmentId}`);
  }
}

export default new ChatService();
