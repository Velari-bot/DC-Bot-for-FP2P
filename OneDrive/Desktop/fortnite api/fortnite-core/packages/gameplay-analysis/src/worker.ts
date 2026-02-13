/**
 * Production worker for processing analysis jobs
 */

import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { processAnalysisJob, ProcessJobData } from './processor';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new Redis(REDIS_URL);

const worker = new Worker(
  'analysis',
  async (job) => {
    try {
      const data = job.data as ProcessJobData;
      console.log(`Processing analysis job ${data.jobId} for player ${data.playerId}`);
      
      await processAnalysisJob(data);
      await job.updateProgress(100);
      
      console.log(`Completed analysis job ${data.jobId}`);
    } catch (err) {
      console.error('Worker error:', err);
      throw err;
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

export default worker;


