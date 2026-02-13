/**
 * Heuristic-based event detection for gameplay analysis
 */

import { GameEvent, FightEvent, RotationEvent, Metrics } from './types';

export const FIGHT_GAP_THRESHOLD = 8; // seconds
export const HIGHGROUND_THRESHOLD = 2; // meters
export const NO_HEAL_WINDOW = 20; // seconds after fight
const HEALING_WINDOW = NO_HEAL_WINDOW; // alias
export const LOW_HP_THRESHOLD = 75; // percentage

// Helper type for parsed timeline
export interface PlayerTick {
  time: number;
  hp: number;
  shields?: number;
  position?: { x: number; y: number; z: number };
  event?: string; // e.g., 'damage', 'heal', 'build'
  damage?: number;
  weapon?: string;
}

/**
 * Detect fights from player ticks
 * Rule: Consecutive damage events separated by < 8s → same fight; gap > 8s → new fight
 */
export function detectFights(ticks: PlayerTick[]): FightEvent[] {
  const fights: FightEvent[] = [];
  let current: PlayerTick[] = [];

  for (let i = 0; i < ticks.length; i++) {
    const t = ticks[i];
    if (t.event === 'damage' || (t.damage && t.damage > 0)) {
      current.push(t);
    } else {
      // gap detection
      if (current.length > 0) {
        const last = current[current.length - 1];
        const gap = t.time - last.time;
        if (gap > FIGHT_GAP_THRESHOLD) {
          // finalize fight
          fights.push(buildFightEvent(current));
          current = [];
        }
      }
    }
  }
  if (current.length > 0) fights.push(buildFightEvent(current));
  return fights;
}

function buildFightEvent(chunk: PlayerTick[]): FightEvent {
  const start = chunk[0].time;
  const end = chunk[chunk.length - 1].time;
  const duration = end - start;
  const damage_dealt = chunk.reduce((s, c) => s + (c.damage || 0), 0);
  const damage_taken = 0; // placeholder - would need separate tracking
  const weapons = Array.from(new Set(chunk.filter(c => c.weapon).map(c => c.weapon!)));
  const notes: string[] = [];

  // naive highground detection placeholder
  const zDiff = (chunk[0].position?.z || 0) - (chunk[chunk.length - 1].position?.z || 0);
  if (zDiff > HIGHGROUND_THRESHOLD) notes.push('highground lost');

  return {
    id: `fight_${start}_${end}`,
    type: 'fight',
    start_time: start,
    end_time: end,
    duration,
    outcome: 'disengaged',
    damage_dealt,
    damage_taken,
    highground: zDiff > HIGHGROUND_THRESHOLD ? 'lost' : 'maintained',
    weapons,
    notes
  };
}

/**
 * Detect no healing after fight
 * Attach note to events where no heal used in NO_HEAL_WINDOW and HP < 75%
 */
export function detectNoHealAfterFight(events: FightEvent[], ticks: PlayerTick[]): FightEvent[] {
  const newEvents = events.map(e => ({ ...e }));
  for (const ev of newEvents) {
    if (ev.type !== 'fight' || !ev.end_time) continue;

    const windowStart = ev.end_time;
    const windowEnd = windowStart + NO_HEAL_WINDOW;

    const ticksWindow = ticks.filter(t => t.time >= windowStart && t.time <= windowEnd);
    const healed = ticksWindow.some(t => t.event === 'heal');

    const lastHp = ticks.find(t => t.time <= (ev.end_time || 0)) || { hp: 100 };
    if (!healed && (lastHp.hp < LOW_HP_THRESHOLD)) {
      ev.notes = ev.notes || [];
      ev.notes.push('no_heal_after_fight');
    }
  }
  return newEvents;
}

/**
 * Detect storm exposure
 * Simplistic: if HP decreases without 'damage' event and inside storm -> storm
 */
export function detectStormExposure(ticks: PlayerTick[], endTime?: number): RotationEvent[] {
  const stormEvents: RotationEvent[] = [];
  for (let i = 1; i < ticks.length; i++) {
    const prev = ticks[i - 1];
    const cur = ticks[i];
    if ((cur.hp < prev.hp) && cur.event !== 'damage') {
      stormEvents.push({
        id: `storm_${cur.time}`,
        type: 'rotation',
        start_time: cur.time,
        storm_damage: prev.hp - cur.hp,
        late_rotation: true,
        notes: ['possible_storm_damage']
      });
    }
  }
  return stormEvents;
}

/**
 * Detect highground loss during fights
 * Rule: Vertical position decrease of > 2 meters during fight OR building count decreases
 */
export function detectHighgroundLoss(
  fights: FightEvent[],
  positionEvents: PlayerTick[],
  buildingEvents: PlayerTick[]
): void {
  for (const fight of fights) {
    const fightPositionEvents = positionEvents.filter(
      t => t.time >= fight.start_time && 
           t.time <= (fight.end_time || fight.start_time + 10)
    );

    if (fightPositionEvents.length < 2) continue;

    const startZ = fightPositionEvents[0].position?.z || 0;
    const endZ = fightPositionEvents[fightPositionEvents.length - 1].position?.z || 0;
    const zDelta = startZ - endZ;

    if (zDelta > HIGHGROUND_THRESHOLD) {
      fight.highground = 'lost';
      fight.notes = fight.notes || [];
      fight.notes.push('Lost highground during fight');
    } else if (zDelta < -HIGHGROUND_THRESHOLD) {
      fight.highground = 'gained';
    } else {
      fight.highground = 'maintained';
    }
  }
}

// Legacy function name for backward compatibility
export const detectNoHealingAfterFight = detectNoHealAfterFight;

/**
 * Calculate metrics from events
 */
export function calculateMetrics(
  fights: FightEvent[],
  events: any[],
  rotations: RotationEvent[]
): Metrics {
  const totalDamage = fights.reduce((sum, f) => sum + (f.damage_dealt || 0), 0);
  const totalFights = fights.length;
  const wonFights = fights.filter(f => f.outcome === 'won').length;
  const avgFightDuration = totalFights > 0
    ? fights.reduce((sum, f) => sum + (f.duration || 0), 0) / totalFights
    : 0;
  const fightWinRate = totalFights > 0 ? wonFights / totalFights : 0;
  const timesInStorm = rotations.length;

  // Calculate accuracy (shots hit / shots fired)
  const shotsFired = events.filter((e: any) => e.type === 'shot_fired').length;
  const shotsHit = events.filter((e: any) => e.type === 'shot_hit').length;
  const avgAccuracy = shotsFired > 0 ? shotsHit / shotsFired : 0.3; // default 0.3 if no data

  // Loot efficiency (simplified: items collected / time)
  const lootEvents = events.filter((e: any) => e.type === 'item_collected').length;
  const duration = events.length > 0 && events[events.length - 1].timestamp
    ? events[events.length - 1].timestamp - events[0].timestamp
    : 1;
  const lootEfficiencyScore = duration > 0 ? Math.min(lootEvents / (duration / 60), 1) : 0.5; // items per minute, capped at 1

  return {
    total_damage: totalDamage,
    avg_fight_duration: avgFightDuration,
    fight_win_rate: fightWinRate,
    avg_accuracy: avgAccuracy,
    times_in_storm: timesInStorm,
    loot_efficiency_score: lootEfficiencyScore,
    total_fights: totalFights,
    total_kills: events.filter((e: any) => e.type === 'elimination').length,
    total_deaths: events.filter((e: any) => e.type === 'death').length
  };
}
