import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import type { SocketService } from '../services/socket.service';

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
    const token = socket.handshake.auth?.token as string | undefined;

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

  // Handle new message event (for real-time delivery)
  socket.on('message:new', (data: { recipientId: string; message: any }) => {
    console.log(`User ${userId} sent message to ${data.recipientId}`);
    
    if (data.recipientId) {
      socketService.emitToUser(data.recipientId, 'message:new', {
        message: data.message,
        senderId: userId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Handle message read event
  socket.on('message:read', (data: { messageId: string; senderId: string }) => {
    console.log(`User ${userId} read message ${data.messageId}`);
    
    if (data.senderId) {
      socketService.emitToUser(data.senderId, 'message:read', {
        messageId: data.messageId,
        readBy: userId,
        timestamp: new Date().toISOString(),
      });
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

