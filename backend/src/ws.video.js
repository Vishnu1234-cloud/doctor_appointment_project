import jwt from 'jsonwebtoken';
import url from 'url';
import xss from 'xss';
import config from './config/env.js';
import User from './models/User.js';
import Appointment from './models/Appointment.js';
import chatService from './services/chat.service.js';
import logger from './utils/logger.js';

/**
 * Setup WebSocket for video signaling
 * Endpoint: /ws/consultation/:appointmentId
 */
export const setupVideoSignaling = (wss) => {
  // Store active connections
  const rooms = new Map(); // appointmentId -> Map(userId -> ws)

  // Configure ping polling to cleanup zombies safely natively
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  wss.on('connection', async (ws, request) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    let userId = null;
    let userRole = null;
    let appointmentId = null;

    try {
      // Parse URL
      const pathname = url.parse(request.url).pathname;
      const pathParts = pathname.split('/');
      appointmentId = pathParts[pathParts.length - 1];

      if (!appointmentId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Appointment ID required' }));
        ws.close();
        return;
      }

      // Wait for authentication message
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());

          // Handle authentication
          if (data.type === 'auth' && !userId) {
            const token = data.token;

            if (!token) {
              ws.send(JSON.stringify({ type: 'error', message: 'Token required' }));
              ws.close();
              return;
            }

            // Verify token
            const decoded = jwt.verify(token, config.jwtSecret);
            const user = await User.findOne({ email: decoded.sub });

            if (!user) {
              ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
              ws.close();
              return;
            }

            userId = user.id;
            userRole = user.role;

            // Verify appointment exists
            const appointment = await Appointment.findOne({ id: appointmentId });
            if (!appointment) {
              ws.send(JSON.stringify({ type: 'error', message: 'Appointment not found' }));
              ws.close();
              return;
            }

            // Check permissions dynamically
            if (userRole === 'patient' && appointment.patient_id !== userId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authorized to access this consultation room' }));
              ws.close();
              return;
            }

            // Add to room
            if (!rooms.has(appointmentId)) {
              rooms.set(appointmentId, new Map());
            }
            rooms.get(appointmentId).set(userId, { ws, role: userRole });

            logger.info(`Video signaling: User ${userId} (${userRole}) connected to ${appointmentId}`);

            // Send authentication success
            const roomUsers = Array.from(rooms.get(appointmentId).entries())
              .filter(([uid]) => uid !== userId)
              .map(([uid, data]) => ({ user_id: uid, role: data.role }));

            // Build ICE servers payload securely without exposing backend ENV globally
            const iceServers = config.webrtc.turnUrls.map(url => {
              const u = url.trim();
              if (u.startsWith('turn:') && config.webrtc.turnUsername && config.webrtc.turnCredential) {
                return {
                  urls: u,
                  username: config.webrtc.turnUsername,
                  credential: config.webrtc.turnCredential
                };
              }
              return { urls: u };
            });

            ws.send(
              JSON.stringify({
                type: 'auth_success',
                user_id: userId,
                user_role: userRole,
                room_users: roomUsers,
                ice_servers: iceServers,
              })
            );

            // Notify others
            broadcastToRoom(appointmentId, userId, {
              type: 'user_joined',
              user_id: userId,
              user_role: userRole,
            });

            return;
          }

          // All other messages require authentication
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            return;
          }

          // Handle signaling messages
          if (data.type === 'offer') {
            sendToUser(appointmentId, data.target_user_id, {
              type: 'offer',
              offer: data.offer,
              from_user_id: userId,
              from_role: userRole,
            });
          } else if (data.type === 'answer') {
            sendToUser(appointmentId, data.target_user_id, {
              type: 'answer',
              answer: data.answer,
              from_user_id: userId,
            });
          } else if (data.type === 'ice_candidate') {
            sendToUser(appointmentId, data.target_user_id, {
              type: 'ice_candidate',
              candidate: data.candidate,
              from_user_id: userId,
            });
          } else if (data.type === 'chat_message') {
            // Handle chat messages
            const message = data.message;
            const messageId = data.msgId; // Optional client-provided ID for ACK

            if (message && message.trim()) {
              try {
                // Anti-Abuse: Size validation
                if (message.length > 2000) {
                  ws.send(JSON.stringify({ type: 'error', message: 'Message length exceeds 2000 characters limit' }));
                  return;
                }
                // Sanitize incoming message to prevent XSS
                const sanitizedMessage = typeof message === 'string' ? xss(message.trim()) : '';

                // Save message to database
                const savedMessage = await chatService.saveMessage(
                  appointmentId,
                  userId,
                  userRole,
                  sanitizedMessage
                );

                // Broadcast to all users in the room (including sender)
                broadcastToRoomAll(appointmentId, {
                  type: 'chat_message',
                  id: savedMessage.id,
                  message: savedMessage.message,
                  from_user_id: userId,
                  from_role: userRole,
                  timestamp: savedMessage.timestamp,
                });

                logger.info(`Chat message sent in appointment ${appointmentId} by ${userId}`);

                // Delivery ACK to sender
                ws.send(JSON.stringify({
                  type: 'chat_message_ack',
                  status: 'ok',
                  msgId: savedMessage.id,
                  clientMsgId: messageId
                }));
              } catch (error) {
                logger.error('Error saving chat message:', error.message);
                ws.send(JSON.stringify({ type: 'error', message: 'Failed to send message' }));
              }
            }
          } else if (data.type === 'leave') {
            ws.close();
          }
        } catch (error) {
          logger.error('WebSocket message error:', error.message);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        if (userId && appointmentId) {
          // Remove from room
          if (rooms.has(appointmentId)) {
            rooms.get(appointmentId).delete(userId);
            if (rooms.get(appointmentId).size === 0) {
              rooms.delete(appointmentId);
            }
          }

          // Notify others
          broadcastToRoom(appointmentId, userId, {
            type: 'user_left',
            user_id: userId,
            user_role: userRole,
          });

          logger.info(`Video signaling: User ${userId} disconnected from ${appointmentId}`);
        }
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error.message);
      });
    } catch (error) {
      logger.error('WebSocket connection error:', error.message);
      ws.close();
    }
  });

  // Helper function to broadcast to room
  const broadcastToRoom = (appointmentId, excludeUserId, message) => {
    if (!rooms.has(appointmentId)) return;

    rooms.get(appointmentId).forEach((data, uid) => {
      if (uid !== excludeUserId && data.ws.readyState === 1) {
        data.ws.send(JSON.stringify(message));
      }
    });
  };

  // Helper function to broadcast to ALL users in room (including sender)
  const broadcastToRoomAll = (appointmentId, message) => {
    if (!rooms.has(appointmentId)) return;

    rooms.get(appointmentId).forEach((data, uid) => {
      if (data.ws.readyState === 1) {
        data.ws.send(JSON.stringify(message));
      }
    });
  };

  // Helper function to send to specific user
  const sendToUser = (appointmentId, targetUserId, message) => {
    if (!rooms.has(appointmentId)) return;

    const userData = rooms.get(appointmentId).get(targetUserId);
    if (userData && userData.ws.readyState === 1) {
      userData.ws.send(JSON.stringify(message));
    }
  };

  logger.info('WebSocket video signaling configured');
};
