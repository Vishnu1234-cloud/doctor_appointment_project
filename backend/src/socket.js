import jwt from 'jsonwebtoken';
import xss from 'xss';
import config from './config/env.js';
import User from './models/User.js';
import Appointment from './models/Appointment.js';
import chatService from './services/chat.service.js';
import logger from './utils/logger.js';

/**
 * Setup Socket.IO for real-time chat
 */
export const setupSocketIO = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findOne({ email: decoded.sub }).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user to socket
      socket.user = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      };

      next();
    } catch (error) {
      logger.error('Socket.IO auth error:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info(`Socket.IO connected: ${socket.user.id} (${socket.user.role})`);

    // Join appointment room
    socket.on('join_appointment', async (appointmentId, callback) => {
      try {
        // Validate appointment and user permission
        const appointment = await Appointment.findOne({ id: appointmentId });
        if (!appointment) {
          throw new Error('Appointment not found');
        }

        if (socket.user.role === 'patient' && appointment.patient_id !== socket.user.id) {
          throw new Error('Not authorized to access this consultation room');
        }

        socket.join(`appointment_${appointmentId}`);
        logger.info(`User ${socket.user.id} joined appointment ${appointmentId}`);

        // Notify others in the room
        socket.to(`appointment_${appointmentId}`).emit('user_joined', {
          user_id: socket.user.id,
          user_role: socket.user.role,
          user_name: socket.user.full_name,
        });

        // Send confirmation
        socket.emit('joined_appointment', {
          appointmentId,
          message: 'Successfully joined appointment',
        });

        // Acknowledge to sender via callback if provided
        if (typeof callback === 'function') {
          callback({ status: 'ok' });
        }
      } catch (error) {
        logger.error('Error joining appointment:', error.message);
        socket.emit('error', { message: error.message || 'Failed to join appointment' });
        if (typeof callback === 'function') callback({ status: 'error', error: error.message });
      }
    });

    // Send chat message
    socket.on('send_message', async (data, callback) => {
      try {
        const { appointmentId, message } = data;

        // Anti-abuse: Limit message length and enforce existance
        if (!message || message.trim().length === 0) {
          throw new Error('Message cannot be empty');
        }
        if (message.length > 2000) {
          throw new Error('Message length exceeds 2000 characters limit');
        }

        // Sanitize incoming message to prevent XSS
        const sanitizedMessage = typeof message === 'string' ? xss(message.trim()) : '';

        // Save message to database correctly
        const chatMessage = await chatService.saveMessage(
          appointmentId,
          socket.user.id,
          socket.user.role,
          sanitizedMessage
        );

        // Broadcast to room
        io.to(`appointment_${appointmentId}`).emit('new_message', {
          id: chatMessage.id,
          appointment_id: chatMessage.appointment_id,
          sender_id: chatMessage.sender_id,
          sender_role: chatMessage.sender_role,
          sender_name: socket.user.full_name,
          message: chatMessage.message,
          timestamp: chatMessage.timestamp,
        });

        logger.info(`Message sent in appointment ${appointmentId}`);

        // Provide delivery ACK to sender via callback
        if (typeof callback === 'function') {
          callback({ status: 'ok', msgId: chatMessage.id });
        }
      } catch (error) {
        logger.error('Error sending message:', error.message);
        socket.emit('error', { message: error.message || 'Failed to send message' });
        if (typeof callback === 'function') callback({ status: 'error', error: error.message });
      }
    });

    // User typing indicator
    socket.on('typing', (data) => {
      const { appointmentId } = data;
      socket.to(`appointment_${appointmentId}`).emit('user_typing', {
        user_id: socket.user.id,
        user_name: socket.user.full_name,
      });
    });

    // User stopped typing
    socket.on('stop_typing', (data) => {
      const { appointmentId } = data;
      socket.to(`appointment_${appointmentId}`).emit('user_stop_typing', {
        user_id: socket.user.id,
      });
    });

    // Leave appointment
    socket.on('leave_appointment', (appointmentId) => {
      socket.leave(`appointment_${appointmentId}`);
      socket.to(`appointment_${appointmentId}`).emit('user_left', {
        user_id: socket.user.id,
        user_role: socket.user.role,
      });
      logger.info(`User ${socket.user.id} left appointment ${appointmentId}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket.IO disconnected: ${socket.user.id}`);
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error('Socket.IO error:', error);
    });
  });

  logger.info('Socket.IO configured for real-time chat');
};
