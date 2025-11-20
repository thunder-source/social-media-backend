import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Socket.io Events Documentation
 * This endpoint provides information about real-time Socket.io events
 */
router.get('/socket-events', (_req: Request, res: Response) => {
  res.json({
    title: 'Socket.io Real-time Events Documentation',
    description: 'Real-time WebSocket communication events using Socket.io',
    
    connection: {
      url: process.env.SOCKET_URL || 'http://localhost:5000',
      authentication: 'JWT token required in auth.token field',
      example: `
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
      `.trim()
    },

    serverToClient: {
      description: 'Events emitted by the server',
      events: {
        'user:online': {
          description: 'Emitted to all friends when a user comes online',
          payload: {
            userId: 'string',
            timestamp: 'ISO 8601 date string'
          },
          example: {
            userId: '507f1f77bcf86cd799439011',
            timestamp: '2025-11-20T10:00:00.000Z'
          }
        },
        'user:offline': {
          description: 'Emitted to all friends when a user goes offline',
          payload: {
            userId: 'string',
            timestamp: 'ISO 8601 date string'
          }
        },
        'friend:request:received': {
          description: 'Emitted to recipient when they receive a friend request',
          payload: {
            request: 'FriendRequest object',
            message: 'string'
          },
          example: {
            request: {
              _id: '507f1f77bcf86cd799439012',
              from: {
                _id: '507f191e810c19729de860ea',
                name: 'John Doe',
                email: 'john@example.com',
                photo: 'https://example.com/photo.jpg'
              },
              status: 'pending'
            },
            message: 'John Doe sent you a friend request'
          }
        },
        'friend:request:accepted': {
          description: 'Emitted to requester when their friend request is accepted',
          payload: {
            request: 'FriendRequest object',
            chatId: 'string',
            message: 'string'
          }
        },
        'friend:request:rejected': {
          description: 'Emitted to requester when their friend request is rejected',
          payload: {
            request: 'FriendRequest object',
            message: 'string'
          }
        },
        'friend:removed': {
          description: 'Emitted when someone removes you from their friends',
          payload: {
            userId: 'string',
            message: 'string'
          }
        },
        'message:new': {
          description: 'Emitted to recipient when they receive a new message',
          payload: {
            message: 'Message object',
            senderId: 'string',
            timestamp: 'ISO 8601 date string'
          }
        },
        'message:read': {
          description: 'Emitted to sender when their message is read',
          payload: {
            messageId: 'string',
            readBy: 'string',
            timestamp: 'ISO 8601 date string'
          }
        },
        'typing:start': {
          description: 'Emitted to chat partner when user starts typing',
          payload: {
            chatId: 'string',
            userId: 'string',
            timestamp: 'ISO 8601 date string'
          }
        },
        'typing:stop': {
          description: 'Emitted to chat partner when user stops typing',
          payload: {
            chatId: 'string',
            userId: 'string',
            timestamp: 'ISO 8601 date string'
          }
        }
      }
    },

    clientToServer: {
      description: 'Events that clients can emit to the server',
      events: {
        'typing:start': {
          description: 'Notify server that user started typing in a chat',
          parameters: {
            chatId: 'string (required)',
            recipientId: 'string (required)'
          },
          example: `socket.emit('typing:start', { chatId: '507f...', recipientId: '507f...' })`
        },
        'typing:stop': {
          description: 'Notify server that user stopped typing in a chat',
          parameters: {
            chatId: 'string (required)',
            recipientId: 'string (required)'
          }
        },
        'message:new': {
          description: 'Send a new message to a user (optional, can also use REST API)',
          parameters: {
            recipientId: 'string (required)',
            message: 'object (required)'
          }
        },
        'message:read': {
          description: 'Mark a message as read',
          parameters: {
            messageId: 'string (required)',
            senderId: 'string (required)'
          }
        }
      }
    },

    exampleUsage: {
      listening: `
// Listen for online status
socket.on('user:online', ({ userId, timestamp }) => {
  console.log(\`User \${userId} is online\`);
});

// Listen for new messages
socket.on('message:new', ({ message, senderId }) => {
  console.log(\`New message from \${senderId}:\`, message);
});

// Listen for typing indicators
socket.on('typing:start', ({ chatId, userId }) => {
  console.log(\`User \${userId} is typing in chat \${chatId}\`);
});
      `.trim(),
      emitting: `
// Start typing
socket.emit('typing:start', {
  chatId: '507f1f77bcf86cd799439013',
  recipientId: '507f191e810c19729de860eb'
});

// Stop typing
socket.emit('typing:stop', {
  chatId: '507f1f77bcf86cd799439013',
  recipientId: '507f191e810c19729de860eb'
});
      `.trim()
    },

    errorHandling: {
      authenticationFailed: 'Connection will be rejected with error message',
      invalidToken: 'Connection will be rejected',
      missingToken: 'Connection will be rejected'
    },

    bestPractices: [
      'Implement automatic reconnection logic',
      'Update socket auth token when JWT is refreshed',
      'Always handle connection errors',
      'Disconnect socket when component unmounts',
      'Debounce typing indicators to avoid spam'
    ]
  });
});

export default router;
