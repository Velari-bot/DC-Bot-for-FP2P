/**
 * Unit tests for heuristics
 */

import {
  detectFights,
  detectNoHealAfterFight,
  detectStormExposure,
  FIGHT_GAP_THRESHOLD,
  NO_HEAL_WINDOW,
  PlayerTick
} from '../src/heuristics';

const makeTick = (t: number, hp = 100, event?: string, damage?: number): PlayerTick => ({
  time: t,
  hp,
  event,
  damage
});

describe('detectFights', () => {
  test('detects single fight with gap', () => {
    const ticks = [
      makeTick(0),
      makeTick(1, 100, 'damage', 10),
      makeTick(2, 100, 'damage', 20),
      makeTick(FIGHT_GAP_THRESHOLD + 5) // gap ends fight
    ];

    const fights = detectFights(ticks);
    expect(fights.length).toBe(1);
    expect(fights[0].damage_dealt).toBe(30);
    expect(fights[0].duration).toBe(2 - 1);
  });

  test('detects two fights separated by gap', () => {
    const ticks = [
      makeTick(0, 100, 'damage', 10),
      makeTick(2, 100, 'damage', 20),
      makeTick(FIGHT_GAP_THRESHOLD + 10), // end fight 1
      makeTick(20, 100, 'damage', 40),
      makeTick(21, 100, 'damage', 10)
    ];

    const fights = detectFights(ticks);
    expect(fights.length).toBe(2);
    expect(fights[0].damage_dealt).toBe(30);
    expect(fights[1].damage_dealt).toBe(50);
  });

  test('no damage events means no fights', () => {
    const ticks = [makeTick(0), makeTick(5), makeTick(10)];
    const fights = detectFights(ticks);
    expect(fights.length).toBe(0);
  });
});

describe('detectNoHealAfterFight', () => {
  test('flags no heal after fight when hp < 75', () => {
    const fight = {
      id: 'fight1',
      type: 'fight' as const,
      start_time: 0,
      end_time: 10,
      duration: 10,
      damage_dealt: 50,
      damage_taken: 30,
      highground: 'maintained' as const,
      weapons: [],
      notes: []
    };

    const ticks = [
      makeTick(9, 60, 'damage', 20),
      makeTick(10, 60),
      makeTick(15, 60), // no heal here
      makeTick(25, 60)
    ];

    const result = detectNoHealAfterFight([fight], ticks);
    expect(result[0].notes).toContain('no_heal_after_fight');
  });

  test('does NOT flag if heal is used in window', () => {
    const fight = {
      id: 'fight1',
      type: 'fight' as const,
      start_time: 0,
      end_time: 10,
      duration: 10,
      damage_dealt: 50,
      damage_taken: 30,
      highground: 'maintained' as const,
      weapons: [],
      notes: []
    };

    const ticks = [
      makeTick(10, 60),
      makeTick(15, 60, 'heal'),
      makeTick(20, 80)
    ];

    const result = detectNoHealAfterFight([fight], ticks);
    expect(result[0].notes).not.toContain('no_heal_after_fight');
  });

  test('does NOT flag if hp ≥ 75%', () => {
    const fight = {
      id: 'fight1',
      type: 'fight' as const,
      start_time: 0,
      end_time: 10,
      duration: 10,
      damage_dealt: 50,
      damage_taken: 30,
      highground: 'maintained' as const,
      weapons: [],
      notes: []
    };

    const ticks = [
      makeTick(10, 90), // healthy hp
      makeTick(20, 90)
    ];

    const result = detectNoHealAfterFight([fight], ticks);
    expect(result[0].notes).not.toContain('no_heal_after_fight');
  });
});

describe('detectStormExposure', () => {
  test('detects HP loss without damage event as storm damage', () => {
    const ticks = [
      makeTick(0, 100),
      makeTick(5, 90), // hp drops, no damage event → storm
      makeTick(10, 80) // another storm hit
    ];

    const storms = detectStormExposure(ticks);
    expect(storms.length).toBe(2);
    expect(storms[0].type).toBe('rotation');
  });

  test('does NOT detect storm damage if event is "damage"', () => {
    const ticks = [
      makeTick(0, 100),
      makeTick(5, 80, 'damage', 20)
    ];

    const storms = detectStormExposure(ticks);
    expect(storms.length).toBe(0);
  });
});
