/**
 * Cosmetics Builder
 * Builds final cosmetics data with enriched metadata
 */

import { loadJSON, saveJSON } from '@fortnite-core/database';

export interface AssetInfo {
  name: string;
  type: 'cosmetic' | 'weapon' | 'map' | 'backbling' | 'emote';
  pakFile: string;
}

export interface FinalCosmetic {
  id: string;
  name: string;
  type: string;
  rarity?: string;
  season?: number;
  iconPath?: string;
  pakFile?: string;
}

/**
 * Extract numeric ID from asset name
 */
function extractId(name: string): string {
  // Extract ID from patterns like "CID_123" or "CID_ABC_123"
  const match = name.match(/^([A-Z]+)_([^_]+)/);
  return match ? match[2] : name;
}

/**
 * Determine cosmetic type from filename
 */
function getCosmeticType(name: string): string {
  const upperName = name.toUpperCase();
  
  if (upperName.includes('GENERAL') || upperName.includes('CHARACTER')) return 'Outfit';
  if (upperName.includes('BACKBLING') || name.startsWith('BID_')) return 'Backbling';
  if (upperName.includes('PICKAXE') || upperName.includes('HARVESTING')) return 'Pickaxe';
  if (upperName.includes('GLIDER')) return 'Glider';
  if (upperName.includes('CONTRAIL')) return 'Contrail';
  if (upperName.includes('WRAP') || upperName.includes('WEAPONWRAP')) return 'Wrap';
  if (upperName.includes('EMOTE') || name.startsWith('EID_')) return 'Emote';
  if (upperName.includes('MUSIC')) return 'Music';
  
  return 'Unknown';
}

/**
 * Extract rarity from name
 */
function extractRarity(name: string): string | undefined {
  const upperName = name.toUpperCase();
  
  const rarities = [
    'COMMON',
    'UNCOMMON', 
    'RARE',
    'EPIC',
    'LEGENDARY',
    'MYTHIC',
    'EXOTIC',
    'DARK SERIES',
    'LAMINATED SERIES',
    'SLURP SERIES',
    'SHADOW SERIES'
  ];
  
  for (const rarity of rarities) {
    if (upperName.includes(rarity.replace(' ', '_'))) {
      return rarity.charAt(0) + rarity.slice(1).toLowerCase();
    }
  }
  
  // Look for season-specific rarities
  const seasonMatch = upperName.match(/SEASON[_\s]?(\d+)/i);
  if (seasonMatch) {
    return 'Seasonal';
  }
  
  return undefined;
}

/**
 * Extract season number from name
 */
function extractSeason(name: string): number | undefined {
  const match = name.match(/SEASON[_\s]?(\d+)/i);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Construct icon path from Unreal asset path
 */
function constructIconPath(name: string): string {
  // Convert asset name to Unreal Engine path format
  const cleanName = name.replace(/[^A-Za-z0-9_]/g, '');
  
  // Common Unreal path patterns for Fortnite cosmetics
  return `/Game/Athena/Items/Cosmetics/${cleanName}/${cleanName}_Large`;
}

/**
 * Load and process cosmetics data
 */
async function loadAndProcessCosmetics(): Promise<FinalCosmetic[]> {
  const cosmeticsData = await loadJSON('structured/cosmetics.json');
  
  if (!cosmeticsData || !Array.isArray(cosmeticsData)) {
    console.warn('No cosmetics data found');
    return [];
  }
  
  const finalCosmetics: FinalCosmetic[] = [];
  
  for (const item of cosmeticsData) {
    const assetInfo = item as AssetInfo;
    
    const cosmetic: FinalCosmetic = {
      id: extractId(assetInfo.name),
      name: assetInfo.name,
      type: getCosmeticType(assetInfo.name),
      rarity: extractRarity(assetInfo.name),
      season: extractSeason(assetInfo.name),
      iconPath: constructIconPath(assetInfo.name),
      pakFile: assetInfo.pakFile
    };
    
    finalCosmetics.push(cosmetic);
  }
  
  return finalCosmetics;
}

/**
 * Build and save final cosmetics data
 */
export async function buildCosmetics(): Promise<void> {
  console.log('Building cosmetics data...');
  
  try {
    const cosmetics = await loadAndProcessCosmetics();
    
    if (cosmetics.length === 0) {
      console.warn('No cosmetics to process');
      return;
    }
    
    // Save to final directory
    await saveJSON('final/cosmetics.json', cosmetics);
    
    console.log('✅ Cosmetics built');
    console.log(`   Total cosmetics: ${cosmetics.length}`);
    
    // Log type breakdown
    const typeCount: Record<string, number> = {};
    cosmetics.forEach(c => {
      typeCount[c.type] = (typeCount[c.type] || 0) + 1;
    });
    
    console.log('   Type breakdown:');
    for (const [type, count] of Object.entries(typeCount)) {
      console.log(`     - ${type}: ${count}`);
    }
  } catch (error) {
    console.error('Error building cosmetics:', error);
    throw error;
  }
}

/**
 * Get cosmetics data for API
 */
export async function getCosmetics(): Promise<FinalCosmetic[]> {
  // Try to load from final directory first
  const finalData = await loadJSON('final/cosmetics.json');
  
  if (finalData && Array.isArray(finalData)) {
    return finalData;
  }
  
  // If not in final, build it
  console.log('No final cosmetics data found, building...');
  await buildCosmetics();
  
  // Return the built data
  const builtData = await loadJSON('final/cosmetics.json');
  return builtData || [];
}

