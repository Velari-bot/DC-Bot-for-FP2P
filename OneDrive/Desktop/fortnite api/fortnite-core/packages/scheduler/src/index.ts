/**
 * Scheduler
 * Schedules Fortnite data updates
 */

import * as cron from 'node-cron';
import { fetchCMSData } from '@fortnite-core/data-ingestion';
import { fetchEventsData } from '@fortnite-core/data-ingestion';
import { downloadAllManifests } from '@fortnite-core/data-ingestion';
import { parseManifests } from '@fortnite-core/manifest-parser';
import { extractMapsFromPaks, buildCosmetics, buildWeapons, buildMap } from '@fortnite-core/pak-parser';
import { getLatestVersion, loadJSON } from '@fortnite-core/database';
import * as fs from 'fs-extra';
import * as path from 'path';

interface JobResult {
  success: boolean;
  version?: string;
  message: string;
  timestamp: string;
}

const SCHEDULER_VERSION = '1.0.0';

const LOG_DIR = path.join(process.cwd(), 'data', 'database', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'scheduler.log');

/**
 * Ensure log directory exists
 */
async function ensureLogDir(): Promise<void> {
  await fs.ensureDir(LOG_DIR);
}

/**
 * Log to file
 */
async function logToFile(message: string): Promise<void> {
  await ensureLogDir();
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  await fs.appendFile(LOG_FILE, logMessage);
}

/**
 * Log job result
 */
function logJobResult(jobName: string, result: JobResult): void {
  const status = result.success ? '✓' : '✗';
  const message = `[${status}] ${jobName} - ${result.message}`;
  console.log(message);
  
  if (result.version) {
    console.log(`   Version: ${result.version}`);
  }
  
  // Also log to file
  logToFile(message);
  if (result.version) {
    logToFile(`   Version: ${result.version}`);
  }
}

/**
 * CMS & Events Fetch Job - Every 6 hours
 */
async function runCMSFetch(): Promise<JobResult> {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('Starting CMS & Events fetch job...');
    logToFile('Starting CMS & Events fetch job...');
    
    // Fetch CMS data
    await fetchCMSData();
    console.log('CMS data fetched');
    logToFile('CMS data fetched');
    
    // Fetch Events data
    await fetchEventsData();
    console.log('Events data fetched');
    logToFile('Events data fetched');
    
    const version = await getLatestVersion();
    
    const result: JobResult = {
      success: true,
      version: version || 'unknown',
      message: 'CMS & Events data updated successfully',
      timestamp
    };
    
    logJobResult('CMS & Events Fetch', result);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const result: JobResult = {
      success: false,
      message: `CMS & Events fetch failed: ${errorMessage}`,
      timestamp
    };
    
    logJobResult('CMS & Events Fetch', result);
    return result;
  }
}

/**
 * Manifest & PAK Updates Job - Daily
 */
async function runManifestPakUpdates(): Promise<JobResult> {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('Starting manifest, parser, PAK & builders job...');
    logToFile('Starting manifest, parser, PAK & builders job...');
    
    // Step 1: Download manifests
    console.log('Downloading manifests...');
    logToFile('Downloading manifests...');
    const manifestPaths = await downloadAllManifests();
    console.log(`Downloaded ${manifestPaths.length} manifests`);
    logToFile(`Downloaded ${manifestPaths.length} manifests`);
    
    // Step 2: Parse manifests
    console.log('Parsing manifests...');
    logToFile('Parsing manifests...');
    
    // Extract manifest URLs from downloaded files
    const manifestUrls: string[] = [];
    const cmsData = await loadJSON('raw/cms.json');
    const distributionData = await loadJSON('raw/distribution.json');
    
    function extractUrls(obj: any): void {
      if (typeof obj === 'string' && obj.endsWith('.manifest')) {
        manifestUrls.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(item => extractUrls(item));
      } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(value => extractUrls(value));
      }
    }
    
    if (cmsData) extractUrls(cmsData);
    if (distributionData) extractUrls(distributionData);
    
    let parseResults: any[] = [];
    if (manifestUrls.length > 0) {
      parseResults = await parseManifests(manifestUrls.slice(0, 10)); // Limit to first 10
      console.log(`Parsed ${parseResults.length} manifests`);
      logToFile(`Parsed ${parseResults.length} manifests`);
    }
    
    // Step 3: Extract PAK data
    console.log('Extracting PAK data...');
    logToFile('Extracting PAK data...');
    
    const pakUrls: string[] = [];
    for (const result of parseResults) {
      if (result.data?.pakFiles) {
        pakUrls.push(...result.data.pakFiles);
      }
    }
    
    let mapResults: any[] = [];
    if (pakUrls.length > 0) {
      console.log(`Extracting maps from ${pakUrls.length} PAK files...`);
      logToFile(`Extracting maps from ${pakUrls.length} PAK files...`);
      mapResults = await extractMapsFromPaks(pakUrls.slice(0, 5)); // Limit to first 5
      console.log(`Extracted ${mapResults.length} maps`);
      logToFile(`Extracted ${mapResults.length} maps`);
    }
    
    // Step 4: Run builders
    console.log('Running builders...');
    logToFile('Running builders...');
    
    console.log('Building cosmetics...');
    logToFile('Building cosmetics...');
    await buildCosmetics();
    console.log('Cosmetics built');
    logToFile('Cosmetics built');
    
    console.log('Building weapons...');
    logToFile('Building weapons...');
    await buildWeapons();
    console.log('Weapons built');
    logToFile('Weapons built');
    
    console.log('Building map...');
    logToFile('Building map...');
    await buildMap();
    console.log('Map built');
    logToFile('Map built');
    
    const version = await getLatestVersion();
    
    const result: JobResult = {
      success: true,
      version: version || 'unknown',
      message: `Updated ${manifestUrls.length} manifests, ${pakUrls.length} PAK files, and ran all builders`,
      timestamp
    };
    
    logJobResult('Manifest & PAK Updates', result);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const result: JobResult = {
      success: false,
      message: `Manifest & PAK updates failed: ${errorMessage}`,
      timestamp
    };
    
    logJobResult('Manifest & PAK Updates', result);
    return result;
  }
}

/**
 * Replay Cleanup Job - Weekly
 */
async function runReplayCleanup(): Promise<JobResult> {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('Starting replay cleanup job...');
    
    const replaysDir = path.join(process.cwd(), 'data', 'replays');
    
    if (!await fs.pathExists(replaysDir)) {
      const result: JobResult = {
        success: true,
        message: 'No replays directory found',
        timestamp
      };
      logJobResult('Replay Cleanup', result);
      return result;
    }
    
    const files = await fs.readdir(replaysDir);
    const replayFiles = files.filter(f => f.endsWith('.json'));
    
    let deletedCount = 0;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const now = Date.now();
    
    for (const file of replayFiles) {
      const filePath = path.join(replaysDir, file);
      const stats = await fs.stat(filePath);
      const age = now - stats.mtime.getTime();
      
      if (age > maxAge) {
        await fs.remove(filePath);
        deletedCount++;
      }
    }
    
    const result: JobResult = {
      success: true,
      message: `Cleaned up ${deletedCount} old replay files`,
      timestamp
    };
    
    logJobResult('Replay Cleanup', result);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const result: JobResult = {
      success: false,
      message: `Replay cleanup failed: ${errorMessage}`,
      timestamp
    };
    
    logJobResult('Replay Cleanup', result);
    return result;
  }
}

/**
 * Initialize and start the scheduler
 */
export const startScheduler = (): void => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Fortnite Core Scheduler');
  console.log(`  Version: ${SCHEDULER_VERSION}`);
  console.log('═══════════════════════════════════════════════════');
  
  // Ensure log directory exists
  ensureLogDir();
  
  // CMS & Events Fetch - Every 6 hours (at minute 0 of every 6th hour)
  cron.schedule('0 */6 * * *', async () => {
    await runCMSFetch();
  });
  
  console.log('✓ Scheduled: CMS & Events Fetch (every 6 hours)');
  
  // Manifest & PAK Updates - Daily at midnight
  cron.schedule('0 0 * * *', async () => {
    await runManifestPakUpdates();
  });
  
  console.log('✓ Scheduled: Manifest, Parser, PAK & Builders (daily at midnight)');
  
  // Replay Cleanup - Weekly on Sunday at midnight
  cron.schedule('0 0 * * 0', async () => {
    await runReplayCleanup();
  });
  
  console.log('✓ Scheduled: Replay Cleanup (weekly on Sunday)');
  console.log('═══════════════════════════════════════════════════');
  console.log('Scheduler is running. Jobs will execute as scheduled.');
  console.log('═══════════════════════════════════════════════════');
  
  // Log scheduler start
  logToFile('Scheduler started');
};

/**
 * Run all jobs immediately (useful for testing)
 */
export const runAllJobs = async (): Promise<void> => {
  console.log('Running all jobs immediately...');
  await runCMSFetch();
  await runManifestPakUpdates();
  await runReplayCleanup();
};

/**
 * Get scheduler status
 */
export const getSchedulerStatus = (): {
  version: string;
  jobs: Array<{ name: string; schedule: string; description: string }>;
} => {
  return {
    version: SCHEDULER_VERSION,
    jobs: [
      {
        name: 'CMS & Events Fetch',
        schedule: '0 */6 * * *',
        description: 'Fetches CMS and Events data every 6 hours'
      },
      {
        name: 'Manifest & PAK Updates',
        schedule: '0 0 * * *',
        description: 'Downloads manifests, parses them, extracts PAK data, and runs all builders daily at midnight'
      },
      {
        name: 'Replay Cleanup',
        schedule: '0 0 * * 0',
        description: 'Cleans up old replay files weekly on Sunday'
      }
    ]
  };
};
