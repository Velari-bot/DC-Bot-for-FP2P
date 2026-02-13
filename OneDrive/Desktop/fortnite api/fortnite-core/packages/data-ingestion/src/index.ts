/**
 * Data Ingestion Orchestrator
 * Main entry point for multi-source data collection
 */

import * as cron from 'node-cron';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { config, validateConfig } from './config';
import { collectTwitterData } from './sources/twitter';
import { collectEpicData } from './sources/epic';
import { collectFortniteApiData } from './sources/fortnite-api';
import { collectRedditData } from './sources/reddit';
import { collectNewsData } from './sources/news';
import { deduplicateRecords, pruneRecords, normalizeRecords } from './normalizer';
import { initializeStorage, loadRecords, saveRecords, logIngestion } from './writer';
import { IngestionResult, FortniteRecord } from './types';

let isRunning = false;

import { saveFallbackCache, shouldUseFallback, getFallbackData } from './fallback';

export async function runIngestion(): Promise<IngestionResult[]> {
  if (isRunning) {
    console.log('⚠️  Ingestion already in progress, skipping...');
    return [];
  }

  isRunning = true;
  console.log('\n🚀 Starting data ingestion...');
  console.log(`⏰ ${new Date().toLocaleString()}\n`);

  const results: IngestionResult[] = [];
  const allNewRecords: FortniteRecord[] = [];

  try {
    // Initialize storage
    await initializeStorage();

    // Collect from all sources in parallel
    const sources = [
      { name: 'Twitter', fn: collectTwitterData, source: 'twitter' as const },
      { name: 'Epic CMS', fn: collectEpicData, source: 'epic' as const },
      { name: 'Fortnite-API', fn: collectFortniteApiData, source: 'fortnite-api' as const },
      { name: 'Reddit', fn: collectRedditData, source: 'reddit' as const },
      { name: 'News RSS', fn: collectNewsData, source: 'news' as const },
    ];

    for (const { name, fn, source } of sources) {
      try {
        console.log(`📡 ${name}:`);
        const records = await fn();
        
        const normalized = normalizeRecords(records);
        allNewRecords.push(...normalized);

        results.push({
          source,
          success: true,
          newRecords: normalized.length,
          totalFetched: records.length,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`❌ ${name} failed:`, error);
        results.push({
          source,
          success: false,
          newRecords: 0,
          totalFetched: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Load existing records
    console.log('\n📚 Processing records...');
    const existingRecords = await loadRecords();
    console.log(`  📦 Existing records: ${existingRecords.length}`);
    console.log(`  🆕 Fetched records: ${allNewRecords.length}`);

    // Deduplicate
    const { merged, newCount } = deduplicateRecords(existingRecords, allNewRecords);
    console.log(`  ✨ New unique records: ${newCount}`);

    // Prune old records
    const final = pruneRecords(merged, config.maxRecords);

    // Save to disk
    await saveRecords(final);

    // Save successful ingestion as fallback cache
    const { saveFallbackCache } = await import('./fallback');
    await saveFallbackCache(final, 'primary');

    // Log results
    await logIngestion(results);

    // Summary
    console.log('\n📊 Ingestion Summary:');
    console.log(`  ✅ Successful sources: ${results.filter(r => r.success).length}/${results.length}`);
    console.log(`  🆕 New records added: ${newCount}`);
    console.log(`  💾 Total records stored: ${final.length}`);
    console.log(`  🗄️  Storage: ${config.recordsFile}`);

  } catch (error) {
    console.error('\n❌ Ingestion failed:', error);
    
    // Try to use fallback data if available
    try {
      const { shouldUseFallback, getFallbackData } = await import('./fallback');
      if (await shouldUseFallback(false)) {
        console.log('🔄 Attempting to use fallback data...');
        const fallbackData = await getFallbackData();
        if (fallbackData && fallbackData.length > 0) {
          console.log(`✅ Using fallback data: ${fallbackData.length} records`);
          await saveRecords(fallbackData);
          console.log('✅ Fallback data loaded successfully');
        }
      }
    } catch (fallbackError) {
      console.error('❌ Fallback system also failed:', fallbackError);
    }
  } finally {
    isRunning = false;
    console.log(`\n✅ Ingestion complete at ${new Date().toLocaleString()}\n`);
  }

  return results;
}

export function startScheduledIngestion(): void {
  console.log('🔄 Starting scheduled data ingestion...');
  console.log(`⏰ Schedule: ${config.cronSchedule} (every 10 minutes)`);
  
  // Show config warnings
  const warnings = validateConfig();
  if (warnings.length > 0) {
    console.log('\n⚠️  Configuration warnings:');
    warnings.forEach(w => console.log(`  - ${w}`));
  }

  // Run immediately on start
  console.log('\n🚀 Running initial ingestion...\n');
  runIngestion().catch(console.error);

  // Schedule recurring ingestion
  cron.schedule(config.cronSchedule, () => {
    runIngestion().catch(console.error);
  });

  console.log('\n✅ Scheduler started. Press Ctrl+C to stop.\n');
}

// Export for use in other packages
export * from './types';
export { loadRecords, saveRecords } from './writer';

// Run if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--once')) {
    // Run once and exit
    runIngestion()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  } else {
    // Run on schedule
    startScheduledIngestion();
  }
}
