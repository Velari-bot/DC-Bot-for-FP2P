/**
 * Generate human-readable analysis from detected events
 */

import { AnalysisResult, FightEvent, RotationEvent, GameEvent, Metrics, Drill, JumpTimestamp } from './types';

export function generateAnalysis(
  fights: FightEvent[],
  rotations: RotationEvent[],
  events: GameEvent[],
  metrics: Metrics
): AnalysisResult {
  const summary = generateSummary(fights, rotations, metrics);
  const insights = generateInsights(fights, rotations, events);
  const drills = generateDrills(fights, rotations, metrics);
  const jump_timestamps = generateJumpTimestamps(fights, rotations);

  return {
    summary,
    insights,
    drills,
    events: [...fights, ...rotations, ...events],
    metrics,
    jump_timestamps
  };
}

function generateSummary(fights: FightEvent[], rotations: RotationEvent[], metrics: Metrics): string {
  const parts: string[] = [];

  // Fight performance
  if (fights.length > 0) {
    const lostFights = fights.filter(f => f.outcome === 'lost').length;
    const highgroundLosses = fights.filter(f => f.highground === 'lost').length;
    
    if (lostFights > 0) {
      parts.push(`You lost ${lostFights} out of ${fights.length} fights`);
    }
    
    if (highgroundLosses > 0) {
      parts.push(`${highgroundLosses} fight${highgroundLosses > 1 ? 's' : ''} had highground loss during initial pressure`);
    }
  }

  // Storm/rotation issues
  if (rotations.length > 0) {
    parts.push(`You entered the storm ${rotations.length} time${rotations.length > 1 ? 's' : ''} and took damage`);
  }

  // Healing issues
  const noHealingFights = fights.filter(f => 
    f.notes?.some(n => n.includes('No healing used after fight'))
  ).length;
  if (noHealingFights > 0) {
    parts.push(`Missed opportunity to heal after ${noHealingFights} fight${noHealingFights > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return 'Overall solid gameplay. Continue focusing on consistency and positioning.';
  }

  return parts.join('. ') + '.';
}

function generateInsights(fights: FightEvent[], rotations: RotationEvent[], events: GameEvent[]): string[] {
  const insights: string[] = [];

  // Fight insights
  fights.forEach((fight, index) => {
    const fightNum = index + 1;
    const notes = fight.notes || [];
    
    if (notes.some(n => n.includes('missed'))) {
      insights.push(
        `Fight ${fightNum} at ${fight.start_time.toFixed(1)}s: ${notes.find(n => n.includes('missed')) || 'Missed shots'} — practice initial aim under pressure.`
      );
    }
    
    if (fight.highground === 'lost') {
      insights.push(
        `Fight ${fightNum}: Lost highground during fight — work on retake mechanics and maintaining position.`
      );
    }
    
    if (fight.outcome === 'lost' && fight.damage_dealt && fight.damage_taken) {
      if (fight.damage_taken > fight.damage_dealt * 2) {
        insights.push(
          `Fight ${fightNum}: Took ${fight.damage_taken} damage while dealing only ${fight.damage_dealt} — focus on defensive building and positioning.`
        );
      }
    }
  });

  // Rotation insights
  rotations.forEach((rotation, index) => {
    if (rotation.late_rotation) {
      insights.push(
        `Rotation at ${rotation.start_time.toFixed(1)}s: You entered the storm and took ${rotation.storm_damage || 0} damage — push earlier to avoid late rotation.`
      );
    }
  });

  // Healing insights
  const noHealingFights = fights.filter(f => 
    f.notes?.some(n => n.includes('No healing used after fight'))
  );
  noHealingFights.forEach((fight, index) => {
    insights.push(
      `After fight ${index + 1}: No healing used despite low HP — always heal immediately after a fight when safe.`
    );
  });

  return insights.slice(0, 6); // Limit to 6 insights
}

function generateDrills(fights: FightEvent[], rotations: RotationEvent[], metrics: Metrics): Drill[] {
  const drills: Drill[] = [];

  // Aim drills
  const missedShotFights = fights.filter(f => 
    f.notes?.some(n => n.toLowerCase().includes('missed'))
  );
  if (missedShotFights.length > 0 || metrics.avg_accuracy < 0.3) {
    drills.push({
      title: 'Aim under pressure',
      description: '5x 30-second close-quarter aim drills (use shots-only mode)',
      difficulty: 'easy'
    });
  }

  // Healing drills
  const noHealingFights = fights.filter(f => 
    f.notes?.some(n => n.includes('No healing used after fight'))
  );
  if (noHealingFights.length > 0) {
    drills.push({
      title: 'Healing timings',
      description: 'Next 3 games: always heal immediately after a fight when safe',
      difficulty: 'medium'
    });
  }

  // Highground retake drills
  const highgroundLosses = fights.filter(f => f.highground === 'lost').length;
  if (highgroundLosses > 0) {
    drills.push({
      title: 'Highground retake practice',
      description: 'Warmup 10 min in creative: retake highground vs 1 builder',
      difficulty: 'hard'
    });
  }

  // Rotation drills
  if (rotations.length > 0) {
    drills.push({
      title: 'Early rotation practice',
      description: 'Next 5 games: start rotating when storm timer hits 1:30 remaining',
      difficulty: 'medium'
    });
  }

  // Positioning drills
  if (metrics.fight_win_rate < 0.4) {
    drills.push({
      title: 'Defensive positioning',
      description: 'Focus on taking favorable angles and building defensive structures before engaging',
      difficulty: 'medium'
    });
  }

  // Ensure at least 3 drills
  if (drills.length < 3) {
    drills.push({
      title: 'General improvement',
      description: 'Review your replays and identify 1-2 key areas to focus on each game',
      difficulty: 'easy'
    });
  }

  return drills.slice(0, 3); // Return top 3 drills
}

function generateJumpTimestamps(fights: FightEvent[], rotations: RotationEvent[]): JumpTimestamp[] {
  const timestamps: JumpTimestamp[] = [];

  fights.forEach((fight, index) => {
    timestamps.push({
      label: `Fight ${index + 1}`,
      time: fight.start_time
    });
  });

  rotations.forEach((rotation, index) => {
    timestamps.push({
      label: `Rotation ${index + 1}`,
      time: rotation.start_time
    });
  });

  return timestamps.sort((a, b) => a.time - b.time);
}

