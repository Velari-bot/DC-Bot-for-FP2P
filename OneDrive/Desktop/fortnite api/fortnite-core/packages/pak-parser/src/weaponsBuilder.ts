/**
 * Weapons Builder
 * Builds final weapons data with stats from DataTables
 */

import { loadJSON, saveJSON } from '@fortnite-core/database';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface AssetInfo {
  name: string;
  type: 'cosmetic' | 'weapon' | 'map' | 'backbling' | 'emote';
  pakFile: string;
}

export interface WeaponStats {
  damage?: number;
  fireRate?: number;
  reloadTime?: number;
  magazineSize?: number;
  falloffMin?: number;
  falloffMax?: number;
  headshotMultiplier?: number;
}

export interface FinalWeapon {
  id: string;
  name: string;
  type: string;
  rarity?: string;
  stats?: WeaponStats;
  pakFile?: string;
}

/**
 * Extract numeric ID from weapon name
 */
function extractId(name: string): string {
  const match = name.match(/^([A-Z]+)_([^_]+)/);
  return match ? match[2] : name;
}

/**
 * Determine weapon type from filename
 */
function getWeaponType(name: string): string {
  const upperName = name.toUpperCase();
  
  if (upperName.includes('ASSAULT') || upperName.includes('RIFLE')) return 'Assault Rifle';
  if (upperName.includes('SMG') || upperName.includes('SUBMACHINE')) return 'SMG';
  if (upperName.includes('SHOTGUN')) return 'Shotgun';
  if (upperName.includes('SNIPER')) return 'Sniper Rifle';
  if (upperName.includes('PISTOL') || upperName.includes('HANDCANNON')) return 'Pistol';
  if (upperName.includes('EXPLOSIVE') || upperName.includes('ROCKET')) return 'Explosive';
  if (upperName.includes('BOW')) return 'Bow';
  
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
    'EXOTIC'
  ];
  
  for (const rarity of rarities) {
    if (upperName.includes(rarity.replace(' ', '_'))) {
      return rarity.charAt(0) + rarity.slice(1).toLowerCase();
    }
  }
  
  return undefined;
}

/**
 * Search for numeric values in binary data
 */
function findStatsInHeader(buffer: Buffer, weaponName: string): WeaponStats {
  const stats: WeaponStats = {};
  const text = buffer.toString('utf8');
  
  // Common stat patterns in Fortnite weapon data
  const statPatterns = {
    damage: /D[ae]m[ae]g[ae]\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    fireRate: /Fire(?:Rate|Speed)\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    reloadTime: /Reload(?:Time|Speed)\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    magazineSize: /Mag(?:azine)?(?:Size)?\s*[:=]\s*(\d+)/i,
    falloffMin: /FalloffMin\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    falloffMax: /FalloffMax\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    headshotMultiplier: /Head(?:shot)?(?:Multiplier)?\s*[:=]\s*(\d+(?:\.\d+)?)/i
  };
  
  for (const [key, pattern] of Object.entries(statPatterns)) {
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      (stats as any)[key] = value;
    }
  }
  
  // Also try to find weapon-specific data tables
  // Look for the weapon name followed by stats
  const weaponRegex = new RegExp(weaponName.split('_').pop() || weaponName, 'i');
  const weaponSection = text.match(weaponRegex);
  
  if (weaponSection && weaponSection.index) {
    const section = text.substr(weaponSection.index, 500);
    
    // Try to find numeric values near the weapon name
    const numberMatches = section.matchAll(/\d+(?:\.\d+)?/g);
    let lastNumbers: number[] = [];
    for (const match of numberMatches) {
      lastNumbers.push(parseFloat(match[0]));
    }
    
    // Assign numbers to stats based on typical order
    if (lastNumbers.length >= 3) {
      stats.damage = lastNumbers[0];
      stats.fireRate = lastNumbers[1];
      stats.reloadTime = lastNumbers[2];
    }
    if (lastNumbers.length >= 4) {
      stats.magazineSize = lastNumbers[3];
    }
  }
  
  return stats;
}

/**
 * Get weapon stats from PAK header
 */
async function getWeaponStats(weaponName: string, pakFile: string): Promise<WeaponStats> {
  try {
    const headerPath = path.join(process.cwd(), 'data', 'raw', 'paks', `${pakFile}.bin`);
    
    if (await fs.pathExists(headerPath)) {
      const buffer = await fs.readFile(headerPath);
      return findStatsInHeader(buffer, weaponName);
    }
  } catch (error) {
    // Silently fail - stats are optional
  }
  
  return {};
}

/**
 * Load and process weapons data
 */
async function loadAndProcessWeapons(): Promise<FinalWeapon[]> {
  const weaponsData = await loadJSON('structured/weapons.json');
  
  if (!weaponsData || !Array.isArray(weaponsData)) {
    console.warn('No weapons data found');
    return [];
  }
  
  console.log(`Processing ${weaponsData.length} weapons...`);
  
  const finalWeapons: FinalWeapon[] = [];
  
  for (const item of weaponsData) {
    const assetInfo = item as AssetInfo;
    
    const weapon: FinalWeapon = {
      id: extractId(assetInfo.name),
      name: assetInfo.name,
      type: getWeaponType(assetInfo.name),
      rarity: extractRarity(assetInfo.name),
      pakFile: assetInfo.pakFile
    };
    
    // Try to get stats from PAK header
    if (assetInfo.pakFile) {
      weapon.stats = await getWeaponStats(assetInfo.name, assetInfo.pakFile);
    }
    
    finalWeapons.push(weapon);
  }
  
  return finalWeapons;
}

/**
 * Build and save final weapons data
 */
export async function buildWeapons(): Promise<void> {
  console.log('Building weapons data...');
  
  try {
    const weapons = await loadAndProcessWeapons();
    
    if (weapons.length === 0) {
      console.warn('No weapons to process');
      return;
    }
    
    // Save to final directory
    await saveJSON('final/weapons.json', weapons);
    
    const weaponsWithStats = weapons.filter(w => w.stats && Object.keys(w.stats).length > 0);
    
    console.log('✅ Weapons built');
    console.log(`   Total weapons: ${weapons.length}`);
    console.log(`   With stats: ${weaponsWithStats.length}`);
    
    // Log type breakdown
    const typeCount: Record<string, number> = {};
    weapons.forEach(w => {
      typeCount[w.type] = (typeCount[w.type] || 0) + 1;
    });
    
    console.log('   Type breakdown:');
    for (const [type, count] of Object.entries(typeCount)) {
      console.log(`     - ${type}: ${count}`);
    }
  } catch (error) {
    console.error('Error building weapons:', error);
    throw error;
  }
}

/**
 * Get weapons data for API
 */
export async function getWeapons(): Promise<FinalWeapon[]> {
  // Try to load from final directory first
  const finalData = await loadJSON('final/weapons.json');
  
  if (finalData && Array.isArray(finalData)) {
    return finalData;
  }
  
  // If not in final, build it
  console.log('No final weapons data found, building...');
  await buildWeapons();
  
  // Return the built data
  const builtData = await loadJSON('final/weapons.json');
  return builtData || [];
}

