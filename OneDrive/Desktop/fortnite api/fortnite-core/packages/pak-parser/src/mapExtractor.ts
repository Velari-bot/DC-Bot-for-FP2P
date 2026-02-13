/**
 * Map Extractor
 * Extracts map data from AthenaMapInfo assets in PAK files
 */

import { PakFileReader } from '@agc93/pak-reader';
import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Buffer } from 'buffer';

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

export interface MapExtractionResult {
  pakPath: string;
  mapData?: MapData;
  errors?: string[];
}

/**
 * Extract season number from filename or path
 */
function extractSeason(filename: string, path: string): number {
  // Try to extract from filename like "AthenaMapInfo_Season31"
  const seasonMatch = filename.match(/Season(\d+)/i);
  if (seasonMatch) {
    return parseInt(seasonMatch[1], 10);
  }
  
  // Try to extract from path
  const pathSeasonMatch = path.match(/Season[_\s]?(\d+)/i);
  if (pathSeasonMatch) {
    return parseInt(pathSeasonMatch[1], 10);
  }
  
  // Default to current season if not found
  return 31;
}

/**
 * Extract version from filename
 */
function extractVersion(filename: string): string {
  // Look for version patterns like "v31.10" or "31.10"
  const versionMatch = filename.match(/(?:v)?(\d+\.\d+)/);
  if (versionMatch) {
    return versionMatch[1];
  }
  
  // Try to extract season-based version
  const seasonMatch = filename.match(/Season(\d+)/i);
  if (seasonMatch) {
    return `${seasonMatch[1]}.00`;
  }
  
  return 'unknown';
}

/**
 * Parse POI name from AthenaMapInfo filename
 */
function extractPOIName(filename: string): string {
  // Remove common prefixes and suffixes
  let name = filename
    .replace(/^AthenaMapInfo[_\s]*/i, '')
    .replace(/^Season[_\s]*\d+[_\s]*/i, '')
    .replace(/\.(pak|uasset|uexp)$/i, '')
    .replace(/[_\s]+/g, ' ');
  
  // Capitalize properly
  name = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return name || 'Unknown POI';
}

/**
 * Extract coordinates from filename or data (if available)
 * Note: Actual coordinates would need to be extracted from the .uasset/.uexp files
 */
function extractCoordinates(_filename: string): POIData['coordinates'] | undefined {
  // In a real implementation, this would parse the .uasset/.uexp files
  // to extract actual coordinates from the Unreal Engine asset data
  return undefined;
}

/**
 * Extract zone ID from filename
 */
function extractZoneID(filename: string): string | undefined {
  // Look for patterns like "Zone_XYZ" or similar
  const zoneMatch = filename.match(/Zone[_\s]?([A-Z0-9_]+)/i);
  return zoneMatch ? zoneMatch[1] : undefined;
}

/**
 * Parse AthenaMapInfo assets from PAK data
 */
async function parseAthenaMapInfos(pakPath: string): Promise<POIData[]> {
  const pois: POIData[] = [];
  
  try {
    const reader = new PakFileReader(pakPath);
    const parsed = await reader.parse();
    
    // Filter for AthenaMapInfo files
    const athenaMapInfoFiles = parsed.index.records.filter(record =>
      record.fileName.includes('AthenaMapInfo') ||
      record.fileName.includes('POI') ||
      record.fileName.match(/MapInfo/i)
    );
    
    console.log(`Found ${athenaMapInfoFiles.length} AthenaMapInfo files`);
    
    for (const record of athenaMapInfoFiles) {
      try {
        const filename = path.basename(record.fileName);
        const poiName = extractPOIName(filename);
        
        const poiData: POIData = {
          name: poiName,
          coordinates: extractCoordinates(filename),
          zoneId: extractZoneID(filename),
          version: extractVersion(filename)
        };
        
        pois.push(poiData);
      } catch (error) {
        console.warn(`Error parsing AthenaMapInfo file ${record.fileName}:`, error);
      }
    }
    
    return pois;
  } catch (error) {
    console.error(`Error parsing PAK file:`, error);
    return [];
  }
}

/**
 * Download a .pak file from URL if needed
 */
async function getPakFile(input: string): Promise<string> {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    console.log(`Downloading .pak file from: ${input}`);
    const response = await axios.get(input, { responseType: 'arraybuffer' });
    const filename = path.basename(input);
    const tempPath = path.join(process.cwd(), 'temp', filename);
    await fs.ensureDir(path.dirname(tempPath));
    await fs.writeFile(tempPath, Buffer.from(response.data));
    console.log(`Downloaded to: ${tempPath}`);
    return tempPath;
  }
  
  return input;
}

/**
 * Extract map data from a .pak file
 */
export async function extractMapData(pakPathOrUrl: string): Promise<MapExtractionResult> {
  console.log(`Extracting map data from: ${pakPathOrUrl}`);
  
  const errors: string[] = [];
  let localPakPath: string;
  
  try {
    // Download if URL, otherwise use local path
    localPakPath = await getPakFile(pakPathOrUrl);
    
    // Extract season and version from path
    const season = extractSeason(pakPathOrUrl, localPakPath);
    const mapVersion = extractVersion(pakPathOrUrl);
    
    // Parse AthenaMapInfo assets
    const pois = await parseAthenaMapInfos(localPakPath);
    
    const mapData: MapData = {
      season,
      mapVersion,
      pois
    };
    
    console.log(`Extracted ${pois.length} POIs for season ${season}, version ${mapVersion}`);
    
    // Clean up downloaded file if it was a URL
    if (pakPathOrUrl.startsWith('http://') || pakPathOrUrl.startsWith('https://')) {
      await fs.remove(localPakPath);
    }
    
    return {
      pakPath: pakPathOrUrl,
      mapData,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error extracting map data: ${errorMessage}`);
    errors.push(errorMessage);
    
    return {
      pakPath: pakPathOrUrl,
      errors
    };
  }
}

/**
 * Save map data to structured JSON
 */
export async function saveMapData(mapData: MapData): Promise<void> {
  const mapDir = path.join(process.cwd(), 'data', 'structured', 'map');
  await fs.ensureDir(mapDir);
  
  const filename = `${mapData.mapVersion}.json`;
  const filePath = path.join(mapDir, filename);
  
  await fs.writeJSON(filePath, mapData, { spaces: 2 });
  console.log(`Saved map data to: ${filePath}`);
}

/**
 * Extract and save map data from .pak files
 */
export async function extractAndSaveMap(pakPathOrUrl: string): Promise<void> {
  const result = await extractMapData(pakPathOrUrl);
  
  if (result.mapData) {
    await saveMapData(result.mapData);
  } else {
    console.error('Failed to extract map data:', result.errors);
  }
}

/**
 * Process multiple .pak files and extract map data
 */
export async function extractMapsFromPaks(pakPaths: string[]): Promise<MapExtractionResult[]> {
  console.log(`Extracting maps from ${pakPaths.length} .pak files...`);
  
  const results: MapExtractionResult[] = [];
  
  for (const pakPath of pakPaths) {
    try {
      const result = await extractMapData(pakPath);
      results.push(result);
      
      // Save if successful
      if (result.mapData) {
        await saveMapData(result.mapData);
      }
    } catch (error) {
      console.error(`Error processing ${pakPath}:`, error);
      results.push({
        pakPath,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }
  
  console.log(`Completed extracting maps from ${results.length} .pak files`);
  return results;
}

