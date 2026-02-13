/**
 * Map Builder
 * Builds final map data with POI information
 */

import { loadJSON, saveJSON } from '@fortnite-core/database';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface POIData {
  name: string;
  coordinates?: {
    x: number;
    y: number;
    z?: number;
  };
  zoneId?: string;
  rotation?: number;
  version?: string;
}

export interface MapData {
  season: number;
  mapVersion: string;
  pois: POIData[];
}

export interface FinalPOI {
  id: string;
  name: string;
  x?: number;
  y?: number;
  z?: number;
  zone?: string;
  type?: string;
}

export interface FinalMap {
  version: string;
  season: number;
  pois: FinalPOI[];
  metadata: {
    totalPOIs: number;
    timestamp: string;
  };
}

/**
 * Generate POI ID from name
 */
function generatePoiId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Classify POI type from name
 */
function classifyPoiType(name: string): string {
  const upperName = name.toUpperCase();
  
  // Common Fortnite POI types
  if (upperName.includes('LANDMARK')) return 'Landmark';
  if (upperName.includes('NAMED')) return 'Named Location';
  if (upperName.includes('TOWERS')) return 'Towers';
  if (upperName.includes('FACTORY')) return 'Factory';
  if (upperName.includes('CABIN')) return 'Cabin';
  if (upperName.includes('VILLAGE')) return 'Village';
  if (upperName.includes('DOCK')) return 'Dock';
  if (upperName.includes('BASE')) return 'Base';
  if (upperName.includes('HEADQUARTERS')) return 'HQ';
  if (upperName.includes('LAB')) return 'Lab';
  
  return 'POI';
}

/**
 * Load and process map data
 */
async function loadAndProcessMap(version?: string): Promise<FinalMap | null> {
  let mapData: MapData | MapData[] | null;
  
  // Try to load from structured directory
  if (version) {
    mapData = await loadJSON(`structured/map/${version}.json`);
  } else {
    // Try to find any map data
    const mapDir = path.join(process.cwd(), 'data', 'structured', 'map');
    
    if (await fs.pathExists(mapDir)) {
      const files = await fs.readdir(mapDir);
      const mapFiles = files.filter(f => f.endsWith('.json'));
      
      if (mapFiles.length === 0) {
        console.warn('No map data found');
        return null;
      }
      
      // Load the first available map file
      mapData = await loadJSON(`structured/map/${mapFiles[0]}`);
    } else {
      mapData = await loadJSON('structured/map.json');
    }
  }
  
  if (!mapData) {
    console.warn('No map data found');
    return null;
  }
  
  // Handle array of maps (if multiple seasons)
  if (Array.isArray(mapData)) {
    // Take the first/latest map
    mapData = mapData[0];
  }
  
  const map = mapData as MapData;
  
  // Process POIs
  const finalPois: FinalPOI[] = map.pois.map(poi => ({
    id: generatePoiId(poi.name),
    name: poi.name,
    x: poi.coordinates?.x,
    y: poi.coordinates?.y,
    z: poi.coordinates?.z,
    zone: poi.zoneId,
    type: classifyPoiType(poi.name)
  }));
  
  return {
    version: map.mapVersion,
    season: map.season,
    pois: finalPois,
    metadata: {
      totalPOIs: finalPois.length,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Create symlink to latest map version
 */
async function createLatestSymlink(version: string): Promise<void> {
  const mapDir = path.join(process.cwd(), 'data', 'final', 'map');
  await fs.ensureDir(mapDir);
  
  const versionPath = path.join(mapDir, `${version}.json`);
  const latestPath = path.join(mapDir, 'latest.json');
  
  // Remove existing latest.json if it exists
  if (await fs.pathExists(latestPath)) {
    await fs.remove(latestPath);
  }
  
  // Copy instead of symlink (Windows compatibility)
  if (await fs.pathExists(versionPath)) {
    await fs.copy(versionPath, latestPath);
    console.log(`Created latest.json -> ${version}.json`);
  }
}

/**
 * Build and save final map data
 */
export async function buildMap(version?: string): Promise<void> {
  console.log('Building map data...');
  
  try {
    const mapData = await loadAndProcessMap(version);
    
    if (!mapData) {
      console.warn('No map data to process');
      return;
    }
    
    // Save to final directory
    const finalPath = `final/map/${mapData.version}.json`;
    await saveJSON(finalPath, mapData);
    
    // Create latest.json symlink/copy
    await createLatestSymlink(mapData.version);
    
    console.log('✅ Map built');
    console.log(`   Version: ${mapData.version}`);
    console.log(`   Season: ${mapData.season}`);
    console.log(`   Total POIs: ${mapData.metadata.totalPOIs}`);
    
    // Log POI type breakdown
    const typeCount: Record<string, number> = {};
    mapData.pois.forEach(poi => {
      typeCount[poi.type || 'Unknown'] = (typeCount[poi.type || 'Unknown'] || 0) + 1;
    });
    
    console.log('   POI breakdown:');
    for (const [type, count] of Object.entries(typeCount)) {
      console.log(`     - ${type}: ${count}`);
    }
  } catch (error) {
    console.error('Error building map:', error);
    throw error;
  }
}

/**
 * Get map data for API
 */
export async function getMapData(version?: string): Promise<FinalMap | null> {
  // Try to load from final directory first
  if (version) {
    const versionData = await loadJSON(`final/map/${version}.json`);
    if (versionData) {
      return versionData;
    }
  }
  
  // Try to load latest
  const latestData = await loadJSON('final/map/latest.json');
  if (latestData) {
    return latestData;
  }
  
  // If not in final, build it
  console.log('No final map data found, building...');
  await buildMap(version);
  
  // Return the built data
  if (version) {
    return await loadJSON(`final/map/${version}.json`);
  }
  
  return await loadJSON('final/map/latest.json');
}

/**
 * Get all available map versions
 */
export async function getMapVersions(): Promise<string[]> {
  const mapDir = path.join(process.cwd(), 'data', 'final', 'map');
  
  if (!await fs.pathExists(mapDir)) {
    return [];
  }
  
  const files = await fs.readdir(mapDir);
  return files
    .filter(f => f.endsWith('.json') && f !== 'latest.json')
    .map(f => f.replace('.json', ''));
}

