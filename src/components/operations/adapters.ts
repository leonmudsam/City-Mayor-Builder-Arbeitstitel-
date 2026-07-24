import type { GameController } from '../../game/commands/controller.ts';
import { effectiveEffects } from '../../game/buildings/effects.ts';
import { BAKED_REGIONS, regionIdAt } from '../../game/config/startRegion.config.ts';
import type { BuildingWorkerStatus, DriveVehicle, ResourceId } from '../../game/types.ts';
import { t } from '../../i18n/index.ts';
import type {
  BuildingOperationView,
  ResourceLocationView,
  ResourceNetworkView,
  SmartRoadPlanView,
  TransportMethodView,
  TransportPlannerView,
  TransportTargetView,
  VisualWarning,
  WorkerStatusView,
  WorkAreaPlannerView,
  WorkAreaSelectionMode,
  WorkAreaVisualNode,
} from './viewModels.ts';

const number = (value: number): number => Math.max(0, Math.round(value));
const warning = (code: string, tone: VisualWarning['tone'] = 'warning'): VisualWarning => ({
  code,
  label: t(code),
  tone,
});

function buildingLabel(game: GameController, buildingId: string): string {
  const building = game.state.buildings[buildingId];
  const def = building && game.config.buildings.get(building.defId);
  return def ? t(def.nameKey) : 'Unbekannter Standort';
}

function locationLabel(game: GameController, x: number, y: number): { name: string; direction: string } {
  const regionId = regionIdAt(x, y);
  const region = game.config.regions.get(regionId);
  const baked = regionId > 0 ? BAKED_REGIONS[regionId - 1] : undefined;
  const dx = baked ? x - baked.centroid.x : 0;
  const dy = baked ? y - baked.centroid.y : 0;
  const direction =
    Math.abs(dx) > Math.abs(dy)
      ? dx < -4
        ? 'West'
        : dx > 4
          ? 'Ost'
          : 'Zentrum'
      : dy < -4
        ? 'Nord'
        : dy > 4
          ? 'Süd'
          : 'Zentrum';
  return {
    name: region ? t(region.nameKey) : 'Offene See',
    direction,
  };
}

function workerStatus(status: BuildingWorkerStatus, paused: boolean, storageFull: boolean): WorkerStatusView['status'] {
  if (paused) return 'paused';
  if (storageFull && (status === 'idle' || status === 'waiting')) return 'storage_full';
  if (status === 'blocked') return 'blocked';
  if (status === 'waiting') return 'waiting';
  if (status === 'idle') return 'no_target';
  if (status === 'walking_to_target' || status === 'returning') return 'travelling';
  return 'active';
}

const WORKER_STATUS_LABELS: Record<WorkerStatusView['status'], string> = {
  active: 'Arbeitet am Ziel',
  travelling: 'Unterwegs',
  waiting: 'Wartet',
  storage_full: 'Lager voll',
  no_target: 'Kein Ziel',
  paused: 'Pausiert',
  blocked: 'Blockiert',
};

export function defaultWorkAreaSelection(game: GameController, buildingId: string, radius: number): string[] {
  const operation = game.getBuildingOperation(buildingId);
  if (operation?.targetNodeIds.length) return [...operation.targetNodeIds];
  return game
    .getResourceNodesNear(buildingId, radius)
    .filter((node) => node.state === 'available' || node.reservedBy === buildingId)
    .map((node) => node.id);
}

export function buildWorkAreaPlannerView(
  game: GameController,
  buildingId: string,
  selectionMode: WorkAreaSelectionMode,
  radius: number,
  selectedNodeIds: readonly string[],
): WorkAreaPlannerView | undefined {
  const building = game.state.buildings[buildingId];
  const def = building && game.config.buildings.get(building.defId);
  const info = game.getBuildingOperationInfo(buildingId);
  const area = game.getBuildingWorkArea(buildingId);
  if (!building || !def?.operation || !info || !area) return undefined;
  const operationProfile = def.operation;

  const selected = new Set(selectedNodeIds);
  const nodes = game.getResourceNodesNear(buildingId, area.maxRadius);
  const preview = game.getBuildingOperationPreview(buildingId, [...selected]);
  const valid = new Set(preview?.validTargetIds ?? []);
  const invalid = new Set(preview?.invalidTargetIds ?? []);
  const visualNodes: WorkAreaVisualNode[] = nodes.map((node) => {
    const distance = Math.max(Math.abs(node.x - area.center.x), Math.abs(node.y - area.center.y));
    const reservedElsewhere = node.reservedBy !== undefined && node.reservedBy !== buildingId;
    const outsideRadius = distance > radius;
    const state: WorkAreaVisualNode['state'] =
      reservedElsewhere
        ? 'reserved'
        : outsideRadius || invalid.has(node.id)
          ? 'invalid'
          : selected.has(node.id) && valid.has(node.id)
            ? 'selected'
            : 'available';
    const falloffStart = info.efficientRadius;
    const falloffRange = Math.max(1, info.maxRadius - falloffStart);
    const efficiencyPct = distance <= falloffStart
      ? 100
      : Math.max(35, Math.round(100 - ((distance - falloffStart) / falloffRange) * 65));
    return {
      id: node.id,
      x: node.x,
      y: node.y,
      label: `${operationProfile.nodeType === 'tree' ? 'Baum' : 'Ressource'} ${node.id}`,
      resourceLabel: t(`resource.${node.resource}`),
      amountMin: number(node.remainingAmount),
      amountMax: number(node.remainingAmount),
      distanceTiles: Math.round(distance * 10) / 10,
      efficiencyPct,
      state,
      stateLabel:
        state === 'selected'
          ? 'Ausgewählt'
          : state === 'reserved'
            ? 'Anderweitig reserviert'
            : state === 'invalid'
              ? 'Außerhalb des Radius'
              : 'Verfügbar',
    };
  });

  const selectedVisual = visualNodes.filter((node) => node.state === 'selected');
  const expectedYield = preview?.expectedYield ?? 0;
  const warnings = (preview?.warnings ?? []).map((code) => warning(code));
  if (selectionMode === 'rectangle' || selectionMode === 'polygon') {
    warnings.unshift({
      code: 'visual.selection_mode_unbound',
      label: 'Diese Auswahlform ist visuell vorbereitet, aber noch nicht an einen Controller-Command angebunden.',
      tone: 'info',
    });
  }
  return {
    buildingId,
    buildingName: t(def.nameKey),
    resourceType: operationProfile.resource,
    resourceLabel: t(`resource.${operationProfile.resource}`),
    selectionMode,
    center: area.center,
    radius: Math.max(1, Math.min(area.maxRadius, radius)),
    efficientRange: info.efficientRadius,
    maximumRange: info.maxRadius,
    nodes: visualNodes,
    selectedNodeIds: selectedVisual.map((node) => node.id),
    validNodeCount: selectedVisual.length,
    reservedNodeCount: visualNodes.filter((node) => node.state === 'reserved').length,
    excludedNodeCount: visualNodes.filter((node) => node.state === 'invalid').length,
    expectedYieldMin: number(expectedYield),
    expectedYieldMax: number(expectedYield),
    estimatedDurationSeconds: number(preview?.expectedDurationSec ?? 0),
    averageDistanceTiles: preview?.travelDistanceAvg ?? 0,
    workerSlots: info.workerSlots,
    localStored: info.inventory.used,
    localReserved: info.inventory.reserved[operationProfile.resource] ?? 0,
    localCapacity: info.inventory.capacity,
    storageAfter: preview?.storageAfter ?? info.inventory.used,
    existingOperation: info.active !== undefined,
    canConfirm:
      selectedVisual.length > 0 &&
      selectionMode !== 'rectangle' &&
      selectionMode !== 'polygon' &&
      warnings.every((item) => item.tone !== 'danger'),
    warnings,
  };
}

export function buildBuildingOperationView(
  game: GameController,
  buildingId: string,
): BuildingOperationView | undefined {
  const building = game.state.buildings[buildingId];
  const def = building && game.config.buildings.get(building.defId);
  const info = game.getBuildingOperationInfo(buildingId);
  if (!building || !def?.operation || !info) return undefined;
  const operation = game.getBuildingOperation(buildingId);
  const paused = operation?.status === 'paused';
  const workers: WorkerStatusView[] = game.getBuildingWorkers(buildingId).map((worker, index) => {
    const status = workerStatus(worker.status, paused, info.storageFull);
    return {
      id: worker.id,
      displayName: `Arbeiter ${index + 1}`,
      status,
      statusLabel: WORKER_STATUS_LABELS[status],
      progressPct: Math.round(Math.max(0, Math.min(1, worker.progress)) * 100),
      ...(worker.carriedAmount > 0
        ? { detail: `${number(worker.carriedAmount)} ${t(`resource.${info.resource}`)} geladen` }
        : worker.targetNodeId
          ? { detail: `Ziel ${worker.targetNodeId}` }
          : {}),
    };
  });
  const status: BuildingOperationView['status'] =
    paused ? 'paused' : info.storageFull ? 'storage_full' : operation ? 'active' : 'waiting';
  const warnings: VisualWarning[] = [];
  if (info.storageFull) warnings.push({ code: 'storage_full', label: 'Das lokale Lager ist voll.', tone: 'danger' });
  if (!operation) warnings.push({ code: 'no_operation', label: 'Kein Arbeitsauftrag aktiv.', tone: 'info' });
  return {
    buildingId,
    buildingName: t(def.nameKey),
    categoryLabel: 'Aktiver Betrieb',
    stage: building.upgradeLevel + 1,
    stageCount: def.operation.stages.length,
    status,
    statusLabel:
      status === 'active'
        ? 'Aktiv'
        : status === 'paused'
          ? 'Pausiert'
          : status === 'storage_full'
            ? 'Lager voll'
            : 'Bereit',
    resource: info.resource,
    resourceLabel: t(`resource.${info.resource}`),
    workers,
    workerSlots: info.workerSlots,
    targetCount: info.active?.targetCount ?? 0,
    remainingTargetCount: info.active?.remainingCount ?? 0,
    localStored: info.inventory.used,
    localReserved: info.inventory.reserved[info.resource] ?? 0,
    localCapacity: info.inventory.capacity,
    availableForTransport: game.getAvailableForTransfer(buildingId, info.resource),
    // Eine echte rollierende Produktionshistorie existiert im Controller noch
    // nicht. Die optionalen Felder bleiben deshalb bewusst abwesend.
    warnings,
  };
}

function locationKind(game: GameController, buildingId: string): ResourceLocationView['kind'] {
  const building = game.state.buildings[buildingId];
  const def = building && game.config.buildings.get(building.defId);
  if (!def) return 'production';
  if (def.id === 'town_hall') return 'town_hall';
  if (def.operation) return 'production';
  return effectiveEffects(def, building.upgradeLevel).some((effect) => effect.type === 'storage')
    ? 'warehouse'
    : 'production';
}

export function buildResourceNetworkView(game: GameController, resource: ResourceId): ResourceNetworkView {
  const overview = game.getInventoryNetworkOverview()[resource];
  const global = overview?.global ?? game.state.resources[resource] ?? 0;
  const capacity = game.derived.storageCaps[resource];
  const locations: ResourceLocationView[] = [
    {
      id: `network:${resource}`,
      displayName: 'Zentrales Ressourcennetz',
      regionName: 'Gemeinsamer, logisch verfügbarer Bestand',
      kind: 'network',
      storedAmount: number(global),
      capacity,
      reservedAmount: 0,
      availableAmount: number(global),
      inTransitAmount: number(overview?.inTransit ?? 0),
      status: 'network',
      statusLabel: 'Für Bau und Stadt verfügbar',
      detail: 'Der Controller führt diesen Bestand global. Eine Aufteilung auf einzelne Lagerorte ist nicht vorhanden.',
    },
  ];

  for (const [buildingId, inventory] of Object.entries(game.state.operations?.inventories ?? {})) {
    const amount = inventory.items[resource] ?? 0;
    const reserved = Math.min(amount, inventory.reserved[resource] ?? 0);
    if (amount <= 0 && reserved <= 0) continue;
    const building = game.state.buildings[buildingId];
    const def = building && game.config.buildings.get(building.defId);
    if (!building || !def) continue;
    const place = locationLabel(game, building.x, building.y);
    const status: ResourceLocationView['status'] =
      inventory.capacity > 0 && inventory.items && amount >= inventory.capacity
        ? 'full'
        : inventory.capacity > 0 && amount / inventory.capacity >= 0.85
          ? 'nearly_full'
          : 'active';
    locations.push({
      id: `building:${buildingId}`,
      buildingId,
      buildingDefId: def.id,
      displayName: `${t(def.nameKey)} · ${place.direction}`,
      regionName: place.name,
      kind: locationKind(game, buildingId),
      storedAmount: number(amount),
      capacity: inventory.capacity,
      reservedAmount: number(reserved),
      availableAmount: number(Math.max(0, amount - reserved)),
      inTransitAmount: number(
        game
          .getBuildingTransfers(buildingId)
          .filter((transfer) => transfer.resource === resource)
          .reduce((sum, transfer) => sum + (transfer.onboard ?? 0), 0),
      ),
      status,
      statusLabel: status === 'full' ? 'Voll' : status === 'nearly_full' ? 'Fast voll' : 'Aktiv',
    });
  }

  return {
    resource,
    resourceLabel: t(`resource.${resource}`),
    totalOwned: number(overview?.total ?? global),
    accessibleForConstruction: number(global),
    inProductionBuildings: number((overview?.localBound ?? 0) + (overview?.reserved ?? 0)),
    inTransit: number(overview?.inTransit ?? 0),
    reserved: number(overview?.reserved ?? 0),
    locations,
    dataNotes: [
      'Lokale Betriebslager und Transporte sind physisch zugeordnet.',
      'Der zentrale Bestand ist im aktuellen Controller ein gemeinsamer Pool; Rathaus- und Lagerhausanteile werden nicht vorgetäuscht.',
    ],
  };
}

function allTransportMethods(game: GameController): TransportMethodView[] {
  const methods: TransportMethodView[] = [
    {
      id: 'handcart',
      displayName: 'Handkarren',
      description: 'Visuell vorgesehene Frühtransport-Stufe.',
      imageKey: 'transport_handcart',
      capacity: 0,
      speedLabel: 'Nicht angebunden',
      operatingCost: 0,
      unlocked: false,
      available: false,
      disabledReason: 'Im Fahrzeugkatalog und Controller noch nicht vorhanden.',
    },
  ];
  for (const vehicle of game.config.activities.vehicles) {
    const unlocked = vehicle.unlockLevel <= game.state.level.current && !vehicle.future;
    methods.push({
      id: vehicle.id,
      displayName: t(vehicle.nameKey),
      description: t(vehicle.descriptionKey),
      imageKey: vehicle.imageKey,
      capacity: vehicle.capacity,
      speedLabel: `${vehicle.speedKph} km/h`,
      operatingCost: vehicle.operatingCost,
      unlocked,
      available: unlocked,
      ...(vehicle.future
        ? { disabledReason: 'Für eine spätere Ausbaustufe vorgesehen.' }
        : unlocked
          ? {}
          : { disabledReason: `Ab Stadtlevel ${vehicle.unlockLevel}.` }),
    });
  }
  return methods;
}

function routeQuality(coverage: number | undefined): TransportTargetView['routeQuality'] {
  if (coverage === undefined) return 'blocked';
  if (coverage >= 0.95) return 'good';
  if (coverage >= 0.65) return 'medium';
  return 'poor';
}

export function buildTransportPlannerView(
  game: GameController,
  sourceBuildingId: string,
  resource: ResourceId,
  amount: number,
  selectedTargetId?: string,
  selectedMethodId?: string,
): TransportPlannerView {
  const available = Math.floor(game.getAvailableForTransfer(sourceBuildingId, resource));
  const safeAmount = Math.max(0, Math.min(available, Math.floor(amount)));
  const methods = allTransportMethods(game);
  const selectedMethod = methods.find((method) => method.id === selectedMethodId && method.available);
  const vehicleId = selectedMethod?.id as DriveVehicle | undefined;
  const rawTargets = game.getInventoryTransferTargets(sourceBuildingId, resource);

  const targets: TransportTargetView[] = rawTargets.map((target) => {
    const preview = vehicleId
      ? game.getInventoryTransferPreview({
          sourceBuildingId,
          targetBuildingId: target.buildingId,
          resource,
          amount: Math.max(1, safeAmount),
          vehicleId,
        })
      : undefined;
    const place = locationLabel(game, target.x, target.y);
    const quality = routeQuality(preview?.roadCoverage);
    return {
      buildingId: target.buildingId,
      buildingDefId: target.defId,
      displayName: `${t(target.nameKey)} · ${place.direction}`,
      regionName: place.name,
      distanceTiles: preview?.distanceTiles ?? 0,
      estimatedDurationSeconds: preview?.totalSec ?? 0,
      routeQuality: quality,
      routeQualityLabel:
        quality === 'good'
          ? 'Gute Straßenanbindung'
          : quality === 'medium'
            ? 'Teilweise angebunden'
            : quality === 'poor'
              ? 'Schwache Anbindung'
              : 'Keine Route',
      recommended: quality === 'good' && preview !== undefined,
      warnings: (preview?.warnings ?? []).map((code) => warning(code)),
    };
  });

  const targetId = targets.some((target) => target.buildingId === selectedTargetId)
    ? selectedTargetId
    : targets[0]?.buildingId;
  const preview =
    targetId && vehicleId && safeAmount > 0
      ? game.getInventoryTransferPreview({
          sourceBuildingId,
          targetBuildingId: targetId,
          resource,
          amount: safeAmount,
          vehicleId,
        })
      : undefined;
  const warnings = (preview?.warnings ?? []).map((code) => warning(code));
  if (selectedMethodId === 'handcart') {
    warnings.unshift({
      code: 'visual.handcart_unbound',
      label: 'Der Handkarren ist nur als Ausbauvorschau sichtbar und kann noch keinen Controller-Command auslösen.',
      tone: 'info',
    });
  }
  return {
    sourceBuildingId,
    sourceName: buildingLabel(game, sourceBuildingId),
    resource,
    resourceLabel: t(`resource.${resource}`),
    availableAmount: available,
    amount: safeAmount,
    ...(targetId ? { selectedTargetId: targetId } : {}),
    ...(selectedMethodId ? { selectedMethodId } : {}),
    methods,
    targets,
    ...(preview
      ? {
          loads: preview.loads,
          distanceTiles: preview.distanceTiles,
          estimatedDurationSeconds: preview.totalSec,
          roadCoveragePct: Math.round(preview.roadCoverage * 100),
          operatingCost: preview.operatingCost,
        }
      : {}),
    canConfirm: preview !== undefined && preview.amount > 0 && preview.warnings.every((code) => code !== 'ui.transport.warn_no_vehicle'),
    warnings,
  };
}

export function buildSmartRoadPlanView(
  game: GameController,
  path: readonly { x: number; y: number }[],
  roadDefId: string = 'road',
): SmartRoadPlanView {
  const preview = game.roadPathPreview([...path], roadDefId);
  const first = path[0];
  const last = path[path.length - 1];
  const tiles = preview.tiles.map((tile, index) => ({
    x: tile.x,
    y: tile.y,
    status:
      index === 0
        ? ('start' as const)
        : index === preview.tiles.length - 1
          ? ('end' as const)
          : tile.status,
    ...(tile.reason ? { reason: t(`error.${tile.reason}`) } : {}),
  }));
  const money = preview.totalCost.money ?? 0;
  const bridgeCount = preview.tiles.filter((tile) => tile.status === 'bridge').length;
  const warnings: VisualWarning[] = [];
  if (preview.blocked > 0) {
    warnings.push({
      code: 'road.blocked',
      label: `${preview.blocked} Segment${preview.blocked === 1 ? '' : 'e'} blockiert.`,
      tone: 'danger',
    });
  }
  if (bridgeCount > 0) {
    warnings.push({
      code: 'road.bridge',
      label: `${bridgeCount} Brückensegment${bridgeCount === 1 ? '' : 'e'} über Wasser/Klippe (Pfeiler-Aufschlag inbegriffen).`,
      tone: 'info',
    });
  }
  return {
    ...(first ? { start: { ...first, label: 'Startpunkt' } } : {}),
    ...(last ? { end: { ...last, label: 'Zielpunkt' } } : {}),
    controlPoints: [],
    tiles,
    lengthTiles: preview.buildTiles,
    cost: money,
    costs: preview.totalCost,
    bridgeCount,
    // Höhenstraßen-Landkacheln (Viadukt/Rampe auf Land): alle neu gebauten Kacheln
    // einer querenden Bauklasse abzüglich der echten Wasser-/Klippen-Brückenkacheln.
    elevatedCount: game.config.buildings.get(roadDefId)?.road ? Math.max(0, preview.buildTiles - bridgeCount) : 0,
    blockedCount: preview.blocked,
    warnings,
    valid: path.length > 1 && preview.valid,
  };
}
