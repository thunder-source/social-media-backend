import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;
const isRedisEnabled = process.env.REDIS_ENABLED === 'true';

let redisClient: ReturnType<typeof createClient> | null = null;

if (isRedisEnabled && redisUrl) {
  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.log('Redis Client Connected'));

  redisClient.connect().catch(console.error);
} else if (isRedisEnabled && !redisUrl) {
  console.warn('REDIS_ENABLED is true but REDIS_URL is missing. Redis will not be used.');
}

export { redisClient, isRedisEnabled };
