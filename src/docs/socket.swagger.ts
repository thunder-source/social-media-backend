/**
 * @swagger
 * tags:
 *   name: Socket.io Events
 *   description: Real-time WebSocket communication events
 */

/**
 * @swagger
 * /socket-docs:
 *   get:
 *     summary: Socket.io Real-time Events Documentation
 *     description: |
 *       # Socket.io Real-time Communication
 *       
 *       This API uses Socket.io for real-time bidirectional event-based communication.
 *       
 *       ## Connection
 *       
 *       Connect to the Socket.io server using the WebSocket protocol:
 *       
 *       ```javascript
 *       import { io } from 'socket.io-client';
 *       
 *       const socket = io('http://localhost:5000', {
 *         auth: {
 *           token: 'YOUR_JWT_TOKEN'
 *         }
 *       });
 *       ```
 *       
 *       ## Authentication
 *       
 *       Socket connections require JWT authentication. Pass your JWT token in the `auth.token` field when connecting.
 *       
 *       **Authentication failure will result in connection rejection.**
 *       
 *       ---
 *       
 *       ## Server-to-Client Events
 *       
 *       Events emitted by the server that clients can listen to.
 *       
 *       ### User Status Events
 *       
 *       #### `user:online`
 *       Emitted to all friends when a user comes online.
 *       
 *       **Payload:**
 *       ```json
 *       {
 *         "userId": "507f1f77bcf86cd799439011",
 *         "timestamp": "2025-11-20T10:00:00.000Z"
 *       }
 *       ```
 *       
 *       #### `user:offline`
 *       Emitted to all friends when a user goes offline.
 *       
 *       **Payload:**
 *       ```json
 *       {
 *         "userId": "507f1f77bcf86cd799439011",
 *         "timestamp": "2025-11-20T10:00:00.000Z"
 *       }
 *       ```
 *       
 *       #### `friends:online`
 *       Emitted in response to `get_online_friends` event.
 *       
 *       **Payload:**
 *       ```json
 *       {
 *         "onlineFriends": [
 *           "507f1f77bcf86cd799439011",
 *           "507f1f77bcf86cd799439012"
 *         ],
 *         "timestamp": "2025-11-20T10:00:00.000Z"
 *       }
 *       ```
 *       
 *       ### Friend Request Events
 *       
 *       #### `friend:request:received`
 *       Emitted to recipient when they receive a friend request.
 *       
 *       **Payload:**
 *       ```json
 *       {
 *         "request": {
 *           "_id": "507f1f77bcf86cd799439012",
 *           "from": {
 *             "_id": "507f191e810c19729de860ea",
 *             "name": "John Doe",
 *             "email": "john@example.com",
 *             "photo": "https://example.com/photo.jpg"
 *           },
 *           "status": "pending"
 *         },
 *         "message": "John Doe sent you a friend request"
 *       }
 *       ```
 *       
 *       #### `friend:request:accepted`
 *       Emitted to requester when their friend request is accepted.
 *       
 *       **Payload:**
 *       ```json
 *       {
 *         "request": { "..." },
 *         "chatId": "507f1f77bcf86cd799439013",
 *         "message": "Jane Smith accepted your friend request"
 *       }
 *       ```
 *       
 *       #### `friend:request:rejected`
 *       Emitted to requester when their friend request is rejected.
 *       
 *       **Payload:**
 *       ```json
 *       {
 *         "request": { "..." },
 *         "message": "Jane Smith rejected your friend request"
 *       }
 *       ```
 *       
 *       #### `friend:removed`
 *       Emitted when someone removes you from their friends.
 *       
 *       **Payload:**
 *       ```json
 *       {
 *         "userId": "507f191e810c19729de860ea",
 *         "message": "John Doe removed you from their friends"
 *       }
 *       ```
 *       
 *       ### Messaging Events
 *       
 *       #### `message:new`
 *       Emitted to recipient when they receive a new message.
 *       
 *       **Payload:**
 *       ```json
 *       {
 *         "message": {
 *           "_id": "507f1f77bcf86cd799439014",
 *           "content": "Hello!",
 *           "sender": "507f191e810c19729de860ea",
 *           "chatId": "507f1f77bcf86cd799439013"
 *         },
 *         "senderId": "507f191e810c19729de860ea",
 *         "timestamp": "2025-11-20T10:00:00.000Z"
 *       }
 *       ```
 *       
 *       #### `message:read`
 *       Emitted to sender when their message is read.
 *       
 *       **Payload:**
 *       ```json
 *       {
 *         "messageId": "507f1f77bcf86cd799439014",
 *         "readBy": "507f191e810c19729de860eb",
 *         "timestamp": "2025-11-20T10:00:00.000Z"
 *       }
 *       ```
 *       
 *       ### Typing Indicators
 *       
 *       #### `typing:start`
 *       Emitted to chat partner when user starts typing.
 *       
 *       **Payload:**
 *       ```json
 *       {
 *         "chatId": "507f1f77bcf86cd799439013",
 *         "userId": "507f191e810c19729de860ea",
 *         "timestamp": "2025-11-20T10:00:00.000Z"
 *       }
 *       ```
 *       
 *       #### `typing:stop`
 *       Emitted to chat partner when user stops typing.
 *       
 *       **Payload:**
 *       ```json
 *       {
 *         "chatId": "507f1f77bcf86cd799439013",
 *         "userId": "507f191e810c19729de860ea",
 *         "timestamp": "2025-11-20T10:00:00.000Z"
 *       }
 *       ```
 *       
 *       ---
 *       
 *       ## Client-to-Server Events
 *       
 *       Events that clients can emit to the server.
 *       
 *       ### Typing Indicators
 *       
 *       #### `typing:start`
 *       Notify server that user started typing in a chat.
 *       
 *       **Emit:**
 *       ```javascript
 *       socket.emit('typing:start', {
 *         chatId: '507f1f77bcf86cd799439013',
 *         recipientId: '507f191e810c19729de860eb'
 *       });
 *       ```
 *       
 *       **Parameters:**
 *       - `chatId` (string, required): ID of the chat
 *       - `recipientId` (string, required): ID of the recipient user
 *       
 *       #### `typing:stop`
 *       Notify server that user stopped typing in a chat.
 *       
 *       **Emit:**
 *       ```javascript
 *       socket.emit('typing:stop', {
 *         chatId: '507f1f77bcf86cd799439013',
 *         recipientId: '507f191e810c19729de860eb'
 *       });
 *       ```
 *       
 *       **Parameters:**
 *       - `chatId` (string, required): ID of the chat
 *       - `recipientId` (string, required): ID of the recipient user
 *       
 *       ### Friend Events
 *       
 *       #### `get_online_friends`
 *       Request list of currently online friends.
 *       
 *       **Emit:**
 *       ```javascript
 *       socket.emit('get_online_friends');
 *       ```
 *       
 *       ### Messaging Events
 *       
 *       #### `message:new`
 *       Send a new message to a user (optional, can also use REST API).
 *       
 *       **Emit:**
 *       ```javascript
 *       socket.emit('message:new', {
 *         recipientId: '507f191e810c19729de860eb',
 *         message: {
 *           content: 'Hello!',
 *           chatId: '507f1f77bcf86cd799439013'
 *         }
 *       });
 *       ```
 *       
 *       **Parameters:**
 *       - `recipientId` (string, required): ID of the recipient user
 *       - `message` (object, required): Message object with content and chatId
 *       
 *       #### `message:read`
 *       Mark a message as read.
 *       
 *       **Emit:**
 *       ```javascript
 *       socket.emit('message:read', {
 *         messageId: '507f1f77bcf86cd799439014',
 *         senderId: '507f191e810c19729de860ea'
 *       });
 *       ```
 *       
 *       **Parameters:**
 *       - `messageId` (string, required): ID of the message
 *       - `senderId` (string, required): ID of the sender user
 *       
 *       ---
 *       
 *       ## Event Listeners Example
 *       
 *       ```javascript
 *       // Listen for online status
 *       socket.on('user:online', ({ userId, timestamp }) => {
 *         console.log(`User ${userId} is online`);
 *       });
 *       
 *       // Listen for new messages
 *       socket.on('message:new', ({ message, senderId }) => {
 *         console.log(`New message from ${senderId}:`, message);
 *       });
 *       
 *       // Listen for typing indicators
 *       socket.on('typing:start', ({ chatId, userId }) => {
 *         console.log(`User ${userId} is typing in chat ${chatId}`);
 *       });
 *       
 *       // Listen for friend requests
 *       socket.on('friend:request:received', ({ request, message }) => {
 *         console.log(message);
 *       });
 *       ```
 *       
 *       ## Connection Lifecycle
 *       
 *       ```javascript
 *       // Connection established
 *       socket.on('connect', () => {
 *         console.log('Connected to server');
 *       });
 *       
 *       // Connection error
 *       socket.on('connect_error', (error) => {
 *         console.error('Connection error:', error.message);
 *       });
 *       
 *       // Disconnection
 *       socket.on('disconnect', (reason) => {
 *         console.log('Disconnected:', reason);
 *       });
 *       ```
 *       
 *       ## Error Handling
 *       
 *       - **Authentication Failed**: Connection will be rejected with error message
 *       - **Invalid Token**: Connection will be rejected
 *       - **Missing Token**: Connection will be rejected
 *       
 *       ## Best Practices
 *       
 *       1. **Reconnection**: Implement automatic reconnection logic
 *       2. **Token Refresh**: Update socket auth token when JWT is refreshed
 *       3. **Error Handling**: Always handle connection errors
 *       4. **Cleanup**: Disconnect socket when component unmounts
 *       5. **Typing Debounce**: Debounce typing indicators to avoid spam
 *       
 *     tags: [Socket.io Events]
 *     responses:
 *       200:
 *         description: Socket.io documentation
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
