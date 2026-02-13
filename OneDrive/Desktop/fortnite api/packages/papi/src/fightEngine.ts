/**
 * Fight Breakdown Engine
 * 
 * Analyzes replay data to detect and break down every fight in a match.
 * This is the foundation for all other PathGen features.
 */

export interface Fight {
  fightId: string;
  startTime: number;
  endTime: number;
  duration: number; // in milliseconds
  
  // Participants
  participants: {
    epicId: string;
    username?: string;
    isPlayer: boolean; // true if this is the analyzed player
  }[];
  
  // Opening
  whoShotFirst: {
    epicId: string;
    timestamp: number;
    weaponId: string;
    damage: number;
  } | null;
  
  // Early damage (first 2 seconds)
  earlyDamage: {
    epicId: string;
    totalDamage: number;
    shots: number;
    hits: number;
  }[];
  
  // Opening weapon
  openingWeapon: {
    epicId: string;
    weaponId: string;
    damage: number;
  } | null;
  
  // Distance when fight started
  startDistance: number | null; // in game units
  
  // Time to finish
  timeToFinish: number; // milliseconds from first shot to elimination
  
  // High ground analysis
  highGround: {
    gained: string[]; // epicIds who gained high ground
    lost: string[]; // epicIds who lost high ground
    changes: Array<{
      epicId: string;
      timestamp: number;
      action: 'gained' | 'lost';
      zCoordinate: number;
    }>;
  };
  
  // Positioning throughout fight
  positioning: Array<{
    epicId: string;
    timestamp: number;
    x: number;
    y: number;
    z: number;
    distance: number; // distance to nearest opponent
  }>;
  
  // Cause of death
  eliminations: Array<{
    eliminatedEpicId: string;
    eliminatorEpicId: string;
    timestamp: number;
    cause: 'peace_control' | 'pump_shot' | 'bloom' | 'storm' | 'fall' | 'other';
    weaponId: string;
    damage: number;
    wasHeadshot: boolean;
    finalShot: boolean;
  }>;
  
  // Fight outcome
  outcome: {
    winner: string | null; // epicId of winner
    playerWon: boolean;
    playerEliminated: boolean;
  };
  
  // Statistics
  stats: {
    totalDamage: Record<string, number>; // epicId -> total damage dealt
    totalShots: Record<string, number>;
    totalHits: Record<string, number>;
    accuracy: Record<string, number>; // hits / shots
    damageTaken: Record<string, number>;
  };
}

export interface FightBreakdownResult {
  fights: Fight[];
  summary: {
    totalFights: number;
    fightsWon: number;
    fightsLost: number;
    averageFightDuration: number;
    averageTimeToFinish: number;
    firstShotAccuracy: number; // % of fights where player shot first
    earlyDamageWinRate: number; // % of fights won when dealing more early damage
  };
}

/**
 * Detect fights from shot events and player interactions
 */
export function detectFights(
  shotEvents: any[],
  movementEvents: any[],
  playerStats: any[],
  playerEpicId: string
): Fight[] {
  if (!shotEvents || shotEvents.length === 0) {
    return [];
  }

  const fights: Fight[] = [];
  const fightThreshold = 5000000; // 5 seconds in microseconds - if no shots for this long, fight ends
  const damageThreshold = 50; // Minimum damage to consider a fight

  let currentFight: Partial<Fight> | null = null;
  let lastShotTime = 0;

  // Group shot events by time proximity
  // Osirion timestamps are in microseconds
  const sortedShots = [...shotEvents].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  for (let i = 0; i < sortedShots.length; i++) {
    const shot = sortedShots[i];
    const shotTime = shot.timestamp;

    // Check if this shot is part of an ongoing fight or starts a new one
    if (!currentFight || shotTime - lastShotTime > fightThreshold) {
      // End previous fight if exists
      if (currentFight && currentFight.startTime) {
        currentFight.endTime = lastShotTime;
        if (currentFight.startTime && currentFight.endTime) {
          currentFight.duration = currentFight.endTime - currentFight.startTime;
        }
        fights.push(currentFight as Fight);
      }

      // Start new fight
      currentFight = {
        fightId: `fight_${shotTime}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: shotTime,
        participants: [],
        whoShotFirst: null,
        earlyDamage: [],
        openingWeapon: null,
        startDistance: null,
        timeToFinish: 0,
        highGround: {
          gained: [],
          lost: [],
          changes: [],
        },
        positioning: [],
        eliminations: [],
        outcome: {
          winner: null,
          playerWon: false,
          playerEliminated: false,
        },
        stats: {
          totalDamage: {},
          totalShots: {},
          totalHits: {},
          accuracy: {},
          damageTaken: {},
        },
      };

      // Record first shot
      currentFight.whoShotFirst = {
        epicId: shot.epicId || shot.hitEpicId || 'unknown',
        timestamp: shotTime,
        weaponId: shot.weaponId || 'unknown',
        damage: shot.damage || 0,
      };

      currentFight.openingWeapon = {
        epicId: shot.epicId || shot.hitEpicId || 'unknown',
        weaponId: shot.weaponId || 'unknown',
        damage: shot.damage || 0,
      };
    }

    // Track participants
    const shooterId = shot.epicId || 'unknown';
    const targetId = shot.hitEpicId || 'unknown';

    if (shooterId !== 'unknown' && !currentFight.participants.find(p => p.epicId === shooterId)) {
      currentFight.participants.push({
        epicId: shooterId,
        isPlayer: shooterId === playerEpicId,
      });
    }

    if (targetId !== 'unknown' && !currentFight.participants.find(p => p.epicId === targetId)) {
      currentFight.participants.push({
        epicId: targetId,
        isPlayer: targetId === playerEpicId,
      });
    }

    // Track damage and shots (already have shooterId and targetId from above)

    if (!currentFight.stats.totalDamage[shooterId]) {
      currentFight.stats.totalDamage[shooterId] = 0;
      currentFight.stats.totalShots[shooterId] = 0;
      currentFight.stats.totalHits[shooterId] = 0;
    }

    currentFight.stats.totalShots[shooterId]++;

    if (shot.hitPlayer && shot.damage > 0) {
      currentFight.stats.totalDamage[shooterId] += shot.damage;
      currentFight.stats.totalHits[shooterId]++;

      if (!currentFight.stats.damageTaken[targetId]) {
        currentFight.stats.damageTaken[targetId] = 0;
      }
      currentFight.stats.damageTaken[targetId] += shot.damage;
    }

    // Track early damage (first 2 seconds)
    if (currentFight.startTime && shotTime - currentFight.startTime <= 2000000) { // 2 seconds in microseconds (2 * 1,000,000)
      let earlyDamageEntry = currentFight.earlyDamage.find(e => e.epicId === shooterId);
      if (!earlyDamageEntry) {
        earlyDamageEntry = {
          epicId: shooterId,
          totalDamage: 0,
          shots: 0,
          hits: 0,
        };
        currentFight.earlyDamage.push(earlyDamageEntry);
      }

      earlyDamageEntry.shots++;
      if (shot.hitPlayer && shot.damage > 0) {
        earlyDamageEntry.totalDamage += shot.damage;
        earlyDamageEntry.hits++;
      }
    }

    // Track positioning if location data available
    if (shot.location) {
      currentFight.positioning.push({
        epicId: shooterId,
        timestamp: shotTime,
        x: shot.location.x || 0,
        y: shot.location.y || 0,
        z: shot.location.z || 0,
        distance: 0, // Will calculate if we have opponent positions
      });
    }

    // Track high ground changes (z coordinate increases)
    if (shot.location && currentFight.positioning.length > 1) {
      const prevPos = currentFight.positioning[currentFight.positioning.length - 2];
      if (prevPos && shot.location.z > prevPos.z + 1000) { // Significant z increase
        if (!currentFight.highGround.gained.includes(shooterId)) {
          currentFight.highGround.gained.push(shooterId);
          currentFight.highGround.changes.push({
            epicId: shooterId,
            timestamp: shotTime,
            action: 'gained',
            zCoordinate: shot.location.z,
          });
        }
      } else if (prevPos && shot.location.z < prevPos.z - 1000) {
        if (!currentFight.highGround.lost.includes(shooterId)) {
          currentFight.highGround.lost.push(shooterId);
          currentFight.highGround.changes.push({
            epicId: shooterId,
            timestamp: shotTime,
            action: 'lost',
            zCoordinate: shot.location.z,
          });
        }
      }
    }

    // Detect eliminations (fatal hits)
    if (shot.hitFatal && shot.hitPlayer) {
      currentFight.eliminations.push({
        eliminatedEpicId: targetId,
        eliminatorEpicId: shooterId,
        timestamp: shotTime,
        cause: determineCauseOfDeath(shot),
        weaponId: shot.weaponId || 'unknown',
        damage: shot.damage || 0,
        wasHeadshot: shot.hitCritical || false,
        finalShot: true,
      });

      // Update fight outcome
      if (currentFight.outcome) {
        currentFight.outcome.winner = shooterId;
        currentFight.outcome.playerWon = shooterId === playerEpicId;
        currentFight.outcome.playerEliminated = targetId === playerEpicId;
      }

      // Calculate time to finish
      if (currentFight.startTime) {
        currentFight.timeToFinish = shotTime - currentFight.startTime;
      }
    }

    lastShotTime = shotTime;
  }

  // Close final fight
  if (currentFight && currentFight.startTime) {
    currentFight.endTime = lastShotTime || currentFight.startTime;
    if (currentFight.startTime && currentFight.endTime) {
      currentFight.duration = currentFight.endTime - currentFight.startTime;
    }
    fights.push(currentFight as Fight);
  }

  // Calculate accuracy for each participant
  fights.forEach(fight => {
    Object.keys(fight.stats.totalShots).forEach(epicId => {
      const shots = fight.stats.totalShots[epicId];
      const hits = fight.stats.totalHits[epicId];
      if (shots > 0) {
        fight.stats.accuracy[epicId] = (hits / shots) * 100;
      }
    });
  });

  // Calculate start distance for each fight
  fights.forEach(fight => {
    if (fight.positioning.length >= 2) {
      const firstPos = fight.positioning[0];
      const secondPos = fight.positioning[1];
      if (firstPos && secondPos) {
        fight.startDistance = calculateDistance(
          firstPos.x, firstPos.y, firstPos.z,
          secondPos.x, secondPos.y, secondPos.z
        );
      }
    }
  });

  return fights;
}

/**
 * Determine cause of death from shot event
 */
function determineCauseOfDeath(shot: any): 'peace_control' | 'pump_shot' | 'bloom' | 'storm' | 'fall' | 'other' {
  const weaponId = (shot.weaponId || '').toLowerCase();

  // Peace control (usually high damage single shot)
  if (weaponId.includes('peace') || weaponId.includes('control')) {
    return 'peace_control';
  }

  // Pump shotgun
  if (weaponId.includes('pump') || weaponId.includes('thunder')) {
    return 'pump_shot';
  }

  // Bloom (usually AR/SMG with multiple shots)
  if (weaponId.includes('assault') || weaponId.includes('smg') || weaponId.includes('rifle')) {
    return 'bloom';
  }

  // Storm damage (check if it's storm-related)
  if (shot.hitResult === 'HIT_STORM' || weaponId.includes('storm')) {
    return 'storm';
  }

  // Fall damage
  if (shot.hitResult === 'HIT_FALL' || weaponId.includes('fall')) {
    return 'fall';
  }

  return 'other';
}

/**
 * Calculate 3D distance between two points
 */
function calculateDistance(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Generate fight breakdown summary
 */
export function generateFightBreakdown(
  fights: Fight[],
  playerEpicId: string
): FightBreakdownResult {
  const playerFights = fights.filter(f => 
    f.participants.some(p => p.epicId === playerEpicId)
  );

  const fightsWon = playerFights.filter(f => f.outcome.playerWon).length;
  const fightsLost = playerFights.filter(f => f.outcome.playerEliminated && !f.outcome.playerWon).length;

  const totalDuration = fights.reduce((sum, f) => sum + (f.duration || 0), 0);
  const totalTimeToFinish = fights.reduce((sum, f) => sum + (f.timeToFinish || 0), 0);

  const firstShotFights = playerFights.filter(f => 
    f.whoShotFirst?.epicId === playerEpicId
  ).length;

  const earlyDamageWins = playerFights.filter(f => {
    const playerEarly = f.earlyDamage.find(e => e.epicId === playerEpicId);
    if (!playerEarly) return false;

    const maxEarly = Math.max(...f.earlyDamage.map(e => e.totalDamage));
    return playerEarly.totalDamage === maxEarly && f.outcome.playerWon;
  }).length;

  return {
    fights,
    summary: {
      totalFights: playerFights.length,
      fightsWon,
      fightsLost,
      averageFightDuration: playerFights.length > 0 ? totalDuration / playerFights.length : 0,
      averageTimeToFinish: fights.length > 0 ? totalTimeToFinish / fights.length : 0,
      firstShotAccuracy: playerFights.length > 0 ? (firstShotFights / playerFights.length) * 100 : 0,
      earlyDamageWinRate: playerFights.length > 0 ? (earlyDamageWins / playerFights.length) * 100 : 0,
    },
  };
}

