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
      { type: 'storage', resource: 'wood', amount: 400 },
      { type: 'storage', resource: 'stone', amount: 400 },
      { type: 'storage', resource: 'food', amount: 400 },
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
    cost: { money: 25_000, wood: 40 },
    constructionSec: 60,
    xpReward: 25,
    unique: true,
    canDemolish: false,
    canRelocate: true,
    relocationCost: { money: 3_000 },
    effects: [],
  },

  // District centre (MVP 2): the anchor of a far district, planted by the
  // "found district" project (not buildable from the menu). Like a small town
  // hall — it stores goods, employs a few, lifts the local mood and, crucially,
  // seeds its own road network so the river quarter connects without a 40-tile
  // road back to the main city (§8).
  {
    id: 'district_center',
    category: 'government',
    nameKey: 'building.district_center',
    size: { w: 3, h: 3 },
    requiresRoad: false,
    unlockLevel: 12,
    cost: {},
    constructionSec: 0,
    xpReward: 0,
    buildable: false,
    canDemolish: false,
    canRelocate: false,
    effects: [
      { type: 'jobs', amount: 5 },
      { type: 'storage', resource: 'wood', amount: 300 },
      { type: 'storage', resource: 'stone', amount: 300 },
      { type: 'storage', resource: 'food', amount: 300 },
      { type: 'ambience', amount: 2, radius: 3 },
    ],
  },

  // ---- Straßen ----
  {
    id: 'road',
    category: 'roads',
    nameKey: 'building.road',
    size: { w: 1, h: 1 },
    requiresRoad: false,
    unlockLevel: 1,
    cost: { money: 300 },
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
    cost: { money: 9_000, wood: 22 },
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
        cost: { money: 27_000, wood: 45, stone: 15 },
        constructionSec: 60,
        xpReward: 15,
        effects: [
          { type: 'housing', units: 2, minResidentsPerUnit: 2, maxResidentsPerUnit: 5, ambienceSensitivity: 1.4 },
          { type: 'demand', need: 'water', amount: 8 },
          { type: 'upkeep', resource: 'money', perMinute: 70 },
        ],
      },
      {
        cost: { money: 68_000, wood: 90, stone: 60 },
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
    cost: { money: 34_000, wood: 90, stone: 45 },
    constructionSec: 120,
    xpReward: 20,
    effects: [
      { type: 'housing', units: 6, minResidentsPerUnit: 3, maxResidentsPerUnit: 4, ambienceSensitivity: 1.0 },
      { type: 'demand', need: 'water', amount: 20 },
      { type: 'demand', need: 'energy', amount: 8 },
      { type: 'upkeep', resource: 'money', perMinute: 200 },
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
    cost: { money: 170_000, wood: 160, stone: 230 },
    constructionSec: 360,
    xpReward: 45,
    effects: [
      { type: 'housing', units: 24, minResidentsPerUnit: 3, maxResidentsPerUnit: 4, ambienceSensitivity: 1.15 },
      { type: 'demand', need: 'water', amount: 60 },
      { type: 'demand', need: 'energy', amount: 40 },
      { type: 'upkeep', resource: 'money', perMinute: 900 },
    ],
  },
  // Residential tower — the density endgame (MVP 2): a 3×3 high-rise housing
  // hundreds, so a city can actually staff its office towers. Heavy on water,
  // power and upkeep, and its residents care about their surroundings — a tower
  // without parks nearby is a grim place to live (§6, believable populations).
  {
    id: 'residential_tower',
    category: 'residential',
    nameKey: 'building.residential_tower',
    size: { w: 3, h: 3 },
    requiresRoad: true,
    unlockLevel: 12,
    cost: { money: 420_000, wood: 200, stone: 420 },
    constructionSec: 480,
    xpReward: 70,
    effects: [
      { type: 'housing', units: 60, minResidentsPerUnit: 3, maxResidentsPerUnit: 5, ambienceSensitivity: 1.25 },
      { type: 'demand', need: 'water', amount: 150 },
      { type: 'demand', need: 'energy', amount: 90 },
      { type: 'upkeep', resource: 'money', perMinute: 2_400 },
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
    cost: { money: 8_000 },
    constructionSec: 30,
    xpReward: 12,
    effects: [
      { type: 'produce', resource: 'wood', perMinute: 45 },
      { type: 'jobs', amount: 4 },
      { type: 'revenue', category: 'industrial', perMinute: 600 },
      { type: 'upkeep', resource: 'money', perMinute: 300 },
      { type: 'demand', need: 'energy', amount: 8 },
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
    cost: { money: 22_000, wood: 75 },
    constructionSec: 90,
    xpReward: 18,
    effects: [
      { type: 'produce', resource: 'stone', perMinute: 38 },
      { type: 'jobs', amount: 6 },
      { type: 'revenue', category: 'industrial', perMinute: 1_000 },
      { type: 'upkeep', resource: 'money', perMinute: 500 },
      { type: 'demand', need: 'energy', amount: 12 },
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
    cost: { money: 14_000, wood: 45 },
    constructionSec: 60,
    xpReward: 15,
    effects: [
      { type: 'produce', resource: 'food', perMinute: 42 },
      { type: 'jobs', amount: 4 },
      { type: 'revenue', category: 'industrial', perMinute: 700 },
      { type: 'upkeep', resource: 'money', perMinute: 300 },
      { type: 'demand', need: 'energy', amount: 5 },
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
    cost: { money: 5_000, wood: 8 },
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
    cost: { money: 60_000, stone: 90 },
    constructionSec: 180,
    xpReward: 28,
    effects: [
      { type: 'capacity', need: 'water', amount: 240, radius: 12 },
      { type: 'jobs', amount: 2 },
      { type: 'upkeep', resource: 'money', perMinute: 1_200 },
      { type: 'demand', need: 'energy', amount: 18 },
    ],
    buildLimit: [{ level: 7, max: 2 }, { level: 9, max: 3 }, { level: 11, max: 5 }],
  },
  {
    id: 'warehouse',
    category: 'production',
    nameKey: 'building.warehouse',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 6,
    cost: { money: 40_000, wood: 90, stone: 45 },
    constructionSec: 120,
    xpReward: 22,
    effects: [
      // Deliberately modest storage, and capped in number (below): the goal is
      // active play — production runs hot, storage stays tight, so you come back
      // to spend rather than AFK-hoard. Spamming warehouses to a huge buffer is
      // no longer possible.
      { type: 'storage', resource: 'wood', amount: 600 },
      { type: 'storage', resource: 'stone', amount: 600 },
      { type: 'storage', resource: 'food', amount: 600 },
      { type: 'jobs', amount: 2 },
      { type: 'upkeep', resource: 'money', perMinute: 300 },
      { type: 'demand', need: 'energy', amount: 4 },
    ],
    // Storage stays modest per building, but with pricier materials and faster
    // production the ceiling is now raised generously (max 10) so a committed,
    // actively-built logistics quarter can hold a real buffer — you still pay
    // money + materials + upkeep for every one, so it's investment, not spam.
    buildLimit: [{ level: 6, max: 3 }, { level: 8, max: 6 }, { level: 10, max: 10 }],
  },
  // Logistics depot — the first real supply chain (§1). Lifts the output of
  // every production building it reaches, so clustering sawmills/quarries/farms
  // around a depot is a deliberate planning play. Big, costly, jobs + upkeep,
  // and strictly limited so it rewards placement, not spam.
  {
    id: 'depot',
    category: 'production',
    nameKey: 'building.depot',
    size: { w: 3, h: 3 },
    requiresRoad: true,
    unlockLevel: 7,
    cost: { money: 105_000, wood: 90, stone: 120 },
    constructionSec: 240,
    xpReward: 35,
    effects: [
      { type: 'logistics', boostPct: 25, radius: 6 },
      { type: 'jobs', amount: 8 },
      { type: 'upkeep', resource: 'money', perMinute: 1_500 },
      { type: 'demand', need: 'energy', amount: 12 },
    ],
    buildLimit: [{ level: 7, max: 1 }, { level: 9, max: 2 }, { level: 10, max: 3 }],
  },

  // ---- Versorgung ----
  {
    id: 'market',
    category: 'services',
    nameKey: 'building.market',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 5,
    cost: { money: 30_000, wood: 60 },
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
      { type: 'demand', need: 'energy', amount: 8 },
    ],
    buildLimit: [{ level: 5, max: 2 }, { level: 8, max: 3 }, { level: 10, max: 4 }],
  },
  {
    id: 'bakery',
    category: 'services',
    nameKey: 'building.bakery',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 9,
    cost: { money: 72_000, wood: 75, stone: 60 },
    constructionSec: 240,
    xpReward: 32,
    effects: [
      { type: 'produce', resource: 'food', perMinute: 14 },
      { type: 'jobs', amount: 4 },
      { type: 'revenue', category: 'industrial', perMinute: 1_200 },
      { type: 'upkeep', resource: 'money', perMinute: 600 },
      { type: 'demand', need: 'energy', amount: 8 },
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
    cost: { money: 90_000, wood: 90, stone: 120 },
    constructionSec: 300,
    xpReward: 40,
    effects: [
      { type: 'protection', hazard: 'fire', radius: 12 },
      { type: 'jobs', amount: 6 },
      { type: 'upkeep', resource: 'money', perMinute: 1_500 },
      { type: 'demand', need: 'energy', amount: 8 },
    ],
    buildLimit: [{ level: 8, max: 2 }, { level: 10, max: 3 }],
  },
  // Police station (MVP 2): safety coverage for the homes in range — the same
  // radius-coverage machinery as the fire station, one need over. Low safety
  // drags happiness down, so a growing city must police its neighborhoods.
  {
    id: 'police_station',
    category: 'services',
    nameKey: 'building.police_station',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 13,
    cost: { money: 95_000, wood: 60, stone: 100 },
    constructionSec: 300,
    xpReward: 42,
    effects: [
      { type: 'coverage', need: 'safety', radius: 11 },
      { type: 'jobs', amount: 8 },
      { type: 'upkeep', resource: 'money', perMinute: 1_600 },
      { type: 'demand', need: 'energy', amount: 8 },
    ],
    buildLimit: [{ level: 13, max: 2 }, { level: 15, max: 4 }],
  },
  // Hospital (MVP 2): health coverage. Bigger footprint, heavier running costs
  // and power draw than the police station — the city's health safety net.
  {
    id: 'hospital',
    category: 'services',
    nameKey: 'building.hospital',
    size: { w: 3, h: 2 },
    requiresRoad: true,
    unlockLevel: 14,
    cost: { money: 140_000, wood: 80, stone: 140 },
    constructionSec: 420,
    xpReward: 52,
    effects: [
      { type: 'coverage', need: 'health', radius: 11 },
      { type: 'jobs', amount: 16 },
      { type: 'upkeep', resource: 'money', perMinute: 2_400 },
      { type: 'demand', need: 'energy', amount: 15 },
    ],
    buildLimit: [{ level: 14, max: 2 }, { level: 15, max: 3 }],
  },

  // ---- Wirtschaft ----
  {
    id: 'shop_small',
    category: 'economy',
    nameKey: 'building.shop_small',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 6,
    cost: { money: 46_000, wood: 60 },
    constructionSec: 150,
    xpReward: 24,
    effects: [
      // Trade tax — the backbone of commercial income once jobs are staffed.
      { type: 'revenue', category: 'commercial', perMinute: 4_000 },
      { type: 'jobs', amount: 8 },
      { type: 'upkeep', resource: 'money', perMinute: 1_200 },
      { type: 'demand', need: 'energy', amount: 12 },
    ],
    buildLimit: [{ level: 6, max: 2 }, { level: 9, max: 4 }],
  },
  // Office block — the city's main employer (§ Arbeitsversorgung). A big 4×2
  // footprint packed with jobs, so a residential city must zone real workplaces
  // instead of endless houses; its commercial revenue scales with staffing.
  {
    id: 'office',
    category: 'economy',
    nameKey: 'building.office',
    size: { w: 4, h: 2 },
    requiresRoad: true,
    unlockLevel: 8,
    cost: { money: 400_000, wood: 160, stone: 320 },
    constructionSec: 420,
    xpReward: 90,
    // A true downtown employer (§5): 400 jobs in a compact 4×2 tower, so dense
    // districts can host real workforces and "job-centre planning" matters. Its
    // commercial revenue scales with *filled* jobs — an office without residents
    // to staff it earns little, which self-balances the huge job count.
    effects: [
      { type: 'jobs', amount: 400 },
      { type: 'revenue', category: 'commercial', perMinute: 18_000 },
      { type: 'upkeep', resource: 'money', perMinute: 6_000 },
      { type: 'demand', need: 'energy', amount: 120 },
    ],
    buildLimit: [{ level: 8, max: 1 }, { level: 10, max: 2 }, { level: 12, max: 4 }],
  },

  // ---- Infrastruktur / Energie (MVP 2) ----
  // Coal plant — dense, reliable power for the whole grid, but it pollutes a
  // wide radius (ambience −) and burns money as fuel (high upkeep). The default
  // answer to the L11 energy crunch; you pay for it in air quality and cash.
  {
    id: 'power_plant',
    category: 'infrastructure',
    nameKey: 'building.power_plant',
    size: { w: 3, h: 3 },
    requiresRoad: true,
    unlockLevel: 11,
    cost: { money: 160_000, wood: 60, stone: 200 },
    constructionSec: 360,
    xpReward: 55,
    effects: [
      { type: 'capacity', need: 'energy', amount: 250 },
      { type: 'jobs', amount: 10 },
      { type: 'upkeep', resource: 'money', perMinute: 2_500 },
      { type: 'ambience', amount: -3, radius: 6 },
    ],
    buildLimit: [{ level: 11, max: 2 }, { level: 13, max: 3 }, { level: 15, max: 4 }],
  },
  // Wind farm — clean power: no pollution (mild positive ambience), far cheaper
  // to run, but each turbine field yields less than a coal plant and eats space.
  // The greener, land-hungry path: build several instead of one dirty plant.
  {
    id: 'wind_farm',
    category: 'infrastructure',
    nameKey: 'building.wind_farm',
    size: { w: 3, h: 3 },
    requiresRoad: true,
    unlockLevel: 12,
    cost: { money: 120_000, wood: 40, stone: 120 },
    constructionSec: 300,
    xpReward: 45,
    effects: [
      { type: 'capacity', need: 'energy', amount: 120 },
      { type: 'jobs', amount: 3 },
      { type: 'upkeep', resource: 'money', perMinute: 800 },
      { type: 'ambience', amount: 1, radius: 4 },
    ],
    buildLimit: [{ level: 12, max: 3 }, { level: 14, max: 5 }],
  },

  // ---- Freizeit ----
  {
    id: 'park',
    category: 'leisure',
    nameKey: 'building.park',
    size: { w: 2, h: 2 },
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 20_000, wood: 30 },
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
    cost: { money: 13_000, wood: 30 },
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
    cost: { money: 1_500 },
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
    cost: { money: 2_400 },
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
    cost: { money: 12_000, stone: 15 },
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
    cost: { money: 3_000, wood: 8 },
    constructionSec: 0,
    xpReward: 1,
    effects: [{ type: 'ambience', amount: 1, radius: 2 }],
  },
];
