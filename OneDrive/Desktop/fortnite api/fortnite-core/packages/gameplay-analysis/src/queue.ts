/**
 * Queue setup and local worker creation
 */

import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { processAnalysisJob } from './processor';
import { ProcessJobData } from './processor';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Track if we've already logged Redis status
let redisStatusLogged = false;

// Create Redis connection with all error suppression
const connection = new Redis(REDIS_URL, {
  retryStrategy: () => {
    // Never retry - Redis is optional
    return null;
  },
  enableReadyCheck: false,
  lazyConnect: true,
  // BullMQ requires maxRetriesPerRequest to be null
  maxRetriesPerRequest: null,
  // Don't try to connect automatically
  connectTimeout: 100,
  // Disable automatic reconnection
  autoResubscribe: false,
  autoResendUnfulfilledCommands: false,
  // Don't show connection errors
  showFriendlyErrorStack: false,
  // Disable all automatic connection attempts
  enableOfflineQueue: false
});

// Suppress ALL connection errors - Redis is optional
// Use once() to only handle the first error, then remove listener
connection.once('error', () => {
  if (!redisStatusLogged) {
    redisStatusLogged = true;
    console.log('ℹ️  Redis not available - using synchronous processing mode');
  }
  // Remove all error listeners after first error
  connection.removeAllListeners('error');
  connection.removeAllListeners('close');
  connection.removeAllListeners('end');
});

// Suppress close/end events
connection.on('close', () => {
  // Silent - don't log
});

connection.on('end', () => {
  // Silent - don't log
});

connection.on('connect', () => {
  if (!redisStatusLogged) {
    console.log('✅ Connected to Redis');
  }
  redisStatusLogged = false; // Reset on successful connection
});

// Don't try to connect - Redis is optional
// The connection will remain in 'end' state and won't attempt connections

// Export connection for status checks
export function getRedisConnection() {
  return connection;
}

// Create queue with error handling
// Delay queue creation to avoid immediate connection attempts
export let analysisQueue: Queue | null = null;

// Function to safely create queue (only if Redis is available)
function createQueueSafely(): Queue | null {
  if (analysisQueue) {
    return analysisQueue;
  }
  
  try {
    // Check if connection is ready before creating queue
    if (connection.status === 'ready' || connection.status === 'connecting') {
      analysisQueue = new Queue('analysis', { 
        connection,
        defaultJobOptions: {
          removeOnComplete: false,
          removeOnFail: false
        }
      });
      
      // Suppress any queue errors
      analysisQueue.on('error', () => {
        // Silent
      });
      
      return analysisQueue;
    }
  } catch (error) {
    // Queue creation failed - Redis not available
    // Return null, API will use synchronous processing
  }
  
  return null;
}

// Export getter function
export function getAnalysisQueue(): Queue | null {
  return createQueueSafely();
}

// For backward compatibility, create a dummy queue that won't be used
// The API will check if queue is null and use synchronous processing
analysisQueue = null;

/**
 * Create a local worker for development
 */
export function createLocalWorker(): Worker {
  return new Worker(
    'analysis',
    async (job) => {
      const data = job.data as ProcessJobData;
      await processAnalysisJob(data);
      await job.updateProgress(100);
    },
    { connection }
  );
}

