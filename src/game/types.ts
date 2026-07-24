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
export type DriveVehicle =
  | 'handcart'
  | 'van'
  | 'medium_truck'
  | 'large_truck'
  | 'refrigerated_truck'
  | 'heavy_transporter'
  | 'fire_truck'
  | 'logging_truck'
  | 'police_car'
  | 'flatbed'
  | 'freight_train'
  | 'cargo_plane';

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
  /** In der Planung gewählte, für diesen Auftrag validierte Fahrzeugklasse. */
  vehicle?: DriveVehicle;
  /** Exakte, orthogonal zusammenhängende Straßenkette der manuellen Planung. */
  plannedRoadPath?: { x: number; y: number }[];
  /**
   * §-Stadtarbeit-Logik 2.0 (L3): an der Quelle reservierte, physisch bereits aus
   * dem globalen Pool entnommene Ladung. Jede Auslieferung zieht ihre
   * `costPerTarget` aus dieser Reserve statt aus dem Pool; ein Abbruch gibt den
   * Rest zurück. Fehlt das Feld (Alt-Save/Nicht-Ladungsmission), gilt der frühere
   * Pfad: `costPerTarget` wird pro Ziel direkt aus dem Pool entnommen.
   */
  reserved?: Partial<Record<ResourceId, number>>;
  targets: { buildingId: BuildingInstanceId; done: boolean }[];
}

/**
 * Eingefrorener Planungssnapshot eines noch nicht gestarteten Auftrags
 * (§ Stadtarbeit-Stabilität 9.1, D-037). Sobald der Spieler einen Auftrag im
 * Planer wählt, wird EINMALIG eine deterministische Zielmenge festgehalten und
 * bleibt unverändert, bis die Mission startet, der Spieler den Auftrag verwirft/
 * aktualisiert oder ein Ziel real verschwindet. Damit können die Ziele — anders
 * als beim früheren Live-RNG-Neuwürfeln pro Tick — während der Planung nicht mehr
 * springen. Nur ein Snapshot gleichzeitig (ein Planer). Save v21, additiv.
 */
export interface ActivityPlanningSelection {
  /** Auftrag, für den dieser Snapshot eingefroren wurde. */
  defId: string;
  /** Simulationszeit des Einfrierens (Diagnose/Alter). */
  createdAt: number;
  /** Seed-Epoch: eine bewusste Aktualisierung erhöht ihn und zieht neue Ziele. */
  epoch: number;
  /** Eingefrorenes Quell-Ankergebäude (fehlt = Rathaus-Fallback). */
  sourceBuildingId?: BuildingInstanceId;
  /** Eingefrorene Pflichtziele — der Kern der Stabilisierung. */
  targetBuildingIds: BuildingInstanceId[];
}

export interface ActivitiesState {
  active?: ActiveActivity;
  /**
   * §2.3: eingefrorener Planungssnapshot des aktuell offenen (noch nicht
   * gestarteten) Auftrags. Verschwindet beim Missionsstart, beim Verwerfen und
   * beim Auftragswechsel. Optional/additiv (Alt-Saves besitzen ihn nicht).
   */
  selection?: ActivityPlanningSelection;
  /** readyAt timestamps per activity def (cooldowns keep running offline). */
  cooldowns: Record<string, number>;
  /** Trade-contract ids already fulfilled in the current rotation window. */
  fulfilledContracts: string[];
}

// ---- Aktive Betriebe / Ressourcenknoten (§ Active Operations 2.0) ----------
// Persistierte Zustände des aktiven Betriebssystems. Die eigentliche Logik lebt
// in `src/game/operations/**`; diese Typen bleiben hier (wie `ActiveActivity`),
// weil `types.ts` bewusst keine Nicht-Typ-Module importiert. Details:
// docs/agents/ACTIVE_OPERATIONS_PLAN.md.

/** Naturressourcen-Knotentyp. Referenzschnitt nutzt nur 'tree'. */
export type ResourceNodeType = 'tree' | 'rock' | 'crop' | 'livestock' | 'water_source' | 'wild_plant';

/**
 * NUR die Abweichung eines Ressourcenknotens vom deterministisch abgeleiteten
 * Grundzustand (Slim-Save wie Terrain/Belegung): verfügbare Knoten werden aus
 * Welt + Positions-Hash rekonstruiert, hier stehen bloß angearbeitete,
 * reservierte, erschöpfte oder nachwachsende Knoten. Key = `"x,y"` (NodeId).
 */
export interface ResourceNodeDelta {
  /** Verbleibende Menge, falls angearbeitet (< maxAmount). */
  remaining?: number;
  /** Betrieb (buildingId), der den Knoten für einen Auftrag reserviert hat. */
  reservedBy?: string;
  /** Zeitpunkt der Erschöpfung (ms Simulationszeit). */
  depletedAt?: number;
  /** Zeitpunkt, ab dem der erschöpfte Knoten wieder verfügbar ist. */
  regenerationAt?: number;
}

/** Lokales Betriebslager eines Gebäudes (§7.1). */
export interface BuildingInventory {
  capacity: number;
  items: Partial<Record<ResourceId, number>>;
  /** Für Aufträge/Transporte gebundene Menge (§7.1). */
  reserved: Partial<Record<ResourceId, number>>;
}

export type BuildingWorkerStatus =
  | 'idle'
  | 'walking_to_target'
  | 'working'
  | 'returning'
  | 'waiting'
  | 'blocked';

/**
 * Logik-Zustand eines Betriebsarbeiters (§5). Bewusst OHNE Animationsposen — die
 * exakte Laufanimation ist Rendererzustand (§4/§21). `x`/`y` ist die aktuelle
 * Tile-Position (für Distanz und die additive Renderer-Darstellung),
 * `progress` der Fortschritt der aktuellen Phase (0..1).
 */
export interface BuildingWorkerState {
  id: string;
  status: BuildingWorkerStatus;
  targetNodeId?: string;
  carriedAmount: number;
  progress: number;
  x: number;
  y: number;
}

/**
 * Ein aktiver Betriebsauftrag (§2). Ein Betrieb hat genau einen aktiven Auftrag;
 * `targetNodeIds` ist die vom Spieler bestätigte Auswahl/Warteschlange (einzelne
 * Knoten ODER ein Arbeitsgebiet). Reihenfolge = Bearbeitungsreihenfolge.
 */
export interface ActiveBuildingOperation {
  buildingId: BuildingInstanceId;
  type: 'harvest';
  status: 'active' | 'paused';
  targetNodeIds: string[];
  startedAt: number;
}

/**
 * Phasen eines Lagertransports (§ Active Operations 2.0, Phase A5). `loading`:
 * das Fahrzeug lädt am Quellbetrieb (Ware ist im Quell-Lager reserviert, aber
 * physisch noch da). `in_transit`: die Ladung ist auf dem Fahrzeug unterwegs
 * (aus dem Quell-Lager entnommen, noch in keinem Ziel). `unloading`: am Ziel,
 * kurz vor der Einlagerung. `delivered`: eingelagert (der Transport wird danach
 * entfernt).
 */
export type InventoryTransferStatus = 'loading' | 'in_transit' | 'unloading' | 'returning' | 'delivered';

/**
 * Ein manueller Lagertransport vom lokalen Betriebslager zu einem Zielgebäude
 * (Lagerhaus/Rathaus = Zentrallager). Baut auf demselben Logistikmodell wie die
 * Stadtarbeit auf (`activities/logistics.ts` + `routeAnalysis.ts`) — KEIN zweites
 * System (§8). Erst mit der Einlagerung am Ziel wird die Ware netzwerkweit/global
 * verfügbar (§7.2: lokal vorhandene Ressourcen sind nicht automatisch überall
 * nutzbar). Persistiert bewusst nur Skalare; die Straßen-Polyline für die
 * 3D-Fahrt wird deterministisch aus dem Straßengraph rekonstruiert (Slim-Save).
 */
export interface InventoryTransfer {
  id: string;
  sourceBuildingId: BuildingInstanceId;
  /** Physisches Ziel der Fahrt (Gebäude mit Lagerkapazität). */
  targetBuildingId: BuildingInstanceId;
  resource: ResourceId;
  /** Gesamte reservierte Menge — ggf. über mehrere Fahrzeugladungen (§ A5). */
  amount: number;
  /** Bereits am Ziel eingelagerte Teilmenge (Mehrfachladungen). */
  delivered?: number;
  /** Aktuell auf dem Fahrzeug befindliche Menge. */
  onboard?: number;
  /** Gewähltes Fahrzeug (Config-Katalog). */
  vehicleId?: DriveVehicle;
  status: InventoryTransferStatus;
  /** Fortschritt der aktuellen Phase 0..1. */
  progress: number;
  /** Startzeitpunkt (ms Simulationszeit). */
  startedAt: number;
  /** Reine Fahrdauer der Strecke in ms (bei Erstellung aus Route/Fahrzeug fixiert). */
  travelMs: number;
  /** Streckenlänge in Kacheln (Anzeige, bei Erstellung fixiert). */
  distanceTiles: number;
}

/**
 * Gesamtzustand des aktiven Betriebssystems (Save v17, optional/additiv). Alte
 * Saves ohne dieses Feld bleiben gültig; der Controller initialisiert lazily.
 * `transfers` kam mit Save v18 (Phase A5) hinzu und ist ebenfalls optional.
 */
export interface OperationsState {
  /** Lokales Lager je Betrieb (Key = buildingId). */
  inventories: Record<BuildingInstanceId, BuildingInventory>;
  /** Arbeiterzustände je Betrieb. */
  workers: Record<BuildingInstanceId, BuildingWorkerState[]>;
  /** Aktiver Auftrag je Betrieb. */
  active: Record<BuildingInstanceId, ActiveBuildingOperation>;
  /** Abweichungen der Ressourcenknoten (Key = NodeId `"x,y"`). */
  nodeDeltas: Record<string, ResourceNodeDelta>;
  /** Laufende Lagertransporte (Key = transferId, Save v18). */
  transfers?: Record<string, InventoryTransfer>;
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
  /**
   * Aktives Betriebssystem (§ Active Operations 2.0, Save v17). Optional/additiv:
   * fehlt in Alt-Saves und wird lazily initialisiert. Siehe `OperationsState`.
   */
  operations?: OperationsState;
  stats: GameStats;
  nextId: number;
}

export type SaveGame = GameState;
