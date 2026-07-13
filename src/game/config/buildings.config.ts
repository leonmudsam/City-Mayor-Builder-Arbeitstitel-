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
    // Prestige stages (§ center prestige): the town hall is the heart of the
    // start city, and upgrading it — more civic jobs, a bigger central store and
    // a wider pride aura — is a long-term milestone that visibly grows the centre
    // rather than a bare number tweak. Level-gated and increasingly costly.
    upgrades: [
      {
        cost: { money: 120_000, wood: 120, stone: 120 },
        constructionSec: 180,
        xpReward: 60,
        unlockLevel: 5,
        nameKey: 'building.town_hall.2',
        effects: [
          { type: 'jobs', amount: 12 },
          { type: 'storage', resource: 'wood', amount: 700 },
          { type: 'storage', resource: 'stone', amount: 700 },
          { type: 'storage', resource: 'food', amount: 700 },
          { type: 'ambience', amount: 3, radius: 4 },
        ],
      },
      {
        cost: { money: 500_000, wood: 260, stone: 320 },
        constructionSec: 360,
        xpReward: 140,
        unlockLevel: 9,
        nameKey: 'building.town_hall.3',
        effects: [
          { type: 'jobs', amount: 24 },
          { type: 'storage', resource: 'wood', amount: 1_100 },
          { type: 'storage', resource: 'stone', amount: 1_100 },
          { type: 'storage', resource: 'food', amount: 1_100 },
          { type: 'ambience', amount: 4, radius: 5 },
        ],
      },
      {
        cost: { money: 1_500_000, wood: 500, stone: 700 },
        constructionSec: 600,
        xpReward: 300,
        unlockLevel: 13,
        nameKey: 'building.town_hall.4',
        effects: [
          { type: 'jobs', amount: 40 },
          { type: 'storage', resource: 'wood', amount: 1_600 },
          { type: 'storage', resource: 'stone', amount: 1_600 },
          { type: 'storage', resource: 'food', amount: 1_600 },
          { type: 'ambience', amount: 5, radius: 6 },
        ],
      },
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
    xpReward: 40,
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
    xpReward: 5,
    effects: [
      { type: 'housing', units: 1, minResidentsPerUnit: 2, maxResidentsPerUnit: 5, ambienceSensitivity: 1.4 },
      { type: 'demand', need: 'water', amount: 4 },
      // Residential upkeep scales with households, so it tracks population and
      // gently nets out the per-capita tax without hurting the early game.
      { type: 'upkeep', resource: 'money', perMinute: 35 },
    ],
    // Densification path (§ upgrades > spam): each stage adds households on the
    // same footprint, gated behind a city level and a steep price, so improving
    // a home beats sprawling new ones — and the house visibly grows (renderer).
    upgrades: [
      {
        cost: { money: 30_000, wood: 50, stone: 20 },
        constructionSec: 90,
        xpReward: 18,
        unlockLevel: 2,
        nameKey: 'building.house_small.2',
        effects: [
          { type: 'housing', units: 2, minResidentsPerUnit: 2, maxResidentsPerUnit: 5, ambienceSensitivity: 1.4 },
          { type: 'demand', need: 'water', amount: 8 },
          { type: 'upkeep', resource: 'money', perMinute: 70 },
        ],
      },
      {
        cost: { money: 85_000, wood: 110, stone: 80 },
        constructionSec: 240,
        xpReward: 30,
        unlockLevel: 4,
        nameKey: 'building.house_small.3',
        effects: [
          { type: 'housing', units: 3, minResidentsPerUnit: 2, maxResidentsPerUnit: 6, ambienceSensitivity: 1.3 },
          { type: 'demand', need: 'water', amount: 14 },
          { type: 'upkeep', resource: 'money', perMinute: 105 },
        ],
      },
      // Town house — the single-family lot at its densest, a small four-household
      // block. A real mid-game money goal (§ expensive long-term curve).
      {
        cost: { money: 210_000, wood: 170, stone: 150 },
        constructionSec: 300,
        xpReward: 46,
        unlockLevel: 7,
        nameKey: 'building.house_small.4',
        effects: [
          { type: 'housing', units: 4, minResidentsPerUnit: 3, maxResidentsPerUnit: 6, ambienceSensitivity: 1.2 },
          { type: 'demand', need: 'water', amount: 22 },
          { type: 'upkeep', resource: 'money', perMinute: 150 },
        ],
      },
    ],
    // Residential build limits per level (§1/§2): houses are no longer infinitely
    // spammable — the cap rises with the city so growth stays possible, but past
    // it the way forward is upgrading (denser stages) or the next housing type,
    // not another identical box. The small house is the backbone, so it keeps the
    // most generous cap. Tuned together with row/apartment/tower and their
    // capacities so every level has a believable population ceiling.
    buildLimit: [{ level: 1, max: 8 }, { level: 6, max: 10 }, { level: 9, max: 12 }, { level: 16, max: 14 }, { level: 18, max: 16 }],
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
    cost: { money: 60_000, wood: 120, stone: 70 },
    constructionSec: 120,
    xpReward: 8,
    effects: [
      // Believable populations for a real city (§3/§6): a terraced row is a dozen
      // households, not six. Water/power demand scale with the residents.
      { type: 'housing', units: 12, minResidentsPerUnit: 3, maxResidentsPerUnit: 4, ambienceSensitivity: 1.0 },
      { type: 'demand', need: 'water', amount: 34 },
      { type: 'demand', need: 'energy', amount: 16 },
      { type: 'upkeep', resource: 'money', perMinute: 260 },
    ],
    upgrades: [
      {
        cost: { money: 180_000, wood: 180, stone: 120 },
        constructionSec: 240,
        xpReward: 20,
        unlockLevel: 8,
        nameKey: 'building.house_row.2',
        effects: [
          { type: 'housing', units: 18, minResidentsPerUnit: 3, maxResidentsPerUnit: 4, ambienceSensitivity: 1.0 },
          { type: 'demand', need: 'water', amount: 52 },
          { type: 'demand', need: 'energy', amount: 26 },
          { type: 'upkeep', resource: 'money', perMinute: 400 },
        ],
      },
      {
        cost: { money: 420_000, wood: 280, stone: 220 },
        constructionSec: 360,
        xpReward: 32,
        unlockLevel: 11,
        nameKey: 'building.house_row.3',
        effects: [
          { type: 'housing', units: 26, minResidentsPerUnit: 3, maxResidentsPerUnit: 4, ambienceSensitivity: 0.95 },
          { type: 'demand', need: 'water', amount: 76 },
          { type: 'demand', need: 'energy', amount: 40 },
          { type: 'upkeep', resource: 'money', perMinute: 600 },
        ],
      },
    ],
    // Row-house cap (§1/§2): the efficient mid-game density step; a handful per
    // level, rising as the city matures.
    buildLimit: [{ level: 6, max: 6 }, { level: 9, max: 8 }, { level: 14, max: 12 }, { level: 16, max: 14 }],
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
    cost: { money: 280_000, wood: 220, stone: 320 },
    constructionSec: 360,
    xpReward: 22,
    effects: [
      // A real apartment block: ~90 households (§3/§6). This — and the tower — is
      // where a big city's population actually comes from; supply scales to match.
      { type: 'housing', units: 90, minResidentsPerUnit: 3, maxResidentsPerUnit: 4, ambienceSensitivity: 1.15 },
      { type: 'demand', need: 'water', amount: 210 },
      { type: 'demand', need: 'energy', amount: 140 },
      { type: 'upkeep', resource: 'money', perMinute: 2_600 },
    ],
    upgrades: [
      {
        cost: { money: 700_000, wood: 360, stone: 500 },
        constructionSec: 420,
        xpReward: 40,
        unlockLevel: 11,
        nameKey: 'building.apartment.2',
        effects: [
          { type: 'housing', units: 140, minResidentsPerUnit: 3, maxResidentsPerUnit: 4, ambienceSensitivity: 1.15 },
          { type: 'demand', need: 'water', amount: 330 },
          { type: 'demand', need: 'energy', amount: 220 },
          { type: 'upkeep', resource: 'money', perMinute: 4_200 },
        ],
      },
      {
        cost: { money: 1_500_000, wood: 520, stone: 760 },
        constructionSec: 540,
        xpReward: 60,
        unlockLevel: 13,
        nameKey: 'building.apartment.3',
        effects: [
          { type: 'housing', units: 200, minResidentsPerUnit: 3, maxResidentsPerUnit: 4, ambienceSensitivity: 1.1 },
          { type: 'demand', need: 'water', amount: 470 },
          { type: 'demand', need: 'energy', amount: 320 },
          { type: 'upkeep', resource: 'money', perMinute: 6_200 },
        ],
      },
    ],
    // Apartment cap (§1/§2): the workhorse of a real city's population; a handful
    // per level so density comes from upgrading them, not a wall of blocks.
    buildLimit: [{ level: 9, max: 8 }, { level: 14, max: 12 }, { level: 16, max: 14 }],
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
    cost: { money: 900_000, wood: 350, stone: 700 },
    constructionSec: 600,
    xpReward: 35,
    effects: [
      // A high-rise: ~360 apartments housing ~1 800 people (§3/§6). The density
      // endgame — one tower replaces a whole neighbourhood of houses.
      { type: 'housing', units: 360, minResidentsPerUnit: 3, maxResidentsPerUnit: 5, ambienceSensitivity: 1.25 },
      { type: 'demand', need: 'water', amount: 900 },
      { type: 'demand', need: 'energy', amount: 560 },
      { type: 'upkeep', resource: 'money', perMinute: 7_200 },
    ],
    // The skyline endgame (§ visual center growth): two more stages take the
    // tower into genuine high-rise territory, each a multi-million project gated
    // to the very top levels — the long-term "densify the centre" motor.
    upgrades: [
      {
        cost: { money: 2_400_000, wood: 600, stone: 1_100 },
        constructionSec: 600,
        xpReward: 70,
        unlockLevel: 13,
        nameKey: 'building.residential_tower.2',
        effects: [
          { type: 'housing', units: 520, minResidentsPerUnit: 3, maxResidentsPerUnit: 5, ambienceSensitivity: 1.3 },
          { type: 'demand', need: 'water', amount: 1_300 },
          { type: 'demand', need: 'energy', amount: 820 },
          { type: 'upkeep', resource: 'money', perMinute: 10_500 },
        ],
      },
      {
        cost: { money: 5_000_000, wood: 900, stone: 1_800 },
        constructionSec: 720,
        xpReward: 110,
        unlockLevel: 14,
        nameKey: 'building.residential_tower.3',
        effects: [
          { type: 'housing', units: 720, minResidentsPerUnit: 3, maxResidentsPerUnit: 5, ambienceSensitivity: 1.35 },
          { type: 'demand', need: 'water', amount: 1_820 },
          { type: 'demand', need: 'energy', amount: 1_150 },
          { type: 'upkeep', resource: 'money', perMinute: 14_800 },
        ],
      },
    ],
    // Tower cap (§1/§2): the skyline endgame. Few but enormous — six at first,
    // growing to a dozen at the metropolis levels, each a multi-thousand-resident
    // high-rise, so the very top of the population comes from towers you upgrade.
    buildLimit: [{ level: 12, max: 6 }, { level: 14, max: 12 }, { level: 16, max: 16 }],
  },

  // ---- Ressourcen / Produktion ----
  {
    id: 'sawmill',
    category: 'production',
    nameKey: 'building.sawmill',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 2,
    cost: { money: 11_000 },
    // First sawmill is free (§3): the wood loop starts the moment it unlocks, no
    // money wait. Every later sawmill costs full price.
    firstBuildDiscount: 1,
    constructionSec: 30,
    xpReward: 15,
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
    cost: { money: 45_000, wood: 120 },
    // First quarry half price (§3): eases the jump into stone production.
    firstBuildDiscount: 0.5,
    constructionSec: 90,
    xpReward: 25,
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
    cost: { money: 28_000, wood: 80 },
    // First farm is free (§3): food production starts without a money wait.
    firstBuildDiscount: 1,
    constructionSec: 60,
    xpReward: 20,
    effects: [
      // Food output scales for a real city (§ supply must keep up): a handful of
      // farms feed thousands rather than dozens.
      { type: 'produce', resource: 'food', perMinute: 220 },
      { type: 'jobs', amount: 12 },
      { type: 'revenue', category: 'industrial', perMinute: 700 },
      { type: 'upkeep', resource: 'money', perMinute: 500 },
      { type: 'demand', need: 'energy', amount: 10 },
      { type: 'ambience', amount: -1, radius: 3 },
    ],
    locationBonus: { terrain: 'fertile', radius: 2, perTilePct: 4, maxPct: 40 },
    buildLimit: [{ level: 4, max: 2 }, { level: 6, max: 3 }, { level: 9, max: 5 }, { level: 12, max: 8 }],
  },
  {
    id: 'well',
    category: 'services',
    nameKey: 'building.well',
    size: { w: 1, h: 1 },
    requiresRoad: false,
    unlockLevel: 3,
    cost: { money: 6_500, wood: 10 },
    // First well is free (§3): the water need can be answered the moment it
    // appears, so level 3 never becomes a money-wait wall.
    firstBuildDiscount: 1,
    constructionSec: 15,
    xpReward: 12,
    // A neighbourhood well: cheap early water with a real, but local, reach.
    canRelocate: true,
    effects: [
      { type: 'capacity', need: 'water', amount: 200, radius: 9 },
      { type: 'upkeep', resource: 'money', perMinute: 100 },
    ],
    // Deepen the well: more capacity and a little more reach for a growing
    // neighbourhood, without a second structure taking a tile.
    upgrades: [
      {
        cost: { money: 22_000, wood: 30, stone: 20 },
        constructionSec: 60,
        xpReward: 16,
        unlockLevel: 6,
        nameKey: 'building.well.2',
        effects: [
          { type: 'capacity', need: 'water', amount: 380, radius: 11 },
          { type: 'upkeep', resource: 'money', perMinute: 170 },
        ],
      },
    ],
  },
  {
    id: 'water_pump',
    category: 'services',
    nameKey: 'building.water_pump',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 7,
    cost: { money: 130_000, stone: 150 },
    constructionSec: 180,
    xpReward: 50,
    // City-scale waterworks: a wide reach AND a big capacity pool, so a handful
    // serve a whole district instead of one pump per block (§ radius + capacity).
    // Relocatable so growing cities can re-plan their water grid.
    canRelocate: true,
    relocationCost: { money: 15_000 },
    effects: [
      { type: 'capacity', need: 'water', amount: 3_000, radius: 18 },
      { type: 'jobs', amount: 6 },
      { type: 'upkeep', resource: 'money', perMinute: 1_600 },
      { type: 'demand', need: 'energy', amount: 30 },
    ],
    // Expand the waterworks: bigger capacity pool and reach so one upgraded plant
    // serves a metropolis quarter — cheaper on land than a wall of pumps.
    upgrades: [
      {
        cost: { money: 260_000, stone: 280 },
        constructionSec: 240,
        xpReward: 55,
        unlockLevel: 10,
        nameKey: 'building.water_pump.2',
        effects: [
          { type: 'capacity', need: 'water', amount: 5_200, radius: 20 },
          { type: 'jobs', amount: 10 },
          { type: 'upkeep', resource: 'money', perMinute: 2_600 },
          { type: 'demand', need: 'energy', amount: 50 },
        ],
      },
      {
        cost: { money: 560_000, stone: 520 },
        constructionSec: 300,
        xpReward: 75,
        unlockLevel: 13,
        nameKey: 'building.water_pump.3',
        effects: [
          { type: 'capacity', need: 'water', amount: 8_000, radius: 22 },
          { type: 'jobs', amount: 14 },
          { type: 'upkeep', resource: 'money', perMinute: 3_800 },
          { type: 'demand', need: 'energy', amount: 70 },
        ],
      },
    ],
    buildLimit: [{ level: 7, max: 2 }, { level: 9, max: 3 }, { level: 11, max: 5 }, { level: 13, max: 8 }],
  },
  {
    id: 'warehouse',
    category: 'production',
    nameKey: 'building.warehouse',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 6,
    cost: { money: 85_000, wood: 140, stone: 90 },
    constructionSec: 120,
    xpReward: 18,
    // Storage is a deliberate investment, not a spam build (§7): each warehouse
    // you already own makes the next 40 % pricier, so a third or fourth one is a
    // real budget decision. Upgrading production/logistics is usually the smarter
    // play than a wall of silos. Cap still applies on top of this.
    costScaling: 1.4,
    // First warehouse half price (§3): the first storage buffer is an easy early
    // buy; escalating cost then makes further silos a real investment.
    firstBuildDiscount: 0.5,
    effects: [
      // Deliberately modest storage, and capped in number (below): the goal is
      // active play — production runs hot, storage stays tight, so you come back
      // to spend rather than AFK-hoard. Spamming warehouses to a huge buffer is
      // no longer possible.
      // Build materials stay tight (active play), but the consumption goods a big
      // population eats/drinks (food, drinking water) get a real buffer so a large
      // city can actually store enough between production and consumption (§ scale).
      { type: 'storage', resource: 'wood', amount: 800 },
      { type: 'storage', resource: 'stone', amount: 800 },
      { type: 'storage', resource: 'food', amount: 3_000 },
      // Warehouses also buffer the freshwater product — the "Lager" step of the
      // supply chain (§3).
      { type: 'storage', resource: 'freshwater', amount: 3_000 },
      { type: 'jobs', amount: 2 },
      { type: 'upkeep', resource: 'money', perMinute: 300 },
      { type: 'demand', need: 'energy', amount: 4 },
    ],
    // Automated high-bay storage: a real capacity jump on the same footprint, the
    // upgrade answer to the escalating cost of ever more separate warehouses (§7).
    upgrades: [
      {
        cost: { money: 180_000, wood: 180, stone: 120 },
        constructionSec: 180,
        xpReward: 28,
        unlockLevel: 9,
        nameKey: 'building.warehouse.2',
        effects: [
          { type: 'storage', resource: 'wood', amount: 1_400 },
          { type: 'storage', resource: 'stone', amount: 1_400 },
          { type: 'storage', resource: 'food', amount: 5_200 },
          { type: 'storage', resource: 'freshwater', amount: 5_200 },
          { type: 'jobs', amount: 4 },
          { type: 'upkeep', resource: 'money', perMinute: 520 },
          { type: 'demand', need: 'energy', amount: 6 },
        ],
      },
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
    cost: { money: 190_000, wood: 130, stone: 180 },
    constructionSec: 240,
    xpReward: 55,
    effects: [
      { type: 'logistics', boostPct: 25, radius: 6 },
      { type: 'jobs', amount: 8 },
      { type: 'upkeep', resource: 'money', perMinute: 1_500 },
      { type: 'demand', need: 'energy', amount: 12 },
    ],
    buildLimit: [{ level: 7, max: 1 }, { level: 9, max: 2 }, { level: 10, max: 3 }],
  },
  // Waterworks (MVP 2 supply chain, §3): a riverside plant that turns river
  // access into a real, stored `freshwater` product — the start of a delivery
  // chain (waterworks → warehouse/supermarket → homes), not just background
  // infrastructure. Must border a river tile (adjacentTerrain), holds its own
  // buffer, and its output is boosted by nearby logistics depots like any
  // producer.
  {
    id: 'waterworks',
    category: 'production',
    nameKey: 'building.waterworks',
    size: { w: 3, h: 2 },
    requiresRoad: true,
    unlockLevel: 11,
    cost: { money: 260_000, wood: 80, stone: 200 },
    constructionSec: 240,
    xpReward: 65,
    adjacentTerrain: 'river',
    // Relocatable so the water grid can be re-planned as the city grows.
    canRelocate: true,
    relocationCost: { money: 25_000 },
    effects: [
      // City-scale drinking-water output for thousands of residents.
      { type: 'produce', resource: 'freshwater', perMinute: 400 },
      { type: 'storage', resource: 'freshwater', amount: 6_000 },
      { type: 'jobs', amount: 10 },
      { type: 'revenue', category: 'industrial', perMinute: 900 },
      { type: 'upkeep', resource: 'money', perMinute: 1_100 },
      { type: 'demand', need: 'energy', amount: 30 },
    ],
    buildLimit: [{ level: 11, max: 2 }, { level: 13, max: 3 }, { level: 15, max: 5 }],
  },

  // ---- Versorgung ----
  {
    id: 'market',
    category: 'services',
    nameKey: 'building.market',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 5,
    cost: { money: 55_000, wood: 90 },
    // First market half price (§3): the food-distribution step of the loop opens
    // at level 5 without a long money-wait — directly targets the "level 5 wall".
    firstBuildDiscount: 0.5,
    constructionSec: 90,
    xpReward: 45,
    // Relocatable service: reorganise supply as the city reshapes (§5).
    canRelocate: true,
    relocationCost: { money: 8_000 },
    effects: [
      // Food only reaches homes within range (§8): place the market among the
      // houses it feeds. Wider reach so it serves a real neighbourhood, not a block.
      { type: 'distribution', need: 'food', radius: 14 },
      { type: 'jobs', amount: 20 },
      // Market fees — commercial income that scales with staffing & happiness.
      { type: 'revenue', category: 'commercial', perMinute: 2_000 },
      { type: 'upkeep', resource: 'money', perMinute: 900 },
      { type: 'demand', need: 'energy', amount: 8 },
    ],
    // Grow the market hall: wider delivery reach, more stalls (jobs) and takings.
    upgrades: [
      {
        cost: { money: 150_000, wood: 140, stone: 80 },
        constructionSec: 180,
        xpReward: 55,
        unlockLevel: 8,
        nameKey: 'building.market.2',
        effects: [
          { type: 'distribution', need: 'food', radius: 18 },
          { type: 'jobs', amount: 34 },
          { type: 'revenue', category: 'commercial', perMinute: 3_400 },
          { type: 'upkeep', resource: 'money', perMinute: 1_500 },
          { type: 'demand', need: 'energy', amount: 12 },
        ],
      },
    ],
    buildLimit: [{ level: 5, max: 2 }, { level: 8, max: 3 }, { level: 10, max: 4 }],
  },
  // Supermarket (MVP 2, §4): the market's bigger successor — it distributes BOTH
  // food and the freshwater product to nearby homes, so it's a real end-of-chain
  // node, not just an abstract radius. It buffers freshwater it receives, shows
  // its delivered area via the generic coverage overlay, and covers a wider
  // radius than the basic market. Place it near dense housing.
  {
    id: 'supermarket',
    category: 'services',
    nameKey: 'building.supermarket',
    size: { w: 3, h: 2 },
    requiresRoad: true,
    unlockLevel: 12,
    cost: { money: 340_000, wood: 120, stone: 180 },
    constructionSec: 300,
    xpReward: 80,
    canRelocate: true,
    relocationCost: { money: 30_000 },
    effects: [
      // Wide, city-scale reach for both food and drinking water.
      { type: 'distribution', need: 'food', radius: 16 },
      { type: 'distribution', need: 'freshwater', radius: 16 },
      { type: 'storage', resource: 'freshwater', amount: 3_000 },
      { type: 'jobs', amount: 60 },
      { type: 'revenue', category: 'commercial', perMinute: 3_500 },
      { type: 'upkeep', resource: 'money', perMinute: 1_100 },
      { type: 'demand', need: 'energy', amount: 12 },
    ],
    buildLimit: [{ level: 12, max: 2 }, { level: 14, max: 4 }],
  },
  {
    id: 'bakery',
    category: 'services',
    nameKey: 'building.bakery',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 9,
    cost: { money: 130_000, wood: 110, stone: 90 },
    constructionSec: 240,
    xpReward: 40,
    effects: [
      { type: 'produce', resource: 'food', perMinute: 90 },
      { type: 'jobs', amount: 12 },
      { type: 'revenue', category: 'industrial', perMinute: 1_200 },
      { type: 'upkeep', resource: 'money', perMinute: 700 },
      { type: 'demand', need: 'energy', amount: 8 },
    ],
    buildLimit: [{ level: 9, max: 2 }, { level: 12, max: 4 }],
  },
  {
    id: 'fire_station',
    category: 'services',
    nameKey: 'building.fire_station',
    size: { w: 2, h: 2 },
    requiresRoad: true,
    unlockLevel: 8,
    cost: { money: 240_000, wood: 120, stone: 180 },
    constructionSec: 360,
    xpReward: 85,
    // Wider response area so one station protects a real district, and
    // relocatable to re-plan coverage as the city grows (§1/§5).
    canRelocate: true,
    relocationCost: { money: 20_000 },
    effects: [
      { type: 'protection', hazard: 'fire', radius: 18 },
      { type: 'jobs', amount: 16 },
      { type: 'upkeep', resource: 'money', perMinute: 1_600 },
      { type: 'demand', need: 'energy', amount: 10 },
    ],
    // Bigger fire HQ: a wider response area covering a metropolis quarter.
    upgrades: [
      {
        cost: { money: 300_000, wood: 160, stone: 220 },
        constructionSec: 300,
        xpReward: 90,
        unlockLevel: 11,
        nameKey: 'building.fire_station.2',
        effects: [
          { type: 'protection', hazard: 'fire', radius: 24 },
          { type: 'jobs', amount: 24 },
          { type: 'upkeep', resource: 'money', perMinute: 2_600 },
          { type: 'demand', need: 'energy', amount: 14 },
        ],
      },
    ],
    buildLimit: [{ level: 8, max: 2 }, { level: 10, max: 3 }, { level: 13, max: 5 }],
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
    cost: { money: 520_000, wood: 100, stone: 260 },
    constructionSec: 360,
    xpReward: 95,
    // Radius AND capacity (§2): a wide beat, but each station only polices so
    // many residents well — past that, in-range homes read as under-served, so a
    // metropolis needs a few stations, not one per block. Relocatable (§5).
    canRelocate: true,
    relocationCost: { money: 40_000 },
    effects: [
      { type: 'coverage', need: 'safety', radius: 16, capacity: 8_000 },
      { type: 'jobs', amount: 30 },
      { type: 'upkeep', resource: 'money', perMinute: 1_800 },
      { type: 'demand', need: 'energy', amount: 12 },
    ],
    // Police HQ: the capacity upgrade (§2) — polices far more residents in a
    // wider beat, so a growing metropolis scales safety by upgrading, not spamming.
    upgrades: [
      {
        cost: { money: 900_000, stone: 420 },
        constructionSec: 420,
        xpReward: 120,
        unlockLevel: 14,
        nameKey: 'building.police_station.2',
        effects: [
          { type: 'coverage', need: 'safety', radius: 18, capacity: 14_000 },
          { type: 'jobs', amount: 46 },
          { type: 'upkeep', resource: 'money', perMinute: 2_900 },
          { type: 'demand', need: 'energy', amount: 18 },
        ],
      },
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
    cost: { money: 2_200_000, wood: 200, stone: 500 },
    constructionSec: 600,
    xpReward: 140,
    // A large hospital serves a wide area and a big population (radius + capacity,
    // §2) — the health backbone of a metropolis. Relocatable (§5).
    canRelocate: true,
    relocationCost: { money: 120_000 },
    effects: [
      { type: 'coverage', need: 'health', radius: 18, capacity: 15_000 },
      { type: 'jobs', amount: 80 },
      { type: 'upkeep', resource: 'money', perMinute: 3_000 },
      { type: 'demand', need: 'energy', amount: 25 },
    ],
    // University hospital: the top-tier health project — a multi-million upgrade
    // that nearly doubles the capacity of the city's health backbone. Available
    // at the hospital's own level as a pure long-term money goal (§ endgame sink).
    upgrades: [
      {
        cost: { money: 4_500_000, wood: 300, stone: 800 },
        constructionSec: 720,
        xpReward: 220,
        nameKey: 'building.hospital.2',
        effects: [
          { type: 'coverage', need: 'health', radius: 20, capacity: 26_000 },
          { type: 'jobs', amount: 130 },
          { type: 'upkeep', resource: 'money', perMinute: 5_000 },
          { type: 'demand', need: 'energy', amount: 40 },
        ],
      },
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
    cost: { money: 85_000, wood: 90 },
    constructionSec: 150,
    xpReward: 45,
    effects: [
      // Trade tax — the backbone of commercial income once jobs are staffed.
      { type: 'revenue', category: 'commercial', perMinute: 4_000 },
      { type: 'jobs', amount: 40 },
      { type: 'upkeep', resource: 'money', perMinute: 1_400 },
      { type: 'demand', need: 'energy', amount: 12 },
    ],
    buildLimit: [{ level: 6, max: 2 }, { level: 9, max: 4 }, { level: 12, max: 8 }],
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
    cost: { money: 850_000, wood: 260, stone: 480 },
    constructionSec: 540,
    xpReward: 200,
    // A true downtown employer (§5/§ big-city jobs): ~2 000 jobs in a compact 4×2
    // tower, so dense residential towers can actually be staffed and "job-centre
    // planning" matters at metropolis scale. Commercial revenue scales with
    // *filled* jobs, so an office without residents to staff it earns little.
    effects: [
      { type: 'jobs', amount: 2_000 },
      { type: 'revenue', category: 'commercial', perMinute: 18_000 },
      { type: 'upkeep', resource: 'money', perMinute: 6_000 },
      { type: 'demand', need: 'energy', amount: 120 },
    ],
    // Office tower stages: many more downtown jobs on the same block, so a dense
    // residential centre can be staffed without paving new sectors with offices.
    upgrades: [
      {
        cost: { money: 1_400_000, wood: 360, stone: 700 },
        constructionSec: 600,
        xpReward: 260,
        unlockLevel: 11,
        nameKey: 'building.office.2',
        effects: [
          { type: 'jobs', amount: 3_200 },
          { type: 'revenue', category: 'commercial', perMinute: 30_000 },
          { type: 'upkeep', resource: 'money', perMinute: 9_500 },
          { type: 'demand', need: 'energy', amount: 190 },
        ],
      },
      {
        cost: { money: 3_000_000, wood: 520, stone: 1_100 },
        constructionSec: 720,
        xpReward: 360,
        unlockLevel: 13,
        nameKey: 'building.office.3',
        effects: [
          { type: 'jobs', amount: 4_600 },
          { type: 'revenue', category: 'commercial', perMinute: 44_000 },
          { type: 'upkeep', resource: 'money', perMinute: 13_500 },
          { type: 'demand', need: 'energy', amount: 270 },
        ],
      },
    ],
    buildLimit: [{ level: 8, max: 1 }, { level: 10, max: 2 }, { level: 12, max: 4 }, { level: 14, max: 7 }],
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
    cost: { money: 480_000, wood: 100, stone: 300 },
    constructionSec: 480,
    xpReward: 120,
    effects: [
      // Grid-scale output: a few plants power a metropolis (§ supply keeps up).
      { type: 'capacity', need: 'energy', amount: 3_500 },
      { type: 'jobs', amount: 20 },
      { type: 'upkeep', resource: 'money', perMinute: 3_000 },
      { type: 'ambience', amount: -3, radius: 6 },
    ],
    buildLimit: [{ level: 11, max: 2 }, { level: 13, max: 3 }, { level: 15, max: 5 }],
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
    cost: { money: 360_000, wood: 80, stone: 220 },
    constructionSec: 300,
    xpReward: 75,
    effects: [
      { type: 'capacity', need: 'energy', amount: 1_500 },
      { type: 'jobs', amount: 6 },
      { type: 'upkeep', resource: 'money', perMinute: 900 },
      { type: 'ambience', amount: 1, radius: 4 },
    ],
    buildLimit: [{ level: 12, max: 3 }, { level: 14, max: 6 }],
  },

  // ---- Freizeit ----
  {
    id: 'park',
    category: 'leisure',
    nameKey: 'building.park',
    size: { w: 2, h: 2 },
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 32_000, wood: 45 },
    constructionSec: 60,
    xpReward: 25,
    effects: [
      { type: 'coverage', need: 'leisure', radius: 11 },
      { type: 'ambience', amount: 2, radius: 6 },
      { type: 'upkeep', resource: 'money', perMinute: 250 },
    ],
    // City park: a bigger green lung with a wider leisure reach and a stronger
    // attractiveness aura — the leisure answer for a dense, upgraded centre.
    upgrades: [
      {
        cost: { money: 90_000, wood: 120 },
        constructionSec: 120,
        xpReward: 35,
        unlockLevel: 10,
        nameKey: 'building.park.2',
        effects: [
          { type: 'coverage', need: 'leisure', radius: 15 },
          { type: 'ambience', amount: 3, radius: 8 },
          { type: 'upkeep', resource: 'money', perMinute: 450 },
        ],
      },
    ],
  },
  {
    id: 'playground',
    category: 'leisure',
    nameKey: 'building.playground',
    size: { w: 2, h: 2 },
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 18_000, wood: 40 },
    constructionSec: 40,
    xpReward: 12,
    effects: [
      { type: 'coverage', need: 'leisure', radius: 7 },
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
