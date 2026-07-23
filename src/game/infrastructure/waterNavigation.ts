import type { GameConfig } from '../config/index.ts';
import type { GameState } from '../types.ts';
import {
  waterRouteEdges,
  waterRouteNodes,
  type WaterRouteEdge,
  type WaterRouteNode,
} from '../config/world/islandInfrastructure.gen.ts';
import { buildingInfrastructureStatus } from './buildingInfrastructure.ts';

export interface WaterNavigationNode {
  id: string;
  position: { x: number; y: number; z: number };
  waterType: 'ocean' | 'river' | 'lake' | 'channel';
  depth: number;
  width: number;
  regionId: number;
}

export interface WaterNavigationEdge {
  from: string;
  to: string;
  distance: number;
  minimumDepth: number;
  minimumWidth: number;
  clearance: number;
  blocked: boolean;
}

export interface WaterNavigationGraph {
  nodes: readonly WaterNavigationNode[];
  edges: readonly WaterNavigationEdge[];
}

export interface ShippingRoutePreview {
  originHarborId: string;
  destinationHarborId: string;
  nodeIds: string[];
  points: { x: number; y: number; z: number }[];
  distance: number;
  status: 'planned' | 'blocked' | 'insufficient_depth';
  problemNodeId?: string;
}

export interface AvailableHarborConnection {
  harborId: string;
  distance: number;
  status: ShippingRoutePreview['status'];
}

const nodeById = new Map(waterRouteNodes.map((node) => [node.id, node]));
const adjacency = new Map<string, WaterRouteEdge[]>();
for (const edge of waterRouteEdges) {
  const fromEdges = adjacency.get(edge.from) ?? [];
  const toEdges = adjacency.get(edge.to) ?? [];
  fromEdges.push(edge);
  toEdges.push(edge);
  adjacency.set(edge.from, fromEdges);
  adjacency.set(edge.to, toEdges);
}

const waterType = (node: WaterRouteNode): WaterNavigationNode['waterType'] => {
  if (node.type === 'sea') return 'ocean';
  if (node.type === 'river') return 'river';
  if (node.type === 'lake') return 'lake';
  return 'channel';
};

const graph: WaterNavigationGraph = {
  nodes: waterRouteNodes.map((node) => ({
    id: node.id,
    position: node.position,
    waterType: waterType(node),
    depth: node.depth,
    width: node.width,
    regionId: node.regionId,
  })),
  edges: waterRouteEdges.map((edge) => {
    const from = nodeById.get(edge.from)!;
    const to = nodeById.get(edge.to)!;
    return {
      from: edge.from,
      to: edge.to,
      distance: edge.length,
      minimumDepth: edge.minDepth,
      minimumWidth: Math.min(from.width, to.width),
      clearance: edge.minClearance,
      blocked: false,
    };
  }),
};

export function getWaterNavigationGraph(): WaterNavigationGraph {
  return graph;
}

function harborWaterNode(
  state: GameState,
  config: GameConfig,
  roadNetwork: Set<string>,
  harborId: string,
): string | undefined {
  const building = state.buildings[harborId];
  if (!building || !config.buildings.get(building.defId)?.waterfront) return undefined;
  return buildingInfrastructureStatus(state, config, roadNetwork, building).waterNodeId;
}

function routeBetweenNodes(
  state: GameState,
  origin: string,
  destination: string,
  minimumDepth: number,
): { nodeIds: string[]; distance: number; shallow: boolean } | undefined {
  const distance = new Map<string, number>([[origin, 0]]);
  const previous = new Map<string, string>();
  const open = new Set<string>([origin]);
  let shallowEncountered = false;
  const nodeAllowed = (nodeId: string): boolean => {
    const node = nodeById.get(nodeId);
    if (!node || node.regionId === 0 || nodeId === origin || nodeId === destination) return !!node;
    return state.world.regions[String(node.regionId)]?.status === 'unlocked';
  };

  while (open.size > 0) {
    let current: string | undefined;
    let currentDistance = Number.POSITIVE_INFINITY;
    for (const candidate of open) {
      const candidateDistance = distance.get(candidate) ?? Number.POSITIVE_INFINITY;
      if (candidateDistance < currentDistance) {
        current = candidate;
        currentDistance = candidateDistance;
      }
    }
    if (!current) break;
    open.delete(current);
    if (current === destination) break;
    for (const edge of adjacency.get(current) ?? []) {
      const next = edge.from === current ? edge.to : edge.from;
      if (!nodeAllowed(next)) continue;
      if (edge.minDepth < minimumDepth) {
        shallowEncountered = true;
        continue;
      }
      const nextDistance = currentDistance + edge.length;
      if (nextDistance >= (distance.get(next) ?? Number.POSITIVE_INFINITY)) continue;
      distance.set(next, nextDistance);
      previous.set(next, current);
      open.add(next);
    }
  }

  const total = distance.get(destination);
  if (total === undefined) return shallowEncountered ? { nodeIds: [], distance: 0, shallow: true } : undefined;
  const nodeIds = [destination];
  while (nodeIds[0] !== origin) {
    const prev = previous.get(nodeIds[0]!);
    if (!prev) return undefined;
    nodeIds.unshift(prev);
  }
  return { nodeIds, distance: total, shallow: false };
}

/** Geometric preview only; no route state, capacity, costs or save mutation. */
export function getShippingRoutePreview(
  state: GameState,
  config: GameConfig,
  roadNetwork: Set<string>,
  originHarborId: string,
  destinationHarborId: string,
): ShippingRoutePreview | undefined {
  const origin = harborWaterNode(state, config, roadNetwork, originHarborId);
  const destination = harborWaterNode(state, config, roadNetwork, destinationHarborId);
  if (!origin || !destination || origin === destination) return undefined;
  const originDef = config.buildings.get(state.buildings[originHarborId]?.defId ?? '');
  const destinationDef = config.buildings.get(state.buildings[destinationHarborId]?.defId ?? '');
  const minimumDepth = Math.max(
    originDef?.waterfront?.minimumWaterDepth ?? 0.55,
    destinationDef?.waterfront?.minimumWaterDepth ?? 0.55,
  );
  const result = routeBetweenNodes(state, origin, destination, minimumDepth);
  if (!result || result.nodeIds.length === 0) {
    return {
      originHarborId,
      destinationHarborId,
      nodeIds: [],
      points: [],
      distance: 0,
      status: result?.shallow ? 'insufficient_depth' : 'blocked',
    };
  }
  return {
    originHarborId,
    destinationHarborId,
    nodeIds: result.nodeIds,
    points: result.nodeIds.map((id) => nodeById.get(id)!.position),
    distance: result.distance,
    status: 'planned',
  };
}

export function getAvailableHarborConnections(
  state: GameState,
  config: GameConfig,
  roadNetwork: Set<string>,
  harborId: string,
): AvailableHarborConnection[] {
  const result: AvailableHarborConnection[] = [];
  for (const building of Object.values(state.buildings)) {
    if (building.id === harborId || !config.buildings.get(building.defId)?.waterfront) continue;
    const preview = getShippingRoutePreview(state, config, roadNetwork, harborId, building.id);
    if (preview) result.push({ harborId: building.id, distance: preview.distance, status: preview.status });
  }
  return result.sort((a, b) => a.distance - b.distance || a.harborId.localeCompare(b.harborId));
}
