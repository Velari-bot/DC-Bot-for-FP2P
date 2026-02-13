/**
 * PAK Extractor
 * Extracts asset names from PAK file headers
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { saveRawData } from '@fortnite-core/database';
import { Buffer } from 'buffer';

export interface AssetInfo {
  name: string;
  type: 'cosmetic' | 'weapon' | 'map' | 'backbling' | 'emote';
  pakFile: string;
}

/**
 * Extract string table from binary header
 */
function extractStringTable(buffer: Buffer): string[] {
  const strings: string[] = [];
  const text = buffer.toString('utf8');
  
  // Find null-terminated strings in the buffer
  let currentString = '';
  let inString = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '\0') {
      if (inString && currentString.length > 0) {
        strings.push(currentString);
        currentString = '';
      }
      inString = false;
    } else if (char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126) {
      // Printable ASCII characters
      currentString += char;
      inString = true;
    } else {
      if (inString && currentString.length > 0) {
        strings.push(currentString);
        currentString = '';
      }
      inString = false;
    }
  }
  
  return strings;
}

/**
 * Determine asset type from filename
 */
function getAssetType(filename: string): 'cosmetic' | 'weapon' | 'map' | 'backbling' | 'emote' | null {
  const upperFilename = filename.toUpperCase();
  
  if (upperFilename.startsWith('CID_')) return 'cosmetic';
  if (upperFilename.startsWith('BID_')) return 'backbling';
  if (upperFilename.startsWith('WID_')) return 'weapon';
  if (upperFilename.includes('ATHENAMAPINFO_')) return 'map';
  if (upperFilename.startsWith('EID_')) return 'emote';
  
  return null;
}

/**
 * Extract asset names from PAK header
 */
function extractAssetsFromHeader(buffer: Buffer, pakFile: string): AssetInfo[] {
  const assets: AssetInfo[] = [];
  
  // Extract string table
  const strings = extractStringTable(buffer);
  
  // Filter for asset names
  for (const str of strings) {
    const assetType = getAssetType(str);
    if (assetType) {
      assets.push({
        name: str,
        type: assetType,
        pakFile
      });
    }
  }
  
  return assets;
}

/**
 * Read and parse a PAK header file
 */
export async function extractPakHeader(headerPath: string): Promise<AssetInfo[]> {
  console.log(`Reading PAK header: ${headerPath}`);
  
  try {
    const buffer = await fs.readFile(headerPath);
    const filename = path.basename(headerPath, '.bin');
    
    const assets = extractAssetsFromHeader(buffer, filename);
    
    console.log(`Extracted ${assets.length} assets from ${filename}`);
    return assets;
  } catch (error) {
    console.error(`Error reading PAK header ${headerPath}:`, error);
    return [];
  }
}

/**
 * Extract all PAK headers and group by type
 */
export async function extractAllPakHeaders(): Promise<void> {
  console.log('Extracting assets from PAK headers...');
  
  try {
    const paksDir = path.join(process.cwd(), 'data', 'raw', 'paks');
    
    if (!await fs.pathExists(paksDir)) {
      console.error('PAK headers directory not found');
      return;
    }
    
    const files = await fs.readdir(paksDir);
    const headerFiles = files.filter(f => f.endsWith('.bin'));
    
    console.log(`Found ${headerFiles.length} PAK header files`);
    
    const allAssets: AssetInfo[] = [];
    
    for (const file of headerFiles) {
      const headerPath = path.join(paksDir, file);
      const assets = await extractPakHeader(headerPath);
      allAssets.push(...assets);
    }
    
    // Group by type
    const groupedAssets = {
      cosmetics: allAssets.filter(a => a.type === 'cosmetic'),
      weapons: allAssets.filter(a => a.type === 'weapon'),
      map: allAssets.filter(a => a.type === 'map'),
      backbling: allAssets.filter(a => a.type === 'backbling'),
      emotes: allAssets.filter(a => a.type === 'emote')
    };
    
    // Save each type
    for (const [type, assets] of Object.entries(groupedAssets)) {
      if (assets.length > 0) {
        await saveRawData(`structured/${type}.json`, assets);
        console.log(`Saved ${assets.length} ${type} assets`);
      }
    }
    
    console.log('✅ Asset extraction complete');
    console.log(`   Total assets: ${allAssets.length}`);
    console.log(`   - Cosmetics: ${groupedAssets.cosmetics.length}`);
    console.log(`   - Weapons: ${groupedAssets.weapons.length}`);
    console.log(`   - Map: ${groupedAssets.map.length}`);
    console.log(`   - Backblings: ${groupedAssets.backbling.length}`);
    console.log(`   - Emotes: ${groupedAssets.emotes.length}`);
  } catch (error) {
    console.error('Error extracting PAK headers:', error);
    throw error;
  }
}

/**
 * Process a single PAK file (download header and extract)
 */
export async function processPakFile(filename: string): Promise<void> {
  console.log(`Processing PAK file: ${filename}`);
  
  try {
    // Import downloader function
    const { downloadPakHeaderByName } = await import('./downloader');
    
    // Download header
    const headerPath = await downloadPakHeaderByName(filename);
    
    if (!headerPath) {
      console.error(`Failed to download header for ${filename}`);
      return;
    }
    
    // Extract assets
    const assets = await extractPakHeader(headerPath);
    
    // Save to structured data
    // Group by type and save
    const groupedAssets = {
      cosmetics: assets.filter(a => a.type === 'cosmetic'),
      weapons: assets.filter(a => a.type === 'weapon'),
      map: assets.filter(a => a.type === 'map'),
      backbling: assets.filter(a => a.type === 'backbling'),
      emotes: assets.filter(a => a.type === 'emote')
    };
    
    // Append to existing files
    for (const [type, typeAssets] of Object.entries(groupedAssets)) {
      if (typeAssets.length > 0) {
        // Load existing data
        const existingPath = path.join(process.cwd(), 'data', 'structured', `${type}.json`);
        let existingData: AssetInfo[] = [];
        
        if (await fs.pathExists(existingPath)) {
          existingData = await fs.readJSON(existingPath);
        }
        
        // Combine and save
        const combinedData = [...existingData, ...typeAssets];
        await saveRawData(`structured/${type}.json`, combinedData);
        
        console.log(`Added ${typeAssets.length} ${type} assets`);
      }
    }
    
  } catch (error) {
    console.error(`Error processing PAK file ${filename}:`, error);
  }
}

