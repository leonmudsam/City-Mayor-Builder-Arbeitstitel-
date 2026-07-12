// Core game state types. This file (like everything under src/game) is pure
// TypeScript — it must never import UI, rendering, or DOM code.

export type ResourceId = 'money' | 'wood' | 'stone' | 'food' | 'freshwater';
export type NeedId = 'housing' | 'water' | 'food' | 'work' | 'leisure' | 'energy' | 'safety' | 'health' | 'freshwater';
export type BuildingCategory =
  | 'roads'
  | 'residential'
  | 'production'
  | 'services'
  | 'leisure'
  | 'economy'
  | 'government'
  | 'infrastructure'
  | 'decoration'
  | 'special';

export type BuildingDefId = string;
export type BuildingInstanceId = string;
export type SectorId = string; // "sx:sy" in sector grid coordinates (may be negative → open end)
export type DistrictId = string;
export type QuestId = string;
export type MayorActionId = string;
export type TerrainType = 'grass' | 'forest' | 'water' | 'river' | 'mountain' | 'sand' | 'fertile';

export type BuildingStatus = 'constructing' | 'active' | 'paused';

export interface BuildingInstance {
  id: BuildingInstanceId;
  defId: BuildingDefId;
  /** World tile coordinates of the top-left corner (sector-spanning). */
  x: number;
  y: number;
  upgradeLevel: number;
  status: BuildingStatus;
  constructionEndsAt?: number;
}

export interface TileState {
  terrain: TerrainType;
  buildingId?: BuildingInstanceId;
}

export interface SectorState {
  id: SectorId;
  sx: number;
  sy: number;
  districtId: DistrictId;
  status: 'locked' | 'unlocked';
  /** Row-major SECTOR_SIZE × SECTOR_SIZE tiles. */
  tiles: TileState[];
}

export interface DistrictState {
  id: DistrictId;
  nameKey: string;
  centerBuildingId: BuildingInstanceId;
}

export interface NeedState {
  supply: number;
  demand: number;
  /** 0..1, last computed fulfillment. */
  fulfillment: number;
}

export interface ActiveBuff {
  id: string;
  kind: 'happiness' | 'tax';
  amount: number; // happiness: additive points; tax: multiplier
  endsAt: number;
}

export interface ActiveEvent {
  id: string;
  type: 'fire';
  buildingId: BuildingInstanceId;
  startedAt: number;
  endsAt: number;
}

export interface MayorMessage {
  id: string;
  /** i18n key; params are interpolated by the UI. */
  textKey: string;
  params?: Record<string, string | number>;
  kind: 'complaint' | 'praise' | 'info';
  createdAt: number;
}

export interface ActiveQuest {
  questId: QuestId;
  /** Progress per objective index, same order as the quest definition. */
  progress: number[];
  claimable: boolean;
}

export interface GoldTransaction {
  id: string;
  timestamp: number;
  amount: number;
  reason: string;
  balanceAfter: number;
}

/** Lifetime counters used by quests, achievements, and mayor messages. */
export interface GameStats {
  built: Record<BuildingDefId, number>;
  /** Lifetime resources produced into storage (production is automatic). */
  produced: Record<ResourceId, number>;
  mayorActions: Record<MayorActionId, number>;
  sectorsUnlocked: number;
}

export interface GameState {
  schemaVersion: number;
  meta: {
    cityName: string;
    createdAt: number;
    lastSimTime: number;
    playTimeSec: number;
  };
  rngSeed: number;
  level: { current: number; xp: number };
  resources: Record<ResourceId, number>;
  gold: { balance: number };
  goldTransactions: GoldTransaction[];
  /**
   * Mayor fiscal policy (MVP 2): tax-rate multipliers the player can dial. Above
   * 1 earns more but costs happiness; below 1 buys goodwill at the cost of
   * income. `residentialTaxRate` scales residence tax, `commercialTaxRate`
   * scales commercial + industrial revenue. Neutral = 1.
   */
  policy: { residentialTaxRate: number; commercialTaxRate: number };
  world: {
    sectors: Record<SectorId, SectorState>; // sparse: only materialized sectors
    districts: Record<DistrictId, DistrictState>;
  };
  buildings: Record<BuildingInstanceId, BuildingInstance>;
  citizens: {
    population: number;
    happiness: number;
    needs: Record<NeedId, NeedState>;
  };
  mayor: {
    houseLevel: number;
    reputation: number; // tracked silently in MVP 1, UI in MVP 2
    actionCooldowns: Record<MayorActionId, number>; // readyAt timestamps
    messages: MayorMessage[];
  };
  quests: { completed: QuestId[]; active: ActiveQuest[] };
  buffs: ActiveBuff[];
  events: ActiveEvent[];
  stats: GameStats;
  nextId: number;
}

export type SaveGame = GameState;

export function sectorId(sx: number, sy: number): SectorId {
  return `${sx}:${sy}`;
}

export function parseSectorId(id: SectorId): { sx: number; sy: number } {
  const [a, b] = id.split(':');
  return { sx: Number(a), sy: Number(b) };
}
