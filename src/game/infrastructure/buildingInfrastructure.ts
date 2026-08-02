import type { GameConfig } from '../config/index.ts';
import type { BuildingDef } from '../config/types.ts';
import type { BuildingInstance, GameState } from '../types.ts';
import { waterRouteEdges, waterRouteNodes } from '../config/world/islandInfrastructure.gen.ts';
import { isConnectedToRoad, waterfrontWaterCells } from '../buildings/placement.ts';
import { bakedSurfaceAt } from '../config/startRegion.config.ts';

export type InfrastructureStatus =
  | 'connected'
  | 'partially_connected'
  | 'disconnected'
  | 'water_only'
  | 'road_only'
  | 'blocked';

export interface BuildingInfrastructureStatus {
  status: InfrastructureStatus;
  modes: { road: boolean; water: boolean };
  waterNodeId?: string;
  problems: ('no_road' | 'no_waterway' | 'waterway_blocked')[];
}

const waterNodeDegree = new Map<string, number>();
for (const edge of waterRouteEdges) {
  waterNodeDegree.set(edge.from, (waterNodeDegree.get(edge.from) ?? 0) + 1);
  waterNodeDegree.set(edge.to, (waterNodeDegree.get(edge.to) ?? 0) + 1);
}

function waterLineIsClear(cell: { x: number; y: number }, node: { x: number; z: number }): boolean {
  const fromX = cell.x + 0.5;
  const fromY = cell.y + 0.5;
  const distance = Math.hypot(node.x - fromX, node.z - fromY);
  const samples = Math.max(2, Math.ceil(distance * 4));
  for (let sample = 0; sample <= samples; sample++) {
    const t = sample / samples;
    const x = Math.floor(fromX + (node.x - fromX) * t);
    const y = Math.floor(fromY + (node.z - fromY) * t);
    if (!bakedSurfaceAt(x, y).water) return false;
  }
  return true;
}

function nearestNavigableWaterNode(def: BuildingDef, building: BuildingInstance): string | undefined {
  if (!def.waterfront) return undefined;
  const waterCells = waterfrontWaterCells(def, building.x, building.y, building.rotation ?? 0);
  let best: { id: string; distance: number } | undefined;
  for (const node of waterRouteNodes) {
    if ((waterNodeDegree.get(node.id) ?? 0) === 0 || node.depth < def.waterfront.minimumWaterDepth) continue;
    for (const cell of waterCells) {
      const distance = Math.hypot(node.position.x - (cell.x + 0.5), node.position.z - (cell.y + 0.5));
      if (
        distance <= 18 &&
        waterLineIsClear(cell, node.position) &&
        (!best || distance < best.distance)
      ) best = { id: node.id, distance };
    }
  }
  return best?.id;
}

/** Pure, controller-readable infrastructure projection; never persisted. */
export function buildingInfrastructureStatus(
  state: GameState,
  config: GameConfig,
  roadNetwork: Set<string>,
  building: BuildingInstance,
): BuildingInfrastructureStatus {
  void state;
  const def = config.buildings.get(building.defId);
  if (!def) return { status: 'blocked', modes: { road: false, water: false }, problems: ['waterway_blocked'] };

  const needsRoad = def.requiresRoad || def.infrastructureModes?.includes('road') === true;
  const needsWater = def.waterfront !== undefined || def.infrastructureModes?.includes('water') === true;
  const road = !needsRoad || isConnectedToRoad({ roadNetwork }, def, building.x, building.y);
  const waterNodeId = needsWater ? nearestNavigableWaterNode(def, building) : undefined;
  const water = !needsWater || waterNodeId !== undefined;
  const problems: BuildingInfrastructureStatus['problems'] = [];
  if (needsRoad && !road) problems.push('no_road');
  if (needsWater && !water) problems.push('no_waterway');

  let status: InfrastructureStatus;
  if (building.status === 'paused') status = 'blocked';
  else if (needsRoad && needsWater) {
    if (road && water) status = 'connected';
    else if (water) status = 'water_only';
    else if (road) status = 'road_only';
    else status = 'disconnected';
  } else if ((needsRoad && road) || (needsWater && water) || (!needsRoad && !needsWater)) status = 'connected';
  else status = 'disconnected';

  return {
    status,
    modes: { road, water },
    ...(waterNodeId ? { waterNodeId } : {}),
    problems,
  };
}

/** Unverbundene Gebäude liefern keine Kapazität/Produktion/Versorgung. */
export function isInfrastructureOperational(status: BuildingInfrastructureStatus): boolean {
  return status.status === 'connected';
}

export interface InfrastructureNetworkOverview {
  buildings: number;
  connected: number;
  partial: number;
  disconnected: number;
  roadTiles: number;
  waterNodes: number;
  waterEdges: number;
  /** Terrainnahe Kacheln der einen Straße: Land, Hang, Pass und Küste (§I5). */
  groundRoadTiles: number;
  /** Konstruktive Höhenabschnitte: Stützstraße, Viadukt und Brücke (I1). */
  elevatedRoadTiles: number;
  /** Gebaute Anleger/Häfen (waterfront), unabhängig vom Anschlusszustand. */
  harbors: number;
}

export function infrastructureNetworkOverview(
  state: GameState,
  config: GameConfig,
  roadNetwork: Set<string>,
): InfrastructureNetworkOverview {
  let connected = 0;
  let partial = 0;
  let disconnected = 0;
  let groundRoadTiles = 0;
  let elevatedRoadTiles = 0;
  let harbors = 0;
  const buildings: BuildingInstance[] = [];
  for (const building of Object.values(state.buildings)) {
    const def = config.buildings.get(building.defId);
    if (def?.category === 'roads') {
      // Save-v31-Neubauten tragen ihre automatisch gewählte Konstruktion. Alte
      // Saves bleiben eindeutig: nur die historische `road_elevated`-Definition
      // zählt ohne Metadaten als Höhenstraße.
      const variant = building.roadEngineering?.variant;
      const elevated = variant
        ? variant === 'support' || variant === 'viaduct' || variant === 'bridge'
        : building.defId === 'road_elevated';
      if (elevated) elevatedRoadTiles++;
      else groundRoadTiles++;
      continue;
    }
    if (def?.waterfront) harbors++;
    buildings.push(building);
  }
  for (const building of buildings) {
    const status = buildingInfrastructureStatus(state, config, roadNetwork, building).status;
    if (status === 'connected') connected++;
    else if (status === 'water_only' || status === 'road_only' || status === 'partially_connected') partial++;
    else disconnected++;
  }
  return {
    buildings: buildings.length,
    connected,
    partial,
    disconnected,
    roadTiles: roadNetwork.size,
    waterNodes: waterRouteNodes.length,
    waterEdges: waterRouteEdges.length,
    groundRoadTiles,
    elevatedRoadTiles,
    harbors,
  };
}
