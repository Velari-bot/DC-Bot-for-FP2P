/**
 * Data Writer
 * Handles saving records to disk
 */

import * as fs from 'fs-extra';
import { config } from './config';
import { FortniteRecord, DataStore, IngestionStats, DataSource } from './types';

export async function initializeStorage(): Promise<void> {
  await fs.ensureDir(config.dataDir);
  
  if (!await fs.pathExists(config.recordsFile)) {
    const initialStore: DataStore = {
      records: [],
      lastUpdate: new Date().toISOString(),
      stats: {
        totalRecords: 0,
        recordsBySource: {
          twitter: 0,
          epic: 0,
          'fortnite-api': 0,
          reddit: 0,
          news: 0,
          analytics: 0,
        },
        lastIngestion: new Date().toISOString(),
      },
    };
    await fs.writeJSON(config.recordsFile, initialStore, { spaces: 2 });
  }
}

export async function loadRecords(): Promise<FortniteRecord[]> {
  try {
    if (!await fs.pathExists(config.recordsFile)) {
      return [];
    }

    const store: DataStore = await fs.readJSON(config.recordsFile);
    return store.records || [];
  } catch (error) {
    console.error('Error loading records:', error);
    return [];
  }
}

export async function saveRecords(records: FortniteRecord[]): Promise<void> {
  try {
    const stats = calculateStats(records);
    
    const store: DataStore = {
      records,
      lastUpdate: new Date().toISOString(),
      stats,
    };

    await fs.writeJSON(config.recordsFile, store, { spaces: 2 });
    
    // Also save to latest.json for AI assistant
    await fs.writeJSON(config.latestFile, {
      records: records.slice(0, 100), // Latest 100 for quick access
      lastUpdate: store.lastUpdate,
      totalRecords: records.length,
    }, { spaces: 2 });

    console.log(`  💾 Saved ${records.length} records to disk`);
  } catch (error) {
    console.error('  ❌ Error saving records:', error);
    throw error;
  }
}

function calculateStats(records: FortniteRecord[]): IngestionStats {
  const stats: IngestionStats = {
    totalRecords: records.length,
    recordsBySource: {
      twitter: 0,
      epic: 0,
      'fortnite-api': 0,
      reddit: 0,
      news: 0,
      analytics: 0,
    },
    lastIngestion: new Date().toISOString(),
  };

  const dates: number[] = [];

  for (const record of records) {
    const source = record.source as DataSource;
    stats.recordsBySource[source] = (stats.recordsBySource[source] || 0) + 1;
    
    try {
      dates.push(new Date(record.created_at).getTime());
    } catch {
      // Ignore invalid dates
    }
  }

  if (dates.length > 0) {
    dates.sort((a, b) => a - b);
    stats.oldestRecord = new Date(dates[0]).toISOString();
    stats.newestRecord = new Date(dates[dates.length - 1]).toISOString();
  }

  return stats;
}

export async function logIngestion(results: any[]): Promise<void> {
  try {
    await fs.ensureFile(config.logging.logFile);
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalNew: results.reduce((sum, r) => sum + (r.newRecords || 0), 0),
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.appendFile(config.logging.logFile, logLine);
  } catch (error) {
    console.error('Error writing log:', error);
  }
}

