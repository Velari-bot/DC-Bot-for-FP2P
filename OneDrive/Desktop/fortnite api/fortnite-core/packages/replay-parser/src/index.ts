/**
 * Replay Parser
 * Parses Fortnite .replay files
 */

import * as fs from 'fs-extra';
import { Buffer } from 'buffer';
import * as path from 'path';
import { initDatabase } from '@fortnite-core/database';

// Export proper parsers if available
export { parseReplayWithProperParser } from './proper-parser';
export { parseReplayWithReplayReader } from './replay-reader-parser';
export { parseReplayWithFortniteParser } from './fortnite-replay-parser';

export interface ReplayHeader {
  magic: string;
  networkVersion: number;
  networkChecksum: number;
  engineNetworkVersion: number;
  gameNetworkProtocolVersion: number;
  guid: string;
  changelist: number;
  friendlyName: string;
  timestamp: string;
  lengthInMS: number;
  fileSize: number;
  isCompressed: boolean;
  isLive: boolean;
}

export interface ReplayMetadata {
  header: ReplayHeader;
  events?: any[];
  error?: string;
}

export interface ParseReplayResult {
  filePath: string;
  metadata: ReplayMetadata;
}

export interface PlayerPath {
  playerId: string;
  playerName: string;
  positions: Array<{
    timestamp: number;
    x: number;
    y: number;
    z: number;
  }>;
}

export interface Kill {
  timestamp: number;
  killer: string;
  victim: string;
  weapon: string;
  damage: number;
}

export interface StormCircle {
  timestamp: number;
  x: number;
  y: number;
  radius: number;
  phase: number;
}

export interface Player {
  id: string;
  name: string;
  teamId: number;
  kills: number;
  damage: number;
  loadout?: string[];
}

export interface BuildingEdit {
  timestamp: number;
  playerId: string;
  x: number;
  y: number;
  z: number;
  editType: string;
}

export interface MatchSummary {
  matchId: string;
  duration: number;
  totalPlayers: number;
  winningTeam?: number;
  playlists: string[];
}

export interface ReplayData {
  matchId: string;
  players: Player[];
  kills: Kill[];
  paths: PlayerPath[];
  storm: StormCircle[];
  buildings: BuildingEdit[];
  summary: MatchSummary;
}

/**
 * Parse Fortnite replay binary header
 */
function parseReplayHeader(buffer: Buffer, offset: number = 0): ReplayHeader | null {
  try {
    // Fortnite replay file structure (UE4 Network Replay)
    // Header starts with magic bytes
    
    // Check for compression flag at the start
    let currentOffset = offset;
    
    // Read file size and compression flag (first 4 bytes)
    const firstDword = buffer.readUInt32LE(currentOffset);
    currentOffset += 4;
    
    const isCompressed = (firstDword & 0x80000000) !== 0;
    
    // If compressed, we need to decompress first
    // For now, we'll skip full decompression in header parsing
    
    // Read magic (UE4 network replay signature)
    
    // Look for magic string "NetworkReplay"
    const networkReplayMagic = Buffer.from([0x4E, 0x65, 0x74, 0x77, 0x6F, 0x72, 0x6B, 0x52, 0x65, 0x70, 0x6C, 0x61, 0x79]); // "NetworkReplay"
    
    let magicOffset = buffer.indexOf(networkReplayMagic);
    if (magicOffset === -1) {
      // Try alternative magic patterns
      const alternativeMagic = Buffer.from([0xC1, 0x83, 0x2A, 0x9E]); // UE4 magic
      magicOffset = buffer.indexOf(alternativeMagic);
    }
    
    // Fallback: try to find readable strings in the header
    if (magicOffset === -1) {
      for (let i = 0; i < Math.min(100, buffer.length); i++) {
        if (buffer[i] === 0x4E && buffer[i + 1] === 0x65) { // "Ne"
          magicOffset = i;
          break;
        }
      }
    }
    
    // Read version information
    currentOffset = magicOffset >= 0 ? magicOffset + 20 : offset + 4;
    
    let networkVersion = 0;
    let networkChecksum = 0;
    let engineNetworkVersion = 0;
    let gameNetworkProtocolVersion = 0;
    let changelist = 0;
    let lengthInMS = 0;
    let guid = '';
    let friendlyName = '';
    let timestamp = '';
    
    // Try to read version numbers
    if (currentOffset + 16 < buffer.length) {
      networkVersion = buffer.readUInt32LE(currentOffset);
      currentOffset += 4;
      networkChecksum = buffer.readUInt32LE(currentOffset);
      currentOffset += 4;
      engineNetworkVersion = buffer.readUInt32LE(currentOffset);
      currentOffset += 4;
      gameNetworkProtocolVersion = buffer.readUInt32LE(currentOffset);
      currentOffset += 4;
    }
    
    // Try to read changelist
    if (currentOffset + 4 < buffer.length) {
      changelist = buffer.readUInt32LE(currentOffset);
      currentOffset += 4;
    }
    
    // Try to read length in MS
    if (currentOffset + 8 < buffer.length) {
      lengthInMS = buffer.readDoubleLE(currentOffset);
      currentOffset += 8;
    }
    
    // Extract GUID (16 bytes)
    if (currentOffset + 16 < buffer.length) {
      const guidBuffer = buffer.subarray(currentOffset, currentOffset + 16);
      guid = Array.from(guidBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
      currentOffset += 16;
    }
    
    // Try to extract friendly name and timestamp (strings in the header)
    // These are often UTF-8 encoded strings
    try {
      for (let i = currentOffset; i < Math.min(currentOffset + 500, buffer.length - 20); i++) {
        if (buffer[i] === 0 && i - currentOffset > 10) {
          const stringBytes = buffer.subarray(currentOffset, i);
          const potentialString = stringBytes.toString('utf8').replace(/\0/g, '');
          if (potentialString.length > 5 && /^[a-zA-Z0-9_\-:\s.]+$/.test(potentialString)) {
            if (!friendlyName) {
              friendlyName = potentialString;
            } else if (!timestamp) {
              timestamp = potentialString;
            }
          }
          currentOffset = i + 1;
          if (friendlyName && timestamp) break;
        }
      }
    } catch (e) {
      // Ignore string extraction errors
    }
    
    const fileSize = buffer.length;
    const isLive = false; // Would need to check specific flag
    
    return {
      magic: magicOffset >= 0 ? 'NetworkReplay' : 'Unknown',
      networkVersion,
      networkChecksum,
      engineNetworkVersion,
      gameNetworkProtocolVersion,
      guid,
      changelist,
      friendlyName: friendlyName || 'Unknown',
      timestamp: timestamp || 'Unknown',
      lengthInMS,
      fileSize,
      isCompressed,
      isLive
    };
  } catch (error) {
    console.error('Error parsing replay header:', error);
    return null;
  }
}

/**
 * Extract string from buffer
 */
function extractStringFromBuffer(buffer: Buffer, offset: number): string {
  try {
    let currentOffset = offset;
    
    while (currentOffset < buffer.length && buffer[currentOffset] !== 0 && currentOffset - offset < 256) {
      currentOffset++;
    }
    
    const stringBuffer = buffer.subarray(offset, currentOffset);
    return stringBuffer.toString('utf8').replace(/\0/g, '');
  } catch (e) {
    return '';
  }
}

/**
 * Improved network chunks parser
 * Uses better heuristics to find and extract replay data
 */
function parseNetworkChunks(buffer: Buffer, offset: number): {
  playerElims: Kill[];
  playerPositions: PlayerPath[];
  buildingEdits: BuildingEdit[];
  stormCircles: StormCircle[];
} {
  const playerElims: Kill[] = [];
  const playerPositions: PlayerPath[] = [];
  const buildingEdits: BuildingEdit[] = [];
  const stormCircles: StormCircle[] = [];
  
  // Track players by ID to aggregate positions
  const playerPathMap = new Map<string, PlayerPath>();
  
  let currentOffset = offset;
  const maxOffset = buffer.length - 100; // Leave buffer for safety
  
  // Look for common UE4 replay data patterns
  // UE4 replays have chunk headers with size information
  while (currentOffset < maxOffset) {
    try {
      // Look for valid float ranges (positions are typically in reasonable ranges)
      // Check if we have a potential position (x, y, z as floats)
      if (currentOffset + 20 < buffer.length) {
        const x = buffer.readFloatLE(currentOffset);
        const y = buffer.readFloatLE(currentOffset + 4);
        const z = buffer.readFloatLE(currentOffset + 8);
        const timestamp = buffer.readUInt32LE(currentOffset + 12);
        
        // Validate position data (Fortnite map is roughly -100000 to 100000)
        if (Math.abs(x) < 200000 && Math.abs(y) < 200000 && Math.abs(z) < 50000 && 
            timestamp > 0 && timestamp < 3600000) { // Timestamp < 1 hour in ms
          
          // Try to extract player ID from nearby bytes
          let playerId = '';
          for (let i = 16; i < Math.min(currentOffset + 100, buffer.length); i++) {
            if (buffer[i] >= 32 && buffer[i] <= 126) { // Printable ASCII
              const str = extractStringFromBuffer(buffer, i);
              if (str.length >= 3 && str.length < 50) {
                playerId = str;
                break;
              }
            }
          }
          
          if (!playerId) playerId = `player_${currentOffset}`;
          
          if (!playerPathMap.has(playerId)) {
            playerPathMap.set(playerId, {
              playerId,
              playerName: 'Unknown',
              positions: []
            });
          }
          
          playerPathMap.get(playerId)!.positions.push({ timestamp, x, y, z });
          currentOffset += 20; // Skip this position
          continue;
        }
      }
      
      // Look for elimination patterns
      // Eliminations often have damage values followed by player names
      if (currentOffset + 30 < buffer.length) {
        const potentialDamage = buffer.readUInt16LE(currentOffset);
        // Damage is typically 1-200
        if (potentialDamage > 0 && potentialDamage <= 200) {
          // Check if there's a player name nearby
          for (let i = currentOffset + 2; i < Math.min(currentOffset + 50, buffer.length); i++) {
            const str = extractStringFromBuffer(buffer, i);
            if (str.length >= 3 && str.length < 30 && /^[a-zA-Z0-9_]+$/.test(str)) {
              // Potential elimination
              const timestamp = buffer.readUInt32LE(Math.max(0, currentOffset - 4));
              playerElims.push({
                timestamp: timestamp || Date.now(),
                killer: str,
                victim: 'Unknown',
                weapon: 'Unknown',
                damage: potentialDamage
              });
              currentOffset += 20;
              break;
            }
          }
        }
      }
      
      // Look for storm circle data (radius values are typically large)
      if (currentOffset + 16 < buffer.length) {
        const radius = buffer.readFloatLE(currentOffset + 12);
        // Storm radius is typically 5000-50000
        if (radius > 1000 && radius < 100000) {
          const x = buffer.readFloatLE(currentOffset);
          const y = buffer.readFloatLE(currentOffset + 4);
          const timestamp = buffer.readUInt32LE(currentOffset + 8);
          
          if (timestamp > 0 && timestamp < 3600000) {
            stormCircles.push({
              timestamp,
              x,
              y,
              radius,
              phase: 0
            });
            currentOffset += 20;
            continue;
          }
        }
      }
      
      currentOffset++;
    } catch (e) {
      currentOffset++;
    }
  }
  
  // Convert player path map to array
  playerPathMap.forEach((path) => {
    if (path.positions.length > 0) {
      playerPositions.push(path);
    }
  });
  
  // Remove duplicates from eliminations (same timestamp + killer)
  const uniqueElims = new Map<string, Kill>();
  playerElims.forEach(elim => {
    const key = `${elim.timestamp}_${elim.killer}`;
    if (!uniqueElims.has(key)) {
      uniqueElims.set(key, elim);
    }
  });
  
  return {
    playerElims: Array.from(uniqueElims.values()),
    playerPositions,
    buildingEdits,
    stormCircles
  };
}

/**
 * Parse a Fortnite .replay file with full event parsing
 */
export async function parseReplayWithEvents(replayPath: string): Promise<ReplayData | null> {
  console.log(`Parsing replay with events: ${replayPath}`);
  
  try {
    const buffer = await fs.readFile(replayPath);
    const header = parseReplayHeader(buffer);
    
    if (!header) {
      console.error('Failed to parse header');
      return null;
    }
    
    // Parse events from network chunks
    // Try to find actual data start (after header and metadata)
    let dataStart = 1000;
    
    // Look for "NetworkReplay" string to find header end
    const networkReplayMagic = Buffer.from([0x4E, 0x65, 0x74, 0x77, 0x6F, 0x72, 0x6B, 0x52, 0x65, 0x70, 0x6C, 0x61, 0x79]);
    const magicIndex = buffer.indexOf(networkReplayMagic);
    if (magicIndex >= 0) {
      dataStart = magicIndex + 500; // Start after magic string + some buffer
    }
    
    const events = parseNetworkChunks(buffer, dataStart);
    
    // Generate match ID from filename
    const matchId = path.basename(replayPath, '.replay') || header.guid.slice(0, 16);
    
    // Aggregate player data
    const players: Player[] = [];
    const kills: Kill[] = events.playerElims;
    
    // Track unique players from positions
    const uniquePlayers = new Set<string>();
    events.playerPositions.forEach(path => uniquePlayers.add(path.playerId));
    
    uniquePlayers.forEach(playerId => {
      players.push({
        id: playerId,
        name: 'Unknown',
        teamId: 0,
        kills: kills.filter(k => k.killer === playerId).length,
        damage: 0,
        loadout: []
      });
    });
    
    // Create summary
    const summary: MatchSummary = {
      matchId,
      duration: header.lengthInMS,
      totalPlayers: players.length,
      winningTeam: undefined,
      playlists: []
    };
    
    // Aggregate player paths
    const paths = events.playerPositions;
    const storm = events.stormCircles;
    const buildings = events.buildingEdits;
    
    const replayData: ReplayData = {
      matchId,
      players,
      kills,
      paths,
      storm,
      buildings,
      summary
    };
    
    console.log(`Parsed ${players.length} players, ${kills.length} kills, ${paths.length} position updates`);
    
    return replayData;
  } catch (error) {
    console.error(`Error parsing replay with events:`, error);
    return null;
  }
}

/**
 * Save replay data to database
 */
export async function saveReplayData(replayData: ReplayData): Promise<void> {
  await initDatabase();
  
  const replayDir = path.join(process.cwd(), 'data', 'replays');
  await fs.ensureDir(replayDir);
  
  const filename = `${replayData.matchId}.json`;
  const filePath = path.join(replayDir, filename);
  
  await fs.writeJSON(filePath, replayData, { spaces: 2 });
  console.log(`Saved replay data to: ${filePath}`);
}

/**
 * Parse and save replay file
 */
export async function parseAndSaveReplay(replayPath: string): Promise<void> {
  const replayData = await parseReplayWithEvents(replayPath);
  
  if (replayData) {
    await saveReplayData(replayData);
  } else {
    console.error('Failed to parse replay');
  }
}

/**
 * Parse a Fortnite .replay file
 */
export const parseReplay = async (replayPath: string): Promise<ParseReplayResult> => {
  console.log(`Parsing replay file: ${replayPath}`);
  
  try {
    // Read the replay file
    const buffer = await fs.readFile(replayPath);
    
    // Parse the header
    const header = parseReplayHeader(buffer);
    
    if (!header) {
      throw new Error('Failed to parse replay header');
    }
    
    console.log(`Parsed replay header:`);
    console.log(`  Magic: ${header.magic}`);
    console.log(`  Network Version: ${header.networkVersion}`);
    console.log(`  Changelist: ${header.changelist}`);
    console.log(`  Length: ${header.lengthInMS}ms`);
    console.log(`  File Size: ${header.fileSize} bytes`);
    
    const metadata: ReplayMetadata = {
      header,
      events: [] // Header-only parsing for now
    };
    
    return {
      filePath: replayPath,
      metadata
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error parsing replay file: ${errorMessage}`);
    
    return {
      filePath: replayPath,
      metadata: {
        header: {
          magic: 'Error',
          networkVersion: 0,
          networkChecksum: 0,
          engineNetworkVersion: 0,
          gameNetworkProtocolVersion: 0,
          guid: '',
          changelist: 0,
          friendlyName: '',
          timestamp: '',
          lengthInMS: 0,
          fileSize: 0,
          isCompressed: false,
          isLive: false
        },
        error: errorMessage
      }
    };
  }
};

/**
 * Parse multiple replay files
 */
export const parseReplays = async (replayPaths: string[]): Promise<ParseReplayResult[]> => {
  console.log(`Parsing ${replayPaths.length} replay files...`);
  
  const results: ParseReplayResult[] = [];
  
  for (const replayPath of replayPaths) {
    try {
      const result = await parseReplay(replayPath);
      results.push(result);
    } catch (error) {
      console.error(`Error parsing ${replayPath}:`, error);
      results.push({
        filePath: replayPath,
        metadata: {
          header: {
            magic: 'Error',
            networkVersion: 0,
            networkChecksum: 0,
            engineNetworkVersion: 0,
            gameNetworkProtocolVersion: 0,
            guid: '',
            changelist: 0,
            friendlyName: '',
            timestamp: '',
            lengthInMS: 0,
            fileSize: 0,
            isCompressed: false,
            isLive: false
          },
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
  
  console.log(`Completed parsing ${results.length} replay files`);
  return results;
};
