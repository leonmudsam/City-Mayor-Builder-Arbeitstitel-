/**
 * Stabile, rein visuelle Verträge für Active Operations 2.0.
 *
 * Diese Typen enthalten weder GameState noch Commands. Produktive Adapter dürfen
 * sie aus Controller-Read-Helpern befüllen; Story-/Screenshotdaten liegen
 * getrennt unter `src/dev/`.
 */

export type VisualTone = 'neutral' | 'good' | 'info' | 'warning' | 'danger';
export type CapacityTone = 'good' | 'gold' | 'warning' | 'full';
export type WorkAreaSelectionMode = 'single' | 'circle' | 'rectangle' | 'polygon' | 'exclude';

export interface VisualWarning {
  code: string;
  label: string;
  tone: Exclude<VisualTone, 'good'>;
}

export interface WorkAreaVisualNode {
  id: string;
  x: number;
  y: number;
  label: string;
  resourceLabel: string;
  amountMin: number;
  amountMax: number;
  distanceTiles: number;
  efficiencyPct: number;
  state: 'available' | 'selected' | 'reserved' | 'excluded' | 'invalid';
  stateLabel: string;
}

export interface WorkAreaPlannerView {
  buildingId: string;
  buildingName: string;
  resourceType: string;
  resourceLabel: string;
  selectionMode: WorkAreaSelectionMode;
  center: { x: number; y: number };
  radius: number;
  efficientRange: number;
  maximumRange: number;
  nodes: WorkAreaVisualNode[];
  selectedNodeIds: string[];
  validNodeCount: number;
  reservedNodeCount: number;
  excludedNodeCount: number;
  expectedYieldMin: number;
  expectedYieldMax: number;
  estimatedDurationSeconds: number;
  averageDistanceTiles: number;
  workerSlots: number;
  localStored: number;
  localReserved: number;
  localCapacity: number;
  storageAfter: number;
  existingOperation: boolean;
  canConfirm: boolean;
  warnings: VisualWarning[];
}

export type WorkAreaVisualShape =
  | { kind: 'circle'; center: { x: number; y: number }; radius: number }
  | { kind: 'rectangle'; min: { x: number; y: number }; max: { x: number; y: number } }
  | { kind: 'polygon'; points: { x: number; y: number }[] };

/** Stabile Callback-Verträge für einen späteren dünneren Container. Die heute
 * produktiv angebundenen Komponenten lösen dieselben Aktionen über UI-Store und
 * GameController aus; kein Vertrag enthält Simulationszustand. */
export interface WorkAreaPlannerActions {
  onSelectionModeChange(mode: WorkAreaSelectionMode): void;
  onAreaChange(area: WorkAreaVisualShape): void;
  onNodeToggle(nodeId: string): void;
  onReset(): void;
  onConfirm(): void;
  onCancel(): void;
}

export interface WorkerStatusView {
  id: string;
  displayName: string;
  status: 'active' | 'travelling' | 'waiting' | 'storage_full' | 'no_target' | 'paused' | 'blocked';
  statusLabel: string;
  progressPct: number;
  detail?: string;
}

export interface BuildingOperationView {
  buildingId: string;
  buildingName: string;
  categoryLabel: string;
  stage: number;
  stageCount: number;
  status: 'active' | 'paused' | 'storage_full' | 'waiting' | 'blocked';
  statusLabel: string;
  resource: string;
  resourceLabel: string;
  workers: WorkerStatusView[];
  workerSlots: number;
  targetCount: number;
  remainingTargetCount: number;
  localStored: number;
  localReserved: number;
  localCapacity: number;
  availableForTransport: number;
  throughputPerMinute?: number;
  throughputWindowMinutes?: number;
  warnings: VisualWarning[];
}

export interface ResourceLocationView {
  id: string;
  buildingId?: string;
  buildingDefId?: string;
  displayName: string;
  regionName: string;
  kind: 'network' | 'production' | 'warehouse' | 'town_hall' | 'transport';
  storedAmount: number;
  capacity?: number;
  reservedAmount: number;
  availableAmount: number;
  inTransitAmount: number;
  distanceTiles?: number;
  status: 'active' | 'nearly_full' | 'full' | 'in_transit' | 'network';
  statusLabel: string;
  detail?: string;
}

export interface ResourceNetworkView {
  resource: string;
  resourceLabel: string;
  totalOwned: number;
  accessibleForConstruction: number;
  inProductionBuildings: number;
  inWarehouses?: number;
  inTownHall?: number;
  inTransit: number;
  reserved: number;
  locations: ResourceLocationView[];
  /** Lagervergleich über alle physischen Standorte (§ R3). Nur echte Werte. */
  storageComparison: ResourceStorageComparison;
  dataNotes: string[];
}

/**
 * Vergleich der **physischen** Lagerorte (lokale Betriebslager) — beantwortet
 * „wo staut es sich?". Der zentrale Pool ist bewusst NICHT enthalten: er ist im
 * aktuellen Modell ein gemeinsamer Bestand ohne Standort (§7.2).
 */
export interface ResourceStorageComparison {
  /** Anzahl Standorte mit echter Lagerkapazität. */
  locations: number;
  totalCapacity: number;
  totalStored: number;
  /** Freie physische Lagerkapazität. */
  totalFree: number;
  /** Auslastung 0..100. */
  utilizationPct: number;
  /** Standorte, die voll bzw. fast voll sind (Engpass). */
  fullLocations: number;
  /** Der vollste Standort — dort droht der Stopp zuerst. */
  fullestLocationId?: string;
  fullestLocationName?: string;
  fullestPct?: number;
}

export interface TransportMethodView {
  id: string;
  displayName: string;
  description: string;
  imageKey?: string;
  capacity: number;
  speedLabel: string;
  workerRequirement?: number;
  operatingCost: number;
  unlocked: boolean;
  available: boolean;
  disabledReason?: string;
}

export interface TransportTargetView {
  buildingId: string;
  buildingDefId: string;
  displayName: string;
  regionName: string;
  storedAmount?: number;
  capacity?: number;
  freeCapacity?: number;
  distanceTiles: number;
  estimatedDurationSeconds: number;
  routeQuality: 'good' | 'medium' | 'poor' | 'blocked';
  routeQualityLabel: string;
  recommended: boolean;
  warnings: VisualWarning[];
}

export interface TransportPlannerView {
  sourceBuildingId: string;
  sourceName: string;
  resource: string;
  resourceLabel: string;
  availableAmount: number;
  amount: number;
  selectedTargetId?: string;
  selectedMethodId?: string;
  methods: TransportMethodView[];
  targets: TransportTargetView[];
  loads?: number;
  distanceTiles?: number;
  estimatedDurationSeconds?: number;
  roadCoveragePct?: number;
  operatingCost?: number;
  canConfirm: boolean;
  warnings: VisualWarning[];
}

export interface TransportPlannerActions {
  onTargetSelect(buildingId: string): void;
  onAmountChange(amount: number): void;
  onTransportMethodSelect(methodId: string): void;
  onConfirm(): void;
  onCancel(): void;
}

export interface ResupplyTimelineStopView {
  id: string;
  type: 'source' | 'delivery' | 'resupply' | 'return';
  displayName: string;
  cargoBefore: number;
  cargoDelta: number;
  cargoAfter: number;
  capacity: number;
  status: 'sufficient' | 'tight' | 'insufficient' | 'resupply';
}

export interface ResupplySourceView {
  buildingId: string;
  displayName: string;
  amount: number;
  detourTiles?: number;
  loadingSeconds?: number;
  recommendation: 'optional' | 'recommended' | 'required';
}

export interface ResupplyTimelineView {
  vehicleCapacity: number;
  startingCargo: number;
  stops: ResupplyTimelineStopView[];
  firstInsufficientStopIndex?: number;
  availableSources: ResupplySourceView[];
}

export interface RoadAnchorView {
  x: number;
  y: number;
  label: string;
}

export interface RoadControlPointView extends RoadAnchorView {
  id: string;
}

export interface SmartRoadPlanTileView {
  x: number;
  y: number;
  status: 'start' | 'end' | 'ok' | 'bridge' | 'elevated' | 'exists' | 'blocked';
  variant: import('../../game/types.ts').RoadVariant;
  terrainHeight: number;
  roadHeight: number;
  gradePercent: number;
  clearance: number;
  reason?: string;
}

export interface SmartRoadPlanView {
  start?: RoadAnchorView;
  end?: RoadAnchorView;
  controlPoints: RoadControlPointView[];
  tiles: SmartRoadPlanTileView[];
  lengthTiles: number;
  lengthMeters: number;
  elevationDeltaMeters: number;
  maxGradePercent: number;
  averageGradePercent: number;
  dominantVariant: import('../../game/types.ts').RoadVariant;
  variantCounts: Record<import('../../game/types.ts').RoadVariant, number>;
  /** Geld-Anteil der Gesamtkosten (Metrik-Ton/Button-Kurzform). */
  cost: number;
  /** Vollständige Materialkosten inkl. Holz o. Ä. (§18.3 „gezeigter = gezahlter Preis"). */
  costs: Partial<Record<string, number>>;
  bridgeCount: number;
  elevatedCount: number;
  blockedCount: number;
  profileError?: 'insufficient_length' | 'invalid_anchor';
  warnings: VisualWarning[];
  valid: boolean;
}

export interface SmartRoadPlannerActions {
  onSetStart(anchor: RoadAnchorView): void;
  onSetEnd(anchor: RoadAnchorView): void;
  onControlPointMove(id: string, point: { x: number; y: number }): void;
  onAddControlPoint(point: { x: number; y: number }): void;
  onRequestAlternative(): void;
  onConfirm(): void;
  onCancel(): void;
}

export interface WaterfrontPlacementVisualView {
  buildingName: string;
  state: 'valid' | 'restricted' | 'invalid';
  stateLabel: string;
  waterDepth?: number;
  pillarHeight?: number;
  roadAccess: boolean;
  rotation: number;
  warnings: VisualWarning[];
}

export function clampPercent(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value ?? 0));
}

export function capacityTone(used: number, capacity: number): CapacityTone {
  if (capacity <= 0) return 'good';
  const ratio = clampPercent((used / capacity) * 100);
  if (ratio >= 100) return 'full';
  if (ratio >= 90) return 'warning';
  if (ratio >= 70) return 'gold';
  return 'good';
}

export function safeStatusLabel(label: string | undefined): string {
  return label?.trim() || 'Status unbekannt';
}
