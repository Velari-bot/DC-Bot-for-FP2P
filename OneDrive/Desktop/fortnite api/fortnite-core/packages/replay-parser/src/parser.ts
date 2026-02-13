/**
 * Replay Parser
 * Parses replay files and extracts match data
 */

import { parseReplayWithEvents, saveReplayData } from './index';
import { saveJSON } from '@fortnite-core/database';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface ParsedReplay {
  matchId: string;
  players: string[];
  eliminations: number;
  duration: number;
  mapVersion?: string;
  timestamp: string;
  filePath: string;
}

/**
 * Parse a replay file and extract key information
 */
export async function parseReplayFile(replayPath: string): Promise<ParsedReplay | null> {
  console.log(`Parsing replay: ${replayPath}`);
  
  try {
    // Use the existing replay parser with events
    const replayData = await parseReplayWithEvents(replayPath);
    
    if (!replayData) {
      console.error('Failed to parse replay');
      return null;
    }
    
    // Extract key information
    const players = replayData.players.map(p => p.id);
    const eliminations = replayData.kills.length;
    const duration = replayData.summary.duration;
    
    const parsed: ParsedReplay = {
      matchId: replayData.matchId,
      players,
      eliminations,
      duration,
      mapVersion: undefined,
      timestamp: new Date().toISOString(),
      filePath: replayPath
    };
    
    console.log(`Parsed replay: ${parsed.matchId}`);
    console.log(`  Players: ${players.length}`);
    console.log(`  Eliminations: ${eliminations}`);
    console.log(`  Duration: ${duration}ms`);
    
    return parsed;
  } catch (error) {
    console.error('Error parsing replay file:', error);
    return null;
  }
}

/**
 * Parse and save replay to final directory
 */
export async function parseAndSave(replayPath: string): Promise<void> {
  const parsed = await parseReplayFile(replayPath);
  
  if (!parsed) {
    throw new Error('Failed to parse replay');
  }
  
  // Also save using the existing replay data structure
  const replayData = await parseReplayWithEvents(replayPath);
  
  if (replayData) {
    await saveReplayData(replayData);
  }
  
  // Save parsed summary to final directory
  const finalPath = `final/replays/${parsed.matchId}.json`;
  await saveJSON(finalPath, parsed);
  
  console.log(`Saved parsed replay to: ${finalPath}`);
}

/**
 * Batch parse all replay files in directory
 */
export async function parseAllReplays(): Promise<void> {
  console.log('Parsing all replay files...');
  
  const replaysDir = path.join(process.cwd(), 'data', 'replays');
  
  if (!await fs.pathExists(replaysDir)) {
    console.log('No replays directory found');
    return;
  }
  
  const files = await fs.readdir(replaysDir);
  const replayFiles = files.filter(f => f.endsWith('.replay'));
  
  console.log(`Found ${replayFiles.length} replay files`);
  
  for (const file of replayFiles) {
    const filePath = path.join(replaysDir, file);
    
    try {
      await parseAndSave(filePath);
    } catch (error) {
      console.error(`Error parsing ${file}:`, error);
    }
  }
  
  console.log('✅ All replays parsed');
}

