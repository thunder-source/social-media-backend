import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;
const isRedisEnabled = process.env.REDIS_ENABLED === 'true';

let connection: IORedis | undefined;

if (isRedisEnabled && redisUrl) {
  connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
  
  connection.on('error', (err) => {
    console.error('Redis Queue Connection Error:', err);
  });
} else {
    console.warn('Redis is disabled or URL is missing. Queues will not work.');
}

export const videoQueue = connection ? new Queue('video-processing', { connection }) : null;

export { connection };
