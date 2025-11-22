import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check server health status
 *     description: Returns comprehensive server health information including database status, memory usage, uptime, and system details
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                 server:
 *                   type: object
 *                   properties:
 *                     nodeVersion:
 *                       type: string
 *                     processId:
 *                       type: number
 *                     platform:
 *                       type: string
 *                     architecture:
 *                       type: string
 *                 memory:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: string
 *                     free:
 *                       type: string
 *                     used:
 *                       type: string
 *                     heapUsed:
 *                       type: string
 *                     heapTotal:
 *                       type: string
 *                     external:
 *                       type: string
 *                     rss:
 *                       type: string
 *                 cpu:
 *                   type: object
 *                   properties:
 *                     model:
 *                       type: string
 *                     cores:
 *                       type: number
 *                     loadAverage:
 *                       type: array
 *                       items:
 *                         type: number
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [connected, disconnected, connecting, disconnecting, uninitialized]
 *                     host:
 *                       type: string
 *                     name:
 *                       type: string
 *       503:
 *         description: Server is unhealthy (database not connected)
 */
router.get('/', healthController.healthCheck);

export default router;
