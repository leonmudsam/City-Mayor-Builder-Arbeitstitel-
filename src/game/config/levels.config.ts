import type { LevelDef } from './types.ts';

// Cumulative XP curve (v0.15 long-term progression, §3): L1–3 stay quick so the
// core loop is learned fast, then each level costs sharply more so level-ups
// become real milestones and later levels span multiple check-in sessions. XP
// no longer flows from residential spam — houses give little XP (§4), while
// supply build-out, big public buildings, quests and milestones are the real
// sources (buildings.config xpReward). Reaching L10 now takes ~4 400 XP (was
// 2 500) and L14 ~16 800, so a wall of houses can never carry progression, yet
// a well-run, quest-driven city still climbs over several check-in sessions.
// Level-up money rewards rise to match the pricier late-game buildings (§5).
export const levelsConfig: LevelDef[] = [
  { level: 1, xpRequired: 0, unlocks: ['road', 'house_small'], rewards: {} },
  { level: 2, xpRequired: 30, unlocks: ['sawmill'], rewards: { money: 15_000 } },
  { level: 3, xpRequired: 100, unlocks: ['well', 'mayor_house'], rewards: { money: 24_000, gold: 10 } },
  // From L4 up the curve stretches: growth demands planning, not spamming (§3).
  { level: 4, xpRequired: 240, unlocks: ['farm', 'quarry'], rewards: { money: 36_000 } },
  { level: 5, xpRequired: 480, unlocks: ['market'], rewards: { money: 55_000, gold: 15 } },
  { level: 6, xpRequired: 850, unlocks: ['shop_small', 'warehouse', 'house_row'], rewards: { money: 85_000 } },
  { level: 7, xpRequired: 1350, unlocks: ['park', 'playground', 'water_pump', 'depot', 'deco_tree', 'deco_flowerbed', 'deco_fountain', 'deco_bench'], rewards: { money: 130_000, gold: 20 } },
  { level: 8, xpRequired: 2050, unlocks: ['fire_station', 'office'], rewards: { money: 200_000 } },
  { level: 9, xpRequired: 3050, unlocks: ['apartment', 'bakery'], rewards: { money: 300_000, gold: 25 } },
  { level: 10, xpRequired: 4400, unlocks: [], rewards: { money: 500_000, gold: 50 } },
  // ---- MVP 2 endgame bands ----
  // L11: the energy grid activates (needs.config energy unlockLevel 11) and the
  // coal plant unlocks in the same breath — the classic "level-up creates the
  // next problem and its answer" motor (§4).
  { level: 11, xpRequired: 6400, unlocks: ['power_plant', 'waterworks'], rewards: { money: 700_000, gold: 30 } },
  { level: 12, xpRequired: 9000, unlocks: ['wind_farm', 'residential_tower', 'supermarket'], rewards: { money: 950_000 } },
  // L13/L14: emergency services activate (needs.config safety L13, health L14),
  // each with its building unlocking in the same level — same motor as energy.
  { level: 13, xpRequired: 12_400, unlocks: ['police_station'], rewards: { money: 1_300_000, gold: 30 } },
  { level: 14, xpRequired: 16_800, unlocks: ['hospital'], rewards: { money: 1_800_000 } },
];
