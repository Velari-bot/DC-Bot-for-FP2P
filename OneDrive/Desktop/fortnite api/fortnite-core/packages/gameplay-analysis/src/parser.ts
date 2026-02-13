/**
 * Parse replay files and video clips to extract events
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { parseReplayWithEvents, parseReplayWithReplayReader, parseReplayWithFortniteParser } from '@fortnite-core/replay-parser';
import { RawEvent, ParsedReplayData } from './types';

// Check if real parsers are available
let useRealParser = true;
let replayReaderAvailable = false;
let fortniteParserAvailable = false;
try {
  require.resolve('@fortnite-core/replay-parser');
  // Check if replay-reader is available
  try {
    require.resolve('replay-reader');
    replayReaderAvailable = true;
  } catch (e) {
    // replay-reader not available
  }
  // Check if fortnite-replay-parser is available
  try {
    require.resolve('fortnite-replay-parser');
    fortniteParserAvailable = true;
  } catch (e) {
    // fortnite-replay-parser not available
  }
} catch (e) {
  useRealParser = false;
}

/**
 * Parse a replay file and convert to raw events
 */
export async function parseReplayFile(
  filePath: string,
  playerId: string
): Promise<ParsedReplayData> {
  // Mock implementation: read a synthetic JSON if file ends with .json (for tests)
  if (filePath.endsWith('.json')) {
    const raw = await fs.readFile(filePath, 'utf-8');
    const arr = JSON.parse(raw) as any[];
    // Convert to RawEvent format (for compatibility with existing code)
    const events: RawEvent[] = arr.map((tick, i) => ({
      timestamp: tick.time || i,
      type: tick.event === 'damage' ? 'damage_dealt' : 'other',
      data: { 
        amount: tick.damage || 0, 
        weapon: tick.weapon,
        hp: tick.hp || 100,
        shields: tick.shields
      }
    }));
    return {
      player_id: playerId,
      events,
      duration: arr.length > 0 ? arr[arr.length - 1].time : 0
    };
  }

  if (!useRealParser) {
    // Fallback: return empty timeline
    return {
      player_id: playerId,
      events: [],
      duration: 0
    };
  }

  try {
    // Try parsers in order of accuracy:
    // 1. fortnite-replay-parser (official, most comprehensive)
    // 2. replay-reader (alternative)
    // 3. Basic parser (fallback)
    let replayData = null;
    
    if (fortniteParserAvailable) {
      try {
        console.log('Using fortnite-replay-parser (official parser)...');
        replayData = await parseReplayWithFortniteParser(filePath);
        if (replayData) {
          console.log('✅ Successfully parsed with fortnite-replay-parser');
        }
      } catch (err: any) {
        console.warn(`⚠️  fortnite-replay-parser failed: ${err.message}, trying alternatives...`);
      }
    }
    
    if (!replayData && replayReaderAvailable) {
      try {
        console.log('Using replay-reader parser...');
        replayData = await parseReplayWithReplayReader(filePath);
        if (replayData) {
          console.log('✅ Successfully parsed with replay-reader');
        }
      } catch (err: any) {
        console.warn(`⚠️  replay-reader failed: ${err.message}, falling back to basic parser`);
      }
    }
    
    // Fallback to improved basic parser if all else fails
    if (!replayData) {
      console.log('Using improved basic replay parser...');
      replayData = await parseReplayWithEvents(filePath);
    }
    
    if (!replayData) {
      throw new Error('Failed to parse replay file');
    }

    // Convert replay data to raw events
    // Include ALL players in the game, not just the specified player
    const events: RawEvent[] = [];

    // Add kill events (each kill represents one elimination)
    // NOTE: The current parser may produce inaccurate data as it uses basic byte pattern matching
    // Many fields may be 'Unknown' or 0 because the parser can't properly deserialize UE4 replay format
    replayData.kills.forEach((kill: any) => {
      // Only add one elimination event per kill (not separate elimination + death)
      // The kill event itself represents the elimination
      events.push({
        timestamp: kill.timestamp / 1000, // Convert ms to seconds
        type: 'elimination',
        data: {
          killer: kill.killer || 'Unknown',
          victim: kill.victim || 'Unknown',
          weapon: kill.weapon || 'Unknown',
          damage: kill.damage || 0,
          player_id: kill.killer || 'Unknown',
          // Note: victim, weapon, and damage may be 'Unknown' or 0 due to parser limitations
          parser_accuracy: 'low' // Current parser uses basic pattern matching
        }
      });
    });

    // Add position events for ALL players
    replayData.paths.forEach((playerPath: any) => {
      playerPath.positions.forEach((pos: any) => {
        events.push({
          timestamp: pos.timestamp / 1000,
          type: 'position',
          data: {
            x: pos.x,
            y: pos.y,
            z: pos.z,
            player_id: playerPath.playerId // Track which player this position belongs to
          }
        });
      });
    });

    // Add storm events
    replayData.storm.forEach((storm: any) => {
      events.push({
        timestamp: storm.timestamp / 1000,
        type: 'storm_update',
        data: {
          x: storm.x,
          y: storm.y,
          radius: storm.radius,
          phase: storm.phase
        }
      });
    });

    // Sort events by timestamp
    events.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate duration from replay header (in milliseconds) or from last event
    let duration = 0;
    if (replayData.summary?.duration) {
      duration = replayData.summary.duration / 1000; // Convert ms to seconds
    } else if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      duration = lastEvent.timestamp;
    }

    return {
      player_id: playerId,
      events,
      duration,
      // Include raw replay metadata
      metadata: {
        match_id: replayData.matchId,
        total_players: replayData.summary?.totalPlayers || replayData.players?.length || replayData.paths?.length || 0,
        total_kills: replayData.kills?.length || 0,
        game_mode: 'unknown', // MatchSummary doesn't have gameMode
        map_name: 'unknown', // MatchSummary doesn't have mapName
        // Include raw player list
        players: replayData.players?.map((p: any) => ({
          id: p.id,
          name: p.name,
          teamId: p.teamId,
          kills: p.kills,
          damage: p.damage
        })) || [],
        // Parser limitations
        parser_note: fortniteParserAvailable 
          ? 'Parsed with fortnite-replay-parser (official parser) - data should be accurate.'
          : replayReaderAvailable 
            ? 'Parsed with replay-reader library - data should be accurate.'
            : 'Current parser uses basic byte pattern matching. Many fields may be incomplete or inaccurate. For production use, consider integrating a proper Fortnite replay parser library.'
      }
    };
  } catch (error) {
    console.error('Error parsing replay file:', error);
    throw error;
  }
}

/**
 * Parse a video clip (mock implementation - would use ffmpeg + vision model in production)
 */
export async function parseVideoClip(
  filePath: string,
  playerId: string,
  startTime?: number,
  endTime?: number
): Promise<ParsedReplayData> {
  // Mock implementation: placeholder where ffmpeg + OCR would be used.
  // For now, return empty. In production you'd call ffmpeg, extract HUD crops, run OCR/vision.
  
  console.log(`Parsing video clip: ${filePath} (${startTime || 0}s - ${endTime || 'end'})`);
  
  // For MVP, return mock events based on video duration
  const estimatedDuration = endTime ? (endTime - (startTime || 0)) : 30; // Default 30s
  
  const events: RawEvent[] = [];
  
  // Mock a single fight in the clip
  const fightStart = startTime || 0;
  const fightEnd = fightStart + 10;
  
  events.push({
    timestamp: fightStart,
    type: 'damage_dealt',
    data: { amount: 45, weapon: 'SCAR' }
  });
  
  events.push({
    timestamp: fightStart + 2,
    type: 'damage_taken',
    data: { amount: 80, weapon: 'Shotgun' }
  });
  
  events.push({
    timestamp: fightStart + 5,
    type: 'damage_dealt',
    data: { amount: 30, weapon: 'SCAR' }
  });
  
  events.push({
    timestamp: fightEnd,
    type: 'death',
    data: { killer: 'Opponent', weapon: 'Shotgun', damage: 120 }
  });

  return {
    player_id: playerId,
    events,
    duration: estimatedDuration
  };
}

/**
 * Clean up temporary files
 */
export async function cleanupFile(filePath: string): Promise<void> {
  try {
    await fs.remove(filePath);
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error);
  }
}

