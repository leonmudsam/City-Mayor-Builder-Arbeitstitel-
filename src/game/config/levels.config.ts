import type { LevelDef } from './types.ts';

// Cumulative XP curve (§1 slower progression): L1–3 stay quick so the core loop
// is learned fast and the early game keeps its good flow, but from L4 up the
// curve is stretched ~15–30 % over the previous pass so a level-up feels earned
// and players don't sprint through the bands. XP no longer flows from
// residential spam — houses give little XP (§4), while supply build-out, big
// public buildings, quests and milestones are the real sources (buildings.config
// xpReward). Reaching L5 now takes 620 XP (was 480) and L10 ~5 700 (was 4 400),
// L14 ~21 400 (was 16 800), so a well-run, quest-driven city still climbs over
// several check-in sessions — just a little more deliberately.
// Level-up money rewards rise to match the pricier late-game buildings (§5).
export const levelsConfig: LevelDef[] = [
  { level: 1, xpRequired: 0, unlocks: ['road', 'house_small'], rewards: {} },
  // Early-level money gifts trimmed ~15 % (§ active play): the new Stadtarbeit
  // activities now pay the early game, so level-ups lean less on lump sums.
  { level: 2, xpRequired: 36, unlocks: ['sawmill'], rewards: { money: 13_000 } },
  { level: 3, xpRequired: 130, unlocks: ['well', 'mayor_house'], rewards: { money: 20_000, gold: 10 } },
  // From L4 up the curve stretches: growth demands planning, not spamming (§1/§3).
  { level: 4, xpRequired: 310, unlocks: ['farm', 'quarry'], rewards: { money: 30_000 } },
  { level: 5, xpRequired: 620, unlocks: ['market', 'trading_post'], rewards: { money: 47_000, gold: 15 } },
  { level: 6, xpRequired: 1120, unlocks: ['shop_small', 'warehouse', 'house_row'], rewards: { money: 85_000 } },
  { level: 7, xpRequired: 1780, unlocks: ['park', 'playground', 'water_pump', 'depot', 'deco_tree', 'deco_flowerbed', 'deco_fountain', 'deco_bench'], rewards: { money: 130_000, gold: 20 } },
  { level: 8, xpRequired: 2680, unlocks: ['fire_station', 'office'], rewards: { money: 200_000 } },
  // Housing types now unlock one per level (§13): bakery at L9, apartment at L10.
  { level: 9, xpRequired: 3950, unlocks: ['bakery'], rewards: { money: 300_000, gold: 25 } },
  { level: 10, xpRequired: 5700, unlocks: ['apartment'], rewards: { money: 500_000, gold: 50 } },
  // ---- MVP 2 endgame bands ----
  // L11: the energy grid activates (needs.config energy unlockLevel 11) and BOTH
  // a coal plant and a renewable wind farm unlock in the same breath, so the
  // player picks their power source right away (§18) — the classic "level-up
  // creates the next problem and its answer" motor (§4).
  { level: 11, xpRequired: 8200, unlocks: ['power_plant', 'wind_farm', 'waterworks'], rewards: { money: 700_000, gold: 30 } },
  { level: 12, xpRequired: 11_500, unlocks: ['residential_tower', 'supermarket'], rewards: { money: 950_000 } },
  // L13/L14: emergency services activate (needs.config safety L13, health L14),
  // each with its building unlocking in the same level — same motor as energy.
  { level: 13, xpRequired: 15_800, unlocks: ['police_station'], rewards: { money: 1_300_000, gold: 30 } },
  { level: 14, xpRequired: 21_400, unlocks: ['hospital'], rewards: { money: 1_800_000 } },
];
