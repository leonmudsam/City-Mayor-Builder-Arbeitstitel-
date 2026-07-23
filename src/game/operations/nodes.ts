// Ressourcenknoten (§ Active Operations 2.0, Phase A3). Wie das Terrain sind
// verfügbare Naturressourcen NICHT persistiert, sondern deterministisch aus der
// Welt + einem Positions-Hash abgeleitet; persistiert werden in
// `state.operations.nodeDeltas` nur Abweichungen (angearbeitet/reserviert/
// erschöpft/nachwachsend). Das gibt jedem Baum eine stabile Id (`"x,y"`), hält
// den Save winzig und garantiert, dass Regeneration nur auf gültigem Terrain
// passiert (§26.14/15). Rein — kein Renderer/React (CLAUDE.md §1).

import type { GameState, ResourceId, ResourceNodeType } from '../types.ts';
import { tileAt, worldTerrainAt } from '../map/world.ts';
import { terrainAt } from '../config/startRegion.config.ts';

/** Grundmenge Holz je Baumknoten (Referenzschnitt). */
export const TREE_MAX_AMOUNT = 32;
/** Anteil geeigneter Wald-Kacheln, die einen Baumknoten tragen (0..1). */
const TREE_DENSITY = 0.5;
/** Nachwachsdauer eines gefällten Baums (ms Simulationszeit). */
export const TREE_REGEN_MS = 8 * 60 * 1000;

export type ResourceNodeRuntimeState = 'available' | 'reserved' | 'being_worked' | 'depleted' | 'regrowing';

/**
 * Laufzeit-Sicht eines Ressourcenknotens: Grundzustand (aus Welt + Hash)
 * überlagert mit dem persistierten Delta. Wird nie gespeichert.
 */
export interface ResourceNode {
  /** Stabile Id = `"x,y"`. */
  id: string;
  type: ResourceNodeType;
  x: number;
  y: number;
  resource: ResourceId;
  state: ResourceNodeRuntimeState;
  remainingAmount: number;
  maxAmount: number;
  /** Betrieb (buildingId), der den Knoten reserviert hat. */
  reservedBy?: string;
  /** Zeitpunkt, ab dem ein erschöpfter Knoten wieder verfügbar ist. */
  regenerationAt?: number;
}

export function nodeIdOf(x: number, y: number): string {
  return `${x},${y}`;
}

export function parseNodeId(id: string): { x: number; y: number } | undefined {
  const comma = id.indexOf(',');
  if (comma < 0) return undefined;
  const x = Number.parseInt(id.slice(0, comma), 10);
  const y = Number.parseInt(id.slice(comma + 1), 10);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return undefined;
  return { x, y };
}

/** Deterministischer 0..1-Hash einer Kachel (stabil, plattformunabhängig). */
function hash01(x: number, y: number): number {
  let h = Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663);
  h ^= h >>> 13;
  h = Math.imul(h, 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Trägt die Kachel grundsätzlich einen Knoten dieses Terrains? Wald-Kachel (mit
 * sparse Overrides), unbebaut und vom Dichte-Hash ausgewählt. Rein deterministisch.
 */
export function isNodeTile(state: GameState, nodeTerrain: string, x: number, y: number): boolean {
  if (worldTerrainAt(state, x, y) !== nodeTerrain) return false;
  if (tileAt(state, x, y)?.buildingId) return false; // nicht unter Gebäuden (§26.15)
  return hash01(x, y) < TREE_DENSITY;
}

/**
 * Löst einen Knoten aus seiner Id auf: `undefined`, wenn die Kachel (mehr) keinen
 * Knoten trägt (Terrain geändert, überbaut). Sonst Laufzeitzustand aus Delta.
 */
export function resolveNode(state: GameState, nodeTerrain: string, id: string, now: number): ResourceNode | undefined {
  const pos = parseNodeId(id);
  if (!pos) return undefined;
  if (!isNodeTile(state, nodeTerrain, pos.x, pos.y)) return undefined;
  const delta = state.operations?.nodeDeltas[id];
  const base: ResourceNode = {
    id,
    type: 'tree',
    x: pos.x,
    y: pos.y,
    resource: 'wood',
    state: 'available',
    remainingAmount: TREE_MAX_AMOUNT,
    maxAmount: TREE_MAX_AMOUNT,
  };
  if (!delta) return base;
  // Erschöpft & noch nicht nachgewachsen → regrowing.
  if (delta.regenerationAt !== undefined) {
    if (now < delta.regenerationAt) {
      return { ...base, state: 'regrowing', remainingAmount: 0, regenerationAt: delta.regenerationAt };
    }
    return base; // nachgewachsen → wieder voll verfügbar
  }
  const remaining = delta.remaining ?? TREE_MAX_AMOUNT;
  if (remaining <= 0) return { ...base, state: 'depleted', remainingAmount: 0 };
  return {
    ...base,
    remainingAmount: remaining,
    state: delta.reservedBy ? 'reserved' : 'available',
    ...(delta.reservedBy ? { reservedBy: delta.reservedBy } : {}),
  };
}

/**
 * Alle Knoten in einem Rechteck (inklusive Grenzen), aufgelöst zu ihrem
 * Laufzeitzustand. Nur auf Anforderung aufgerufen (Vorschau/Auswahl), nie pro
 * Tick — der Tick arbeitet ausschließlich mit bereits gewählten Knoten-Ids.
 */
export function deriveNodesInArea(
  state: GameState,
  nodeTerrain: string,
  area: { minX: number; minY: number; maxX: number; maxY: number },
  now: number,
): ResourceNode[] {
  const nodes: ResourceNode[] = [];
  for (let y = area.minY; y <= area.maxY; y++) {
    for (let x = area.minX; x <= area.maxX; x++) {
      if (!isNodeTile(state, nodeTerrain, x, y)) continue;
      const node = resolveNode(state, nodeTerrain, nodeIdOf(x, y), now);
      if (node) nodes.push(node);
    }
  }
  return nodes;
}

/** Terrain der Kachel ohne State-Zugriff (für Kandidaten-Checks außerhalb). */
export function baseTerrainAt(x: number, y: number): string {
  return terrainAt(x, y);
}
