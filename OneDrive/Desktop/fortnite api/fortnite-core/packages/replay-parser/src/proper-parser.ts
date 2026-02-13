/**
 * Proper Fortnite Replay Parser
 * Uses fortnite-replay-parser library for accurate parsing
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ReplayData, Kill, PlayerPath, StormCircle, Player, MatchSummary } from './index';

let fortniteReplayParserAvailable = false;
let parseReplay: any = null;

// Try to load fortnite-replay-parser library
try {
  parseReplay = require('fortnite-replay-parser');
  fortniteReplayParserAvailable = true;
  console.log('✅ fortnite-replay-parser library loaded');
} catch (e) {
  console.warn('⚠️  fortnite-replay-parser not available, falling back to basic parser');
  fortniteReplayParserAvailable = false;
}

/**
 * Parse replay using proper library
 */
export async function parseReplayWithProperParser(replayPath: string): Promise<ReplayData | null> {
  console.log(`Parsing replay with proper parser: ${replayPath}`);
  
  if (!fortniteReplayParserAvailable || !parseReplay) {
    console.warn('fortnite-replay-parser not available, cannot use proper parser');
    return null;
  }

  try {
    const buffer = await fs.readFile(replayPath);
    
    // Use fortnite-replay-parser to parse the file
    // Try different config options to handle various replay versions
    let parsedReplay = null;
    let lastError = null;
    
    // Try different parse levels and configurations
    const configs = [
      { parseLevel: 5, debug: false },  // Lower parse level
      { parseLevel: 3, debug: false },  // Even lower
      { parseLevel: 1, debug: false },  // Minimal parsing
      { debug: false },                 // Default config
    ];
    
    for (const config of configs) {
      try {
        parsedReplay = await parseReplay(buffer, config);
        if (parsedReplay) {
          console.log(`✅ Successfully parsed with config:`, config);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.log(`⚠️  Config failed:`, config, err.message);
        // Continue to next config
      }
    }
    
    // If all configs failed, try without config
    if (!parsedReplay) {
      try {
        parsedReplay = await parseReplay(buffer);
      } catch (err: any) {
        lastError = err;
        console.log(`⚠️  Default parse also failed:`, err.message);
      }
    }
    
    if (!parsedReplay) {
      console.error('fortnite-replay-parser failed with all configs');
      if (lastError) {
        console.error('Last error:', lastError.message);
      }
      throw new Error(`Parser failed: ${lastError?.message || 'Unknown error'}`);
    }

    // Convert fortnite-replay-parser output to our ReplayData format
    const matchId = path.basename(replayPath, '.replay');
    
    // Extract kills/eliminations
    const kills: Kill[] = [];
    if (parsedReplay.events) {
      // Look for elimination events
      parsedReplay.events.forEach((event: any) => {
        if (event.type === 'elimination' || event.name === 'PlayerElim' || event.eventName === 'PlayerElim') {
          kills.push({
            timestamp: event.time || event.timestamp || 0,
            killer: event.killer || event.attacker || event.killerName || event.attackerName || 'Unknown',
            victim: event.victim || event.target || event.victimName || event.targetName || 'Unknown',
            weapon: event.weapon || event.weaponName || 'Unknown',
            damage: event.damage || event.damageAmount || 0
          });
        }
      });
    }

    // Extract player positions
    const paths: PlayerPath[] = [];
    const playersData = parsedReplay.players || parsedReplay.Players || parsedReplay.playerPaths || 
                        parsedReplay.data?.players || [];
    
    playersData.forEach((player: any) => {
      if (!player) return;
      const positions = player.positions || player.Positions || player.path || player.Path || [];
      if (positions && positions.length > 0) {
        paths.push({
          playerId: player.id || player.playerId || player.Id || player.name || player.Name || 'Unknown',
          playerName: player.name || player.playerName || player.Name || 'Unknown',
          positions: positions.map((pos: any) => ({
            timestamp: pos.timestamp || pos.time || pos.Time || pos.gameTime || 0,
            x: pos.x || pos.X || pos.position?.x || pos.Position?.x || 0,
            y: pos.y || pos.Y || pos.position?.y || pos.Position?.y || 0,
            z: pos.z || pos.Z || pos.position?.z || pos.Position?.z || 0
          }))
        });
      }
    });

    // Extract storm circles
    const storm: StormCircle[] = [];
    if (parsedReplay.storm || parsedReplay.stormCircles) {
      const storms = parsedReplay.storm || parsedReplay.stormCircles || [];
      storms.forEach((s: any) => {
        storm.push({
          timestamp: s.timestamp || s.time || 0,
          x: s.x || s.center?.x || 0,
          y: s.y || s.center?.y || 0,
          radius: s.radius || 0,
          phase: s.phase || s.stage || 0
        });
      });
    }

    // Extract players
    const players: Player[] = [];
    const playersList = parsedReplay.players || parsedReplay.Players || parsedReplay.data?.players || [];
    
    playersList.forEach((p: any) => {
      if (typeof p === 'object' && (p.id || p.playerId || p.Id || p.name || p.Name)) {
        const playerId = p.id || p.playerId || p.Id || p.name || p.Name || 'Unknown';
        players.push({
          id: playerId,
          name: p.name || p.playerName || p.Name || 'Unknown',
          teamId: p.teamId || p.team || p.TeamId || 0,
          kills: p.kills || p.Kills || kills.filter(k => k.killer === playerId).length,
          damage: p.damage || p.damageDealt || p.Damage || 0,
          loadout: p.loadout || p.items || p.Items || []
        });
      }
    });

    // Get duration from header or metadata
    const duration = parsedReplay.header?.lengthInMS || 
                     parsedReplay.metadata?.duration || 
                     parsedReplay.duration ||
                     parsedReplay.Header?.lengthInMS ||
                     parsedReplay.Metadata?.duration || 0;

    // Create summary
    const summary: MatchSummary = {
      matchId,
      duration,
      totalPlayers: players.length || parsedReplay.metadata?.totalPlayers || 0,
      winningTeam: parsedReplay.metadata?.winningTeam,
      playlists: parsedReplay.metadata?.playlists || []
    };

    const result: ReplayData = {
      matchId,
      players,
      kills,
      paths,
      storm,
      buildings: [], // May not be available in parsed data
      summary
    };

    console.log(`✅ Proper parser: ${players.length} players, ${kills.length} kills, ${paths.length} paths`);
    return result;
  } catch (error) {
    console.error('Error in proper parser:', error);
    return null;
  }
}

