import type { LevelDef } from './types.ts';

// Cumulative XP curve, seit § Gebäudesystem 2.0 auf **20 Level** gestreckt:
// L1–L3 bleiben schnell (Kernloop lernen), ab L4 ~×1,3–1,45 je Level. Die neuen
// Level 15–20 sind die Metropol-Bänder — sie schalten kaum neue Gebäude frei,
// sondern gaten die TOP-Stufen der Ketten (Wohnblock L15, Einsatzzentrum/
// Monumentalrathaus/Großkraftwerk L16, Hochhaus/Präsidium L17, Büroturm L18,
// Universitätsklinikum L19, Wolkenkratzer L20) und die teuren Regionen (bis
// L18). Große Gebäude fühlen sich so wie echte Meilensteine an (§5 Auftrag A).
// XP no longer flows from residential spam — supply build-out, big public
// buildings, quests and milestones are the real sources.
export const levelsConfig: LevelDef[] = [
  { level: 1, xpRequired: 0, unlocks: ['road', 'house_small'], rewards: {} },
  { level: 2, xpRequired: 36, unlocks: ['sawmill', 'stone_pit', 'road_elevated'], rewards: { money: 13_000 } },
  { level: 3, xpRequired: 130, unlocks: ['well', 'mayor_house'], rewards: { money: 20_000, gold: 10 } },
  { level: 4, xpRequired: 310, unlocks: ['farm', 'quarry'], rewards: { money: 30_000 } },
  { level: 5, xpRequired: 620, unlocks: ['market', 'trading_post'], rewards: { money: 47_000, gold: 15 } },
  { level: 6, xpRequired: 1120, unlocks: ['shop_small', 'warehouse', 'dock_small'], rewards: { money: 85_000 } },
  { level: 7, xpRequired: 1780, unlocks: ['park', 'playground', 'water_pump', 'depot', 'deco_tree', 'deco_flowerbed', 'deco_fountain', 'deco_bench'], rewards: { money: 130_000, gold: 20 } },
  { level: 8, xpRequired: 2680, unlocks: ['fire_station', 'office'], rewards: { money: 200_000 } },
  { level: 9, xpRequired: 3950, unlocks: ['bakery', 'river_port'], rewards: { money: 300_000, gold: 25 } },
  // L10: keine neuen Gebäude — die Stufen-Gates (Ladenzeile, Hochregallager)
  // tragen das Band; das Level-Up finanziert den Ausbau.
  { level: 10, xpRequired: 5700, unlocks: [], rewards: { money: 500_000, gold: 50 } },
  // L11: the energy grid activates and BOTH power sources unlock at once, so
  // the player picks their path right away (§18).
  { level: 11, xpRequired: 8200, unlocks: ['power_plant', 'wind_farm', 'waterworks'], rewards: { money: 700_000, gold: 30 } },
  { level: 12, xpRequired: 11_500, unlocks: ['supermarket'], rewards: { money: 950_000 } },
  // L13/L14: emergency services activate (needs.config safety L13, health L14).
  { level: 13, xpRequired: 15_800, unlocks: ['police_station'], rewards: { money: 1_300_000, gold: 30 } },
  { level: 14, xpRequired: 21_400, unlocks: ['hospital'], rewards: { money: 1_800_000 } },
  // ---- Metropol-Bänder (§ Gebäudesystem 2.0) ----
  { level: 15, xpRequired: 28_600, unlocks: ['residential_tower'], rewards: { money: 2_400_000, gold: 40 } },
  { level: 16, xpRequired: 37_500, unlocks: [], rewards: { money: 3_200_000 } },
  { level: 17, xpRequired: 48_500, unlocks: [], rewards: { money: 4_200_000, gold: 50 } },
  { level: 18, xpRequired: 62_000, unlocks: [], rewards: { money: 5_500_000 } },
  { level: 19, xpRequired: 79_000, unlocks: [], rewards: { money: 7_000_000, gold: 60 } },
  { level: 20, xpRequired: 100_000, unlocks: [], rewards: { money: 9_000_000, gold: 100 } },
];
