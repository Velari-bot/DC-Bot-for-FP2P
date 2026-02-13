import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

interface WeaponStat {
  stat: string;
  common?: number | string;
  uncommon?: number | string;
  rare?: number | string;
  epic?: number | string;
  legendary?: number | string;
  mythic?: number | string;
}

interface WeaponData {
  name: string;
  season: string;
  chapter: string;
  stats: WeaponStat[];
  specialVariants?: Array<{
    name: string;
    rarity: string;
    stats: WeaponStat[];
  }>;
}

// Chapter 6 Season 1 Weapon Stats
const WEAPON_STATS: WeaponData[] = [
  {
    name: 'Deadeye Assault Rifle',
    chapter: '6',
    season: '1',
    stats: [
      { stat: 'Damage', common: 22, uncommon: 23, rare: 24, epic: 25, legendary: 26, mythic: 28 },
      { stat: 'Headshot Damage (+75%)', common: 38.5, uncommon: 40.25, rare: 42, epic: 43.75, legendary: 45.5, mythic: 52.91 },
      { stat: 'Structure Damage', common: 22, uncommon: 23, rare: 24, epic: 25, legendary: 26, mythic: 28 },
      { stat: 'Fire Rate', common: '5.5/s', uncommon: '5.5/s', rare: '5.5/s', epic: '5.5/s', legendary: '5.5/s', mythic: '5.5/s' },
      { stat: 'DPS', common: '121/s', uncommon: '126.5/s', rare: '132/s', epic: '137.5/s', legendary: '143/s', mythic: '154/s' },
      { stat: 'Clip Size', common: 26, uncommon: 26, rare: 26, epic: 26, legendary: 26, mythic: 26 },
      { stat: 'Reload Time', common: '2s', uncommon: '2s', rare: '2s', epic: '2s', legendary: '2s', mythic: '2s' },
      { stat: 'Vertical Recoil', common: 3.85, uncommon: 3.67, rare: 3.5, epic: 3.32, legendary: 3.15, mythic: 2.97 },
      { stat: 'Horizontal Recoil', common: 0.25, uncommon: 0.25, rare: 0.25, epic: 0.25, legendary: 0.25, mythic: 0.25 },
      { stat: 'ADS Vertical Recoil (-42%)', common: 2.23, uncommon: 2.13, rare: 2.03, epic: 1.92, legendary: 1.82, mythic: 1.72 },
      { stat: 'ADS Horizontal Recoil (-42%)', common: 0.14, uncommon: 0.14, rare: 0.14, epic: 0.14, legendary: 0.14, mythic: 0.14 },
      { stat: 'Spread', common: 2, uncommon: 2, rare: 2, epic: 2, legendary: 2, mythic: 2 },
      { stat: 'Spread ADS (-92%)', common: 0.16, uncommon: 0.16, rare: 0.16, epic: 0.16, legendary: 0.16, mythic: 0.16 },
      { stat: 'ADS In Time', common: '175ms', uncommon: '175ms', rare: '175ms', epic: '175ms', legendary: '175ms', mythic: '175ms' },
      { stat: 'ADS Out Time', common: '225ms', uncommon: '225ms', rare: '225ms', epic: '225ms', legendary: '225ms', mythic: '225ms' },
    ],
  },
  {
    name: 'Enforcer AR',
    chapter: '6',
    season: '1',
    stats: [
      { stat: 'Damage', uncommon: 33, common: 35, rare: 37, epic: 39, legendary: 41, mythic: 45 },
      { stat: 'Headshot Damage (+70%)', uncommon: 56.1, common: 59.5, rare: 62.9, epic: 66.3, legendary: 69.7, mythic: 76.5 },
      { stat: 'Structure Damage', uncommon: 33, common: 35, rare: 37, epic: 39, legendary: 41, mythic: 43 },
      { stat: 'Fire Rate', uncommon: '3.9/s', common: '3.9/s', rare: '3.9/s', epic: '3.9/s', legendary: '3.9/s', mythic: '3.9/s' },
      { stat: 'DPS', uncommon: '128.7/s', common: '136.5/s', rare: '144.29/s', epic: '152.1/s', legendary: '159.9/s', mythic: '175.5/s' },
      { stat: 'Clip Size', uncommon: 20, common: 20, rare: 20, epic: 20, legendary: 20, mythic: 20 },
      { stat: 'Reload Time', uncommon: '2s', common: '2s', rare: '2s', epic: '2s', legendary: '2s', mythic: '1s' },
      { stat: 'Vertical Recoil', uncommon: 4.4, common: 4.2, rare: 4, epic: 3.8, legendary: 3.6, mythic: 3.1 },
      { stat: 'Horizontal Recoil', uncommon: 0.5, common: 0.5, rare: 0.5, epic: 0.5, legendary: 0.5, mythic: 0.5 },
      { stat: 'ADS Vertical Recoil (-60%)', uncommon: 1.76, common: 1.68, rare: 1.6, epic: 1.52, legendary: 1.44, mythic: 1.24 },
      { stat: 'ADS Horizontal Recoil (-60%)', uncommon: 0.2, common: 0.2, rare: 0.2, epic: 0.2, legendary: 0.2, mythic: 0.2 },
      { stat: 'Spread', uncommon: 1.6, common: 1.6, rare: 1.6, epic: 1.6, legendary: 1.6, mythic: 1.6 },
      { stat: 'Spread ADS (-53%)', uncommon: 0.75, common: 0.75, rare: 0.75, epic: 0.75, legendary: 0.75, mythic: 0.75 },
      { stat: 'ADS In Time', uncommon: '200ms', common: '200ms', rare: '200ms', epic: '200ms', legendary: '200ms', mythic: '200ms' },
      { stat: 'ADS Out Time', uncommon: '200ms', common: '200ms', rare: '200ms', epic: '200ms', legendary: '200ms', mythic: '200ms' },
    ],
  },
  {
    name: 'Arc-Lightning Gun',
    chapter: '6',
    season: '1',
    stats: [
      { stat: 'Damage', epic: 9, legendary: 9 },
      { stat: 'Headshot Damage (+25%)', epic: 11.25, legendary: 11.25 },
      { stat: 'Structure Damage', epic: 9, legendary: 9 },
      { stat: 'Fire Rate', epic: '10/s', legendary: '10/s' },
      { stat: 'DPS', epic: '90/s', legendary: '90/s' },
      { stat: 'Clip Size', epic: 'Infinite', legendary: 'Infinite' },
      { stat: 'Pullout Time', epic: '466ms', legendary: '699ms (+50%)' },
      { stat: 'ADS In Time', epic: '200ms', legendary: '200ms' },
      { stat: 'ADS Out Time', epic: '200ms', legendary: '200ms' },
      { stat: 'Min Charge Time', epic: '300ms', legendary: '300ms' },
      { stat: 'Max Charge Time', epic: '300ms', legendary: '300ms' },
      { stat: 'Time to Overheat', epic: '7s', legendary: '9s' },
      { stat: 'Time until Cooldown Start', epic: '600ms', legendary: '600ms' },
      { stat: 'Time to Cooldown', epic: '2s', legendary: '2s' },
    ],
    specialVariants: [
      {
        name: "Human Bill's Arc-Lightning Gun",
        rarity: 'Mythic',
        stats: [
          { stat: 'Damage', mythic: 12.1 },
          { stat: 'Headshot Damage (+25%)', mythic: 15.12 },
          { stat: 'Structure Damage', mythic: 7 },
          { stat: 'Fire Rate', mythic: '10/s' },
          { stat: 'DPS', mythic: '121/s' },
          { stat: 'Clip Size', mythic: 'Infinite' },
          { stat: 'Pullout Time', mythic: '466ms' },
          { stat: 'ADS In Time', mythic: '200ms' },
          { stat: 'ADS Out Time', mythic: '200ms' },
          { stat: 'Min Charge Time', mythic: '300ms' },
          { stat: 'Max Charge Time', mythic: '300ms' },
          { stat: 'Time to Overheat', mythic: '10s' },
          { stat: 'Time until Cooldown Start', mythic: '600ms' },
          { stat: 'Time to Cooldown', mythic: '2s' },
        ],
      },
    ],
  },
  {
    name: 'Dual Micro SMGs',
    chapter: '6',
    season: '1',
    stats: [
      { stat: 'Damage', common: 9, uncommon: 10, rare: 10, epic: 11, legendary: 13 },
      { stat: 'Headshot Damage (+50%)', common: 13.5, uncommon: 15, rare: 15, epic: 16.5, legendary: 19.5 },
      { stat: 'Structure Damage', common: 9, uncommon: 10, rare: 10, epic: 11, legendary: 13 },
      { stat: 'Fire Rate', common: '18/s', uncommon: '18/s', rare: '18/s', epic: '18/s', legendary: '18/s' },
      { stat: 'Burst Fire Rate', common: '25/s', uncommon: '25/s', rare: '25/s', epic: '25/s', legendary: '25/s' },
      { stat: 'Burst Fire Count', common: 2, uncommon: 2, rare: 2, epic: 2, legendary: 2 },
      { stat: 'Time between Bursts', common: '71ms', uncommon: '71ms', rare: '71ms', epic: '71ms', legendary: '71ms' },
      { stat: 'DPS', common: '162/s', uncommon: '180/s', rare: '180/s', epic: '198/s', legendary: '234/s' },
      { stat: 'Clip Size', common: 34, uncommon: 34, rare: 34, epic: 34, legendary: 34 },
      { stat: 'Reload Time', common: '2s', uncommon: '2s', rare: '1s', epic: '1s', legendary: '1s' },
      { stat: 'Vertical Recoil', common: 2.86, uncommon: 2.73, rare: 2.6, epic: 2.47, legendary: 2.34 },
      { stat: 'Horizontal Recoil', common: 0.3, uncommon: 0.3, rare: 0.3, epic: 0.3, legendary: 0.3 },
      { stat: 'ADS Vertical Recoil (-8%)', common: 2.63, uncommon: 2.51, rare: 2.39, epic: 2.27, legendary: 2.15 },
      { stat: 'ADS Horizontal Recoil (-8%)', common: 0.27, uncommon: 0.27, rare: 0.27, epic: 0.27, legendary: 0.27 },
      { stat: 'Spread', common: 1.8, uncommon: 1.8, rare: 1.8, epic: 1.8, legendary: 1.8 },
      { stat: 'Spread ADS (-23%)', common: 1.38, uncommon: 1.38, rare: 1.38, epic: 1.38, legendary: 1.38 },
      { stat: 'Pullout Time (+15%)', common: '364ms', uncommon: '364ms', rare: '364ms', epic: '364ms', legendary: '364ms' },
      { stat: 'ADS In Time', common: '175ms', uncommon: '175ms', rare: '175ms', epic: '175ms', legendary: '175ms' },
      { stat: 'ADS Out Time', common: '175ms', uncommon: '175ms', rare: '175ms', epic: '175ms', legendary: '175ms' },
    ],
  },
  {
    name: 'Tactical Pistol',
    chapter: '6',
    season: '1',
    stats: [
      { stat: 'Damage', uncommon: 23, common: 24, rare: 25, epic: 26, legendary: 28 },
      { stat: 'Headshot Damage (+100%)', uncommon: 46, common: 48, rare: 50, epic: 52, legendary: 56 },
      { stat: 'Structure Damage', uncommon: 23, common: 24, rare: 25, epic: 26, legendary: 28 },
      { stat: 'Fire Rate', uncommon: '6.9/s', common: '6.9/s', rare: '6.9/s', epic: '6.9/s', legendary: '6.9/s' },
      { stat: 'DPS', uncommon: '158.70/s', common: '165.60/s', rare: '172.5/s', epic: '179.4/s', legendary: '193.20/s' },
      { stat: 'Clip Size', uncommon: 15, common: 15, rare: 15, epic: 15, legendary: 15 },
      { stat: 'Reload Time', uncommon: '1s', common: '1s', rare: '1s', epic: '1s', legendary: '1s' },
      { stat: 'Vertical Recoil', uncommon: 3.85, common: 3.67, rare: 3.5, epic: 3.32, legendary: 3.15 },
      { stat: 'Horizontal Recoil', uncommon: 0.25, common: 0.25, rare: 0.25, epic: 0.25, legendary: 0.25 },
      { stat: 'ADS Vertical Recoil (-15%)', uncommon: 3.27, common: 3.12, rare: 2.97, epic: 2.82, legendary: 2.67 },
      { stat: 'ADS Horizontal Recoil (-15%)', uncommon: 0.21, common: 0.21, rare: 0.21, epic: 0.21, legendary: 0.21 },
      { stat: 'Spread', uncommon: 0.15, common: 0.15, rare: 0.15, epic: 0.15, legendary: 0.15 },
      { stat: 'Spread ADS (-50%)', uncommon: 0.07, common: 0.07, rare: 0.07, epic: 0.07, legendary: 0.07 },
      { stat: 'Pullout Time', uncommon: '333ms', common: '333ms', rare: '333ms', epic: '333ms', legendary: '333ms' },
      { stat: 'ADS In Time', uncommon: '200ms', common: '200ms', rare: '200ms', epic: '200ms', legendary: '200ms' },
      { stat: 'ADS Out Time', uncommon: '200ms', common: '200ms', rare: '200ms', epic: '200ms', legendary: '200ms' },
    ],
  },
  {
    name: 'Twin Hammer Shotguns',
    chapter: '6',
    season: '1',
    stats: [
      { stat: 'Damage', common: 64, uncommon: 67, rare: 71, epic: 75, legendary: 78, mythic: 82 },
      { stat: 'Headshot Damage (+75%)', common: 105, uncommon: 110, rare: 115, epic: 120, legendary: 125, mythic: 130 },
      { stat: 'Structure Damage', common: 32, uncommon: 34, rare: 36, epic: 38, legendary: 40, mythic: 41 },
      { stat: 'Fire Rate', common: '2.01/s', uncommon: '2.01/s', rare: '2.01/s', epic: '2.01/s', legendary: '2.01/s', mythic: '2.01/s' },
      { stat: 'DPS', common: '128.64/s', uncommon: '134.67/s', rare: '142.70/s', epic: '150.74/s', legendary: '156.77/s', mythic: '164.82/s' },
      { stat: 'Clip Size', common: 10, uncommon: 10, rare: 10, epic: 10, legendary: 10, mythic: 10 },
      { stat: 'Reload Time', common: '3s', uncommon: '3s', rare: '3s', epic: '3s', legendary: '2s', mythic: '2s' },
      { stat: 'Bullets Per Shot', common: 10, uncommon: 10, rare: 10, epic: 10, legendary: 10, mythic: 10 },
      { stat: 'Vertical Recoil', common: 4.4, uncommon: 4.2, rare: 4, epic: 3.8, legendary: 3.6, mythic: 3.4 },
      { stat: 'Horizontal Recoil', common: 2, uncommon: 2, rare: 2, epic: 2, legendary: 2, mythic: 2 },
      { stat: 'ADS Vertical Recoil (-10%)', common: 3.96, uncommon: 3.78, rare: 3.6, epic: 3.42, legendary: 3.24, mythic: 3.06 },
      { stat: 'ADS Horizontal Recoil (-10%)', common: 1.8, uncommon: 1.8, rare: 1.8, epic: 1.8, legendary: 1.8, mythic: 1.8 },
      { stat: 'Spread', common: 3.6, uncommon: 3.6, rare: 3.6, epic: 3.6, legendary: 3.6, mythic: 3.6 },
      { stat: 'Spread ADS (-35%)', common: 2.34, uncommon: 2.34, rare: 2.34, epic: 2.34, legendary: 2.34, mythic: 2.34 },
      { stat: 'Bullet Width', common: '16cm', uncommon: '16cm', rare: '16cm', epic: '16cm', legendary: '16cm', mythic: '16cm' },
      { stat: 'Pullout Time (+2%)', common: '324ms', uncommon: '324ms', rare: '324ms', epic: '324ms', legendary: '324ms', mythic: '324ms' },
      { stat: 'Delay between weapon swaps', common: '1s', uncommon: '1s', rare: '1s', epic: '1s', legendary: '1s', mythic: '1s' },
      { stat: 'ADS In Time', common: '225ms', uncommon: '225ms', rare: '225ms', epic: '225ms', legendary: '225ms', mythic: '225ms' },
      { stat: 'ADS Out Time', common: '200ms', uncommon: '200ms', rare: '200ms', epic: '200ms', legendary: '200ms', mythic: '200ms' },
    ],
  },
  {
    name: 'Iron Pump Shotgun',
    chapter: '6',
    season: '1',
    stats: [
      { stat: 'Damage', common: 91, uncommon: 96, rare: 101, epic: 106, legendary: 111, mythic: 116 },
      { stat: 'Headshot Damage (+100%)', common: 165, uncommon: 175, rare: 185, epic: 195, legendary: 202, mythic: 210 },
      { stat: 'Structure Damage', common: 47, uncommon: 49, rare: 52, epic: 55, legendary: 57, mythic: 60 },
      { stat: 'Fire Rate', common: '0.8/s', uncommon: '0.8/s', rare: '0.8/s', epic: '0.8/s', legendary: '0.8/s', mythic: '0.8/s' },
      { stat: 'DPS', common: '72.8/s', uncommon: '76.80/s', rare: '80.80/s', epic: '84.80/s', legendary: '88.80/s', mythic: '92.80/s' },
      { stat: 'Clip Size', common: 5, uncommon: 5, rare: 5, epic: 5, legendary: 5, mythic: 5 },
      { stat: 'Reload Time', common: '5s', uncommon: '5s', rare: '5s', epic: '4s', legendary: '4s', mythic: '4s' },
      { stat: 'Bullets Per Shot', common: 10, uncommon: 10, rare: 10, epic: 10, legendary: 10, mythic: 10 },
      { stat: 'Vertical Recoil', common: 8.8, uncommon: 8.4, rare: 8, epic: 7.6, legendary: 7.2, mythic: 6.8 },
      { stat: 'Horizontal Recoil', common: 2, uncommon: 2, rare: 2, epic: 2, legendary: 2, mythic: 2 },
      { stat: 'ADS Vertical Recoil (-10%)', common: 7.92, uncommon: 7.56, rare: 7.2, epic: 6.84, legendary: 6.48, mythic: 6.12 },
      { stat: 'ADS Horizontal Recoil (-10%)', common: 1.8, uncommon: 1.8, rare: 1.8, epic: 1.8, legendary: 1.8, mythic: 1.8 },
      { stat: 'Spread', common: 3, uncommon: 3, rare: 3, epic: 3, legendary: 3, mythic: 3 },
      { stat: 'Spread ADS (-48%)', common: 1.56, uncommon: 1.56, rare: 1.56, epic: 1.56, legendary: 1.56, mythic: 1.14 },
      { stat: 'Bullet Width', common: '14cm', uncommon: '14cm', rare: '14cm', epic: '14cm', legendary: '14cm', mythic: '14cm' },
      { stat: 'Pullout Time (+10%)', common: '330ms', uncommon: '330ms', rare: '330ms', epic: '330ms', legendary: '330ms', mythic: '330ms' },
      { stat: 'Delay between weapon swaps', common: '1s', uncommon: '1s', rare: '1s', epic: '1s', legendary: '1s', mythic: '1s' },
      { stat: 'ADS In Time', common: '200ms', uncommon: '200ms', rare: '200ms', epic: '200ms', legendary: '200ms', mythic: '200ms' },
      { stat: 'ADS Out Time', common: '200ms', uncommon: '200ms', rare: '200ms', epic: '200ms', legendary: '200ms', mythic: '200ms' },
    ],
  },
  {
    name: 'Holo Rush SMG',
    chapter: '6',
    season: '1',
    stats: [
      { stat: 'Damage', uncommon: 13, common: 14, rare: 15, epic: 16, legendary: 17 },
      { stat: 'Headshot Damage (+50%)', uncommon: 19.5, common: 21, rare: 22.5, epic: 24, legendary: 25.5 },
      { stat: 'Structure Damage', uncommon: 14, common: 14, rare: 15, epic: 16, legendary: 17 },
      { stat: 'Fire Rate', uncommon: '11.8/s', common: '11.8/s', rare: '11.8/s', epic: '11.8/s', legendary: '11.8/s' },
      { stat: 'DPS', uncommon: '153.4/s', common: '165.20/s', rare: '177/s', epic: '188.8/s', legendary: '200.60/s' },
      { stat: 'Clip Size', uncommon: 28, common: 28, rare: 28, epic: 28, legendary: 28 },
      { stat: 'Reload Time', uncommon: '2s', common: '2s', rare: '2s', epic: '2s', legendary: '2s' },
      { stat: 'Vertical Recoil', uncommon: 3.41, common: 3.25, rare: 3.1, epic: 2.94, legendary: 2.79 },
      { stat: 'Horizontal Recoil', uncommon: 0.5, common: 0.5, rare: 0.5, epic: 0.5, legendary: 0.5 },
      { stat: 'ADS Vertical Recoil (-67%)', uncommon: 1.12, common: 1.07, rare: 1.02, epic: 0.97, legendary: 0.92 },
      { stat: 'ADS Horizontal Recoil (-67%)', uncommon: 0.16, common: 0.16, rare: 0.16, epic: 0.16, legendary: 0.16 },
      { stat: 'Spread', uncommon: 1, common: 1, rare: 1, epic: 1, legendary: 1 },
      { stat: 'Spread ADS (-99%)', uncommon: 0.01, common: 0.01, rare: 0.01, epic: 0.01, legendary: 0.01 },
      { stat: 'Pullout Time (+10%)', uncommon: '348ms', common: '348ms', rare: '348ms', epic: '348ms', legendary: '348ms' },
      { stat: 'ADS In Time', uncommon: '175ms', common: '175ms', rare: '175ms', epic: '175ms', legendary: '175ms' },
      { stat: 'ADS Out Time', uncommon: '200ms', common: '200ms', rare: '200ms', epic: '200ms', legendary: '200ms' },
    ],
  },
  {
    name: 'Vengeful Sniper Rifle',
    chapter: '6',
    season: '1',
    stats: [
      { stat: 'Damage', rare: 84, epic: 88, legendary: 92 },
      { stat: 'Headshot Damage (+100%)', rare: 168, epic: 176, legendary: 184 },
      { stat: 'Structure Damage', rare: 84, epic: 88, legendary: 92 },
      { stat: 'Fire Rate', rare: '0.53/s', epic: '0.53/s', legendary: '0.53/s' },
      { stat: 'DPS', rare: '44.52/s', epic: '46.64/s', legendary: '48.76/s' },
      { stat: 'Clip Size', rare: 3, epic: 3, legendary: 3 },
      { stat: 'Reload Time', rare: '3s', epic: '3s', legendary: '3s' },
      { stat: 'Vertical Recoil', rare: 5, epic: 4.75, legendary: 4.5 },
      { stat: 'Horizontal Recoil', rare: 0, epic: 0, legendary: 0 },
      { stat: 'ADS Vertical Recoil (-60%)', rare: 2, epic: 1.90, legendary: 1.8 },
      { stat: 'ADS Horizontal Recoil (-60%)', rare: 0, epic: 0, legendary: 0 },
      { stat: 'Spread', rare: 10, epic: 10, legendary: 10 },
      { stat: 'Spread ADS (-99%)', rare: 0.1, epic: 0.1, legendary: 0.1 },
      { stat: 'Pullout Time', rare: '316ms', epic: '316ms', legendary: '316ms' },
      { stat: 'ADS In Time', rare: '380ms', epic: '380ms', legendary: '380ms' },
      { stat: 'ADS Out Time', rare: '270ms', epic: '270ms', legendary: '270ms' },
      { stat: 'Projectile Max Speed', rare: '500m/s', epic: '500m/s', legendary: '500m/s' },
      { stat: 'Projectile Initial Speed', rare: '500m/s', epic: '500m/s', legendary: '500m/s' },
      { stat: 'Projectile Gravity Scale', rare: 1, epic: 1, legendary: 1 },
    ],
  },
];

function formatWeaponStatsForMemory(weapon: WeaponData): string {
  let content = `Fortnite Chapter ${weapon.chapter} Season ${weapon.season} - ${weapon.name} Stats:\n\n`;
  
  // Create a readable format
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'] as const;
  
  for (const statRow of weapon.stats) {
    const statName = statRow.stat;
    const values: string[] = [];
    
    for (const rarity of rarities) {
      const value = statRow[rarity];
      if (value !== undefined) {
        values.push(`${rarity}: ${value}`);
      }
    }
    
    if (values.length > 0) {
      content += `${statName}: ${values.join(', ')}\n`;
    }
  }
  
  // Add special variants if any
  if (weapon.specialVariants && weapon.specialVariants.length > 0) {
    for (const variant of weapon.specialVariants) {
      content += `\n${variant.name} (${variant.rarity}):\n`;
      for (const statRow of variant.stats) {
        const statName = statRow.stat;
        const value = statRow[variant.rarity.toLowerCase() as keyof WeaponStat];
        if (value !== undefined) {
          content += `${statName}: ${value}\n`;
        }
      }
    }
  }
  
  return content;
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Starting weapon stats ingestion...\n');

    let processed = 0;
    let errors = 0;

    for (const weapon of WEAPON_STATS) {
      try {
        // Format weapon stats for memory storage
        const content = formatWeaponStatsForMemory(weapon);
        
        // Store in Firestore
        const memoryData = {
          source: 'weapon-stats',
          author: 'system',
          content: content.trim(),
          weaponName: weapon.name,
          chapter: weapon.chapter,
          season: weapon.season,
          stats: weapon.stats,
          specialVariants: weapon.specialVariants || [],
          createdAt: new Date(),
          timestamp: Date.now(),
        };

        await db.collection('memories').add(memoryData);
        processed++;
        console.log(`✅ Ingested: ${weapon.name}`);
      } catch (error: any) {
        console.error(`❌ Failed to ingest ${weapon.name}:`, error.message);
        errors++;
      }
    }

    // Also store all weapons as a single comprehensive document
    try {
      const allWeaponsContent = WEAPON_STATS.map(weapon => formatWeaponStatsForMemory(weapon)).join('\n\n---\n\n');
      
      const comprehensiveData = {
        source: 'weapon-stats',
        author: 'system',
        content: `Fortnite Chapter 6 Season 1 - Complete Weapon Stats\n\n${allWeaponsContent}`,
        chapter: '6',
        season: '1',
        type: 'comprehensive',
        weaponCount: WEAPON_STATS.length,
        createdAt: new Date(),
        timestamp: Date.now(),
      };

      await db.collection('memories').add(comprehensiveData);
      console.log(`✅ Ingested: Comprehensive weapon stats document`);
      processed++;
    } catch (error: any) {
      console.error(`❌ Failed to ingest comprehensive document:`, error.message);
      errors++;
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: WEAPON_STATS.length,
        processed,
        errors,
      },
      message: `Successfully ingested ${processed} weapon stat documents`,
    });
  } catch (error: any) {
    console.error('[INGEST] Fatal error:', error);
    return NextResponse.json(
      { 
        error: 'Ingestion failed', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weaponName = searchParams.get('weapon');
    const chapter = searchParams.get('chapter');
    const season = searchParams.get('season');

    let query: any = db.collection('memories').where('source', '==', 'weapon-stats');

    if (weaponName) {
      query = query.where('weaponName', '==', weaponName);
    }

    if (chapter) {
      query = query.where('chapter', '==', chapter);
    }

    if (season) {
      query = query.where('season', '==', season);
    }

    const snapshot = await query.orderBy('timestamp', 'desc').get();
    
    const weapons = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    }));

    return NextResponse.json({
      success: true,
      count: weapons.length,
      weapons,
    });
  } catch (error: any) {
    console.error('[ERROR] Failed to retrieve weapon stats:', error);
    
    // Check if it's a Firestore index error
    if (error.code === 9 || error.message?.includes('index') || error.message?.includes('FAILED_PRECONDITION')) {
      return NextResponse.json(
        { 
          error: 'Firestore index required',
          message: error.details || error.message,
          indexUrl: error.details?.match(/https:\/\/[^\s]+/)?.[0] || 'https://console.firebase.google.com/project/pathgen-v2/firestore/indexes'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve weapon stats', message: error.message },
      { status: 500 }
    );
  }
}

