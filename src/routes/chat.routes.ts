import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Chat:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Chat ID
 *         participants:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               photo:
 *                 type: string
 *         lastMessage:
 *           type: object
 *           $ref: '#/components/schemas/Message'
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     Message:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Message ID
 *         chatId:
 *           type: string
 *           description: Chat ID this message belongs to
 *         senderId:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             photo:
 *               type: string
 *         text:
 *           type: string
 *           description: Message content
 *         readBy:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who have read the message
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: Chat and messaging endpoints
 */

/**
 * @swagger
 * /api/chats:
 *   post:
 *     summary: Create or get existing chat
 *     description: Create a new chat between two users or return existing chat. Requires authentication.
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId1
 *               - userId2
 *             properties:
 *               userId1:
 *                 type: string
 *                 description: First user ID
 *               userId2:
 *                 type: string
 *                 description: Second user ID
 *           example:
 *             userId1: "507f191e810c19729de860ea"
 *             userId2: "507f191e810c19729de860eb"
 *     responses:
 *       200:
 *         description: Chat retrieved or created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User not a participant
 */
router.post('/', verifyToken, chatController.createOrGetChat);

/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: Get user's chats
 *     description: Get all chats for the authenticated user with last message and participant details. Requires authentication.
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat'
 *       401:
 *         description: Unauthorized
 */
router.get('/', verifyToken, chatController.getChats);

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   get:
 *     summary: Get chat messages
 *     description: Retrieve paginated messages from a specific chat. Requires authentication and user must be participant.
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Invalid chat ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a participant
 *       404:
 *         description: Chat not found
 */
router.get('/:chatId/messages', verifyToken, chatController.getChatMessages);

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   post:
 *     summary: Send a message
 *     description: Send a new message in a chat. Requires authentication and user must be participant.
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Message text
 *           example:
 *             text: "Hello, how are you?"
 *     responses:
 *       201:
 *         description: Message created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a participant
 *       404:
 *         description: Chat not found
 */
router.post('/:chatId/messages', verifyToken, chatController.sendMessage);

/**
 * @swagger
 * /api/messages/{messageId}/read:
 *   put:
 *     summary: Mark message as read
 *     description: Mark a message as read by the authenticated user. Requires authentication and user must be chat participant.
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid message ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a participant
 *       404:
 *         description: Message or chat not found
 */
router.put('/:messageId/read', verifyToken, chatController.markAsRead);

export default router;

