/**
 * Fortnite Replay Parser
 * Uses fortnite-replay-parser npm package (correct implementation)
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ReplayData, Kill, PlayerPath, StormCircle, Player, MatchSummary } from './index';

let fortniteReplayParserAvailable = false;
let Replay: any = null;

// Try to load fortnite-replay-parser library
try {
  const parserModule = require('fortnite-replay-parser');
  // fortnite-replay-parser exports Replay as a class
  Replay = parserModule.Replay || parserModule.default?.Replay || parserModule;
  fortniteReplayParserAvailable = true;
  console.log('✅ fortnite-replay-parser library loaded');
} catch (e) {
  console.warn('⚠️  fortnite-replay-parser not available, falling back to basic parser');
  fortniteReplayParserAvailable = false;
}

/**
 * Parse replay using fortnite-replay-parser library (correct implementation)
 */
export async function parseReplayWithFortniteParser(replayPath: string): Promise<ReplayData | null> {
  console.log(`Parsing replay with fortnite-replay-parser: ${replayPath}`);

  if (!fortniteReplayParserAvailable || !Replay) {
    console.warn('fortnite-replay-parser not available, cannot use proper parser');
    return null;
  }

  try {
    // Read the replay file as buffer
    const buffer = await fs.readFile(replayPath);

    // Create Replay instance and parse
    const replay = new Replay(buffer);
    const parsedReplay = await replay.parse();

    if (!parsedReplay) {
      throw new Error('Parser returned null');
    }

    // Convert to our ReplayData format
    const matchId = path.basename(replayPath, '.replay');

    // Extract players
    const players: Player[] = [];
    if (parsedReplay.players) {
      parsedReplay.players.forEach((p: any) => {
        if (p && (p.id || p.playerId || p.name)) {
          players.push({
            id: p.id || p.playerId || p.name || 'Unknown',
            name: p.name || p.playerName || 'Unknown',
            teamId: p.teamId || p.team || 0,
            kills: p.kills || 0,
            damage: p.damage || p.damageDealt || 0,
            loadout: p.loadout || p.items || []
          });
        }
      });
    }

    // Extract eliminations/kills
    const kills: Kill[] = [];
    if (parsedReplay.eliminations || parsedReplay.events) {
      const elims = parsedReplay.eliminations || parsedReplay.events.filter((e: any) => 
        e.type === 'PlayerElim' || e.name === 'PlayerElim'
      );
      
      elims.forEach((elim: any) => {
        kills.push({
          timestamp: elim.time || elim.timestamp || 0,
          killer: elim.killer || elim.attacker || elim.killerName || 'Unknown',
          victim: elim.victim || elim.target || elim.victimName || 'Unknown',
          weapon: elim.weapon || elim.weaponName || 'Unknown',
          damage: elim.damage || elim.damageAmount || 0
        });
      });
    }

    // Extract player positions/paths
    const paths: PlayerPath[] = [];
    if (parsedReplay.locations || parsedReplay.positions) {
      // Group positions by player
      const positionsByPlayer = new Map<string, any[]>();
      
      const allPositions = parsedReplay.locations || parsedReplay.positions || [];
      allPositions.forEach((pos: any) => {
        const playerId = pos.playerId || pos.player || pos.id || 'Unknown';
        if (!positionsByPlayer.has(playerId)) {
          positionsByPlayer.set(playerId, []);
        }
        positionsByPlayer.get(playerId)!.push({
          timestamp: pos.time || pos.timestamp || 0,
          x: pos.x || pos.position?.x || 0,
          y: pos.y || pos.position?.y || 0,
          z: pos.z || pos.position?.z || 0
        });
      });

      positionsByPlayer.forEach((positions, playerId) => {
        if (positions.length > 0) {
          const player = players.find(p => p.id === playerId);
          paths.push({
            playerId,
            playerName: player?.name || 'Unknown',
            positions
          });
        }
      });
    }

    // Extract storm circles
    const storm: StormCircle[] = [];
    if (parsedReplay.storm || parsedReplay.stormPhases || parsedReplay.zoneUpdates) {
      const storms = parsedReplay.storm || parsedReplay.stormPhases || parsedReplay.zoneUpdates || [];
      storms.forEach((s: any) => {
        storm.push({
          timestamp: s.time || s.timestamp || 0,
          x: s.x || s.center?.x || s.position?.x || 0,
          y: s.y || s.center?.y || s.position?.y || 0,
          radius: s.radius || 0,
          phase: s.phase || s.stage || s.zoneIndex || 0
        });
      });
    }

    // Get duration from summary or header
    const duration = parsedReplay.summary?.lengthInMS ||
                     parsedReplay.header?.lengthInMS ||
                     parsedReplay.duration ||
                     0;

    // Create summary
    const summary: MatchSummary = {
      matchId,
      duration,
      totalPlayers: players.length || parsedReplay.summary?.totalPlayers || 0,
      winningTeam: parsedReplay.summary?.winningTeam,
      playlists: parsedReplay.summary?.playlists || []
    };

    const result: ReplayData = {
      matchId,
      players,
      kills,
      paths,
      storm,
      buildings: [], // Will be extracted from events if available
      summary
    };

    console.log(`✅ fortnite-replay-parser: ${players.length} players, ${kills.length} kills, ${paths.length} paths`);
    return result;
  } catch (error) {
    console.error('Error in fortnite-replay-parser:', error);
    throw error;
  }
}

