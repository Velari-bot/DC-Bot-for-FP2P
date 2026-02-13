/**
 * Fallback Data System
 * 
 * Provides cached data when primary data sources fail.
 * Ensures PathGen continues working even during outages.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { FortniteRecord } from './types';

const FALLBACK_CACHE_FILE = path.join(__dirname, '../../../data/ingestion/fallback-cache.json');
const FALLBACK_MAX_AGE_HOURS = 24; // Use fallback if data is less than 24 hours old

interface FallbackCache {
  records: FortniteRecord[];
  timestamp: string;
  source: string;
}

/**
 * Save successful ingestion as fallback cache
 */
export async function saveFallbackCache(records: FortniteRecord[], source: string = 'primary'): Promise<void> {
  try {
    const cache: FallbackCache = {
      records,
      timestamp: new Date().toISOString(),
      source,
    };

    // Ensure directory exists
    const cacheDir = path.dirname(FALLBACK_CACHE_FILE);
    await fs.mkdir(cacheDir, { recursive: true });

    await fs.writeFile(FALLBACK_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    console.log(`✅ Fallback cache saved: ${records.length} records from ${source}`);
  } catch (error) {
    console.error('❌ Failed to save fallback cache:', error);
    // Don't throw - fallback is optional
  }
}

/**
 * Load fallback cache if available and recent
 */
export async function loadFallbackCache(): Promise<FortniteRecord[] | null> {
  try {
    const cacheData = await fs.readFile(FALLBACK_CACHE_FILE, 'utf-8');
    const cache: FallbackCache = JSON.parse(cacheData);

    // Check if cache is still valid (less than 24 hours old)
    const cacheTime = new Date(cache.timestamp);
    const now = new Date();
    const ageHours = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);

    if (ageHours > FALLBACK_MAX_AGE_HOURS) {
      console.log(`⚠️  Fallback cache is too old (${ageHours.toFixed(1)} hours). Not using fallback.`);
      return null;
    }

    console.log(`✅ Using fallback cache: ${cache.records.length} records (${ageHours.toFixed(1)} hours old)`);
    return cache.records;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('ℹ️  No fallback cache available');
      return null;
    }
    console.error('❌ Failed to load fallback cache:', error);
    return null;
  }
}

/**
 * Check if we should use fallback (primary source failed)
 */
export async function shouldUseFallback(primarySuccess: boolean): Promise<boolean> {
  if (primarySuccess) {
    return false; // Primary succeeded, no need for fallback
  }

  const fallback = await loadFallbackCache();
  return fallback !== null && fallback.length > 0;
}

/**
 * Get fallback data with validation
 */
export async function getFallbackData(): Promise<FortniteRecord[]> {
  const fallback = await loadFallbackCache();
  
  if (!fallback || fallback.length === 0) {
    throw new Error('No fallback data available');
  }

  return fallback;
}

