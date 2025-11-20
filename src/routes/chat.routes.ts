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
 *             type: string
 *           description: Array of user IDs in the chat (exactly 2)
 *         createdAt:
 *           type: string
 *           format: date-time
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
 *           type: string
 *           description: ID of the user who sent the message
 *         content:
 *           type: string
 *           description: Message content
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
 *     summary: Start a new chat
 *     description: Create a new chat between two users. Requires authentication.
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
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 2
 *                 maxItems: 2
 *                 description: Exactly two user IDs
 *           example:
 *             participants:
 *               - "507f191e810c19729de860ea"
 *               - "507f191e810c19729de860eb"
 *     responses:
 *       201:
 *         description: Chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *             example:
 *               _id: "507f1f77bcf86cd799439013"
 *               participants:
 *                 - "507f191e810c19729de860ea"
 *                 - "507f191e810c19729de860eb"
 *               createdAt: "2025-11-20T10:00:00.000Z"
 *               updatedAt: "2025-11-20T10:00:00.000Z"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Exactly two participants are required."
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', verifyToken, chatController.startChat);

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   get:
 *     summary: Get chat messages
 *     description: Retrieve all messages from a specific chat, sorted by creation time. Requires authentication.
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
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *             example:
 *               - _id: "507f1f77bcf86cd799439014"
 *                 chatId: "507f1f77bcf86cd799439013"
 *                 senderId: "507f191e810c19729de860ea"
 *                 content: "Hello!"
 *                 createdAt: "2025-11-20T10:00:00.000Z"
 *               - _id: "507f1f77bcf86cd799439015"
 *                 chatId: "507f1f77bcf86cd799439013"
 *                 senderId: "507f191e810c19729de860eb"
 *                 content: "Hi there!"
 *                 createdAt: "2025-11-20T10:01:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:chatId/messages', verifyToken, chatController.getChatMessages);

export default router;

