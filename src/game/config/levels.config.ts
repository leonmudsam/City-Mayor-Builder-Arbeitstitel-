import type { LevelDef } from './types.ts';

// Cumulative XP curve: fast for the first hour (L1–5), then stretching out
// into check-in play (L6–10). All unlock lists reference buildings.config.
export const levelsConfig: LevelDef[] = [
  { level: 1, xpRequired: 0, unlocks: ['road', 'house_small'], rewards: {} },
  { level: 2, xpRequired: 30, unlocks: ['sawmill'], rewards: { money: 15_000 } },
  { level: 3, xpRequired: 90, unlocks: ['well', 'mayor_house'], rewards: { money: 22_000, gold: 10 } },
  { level: 4, xpRequired: 180, unlocks: ['farm', 'quarry'], rewards: { money: 30_000 } },
  { level: 5, xpRequired: 320, unlocks: ['market'], rewards: { money: 45_000, gold: 15 } },
  { level: 6, xpRequired: 520, unlocks: ['shop_small', 'warehouse', 'house_row'], rewards: { money: 60_000 } },
  { level: 7, xpRequired: 800, unlocks: ['park', 'playground', 'water_pump', 'depot', 'deco_tree', 'deco_flowerbed', 'deco_fountain', 'deco_bench'], rewards: { money: 80_000, gold: 20 } },
  { level: 8, xpRequired: 1200, unlocks: ['fire_station', 'office'], rewards: { money: 110_000 } },
  { level: 9, xpRequired: 1750, unlocks: ['apartment', 'bakery'], rewards: { money: 150_000, gold: 25 } },
  { level: 10, xpRequired: 2500, unlocks: [], rewards: { money: 250_000, gold: 50 } },
];
