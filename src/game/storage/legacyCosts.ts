// Alte (Schema-v10-)Preise für die v10→v11-Migrations-Erstattung
// (§ Ausbaustufe 2.0, docs/SAVE_MIGRATION.md).
//
// Gebäudesystem 2.0 hat Footprints, Stufenketten UND Preise neu aufgesetzt.
// Wer in v10 gebaut hat, hat die ALTEN Preise bezahlt — also erstattet die
// Migration exakt diese: Basiskosten + jede bezahlte Stufe, zu 100 %. Die
// Tabelle ist ein eingefrorener Auszug der v10-`buildings.config.ts` (nur
// Kosten) und wird nie wieder angefasst; künftige Preisänderungen brauchen
// KEINE neue Tabelle, weil ab v11 die Migrationen keine Gebäude mehr entfernen.
//
// Enthalten sind auch die in v11 entfallenen Defs (`house_row`, `apartment`)
// und entfallene Spätstufen (Sägewerk/Steinbruch/Farm Stufe 3, Wasserpumpe
// Stufe 2–3 wurden zusammengelegt).

import type { ResourceId } from '../types.ts';

type Cost = Partial<Record<ResourceId, number>>;

interface LegacyCostEntry {
  cost: Cost;
  /** Kosten je Ausbaustufe (Index 0 = Stufe 1). */
  upgrades: Cost[];
}

export const LEGACY_V10_COSTS: Record<string, LegacyCostEntry> = {
  town_hall: {
    cost: {},
    upgrades: [
      { money: 120_000, wood: 120, stone: 120 },
      { money: 500_000, wood: 260, stone: 320 },
      { money: 1_500_000, wood: 500, stone: 700 },
    ],
  },
  mayor_house: { cost: { money: 25_000, wood: 40 }, upgrades: [] },
  district_center: { cost: {}, upgrades: [] },
  road: { cost: { money: 300 }, upgrades: [] },
  house_small: {
    cost: { money: 9_000, wood: 22 },
    upgrades: [
      { money: 30_000, wood: 50, stone: 20 },
      { money: 140_000, wood: 130, stone: 90 },
      { money: 320_000, wood: 220, stone: 180 },
      { money: 700_000, wood: 340, stone: 320 },
      { money: 1_400_000, wood: 520, stone: 560 },
    ],
  },
  house_row: {
    cost: { money: 60_000, wood: 120, stone: 70 },
    upgrades: [
      { money: 180_000, wood: 180, stone: 120 },
      { money: 420_000, wood: 280, stone: 220 },
    ],
  },
  apartment: {
    cost: { money: 280_000, wood: 220, stone: 320 },
    upgrades: [
      { money: 700_000, wood: 360, stone: 500 },
      { money: 1_500_000, wood: 520, stone: 760 },
    ],
  },
  residential_tower: {
    cost: { money: 900_000, wood: 350, stone: 700 },
    upgrades: [
      { money: 2_400_000, wood: 600, stone: 1_100 },
      { money: 5_000_000, wood: 900, stone: 1_800 },
    ],
  },
  sawmill: {
    cost: { money: 11_000 },
    upgrades: [
      { money: 200_000, wood: 150, stone: 120 },
      { money: 650_000, wood: 300, stone: 260 },
      { money: 2_200_000, wood: 600, stone: 520 },
    ],
  },
  quarry: {
    cost: { money: 45_000, wood: 120 },
    upgrades: [
      { money: 300_000, wood: 120, stone: 140 },
      { money: 1_000_000, wood: 280, stone: 360 },
      { money: 3_200_000, wood: 600, stone: 720 },
    ],
  },
  farm: {
    cost: { money: 28_000, wood: 80 },
    upgrades: [
      { money: 300_000, wood: 140, stone: 120 },
      { money: 1_000_000, wood: 260, stone: 280 },
      { money: 3_000_000, wood: 520, stone: 560 },
    ],
  },
  well: { cost: { money: 6_500, wood: 10 }, upgrades: [{ money: 22_000, wood: 30, stone: 20 }] },
  water_pump: {
    cost: { money: 130_000, stone: 150 },
    upgrades: [
      { money: 260_000, stone: 280 },
      { money: 560_000, stone: 520 },
    ],
  },
  warehouse: {
    cost: { money: 85_000, wood: 140, stone: 90 },
    upgrades: [{ money: 180_000, wood: 180, stone: 120 }],
  },
  depot: { cost: { money: 190_000, wood: 130, stone: 180 }, upgrades: [] },
  waterworks: { cost: { money: 260_000, wood: 80, stone: 200 }, upgrades: [] },
  market: { cost: { money: 55_000, wood: 90 }, upgrades: [{ money: 150_000, wood: 140, stone: 80 }] },
  supermarket: { cost: { money: 340_000, wood: 120, stone: 180 }, upgrades: [] },
  bakery: { cost: { money: 130_000, wood: 110, stone: 90 }, upgrades: [] },
  fire_station: {
    cost: { money: 240_000, wood: 120, stone: 180 },
    upgrades: [{ money: 300_000, wood: 160, stone: 220 }],
  },
  police_station: {
    cost: { money: 520_000, wood: 100, stone: 260 },
    upgrades: [{ money: 900_000, stone: 420 }],
  },
  hospital: {
    cost: { money: 2_200_000, wood: 200, stone: 500 },
    upgrades: [{ money: 4_500_000, wood: 300, stone: 800 }],
  },
  trading_post: {
    cost: { money: 40_000, wood: 60 },
    upgrades: [
      { money: 180_000, wood: 120, stone: 100 },
      { money: 520_000, stone: 260 },
    ],
  },
  shop_small: { cost: { money: 85_000, wood: 90 }, upgrades: [] },
  office: {
    cost: { money: 850_000, wood: 260, stone: 480 },
    upgrades: [
      { money: 1_400_000, wood: 360, stone: 700 },
      { money: 3_000_000, wood: 520, stone: 1_100 },
    ],
  },
  power_plant: { cost: { money: 480_000, wood: 100, stone: 300 }, upgrades: [] },
  wind_farm: { cost: { money: 360_000, wood: 80, stone: 220 }, upgrades: [] },
  park: { cost: { money: 32_000, wood: 45 }, upgrades: [{ money: 90_000, wood: 120 }] },
  playground: { cost: { money: 18_000, wood: 40 }, upgrades: [] },
  deco_tree: { cost: { money: 1_500 }, upgrades: [] },
  deco_flowerbed: { cost: { money: 2_400 }, upgrades: [] },
  deco_fountain: { cost: { money: 12_000, stone: 15 }, upgrades: [] },
  deco_bench: { cost: { money: 3_000, wood: 8 }, upgrades: [] },
};

/** Summiert `into += add` je Ressource (Mutation, Migrations-Helfer). */
export function addCost(into: Cost, add: Cost | undefined): void {
  if (!add) return;
  for (const [res, amount] of Object.entries(add)) {
    into[res as ResourceId] = (into[res as ResourceId] ?? 0) + (amount ?? 0);
  }
}

/**
 * Alles, was in v10 real in ein Gebäude geflossen ist: alte Basiskosten plus
 * jede bis `upgradeLevel` bezahlte alte Stufe. Unbekannte Defs (sollte es
 * nicht geben) erstatten 0 statt zu crashen — die Migration darf nie scheitern.
 */
export function legacyInvestedCost(defId: string, upgradeLevel: number): Cost {
  const entry = LEGACY_V10_COSTS[defId];
  if (!entry) return {};
  const total: Cost = {};
  addCost(total, entry.cost);
  for (let i = 0; i < upgradeLevel && i < entry.upgrades.length; i++) addCost(total, entry.upgrades[i]);
  return total;
}

/** Kosten genau EINER alten Stufe (1-basiert) — für Stufen-Clamps. */
export function legacyStageCost(defId: string, stage: number): Cost {
  return LEGACY_V10_COSTS[defId]?.upgrades[stage - 1] ?? {};
}
