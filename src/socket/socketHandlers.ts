import { Server, Socket } from 'socket.io';
import { Types } from 'mongoose';
import { verifyToken } from '../utils/jwt';
import type { SocketService } from '../services/socket.service';
import { Message } from '../models/Message';
import { Chat } from '../models/Chat';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

/**
 * Middleware to authenticate socket connections using JWT
 */
const authenticateSocket = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    let token = socket.handshake.auth?.token as string | undefined;

    if (!token && socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie;
      const tokenMatch = cookies.match(/auth_token=([^;]+)/);
      if (tokenMatch) {
        token = tokenMatch[1];
      }
    }

    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7, token.length);
    }

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    // Verify JWT token
    const payload = verifyToken(token);
    const userId = payload.sub;

    if (!userId) {
      return next(new Error('Invalid token payload'));
    }

    // Attach userId to socket for later use
    socket.userId = userId;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

/**
 * Handle socket connection
 */
const handleConnection = (socket: AuthenticatedSocket, socketService: SocketService): void => {
  const userId = socket.userId;

  if (!userId) {
    console.error('Socket connected without userId');
    socket.disconnect();
    return;
  }

  console.log(`User ${userId} connected with socket ${socket.id}`);

  // Add user to connection map
  socketService.addUserConnection(userId, socket.id);

  // Join user to their own room
  socket.join(userId);

  // Emit online status to all friends
  socketService.emitToFriends(userId, 'user:online', {
    userId,
    timestamp: new Date().toISOString(),
  }).catch((error: unknown) => {
    console.error('Error emitting online status:', error);
  });

  // Handle typing events
  socket.on('typing:start', (data: { chatId: string; recipientId: string }) => {
    console.log(`User ${userId} started typing in chat ${data.chatId}`);
    
    if (data.recipientId) {
      socketService.emitToUser(data.recipientId, 'typing:start', {
        chatId: data.chatId,
        userId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on('typing:stop', (data: { chatId: string; recipientId: string }) => {
    console.log(`User ${userId} stopped typing in chat ${data.chatId}`);
    
    if (data.recipientId) {
      socketService.emitToUser(data.recipientId, 'typing:stop', {
        chatId: data.chatId,
        userId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Handle send_message event - save to DB and emit to recipient
   */
  socket.on('send_message', async (data: { chatId: string; text: string; recipientId: string }) => {
    try {
      console.log(`User ${userId} sending message in chat ${data.chatId}`);

      if (!data.chatId || !data.text || !data.recipientId) {
        socket.emit('error', { message: 'Missing required fields: chatId, text, recipientId' });
        return;
      }

      if (!Types.ObjectId.isValid(data.chatId)) {
        socket.emit('error', { message: 'Invalid chat ID' });
        return;
      }

      // Verify chat exists and user is participant
      const chat = await Chat.findById(data.chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      const isParticipant = chat.participants.some(
        (participantId) => participantId.toString() === userId
      );

      if (!isParticipant) {
        socket.emit('error', { message: 'You are not a participant in this chat' });
        return;
      }

      // Create message with sender already in readBy
      const message = await Message.create({
        chatId: new Types.ObjectId(data.chatId),
        senderId: new Types.ObjectId(userId),
        text: data.text.trim(),
        readBy: [new Types.ObjectId(userId)]
      });

      // Update chat's lastMessage and updatedAt
      await Chat.findByIdAndUpdate(data.chatId, {
        lastMessage: message._id,
        updatedAt: new Date()
      });

      // Populate message
      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'name email photo')
        .populate('readBy', 'name email photo');

      // Emit to recipient if online
      socketService.emitToUser(data.recipientId, 'message:new', {
        message: populatedMessage,
        chatId: data.chatId,
        timestamp: new Date().toISOString(),
      });

      // Send acknowledgment to sender
      socket.emit('message:sent', {
        message: populatedMessage,
        chatId: data.chatId,
        timestamp: new Date().toISOString(),
      });

      console.log(`Message saved and sent to recipient ${data.recipientId}`);
    } catch (error) {
      console.error('Error handling send_message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  /**
   * Handle message_read event - update DB and emit to sender
   */
  socket.on('message_read', async (data: { messageId: string; senderId: string }) => {
    try {
      console.log(`User ${userId} marking message ${data.messageId} as read`);

      if (!data.messageId || !data.senderId) {
        socket.emit('error', { message: 'Missing required fields: messageId, senderId' });
        return;
      }

      if (!Types.ObjectId.isValid(data.messageId)) {
        socket.emit('error', { message: 'Invalid message ID' });
        return;
      }

      const message = await Message.findById(data.messageId);

      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Verify user is participant in the chat
      const chat = await Chat.findById(message.chatId);

      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      const isParticipant = chat.participants.some(
        (participantId) => participantId.toString() === userId
      );

      if (!isParticipant) {
        socket.emit('error', { message: 'You are not a participant in this chat' });
        return;
      }

      // Add user to readBy if not already there
      const userObjectId = new Types.ObjectId(userId);
      const alreadyRead = message.readBy?.some(
        (readByUserId) => readByUserId.toString() === userId
      );

      if (!alreadyRead) {
        await Message.findByIdAndUpdate(data.messageId, {
          $addToSet: { readBy: userObjectId }
        });
      }

      // Emit to sender if online
      socketService.emitToUser(data.senderId, 'message:read', {
        messageId: data.messageId,
        readBy: userId,
        timestamp: new Date().toISOString(),
      });

      console.log(`Message ${data.messageId} marked as read by ${userId}`);
    } catch (error) {
      console.error('Error handling message_read:', error);
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);

    // Remove user from connection map
    socketService.removeUserConnection(userId);

    // Emit offline status to all friends
    socketService.emitToFriends(userId, 'user:offline', {
      userId,
      timestamp: new Date().toISOString(),
    }).catch((error: unknown) => {
      console.error('Error emitting offline status:', error);
    });
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for user ${userId}:`, error);
  });
};

/**
 * Register all socket event handlers
 */
export const registerSocketHandlers = (io: Server, socketService: SocketService): void => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  // Handle connections
  io.on('connection', (socket: AuthenticatedSocket) => {
    handleConnection(socket, socketService);
  });

  console.log('Socket handlers registered successfully');
};


