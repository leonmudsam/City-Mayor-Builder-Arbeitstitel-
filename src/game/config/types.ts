import type {
  BuildingCategory,
  BuildingDefId,
  MayorActionId,
  NeedId,
  QuestId,
  ResourceId,
  TerrainType,
} from '../types.ts';

// ---- Building definitions -------------------------------------------------

export type BuildingEffect =
  /**
   * Production flows directly into city storage (no manual collecting).
   * `inputsPerMinute` is the production-chain hook: if set, the building
   * consumes those resources and scales its output by input availability —
   * later chains (wheat → bakery, ore → factory) are just config entries.
   */
  | { type: 'produce'; resource: ResourceId; perMinute: number; inputsPerMinute?: Partial<Record<ResourceId, number>> }
  /** With `radius`, the capacity only reaches housing within that range (wells). */
  | { type: 'capacity'; need: NeedId; amount: number; radius?: number }
  /**
   * Residential housing broken into households (§6/§7). Resident capacity is
   * `units × maxResidentsPerUnit`; `min…max` describe the believable household
   * size (shown in the UI). `ambienceSensitivity` (default 1) scales how much
   * this home's neighborhood quality shifts happiness — suburbs (small houses)
   * react more strongly to green space and industry than dense blocks do.
   */
  | { type: 'housing'; units: number; minResidentsPerUnit: number; maxResidentsPerUnit: number; ambienceSensitivity?: number }
  /**
   * Ongoing municipal income a building generates, split into legible sources
   * (§5). Commercial/industrial revenue scales with staffing (filled jobs) and
   * happiness in the tick — the generic hook for shops, markets, industry and
   * later tourism/fees. Residential income stays modeled as per-capita tax.
   */
  | { type: 'revenue'; category: 'commercial' | 'industrial'; perMinute: number }
  /**
   * Ongoing running cost a building drains while active (§ money sink). Keeps
   * income *net*: large cities pay to operate their services and infrastructure
   * instead of drowning in tax. Per-resource so material upkeep is possible
   * later; money is the default. Aggregated in the derived layer.
   */
  | { type: 'upkeep'; resource: ResourceId; perMinute: number }
  /**
   * Logistics/transport hub: lifts the output of every production building
   * within `radius` by `boostPct` percent (first real supply chain, §1). Reuses
   * the same production-bonus path as terrain, so a well-placed depot near the
   * sawmills/quarries/farms is a genuine planning decision, not decoration.
   */
  | { type: 'logistics'; boostPct: number; radius: number }
  | { type: 'coverage'; need: NeedId; radius: number }
  | { type: 'storage'; resource: ResourceId; amount: number }
  | { type: 'jobs'; amount: number }
  /**
   * Extra demand a building itself places on a need, independent of raw
   * population: bigger/upgraded homes want more water, later industry will want
   * power. Aggregated into the need's demand alongside per-capita demand — the
   * generic hook that lets "house type & level raise the water bill" (§3/§4).
   */
  | { type: 'demand'; need: NeedId; amount: number }
  /** Distributes a consumption need to housing within `radius` (market ↔ food). */
  | { type: 'distribution'; need: NeedId; radius: number }
  | { type: 'protection'; hazard: 'fire'; radius: number }
  /**
   * Environment quality aura (positive: parks/deco, negative: industry).
   * Groundwork for residential attractiveness & zoning (MVP 2): the derived
   * layer already aggregates it per residential building.
   */
  | { type: 'ambience'; amount: number; radius: number };

export interface BuildingUpgradeDef {
  cost: Partial<Record<ResourceId, number>>;
  constructionSec: number;
  effects: BuildingEffect[];
  xpReward: number;
}

/**
 * Location bonus: production scales with matching terrain near the building
 * (sawmill ↔ forest, quarry ↔ mountain, farm ↔ fertile soil). Placement
 * becomes a real decision instead of "anywhere next to a road".
 */
export interface LocationBonusDef {
  terrain: TerrainType;
  /** Chebyshev distance from the footprint within which tiles count. */
  radius: number;
  /** Bonus percent contributed by each matching tile. */
  perTilePct: number;
  /** Upper bound for the total bonus percent. */
  maxPct: number;
}

export interface BuildingDef {
  id: BuildingDefId;
  category: BuildingCategory;
  nameKey: string;
  size: { w: number; h: number };
  requiresRoad: boolean;
  unlockLevel: number;
  cost: Partial<Record<ResourceId, number>>;
  constructionSec: number;
  xpReward: number;
  effects: BuildingEffect[];
  upgrades?: BuildingUpgradeDef[];
  locationBonus?: LocationBonusDef;
  /**
   * Per-level build cap (production buildings). Ascending breakpoints: the
   * active cap is the last entry with `level` ≤ the city level. Absent → no
   * cap (houses, roads, decoration stay freely buildable, §13). Keeps players
   * from spamming resource buildings and makes placement/location a decision.
   */
  buildLimit?: { level: number; max: number }[];
  /** Only one instance allowed (town hall, mayor house). */
  unique?: boolean;
  /**
   * Whether the building can be torn down. Default true. Central/unique
   * buildings (town hall, mayor house, later district centers) set this false
   * so the city's anchor can never be lost — but they must then be relocatable
   * (see `canRelocate`) so a misplacement isn't permanent (§2).
   */
  canDemolish?: boolean;
  /**
   * Whether the building may be relocated via an explicit action in the
   * building sheet, independent of the global `moveBuildings` flag. Intended
   * for non-demolishable specials. Placement rules are re-checked on drop.
   */
  canRelocate?: boolean;
  /** Optional fee charged when relocating a `canRelocate` building. */
  relocationCost?: Partial<Record<ResourceId, number>>;
  /** Cannot be built from the menu (pre-placed buildings). */
  buildable?: boolean;
  biomeRequirement?: TerrainType[];
}

// ---- Resources & needs ----------------------------------------------------

export interface ResourceDef {
  id: ResourceId;
  nameKey: string;
  /** Base storage cap; Infinity for money. */
  baseStorage: number;
}

export interface NeedDef {
  id: NeedId;
  nameKey: string;
  unlockLevel: number;
  weight: number;
  kind: 'capacity' | 'coverage' | 'consumption';
  /** demand = population × demandPerCapita (capacity/consumption kinds). */
  demandPerCapita: number;
}

// ---- Progression ----------------------------------------------------------

export interface LevelDef {
  level: number;
  /** Cumulative XP required to reach this level. */
  xpRequired: number;
  unlocks: BuildingDefId[];
  rewards: { money?: number; gold?: number };
}

export type QuestObjective =
  | { type: 'build'; defId: BuildingDefId; count: number }
  | { type: 'population'; amount: number }
  | { type: 'resource'; resource: ResourceId; amount: number }
  /** Lifetime production of a resource (production stores automatically). */
  | { type: 'produce'; resource: ResourceId; amount: number }
  | { type: 'level'; level: number }
  | { type: 'sectors'; count: number }
  | { type: 'mayorAction'; actionId: MayorActionId; count: number }
  | { type: 'happiness'; amount: number };

export interface QuestDef {
  id: QuestId;
  titleKey: string;
  descriptionKey: string;
  unlockLevel: number;
  objectives: QuestObjective[];
  rewards: { money?: number; gold?: number; xp?: number };
  nextQuestId?: QuestId;
}

// ---- Mayor ----------------------------------------------------------------

export interface MayorActionDef {
  id: MayorActionId;
  nameKey: string;
  descriptionKey: string;
  unlockLevel: number;
  cooldownSec: number;
  effect:
    | { type: 'buff'; kind: 'happiness' | 'tax'; amount: number; durationSec: number }
    | { type: 'resolveEvents'; eventType: 'fire' };
}

// ---- World ----------------------------------------------------------------

export interface BiomeDef {
  id: string;
  nameKey: string;
  terrainTypes: TerrainType[];
  unlockLevel: number;
}

// ---- Balancing ------------------------------------------------------------

export interface BalancingConfig {
  /** Residential income (property/residence tax) per citizen per minute. */
  taxPerCapitaPerMin: number;
  /** Happiness → income multiplier range (applies to every income source). */
  taxFactorMin: number;
  taxFactorMax: number;
  /**
   * Share of the population that forms the labor force. Commercial/industrial
   * income scales with staffing: `min(1, laborForce / jobs)`. Also the
   * reference the work need uses so "filled jobs" is one consistent notion.
   */
  laborParticipation: number;
  /** Citizens moving in per minute when there is free housing & happiness ≥ threshold. */
  growthPerMin: number;
  declinePerMin: number;
  growthHappinessThreshold: number;
  declineHappinessThreshold: number;
  /** Without an active market, food fulfillment is capped at this value. */
  foodWithoutDistributionCap: number;
  startResources: Record<ResourceId, number>;
  startGold: number;
  sectorCost: { base: number; distanceFactor: number; countFactor: number };
  /** Fire risk per production/residential building per minute (level ≥ fire unlock). */
  fireChancePerBuildingPerMin: number;
  fireDurationSec: number;
  fireDurationProtectedSec: number;
  fireUnlockLevel: number;
  /** Max catch-up chunk length in seconds (accuracy of offline simulation). */
  maxTickChunkSec: number;
  /** Gold cost per started minute of remaining construction time. */
  speedupMinutesPerGold: number;
  /** Share of the invested build + upgrade cost refunded on demolition (0..1). */
  demolishRefundFactor: number;
  /** Happiness points per average ambience point (residential quality → zoning). */
  ambienceHappinessPerPoint: number;
  /** Absolute cap on the ambience happiness contribution (± this value). */
  ambienceHappinessCap: number;
  /**
   * Citizens grow more demanding as the city levels up: every level above 1
   * raises each need's demand by this fraction (expectation creep). Keeps
   * happiness from sticking at 100 % as the city grows (§3).
   */
  needExpectationPerLevel: number;
  /** Lower/upper bound the mayor can set a tax rate to (§ tax sliders). */
  taxRateMin: number;
  taxRateMax: number;
  /** Happiness lost per +1.0 of residential tax rate above neutral (residents feel it most). */
  residentialTaxHappinessPer: number;
  /** Happiness lost per +1.0 of commercial tax rate above neutral (softer: business climate). */
  commercialTaxHappinessPer: number;
  /** Level at which the first far expansion (river district) becomes possible. */
  districtUnlockLevel: number;
  /** One-off cost to found a district (the "Fernstraße/Distrikt" project, §8). */
  districtFoundCost: Partial<Record<ResourceId, number>>;
}

export interface FeaturesConfig {
  goldSystem: boolean;
  testShop: boolean;
  debugTools: boolean;
  /**
   * Relocating placed buildings. Off in MVP 1: realistic planning means a
   * misplacement is torn down and rebuilt, not dragged (§5). The engine command
   * stays for a possible later toggle; the UI gesture/button are gated on this.
   */
  moveBuildings: boolean;
}
