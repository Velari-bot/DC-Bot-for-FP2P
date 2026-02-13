import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { Pool } from 'pg';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import * as path from 'path';
import 'dotenv/config';

// Initialize Redis connection
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://redis:6379');

// Initialize Postgres connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://pathgen:pathgenpass@postgres:5432/pathgen',
});

// Parser service URL
const PARSER_URL = process.env.PARSER_URL || 'http://parser:5000';

// Results directory
const RESULTS_DIR = process.env.RESULTS_DIR || '/app/results';
fs.mkdir(RESULTS_DIR, { recursive: true }).catch(console.error);

// Heuristics (placeholder - implement actual logic)
function runHeuristics(parsedData: any): any {
  const heuristics = {
    fight_detected: false,
    no_heal_detected: false,
    storm_damage_detected: false,
  };

  // TODO: Implement actual heuristic logic
  // Example checks:
  // - fight_detected: Check for multiple players in close proximity with weapon fire
  // - no_heal_detected: Check for extended periods without healing
  // - storm_damage_detected: Check for storm damage events

  return heuristics;
}

// Generate heatmap data (placeholder)
function generateHeatmap(timeline: any[]): any {
  // TODO: Implement actual heatmap generation
  // Group position data by regions, calculate density, etc.
  
  return {
    regions: [],
    density: [],
  };
}

// Process job
async function processJob(job: any) {
  const { filePath, playerId, originalFilename } = job.data;
  
  console.log(`Processing job ${job.id} for file: ${originalFilename || filePath}`);
  
  try {
    // Update job status to processing
    await pool.query(
      'UPDATE analysis_jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE job_id = $2',
      ['processing', job.id]
    );

    // Read file and send to parser
    const formData = new FormData();
    formData.append('file', createReadStream(filePath), {
      filename: originalFilename || path.basename(filePath),
    });

    const parserResponse = await axios.post(`${PARSER_URL}/Parse/parse`, formData, {
      headers: formData.getHeaders(),
      timeout: 60000, // 60 second timeout
    });

    const parsedData = parserResponse.data;

    // Run heuristics
    const heuristics = runHeuristics(parsedData);
    parsedData.heuristics = heuristics;

    // Generate heatmap
    if (parsedData.timeline) {
      const heatmap = generateHeatmap(parsedData.timeline);
      parsedData.heatmap = heatmap;
    }

    // Save results to file
    const resultPath = path.join(RESULTS_DIR, `${job.id}.json`);
    await fs.writeFile(resultPath, JSON.stringify(parsedData, null, 2));

    // Update database with result
    await pool.query(
      'UPDATE analysis_jobs SET status = $1, result_path = $2, updated_at = CURRENT_TIMESTAMP WHERE job_id = $3',
      ['completed', resultPath, job.id]
    );

    console.log(`Job ${job.id} completed successfully. Result saved to: ${resultPath}`);

    return parsedData;
  } catch (error: any) {
    console.error(`Job ${job.id} failed:`, error);

    // Update database with error
    await pool.query(
      'UPDATE analysis_jobs SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP WHERE job_id = $3',
      ['failed', error.message || String(error), job.id]
    );

    throw error;
  }
}

// Create worker
const worker = new Worker(
  'analysis',
  async (job) => {
    return await processJob(job);
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // Per minute
    },
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} has been completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} has failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('Worker started and listening for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  await redisConnection.quit();
  await pool.end();
  process.exit(0);
});
