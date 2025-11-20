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
 *           type: string
 *           description: ID of user sending the request
 *         to:
 *           type: string
 *           description: ID of user receiving the request
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
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   name: Friends
 *   description: Friend request management
 */

/**
 * @swagger
 * /api/friends:
 *   post:
 *     summary: Send friend request
 *     description: Send a friend request to another user. Requires authentication.
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
 *               - from
 *               - to
 *             properties:
 *               from:
 *                 type: string
 *                 description: Sender user ID
 *               to:
 *                 type: string
 *                 description: Recipient user ID
 *               triggeredFromPostId:
 *                 type: string
 *                 description: Optional post ID that triggered this request
 *           example:
 *             from: "507f191e810c19729de860ea"
 *             to: "507f191e810c19729de860eb"
 *             triggeredFromPostId: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Friend request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FriendRequest'
 *             example:
 *               _id: "507f1f77bcf86cd799439012"
 *               from: "507f191e810c19729de860ea"
 *               to: "507f191e810c19729de860eb"
 *               status: "pending"
 *               triggeredFromPostId: "507f1f77bcf86cd799439011"
 *               createdAt: "2025-11-20T10:00:00.000Z"
 *               updatedAt: "2025-11-20T10:00:00.000Z"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Sender and recipient are required."
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', verifyToken, friendController.sendRequest);

/**
 * @swagger
 * /api/friends/{id}:
 *   patch:
 *     summary: Respond to friend request
 *     description: Accept or reject a friend request. Requires authentication.
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Friend request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 description: New status for the friend request
 *           example:
 *             status: "accepted"
 *     responses:
 *       200:
 *         description: Friend request updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FriendRequest'
 *             example:
 *               _id: "507f1f77bcf86cd799439012"
 *               from: "507f191e810c19729de860ea"
 *               to: "507f191e810c19729de860eb"
 *               status: "accepted"
 *               createdAt: "2025-11-20T10:00:00.000Z"
 *               updatedAt: "2025-11-20T10:05:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Friend request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Friend request not found."
 */
router.patch('/:id', verifyToken, friendController.respondRequest);

export default router;

