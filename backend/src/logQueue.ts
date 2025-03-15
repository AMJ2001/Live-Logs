import { Queue } from 'bullmq';
import { redis } from './redisClient';

export const logQueue = new Queue('log-processing-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});