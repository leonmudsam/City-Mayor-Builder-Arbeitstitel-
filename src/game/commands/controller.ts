import type { GameConfig } from '../config/index.ts';
import type {
  ActivityDef,
  ActivityQuality,
  ActivityRewardTier,
  ActivityVehicleDef,
  BuildingUpgradeDef,
  DriveVehicle,
} from '../config/types.ts';
import {
  activitySelectionSeed,
  currentTradeContracts,
  pickTargets,
  pickTargetsSeeded,
  QUALITY_SCALE,
  resolveQuality,
  rewardTierFor,
  type TradeContractOffer,
} from '../simulation/activities.ts';
import type { ActiveBuildingOperation, ActivityPlanningSelection, BuildingWorkerState, GameState, InventoryTransfer, RegionId, ResourceId, ResourceNodeType, TerrainType } from '../types.ts';
import { recomputeDerived, type Derived } from '../simulation/derived.ts';
import { advance, moveInPerMin } from '../simulation/tick.ts';
import { updateQuests, objectiveTarget, questFocus, type QuestFocus } from '../simulation/quests.ts';
import {
  validatePlacement,
  isConnectedToRoad,
  waterfrontPlacementPreview,
  type BuildingRotation,
  type PlacementError,
  type WaterfrontPlacementPreview,
} from '../buildings/placement.ts';
import { locationBonusPct } from '../buildings/location.ts';
import { centerOf, demolishRefund, effectiveBuildCost, isFirstBuildDiscounted } from '../buildings/effects.ts';
import { buildLimitAt, countOf, nextLimitLevel } from '../buildings/limits.ts';
import { coverageOverlay, type CoverageOverlay } from '../buildings/coverage.ts';
import { buildingDiagnostics, primaryMarker, type Diagnosis } from '../buildings/diagnostics.ts';
import { canAfford, grantGold, grantResources, spendCost, spendGold } from '../economy/economyService.ts';
import { computeIncome, type IncomeBreakdown } from '../economy/income.ts';
import { addXp, FREE_EXPANSION_LEVEL } from '../progression/levels.ts';
import {
  clearTiles,
  findDistrictCenterSpot,
  regionUnlockBlocker,
  type RegionUnlockBlocker,
  occupyTiles,
  rebuildOccupancyIndex,
  regionHasTerrain,
  regionRoadCostFactorAt,
  regionUnlockCost,
  samplePlacementSurface,
  type PlacementSurfaceSample,
  worldTerrainAt,
} from '../map/world.ts';
import { BAKED_REGIONS, regionIdAt, startRegionConfig } from '../config/startRegion.config.ts';
import {
  analyseActivityRouteFrom,
  analyseManualActivityRouteFrom,
  activityRouteRoadAnchorsFrom,
  buildingCenter,
  computeRoadBusyness,
  forecastRouteTraffic,
  targetOrderOnPath,
  type RouteAnalysis,
  type RoutePointInput,
  type RouteRoadAnchors,
  type RouteTrafficForecast,
} from '../activities/routeAnalysis.ts';
import { regionPreview, type RegionPreview } from '../regions/regionPreview.ts';
import { gameClock, type GameClock } from '../time/gameTime.ts';
import { analyseRoadPath, type RoadPlanPreview } from '../roads/roadPlanning.ts';
import { routeRoadWaypoints } from '../roads/roadRouting.ts';
import {
  cargoPlanFor,
  evaluateCargoRoute,
  resolveCargoModel,
  evaluateInfrastructure,
  type ActivityProgress,
  type CargoPlan,
  type CargoRouteEvaluation,
  type InfrastructureEvaluation,
  type InfrastructureWarning,
} from '../activities/logistics.ts';
import { newId } from '../engine/rng.ts';
import {
  availableWorkNodes,
  cancelOperation,
  ensureInventory,
  getContinuousOperationStatus,
  getInventory,
  getOperationThroughput,
  isRenewableOperation,
  operationRadii,
  inventoryFree,
  inventoryUsed,
  nodesInWorkArea,
  operationStage,
  previewOperation,
  selectAreaNodeIds,
  setOperationPaused,
  startOperation,
  workAreaBounds,
  workerRenderStates,
  type ContinuousOperationStatus,
  type OperationPreview,
  type OperationThroughput,
  type WorkerRenderState,
} from '../operations/operations.ts';
import { resolveNode, type ResourceNode } from '../operations/nodes.ts';
import {
  availableForTransfer,
  cancelInventoryTransfer,
  createInventoryTransfer,
  inventoryNetworkOverview,
  previewTransfer,
  sampleRoutePath,
  transferRoute,
  transferTargets,
  type CreateTransferInput,
  type ResourceNetworkStat,
  type TransferError,
  type TransferPreview,
  type TransferRenderState,
  type TransferTarget,
} from '../operations/transport.ts';
import {
  buildingInfrastructureStatus,
  infrastructureNetworkOverview,
  type BuildingInfrastructureStatus,
  type InfrastructureNetworkOverview,
} from '../infrastructure/buildingInfrastructure.ts';
import {
  getAvailableHarborConnections,
  getShippingRoutePreview,
  getWaterNavigationGraph,
  type AvailableHarborConnection,
  type ShippingRoutePreview,
  type WaterNavigationGraph,
} from '../infrastructure/waterNavigation.ts';
import {
  getHarborNetworkOverview,
  getHarborNodeStatus,
  type HarborNetworkOverview,
  type HarborNodeStatus,
} from '../infrastructure/harborNodes.ts';
import type { RoadSegment } from '../infrastructure/networkSegments.ts';
import {
  getAutoTransportState,
  getLogisticsWarnings,
  setAutoTransport,
  type LogisticsWarning,
} from '../operations/autoLogistics.ts';
import {
  createShippingRoute,
  deleteShippingRoute,
  getShippingNetworkOverview,
  getShippingRoutes,
  setShippingRoutePaused,
  shippingRouteLegs,
  type CreateShippingRouteInput,
  type ShippingNetworkOverview,
  type ShippingRouteError,
  type ShippingRouteView,
} from '../infrastructure/shippingRoutes.ts';

export type CommandError =
  | PlacementError
  | 'insufficient'
  | 'not_found'
  | 'invalid'
  | 'cooldown'
  | 'locked'
  | 'feature_disabled'
  // § Active Operations 2.0, A5 Transport
  | 'no_vehicle'
  | 'no_cargo'
  | 'no_target'
  | 'no_route';

export type CommandResult = { ok: true } | { ok: false; error: CommandError };

const ok: CommandResult = { ok: true };
const fail = (error: CommandError): CommandResult => ({ ok: false, error });

/**
 * § 12.2 — Platzhalter-Id für die Gründungsprüfung. `validatePlacement`
 * benutzt `ignoreBuildingId` als „dieses Gebäude existiert bereits" und
 * überspringt damit genau die Identitätsprüfungen (`buildable:false`, `unique`,
 * Levelfreischaltung), die für das Rathaus nicht gelten dürfen. Die Id gehört
 * bewusst zu KEINEM Gebäude, damit alle Kachel-, Terrain- und Belegungsprüfungen
 * vollständig normal laufen.
 */
const FOUNDING_PLACEHOLDER_ID = '__founding__';

export type GameEvent =
  | { type: 'levelUp'; level: number }
  | { type: 'questClaimable' }
  | {
      type: 'activityCompleted';
      defId: string;
      money: number;
      xp: number;
      quality?: ActivityQuality;
      result?: ActivityRunResult;
    }
  | { type: 'change' };

/**
 * Abschlussbericht einer beendeten Stadtarbeit (§ Overhaul 8.0 / §3.3). Jeder
 * Wert stammt aus der echten Simulation bzw. der validierten Routenprojektion.
 * Optionale Felder fehlen genau dann, wenn es sie für diesen Auftragstyp NICHT
 * gibt (eine Inspektion hat keine Ladung) — die UI blendet sie dann aus, statt
 * einen Platzhalter wie „– %" anzuzeigen.
 */
export interface ActivityRunResult {
  elapsedMs: number;
  vehicle?: DriveVehicle;
  /** Fahrmissionen: aus der validierten, gezeichneten Kette. */
  distanceTiles?: number;
  efficiencyScore?: number;
  roadCoverage?: number;
  drivingDurationMs?: number;
  handlingDurationMs?: number;
  emptyTravelRatio?: number;
  /** Fahrzeugauslastung 0..1 (transportierte Menge ÷ Kapazität). */
  loadUtilisation?: number;
  /** Verkehrseinfluss des gefahrenen Weges 0..1. */
  trafficLoad?: number;
  /** §12 Qualitätsverlust verderblicher Ware 0..1. */
  spoilageRisk?: number;
  resupplyStops?: number;
  deliveryTargetsCompleted?: number;
  deliveryTargetsTotal?: number;
}

/**
 * § Final World Compaction 8.1 (§6): Ab diesem Level schenkt die Progression die
 * erste Regionserweiterung. In `progression/levels.ts` definiert und hier
 * re-exportiert, damit Controller, Quests und UI-Hinweis dieselbe Wahrheit teilen.
 */
export { FREE_EXPANSION_LEVEL };

/**
 * §26: Pause und die drei Zeitfaktoren. Der Wert ist der Multiplikator zwischen
 * realer und simulierter Zeit — 0 heißt „es vergeht keine Simulationszeit".
 */
export type SimulationSpeed = 0 | 1 | 2 | 4;

/** Auswählbare Geschwindigkeitsstufen für die HUD-Leiste. */
export const SIMULATION_SPEEDS: readonly SimulationSpeed[] = [0, 1, 2, 4];

/** Why a mission can't be started right now (§16.1 board state). */
export type ActivityUnavailableReason = 'cooldown' | 'missing_building' | 'no_targets' | 'busy';

/** One row of the Stadtarbeit mission board: a def plus its live availability. */
export interface ActivityBoardEntry {
  def: ActivityDef;
  available: boolean;
  reason?: ActivityUnavailableReason;
  /** Cooldown readyAt timestamp (only meaningful when reason === 'cooldown'). */
  readyAt: number;
  /** Level-scaled base reward preview (before quality scaling). */
  reward: { money: number; xp: number };
}

/** Platzierungs-/Verschiebe-Diagnose für die UI-Vorschau (§ Overhaul 3.0 / C4). */
export interface PlacementDiagnostics {
  /** Gesamturteil: darf hier gebaut/verschoben werden? */
  valid: boolean;
  /** Grund, falls ungültig (gleiche Codes wie `validatePlacement`). */
  reason?: PlacementError;
  terrain: TerrainType;
  regionId: number;
  /** Höhen-/Hang-/Überlappungswerte der tatsächlich geprüften Grundfläche. */
  surface: PlacementSurfaceSample;
  /** Orthogonaler Anschluss an das verbundene Straßennetz. */
  roadAccess: boolean;
  waterfront?: WaterfrontPlacementPreview;
  /** Standort-/Regionsbonus in Prozentpunkten auf die Produktion (kann negativ sein). */
  locationBonusPct: number;
  buildCost: Partial<Record<ResourceId, number>>;
}

/** Read-only route-planning snapshot for the UI. No RNG or save mutation. */
export interface ActivityRoutePlan {
  defId: string;
  sourceBuildingId?: string;
  targetBuildingIds: string[];
}

/** Optionaler, vollständig validierter Plan für eine Fahrmission. */
export interface ActivityStartPlan {
  vehicle?: DriveVehicle;
  roadPath?: { x: number; y: number }[];
}

/** Gebündeltes, RNG-neutrales Read-Model für die Planungsoberfläche. */
export interface ActivityPlanningContext {
  def: ActivityDef;
  sourceBuildingIds: string[];
  targetBuildingIds: string[];
  vehicles: ActivityVehicleDef[];
  reward: { money: number; xp: number };
}

/** Live-Projektion der gezeichneten Route; keine automatisch ergänzten Wege. */
export interface ActivityRoutePreview {
  anchors: RouteRoadAnchors;
  reachedTargetIds: string[];
  orderedTargetIds: string[];
  analysis?: RouteAnalysis;
  cargoPlan?: CargoPlan;
  cargoRoute?: CargoRouteEvaluation;
  infrastructure?: InfrastructureEvaluation;
  /**
   * §9: Verkehrsprognose des bereits gezeichneten Weges. Liegt ab der ersten
   * Kachel vor — die UI zeigt deshalb nie mehr „Wird geprüft".
   */
  traffic?: RouteTrafficForecast;
  /** §3.2: getrennte Zählung Lieferziele/Nachfüllstopps für die Anzeige. */
  progress: ActivityProgress;
  complete: boolean;
}

/**
 * Ausführungs-Momentaufnahme der laufenden Fahrmission (§ Stadtarbeit-Logik 2.0,
 * L3). Reine Read-Projektion für die 3D-/HUD-Ansicht: Zielfortschritt, noch an
 * der Quelle gehaltene Reserve und die rekonstruierte Kapazitäts-/Beladungsplanung.
 */
export interface ActivityExecutionSnapshot {
  defId: string;
  vehicle?: DriveVehicle;
  targetsTotal: number;
  targetsDone: number;
  reserved?: Partial<Record<ResourceId, number>>;
  cargo?: CargoPlan;
}

/** Lokales Betriebslager als UI-Sicht (§ Active Operations 2.0). */
export interface BuildingInventoryView {
  capacity: number;
  used: number;
  free: number;
  items: Partial<Record<ResourceId, number>>;
  reserved: Partial<Record<ResourceId, number>>;
}

/**
 * Gebündelte Betriebssicht für das Gebäudefenster (§18): Arbeiter, Auftrag,
 * lokales Lager, Reichweiten. Reine Read-Projektion.
 */
export interface BuildingOperationInfo {
  isOperationBuilding: boolean;
  resource: ResourceId;
  /**
   * Bearbeiteter Knotentyp (§A6/A7). Die UI beschriftet damit Knoten und Meldungen
   * — „Bäume", „Felsvorkommen", „Felder" — statt überall von Bäumen zu reden.
   */
  nodeType: ResourceNodeType;
  /** Wächst der Knotentyp nach? Bei `false` ist ein leeres Gebiet endgültig. */
  renewable: boolean;
  workerSlots: number;
  /** Arbeiter, die gerade unterwegs/am Arbeiten sind (nicht im Betrieb warten). */
  workersBusy: number;
  efficientRadius: number;
  maxRadius: number;
  inventory: BuildingInventoryView;
  /** Verfügbare Knoten im effizienten Arbeitsgebiet. */
  availableNodes: number;
  storageFull: boolean;
  active?: { targetCount: number; remainingCount: number; paused: boolean };
}

/**
 * The command API between UI and simulation. The UI never touches simulation
 * internals: it calls named commands and subscribes to change notifications.
 * Commands map 1:1 to later server API requests (§12).
 */
export class GameController {
  readonly config: GameConfig;
  state: GameState;
  derived: Derived;
  /** Bumped on every state change; UI subscribes via this version. */
  version = 0;

  private listeners = new Set<(event: GameEvent) => void>();

  /**
   * Reine Renderer-Hilfe: die Straßen-Polyline je Transport (transferId →
   * Kachelkette) für die interpolierte 3D-Fahrt. NICHT persistiert — sie wird
   * deterministisch aus dem Straßengraph rekonstruiert und nach Lieferung/Abbruch
   * verworfen (Slim-Save-Philosophie).
   */
  private transferRoutes = new Map<string, { x: number; y: number }[]>();

  /**
   * § Overhaul 8.0 / §26 — Simulationsgeschwindigkeit. 0 = Pause, sonst der
   * Faktor, mit dem REALE Zeit in Simulationszeit umgerechnet wird. Die
   * Geschwindigkeit ist eine Sitzungseinstellung und bewusst NICHT im Save:
   * ein Spielstand wird nie pausiert geladen, und das Schema bleibt unberührt.
   */
  private speed: SimulationSpeed = 1;

  constructor(config: GameConfig, state: GameState) {
    this.config = config;
    this.state = state;
    // § v10 Slim-Save: Kachel-Belegung ist nicht mehr persistiert — den
    // Laufzeit-Index einmal aus den Gebäude-Footprints aufbauen.
    rebuildOccupancyIndex(state, config);
    this.derived = recomputeDerived(state, config);
    updateQuests(state, config);
  }

  subscribe(listener: (event: GameEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Replace the entire game state in place (§ robust restart / import). The
   * controller *instance* stays the same, so every UI subscriber keeps working
   * — we just swap the state, rebuild derived values and quests, and notify.
   * This is what makes "start over" and "import save" work without a page
   * reload (a reload re-triggers the autosave and clobbers the change).
   */
  resetTo(state: GameState): void {
    this.state = state;
    rebuildOccupancyIndex(state, this.config);
    this.derived = recomputeDerived(state, this.config);
    updateQuests(state, this.config);
    this.notify({ type: 'change' });
  }

  private notify(event: GameEvent): void {
    this.version += 1;
    for (const listener of this.listeners) listener(event);
  }

  /** § §26: aktuelle Simulationsgeschwindigkeit (0 = Pause). */
  getSpeed(): SimulationSpeed {
    return this.speed;
  }

  /**
   * § P-B: die EINE Ingame-Uhr als reine Projektion der Simulationszeit
   * (`meta.lastSimTime`). Tag/Stunde/Minute/Jahreszeit laufen damit exakt mit der
   * gewählten Geschwindigkeit und stehen bei Pause still — die UI liest nur diesen
   * Snapshot (kein eigener Timer in React). Kein State, keine Mutation.
   */
  getGameClock(): GameClock {
    return gameClock(this.state);
  }

  /**
   * §26: Simulationsgeschwindigkeit setzen. Pause hält die GESAMTE Simulation
   * an — Einkommen, Verbrauch, Produktion, Wachstum, Bauzeit, Missionen und
   * Ereignisse gleichermaßen, weil ab dann keine Simulationszeit mehr vergeht.
   * UI, Kamera und Planungsmodi bleiben bedienbar (sie hängen nicht am Tick).
   */
  setSpeed(speed: SimulationSpeed): void {
    if (this.speed === speed) return;
    this.speed = speed;
    this.notify({ type: 'change' });
  }

  /**
   * §26 Kernvertrag: REALE vergangene Millisekunden werden mit der gewählten
   * Geschwindigkeit in Simulationszeit umgerechnet und dann durch denselben
   * einen Tick-Pfad geschickt. Dadurch skalieren Einnahmen, Verbrauch,
   * Produktion, Wachstum und Bauzeit zwangsläufig GEMEINSAM — es gibt keinen
   * Weg, nur die Einnahmen zu beschleunigen. Bei Pause vergeht keine
   * Simulationszeit, also passiert exakt nichts.
   *
   * Die Simulationsuhr (`meta.lastSimTime`) ist damit bewusst von der Echtzeit
   * entkoppelt; jedes zeitabhängige System im Spiel rechnet bereits gegen
   * `lastSimTime` und bleibt deshalb konsistent.
   */
  advanceByRealTime(realDeltaMs: number, live = false): void {
    if (this.speed === 0 || realDeltaMs <= 0) return;
    this.update(this.state.meta.lastSimTime + realDeltaMs * this.speed, live);
  }

  /**
   * Drive the simulation to `now`. `live` is `true` only for real foreground
   * ticks while the tab is visible — the entire economy (production, income,
   * growth) runs exclusively then. Offline/hidden catch-up passes `false` and
   * only advances construction timers, buff expiry and cooldown clocks.
   */
  update(now: number, live = false): void {
    if (now <= this.state.meta.lastSimTime) return;
    const result = advance(this.state, this.config, this.derived, now, live);
    this.derived = result.derived;
    if (result.levelUps > 0) this.notify({ type: 'levelUp', level: this.state.level.current });
    this.notify({ type: 'change' });
  }

  private afterStructuralChange(): void {
    this.derived = recomputeDerived(this.state, this.config);
    updateQuests(this.state, this.config);
    this.notify({ type: 'change' });
  }

  // ---- Commands -----------------------------------------------------------

  placeBuilding(defId: string, x: number, y: number, rotation?: 0 | 90 | 180 | 270): CommandResult {
    const def = this.config.buildings.get(defId);
    if (!def) return fail('not_found');
    const waterfront = waterfrontPlacementPreview(
      this.state,
      this.config,
      this.derived,
      def,
      x,
      y,
      rotation ?? 0,
    );
    const effectiveRotation = waterfront?.valid ? waterfront.suggestedRotation : (rotation ?? 0);
    const placementError = waterfront?.reason ?? validatePlacement(
      this.state,
      this.config,
      this.derived,
      def,
      x,
      y,
      def.waterfront ? { rotation: effectiveRotation } : undefined,
    );
    if (placementError) return fail(placementError);
    // Escalating cost for anti-spam utilities (warehouses, §7) or a first-build
    // discount for core economy buildings (§ faster early game). Lifetime count
    // gates the discount so demolish/rebuild can't farm it. Straßen kosten in
    // manchen Regionen mehr (§ Welt 2.0: Gebirge) — der Faktor greift genau hier.
    const cost = this.getBuildCost(defId, x, y);
    const spend = spendCost(this.state, cost, `build_${defId}`);
    if (!spend.ok) return fail('insufficient');

    const id = newId(this.state, 'b');
    const now = this.state.meta.lastSimTime;
    const instant = def.constructionSec <= 0;
    this.state.buildings[id] = {
      id,
      defId,
      x,
      y,
      upgradeLevel: 0,
      status: instant ? 'active' : 'constructing',
      ...(instant ? {} : { constructionEndsAt: now + def.constructionSec * 1000 }),
      // Cosmetic facing only (§ Gebäude-Rotation) — omit entirely for 0° so saves
      // stay minimal; footprint/placement were already validated above unrotated.
      ...(effectiveRotation ? { rotation: effectiveRotation } : {}),
    };
    occupyTiles(this.state, x, y, def.size.w, def.size.h, id);
    this.state.stats.built[defId] = (this.state.stats.built[defId] ?? 0) + 1;
    if (instant) {
      addXp(this.state, this.config, this.derived, def.xpReward);
      if (defId === 'mayor_house') this.state.mayor.houseLevel = Math.max(this.state.mayor.houseLevel, 1);
    }
    this.afterStructuralChange();
    return ok;
  }

  // ---- Gründung (§ Welt-Feinschliff 12.2) ---------------------------------
  //
  // Nutzerwunsch: „Das Rathaus soll man am Anfang selbst entscheiden können wo
  // man es platziert." Die Gründung ist bewusst KEIN normaler Bau:
  // `town_hall` ist `buildable: false` und `unique` — beides ist richtig, denn
  // im Baumenü darf das Rathaus nie auftauchen. Deshalb ein eigener,
  // einmaliger Command statt einer Ausnahme in `placeBuilding` (§2: bestehendes
  // System erweitern, keine Sonderpfade im Baupfad).

  /** Existiert bereits ein Rathaus? Abgeleitet, nie gespeichert. */
  isCityFounded(): boolean {
    return Object.values(this.state.buildings).some((building) => building.defId === 'town_hall');
  }

  /**
   * Warum die Gründung an dieser Stelle nicht geht — oder `undefined`.
   * Reine Leseprüfung für die Ghost-Vorschau; benutzt exakt dieselbe
   * `validatePlacement`-Instanz wie jeder andere Bau (§2).
   */
  getFoundingBlocker(x: number, y: number): PlacementError | undefined {
    if (this.isCityFounded()) return 'unique_exists';
    const def = this.config.buildings.get('town_hall');
    if (!def) return 'locked_building';
    // `ignoreBuildingId` überspringt genau den Block, der hier nicht gilt
    // (`buildable:false`, `unique`, Levelfreischaltung). Terrain, Bebaubarkeit,
    // Höhenbudget, Belegung UND die Regionsprüfung laufen vollständig normal —
    // nur die Startregion ist beim Gründen erschlossen, also greift
    // `region_locked` automatisch für alles andere. Kein zweiter Regionsbegriff.
    return validatePlacement(this.state, this.config, this.derived, def, x, y, {
      ignoreBuildingId: FOUNDING_PLACEHOLDER_ID,
    });
  }

  /**
   * Setzt das Rathaus und gründet damit die Stadt. Einmalig, kostenlos, sofort.
   * Die Tutorial-Achsen entstehen relativ zum GEWÄHLTEN Anker und nur dort, wo
   * sie wirklich baubar sind — eine Straße im Wasser wäre schlimmer als keine.
   */
  foundCity(x: number, y: number): CommandResult {
    const def = this.config.buildings.get('town_hall');
    if (!def) return fail('not_found');
    const blocker = this.getFoundingBlocker(x, y);
    if (blocker) return fail(blocker);
    const townHallId = newId(this.state, 'b');
    this.state.buildings[townHallId] = {
      id: townHallId,
      defId: 'town_hall',
      x,
      y,
      upgradeLevel: 0,
      status: 'active',
    };
    occupyTiles(this.state, x, y, def.size.w, def.size.h, townHallId);
    this.state.world.districts['main'] = {
      id: 'main',
      nameKey: 'district.main',
      centerBuildingId: townHallId,
    };
    this.state.stats.built['town_hall'] = (this.state.stats.built['town_hall'] ?? 0) + 1;

    // Tutorial-Achsen: dieselbe L-Form wie bisher, jetzt relativ zum gewählten
    // Anker. Jede Kachel wird einzeln geprüft; unpassende werden ausgelassen.
    const roadDef = this.config.buildings.get('road');
    if (roadDef) {
      const offsets: { dx: number; dy: number }[] = [];
      for (let dx = -5; dx <= 4; dx++) offsets.push({ dx, dy: 5 });
      for (let dy = 6; dy <= 11; dy++) offsets.push({ dx: -5, dy });
      for (const { dx, dy } of offsets) {
        const rx = x + dx;
        const ry = y + dy;
        if (regionIdAt(rx, ry) !== startRegionConfig.startRegionId) continue;
        if (validatePlacement(this.state, this.config, this.derived, roadDef, rx, ry)) continue;
        const roadId = newId(this.state, 'b');
        this.state.buildings[roadId] = { id: roadId, defId: 'road', x: rx, y: ry, upgradeLevel: 0, status: 'active' };
        occupyTiles(this.state, rx, ry, 1, 1, roadId);
      }
    }
    this.afterStructuralChange();
    return ok;
  }

  demolishBuilding(buildingId: string): CommandResult {
    const b = this.state.buildings[buildingId];
    if (!b) return fail('not_found');
    const def = this.config.buildings.get(b.defId);
    // Central buildings can't be torn down (canDemolish:false) — they relocate
    // instead (§2). `unique` implies the same protection.
    if (!def || def.canDemolish === false || def.unique) return fail('invalid');
    clearTiles(this.state, b.x, b.y, def.size.w, def.size.h, buildingId);
    delete this.state.buildings[buildingId];
    this.state.events = this.state.events.filter((e) => e.buildingId !== buildingId);
    // Refund a share of the invested materials so tearing down is a plannable
    // refactor, not a total loss. Money is uncapped; materials respect storage.
    const refund = demolishRefund(def, b.upgradeLevel, this.config.balancing.demolishRefundFactor);
    grantResources(this.state, refund, this.derived.storageCaps, `demolish_${b.defId}`);
    this.afterStructuralChange();
    return ok;
  }

  /** What a demolition would return right now (for the confirmation UI). */
  getDemolishRefund(buildingId: string): Partial<Record<ResourceId, number>> {
    const b = this.state.buildings[buildingId];
    const def = b && this.config.buildings.get(b.defId);
    if (!b || !def || def.canDemolish === false || def.unique) return {};
    return demolishRefund(def, b.upgradeLevel, this.config.balancing.demolishRefundFactor);
  }

  upgradeBuilding(buildingId: string): CommandResult {
    const b = this.state.buildings[buildingId];
    if (!b) return fail('not_found');
    const def = this.config.buildings.get(b.defId);
    if (!def?.upgrades || b.status !== 'active') return fail('invalid');
    const next = def.upgrades[b.upgradeLevel];
    if (!next) return fail('invalid');
    // Level-coupled densification (§ upgrades tied to level): a building only
    // climbs to the tier its city has earned.
    if (next.unlockLevel && this.state.level.current < next.unlockLevel) return fail('locked');
    const spend = spendCost(this.state, next.cost, `upgrade_${b.defId}`);
    if (!spend.ok) return fail('insufficient');
    // Critical upgrade fix (§2): DON'T advance upgradeLevel yet — record the
    // target and go under construction. The building keeps every effect of its
    // current (completed) stage for the whole build time; the tick promotes it
    // to `targetUpgradeLevel` only on completion. No residents evicted, no
    // production/coverage/storage dropping to zero mid-upgrade.
    b.targetUpgradeLevel = b.upgradeLevel + 1;
    b.status = 'constructing';
    b.constructionEndsAt = this.state.meta.lastSimTime + next.constructionSec * 1000;
    this.afterStructuralChange();
    return ok;
  }

  /**
   * The next upgrade stage of a building and why it is (not) available — the
   * single source the sheet uses so the "why can't I upgrade" messaging matches
   * the command exactly (§ helpful UI). `lockedUntilLevel` is set when the stage
   * exists but the city is too low a level; `affordable` reflects current funds.
   */
  getUpgradeInfo(buildingId: string): {
    next?: BuildingUpgradeDef;
    stage: number;
    maxStage: number;
    lockedUntilLevel?: number;
    affordable: boolean;
  } {
    const b = this.state.buildings[buildingId];
    const def = b && this.config.buildings.get(b.defId);
    if (!b || !def) return { stage: 0, maxStage: 0, affordable: false };
    const maxStage = def.upgrades?.length ?? 0;
    const next = def.upgrades?.[b.upgradeLevel];
    if (!next) return { stage: b.upgradeLevel, maxStage, affordable: false };
    const locked = next.unlockLevel && this.state.level.current < next.unlockLevel;
    return {
      next,
      stage: b.upgradeLevel,
      maxStage,
      ...(locked ? { lockedUntilLevel: next.unlockLevel } : {}),
      affordable: canAfford(this.state, next.cost),
    };
  }

  /**
   * Relocate an existing building. Two paths lead here (§2/§5):
   *  - the global `moveBuildings` dev flag (off in MVP 1), which lets *anything*
   *    move for free, and
   *  - a per-building `canRelocate` flag (town hall, mayor house), which lets a
   *    non-demolishable special be repositioned via its sheet, charging the
   *    optional `relocationCost`.
   * Placement rules are always re-validated against the target.
   */
  moveBuilding(buildingId: string, x: number, y: number): CommandResult {
    const b = this.state.buildings[buildingId];
    if (!b) return fail('not_found');
    const def = this.config.buildings.get(b.defId);
    if (!def) return fail('not_found');
    const viaFeature = this.config.features.moveBuildings;
    if (!viaFeature && def.canRelocate !== true) return fail('feature_disabled');
    if (b.x === x && b.y === y) return ok;
    const waterfront = waterfrontPlacementPreview(
      this.state,
      this.config,
      this.derived,
      def,
      x,
      y,
      b.rotation ?? 0,
      buildingId,
    );
    const effectiveRotation = waterfront?.valid ? waterfront.suggestedRotation : (b.rotation ?? 0);
    const placementError = waterfront?.reason ?? validatePlacement(this.state, this.config, this.derived, def, x, y, {
      ignoreBuildingId: buildingId,
      ...(def.waterfront ? { rotation: effectiveRotation } : {}),
    });
    if (placementError) return fail(placementError);
    // Relocation fee (only on the canRelocate path — the dev flag stays free).
    if (!viaFeature && def.relocationCost) {
      const spend = spendCost(this.state, def.relocationCost, `relocate_${def.id}`);
      if (!spend.ok) return fail('insufficient');
    }
    clearTiles(this.state, b.x, b.y, def.size.w, def.size.h, buildingId);
    b.x = x;
    b.y = y;
    if (effectiveRotation) b.rotation = effectiveRotation;
    else delete b.rotation;
    occupyTiles(this.state, x, y, def.size.w, def.size.h, buildingId);
    this.afterStructuralChange();
    return ok;
  }

  /**
   * Regions-Vorschau (§ C5): welche Gebäude der Regionscharakter begünstigt.
   * Reine Config-Projektion (kein State/RNG/Save) für den Regionsdialog.
   */
  regionPreview(id: RegionId): RegionPreview | undefined {
    return regionPreview(id);
  }

  unlockRegion(id: RegionId): CommandResult {
    const region = this.state.world.regions[String(id)];
    if (!region || region.status === 'unlocked') return fail('invalid');
    // § Welt 2.0: jede Freischaltung ist eine strategische Entscheidung aus der
    // RegionDefinition — Teaser-Inseln nie, Level-Gate und Voraussetzungs-
    // Regionen (z. B. Hochgebirgskern nur über die Randgebirge).
    const def = this.config.regions.get(id);
    if (!def || !def.unlockable) return fail('invalid');
    if (this.state.level.current < def.unlockLevel) return fail('locked');
    for (const prereq of def.prerequisiteRegionIds ?? []) {
      if (this.state.world.regions[String(prereq)]?.status !== 'unlocked') return fail('locked');
    }
    // § Final World Compaction 8.1: Landnachbarschaft ODER — für die
    // Archipel-Regionen — Seenachbarschaft plus echter Hafen.
    const blocker = regionUnlockBlocker(this.state, id);
    if (blocker === 'not_adjacent') return fail('invalid');
    if (blocker === 'needs_harbor') return fail('locked');
    // § §6: Die ERSTE Erweiterung nach der Startregion ist ab Level 3 gratis.
    // Es gibt dafür weder Geld- noch XP-Belohnung und kein Bürgeranliegen —
    // sie ist reine Progressionsbelohnung und einmalig.
    const free = this.isFreeRegionExpansionAvailable(id);
    const cost = free ? 0 : regionUnlockCost(this.config, id);
    const spend = spendCost(this.state, { money: cost }, 'unlock_region');
    if (!spend.ok) return fail('insufficient');
    region.status = 'unlocked';
    // Join the district of an adjacent unlocked region, so a far quarter (the
    // river district) grows coherently instead of everything reading as 'main'.
    const baked = BAKED_REGIONS[id - 1];
    for (const n of baked?.adjacent ?? []) {
      const nr = this.state.world.regions[String(n)];
      if (nr?.status === 'unlocked' && nr.districtId !== 'main') { region.districtId = nr.districtId; break; }
    }
    this.state.stats.regionsUnlocked += 1;
    // Gekaufte Erweiterungen geben XP; die kostenlose Erst-Erweiterung nicht
    // (§6: keine Belohnung, reine Progressionsgeste).
    if (!free) addXp(this.state, this.config, this.derived, 30);
    this.afterStructuralChange();
    return ok;
  }

  /**
   * § Final World Compaction 8.1 (§6) — Ist die kostenlose Erweiterung für
   * diese Region gerade verfügbar?
   *
   * Bedingungen: Level 3 erreicht, noch KEINE Erweiterung gekauft (die
   * Startregion zählt nicht mit) und die Region ist regulär erschließbar. Der
   * Spieler wählt damit eine seiner beiden frühen Nachbarregionen frei aus; die
   * andere bleibt eine normale Kaufoption. Reine Leseprüfung.
   */
  isFreeRegionExpansionAvailable(id: RegionId): boolean {
    if (this.state.stats.regionsUnlocked > 0) return false;
    const def = this.config.regions.get(id);
    if (!def?.unlockable || def.unlockLevel <= 1) return false;
    if (this.state.level.current < def.unlockLevel) return false;
    if (this.state.level.current < FREE_EXPANSION_LEVEL) return false;
    if (this.state.world.regions[String(id)]?.status === 'unlocked') return false;
    return regionUnlockBlocker(this.state, id) === undefined;
  }

  /**
   * Alle Regionen, die gerade als kostenlose Erstverwendung wählbar sind.
   * Die UI zeigt daraus die Auswahl (§6: „eine oder zwei geeignete
   * Nachbarregionen werden angeboten").
   */
  getFreeRegionExpansionOptions(): RegionId[] {
    if (this.state.stats.regionsUnlocked > 0) return [];
    if (this.state.level.current < FREE_EXPANSION_LEVEL) return [];
    return [...this.config.regions.values()]
      .filter((def) => this.isFreeRegionExpansionAvailable(def.id))
      .map((def) => def.id)
      .sort((a, b) => a - b);
  }

  /**
   * Warum eine gesperrte Region gerade nicht erschließbar ist (§ Final World
   * Compaction 8.1) — für den Regionsdialog, damit die UI die Hafenpflicht der
   * Archipel-Regionen ehrlich benennt statt nur den Knopf zu sperren. Reine
   * Leseprüfung, keine State-Mutation.
   */
  getRegionUnlockBlocker(id: RegionId): RegionUnlockBlocker | undefined {
    const region = this.state.world.regions[String(id)];
    if (!region || region.status === 'unlocked') return undefined;
    return regionUnlockBlocker(this.state, id);
  }

  /** Besitzt die Region laut Bake überhaupt einen Seezugang (Hafenkandidat)? */
  isRegionHarborDependent(id: RegionId): boolean {
    return this.config.regions.get(id)?.requiresHarbor === true;
  }

  /**
   * Found the river district — the first far expansion (§8). A one-off project
   * that plants a district centre in a locked river landscape: it unlocks the
   * region as a new district and seeds a fresh road network there, so the river
   * quarter is a self-contained build area, not a 40-tile road from downtown.
   */
  foundDistrict(id: RegionId): CommandResult {
    const bal = this.config.balancing;
    if (this.state.level.current < bal.districtUnlockLevel) return fail('locked');
    const region = this.state.world.regions[String(id)];
    if (!region || region.status === 'unlocked') return fail('invalid');
    if (this.config.regions.get(id)?.unlockable === false) return fail('invalid'); // keine Teaser-Insel
    if (!regionHasTerrain(id, 'river')) return fail('invalid'); // must be a river landscape
    if (Object.values(this.state.world.districts).some((d) => d.id === 'river')) return fail('invalid'); // one for now
    const centerDef = this.config.buildings.get('district_center');
    if (!centerDef) return fail('not_found');
    const spot = findDistrictCenterSpot(this.state, id, centerDef.size.w);
    if (!spot) return fail('terrain');
    const spend = spendCost(this.state, bal.districtFoundCost, 'found_district');
    if (!spend.ok) return fail('insufficient');

    region.status = 'unlocked';
    region.districtId = 'river';
    this.state.stats.regionsUnlocked += 1;
    // Plant the centre active at once, so it stores goods and seeds roads now.
    const centerId = newId(this.state, 'b');
    this.state.buildings[centerId] = { id: centerId, defId: 'district_center', x: spot.x, y: spot.y, upgradeLevel: 0, status: 'active' };
    occupyTiles(this.state, spot.x, spot.y, centerDef.size.w, centerDef.size.h, centerId);
    this.state.world.districts['river'] = { id: 'river', nameKey: 'district.river', centerBuildingId: centerId };
    addXp(this.state, this.config, this.derived, 120);
    this.afterStructuralChange();
    return ok;
  }

  performMayorAction(actionId: string): CommandResult {
    const action = this.config.mayorActions.find((a) => a.id === actionId);
    if (!action) return fail('not_found');
    if (action.unlockLevel > this.state.level.current) return fail('locked');
    if (this.state.mayor.houseLevel < 1) return fail('locked'); // requires the mayor house
    const now = this.state.meta.lastSimTime;
    const readyAt = this.state.mayor.actionCooldowns[actionId] ?? 0;
    if (now < readyAt) return fail('cooldown');

    const effect = action.effect;
    if (effect.type === 'buff') {
      this.state.buffs.push({
        id: newId(this.state, 'buff'),
        kind: effect.kind,
        amount: effect.amount,
        endsAt: now + effect.durationSec * 1000,
      });
    } else {
      const eventType = effect.eventType;
      for (const event of this.state.events) {
        if (event.type === eventType) {
          const b = this.state.buildings[event.buildingId];
          if (b && b.status === 'paused') b.status = 'active';
        }
      }
      this.state.events = this.state.events.filter((e) => e.type !== eventType);
    }
    this.state.mayor.actionCooldowns[actionId] = now + action.cooldownSec * 1000;
    this.state.stats.mayorActions[actionId] = (this.state.stats.mayorActions[actionId] ?? 0) + 1;
    this.state.mayor.reputation += 1;
    this.state.mayor.messages.unshift({
      id: newId(this.state, 'msg'),
      textKey: `message.mayor.${actionId}`,
      kind: 'info',
      createdAt: now,
    });
    this.afterStructuralChange();
    return ok;
  }

  /**
   * Kartenfokus eines Bürgeranliegens (§ C3). Reine Read-Projektion — kein RNG,
   * keine Mutation, kein Save. Ermöglicht „Auf Karte zeigen" ohne erfundene Daten.
   */
  questFocus(questId: string): QuestFocus | undefined {
    return questFocus(this.state, this.config, questId);
  }

  claimQuest(questId: string): CommandResult {
    const index = this.state.quests.active.findIndex((a) => a.questId === questId);
    const active = this.state.quests.active[index];
    if (!active) return fail('not_found');
    const quest = this.config.quests.get(questId);
    if (!quest || !active.claimable) return fail('invalid');
    // Double-check objectives server-side style before paying out.
    updateQuests(this.state, this.config);
    if (!active.claimable || !quest.objectives.every((o, i) => (active.progress[i] ?? 0) >= objectiveTarget(o))) {
      return fail('invalid');
    }
    this.state.quests.active.splice(index, 1);
    this.state.quests.completed.push(questId);
    if (quest.rewards.money) grantResources(this.state, { money: quest.rewards.money }, this.derived.storageCaps, `quest_${questId}`);
    // Material rewards (§16) respect storage caps like any other grant.
    if (quest.rewards.resources) grantResources(this.state, quest.rewards.resources, this.derived.storageCaps, `quest_${questId}`);
    if (quest.rewards.gold) grantGold(this.state, quest.rewards.gold, 'quest_reward');
    if (quest.rewards.xp) addXp(this.state, this.config, this.derived, quest.rewards.xp);
    updateQuests(this.state, this.config);
    this.notify({ type: 'change' });
    return ok;
  }

  /** Gold speed-up — gated behind the goldSystem feature flag (§14). */
  speedUpConstruction(buildingId: string): CommandResult {
    if (!this.config.features.goldSystem) return fail('feature_disabled');
    const b = this.state.buildings[buildingId];
    if (!b || b.status !== 'constructing' || b.constructionEndsAt === undefined) return fail('invalid');
    const remainingMin = Math.max(0, (b.constructionEndsAt - this.state.meta.lastSimTime) / 60000);
    const cost = Math.max(1, Math.ceil(remainingMin / this.config.balancing.speedupMinutesPerGold));
    const spend = spendGold(this.state, cost, 'building_speedup');
    if (!spend.ok) return fail('insufficient');
    b.constructionEndsAt = this.state.meta.lastSimTime;
    this.update(this.state.meta.lastSimTime + 1);
    return ok;
  }

  renameCity(name: string): CommandResult {
    const trimmed = name.trim().slice(0, 40);
    if (!trimmed) return fail('invalid');
    this.state.meta.cityName = trimmed;
    this.notify({ type: 'change' });
    return ok;
  }

  /**
   * Set a mayor tax rate (§ tax sliders). Clamped to the configured band; the
   * value only affects income and the happiness penalty (both per-tick), so no
   * derived recompute is needed — a plain notify refreshes the UI.
   */
  setTaxRate(kind: 'residential' | 'commercial', rate: number): CommandResult {
    if (!Number.isFinite(rate)) return fail('invalid');
    const { taxRateMin, taxRateMax } = this.config.balancing;
    const clamped = Math.max(taxRateMin, Math.min(taxRateMax, rate));
    if (kind === 'residential') this.state.policy.residentialTaxRate = clamped;
    else this.state.policy.commercialTaxRate = clamped;
    this.notify({ type: 'change' });
    return ok;
  }

  // ---- Trading (§7 Handelskontor) -----------------------------------------

  /**
   * The best trade tier the city currently has: the highest completed stage of
   * any active trading post (0 = none). Manual trading requires a trading post;
   * a higher-stage one improves the sell rate (§7 "better rates by upgrade").
   */
  private bestTradeStage(): number {
    let best = -1;
    for (const b of Object.values(this.state.buildings)) {
      if (b.status !== 'active') continue;
      const def = this.config.buildings.get(b.defId);
      if (def?.tradePost) best = Math.max(best, b.upgradeLevel);
    }
    return best; // -1 = no trading post
  }

  hasTradePost(): boolean {
    return this.bestTradeStage() >= 0;
  }

  /** Per-unit sell/buy price for a resource at the current best trade tier (§7). */
  getTradeQuote(resource: ResourceId): { sell: number; buy: number } {
    const bal = this.config.balancing;
    const base = bal.exportRates[resource] ?? 0;
    const stage = this.bestTradeStage();
    const sell = stage < 0 ? 0 : base * (1 + stage * bal.tradeSellBonusPerLevel);
    // Buying is deliberately expensive (markup on the *base* rate, no tier
    // discount) so production stays the real source and trade can't be farmed.
    const buy = base * bal.tradeBuyMarkup;
    return { sell: Math.round(sell * 100) / 100, buy: Math.round(buy * 100) / 100 };
  }

  /** Sell stored resources for money at the current tier (§7). */
  sellResource(resource: ResourceId, amount: number): CommandResult {
    if (resource === 'money' || !Number.isFinite(amount) || amount <= 0) return fail('invalid');
    if (!this.hasTradePost()) return fail('locked');
    const have = this.state.resources[resource];
    const qty = Math.min(amount, have);
    if (qty <= 0) return fail('insufficient');
    const { sell } = this.getTradeQuote(resource);
    if (sell <= 0) return fail('invalid');
    this.state.resources[resource] -= qty;
    this.state.resources.money += qty * sell;
    this.state.stats.tradeEarnings += qty * sell;
    updateQuests(this.state, this.config);
    this.notify({ type: 'change' });
    return ok;
  }

  /** Buy resources for money at the (marked-up) tier price, respecting storage (§7). */
  buyResource(resource: ResourceId, amount: number): CommandResult {
    if (resource === 'money' || !Number.isFinite(amount) || amount <= 0) return fail('invalid');
    if (!this.hasTradePost()) return fail('locked');
    const cap = this.derived.storageCaps[resource] ?? 0;
    const room = Math.max(0, cap - this.state.resources[resource]);
    const qty = Math.min(amount, room);
    if (qty <= 0) return fail('invalid'); // no storage room for it
    const { buy } = this.getTradeQuote(resource);
    const cost = qty * buy;
    if (this.state.resources.money < cost) return fail('insufficient');
    this.state.resources.money -= cost;
    this.state.resources[resource] += qty;
    this.notify({ type: 'change' });
    return ok;
  }

  // ---- Stadtarbeit (v0.21, § aktives Stadtmanagement) ----------------------
  // Short hands-on activities: deliveries and inspections put clickable targets
  // on the map, decisions open a trade-off popup, trade contracts rotate at the
  // trading post. Every reward flows through a command here, so activity income
  // is inherently active — nothing pays out offline.

  /** Activity definitions unlocked at the current level (UI list). */
  getActivityDefs(): ActivityDef[] {
    return this.config.activities.activities.filter((a) => a.unlockLevel <= this.state.level.current);
  }

  /**
   * The full mission board (§16.1): every unlocked activity with its level-
   * scaled reward preview and whether it can be started right now. Deliveries/
   * inspections need a source building and enough map targets and a free slot;
   * decisions gate on their own cooldown. No fixed cooldown blocks deliveries
   * or inspections anymore (§2) — availability is driven by the real city.
   */
  getActivityBoard(): ActivityBoardEntry[] {
    const now = this.state.meta.lastSimTime;
    const busy = this.state.activities.active !== undefined;
    return this.getActivityDefs().map((def) => {
      const tier = rewardTierFor(def, this.state.level.current);
      const readyAt = this.activityReadyAt(def.id);
      let available = true;
      let reason: ActivityUnavailableReason | undefined;
      if (def.cooldownSec && now < readyAt) {
        available = false;
        reason = 'cooldown';
      } else if (def.requiresAnyBuilding && !this.hasAnyBuilding(def.requiresAnyBuilding)) {
        available = false;
        reason = 'missing_building';
      } else if (def.type !== 'decision') {
        if (busy) {
          available = false;
          reason = 'busy';
        } else if (this.activityCandidates(def).length < 2) {
          available = false;
          reason = 'no_targets';
        }
      }
      return { def, available, ...(reason ? { reason } : {}), readyAt, reward: { money: tier.money, xp: tier.xp } };
    });
  }

  /** Cooldown readyAt timestamp for an activity (0 = ready). */
  activityReadyAt(defId: string): number {
    return this.state.activities.cooldowns[defId] ?? 0;
  }

  /** UI helper: does the city have any active building of these defIds? (§12 gated options.) */
  hasBuildingOfType(defIds: string[]): boolean {
    return this.hasAnyBuilding(defIds);
  }

  /** Open/done targets of the running activity — the renderer's map markers. */
  getActivityTargets(): { buildingId: string; done: boolean }[] {
    return this.state.activities.active?.targets ?? [];
  }

  /**
   * Preview the exact target set a route planner may reorder. Wenn ein
   * eingefrorener Planungssnapshot (§2.3) für diesen Auftrag existiert, sind
   * SEINE Ziele die Wahrheit — unverändert, egal wie oft (und bei welchem
   * Simulationsstand) die UI nachfragt. Ohne Snapshot wird eine DETERMINISTISCHE,
   * NICHT tickabhängige Vorschau abgeleitet (`pickTargetsSeeded` statt der pro
   * Tick weiterlaufenden Sim-RNG) — die Wurzel des früheren „wechselnde Ziele"-
   * Bugs. Kein RNG-Konsum, keine Save-Mutation.
   */
  getActivityRoutePlan(defId: string): ActivityRoutePlan | undefined {
    const def = this.config.activities.activities.find((activity) => activity.id === defId);
    if (!def || def.type === 'decision' || def.unlockLevel > this.state.level.current) return undefined;
    if (def.requiresAnyBuilding && !this.hasAnyBuilding(def.requiresAnyBuilding)) return undefined;
    // Eingefrorener Snapshot hat immer Vorrang — auch ein „veralteter" (Ziel
    // abgerissen) wird bewusst NICHT still ersetzt (§2.4); die UI zeigt dann über
    // getActivitySelectionStatus() einen Aktualisieren/Abbrechen-Hinweis.
    const selection = this.state.activities.selection;
    if (selection?.defId === defId) {
      return {
        defId,
        ...(selection.sourceBuildingId ? { sourceBuildingId: selection.sourceBuildingId } : {}),
        targetBuildingIds: [...selection.targetBuildingIds],
      };
    }
    const candidates = this.activityCandidates(def);
    if (candidates.length < 2) return undefined;
    const { min, max } = def.targetCount ?? { min: 3, max: 4 };
    const targetBuildingIds = pickTargetsSeeded(
      candidates,
      min,
      max,
      activitySelectionSeed(defId, this.state.meta.createdAt, 0),
    );
    const sourceBuildingId = this.firstActivitySourceId(def);
    return {
      defId,
      ...(sourceBuildingId ? { sourceBuildingId } : {}),
      targetBuildingIds,
    };
  }

  /** Erstes aktives Quell-Ankergebäude (`requiresAnyBuilding`), sonst `undefined`. */
  private firstActivitySourceId(def: ActivityDef): string | undefined {
    if (!def.requiresAnyBuilding) return undefined;
    return Object.values(this.state.buildings)
      .filter((building) => building.status === 'active' && def.requiresAnyBuilding!.includes(building.defId))
      .sort((a, b) => a.id.localeCompare(b.id))[0]?.id;
  }

  /**
   * §2.3 Planungssnapshot einfrieren. Wählt EINMALIG eine deterministische
   * Zielmenge für den Auftrag und hält sie fest, bis die Mission startet, der
   * Spieler den Auftrag verwirft/aktualisiert oder ein Ziel real verschwindet.
   * Idempotent: existiert bereits ein Snapshot für `defId` (oder läuft eine
   * Mission), passiert nichts — kein Reroll, kein `version`-Bump. Deshalb sicher
   * aus einem UI-Effekt beim Öffnen des Planers aufrufbar.
   */
  selectActivity(defId: string): CommandResult {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def || def.type === 'decision') return fail('not_found');
    // Läuft bereits eine Mission? Ihre `active.targets` sind die stabile Wahrheit.
    if (this.state.activities.active) return ok;
    if (this.state.activities.selection?.defId === defId) return ok; // schon eingefroren
    if (def.unlockLevel > this.state.level.current) return fail('locked');
    if (def.requiresAnyBuilding && !this.hasAnyBuilding(def.requiresAnyBuilding)) return fail('locked');
    if (this.activityCandidates(def).length < 2) return fail('invalid');
    this.state.activities.selection = this.freezeActivitySelection(def, 0);
    this.notify({ type: 'change' });
    return ok;
  }

  /**
   * §2.4 Nach einem echten Abriss (oder bewusst) neue Ziele ziehen. Erhöht den
   * Seed-Epoch, sodass eine genuin andere Zielmenge entsteht — nie eine stille
   * Ersetzung im Hintergrund, sondern nur auf Spielerwunsch.
   */
  refreshActivitySelection(defId: string): CommandResult {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def || def.type === 'decision') return fail('not_found');
    if (this.state.activities.active) return fail('invalid');
    if (this.activityCandidates(def).length < 2) return fail('invalid');
    const prev = this.state.activities.selection;
    const epoch = prev?.defId === defId ? prev.epoch + 1 : 0;
    this.state.activities.selection = this.freezeActivitySelection(def, epoch);
    this.notify({ type: 'change' });
    return ok;
  }

  /** Auftrag verwerfen (§2.3 „bewusst abbrechen"): Snapshot entfernen. */
  clearActivitySelection(): CommandResult {
    if (!this.state.activities.selection) return ok;
    delete this.state.activities.selection;
    this.notify({ type: 'change' });
    return ok;
  }

  private freezeActivitySelection(def: ActivityDef, epoch: number): ActivityPlanningSelection {
    const candidates = this.activityCandidates(def);
    const { min, max } = def.targetCount ?? { min: 3, max: 4 };
    const targetBuildingIds = pickTargetsSeeded(
      candidates,
      min,
      max,
      activitySelectionSeed(def.id, this.state.meta.createdAt, epoch),
    );
    const sourceBuildingId = this.firstActivitySourceId(def);
    return {
      defId: def.id,
      createdAt: this.state.meta.lastSimTime,
      epoch,
      ...(sourceBuildingId ? { sourceBuildingId } : {}),
      targetBuildingIds,
    };
  }

  /**
   * §2.4 Zustand des eingefrorenen Snapshots aus UI-Sicht:
   * `'none'` — kein Snapshot (und keine laufende Mission) für diesen Auftrag;
   * `'ok'` — Snapshot (oder laufende Mission) mit gültigen Zielen;
   * `'stale'` — mindestens ein eingefrorenes Ziel existiert nicht mehr. Die UI
   * zeigt dann statt eines stillen Zieltauschs einen Aktualisieren/Abbrechen-
   * Hinweis.
   */
  getActivitySelectionStatus(defId: string): 'none' | 'ok' | 'stale' {
    if (this.state.activities.active?.defId === defId) return 'ok';
    const selection = this.state.activities.selection;
    if (!selection || selection.defId !== defId) return 'none';
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def) return 'none';
    const candidates = new Set(this.activityCandidates(def));
    const stillValid = selection.targetBuildingIds.filter((id) => candidates.has(id));
    return stillValid.length === selection.targetBuildingIds.length && stillValid.length >= 2 ? 'ok' : 'stale';
  }

  private activityRouteSource(defId: string): RoutePointInput | undefined {
    const def = this.config.activities.activities.find((activity) => activity.id === defId);
    if (!def) return undefined;
    const sourceId = def.requiresAnyBuilding
      ? Object.values(this.state.buildings)
          .filter((building) => building.status === 'active' && def.requiresAnyBuilding!.includes(building.defId))
          .sort((a, b) => a.id.localeCompare(b.id))[0]?.id
      : undefined;
    const sourceCenter = sourceId ? buildingCenter(this.state, this.config, sourceId) : undefined;
    if (sourceCenter) return { id: 'source', ...sourceCenter };
    const townHall = Object.values(this.state.buildings).find((building) => building.defId === 'town_hall');
    const townHallCenter = townHall ? buildingCenter(this.state, this.config, townHall.id) : undefined;
    return townHallCenter
      ? { id: 'source', ...townHallCenter }
      : { id: 'source', x: startRegionConfig.townHall.x + 2.5, y: startRegionConfig.townHall.y + 2.5 };
  }

  /**
   * Kanonische Routenbewertung für den Stadtarbeit-Planer (§ Overhaul 3.0 / C2).
   * Reine Read-Projektion auf dem ECHTEN Straßengraphen (`derived.roadNetwork`)
   * — kein RNG, keine Mutation, kein Save. Ersetzt die frühere UI-Schätzung
   * (`TODO(CLAUDE_LOGIC)`). `orderedTargetIds` ist die vom Spieler gewählte
   * Zielreihenfolge; die Quelle ist das Quellgebäude der Aktivität, sonst das
   * Rathaus. Ergebnis ist eine Prognose (Belohnung entscheidet weiter die
   * Ausführungsqualität), damit die Balance nicht aus der UI verschoben wird.
   */
  analyseActivityRoute(defId: string, orderedTargetIds: string[]): RouteAnalysis | undefined {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def) return undefined;
    const source = this.activityRouteSource(defId);
    if (!source) return undefined;
    return analyseActivityRouteFrom(this.state, this.config, this.derived, source, orderedTargetIds);
  }

  /**
   * Quell-Ankergebäude einer Aktivität (Farm/Markt/Lager …) — dieselbe Wahl wie
   * `activityRouteSource`, aber als Gebäude-Id. `'town_hall'` als Fallback-Label.
   */
  private activitySourceBuildingId(def: ActivityDef): string {
    if (def.requiresAnyBuilding) {
      const source = Object.values(this.state.buildings)
        .filter((building) => building.status === 'active' && def.requiresAnyBuilding!.includes(building.defId))
        .sort((a, b) => a.id.localeCompare(b.id))[0];
      if (source) return source.id;
    }
    const townHall = Object.values(this.state.buildings).find((building) => building.defId === 'town_hall');
    return townHall?.id ?? 'town_hall';
  }

  /**
   * Ladungsplanung (§ Stadtarbeit-Logik 2.0, L2): Transportbedarf je Ziel und die
   * daraus nötigen Beladungen für die gewählte Fahrzeugklasse. Reine
   * Read-Projektion — zeigt, wann die Fahrzeugkapazität greift (Nachladen). Ändert
   * weder State noch die Auszahlung. `undefined` bei Aktivitäten ohne Ladung.
   */
  getActivityCargoPlan(defId: string, orderedTargetIds: string[], vehicle?: DriveVehicle): CargoPlan | undefined {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def) return undefined;
    const selected = vehicle ?? this.state.activities.active?.vehicle ?? def.vehicle;
    const sourceId = this.activitySourceBuildingId(def);
    return cargoPlanFor(this.state, this.config, def, selected, sourceId, orderedTargetIds);
  }

  /** Alle realen Quellgebäude des Auftrags; die erste Id ist der Startanker. */
  getActivitySupplySources(defId: string): string[] {
    const def = this.config.activities.activities.find((activity) => activity.id === defId);
    if (!def) return [];
    const allowed = new Set(def.requiresAnyBuilding ?? ['town_hall']);
    return Object.values(this.state.buildings)
      .filter((building) => building.status === 'active' && allowed.has(building.defId))
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((building) => building.id);
  }

  /** Pflichtziele der laufenden Mission oder der RNG-neutralen Vorschau. */
  getActivityDeliveryTargets(defId: string): string[] {
    const active = this.state.activities.active;
    if (active?.defId === defId) return active.targets.map((target) => target.buildingId);
    return this.getActivityRoutePlan(defId)?.targetBuildingIds ?? [];
  }

  /** Für diesen Auftrag aktuell freigeschaltete, wählbare Config-Fahrzeuge. */
  getAvailableActivityVehicles(defId: string): ActivityVehicleDef[] {
    const def = this.config.activities.activities.find((activity) => activity.id === defId);
    if (!def) return [];
    const allowed = new Set(def.vehicleOptions ?? (def.vehicle ? [def.vehicle] : []));
    return this.config.activities.vehicles.filter(
      (vehicle) =>
        allowed.has(vehicle.id) &&
        !vehicle.future &&
        vehicle.unlockLevel <= this.state.level.current,
    );
  }

  /**
   * Zentraler Planungskontext für Codex/UI (§ Redesign 4.0). Er bündelt nur
   * vorhandene Controller-/Config-Daten und mutiert weder RNG noch Save.
   */
  getActivityPlanningContext(defId: string): ActivityPlanningContext | undefined {
    const board = this.getActivityBoard().find((entry) => entry.def.id === defId);
    if (!board || board.def.type === 'decision') return undefined;
    const targetBuildingIds = this.getActivityDeliveryTargets(defId);
    if (targetBuildingIds.length === 0) return undefined;
    return {
      def: board.def,
      sourceBuildingIds: this.getActivitySupplySources(defId),
      targetBuildingIds,
      vehicles: this.getAvailableActivityVehicles(defId),
      reward: board.reward,
    };
  }

  /**
   * Route/Cargo-Vorschau des Redesigns 4.0. Die Stoppreihenfolge entsteht aus
   * den tatsächlich berührten Straßenankern. Nachfüllungen zählen nur, wenn der
   * Weg den echten Quellanker erneut erreicht. Es wird keine Lücke ergänzt.
   */
  getActivityRoutePreview(
    defId: string,
    candidateTargetIds: string[],
    roadPath: readonly { x: number; y: number }[],
    vehicle?: DriveVehicle,
  ): ActivityRoutePreview | undefined {
    const anchors = this.getActivityRouteAnchors(defId, candidateTargetIds);
    if (!anchors) return undefined;
    const reachedTargetIds = targetOrderOnPath(anchors, candidateTargetIds, roadPath);
    const planningOrder = [
      ...reachedTargetIds,
      ...candidateTargetIds.filter((id) => !reachedTargetIds.includes(id)),
    ];
    const cargoPlan = this.getActivityCargoPlan(defId, planningOrder, vehicle);
    const def = this.config.activities.activities.find((activity) => activity.id === defId);
    const sourceBuildingId = def ? this.activitySourceBuildingId(def) : 'town_hall';
    const cargoRoute = cargoPlan
      ? evaluateCargoRoute(
          cargoPlan,
          { buildingId: sourceBuildingId, ...anchors.source },
          anchors.targets.map((anchor, index) => ({
            buildingId: candidateTargetIds[index]!,
            ...anchor,
          })),
          roadPath,
        )
      : undefined;
    const orderedTargetIds = cargoRoute?.orderedTargetIds ?? reachedTargetIds;
    const analysis =
      orderedTargetIds.length === candidateTargetIds.length
        ? this.analyseManualActivityRoute(defId, orderedTargetIds, roadPath, vehicle)
        : undefined;
    const infrastructure = analysis
      ? this.getActivityInfrastructure(defId, orderedTargetIds, vehicle, {
          ...(vehicle ? { vehicle } : {}),
          roadPath: roadPath.map((point) => ({ ...point })),
        })
      : undefined;
    // §9: Die Verkehrsprognose hängt NICHT an der vollständigen Zielkette — sie
    // bewertet den gezeichneten Weg und steht deshalb ab der ersten Kachel.
    const traffic = this.getActivityTrafficForecast(roadPath, vehicle);
    return {
      anchors,
      reachedTargetIds,
      orderedTargetIds,
      ...(analysis ? { analysis } : {}),
      ...(cargoPlan ? { cargoPlan } : {}),
      ...(cargoRoute ? { cargoRoute } : {}),
      ...(infrastructure ? { infrastructure } : {}),
      ...(traffic ? { traffic } : {}),
      progress: cargoRoute?.progress ?? {
        deliveryTargetsCompleted: reachedTargetIds.length,
        deliveryTargetsTotal: candidateTargetIds.length,
        resupplyStopsCompleted: 0,
        resupplyStopsTotal: 0,
        returnRequired: false,
        returnCompleted: false,
      },
      complete: analysis !== undefined && (cargoRoute?.cargoValid ?? true),
    };
  }

  /**
   * §9 Verkehrsprognose des gezeichneten Weges. Reine Read-Projektion aus dem
   * echten Straßengraph und der Anrainerdichte; `undefined` nur bei leerem Weg.
   */
  getActivityTrafficForecast(
    roadPath: readonly { x: number; y: number }[],
    vehicle?: DriveVehicle,
  ): RouteTrafficForecast | undefined {
    if (roadPath.length === 0) return undefined;
    const vehicleDef = vehicle ? this.config.activities.vehicles.find((v) => v.id === vehicle) : undefined;
    return forecastRouteTraffic(
      roadPath,
      this.derived.roadNetwork,
      computeRoadBusyness(this.state, this.config, this.derived.roadNetwork),
      vehicleDef
        ? {
            handling: vehicleDef.handling,
            ...(vehicleDef.narrowStreetPenalty !== undefined
              ? { narrowStreetPenalty: vehicleDef.narrowStreetPenalty }
              : {}),
          }
        : undefined,
    );
  }

  /**
   * Momentaufnahme der laufenden Fahrmission (§ Stadtarbeit-Logik 2.0, L3): reine
   * Read-Projektion für 3D-Ausführung/HUD. `undefined`, wenn keine Mission läuft.
   */
  getActivityExecutionSnapshot(): ActivityExecutionSnapshot | undefined {
    const active = this.state.activities.active;
    if (!active) return undefined;
    const cargo = this.getActivityCargoPlan(
      active.defId,
      active.targets.map((t) => t.buildingId),
      active.vehicle,
    );
    return {
      defId: active.defId,
      ...(active.vehicle ? { vehicle: active.vehicle } : {}),
      targetsTotal: active.targets.length,
      targetsDone: active.targets.filter((t) => t.done).length,
      ...(active.reserved ? { reserved: { ...active.reserved } } : {}),
      ...(cargo ? { cargo } : {}),
    };
  }

  /**
   * Infrastruktur-Bewertung einer geplanten Route (§ Stadtarbeit-Logik 2.0, L4 /
   * §19). Reine Read-Projektion: Leerfahrtanteil, Fahrzeugeignung, Quellenlage,
   * Lade-/Entladezeiten und textfreie Hinweiscodes — kein State, keine Auszahlung
   * (bleibt Anzeige, DECISIONS D-013). Optionaler `plan.roadPath` bewertet die
   * konkret gezeichnete Kette, sonst die automatische Reihenfolge-Analyse.
   * `undefined`, wenn Quelle/Ziele nicht auflösbar sind.
   */
  getActivityInfrastructure(
    defId: string,
    orderedTargetIds: string[],
    vehicle?: DriveVehicle,
    plan?: ActivityStartPlan,
  ): InfrastructureEvaluation | undefined {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def) return undefined;
    const source = this.activityRouteSource(defId);
    if (!source) return undefined;
    const route =
      (plan?.roadPath
        ? analyseManualActivityRouteFrom(this.state, this.config, this.derived, source, orderedTargetIds, plan.roadPath)
        : undefined) ?? analyseActivityRouteFrom(this.state, this.config, this.derived, source, orderedTargetIds);
    if (!route) return undefined;
    const targets: { id: string; x: number; y: number }[] = [];
    for (const id of orderedTargetIds) {
      const center = buildingCenter(this.state, this.config, id);
      if (!center) return undefined;
      targets.push({ id, ...center });
    }
    const selected = vehicle ?? plan?.vehicle ?? this.state.activities.active?.vehicle ?? def.vehicle;
    const vehicleDef = selected ? this.config.activities.vehicles.find((v) => v.id === selected) : undefined;
    const cargo = cargoPlanFor(this.state, this.config, def, selected, this.activitySourceBuildingId(def), orderedTargetIds);
    const perishable = resolveCargoModel(def)?.perishable ?? false;
    return evaluateInfrastructure({
      source: { x: source.x, y: source.y },
      targets,
      route,
      ...(cargo ? { cargo } : {}),
      ...(vehicleDef ? { vehicle: vehicleDef } : {}),
      perishable,
    });
  }

  /**
   * Nur die textfreien Infrastruktur-Hinweise (§21 `getActivityInfrastructureWarnings`).
   * Dünne Projektion über `getActivityInfrastructure`; leeres Array, wenn nichts
   * auflösbar ist.
   */
  getActivityInfrastructureWarnings(
    defId: string,
    orderedTargetIds: string[],
    vehicle?: DriveVehicle,
    plan?: ActivityStartPlan,
  ): InfrastructureWarning[] {
    return this.getActivityInfrastructure(defId, orderedTargetIds, vehicle, plan)?.warnings ?? [];
  }

  /**
   * Konkrete Cargo-Simulation auf einer bereits gezeichneten Straßenkette (§
   * Stadtarbeit-Logik 2.0). Erkennt echte Quell-/Nachladekontakte und
   * Auslieferungen entlang des Pfades und misst die Leerfahrt aus den tatsächlich
   * leer gefahrenen Kacheln — die exakte Ergänzung zur planungsseitigen
   * `getActivityInfrastructure`. Reine Read-Projektion; `undefined`, wenn Anker/
   * Ladung nicht auflösbar sind.
   */
  getActivityCargoRoute(
    defId: string,
    orderedTargetIds: string[],
    roadPath: readonly { x: number; y: number }[],
    vehicle?: DriveVehicle,
  ): CargoRouteEvaluation | undefined {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def) return undefined;
    const source = this.activityRouteSource(defId);
    if (!source) return undefined;
    const anchors = activityRouteRoadAnchorsFrom(this.state, this.config, this.derived, source, orderedTargetIds);
    if (!anchors) return undefined;
    // Reale Reihenfolge, in der der Pfad die Ziele berührt (statt der Klickreihenfolge).
    const pathOrder = targetOrderOnPath(anchors, orderedTargetIds, roadPath);
    const selected = vehicle ?? this.state.activities.active?.vehicle ?? def.vehicle;
    const plan = cargoPlanFor(this.state, this.config, def, selected, this.activitySourceBuildingId(def), pathOrder);
    if (!plan) return undefined;
    const anchorById = new Map(anchors.targets.map((a) => [a.id, a] as const));
    const targetAnchors = pathOrder
      .map((id) => {
        const anchor = anchorById.get(id);
        return anchor ? { buildingId: id, x: anchor.x, y: anchor.y } : undefined;
      })
      .filter((a): a is { buildingId: string; x: number; y: number } => a !== undefined);
    return evaluateCargoRoute(
      plan,
      { buildingId: this.activitySourceBuildingId(def), x: anchors.source.x, y: anchors.source.y },
      targetAnchors,
      roadPath,
    );
  }

  /** Straßenanker für die manuelle 2D-Planung; reine Read-Projektion. */
  getActivityRouteAnchors(defId: string, orderedTargetIds: string[]): RouteRoadAnchors | undefined {
    const source = this.activityRouteSource(defId);
    return source
      ? activityRouteRoadAnchorsFrom(this.state, this.config, this.derived, source, orderedTargetIds)
      : undefined;
  }

  /** Kanonische Analyse einer lückenlos vom Spieler gezeichneten Straßenkette. */
  analyseManualActivityRoute(
    defId: string,
    orderedTargetIds: string[],
    roadPath: readonly { x: number; y: number }[],
    vehicle?: DriveVehicle,
  ): RouteAnalysis | undefined {
    const source = this.activityRouteSource(defId);
    const analysis = source
      ? analyseManualActivityRouteFrom(this.state, this.config, this.derived, source, orderedTargetIds, roadPath)
      : undefined;
    if (!analysis || !vehicle) return analysis;
    const vehicleDef = this.config.activities.vehicles.find((candidate) => candidate.id === vehicle);
    if (!vehicleDef) return analysis;
    const speedFactor = 60 / vehicleDef.speedKph;
    const handlingFactor = 1 + Math.max(0, 4 - vehicleDef.handling) * 0.04;
    return {
      ...analysis,
      estimatedDurationMs: Math.round(analysis.estimatedDurationMs * speedFactor * handlingFactor),
    };
  }

  private validActivityVehicle(def: ActivityDef, vehicle: DriveVehicle): boolean {
    const allowed = def.vehicleOptions ?? (def.vehicle ? [def.vehicle] : []);
    const vehicleDef = this.config.activities.vehicles.find((candidate) => candidate.id === vehicle);
    return (
      allowed.includes(vehicle) &&
      vehicleDef !== undefined &&
      !vehicleDef.future &&
      vehicleDef.unlockLevel <= this.state.level.current
    );
  }

  /** Reorder the stops of an already running drive mission through a command. */
  setActiveActivityRoute(plannedTargetIds: string[], plan?: ActivityStartPlan): CommandResult {
    const active = this.state.activities.active;
    if (!active) return fail('invalid');
    const def = this.config.activities.activities.find((activity) => activity.id === active.defId);
    if (!def?.drive) return fail('invalid');
    const current = new Map(active.targets.map((target) => [target.buildingId, target]));
    if (
      plannedTargetIds.length !== active.targets.length ||
      new Set(plannedTargetIds).size !== plannedTargetIds.length ||
      plannedTargetIds.some((id) => !current.has(id))
    ) {
      return fail('invalid');
    }
    const selectedVehicle = plan?.vehicle ?? active.vehicle ?? def.vehicle;
    if (selectedVehicle && !this.validActivityVehicle(def, selectedVehicle)) return fail('locked');
    if (plan?.roadPath && !this.analyseManualActivityRoute(def.id, plannedTargetIds, plan.roadPath)) return fail('invalid');
    active.targets = plannedTargetIds.map((id) => current.get(id)!);
    if (selectedVehicle) active.vehicle = selectedVehicle;
    if (plan?.roadPath) active.plannedRoadPath = plan.roadPath.map((point) => ({ ...point }));
    this.notify({ type: 'change' });
    return ok;
  }

  /**
   * Start a delivery/inspection run. The optional planned order is validated
   * against the same live candidates and lets the route-planning UI feed its
   * optimised stop order back through the normal command boundary.
   */
  startActivity(defId: string, plannedTargetIds?: string[], plan?: ActivityStartPlan): CommandResult {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def || def.type === 'decision') return fail('not_found');
    if (def.unlockLevel > this.state.level.current) return fail('locked');
    if (this.state.activities.active) return fail('invalid');
    const now = this.state.meta.lastSimTime;
    // No fixed cooldown gate for deliveries/inspections (§2) — only defs that
    // still carry a cooldownSec (none by default) are time-gated here.
    if (def.cooldownSec && now < this.activityReadyAt(defId)) return fail('cooldown');
    if (def.requiresAnyBuilding && !this.hasAnyBuilding(def.requiresAnyBuilding)) return fail('locked');
    const selectedVehicle = plan?.vehicle ?? def.vehicle;
    if (def.drive && selectedVehicle && !this.validActivityVehicle(def, selectedVehicle)) return fail('locked');
    const candidates = this.activityCandidates(def);
    if (candidates.length < 2) return fail('invalid'); // not enough of a city yet
    const { min, max } = def.targetCount ?? { min: 3, max: 4 };
    let selected: string[];
    if (plannedTargetIds) {
      const allowed = new Set(candidates);
      const unique = new Set(plannedTargetIds);
      if (
        plannedTargetIds.length < min ||
        plannedTargetIds.length > Math.min(max, candidates.length) ||
        unique.size !== plannedTargetIds.length ||
        plannedTargetIds.some((id) => !allowed.has(id))
      ) {
        return fail('invalid');
      }
      if (plan?.roadPath && !this.analyseManualActivityRoute(defId, plannedTargetIds, plan.roadPath)) {
        return fail('invalid');
      }
      // Keep RNG progression compatible with an ordinary start even though the
      // player-defined ordering is used for the actual targets.
      pickTargets(this.state, candidates, min, max);
      selected = [...plannedTargetIds];
    } else {
      selected = pickTargets(this.state, candidates, min, max);
    }
    if (!plannedTargetIds && plan?.roadPath && !this.analyseManualActivityRoute(defId, selected, plan.roadPath)) {
      return fail('invalid');
    }
    const targets = selected.map((buildingId) => ({ buildingId, done: false }));
    // §-Stadtarbeit-Logik 2.0 (L3): Ladungsaufträge reservieren ihre Ware upfront
    // an der Quelle — die volle `costPerTarget × Ziele` wird sofort aus dem Pool
    // entnommen und gehalten. Reicht der Vorrat nicht, startet die Mission gar
    // nicht (fair statt Abbruch auf halber Strecke, §18). Jede Auslieferung zieht
    // später aus dieser Reserve; ein Abbruch gibt den Rest zurück.
    const reserved = this.activityReservation(def, targets.length);
    if (reserved) {
      const spent = spendCost(this.state, reserved, `activity_reserve_${def.id}`);
      if (!spent.ok) return fail('insufficient');
    }
    this.state.activities.active = {
      defId,
      startedAt: now,
      targets,
      ...(reserved ? { reserved } : {}),
      ...(selectedVehicle ? { vehicle: selectedVehicle } : {}),
      ...(plan?.roadPath ? { plannedRoadPath: plan.roadPath.map((point) => ({ ...point })) } : {}),
      ...(def.timeLimitSec !== undefined ? { expiresAt: now + def.timeLimitSec * 1000 } : {}),
    };
    // Der eingefrorene Planungssnapshot ist ab jetzt durch `active.targets`
    // ersetzt und wird verworfen (§2.3-Lebenszyklus: planning → executing).
    delete this.state.activities.selection;
    this.notify({ type: 'change' });
    return ok;
  }

  /**
   * Abschlussbericht einer beendeten Mission (§3.3). Alle Kennzahlen stammen aus
   * der echten Laufzeit und der validierten Routenprojektion; ein Feld fehlt nur
   * dann, wenn es für diesen Auftragstyp keinen realen Wert gibt. Es wird
   * nichts geschätzt, gerundet-erfunden oder mit Platzhaltern gefüllt.
   */
  private buildActivityRunResult(
    def: ActivityDef,
    active: NonNullable<GameState['activities']['active']>,
    now: number,
  ): ActivityRunResult {
    const targetIds = active.targets.map((candidate) => candidate.buildingId);
    const result: ActivityRunResult = {
      elapsedMs: Math.max(0, now - active.startedAt),
      deliveryTargetsCompleted: active.targets.filter((candidate) => candidate.done).length,
      deliveryTargetsTotal: active.targets.length,
      ...(active.vehicle ? { vehicle: active.vehicle } : {}),
    };
    const path = active.plannedRoadPath;
    if (!path) return result;

    const analysis = this.analyseManualActivityRoute(def.id, targetIds, path, active.vehicle);
    if (analysis) {
      result.distanceTiles = analysis.distanceTiles;
      result.efficiencyScore = analysis.efficiencyScore;
      result.roadCoverage = analysis.roadCoverage;
    }
    const infrastructure = this.getActivityInfrastructure(def.id, targetIds, active.vehicle, {
      ...(active.vehicle ? { vehicle: active.vehicle } : {}),
      roadPath: path.map((point) => ({ ...point })),
    });
    if (infrastructure) {
      result.drivingDurationMs = infrastructure.drivingDurationMs;
      result.handlingDurationMs = infrastructure.handlingDurationMs;
      result.spoilageRisk = infrastructure.spoilageRisk;
    }
    const cargoRoute = this.getActivityCargoRoute(def.id, targetIds, path, active.vehicle);
    if (cargoRoute) {
      result.emptyTravelRatio = Math.round(cargoRoute.emptyTravelRatio * 100) / 100;
      result.resupplyStops = cargoRoute.plannedResupplies;
    }
    const cargo = this.getActivityCargoPlan(def.id, targetIds, active.vehicle);
    if (cargo && cargo.capacity > 0) {
      result.loadUtilisation =
        Math.round(Math.min(1, Math.min(cargo.capacity, cargo.totalRequired) / cargo.capacity) * 100) / 100;
    }
    const traffic = this.getActivityTrafficForecast(path, active.vehicle);
    if (traffic) result.trafficLoad = traffic.totalLoad;
    return result;
  }

  /**
   * Upfront an der Quelle zu reservierende Ladung (§ Stadtarbeit-Logik 2.0, L3):
   * `costPerTarget × Zielanzahl` je Ressource. `undefined`, wenn die Aktivität
   * nichts verbraucht (Feuerwehr/Polizei/Inspektion).
   */
  private activityReservation(def: ActivityDef, targetCount: number): Partial<Record<ResourceId, number>> | undefined {
    if (!def.costPerTarget) return undefined;
    const reserved: Partial<Record<ResourceId, number>> = {};
    for (const [res, amount] of Object.entries(def.costPerTarget)) {
      if ((amount ?? 0) > 0) reserved[res as ResourceId] = (amount ?? 0) * targetCount;
    }
    return Object.keys(reserved).length > 0 ? reserved : undefined;
  }

  /**
   * One map-target click of the running activity (deliver to / inspect this
   * building). Deliveries consume their per-stop cost; the final target
   * completes the run and pays out.
   */
  progressActivity(buildingId: string): CommandResult {
    const active = this.state.activities.active;
    if (!active) return fail('invalid');
    const def = this.config.activities.activities.find((a) => a.id === active.defId);
    if (!def) return fail('not_found');
    // Drive missions follow their planned, numbered stop order. Inspections
    // remain free-form so the established click-any-marker interaction stays.
    const target = def.drive
      ? active.targets.find((candidate) => !candidate.done)
      : active.targets.find((candidate) => candidate.buildingId === buildingId && !candidate.done);
    if (target?.buildingId !== buildingId) return fail('invalid');
    if (def.costPerTarget) {
      if (active.reserved) {
        // §-Stadtarbeit-Logik 2.0 (L3): Ware wurde upfront an der Quelle
        // reserviert — die Auslieferung zieht aus dieser Reserve, nicht aus dem
        // Pool. Die Reserve deckt jede Auslieferung exakt (bei Start gesichert).
        for (const [res, amount] of Object.entries(def.costPerTarget)) {
          const id = res as ResourceId;
          active.reserved[id] = Math.max(0, (active.reserved[id] ?? 0) - (amount ?? 0));
        }
      } else {
        // Alt-Save/Legacy-Pfad ohne Reservierung: wie bisher direkt aus dem Pool.
        const spent = spendCost(this.state, def.costPerTarget, `activity_${def.id}`);
        if (!spent.ok) return fail('insufficient');
      }
    }
    target.done = true;
    if (active.targets.every((t) => t.done)) {
      // Quality grade (§6): deliveries are scored Bronze/Silber/Gold on speed
      // against their time limit, inspections settle at silver. Missing the
      // limit never fails the run — it just drops the grade to bronze.
      const now = this.state.meta.lastSimTime;
      const tier = rewardTierFor(def, this.state.level.current);
      const quality = resolveQuality(def, active.startedAt, now);
      const scale = QUALITY_SCALE[quality];
      const result = this.buildActivityRunResult(def, active, now);
      delete this.state.activities.active;
      this.payoutActivity(
        def,
        Math.round(tier.money * scale.money),
        Math.round(tier.xp * scale.xp),
        tier,
        true,
        quality,
        result,
      );
    } else {
      this.notify({ type: 'change' });
    }
    return ok;
  }

  /**
   * Cancel the running activity. No payout, no cooldown — just tidy up. Noch nicht
   * ausgelieferte, an der Quelle reservierte Ladung (§ Stadtarbeit-Logik 2.0, L3)
   * wandert in den Pool zurück (§5: Abbruch gibt Reservierungen frei), gedeckelt
   * durch die Lagerkapazität wie jede andere Gutschrift.
   */
  abandonActivity(): CommandResult {
    const active = this.state.activities.active;
    if (!active) return fail('invalid');
    if (active.reserved) {
      grantResources(this.state, active.reserved, this.derived.storageCaps, `activity_refund_${active.defId}`);
    }
    delete this.state.activities.active;
    this.notify({ type: 'change' });
    return ok;
  }

  /** Resolve a mayor decision (§ Entscheidungen): pay the cost, take the effect. */
  chooseDecision(defId: string, optionId: string): CommandResult {
    const def = this.config.activities.activities.find((a) => a.id === defId);
    if (!def || def.type !== 'decision') return fail('not_found');
    if (def.unlockLevel > this.state.level.current) return fail('locked');
    const now = this.state.meta.lastSimTime;
    if (now < this.activityReadyAt(defId)) return fail('cooldown');
    const option = def.options?.find((o) => o.id === optionId);
    if (!option) return fail('invalid');
    if (option.requiresAnyBuilding && !this.hasAnyBuilding(option.requiresAnyBuilding)) return fail('locked');
    if (option.cost) {
      const spent = spendCost(this.state, option.cost, `activity_${def.id}_${option.id}`);
      if (!spent.ok) return fail('insufficient');
    }
    // A decision can carry several simultaneous effects (§12): a single legacy
    // `buff` and/or a `buffs[]` list of trade-off effects. Apply them all.
    if (option.buff) this.pushBuff(option.buff);
    if (option.buffs) for (const buff of option.buffs) this.pushBuff(buff);
    const tier = rewardTierFor(def, this.state.level.current);
    const money = (option.reward?.money ?? 0) + tier.money;
    const xp = (option.reward?.xp ?? 0) + tier.xp;
    this.payoutActivity(def, money, xp, tier);
    return ok;
  }

  /**
   * The rotating trade contracts (§ Handelsaufträge), with fulfillment and
   * affordability flags for the UI. Empty without an active trading post.
   */
  getTradeContracts(): (TradeContractOffer & { fulfilled: boolean; affordable: boolean })[] {
    if (!this.hasTradePost()) return [];
    const offers = currentTradeContracts(this.state, this.config.activities, this.state.meta.lastSimTime);
    return offers.map((offer) => ({
      ...offer,
      fulfilled: this.state.activities.fulfilledContracts.includes(offer.id),
      affordable: canAfford(this.state, offer.template.demands),
    }));
  }

  /** Deliver a contract's demanded goods and collect the payout. Once per rotation. */
  fulfillTradeContract(offerId: string): CommandResult {
    if (!this.hasTradePost()) return fail('locked');
    const offers = currentTradeContracts(this.state, this.config.activities, this.state.meta.lastSimTime);
    const offer = offers.find((o) => o.id === offerId);
    if (!offer) return fail('not_found'); // unknown or from an expired rotation
    if (this.state.activities.fulfilledContracts.includes(offerId)) return fail('invalid');
    const spent = spendCost(this.state, offer.template.demands, `trade_contract_${offer.template.id}`);
    if (!spent.ok) return fail('insufficient');
    // Keep only this rotation's ids so the list can't grow unbounded.
    const currentIds = new Set(offers.map((o) => o.id));
    this.state.activities.fulfilledContracts = this.state.activities.fulfilledContracts.filter((id) => currentIds.has(id));
    this.state.activities.fulfilledContracts.push(offerId);
    this.state.stats.tradeEarnings += offer.template.rewardMoney;
    if (offer.template.rewardGold) grantGold(this.state, offer.template.rewardGold, `trade_contract_${offer.template.id}`);
    this.payoutActivity(
      { id: offer.template.id, cooldownSec: 0 } as ActivityDef,
      offer.template.rewardMoney,
      offer.template.rewardXp,
      undefined,
      /* setCooldown */ false,
    );
    return ok;
  }

  /** True if the city has at least one active building of any of these defIds. */
  private hasAnyBuilding(defIds: string[]): boolean {
    const wanted = new Set(defIds);
    return Object.values(this.state.buildings).some((b) => b.status === 'active' && wanted.has(b.defId));
  }

  /** Candidate buildings for a delivery (homes) or inspection (flagged, then any). */
  private activityCandidates(def: ActivityDef): string[] {
    // Explicit target selectors (§ A6 Fahr-Minispiele): a drive mission may aim
    // at specific def ids (log haul → Lager) or categories (fire → Wohn-/Gewerbe).
    const wantDefIds = def.targetDefIds ? new Set(def.targetDefIds) : undefined;
    const wantCats = def.targetCategories ? new Set(def.targetCategories) : undefined;
    const homes: string[] = [];
    const flagged: string[] = [];
    const others: string[] = [];
    const selected: string[] = [];
    for (const b of Object.values(this.state.buildings)) {
      if (b.status !== 'active') continue;
      const d = this.config.buildings.get(b.defId);
      if (!d || d.category === 'roads' || d.category === 'decoration') continue;
      if (d.category === 'residential') homes.push(b.id);
      if (wantDefIds?.has(b.defId) || wantCats?.has(d.category)) selected.push(b.id);
      if (def.type === 'inspection') {
        if (this.getBuildingMarker(b.id) === 'problem') flagged.push(b.id);
        else others.push(b.id);
      }
    }
    if (wantDefIds || wantCats) return selected;
    if (def.type === 'delivery') return homes;
    // Inspection prefers real problems and pads with spot checks.
    return flagged.length >= (def.targetCount?.min ?? 3) ? flagged : [...flagged, ...others];
  }

  /** Shared payout path: money/xp/extras, stats, cooldown, notifications. */
  private payoutActivity(
    def: Pick<ActivityDef, 'id' | 'cooldownSec'>,
    money: number,
    xp: number,
    tier?: ActivityRewardTier,
    setCooldown = true,
    quality?: ActivityQuality,
    result?: ActivityRunResult,
  ): void {
    const now = this.state.meta.lastSimTime;
    if (money > 0) grantResources(this.state, { money }, this.derived.storageCaps, `activity_${def.id}`);
    if (tier?.resources) grantResources(this.state, tier.resources, this.derived.storageCaps, `activity_${def.id}`);
    if (tier?.gold) grantGold(this.state, tier.gold, `activity_${def.id}`);
    if (tier?.buff) this.pushBuff(tier.buff);
    const levelUps = xp > 0 ? addXp(this.state, this.config, this.derived, xp) : 0;
    this.state.stats.activitiesCompleted += 1;
    if (setCooldown && (def.cooldownSec ?? 0) > 0) this.state.activities.cooldowns[def.id] = now + (def.cooldownSec ?? 0) * 1000;
    updateQuests(this.state, this.config);
    if (levelUps > 0) this.notify({ type: 'levelUp', level: this.state.level.current });
    this.notify({
      type: 'activityCompleted',
      defId: def.id,
      money,
      xp,
      ...(quality ? { quality } : {}),
      ...(result ? { result } : {}),
    });
    this.notify({ type: 'change' });
  }

  private pushBuff(buff: { kind: 'happiness' | 'tax' | 'production' | 'foodDistribution'; amount: number; durationSec: number }): void {
    this.state.buffs.push({
      id: newId(this.state, 'buff'),
      kind: buff.kind,
      amount: buff.amount,
      endsAt: this.state.meta.lastSimTime + buff.durationSec * 1000,
    });
  }

  // ---- Prototype cheats (§10, gated behind the debugTools flag) ------------

  /** Grant money for balancing tests. Debug only. */
  debugGrantMoney(amount: number): CommandResult {
    if (!this.config.features.debugTools) return fail('feature_disabled');
    grantResources(this.state, { money: amount }, this.derived.storageCaps, 'debug_money_grant');
    this.notify({ type: 'change' });
    return ok;
  }

  /** Fill every storable resource to its cap. Debug only. */
  debugFillResources(): CommandResult {
    if (!this.config.features.debugTools) return fail('feature_disabled');
    for (const res of ['wood', 'stone', 'food', 'freshwater'] as const) {
      const cap = this.derived.storageCaps[res] ?? 0;
      if (cap > 0 && cap !== Number.POSITIVE_INFINITY) this.state.resources[res] = cap;
    }
    this.notify({ type: 'change' });
    return ok;
  }

  /**
   * Instantly complete in-progress construction. `kind` picks fresh builds,
   * upgrades, or both (§10) — an upgrade is identified by its `targetUpgradeLevel`.
   * Reuses the normal completion path (tick), so effects/XP apply exactly as if
   * the timer had elapsed. Debug only.
   */
  debugFinishConstruction(kind: 'all' | 'build' | 'upgrade' = 'all'): CommandResult {
    if (!this.config.features.debugTools) return fail('feature_disabled');
    const now = this.state.meta.lastSimTime;
    let touched = false;
    for (const b of Object.values(this.state.buildings)) {
      if (b.status !== 'constructing' || b.constructionEndsAt === undefined) continue;
      const isUpgrade = b.targetUpgradeLevel !== undefined;
      if (kind === 'build' && isUpgrade) continue;
      if (kind === 'upgrade' && !isUpgrade) continue;
      b.constructionEndsAt = now;
      touched = true;
    }
    if (touched) this.update(now + 1);
    return ok;
  }

  /**
   * Schaltet alle regulär erschließbaren Regionen als echten Gameplay-Cheat
   * frei. Nicht erschließbare Teaserinseln bleiben bewusst gesperrt. Anders als
   * der visuelle Nebel-Schalter mutiert dieser Command den persistierten State.
   */
  debugUnlockAllRegions(): CommandResult {
    if (!this.config.features.debugTools) return fail('feature_disabled');
    let unlocked = 0;
    for (const def of this.config.regions.values()) {
      if (!def.unlockable) continue;
      const region = this.state.world.regions[String(def.id)];
      if (!region || region.status === 'unlocked') continue;
      region.status = 'unlocked';
      unlocked++;
    }
    if (unlocked > 0) {
      this.state.stats.regionsUnlocked += unlocked;
      this.afterStructuralChange();
    }
    return ok;
  }

  // ---- Read helpers for the UI (no mutation) ------------------------------

  canAffordCost(cost: Partial<Record<ResourceId, number>>): boolean {
    return canAfford(this.state, cost);
  }

  /**
   * The money+material cost the next copy of a building would actually charge
   * right now, accounting for escalating `costScaling` (§7). The build menu uses
   * this so the shown price matches the charged price.
   */
  /**
   * Platzierungs-/Verschiebe-Diagnose (§ C4). Reine Read-Projektion für die
   * UI-Ghost-Vorschau: Gültigkeit + Grund, Terrain, Region, Straßenanschluss,
   * Standortbonus und Baukosten an (x,y). Bündelt vorhandene Prüfungen, dupliziert
   * keine Regeln. `ignoreBuildingId` blendet ein zu verschiebendes Gebäude aus.
   */
  placementDiagnostics(
    defId: string,
    x: number,
    y: number,
    ignoreBuildingId?: string,
    rotation: BuildingRotation = 0,
  ): PlacementDiagnostics | undefined {
    const def = this.config.buildings.get(defId);
    if (!def) return undefined;
    const baseReason = validatePlacement(
      this.state,
      this.config,
      this.derived,
      def,
      x,
      y,
      def.waterfront
        ? { rotation, ...(ignoreBuildingId ? { ignoreBuildingId } : {}) }
        : (ignoreBuildingId ? { ignoreBuildingId } : undefined),
    );
    const waterfront = waterfrontPlacementPreview(
      this.state,
      this.config,
      this.derived,
      def,
      x,
      y,
      rotation,
      ignoreBuildingId,
    );
    const reason = waterfront ? waterfront.reason : baseReason;
    return {
      valid: waterfront ? waterfront.valid : reason === undefined,
      ...(reason ? { reason } : {}),
      terrain: worldTerrainAt(this.state, x, y),
      regionId: regionIdAt(x, y),
      surface: samplePlacementSurface(this.state, x, y, def.size.w, def.size.h),
      roadAccess: isConnectedToRoad(this.derived, def, x, y),
      ...(waterfront ? { waterfront } : {}),
      locationBonusPct: Math.round(locationBonusPct(this.state, def, x, y)),
      buildCost: this.getBuildCost(defId, x, y),
    };
  }

  /**
   * Straßenplan-Vorschau (§ C6/§18, § Infrastruktur 2.0 / I2). Der Eingabepfad
   * ist eine Kette von KONTROLLPUNKTEN (Start, Zwischenpunkte, Ziel); der
   * terrainbewusste Router verbindet sie lückenlos über wirklich bebaubares
   * Gelände (Bodenstraße meidet Wasser/Klippen, Höhenstraße überbrückt sie),
   * bevor `analyseRoadPath` pro Kachel Status/Grund/Kosten + Gesamtsumme liefert.
   * Bereits orthogonal benachbarte Punkte routen auf sich selbst — die Vorschau
   * bleibt für dichte Pfade also unverändert. Reine Read-Projektion: keine
   * Mutation, keine Abbuchung — gebaut wird erst über `buildRoadPath`.
   */
  roadPathPreview(path: { x: number; y: number }[], defId: string = 'road'): RoadPlanPreview {
    const def = this.config.buildings.get(defId);
    const routed =
      def?.category === 'roads'
        ? routeRoadWaypoints(this.state, this.config, this.derived, def, path)
        : path;
    return analyseRoadPath(this.state, this.config, this.derived, routed, (x, y) => this.getBuildCost(defId, x, y), defId);
  }

  /**
   * Atomarer Straßenbau (§ Infrastruktur 2.0 / I2). Nimmt dieselben
   * Kontrollpunkte wie `roadPathPreview`, routet sie und baut den ganzen Pfad
   * ALLES-ODER-NICHTS: Ist ein Segment blockiert oder der Gesamtpreis nicht
   * bezahlbar, wird NICHTS gebaut (kein halbfertiger Stummel). Nach der
   * Vollvalidierung muss jede Einzelplatzierung gelingen — Straßen skalieren
   * nicht im Preis, daher entspricht die Vorschausumme exakt der Abbuchung.
   */
  buildRoadPath(
    waypoints: { x: number; y: number }[],
    defId: string = 'road',
  ): { ok: true; built: number } | { ok: false; error: CommandError } {
    const def = this.config.buildings.get(defId);
    if (!def || def.category !== 'roads') return { ok: false, error: 'not_found' };
    const preview = this.roadPathPreview(waypoints, defId);
    if (preview.tiles.length === 0) return { ok: false, error: 'invalid' };
    if (!preview.valid) {
      const firstBlocked = preview.tiles.find((tile) => tile.status === 'blocked');
      return { ok: false, error: firstBlocked?.reason ?? 'terrain' };
    }
    if (!this.canAffordCost(preview.totalCost)) return { ok: false, error: 'insufficient' };
    let built = 0;
    for (const tile of preview.tiles) {
      if (tile.status === 'exists') continue;
      const result = this.placeBuilding(defId, tile.x, tile.y);
      if (!result.ok) return { ok: false, error: result.error }; // nach Vorvalidierung nicht erwartet
      built += 1;
    }
    return { ok: true, built };
  }

  getBuildCost(defId: string, x?: number, y?: number): Partial<Record<ResourceId, number>> {
    const def = this.config.buildings.get(defId);
    if (!def) return {};
    let cost = effectiveBuildCost(def, countOf(this.state, defId), this.state.stats.built[defId] ?? 0);
    // Regions-Straßenkosten-Faktor (§ Welt 2.0): nur für Straßen und nur, wenn
    // eine Zielkachel bekannt ist (Menü ohne Ort zeigt den Basispreis). Der Ghost
    // reicht die Hover-Kachel durch, damit der gezeigte Preis dem gezahlten gleicht.
    if (def.category === 'roads' && x !== undefined && y !== undefined) {
      const factor = regionRoadCostFactorAt(this.config, x, y);
      if (factor !== 1 && cost.money !== undefined) {
        cost = { ...cost, money: Math.round(cost.money * factor) };
      }
      // Pfeiler-/Deck-Aufschlag (§ Infrastruktur 2.0 / I1): eine Höhenstraßen-
      // Bauklasse zahlt über tatsächlich überbrückten Wasser-/Klippenkacheln
      // zusätzlich `road.bridgeCostPerTile`. So bleibt gezeigter = gezahlter Preis.
      const premium = def.road?.bridgeCostPerTile;
      if (premium) {
        const terrain = worldTerrainAt(this.state, x, y);
        const spanned =
          (def.road?.crossesWater === true && (terrain === 'water' || terrain === 'river')) ||
          (def.road?.crossesCliff === true && terrain === 'mountain');
        if (spanned) {
          cost = { ...cost };
          for (const [res, amount] of Object.entries(premium)) {
            cost[res as ResourceId] = (cost[res as ResourceId] ?? 0) + (amount ?? 0);
          }
        }
      }
    }
    return cost;
  }

  /**
   * Whether a building was just unlocked at the current level and hasn't been
   * built yet — drives the "Neu" badge (§7). No persisted "seen" flag needed: the
   * badge naturally clears when the player builds one or the city levels up.
   */
  isNewBuilding(defId: string): boolean {
    const def = this.config.buildings.get(defId);
    if (!def) return false;
    return def.unlockLevel === this.state.level.current && (this.state.stats.built[defId] ?? 0) === 0;
  }

  /** Building def-ids unlocked at a given level (for the level-up announcement). */
  unlocksAtLevel(level: number): string[] {
    return this.config.levels.find((l) => l.level === level)?.unlocks ?? [];
  }

  /** Whether the next copy is the free/discounted first build (build-menu badge). */
  isFirstBuildDiscount(defId: string): boolean {
    const def = this.config.buildings.get(defId);
    if (!def) return false;
    return isFirstBuildDiscounted(def, this.state.stats.built[defId] ?? 0);
  }

  /**
   * Why the population is (not) growing — the single source the UI uses to
   * explain move-in (§ "why isn't my city filling up"). `growing` when happy
   * citizens are actively arriving; otherwise `reason` says what blocks them.
   */
  getGrowthStatus(): {
    growing: boolean;
    reason?: 'no_housing' | 'housing_full' | 'unhappy';
    population: number;
    capacity: number;
    freeHousing: number;
    ratePerMin: number;
  } {
    const bal = this.config.balancing;
    const pop = this.state.citizens.population;
    const capacity = this.derived.capacity.housing;
    const freeHousing = Math.max(0, capacity - pop);
    const happiness = this.state.citizens.happiness;
    const base = { population: pop, capacity, freeHousing, ratePerMin: 0 };
    if (capacity <= 0) return { growing: false, reason: 'no_housing', ...base };
    if (freeHousing <= 0) return { growing: false, reason: 'housing_full', ...base };
    if (happiness < bal.growthHappinessThreshold) return { growing: false, reason: 'unhappy', ...base };
    return { growing: true, ...base, ratePerMin: Math.round(moveInPerMin(bal, freeHousing, happiness)) };
  }

  /**
   * Whether a building reads as a "Großprojekt" (major project) — a big money
   * investment that the UI frames specially and, when unaffordable, explains
   * with an income hint rather than a bare shortfall (§ realistic prices).
   */
  isMajorProject(defId: string): boolean {
    const cost = this.getBuildCost(defId);
    return (cost.money ?? 0) >= this.config.balancing.majorProjectMoneyThreshold;
  }

  /** Recommended steady net income for a major project (cost ÷ payback window). */
  recommendedIncomeFor(defId: string): number {
    const money = this.getBuildCost(defId).money ?? 0;
    return Math.round(money / this.config.balancing.majorProjectPaybackMinutes);
  }

  /**
   * Build-limit status for a building type (undefined = no limit). `count` is
   * how many exist, `max` the current cap, `nextLevel` the level that raises it.
   */
  getBuildLimit(defId: string): { count: number; max: number; nextLevel: number | undefined } | undefined {
    const def = this.config.buildings.get(defId);
    if (!def) return undefined;
    const max = buildLimitAt(def, this.state.level.current);
    if (max === undefined) return undefined;
    return { count: countOf(this.state, defId), max, nextLevel: nextLimitLevel(def, this.state.level.current) };
  }

  getRegionCost(id: RegionId): number {
    return regionUnlockCost(this.config, id);
  }

  /**
   * Whether a locked region can be turned into the river district (§8), plus the
   * project cost — drives the "found district" option in the region dialog.
   */
  canFoundDistrict(id: RegionId): { eligible: boolean; cost: Partial<Record<ResourceId, number>> } {
    const bal = this.config.balancing;
    const region = this.state.world.regions[String(id)];
    const def = this.config.buildings.get('district_center');
    const hasRiverDistrict = Object.values(this.state.world.districts).some((d) => d.id === 'river');
    const eligible =
      this.state.level.current >= bal.districtUnlockLevel &&
      !!region && region.status === 'locked' && !!def &&
      this.config.regions.get(id)?.unlockable !== false &&
      regionHasTerrain(id, 'river') && !hasRiverDistrict &&
      findDistrictCenterSpot(this.state, id, def.size.w) !== undefined;
    return { eligible, cost: bal.districtFoundCost };
  }

  /** Current per-minute income split by source, for the finance UI (§5). */
  getIncome(): IncomeBreakdown {
    return computeIncome(this.state, this.config, this.derived);
  }

  /**
   * Income without temporary boosts (§20): the reliable per-minute figure a
   * project's payback should be judged against, so a fleeting festival buff
   * doesn't make an unaffordable project look reachable. `hasIncomeBuffs` tells
   * the UI whether the two figures currently differ (show the "with boosts" line).
   */
  getStableIncome(): IncomeBreakdown {
    return computeIncome(this.state, this.config, this.derived, false);
  }

  hasIncomeBuffs(): boolean {
    return this.state.buffs.some((b) => b.kind === 'tax');
  }

  /**
   * Generic coverage overlay for a selected supply building (§1) — undefined if
   * the building projects no radius coverage.
   */
  getCoverageOverlay(buildingId: string): CoverageOverlay | undefined {
    return coverageOverlay(this.state, this.config, this.derived, buildingId);
  }

  /** Multimodaler Anschlusszustand eines einzelnen Gebäudes. */
  getBuildingInfrastructureStatus(buildingId: string): BuildingInfrastructureStatus | undefined {
    const building = this.state.buildings[buildingId];
    if (!building) return undefined;
    return buildingInfrastructureStatus(this.state, this.config, this.derived.roadNetwork, building);
  }

  getInfrastructureNetworkOverview(): InfrastructureNetworkOverview {
    return infrastructureNetworkOverview(this.state, this.config, this.derived.roadNetwork);
  }

  getWaterNavigationGraph(): WaterNavigationGraph {
    return getWaterNavigationGraph();
  }

  /**
   * Anleger als Netzknoten (§I3): Landseite (Teilnetz + Stadtanschluss), Wasserseite
   * und die über Wasser erreichbaren Anleger. Kapazität/Reisezeit/Warenfluss folgen
   * erst mit den persistenten Schiffsrouten (I4) — hier wird nichts vorgetäuscht.
   */
  getHarborNodeStatus(harborId: string): HarborNodeStatus | undefined {
    return getHarborNodeStatus(
      this.state,
      this.config,
      this.derived.roadNetwork,
      this.derived.roadSegments,
      harborId,
    );
  }

  getHarborNetworkOverview(): HarborNetworkOverview {
    return getHarborNetworkOverview(this.state, this.config, this.derived.roadNetwork, this.derived.roadSegments);
  }

  /** Straßen-Teilnetze: trennt das Stadtnetz von lokalen Netzen hinter Wasser (§I3). */
  getRoadSegments(): RoadSegment[] {
    return this.derived.roadSegments.segments;
  }

  // ---- Schiffsrouten (§ Infrastruktur 2.0 / I4, Save v22) -------------------

  /**
   * Legt eine persistente Schiffsroute an: Betrieb → Verladehafen → Schiff →
   * Zielhafen → Lagergebäude. Schließt die Lücke, an der der Landtransport über
   * Wasser mit `no_route` scheitert.
   */
  createShippingRoute(input: CreateShippingRouteInput): { ok: true; routeId: string } | { ok: false; error: ShippingRouteError } {
    const result = createShippingRoute(this.state, this.config, this.derived, input, this.state.meta.lastSimTime);
    if (typeof result === 'string') return { ok: false, error: result };
    this.notify({ type: 'change' });
    return { ok: true, routeId: result.id };
  }

  setShippingRoutePaused(routeId: string, paused: boolean): boolean {
    const changed = setShippingRoutePaused(this.state, routeId, paused);
    if (changed) this.notify({ type: 'change' });
    return changed;
  }

  deleteShippingRoute(routeId: string): boolean {
    const deleted = deleteShippingRoute(this.state, routeId);
    if (deleted) this.notify({ type: 'change' });
    return deleted;
  }

  getShippingRoutes(): ShippingRouteView[] {
    return getShippingRoutes(this.state);
  }

  getShippingNetworkOverview(): ShippingNetworkOverview {
    return getShippingNetworkOverview(this.state);
  }

  /** Vorschau von Wasserweg + Fahrzeit, bevor eine Route angelegt wird. */
  getShippingRouteLegs(
    originHarborId: string,
    destinationHarborId: string,
    vehicleId?: DriveVehicle,
  ): { travelMs: number; waterDistance: number } | undefined {
    return shippingRouteLegs(this.state, this.config, this.derived, originHarborId, destinationHarborId, vehicleId);
  }

  getAvailableHarborConnections(harborId: string): AvailableHarborConnection[] {
    return getAvailableHarborConnections(this.state, this.config, this.derived.roadNetwork, harborId);
  }

  getShippingRoutePreview(originHarborId: string, destinationHarborId: string): ShippingRoutePreview | undefined {
    return getShippingRoutePreview(
      this.state,
      this.config,
      this.derived.roadNetwork,
      originHarborId,
      destinationHarborId,
    );
  }

  getWaterfrontPlacementPreview(
    defId: string,
    position: { x: number; y: number },
    rotation: BuildingRotation = 0,
  ): WaterfrontPlacementPreview | undefined {
    const def = this.config.buildings.get(defId);
    if (!def) return undefined;
    return waterfrontPlacementPreview(
      this.state,
      this.config,
      this.derived,
      def,
      position.x,
      position.y,
      rotation,
    );
  }

  /** Problems & benefits for a building (§2/§4/§12) — sheet + map markers. */
  getBuildingDiagnostics(buildingId: string): Diagnosis[] {
    const b = this.state.buildings[buildingId];
    if (!b) return [];
    return buildingDiagnostics(this.state, this.config, this.derived, b);
  }

  /** The single marker (if any) to float above a building on the map (§4). */
  getBuildingMarker(
    buildingId: string,
  ): 'problem' | 'road_problem' | 'water_problem' | 'partial_problem' | 'upgrade' | undefined {
    return primaryMarker(this.getBuildingDiagnostics(buildingId));
  }

  // ---- Aktive Betriebe (§ Active Operations 2.0) --------------------------
  // Commands starten/steuern Arbeitsaufträge; Read-Helper liefern Lager,
  // Arbeiter, Knoten und Vorschau. Keine direkte Mutation aus UI/Renderer (§1).

  /**
   * Startet einen Arbeitsauftrag über das (effiziente) Arbeitsgebiet: alle
   * verfügbaren Ressourcenknoten in Reichweite werden vorgemerkt (§26.3
   * Arbeitsgebiet). `radius`/`maxCount` verfeinern die Auswahl.
   */
  /**
   * Startet einen Gebiets-Auftrag. Seit § R2 ist das ein **Dauerbetrieb**: Das
   * Arbeitsgebiet wird persistiert, und statt den Auftrag beim Abernten zu löschen,
   * wartet er auf Nachwuchs und nimmt die Arbeit selbst wieder auf. Mit
   * `continuous = false` bleibt es beim einmaligen Auftrag.
   */
  startBuildingOperation(buildingId: string, radius?: number, maxCount?: number, continuous = true): CommandResult {
    const b = this.state.buildings[buildingId];
    const def = b && this.config.buildings.get(b.defId);
    if (!b || !def?.operation || b.status !== 'active') return fail('invalid');
    const now = this.state.meta.lastSimTime;
    // Radien kommen aus der Ausbaustufe (§A7: Großfarm/Tiefbruch greifen weiter).
    const radii = operationRadii(def.operation, b.upgradeLevel);
    const r = Math.min(radii.maxRadius, Math.max(1, radius ?? radii.efficientRadius));
    const nodeIds = selectAreaNodeIds(this.state, def, b, r, maxCount ?? 60, now);
    if (nodeIds.length === 0) return fail('invalid');
    ensureInventory(this.state, b.id, operationStage(def.operation, b.upgradeLevel).storageCapacity);
    startOperation(this.state, b.id, nodeIds, now, continuous ? { workArea: { kind: 'circle', radius: r } } : {});
    this.notify({ type: 'change' });
    return ok;
  }

  /** Zustand eines Dauerbetriebs (§R2): wartet er, arbeitet er, wann wächst nach? */
  getContinuousOperationStatus(buildingId: string): ContinuousOperationStatus | undefined {
    return getContinuousOperationStatus(this.state, this.config, buildingId, this.state.meta.lastSimTime);
  }

  /**
   * Durchsatz-Diagnose eines Betriebs (§R2/§5) — ersetzt die frühere, für Betriebe
   * schlicht falsche passive „+X/min"-Anzeige.
   */
  getOperationThroughput(buildingId: string): OperationThroughput | undefined {
    return getOperationThroughput(
      this.state,
      this.config,
      buildingId,
      this.state.meta.lastSimTime,
      this.derived.logisticsBoost,
    );
  }

  // ---- Automatischer Warenfluss (§ Active Simplicity / AS-1, D-039) ---------

  /** Liefert dieser Betrieb selbstständig ab? (Normalfall: ja.) */
  getAutoTransport(buildingId: string): { enabled: boolean } {
    return getAutoTransportState(this.state, buildingId);
  }

  /** Automatik je Betrieb abschalten/einschalten — die einzige nötige Bedienung. */
  setAutoTransport(buildingId: string, enabled: boolean): CommandResult {
    if (!this.state.buildings[buildingId]) return fail('invalid');
    setAutoTransport(this.state, buildingId, enabled);
    this.notify({ type: 'change' });
    return ok;
  }

  /**
   * Warnungen statt Aufgaben (§AS-2): sagt, **warum** gerade nichts fließt — mit
   * genau der Information, die für einen Ein-Klick-Fix nötig ist.
   */
  getLogisticsWarnings(): LogisticsWarning[] {
    return getLogisticsWarnings(this.state, this.config, this.derived);
  }

  /** Startet einen Auftrag über eine explizite Knotenauswahl (§26.3 Einzelbäume). */
  startBuildingOperationWithNodes(buildingId: string, nodeIds: string[]): CommandResult {
    const b = this.state.buildings[buildingId];
    const def = b && this.config.buildings.get(b.defId);
    if (!b || !def?.operation || b.status !== 'active') return fail('invalid');
    const now = this.state.meta.lastSimTime;
    const valid = this.getBuildingOperationPreview(buildingId, nodeIds)?.validTargetIds ?? [];
    if (valid.length === 0) return fail('invalid');
    ensureInventory(this.state, b.id, operationStage(def.operation, b.upgradeLevel).storageCapacity);
    startOperation(this.state, b.id, valid, now);
    this.notify({ type: 'change' });
    return ok;
  }

  cancelBuildingOperation(buildingId: string): CommandResult {
    if (!this.state.operations?.active[buildingId]) return fail('invalid');
    cancelOperation(this.state, buildingId);
    this.notify({ type: 'change' });
    return ok;
  }

  pauseBuildingOperation(buildingId: string): CommandResult {
    if (!setOperationPaused(this.state, buildingId, true)) return fail('invalid');
    this.notify({ type: 'change' });
    return ok;
  }

  resumeBuildingOperation(buildingId: string): CommandResult {
    if (!setOperationPaused(this.state, buildingId, false)) return fail('invalid');
    this.notify({ type: 'change' });
    return ok;
  }

  /** Lokales Betriebslager als UI-Sicht (undefined, wenn kein aktiver Betrieb). */
  getBuildingInventory(buildingId: string): BuildingInventoryView | undefined {
    const b = this.state.buildings[buildingId];
    const def = b && this.config.buildings.get(b.defId);
    if (!b || !def?.operation) return undefined;
    const inv = getInventory(this.state, buildingId);
    const capacity = inv?.capacity ?? operationStage(def.operation, b.upgradeLevel).storageCapacity;
    return {
      capacity,
      used: inventoryUsed(inv),
      free: inv ? inventoryFree(inv) : capacity,
      items: inv ? { ...inv.items } : {},
      reserved: inv ? { ...inv.reserved } : {},
    };
  }

  /** Arbeiterzustände eines Betriebs (Renderer/Detailfenster). */
  getBuildingWorkers(buildingId: string): BuildingWorkerState[] {
    return this.state.operations?.workers[buildingId] ?? [];
  }

  /** Aktiver Auftrag eines Betriebs. */
  getBuildingOperation(buildingId: string): ActiveBuildingOperation | undefined {
    return this.state.operations?.active[buildingId];
  }

  /** Kombinierte Betriebssicht fürs Gebäudefenster (§18). */
  getBuildingOperationInfo(buildingId: string): BuildingOperationInfo | undefined {
    const b = this.state.buildings[buildingId];
    const def = b && this.config.buildings.get(b.defId);
    if (!b || !def?.operation) return undefined;
    const profile = def.operation;
    const stage = operationStage(profile, b.upgradeLevel);
    const now = this.state.meta.lastSimTime;
    const inv = this.getBuildingInventory(buildingId)!;
    const workers = this.getBuildingWorkers(buildingId);
    const workersBusy = workers.filter((w) => w.status !== 'idle' && w.status !== 'waiting').length;
    const op = this.getBuildingOperation(buildingId);
    const remaining = op
      ? op.targetNodeIds.filter((id) => {
          const node = resolveNode(this.state, profile.nodeType, id, now);
          return node && node.remainingAmount > 0 && node.state !== 'regrowing' && node.state !== 'depleted';
        }).length
      : 0;
    const radii = operationRadii(profile, b.upgradeLevel);
    return {
      isOperationBuilding: true,
      resource: profile.resource,
      nodeType: profile.nodeType,
      renewable: isRenewableOperation(profile),
      workerSlots: stage.workerSlots,
      workersBusy,
      efficientRadius: radii.efficientRadius,
      maxRadius: radii.maxRadius,
      inventory: inv,
      availableNodes: availableWorkNodes(this.state, def, b, radii.efficientRadius, now).length,
      storageFull: inv.free <= 0,
      ...(op ? { active: { targetCount: op.targetNodeIds.length, remainingCount: remaining, paused: op.status === 'paused' } } : {}),
    };
  }

  /** Vorschau eines Auftrags (§4.2): Ertrag, Dauer, Warnungen. */
  getBuildingOperationPreview(buildingId: string, nodeIds?: string[]): OperationPreview | undefined {
    const b = this.state.buildings[buildingId];
    const def = b && this.config.buildings.get(b.defId);
    if (!b || !def?.operation) return undefined;
    const now = this.state.meta.lastSimTime;
    const ids = nodeIds ?? selectAreaNodeIds(this.state, def, b, operationRadii(def.operation, b.upgradeLevel).efficientRadius, 60, now);
    return previewOperation(this.state, this.config, b, ids, now);
  }

  /** Arbeitsgebiet eines Betriebs (Renderer-Overlay, §18 „Arbeitsgebiet"). */
  getBuildingWorkArea(buildingId: string): { efficientRadius: number; maxRadius: number; center: { x: number; y: number }; bounds: { minX: number; minY: number; maxX: number; maxY: number } } | undefined {
    const b = this.state.buildings[buildingId];
    const def = b && this.config.buildings.get(b.defId);
    if (!b || !def?.operation) return undefined;
    const { cx, cy } = centerOf(def, b);
    return {
      efficientRadius: operationRadii(def.operation, b.upgradeLevel).efficientRadius,
      maxRadius: operationRadii(def.operation, b.upgradeLevel).maxRadius,
      center: { x: cx, y: cy },
      bounds: workAreaBounds(def, b, operationRadii(def.operation, b.upgradeLevel).maxRadius),
    };
  }

  /** Ressourcenknoten im Arbeitsgebiet (Arbeitsmodus/Renderer-Hervorhebung). */
  getResourceNodesNear(buildingId: string, radius?: number): ResourceNode[] {
    const b = this.state.buildings[buildingId];
    const def = b && this.config.buildings.get(b.defId);
    if (!b || !def?.operation) return [];
    const now = this.state.meta.lastSimTime;
    const radii = operationRadii(def.operation, b.upgradeLevel);
    return nodesInWorkArea(this.state, def, b, Math.min(radii.maxRadius, radius ?? radii.efficientRadius), now);
  }

  /** Sichtbare Arbeiter aller Betriebe (additive Renderer-Darstellung). */
  getWorkerRenderStates(): WorkerRenderState[] {
    return workerRenderStates(this.state, this.config);
  }

  // ---- Lagertransport (§ Active Operations 2.0, Phase A5) -----------------
  // Bringt lokal geerntete Ware manuell ins Zentrallager. Baut auf demselben
  // Logistikmodell wie die Stadtarbeit auf (kein zweites System, §8).

  /**
   * Startet einen Transport vom Betriebslager zu einem Zielgebäude mit
   * Lagerkapazität. Reserviert die Ladung im Quell-Lager; die Ware wird erst
   * beim Beladen entnommen und bei der Einlagerung am Ziel global verfügbar.
   */
  createInventoryTransfer(input: CreateTransferInput): CommandResult {
    const now = this.state.meta.lastSimTime;
    const result = createInventoryTransfer(this.state, this.config, this.derived, input, now);
    if (typeof result === 'string') return fail(this.transferErrorCode(result));
    // Straßen-Polyline für die 3D-Fahrt cachen (rein visuell, nicht persistiert).
    const route = transferRoute(this.state, this.config, this.derived, input.sourceBuildingId, input.targetBuildingId, input.vehicleId);
    if (route) this.transferRoutes.set(result.id, route.path);
    this.notify({ type: 'change' });
    return ok;
  }

  /** Bricht einen noch ladenden Transport ab (gibt die Reservierung frei). */
  cancelInventoryTransfer(transferId: string): CommandResult {
    if (!cancelInventoryTransfer(this.state, transferId)) return fail('invalid');
    this.transferRoutes.delete(transferId);
    this.notify({ type: 'change' });
    return ok;
  }

  private transferErrorCode(error: TransferError): CommandError {
    switch (error) {
      case 'no_vehicle':
        return 'no_vehicle';
      case 'no_cargo':
        return 'no_cargo';
      case 'no_target':
        return 'no_target';
      case 'no_route':
        return 'no_route';
      default:
        return 'invalid';
    }
  }

  /** Mögliche Transportziele (Lagergebäude) für eine Ressource. */
  getInventoryTransferTargets(sourceBuildingId: string, resource: ResourceId): TransferTarget[] {
    return transferTargets(this.state, this.config, sourceBuildingId, resource);
  }

  /** Frei verfügbare (nicht reservierte) Menge im lokalen Lager. */
  getAvailableForTransfer(buildingId: string, resource: ResourceId): number {
    return availableForTransfer(this.state, buildingId, resource);
  }

  /** Vorschau eines geplanten Transports (Distanz, Dauer, Warnungen). */
  getInventoryTransferPreview(input: CreateTransferInput): TransferPreview | undefined {
    return previewTransfer(this.state, this.config, this.derived, input);
  }

  /** Laufende Transporte eines Betriebs (Quelle). */
  getBuildingTransfers(buildingId: string): InventoryTransfer[] {
    const transfers = this.state.operations?.transfers;
    if (!transfers) return [];
    return Object.values(transfers).filter((t) => t.sourceBuildingId === buildingId);
  }

  /** Alle laufenden Transporte (HUD/Netzwerkübersicht). */
  getAllTransfers(): InventoryTransfer[] {
    return Object.values(this.state.operations?.transfers ?? {});
  }

  /** Netzwerkweite Aufschlüsselung je Ressource (§7.2). */
  getInventoryNetworkOverview(): Record<ResourceId, ResourceNetworkStat> {
    return inventoryNetworkOverview(this.state);
  }

  /** Interpolierte Fahrzeugpositionen laufender Transporte (additiver Renderer-Layer). */
  getTransferRenderStates(): TransferRenderState[] {
    const transfers = this.state.operations?.transfers;
    if (!transfers) return [];
    const out: TransferRenderState[] = [];
    for (const t of Object.values(transfers)) {
      if (t.status === 'delivered') continue;
      let path = this.transferRoutes.get(t.id);
      if (!path) {
        // Nach dem Laden (Save) fehlt der Cache — Polyline neu ableiten.
        const route = transferRoute(this.state, this.config, this.derived, t.sourceBuildingId, t.targetBuildingId, t.vehicleId);
        path = route?.path ?? [];
        this.transferRoutes.set(t.id, path);
      }
      const pos =
        t.status === 'in_transit'
          ? sampleRoutePath(path, t.progress)
          : t.status === 'returning'
            ? sampleRoutePath(path, 1 - t.progress) // leer zurück zur Quelle
            : t.status === 'loading'
              ? path[0]
              : path[path.length - 1];
      if (!pos) continue;
      out.push({ id: t.id, resource: t.resource, status: t.status, ...(t.vehicleId ? { vehicleId: t.vehicleId } : {}), x: pos.x, y: pos.y });
    }
    // Erledigte/entfernte Transporte aus dem Cache räumen.
    if (this.transferRoutes.size > out.length + 8) {
      const live = new Set(Object.keys(transfers));
      for (const id of this.transferRoutes.keys()) if (!live.has(id)) this.transferRoutes.delete(id);
    }
    return out;
  }
}
