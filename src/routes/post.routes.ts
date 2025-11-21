import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { upload, validateFileSize } from '../middlewares/upload.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Post ID
 *         userId:
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
 *           description: Post content
 *         mediaUrl:
 *           type: string
 *           description: URL of uploaded media
 *         mediaType:
 *           type: string
 *           enum: [image, video, null]
 *           description: Type of media
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who liked the post
 *         comments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   photo:
 *                     type: string
 *               text:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *         likesCount:
 *           type: number
 *           description: Number of likes
 *         commentsCount:
 *           type: number
 *           description: Number of comments
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     PaginatedPosts:
 *       type: object
 *       properties:
 *         posts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Post'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *             limit:
 *               type: number
 *             total:
 *               type: number
 *             pages:
 *               type: number
 *     
 *     CreatePostRequest:
 *       type: object
 *       required:
 *         - text
 *       properties:
 *         text:
 *           type: string
 *           description: Post content
 *         file:
 *           type: string
 *           format: binary
 *           description: Image or video file (max 10MB for images, 100MB for videos)
 *     
 *     UpdatePostRequest:
 *       type: object
 *       properties:
 *         text:
 *           type: string
 *           description: Updated post content
 *         file:
 *           type: string
 *           format: binary
 *           description: New image or video file
 *     
 *     CommentRequest:
 *       type: object
 *       required:
 *         - text
 *       properties:
 *         text:
 *           type: string
 *           description: Comment text
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 */

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Posts management API
 */

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     description: Create a new post with optional image or video upload. Requires authentication.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostRequest'
 *           examples:
 *             textOnly:
 *               summary: Text-only post
 *               value:
 *                 text: "This is my first post!"
 *             withImage:
 *               summary: Post with image
 *               value:
 *                 text: "Check out this photo!"
 *                 file: "[binary file data]"
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid input or file size exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingText:
 *                 value:
 *                   message: "Post text is required."
 *               invalidFileType:
 *                 value:
 *                   message: "Invalid file type. Only jpg, jpeg, png, gif, mp4, mov, and avi files are allowed."
 *               fileSizeExceeded:
 *                 value:
 *                   message: "Video file size exceeds the limit of 100MB"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.post('/', verifyToken, upload.single('file'), validateFileSize, postController.createPost);

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     description: Retrieve a paginated list of all posts with user information populated
 *     tags: [Posts]
 *     parameters:
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
 *           default: 10
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: List of posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedPosts'
 *             example:
 *               posts:
 *                 - _id: "507f1f77bcf86cd799439011"
 *                   userId:
 *                     _id: "507f191e810c19729de860ea"
 *                     name: "John Doe"
 *                     email: "john@example.com"
 *                     photo: "https://example.com/photo.jpg"
 *                   text: "My first post!"
 *                   mediaUrl: "https://storage.googleapis.com/.../posts/image.jpg"
 *                   mediaType: "image"
 *                   likes: ["507f191e810c19729de860eb"]
 *                   comments: []
 *                   likesCount: 1
 *                   commentsCount: 0
 *                   createdAt: "2025-11-20T10:00:00.000Z"
 *                   updatedAt: "2025-11-20T10:00:00.000Z"
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 total: 45
 *                 pages: 5
 */
router.get('/', postController.getAllPosts);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     description: Retrieve a single post with full user and comments information
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid post ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Invalid post ID."
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Post not found."
 */
router.get('/:id', postController.getPostById);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post
 *     description: Update post text and/or media. Only the post owner can update. Requires authentication.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePostRequest'
 *           examples:
 *             updateText:
 *               summary: Update text only
 *               value:
 *                 text: "Updated post content"
 *             updateMedia:
 *               summary: Update text and media
 *               value:
 *                 text: "Updated with new image"
 *                 file: "[binary file data]"
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid post ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Not the post owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "You are not authorized to update this post."
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', verifyToken, upload.single('file'), validateFileSize, postController.updatePost);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     description: Delete a post and its associated media from Firebase Storage. Only the post owner can delete. Requires authentication.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Post deleted successfully."
 *       400:
 *         description: Invalid post ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Not the post owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "You are not authorized to delete this post."
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', verifyToken, postController.deletePost);

/**
 * @swagger
 * /api/posts/{id}/like:
 *   post:
 *     summary: Like or unlike a post
 *     description: Toggle like status on a post. If already liked, the like will be removed. If not liked, a like will be added. Requires authentication.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post like status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid post ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/like', verifyToken, postController.likePost);

/**
 * @swagger
 * /api/posts/{id}/comment:
 *   post:
 *     summary: Add a comment to a post
 *     description: Add a new comment to a post. Requires authentication.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentRequest'
 *           example:
 *             text: "Great post!"
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidPostId:
 *                 value:
 *                   message: "Invalid post ID."
 *               missingText:
 *                 value:
 *                   message: "Comment text is required."
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/comment', verifyToken, postController.addComment);

export default router;
