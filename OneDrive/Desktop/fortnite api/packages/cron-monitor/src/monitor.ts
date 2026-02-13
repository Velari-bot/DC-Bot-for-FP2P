import cron from 'node-cron';
import axios from 'axios';
import { Pool } from 'pg';
import IORedis from 'ioredis';
import * as fs from 'fs/promises';
import * as path from 'path';
import 'dotenv/config';

const API_URL = process.env.API_URL || 'http://fastify-api:4000';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://pathgen:pathgenpass@postgres:5432/pathgen';
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
const CLEANUP_DAYS = parseInt(process.env.CLEANUP_DAYS || '30', 10);
const DATA_DIR = process.env.DATA_DIR || '/app/data';

// Initialize connections
const pool = new Pool({ connectionString: DATABASE_URL });
const redis = new IORedis(REDIS_URL);

// Service health check
async function checkServiceHealth(serviceName: string, url: string): Promise<boolean> {
  try {
    const response = await axios.get(`${url}/health`, { timeout: 5000 });
    return response.status === 200 && response.data.status === 'ok';
  } catch (error) {
    console.error(`Health check failed for ${serviceName}:`, error);
    return false;
  }
}

// Check all services
async function checkAllServices(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Running health checks...`);

  const services = [
    { name: 'Fastify API', url: API_URL },
    { name: 'Parser Service', url: 'http://parser:5000' },
  ];

  const results: { name: string; healthy: boolean }[] = [];

  for (const service of services) {
    const healthy = await checkServiceHealth(service.name, service.url);
    results.push({ name: service.name, healthy });

    if (!healthy) {
      console.error(`❌ ${service.name} is DOWN`);
    } else {
      console.log(`✅ ${service.name} is UP`);
    }
  }

  // Check Redis
  try {
    await redis.ping();
    results.push({ name: 'Redis', healthy: true });
    console.log('✅ Redis is UP');
  } catch (error) {
    results.push({ name: 'Redis', healthy: false });
    console.error('❌ Redis is DOWN');
  }

  // Check Postgres
  try {
    await pool.query('SELECT 1');
    results.push({ name: 'Postgres', healthy: true });
    console.log('✅ Postgres is UP');
  } catch (error) {
    results.push({ name: 'Postgres', healthy: false });
    console.error('❌ Postgres is DOWN');
  }

  // Send alert if any service is down
  const downServices = results.filter(r => !r.healthy);
  if (downServices.length > 0 && DISCORD_WEBHOOK_URL) {
    await sendDiscordAlert(downServices.map(s => s.name));
  }
}

// Send Discord webhook alert
async function sendDiscordAlert(services: string[]): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) return;

  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      content: `⚠️ **Health Check Alert**\n\nServices down:\n${services.map(s => `- ${s}`).join('\n')}`,
    });
  } catch (error) {
    console.error('Failed to send Discord alert:', error);
  }
}

// Cleanup old files
async function cleanupOldFiles(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Running cleanup (files older than ${CLEANUP_DAYS} days)...`);

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS);

    // Cleanup old jobs from database
    const result = await pool.query(
      `DELETE FROM analysis_jobs 
       WHERE status = 'completed' 
       AND updated_at < $1 
       RETURNING id, job_id, result_path`,
      [cutoffDate]
    );

    let deletedFiles = 0;
    for (const row of result.rows) {
      if (row.result_path) {
        try {
          await fs.unlink(row.result_path);
          deletedFiles++;
        } catch (error) {
          console.warn(`Failed to delete file: ${row.result_path}`, error);
        }
      }

      // Also try to delete uploaded replay file
      const uploadsDir = path.join(DATA_DIR, 'replays');
      try {
        const files = await fs.readdir(uploadsDir);
        for (const file of files) {
          const filePath = path.join(uploadsDir, file);
          const stats = await fs.stat(filePath);
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedFiles++;
          }
        }
      } catch (error) {
        // Directory might not exist or be empty
      }
    }

    console.log(`Cleanup complete: Deleted ${result.rows.length} jobs and ${deletedFiles} files`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Cleanup orphaned jobs (stuck in processing)
async function cleanupOrphanedJobs(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Cleaning up orphaned jobs...`);

  try {
    // Find jobs stuck in 'processing' for more than 1 hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const result = await pool.query(
      `UPDATE analysis_jobs 
       SET status = 'failed', 
           error_message = 'Job timed out (stuck in processing)',
           updated_at = CURRENT_TIMESTAMP
       WHERE status = 'processing' 
       AND updated_at < $1
       RETURNING job_id`,
      [oneHourAgo]
    );

    if (result.rows.length > 0) {
      console.log(`Cleaned up ${result.rows.length} orphaned jobs`);
    }
  } catch (error) {
    console.error('Orphaned job cleanup error:', error);
  }
}

// Main monitor function
async function runMonitor(): Promise<void> {
  console.log('Starting cron monitor...');

  // Health checks every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await checkAllServices();
  });

  // Cleanup old files every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    await cleanupOldFiles();
  });

  // Cleanup orphaned jobs every hour
  cron.schedule('0 * * * *', async () => {
    await cleanupOrphanedJobs();
  });

  // Run initial checks
  await checkAllServices();
  await cleanupOrphanedJobs();

  console.log('Cron monitor started. Health checks every 5 minutes, cleanup daily at 2 AM.');
}

// Start monitor
runMonitor().catch((error) => {
  console.error('Monitor startup error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing monitor...');
  await redis.quit();
  await pool.end();
  process.exit(0);
});
