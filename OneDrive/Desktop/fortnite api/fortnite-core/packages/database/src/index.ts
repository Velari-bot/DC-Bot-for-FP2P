/**
 * Database Layer
 * Database operations for Fortnite data using lowdb
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';

interface DatabaseSchema {
  versions: string[];
  metadata: Record<string, any>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const STRUCTURED_DIR = path.join(DATA_DIR, 'structured');
const REPLAYS_DIR = path.join(DATA_DIR, 'replays');
const CACHE_DIR = path.join(DATA_DIR, 'cache');
const MANIFESTS_DIR = path.join(DATA_DIR, 'raw', 'manifests');
const MAP_DIR = path.join(DATA_DIR, 'structured', 'map');
const FINAL_DIR = path.join(DATA_DIR, 'final');

const DB_FILE = path.join(DATA_DIR, 'db.json');

let db: LowSync<DatabaseSchema>;

/**
 * Initialize database directories
 */
export const initDatabase = async (): Promise<void> => {
  console.log('Initializing database directories...');
  
  // Create all required directories
  await fs.ensureDir(DATA_DIR);
  await fs.ensureDir(RAW_DIR);
  await fs.ensureDir(STRUCTURED_DIR);
  await fs.ensureDir(REPLAYS_DIR);
  await fs.ensureDir(CACHE_DIR);
  await fs.ensureDir(MANIFESTS_DIR);
  await fs.ensureDir(MAP_DIR);
  await fs.ensureDir(FINAL_DIR);
  
  // Initialize lowdb
  const adapter = new JSONFileSync<DatabaseSchema>(DB_FILE);
  db = new LowSync<DatabaseSchema>(adapter, { versions: [], metadata: {} });
  db.read();
  
  console.log('Database initialized');
};

/**
 * Save JSON data to a file path
 */
export const saveJSON = async (filePath: string, data: any): Promise<void> => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(DATA_DIR, filePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeJSON(fullPath, data, { spaces: 2 });
  } catch (error) {
    console.error(`Error saving JSON to ${filePath}:`, error);
    throw error;
  }
};

/**
 * Load JSON data from a file path
 */
export const loadJSON = async (filePath: string): Promise<any> => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(DATA_DIR, filePath);
    
    if (!await fs.pathExists(fullPath)) {
      return null;
    }
    
    return await fs.readJSON(fullPath);
  } catch (error) {
    console.error(`Error loading JSON from ${filePath}:`, error);
    return null;
  }
};

/**
 * Get the latest version from archived versions
 */
export const getLatestVersion = async (): Promise<string | null> => {
  try {
    // Look in raw/manifests */
    if (!await fs.pathExists(MANIFESTS_DIR)) {
      return null;
    }
    
    const files = await fs.readdir(MANIFESTS_DIR);
    const versionFiles = files.filter(f => f.endsWith('.json'));
    
    if (versionFiles.length === 0) {
      return null;
    }
    
    // Sort versions (assuming semantic versioning or numeric)
    const sortedVersions = versionFiles
      .map(f => f.replace('.json', ''))
      .sort((a, b) => {
        // Try to parse as semantic version
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aPart = aParts[i] || 0;
          const bPart = bParts[i] || 0;
          
          if (aPart > bPart) return -1;
          if (aPart < bPart) return 1;
        }
        
        return 0;
      });
    
    return sortedVersions[0] || null;
  } catch (error) {
    console.error('Error getting latest version:', error);
    return null;
  }
};

/**
 * Get all archived versions
 */
export const getArchiveVersions = async (): Promise<string[]> => {
  try {
    // Look in raw/manifests
    if (!await fs.pathExists(MANIFESTS_DIR)) {
      return [];
    }
    
    const files = await fs.readdir(MANIFESTS_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch (error) {
    console.error('Error getting archive versions:', error);
    return [];
  }
};

/**
 * Save raw data (legacy function for compatibility)
 */
export const saveRawData = async (filename: string, data: any): Promise<void> => {
  const filePath = path.join(RAW_DIR, filename);
  await saveJSON(filePath, data);
  console.log(`Saved raw data to: ${filePath}`);
};

/**
 * Query database (legacy function for compatibility)
 */
export const queryDatabase = async (_query: string): Promise<any> => {
  console.log('Executing database query');
  // TODO: Implement database query logic
  return {};
};

// Export directory paths
export const DB_DIRS = {
  DATA_DIR,
  RAW_DIR,
  STRUCTURED_DIR,
  REPLAYS_DIR,
  CACHE_DIR,
  MANIFESTS_DIR,
  MAP_DIR,
  FINAL_DIR
};
