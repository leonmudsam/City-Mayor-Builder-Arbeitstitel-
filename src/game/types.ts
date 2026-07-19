// Core game state types. This file (like everything under src/game) is pure
// TypeScript — it must never import UI, rendering, or DOM code.

export type ResourceId = 'money' | 'wood' | 'stone' | 'food' | 'freshwater';
export type NeedId = 'housing' | 'water' | 'food' | 'work' | 'leisure' | 'energy' | 'safety' | 'health' | 'freshwater';
export type BuildingCategory =
  | 'roads'
  | 'residential'
  | 'production'
  | 'services'
  | 'energy'
  | 'leisure'
  | 'economy'
  | 'government'
  | 'infrastructure'
  | 'decoration'
  | 'special';

export type BuildingDefId = string;
export type BuildingInstanceId = string;
/**
 * Numerische Id einer organischen Region (§ Welt 2.0): 1..REGION_COUNT aus dem
 * Bake (`islandRegions.gen.ts`); 0 ist der Ozean und existiert nie als State.
 */
export type RegionId = number;
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
  /**
   * The building's *completed* stage — the one whose effects are live. It is
   * only advanced when an upgrade finishes, never when it starts (§2), so a
   * building keeps all its current-stage effects for the whole build time.
   */
  upgradeLevel: number;
  status: BuildingStatus;
  /**
   * Stage an in-progress upgrade is heading toward (§2 critical upgrade fix).
   * Set while `status === 'constructing'` for an *upgrade* (not a fresh build);
   * on completion the tick copies it into `upgradeLevel` and clears it. Its
   * presence is what distinguishes "upgrading (old effects stay active)" from
   * "newly building (no effects yet)".
   */
  targetUpgradeLevel?: number;
  constructionEndsAt?: number;
  /**
   * Cosmetic facing, in degrees (0/90/180/270), chosen by the player before
   * placing (§ World Graphics V2 — Gebäude-Rotation). Purely visual: rotates the
   * rendered model around its footprint centre. Footprint tiles, placement
   * validity and gameplay are entirely unaffected. Undefined ≙ 0.
   */
  rotation?: 0 | 90 | 180 | 270;
}

/**
 * Sicht auf eine Welt-Kachel. Seit Schema v10 ABGELEITET, nicht gespeichert:
 * `terrain` kommt aus dem gebackenen Insel-Grid (+ sparse Overrides), die
 * Belegung aus dem Gebäude-Index (§ Slim-Save, docs/SAVE_MIGRATION.md).
 * Mutationen laufen über die Occupancy-Helfer in `map/world.ts` — Schreiben auf
 * dieses Objekt hätte keine Wirkung.
 */
export interface TileState {
  terrain: TerrainType;
  buildingId?: BuildingInstanceId;
}

/**
 * Region-Zustand (Schema v11, § Welt 2.0): nur der Spielfortschritt. Welche
 * Kacheln zur Region gehören, ihr Terrain und ihre Nachbarschaft sind
 * deterministisch aus dem Bake ableitbar (`islandRegions.gen.ts`) und werden
 * nie persistiert — das hält Saves winzig.
 */
export interface RegionState {
  id: RegionId;
  districtId: DistrictId;
  status: 'locked' | 'unlocked';
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

/**
 * Timed session bonus. `happiness` adds points, `tax` and `production` are
 * multipliers, `foodDistribution` ignores `amount` and lifts undistributed
 * food delivery to 100 % while active (manual distribution run, § Stadtarbeit).
 * Buffs expire on wall-clock time but only ever *apply* during live ticks —
 * the economy doesn't run offline, so buffs can't boost anything there.
 */
export interface ActiveBuff {
  id: string;
  kind: 'happiness' | 'tax' | 'production' | 'foodDistribution';
  amount: number;
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
  /**
   * ADDITIONAL regions the player actively unlocked (v0.21 §5, seit v11
   * Regionen statt Sektoren): die Startregion zählt NICHT mit.
   */
  regionsUnlocked: number;
  /** Completed building upgrades, total and per definition (quest goals). */
  upgradesCompleted: number;
  upgraded: Record<BuildingDefId, number>;
  /** Lifetime money earned by actively selling/fulfilling trade (quest goals). */
  tradeEarnings: number;
  /** Completed Stadtarbeit activities of any type (quest goals). */
  activitiesCompleted: number;
}

/**
 * A running Stadtarbeit activity (§ aktives Stadtmanagement). Targets are
 * building instances the player must click on the map; `done` flips per
 * delivery/inspection. For drive missions the array order is the planned,
 * numbered stop order. Completion, rewards and cooldowns are handled by
 * controller commands — never by the tick, so nothing completes offline.
 */
export interface ActiveActivity {
  defId: string;
  startedAt: number;
  /** Optional deadline; delivery pays a speed bonus when beaten. */
  expiresAt?: number;
  targets: { buildingId: BuildingInstanceId; done: boolean }[];
}

export interface ActivitiesState {
  active?: ActiveActivity;
  /** readyAt timestamps per activity def (cooldowns keep running offline). */
  cooldowns: Record<string, number>;
  /** Trade-contract ids already fulfilled in the current rotation window. */
  fulfilledContracts: string[];
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
    /** Alle organischen Regionen (Stubs, § v11 Welt 2.0), Key = String(RegionId). */
    regions: Record<string, RegionState>;
    districts: Record<DistrictId, DistrictState>;
    /**
     * Sparse Terrain-Abweichungen vom gebackenen Insel-Grid, Key "x,y"
     * (Debug-Werkzeuge/Tests; reguläres Gameplay verändert kein Terrain).
     */
    terrainOverrides?: Record<string, TerrainType>;
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
  activities: ActivitiesState;
  stats: GameStats;
  nextId: number;
}

export type SaveGame = GameState;
