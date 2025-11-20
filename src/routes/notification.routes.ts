import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Notification ID
 *         userId:
 *           type: string
 *           description: ID of user who receives this notification
 *         type:
 *           type: string
 *           enum: [like, comment, friend_request, message]
 *           description: Type of notification
 *         message:
 *           type: string
 *           description: Notification message
 *         read:
 *           type: boolean
 *           description: Whether notification has been read
 *         relatedId:
 *           type: string
 *           description: ID of related entity (post, comment, etc.)
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
 *   name: Notifications
 *   description: Notification management endpoints
 */

/**
 * @swagger
 * /api/notifications/{userId}:
 *   get:
 *     summary: Get user notifications
 *     description: Retrieve all notifications for a specific user, sorted by most recent first. Requires authentication.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *             example:
 *               - _id: "507f1f77bcf86cd799439016"
 *                 userId: "507f191e810c19729de860ea"
 *                 type: "like"
 *                 message: "John Doe liked your post"
 *                 read: false
 *                 relatedId: "507f1f77bcf86cd799439011"
 *                 createdAt: "2025-11-20T10:00:00.000Z"
 *               - _id: "507f1f77bcf86cd799439017"
 *                 userId: "507f191e810c19729de860ea"
 *                 type: "comment"
 *                 message: "Jane commented on your post"
 *                 read: true
 *                 relatedId: "507f1f77bcf86cd799439011"
 *                 createdAt: "2025-11-20T09:50:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:userId', verifyToken, notificationController.listNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read. Requires authentication.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *             example:
 *               _id: "507f1f77bcf86cd799439016"
 *               userId: "507f191e810c19729de860ea"
 *               type: "like"
 *               message: "John Doe liked your post"
 *               read: true
 *               relatedId: "507f1f77bcf86cd799439011"
 *               createdAt: "2025-11-20T10:00:00.000Z"
 *               updatedAt: "2025-11-20T10:05:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Notification not found."
 */
router.patch('/:id/read', verifyToken, notificationController.markAsRead);

export default router;

