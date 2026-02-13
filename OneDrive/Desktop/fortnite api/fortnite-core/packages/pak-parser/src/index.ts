/**
 * Pak Parser
 * Parses Fortnite .pak files and extracts asset metadata
 */

import { PakFileReader } from '@agc93/pak-reader';
import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Buffer } from 'buffer';

// Export map extraction functions
export {
  extractMapData,
  extractAndSaveMap,
  extractMapsFromPaks,
  saveMapData,
  type MapData,
  type POIData,
  type MapExtractionResult
} from './mapExtractor';

// Export builder functions
export { buildCosmetics, getCosmetics, type FinalCosmetic } from './cosmeticsBuilder';
export { buildWeapons, getWeapons, type FinalWeapon } from './weaponsBuilder';
export { buildMap, getMapData, type FinalMap } from './mapBuilder';

export interface AssetMetadata {
  id: string;
  name: string;
  type: string;
  rarity?: string;
  tags?: string[];
}

export interface ParsePakResult {
  pakPath: string;
  assets: AssetMetadata[];
  errors?: string[];
}

/**
 * Determine asset type based on filename prefix
 */
function determineAssetType(filename: string): string | null {
  const basename = path.basename(filename, path.extname(filename));
  
  if (basename.startsWith('WID_')) return 'weapon';
  if (basename.startsWith('AthenaMapInfo_')) return 'map';
  if (basename.startsWith('CID_')) return 'cosmetic';
  if (basename.startsWith('BID_')) return 'backbling';
  if (basename.startsWith('EID_')) return 'emote';
  
  return null;
}

/**
 * Extract metadata from asset name
 */
function extractAssetMetadata(filename: string): AssetMetadata | null {
  const assetType = determineAssetType(filename);
  if (!assetType) return null;
  
  const basename = path.basename(filename, path.extname(filename));
  const parts = basename.split('_');
  
  // Extract name and other metadata
  const name = parts.slice(1).join('_');
  
  // Try to extract rarity from name patterns
  let rarity: string | undefined;
  const rarityPatterns = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Exotic'];
  for (const pattern of rarityPatterns) {
    if (name.includes(pattern)) {
      rarity = pattern;
      break;
    }
  }
  
  // Extract tags
  const tags: string[] = [];
  if (name.includes('Wraps')) tags.push('wrap');
  if (name.includes('Glider')) tags.push('glider');
  if (name.includes('Pickaxe')) tags.push('pickaxe');
  if (name.includes('Outfit')) tags.push('outfit');
  if (name.includes('Contrail')) tags.push('contrail');
  if (name.includes('Music')) tags.push('music');
  
  return {
    id: basename,
    name: name || basename,
    type: assetType,
    rarity,
    tags: tags.length > 0 ? tags : undefined
  };
}

/**
 * Download a .pak file from URL if needed
 */
async function getPakFile(input: string): Promise<string> {
  // Check if it's a URL
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
  
  // Assume it's a local path
  return input;
}

/**
 * Parse a .pak file and extract asset metadata
 */
export const parsePak = async (pakPathOrUrl: string): Promise<ParsePakResult> => {
  console.log(`Parsing .pak file: ${pakPathOrUrl}`);
  
  const errors: string[] = [];
  const assets: AssetMetadata[] = [];
  let localPakPath: string;
  
  try {
    // Download if URL, otherwise use local path
    localPakPath = await getPakFile(pakPathOrUrl);
    
    // Read the pak file
    const reader = new PakFileReader(localPakPath);
    const parsed = await reader.parse();
    
    console.log(`Archive version: ${parsed.archiveVersion}`);
    console.log(`Read ${parsed.index.recordCount} records`);
    
    // Extract asset metadata from each record
    for (const record of parsed.index.records) {
      try {
        const metadata = extractAssetMetadata(record.fileName);
        if (metadata) {
          assets.push(metadata);
        }
      } catch (error) {
        errors.push(`Error extracting metadata from ${record.fileName}: ${error}`);
      }
    }
    
    console.log(`Extracted ${assets.length} assets`);
    
    // Clean up downloaded file if it was a URL
    if (pakPathOrUrl.startsWith('http://') || pakPathOrUrl.startsWith('https://')) {
      await fs.remove(localPakPath);
    }
    
    return {
      pakPath: pakPathOrUrl,
      assets,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error parsing .pak file: ${errorMessage}`);
    return {
      pakPath: pakPathOrUrl,
      assets: [],
      errors: [errorMessage]
    };
  }
};

/**
 * Group assets by type and save to structured JSON
 */
export const saveStructuredAssets = async (results: ParsePakResult[]): Promise<void> => {
  console.log('Saving structured asset data...');
  
  // Group assets by type
  const assetsByType: Record<string, AssetMetadata[]> = {
    weapon: [],
    map: [],
    cosmetic: [],
    backbling: [],
    emote: []
  };
  
  // Collect all assets from all results
  for (const result of results) {
    for (const asset of result.assets) {
      if (assetsByType[asset.type]) {
        assetsByType[asset.type].push(asset);
      }
    }
  }
  
  // Save each asset type to a separate file
  const structuredDir = path.join(process.cwd(), 'data', 'structured');
  await fs.ensureDir(structuredDir);
  
  for (const [assetType, assetList] of Object.entries(assetsByType)) {
    if (assetList.length > 0) {
      const filePath = path.join(structuredDir, `${assetType}.json`);
      await fs.writeJSON(filePath, assetList, { spaces: 2 });
      console.log(`Saved ${assetList.length} ${assetType} assets to: ${filePath}`);
    }
  }
};

/**
 * Parse multiple .pak files
 */
export const parsePaks = async (pakPaths: string[]): Promise<ParsePakResult[]> => {
  console.log(`Parsing ${pakPaths.length} .pak files...`);
  
  const results: ParsePakResult[] = [];
  
  for (const pakPath of pakPaths) {
    try {
      const result = await parsePak(pakPath);
      results.push(result);
      
      // Also save structured data incrementally
      await saveStructuredAssets([result]);
    } catch (error) {
      console.error(`Error parsing ${pakPath}:`, error);
      results.push({
        pakPath,
        assets: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }
  
  console.log(`Completed parsing ${results.length} .pak files`);
  return results;
};
