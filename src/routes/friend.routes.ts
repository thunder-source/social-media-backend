import { Router } from 'express';
import { friendController } from '../controllers/friend.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FriendRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Friend request ID
 *         from:
 *           type: object
 *           description: User who sent the request
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             photo:
 *               type: string
 *         to:
 *           type: object
 *           description: User who received the request
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             photo:
 *               type: string
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *           description: Status of the friend request
 *         triggeredFromPostId:
 *           type: string
 *           description: Optional post ID that triggered the request
 *         createdAt:
 *           type: string
 *           format: date-time
 *     Friend:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         photo:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Friends
 *   description: Friend request and friendship management
 */

/**
 * @swagger
 * /api/friends/request:
 *   post:
 *     summary: Send friend request
 *     description: Send a friend request to another user. Automatically checks if users are already friends or if a request already exists. Emits socket event to recipient.
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toUserId
 *             properties:
 *               toUserId:
 *                 type: string
 *                 description: ID of the user to send friend request to
 *               triggeredFromPostId:
 *                 type: string
 *                 description: Optional post ID that triggered this request (e.g., from chat icon on post)
 *           example:
 *             toUserId: "507f191e810c19729de860eb"
 *             triggeredFromPostId: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Friend request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 request:
 *                   $ref: '#/components/schemas/FriendRequest'
 *       400:
 *         description: Bad request (already friends, request exists, invalid data)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/request', verifyToken, friendController.sendFriendRequest);

/**
 * @swagger
 * /api/friends/accept/{requestId}:
 *   post:
 *     summary: Accept friend request
 *     description: Accept a pending friend request. Updates both users' friends arrays and creates a chat room. Emits socket event to requester.
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the friend request to accept
 *     responses:
 *       200:
 *         description: Friend request accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 request:
 *                   $ref: '#/components/schemas/FriendRequest'
 *                 chatId:
 *                   type: string
 *                   description: ID of the created/existing chat room
 *       400:
 *         description: Request already processed or invalid request ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to accept this request
 *       404:
 *         description: Request not found
 */
router.post('/accept/:requestId', verifyToken, friendController.acceptFriendRequest);

/**
 * @swagger
 * /api/friends/reject/{requestId}:
 *   post:
 *     summary: Reject friend request
 *     description: Reject a pending friend request. Emits socket event to requester.
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the friend request to reject
 *     responses:
 *       200:
 *         description: Friend request rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 request:
 *                   $ref: '#/components/schemas/FriendRequest'
 *       400:
 *         description: Request already processed or invalid request ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to reject this request
 *       404:
 *         description: Request not found
 */
router.post('/reject/:requestId', verifyToken, friendController.rejectFriendRequest);

/**
 * @swagger
 * /api/friends/{friendId}:
 *   delete:
 *     summary: Unfriend a user
 *     description: Remove a friend connection. Updates both users' friends arrays. Emits socket event to unfriended user.
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the friend to remove
 *     responses:
 *       200:
 *         description: Friend removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Not friends with this user or invalid friend ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete('/:friendId', verifyToken, friendController.unfriend);

/**
 * @swagger
 * /api/friends:
 *   get:
 *     summary: Get friends list
 *     description: Get the authenticated user's friends list with user details
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Friends list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friends:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Friend'
 *                 count:
 *                   type: integer
 *                   description: Total number of friends
 *             example:
 *               friends:
 *                 - _id: "507f191e810c19729de860ea"
 *                   name: "John Doe"
 *                   email: "john@example.com"
 *                   photo: "https://example.com/photo.jpg"
 *               count: 1
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/', verifyToken, friendController.getFriends);

/**
 * @swagger
 * /api/friends/requests:
 *   get:
 *     summary: Get pending friend requests
 *     description: Get all pending friend requests received by the authenticated user, ordered by most recent
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FriendRequest'
 *                 count:
 *                   type: integer
 *                   description: Total number of pending requests
 *             example:
 *               requests:
 *                 - _id: "507f1f77bcf86cd799439012"
 *                   from:
 *                     _id: "507f191e810c19729de860ea"
 *                     name: "John Doe"
 *                     email: "john@example.com"
 *                     photo: "https://example.com/photo.jpg"
 *                   to:
 *                     _id: "507f191e810c19729de860eb"
 *                     name: "Jane Smith"
 *                     email: "jane@example.com"
 *                   status: "pending"
 *                   createdAt: "2025-11-20T10:00:00.000Z"
 *               count: 1
 *       401:
 *         description: Unauthorized
 */
router.get('/requests', verifyToken, friendController.getPendingRequests);

export default router;

