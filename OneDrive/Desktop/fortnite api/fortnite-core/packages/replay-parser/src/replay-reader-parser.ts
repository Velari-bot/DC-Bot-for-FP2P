/**
 * Replay Reader Parser
 * Uses replay-reader library for accurate Fortnite replay parsing
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ReplayData, Kill, PlayerPath, StormCircle, Player, MatchSummary } from './index';

let replayReaderAvailable = false;
let ReplayReader: any = null;

// Try to load replay-reader library
try {
  const replayReaderModule = require('replay-reader');
  // replay-reader exports ReplayReader as a class or object
  ReplayReader = replayReaderModule.ReplayReader || replayReaderModule;
  replayReaderAvailable = true;
  console.log('✅ replay-reader library loaded');
} catch (e) {
  console.warn('⚠️  replay-reader not available, falling back to basic parser');
  replayReaderAvailable = false;
}

/**
 * Parse replay using replay-reader library
 */
export async function parseReplayWithReplayReader(replayPath: string): Promise<ReplayData | null> {
  console.log(`Parsing replay with replay-reader: ${replayPath}`);

  if (!replayReaderAvailable || !ReplayReader) {
    console.warn('replay-reader not available, cannot use proper parser');
    return null;
  }

  try {
    // Read the replay file
    const buffer = await fs.readFile(replayPath);

    // Parse with replay-reader
    // replay-reader can parse buffers directly
    let parsedReplay: any = null;
    
    try {
      // replay-reader can parse buffers or file paths
      // Try parsing the buffer directly
      if (ReplayReader.parse) {
        parsedReplay = await ReplayReader.parse(buffer);
      } else if (ReplayReader.default && ReplayReader.default.parse) {
        parsedReplay = await ReplayReader.default.parse(buffer);
      } else {
        // Try as a class instance
        const reader = new ReplayReader(buffer);
        parsedReplay = await reader.parse();
      }
    } catch (err: any) {
      console.warn(`⚠️  Default parse failed: ${err.message}`);
      // Try parsing with file path instead
      try {
        if (ReplayReader.parse) {
          parsedReplay = await ReplayReader.parse(replayPath);
        } else if (ReplayReader.default && ReplayReader.default.parse) {
          parsedReplay = await ReplayReader.default.parse(replayPath);
        }
      } catch (err2: any) {
        console.error(`❌ All parse attempts failed: ${err2.message}`);
        throw err2;
      }
    }

    if (!parsedReplay) {
      throw new Error('Parser returned null');
    }

    // Convert replay-reader output to our ReplayData format
    const matchId = path.basename(replayPath, '.replay');

    // Extract kills/eliminations
    const kills: Kill[] = [];
    if (parsedReplay.events) {
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
    const playersData = parsedReplay.players || parsedReplay.Players || parsedReplay.playerPaths || [];

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
    const playersList = parsedReplay.players || parsedReplay.Players || [];

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

    console.log(`✅ Replay-reader parser: ${players.length} players, ${kills.length} kills, ${paths.length} paths`);
    return result;
  } catch (error) {
    console.error('Error in replay-reader parser:', error);
    throw error;
  }
}

