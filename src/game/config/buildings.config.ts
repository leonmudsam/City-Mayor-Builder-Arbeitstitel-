import type { BuildingDef } from './types.ts';

// Money is now on a believable municipal scale (tens of thousands and up, §4);
// materials (wood/stone/food) stay small-scale so they remain a *separate*
// bottleneck from money (§3). Income comes from several legible sources (§5):
// residential tax (per capita), commercial revenue (shops/market) and
// industrial revenue (production) — the latter two scale with staffing.
export const buildingsConfig: BuildingDef[] = [
  // ---- Verwaltung / Regierung ----
  {
    id: 'town_hall',
    category: 'government',
    nameKey: 'building.town_hall',
    size: { w: 3, h: 3 },
    requiresRoad: false,
    unlockLevel: 1,
    cost: {},
    constructionSec: 0,
    xpReward: 0,
    unique: true,
    buildable: false,
    // The city's anchor can never be torn down — but it can be relocated so an
    // awkward starting spot isn't permanent (§2).
    canDemolish: false,
    canRelocate: true,
    effects: [
      { type: 'jobs', amount: 5 },
      { type: 'storage', resource: 'wood', amount: 1_000 },
      { type: 'storage', resource: 'stone', amount: 1_000 },
      { type: 'storage', resource: 'food', amount: 1_000 },
      // Civic presence: a small attractiveness aura for the surrounding blocks
      // (§9), reusing the same ambience → happiness path as parks/zoning.
      { type: 'ambience', amount: 2, radius: 3 },
    ],
  },
  {
    id: 'mayor_house',
    category: 'government',
    nameKey: 'building.mayor_house',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 3,
    cost: { money: 18_000, wood: 30 },
    constructionSec: 60,
    xpReward: 25,
    unique: true,
    canDemolish: false,
    canRelocate: true,
    relocationCost: { money: 2_000 },
    effects: [],
  },

  // ---- Straßen ----
  {
    id: 'road',
    category: 'roads',
    nameKey: 'building.road',
    size: { w: 1, h: 1 },
    requiresRoad: false,
    unlockLevel: 1,
    cost: { money: 200 },
    constructionSec: 0,
    xpReward: 1,
    // Road maintenance: tiny per tile, but it scales with sprawl — a gentle
    // pressure toward compact layouts rather than endless empty avenues.
    effects: [{ type: 'upkeep', resource: 'money', perMinute: 8 }],
  },

  // ---- Wohnen ----
  // Small house — suburban, low density, high quality: a single family home
  // that reacts strongly to nearby green space and industry (§7).
  {
    id: 'house_small',
    category: 'residential',
    nameKey: 'building.house_small',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 1,
    cost: { money: 6_000, wood: 15 },
    constructionSec: 20,
    xpReward: 10,
    effects: [
      { type: 'housing', units: 1, minResidentsPerUnit: 2, maxResidentsPerUnit: 5, ambienceSensitivity: 1.4 },
      { type: 'demand', need: 'water', amount: 4 },
      // Residential upkeep scales with households, so it tracks population and
      // gently nets out the per-capita tax without hurting the early game.
      { type: 'upkeep', resource: 'money', perMinute: 35 },
    ],
    upgrades: [
      {
        cost: { money: 18_000, wood: 30, stone: 10 },
        constructionSec: 60,
        xpReward: 15,
        effects: [
          { type: 'housing', units: 2, minResidentsPerUnit: 2, maxResidentsPerUnit: 5, ambienceSensitivity: 1.4 },
          { type: 'demand', need: 'water', amount: 8 },
          { type: 'upkeep', resource: 'money', perMinute: 70 },
        ],
      },
      {
        cost: { money: 45_000, wood: 60, stone: 40 },
        constructionSec: 180,
        xpReward: 25,
        effects: [
          { type: 'housing', units: 3, minResidentsPerUnit: 2, maxResidentsPerUnit: 6, ambienceSensitivity: 1.3 },
          { type: 'demand', need: 'water', amount: 14 },
          { type: 'upkeep', resource: 'money', perMinute: 105 },
        ],
      },
    ],
  },
  // Row house — denser: several households per footprint, medium quality,
  // higher water/supply demand. The efficient way to grow a neighborhood (§7).
  {
    id: 'house_row',
    category: 'residential',
    nameKey: 'building.house_row',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 6,
    cost: { money: 22_000, wood: 60, stone: 30 },
    constructionSec: 120,
    xpReward: 20,
    effects: [
      { type: 'housing', units: 5, minResidentsPerUnit: 2, maxResidentsPerUnit: 4, ambienceSensitivity: 1.0 },
      { type: 'demand', need: 'water', amount: 16 },
      { type: 'upkeep', resource: 'money', perMinute: 175 },
    ],
  },
  // Apartment — high density, many units, heavy infrastructure demand; without
  // parks its neighborhood quality suffers (§7).
  {
    id: 'apartment',
    category: 'residential',
    nameKey: 'building.apartment',
    size: { w: 2, h: 3 },
    requiresRoad: true,
    unlockLevel: 9,
    cost: { money: 90_000, wood: 100, stone: 140 },
    constructionSec: 360,
    xpReward: 45,
    effects: [
      { type: 'housing', units: 16, minResidentsPerUnit: 2, maxResidentsPerUnit: 3, ambienceSensitivity: 1.15 },
      { type: 'demand', need: 'water', amount: 40 },
      { type: 'upkeep', resource: 'money', perMinute: 560 },
    ],
  },

  // ---- Ressourcen / Produktion ----
  {
    id: 'sawmill',
    category: 'production',
    nameKey: 'building.sawmill',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 2,
    cost: { money: 5_000 },
    constructionSec: 30,
    xpReward: 12,
    effects: [
      { type: 'produce', resource: 'wood', perMinute: 14 },
      { type: 'jobs', amount: 4 },
      { type: 'revenue', category: 'industrial', perMinute: 600 },
      { type: 'upkeep', resource: 'money', perMinute: 300 },
      { type: 'ambience', amount: -1, radius: 4 },
    ],
    locationBonus: { terrain: 'forest', radius: 3, perTilePct: 5, maxPct: 50 },
    // Few but strong (§1/§2): grows slowly with city level, never a spam build.
    buildLimit: [{ level: 2, max: 2 }, { level: 5, max: 3 }, { level: 8, max: 5 }],
  },
  {
    id: 'quarry',
    category: 'production',
    nameKey: 'building.quarry',
    size: { w: 3, h: 3 },
    requiresRoad: true,
    unlockLevel: 4,
    cost: { money: 14_000, wood: 50 },
    constructionSec: 90,
    xpReward: 18,
    effects: [
      { type: 'produce', resource: 'stone', perMinute: 11 },
      { type: 'jobs', amount: 6 },
      { type: 'revenue', category: 'industrial', perMinute: 1_000 },
      { type: 'upkeep', resource: 'money', perMinute: 500 },
      { type: 'ambience', amount: -2, radius: 5 },
    ],
    locationBonus: { terrain: 'mountain', radius: 3, perTilePct: 8, maxPct: 60 },
    buildLimit: [{ level: 4, max: 2 }, { level: 7, max: 3 }, { level: 10, max: 4 }],
  },
  {
    id: 'farm',
    category: 'production',
    nameKey: 'building.farm',
    size: { w: 3, h: 3 },
    requiresRoad: true,
    unlockLevel: 4,
    cost: { money: 9_000, wood: 30 },
    constructionSec: 60,
    xpReward: 15,
    effects: [
      { type: 'produce', resource: 'food', perMinute: 15 },
      { type: 'jobs', amount: 4 },
      { type: 'revenue', category: 'industrial', perMinute: 700 },
      { type: 'upkeep', resource: 'money', perMinute: 300 },
      { type: 'ambience', amount: -1, radius: 3 },
    ],
    locationBonus: { terrain: 'fertile', radius: 2, perTilePct: 4, maxPct: 40 },
    buildLimit: [{ level: 4, max: 2 }, { level: 6, max: 3 }, { level: 9, max: 5 }],
  },
  {
    id: 'well',
    category: 'services',
    nameKey: 'building.well',
    size: { w: 1, h: 1 },
    requiresRoad: false,
    unlockLevel: 3,
    cost: { money: 3_500, wood: 5 },
    constructionSec: 15,
    xpReward: 8,
    effects: [
      { type: 'capacity', need: 'water', amount: 60, radius: 7 },
      { type: 'upkeep', resource: 'money', perMinute: 100 },
    ],
  },
  {
    id: 'water_pump',
    category: 'services',
    nameKey: 'building.water_pump',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 7,
    cost: { money: 40_000, stone: 60 },
    constructionSec: 180,
    xpReward: 28,
    effects: [
      { type: 'capacity', need: 'water', amount: 240, radius: 12 },
      { type: 'jobs', amount: 2 },
      { type: 'upkeep', resource: 'money', perMinute: 1_200 },
    ],
  },
  {
    id: 'warehouse',
    category: 'production',
    nameKey: 'building.warehouse',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 6,
    cost: { money: 26_000, wood: 60, stone: 30 },
    constructionSec: 120,
    xpReward: 22,
    effects: [
      // Storage scales with the city through warehouses: one is now worth
      // building (10× the old cap) so material stops hitting a tiny flat wall.
      { type: 'storage', resource: 'wood', amount: 2_000 },
      { type: 'storage', resource: 'stone', amount: 2_000 },
      { type: 'storage', resource: 'food', amount: 2_000 },
      { type: 'jobs', amount: 2 },
      { type: 'upkeep', resource: 'money', perMinute: 300 },
    ],
  },

  // ---- Versorgung ----
  {
    id: 'market',
    category: 'services',
    nameKey: 'building.market',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 5,
    cost: { money: 20_000, wood: 40 },
    constructionSec: 90,
    xpReward: 20,
    effects: [
      // Food only reaches homes within range (§8): place the market among the
      // houses it feeds, not off in a corner.
      { type: 'distribution', need: 'food', radius: 9 },
      { type: 'jobs', amount: 6 },
      // Market fees — commercial income that scales with staffing & happiness.
      { type: 'revenue', category: 'commercial', perMinute: 2_000 },
      { type: 'upkeep', resource: 'money', perMinute: 900 },
    ],
  },
  {
    id: 'bakery',
    category: 'services',
    nameKey: 'building.bakery',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 9,
    cost: { money: 48_000, wood: 50, stone: 40 },
    constructionSec: 240,
    xpReward: 32,
    effects: [
      { type: 'produce', resource: 'food', perMinute: 9 },
      { type: 'jobs', amount: 4 },
      { type: 'revenue', category: 'industrial', perMinute: 1_200 },
      { type: 'upkeep', resource: 'money', perMinute: 600 },
    ],
    buildLimit: [{ level: 9, max: 2 }],
  },
  {
    id: 'fire_station',
    category: 'services',
    nameKey: 'building.fire_station',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 8,
    cost: { money: 60_000, wood: 60, stone: 80 },
    constructionSec: 300,
    xpReward: 40,
    effects: [
      { type: 'protection', hazard: 'fire', radius: 12 },
      { type: 'jobs', amount: 6 },
      { type: 'upkeep', resource: 'money', perMinute: 1_500 },
    ],
  },

  // ---- Wirtschaft ----
  {
    id: 'shop_small',
    category: 'economy',
    nameKey: 'building.shop_small',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 6,
    cost: { money: 30_000, wood: 40 },
    constructionSec: 150,
    xpReward: 24,
    effects: [
      // Trade tax — the backbone of commercial income once jobs are staffed.
      { type: 'revenue', category: 'commercial', perMinute: 4_000 },
      { type: 'jobs', amount: 8 },
      { type: 'upkeep', resource: 'money', perMinute: 1_200 },
    ],
    buildLimit: [{ level: 6, max: 2 }, { level: 9, max: 4 }],
  },

  // ---- Freizeit ----
  {
    id: 'park',
    category: 'leisure',
    nameKey: 'building.park',
    size: { w: 2, h: 2 },
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 14_000, wood: 20 },
    constructionSec: 60,
    xpReward: 15,
    effects: [
      { type: 'coverage', need: 'leisure', radius: 8 },
      { type: 'ambience', amount: 2, radius: 6 },
      { type: 'upkeep', resource: 'money', perMinute: 250 },
    ],
  },
  {
    id: 'playground',
    category: 'leisure',
    nameKey: 'building.playground',
    size: { w: 2, h: 2 },
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 9_000, wood: 20 },
    constructionSec: 40,
    xpReward: 8,
    effects: [
      { type: 'coverage', need: 'leisure', radius: 5 },
      { type: 'ambience', amount: 1, radius: 4 },
      { type: 'upkeep', resource: 'money', perMinute: 150 },
    ],
  },

  // ---- Dekoration ----
  {
    id: 'deco_tree',
    category: 'decoration',
    nameKey: 'building.deco_tree',
    size: { w: 1, h: 1 },
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 1_200 },
    constructionSec: 0,
    xpReward: 1,
    effects: [{ type: 'ambience', amount: 1, radius: 3 }],
  },
  {
    id: 'deco_flowerbed',
    category: 'decoration',
    nameKey: 'building.deco_flowerbed',
    size: { w: 1, h: 1 },
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 1_800 },
    constructionSec: 0,
    xpReward: 1,
    effects: [{ type: 'ambience', amount: 1, radius: 3 }],
  },
  {
    id: 'deco_fountain',
    category: 'decoration',
    nameKey: 'building.deco_fountain',
    size: { w: 1, h: 1 },
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 9_000, stone: 10 },
    constructionSec: 20,
    xpReward: 3,
    effects: [{ type: 'ambience', amount: 2, radius: 4 }],
  },
  {
    id: 'deco_bench',
    category: 'decoration',
    nameKey: 'building.deco_bench',
    size: { w: 1, h: 1 },
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 2_400, wood: 5 },
    constructionSec: 0,
    xpReward: 1,
    effects: [{ type: 'ambience', amount: 1, radius: 2 }],
  },
];
