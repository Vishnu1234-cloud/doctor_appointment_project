import chatService from '../services/chat.service.js';

class ChatController {
  // Send message (REST API - also handled by Socket.IO)
  async sendMessage(req, res, next) {
    try {
      const { appointment_id, message } = req.body;

      const chatMessage = await chatService.saveMessage(
        appointment_id,
        req.user.id,
        req.user.role,
        message
      );

      res.status(201).json(chatMessage.toObject());
    } catch (error) {
      next(error);
    }
  }

  // Get messages
  async getMessages(req, res, next) {
    try {
      const { appointment_id } = req.params;
      const limit = parseInt(req.query.limit, 10) || 50;
      const skip = parseInt(req.query.skip, 10) || 0;

      const messages = await chatService.getMessages(appointment_id, limit, skip);

      res.json(messages.map((m) => m.toObject()));
    } catch (error) {
      next(error);
    }
  }
}

export default new ChatController();
