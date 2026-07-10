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
  | { type: 'produce'; resource: ResourceId; perMinute: number; bufferCap: number }
  | { type: 'capacity'; need: NeedId; amount: number }
  | { type: 'coverage'; need: NeedId; radius: number }
  | { type: 'storage'; resource: ResourceId; amount: number }
  | { type: 'jobs'; amount: number }
  | { type: 'distribution'; need: NeedId }
  | { type: 'protection'; hazard: 'fire'; radius: number };

export interface BuildingUpgradeDef {
  cost: Partial<Record<ResourceId, number>>;
  constructionSec: number;
  effects: BuildingEffect[];
  xpReward: number;
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
  /** Only one instance allowed (town hall, mayor house). */
  unique?: boolean;
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
  | { type: 'collect'; resource: ResourceId; amount: number }
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
  /** Money per citizen per minute at neutral happiness. */
  taxPerCapitaPerMin: number;
  /** Happiness → tax multiplier range. */
  taxFactorMin: number;
  taxFactorMax: number;
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
}

export interface FeaturesConfig {
  goldSystem: boolean;
  testShop: boolean;
  debugTools: boolean;
}
