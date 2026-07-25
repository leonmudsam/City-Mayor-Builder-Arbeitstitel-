/**
 * Ausschließlich für Storybook-/Screenshot-Kompositionen.
 *
 * Produktionskomponenten importieren dieses Modul bewusst nicht. Die Daten
 * erfüllen dieselben stabilen ViewModel-Verträge wie die Controller-Adapter,
 * ohne je einen GameState oder ein Save zu berühren.
 */
import type {
  BuildingOperationView,
  ResourceNetworkView,
  SmartRoadPlanView,
  TransportPlannerView,
  WaterfrontPlacementVisualView,
  WorkAreaPlannerView,
} from '../components/operations/viewModels.ts';

export const activeOperationsVisualMocks: {
  workArea: WorkAreaPlannerView;
  resourceNetwork: ResourceNetworkView;
  transport: TransportPlannerView;
} = {
  workArea: {
    buildingId: 'visual-sawmill',
    buildingName: 'Sägewerk',
    resourceType: 'wood',
    resourceLabel: 'Holz',
    selectionMode: 'circle',
    center: { x: 0, y: 0 },
    radius: 18,
    efficientRange: 14,
    maximumRange: 24,
    nodes: [],
    selectedNodeIds: [],
    validNodeCount: 34,
    reservedNodeCount: 5,
    excludedNodeCount: 0,
    expectedYieldMin: 310,
    expectedYieldMax: 310,
    estimatedDurationSeconds: 1_140,
    averageDistanceTiles: 14,
    workerSlots: 2,
    localStored: 84,
    localReserved: 24,
    localCapacity: 120,
    storageAfter: 120,
    existingOperation: true,
    canConfirm: true,
    warnings: [],
  },
  resourceNetwork: {
    resource: 'wood',
    resourceLabel: 'Holz',
    totalOwned: 221,
    accessibleForConstruction: 140,
    inProductionBuildings: 46,
    inWarehouses: 10,
    inTownHall: 25,
    inTransit: 18,
    reserved: 22,
    locations: [],
    storageComparison: {
      locations: 0,
      totalCapacity: 0,
      totalStored: 0,
      totalFree: 0,
      utilizationPct: 0,
      fullLocations: 0,
    },
    dataNotes: ['Visuelle Kompositionsdaten – keine Produktionsquelle.'],
  },
  transport: {
    sourceBuildingId: 'visual-sawmill',
    sourceName: 'Sägewerk',
    resource: 'wood',
    resourceLabel: 'Holz',
    availableAmount: 60,
    amount: 20,
    selectedTargetId: 'visual-warehouse',
    selectedMethodId: 'handcart',
    methods: [],
    targets: [],
    loads: 1,
    distanceTiles: 14,
    estimatedDurationSeconds: 120,
    roadCoveragePct: 100,
    operatingCost: 0,
    canConfirm: false,
    warnings: [
      {
        code: 'visual-only',
        label: 'Kompositionsdaten sind nicht an den Controller angebunden.',
        tone: 'info',
      },
    ],
  },
};

/** Kleiner, strikt typisierter Szenariokatalog für visuelle Regressionen. Ein
 * Story-/Screenshot-Harness darf die Patches über die Basismocks legen. */
export const activeOperationsVisualScenarios = {
  workArea: [
    { id: 'empty', label: 'Kein Gebiet gewählt', patch: { selectedNodeIds: [], validNodeCount: 0, canConfirm: false } },
    { id: 'small-valid', label: 'Gültiges kleines Gebiet', patch: { radius: 8, validNodeCount: 12, canConfirm: true } },
    { id: 'too-large', label: 'Zu großes Gebiet', patch: { radius: 28, excludedNodeCount: 19, canConfirm: false } },
    { id: 'far', label: 'Weit entferntes Gebiet', patch: { averageDistanceTiles: 24, estimatedDurationSeconds: 2_700 } },
    { id: 'storage-high', label: 'Lager fast voll', patch: { localStored: 112, localCapacity: 120, storageAfter: 120 } },
    { id: 'reserved', label: 'Mehrere reservierte Bäume', patch: { reservedNodeCount: 9 } },
    { id: 'unreachable', label: 'Keine erreichbaren Ressourcen', patch: { validNodeCount: 0, canConfirm: false } },
  ] satisfies { id: string; label: string; patch: Partial<WorkAreaPlannerView> }[],
  operation: [
    { id: 'active', label: 'Aktiv', patch: { status: 'active', statusLabel: 'Aktiv' } },
    { id: 'paused', label: 'Pausiert', patch: { status: 'paused', statusLabel: 'Pausiert' } },
    { id: 'full', label: 'Lager voll', patch: { status: 'storage_full', statusLabel: 'Lager voll' } },
    { id: 'no-target', label: 'Kein Ziel', patch: { status: 'waiting', targetCount: 0 } },
    { id: 'blocked', label: 'Blockiert', patch: { status: 'blocked', statusLabel: 'Blockiert' } },
  ] satisfies { id: string; label: string; patch: Partial<BuildingOperationView> }[],
  resource: [
    { id: 'single', label: 'Ein Lager', patch: { locations: [] } },
    { id: 'multiple', label: 'Mehrere Lager', patch: { totalOwned: 480 } },
    { id: 'full', label: 'Volles Lager', patch: { reserved: 0 } },
    { id: 'transit', label: 'Ressource unterwegs', patch: { inTransit: 80 } },
    { id: 'reserved', label: 'Ressource reserviert', patch: { reserved: 120 } },
  ] satisfies { id: string; label: string; patch: Partial<ResourceNetworkView> }[],
  transport: [
    { id: 'sufficient', label: 'Ladung reicht', patch: { amount: 20, canConfirm: true } },
    { id: 'optional-resupply', label: 'Nachfüllung optional', patch: { loads: 2 } },
    { id: 'required-resupply', label: 'Nachfüllung erforderlich', patch: { loads: 3 } },
    { id: 'no-source', label: 'Keine passende Quelle', patch: { availableAmount: 0, canConfirm: false } },
    { id: 'other-vehicle', label: 'Anderes Fahrzeug empfohlen', patch: { selectedMethodId: 'medium_truck' } },
  ] satisfies { id: string; label: string; patch: Partial<TransportPlannerView> }[],
  road: [
    { id: 'valid', label: 'Gültige Route', patch: { valid: true, blockedCount: 0 } },
    { id: 'bridge', label: 'Brücke erforderlich', patch: { bridgeCount: 1 } },
    { id: 'viaduct', label: 'Viadukt vorgesehen', patch: { elevatedCount: 1, valid: false } },
    { id: 'slope', label: 'Ungültige Steigung', patch: { blockedCount: 2, valid: false } },
    { id: 'locked', label: 'Region gesperrt', patch: { blockedCount: 4, valid: false } },
  ] satisfies { id: string; label: string; patch: Partial<SmartRoadPlanView> }[],
  waterfront: [
    { id: 'flat', label: 'Flaches Ufer', patch: { state: 'valid', stateLabel: 'Gültig' } },
    { id: 'piles', label: 'Stelzen erforderlich', patch: { state: 'restricted', pillarHeight: 3.2 } },
    { id: 'cliff', label: 'Zu steile Klippe', patch: { state: 'invalid', stateLabel: 'Klippe zu steil' } },
    { id: 'shallow', label: 'Wasser zu flach', patch: { state: 'invalid', waterDepth: 0.2 } },
    { id: 'no-road', label: 'Keine Straßenanbindung', patch: { state: 'restricted', roadAccess: false } },
  ] satisfies { id: string; label: string; patch: Partial<WaterfrontPlacementVisualView> }[],
} as const;
