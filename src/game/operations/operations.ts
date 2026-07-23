// Aktives Betriebssystem (§ Active Operations 2.0, Phasen A2/A4). Reine
// Simulation — kein Renderer/React (CLAUDE.md §1). Ein Betrieb mit
// `BuildingDef.operation` erzeugt seine Ressource NICHT passiv, sondern über
// Arbeiter, die markierte Ressourcenknoten bearbeiten und die Ware ins lokale
// Betriebslager tragen. Ein volles Lager stoppt die Arbeit nachvollziehbar.
// Zeitfaktor/Pause skalieren automatisch, weil derselbe `dtMin`-Pfad wie die
// übrige Live-Ökonomie benutzt wird. Details: docs/agents/ACTIVE_OPERATIONS_PLAN.md.

import type { GameConfig } from '../config/index.ts';
import type { BuildingDef, BuildingOperationProfile, BuildingOperationStage } from '../config/types.ts';
import type {
  ActiveBuildingOperation,
  BuildingInstance,
  BuildingInventory,
  BuildingWorkerState,
  GameState,
  OperationsState,
  ResourceId,
} from '../types.ts';
import { centerOf, chebyshev } from '../buildings/effects.ts';
import { locationBonusPct } from '../buildings/location.ts';
import { regionProductionFactorAt } from '../map/world.ts';
import { newId } from '../engine/rng.ts';
import { nodeIdOf, parseNodeId, resolveNode, TREE_REGEN_MS, type ResourceNode } from './nodes.ts';

/** Effizienz-Untergrenze am Rand der maximalen Reichweite (§6). */
const MIN_RANGE_EFFICIENCY = 0.55;
/** Obergrenze pro Auftrag automatisch gewählter Knoten (Klickspam-Schutz, §16). */
export const MAX_OPERATION_NODES = 60;

// ---- State-Zugriff ---------------------------------------------------------

export function ensureOperationsState(state: GameState): OperationsState {
  if (!state.operations) {
    state.operations = { inventories: {}, workers: {}, active: {}, nodeDeltas: {}, transfers: {} };
  }
  return state.operations;
}

/** Ist das Gebäude ein aktiver Betrieb (hat ein Operationsprofil)? */
export function isActiveOperationBuilding(def: BuildingDef | undefined): def is BuildingDef & { operation: BuildingOperationProfile } {
  return !!def?.operation;
}

/** Betriebswerte der aktuellen Ausbaustufe (letzter Eintrag als Fallback). */
export function operationStage(profile: BuildingOperationProfile, upgradeLevel: number): BuildingOperationStage {
  return profile.stages[Math.min(upgradeLevel, profile.stages.length - 1)]!;
}

export function ensureInventory(state: GameState, buildingId: string, capacity: number): BuildingInventory {
  const ops = ensureOperationsState(state);
  let inv = ops.inventories[buildingId];
  if (!inv) {
    inv = { capacity, items: {}, reserved: {} };
    ops.inventories[buildingId] = inv;
  } else if (inv.capacity !== capacity) {
    inv.capacity = capacity; // Ausbaustufe hat das Lager vergrößert
  }
  return inv;
}

export function getInventory(state: GameState, buildingId: string): BuildingInventory | undefined {
  return state.operations?.inventories[buildingId];
}

/** Belegte Menge einer Ressource im lokalen Lager. */
export function inventoryAmount(inv: BuildingInventory | undefined, resource: ResourceId): number {
  return inv?.items[resource] ?? 0;
}

/** Insgesamt belegter Lagerplatz (alle Ressourcen). */
export function inventoryUsed(inv: BuildingInventory | undefined): number {
  if (!inv) return 0;
  let sum = 0;
  for (const v of Object.values(inv.items)) sum += v ?? 0;
  return sum;
}

export function inventoryFree(inv: BuildingInventory | undefined): number {
  if (!inv) return 0;
  return Math.max(0, inv.capacity - inventoryUsed(inv));
}

// ---- Arbeitsgebiet & Knotenauswahl ----------------------------------------

/** Chebyshev-Rechteck um die Grundfläche eines Betriebs. */
export function workAreaBounds(def: BuildingDef, b: BuildingInstance, radius: number): { minX: number; minY: number; maxX: number; maxY: number } {
  return {
    minX: b.x - radius,
    minY: b.y - radius,
    maxX: b.x + def.size.w - 1 + radius,
    maxY: b.y + def.size.h - 1 + radius,
  };
}

/** Alle Knoten im Arbeitsgebiet eines Betriebs (aufgelöst). */
export function nodesInWorkArea(state: GameState, def: BuildingDef, b: BuildingInstance, radius: number, now: number): ResourceNode[] {
  const profile = def.operation;
  if (!profile) return [];
  const bounds = workAreaBounds(def, b, radius);
  const nodes: ResourceNode[] = [];
  for (let y = bounds.minY; y <= bounds.maxY; y++) {
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      const node = resolveNode(state, profile.nodeTerrain, nodeIdOf(x, y), now);
      if (node) nodes.push(node);
    }
  }
  return nodes;
}

/**
 * Verfügbare Knoten (nicht erschöpft/nachwachsend/fremdreserviert), nach
 * Entfernung zur Grundfläche sortiert. Für die automatische Gebiets-Auswahl.
 */
export function availableWorkNodes(state: GameState, def: BuildingDef, b: BuildingInstance, radius: number, now: number): ResourceNode[] {
  const { cx, cy } = centerOf(def, b);
  return nodesInWorkArea(state, def, b, radius, now)
    .filter((n) => n.state === 'available')
    .sort((a, c) => chebyshev(cx, cy, a.x, a.y) - chebyshev(cx, cy, c.x, c.y));
}

/** Node-Ids einer automatischen Gebiets-Auswahl (§26.3 Arbeitsgebiet). */
export function selectAreaNodeIds(state: GameState, def: BuildingDef, b: BuildingInstance, radius: number, maxCount: number, now: number): string[] {
  return availableWorkNodes(state, def, b, radius, now)
    .slice(0, Math.min(maxCount, MAX_OPERATION_NODES))
    .map((n) => n.id);
}

// ---- Standort-/Wegeffizienz (§6) ------------------------------------------

/** Terrain-/Regionsgüte des Standorts als Tempo-Multiplikator (>1 bei gutem Wald). */
function siteQuality(state: GameState, config: GameConfig, def: BuildingDef, b: BuildingInstance, resource: ResourceId): number {
  const bonus = locationBonusPct(state, def, b.x, b.y) + (regionProductionFactorAt(config, b.x, b.y, resource) - 1) * 100;
  return 1 + bonus / 200; // gedeckelt weich: +50 % Bonus ⇒ ×1.25 Tempo
}

/** Wegeffizienz eines Knotens: volle Leistung im effizienten Gebiet, sonst weniger. */
function rangeEfficiency(profile: BuildingOperationProfile, dist: number): number {
  if (dist <= profile.efficientRadius) return 1;
  const span = Math.max(1, profile.maxRadius - profile.efficientRadius);
  const t = Math.min(1, (dist - profile.efficientRadius) / span);
  return 1 - (1 - MIN_RANGE_EFFICIENCY) * t;
}

// ---- Arbeiter --------------------------------------------------------------

function ensureWorkers(state: GameState, b: BuildingInstance, slots: number, cx: number, cy: number): BuildingWorkerState[] {
  const ops = ensureOperationsState(state);
  let workers = ops.workers[b.id];
  if (!workers) {
    workers = [];
    ops.workers[b.id] = workers;
  }
  while (workers.length < slots) {
    workers.push({ id: newId(state, 'w'), status: 'idle', carriedAmount: 0, progress: 0, x: cx, y: cy });
  }
  if (workers.length > slots) workers.length = slots;
  return workers;
}

/** Eindeutiges Reservierungs-Tag eines Arbeiters. */
function workerTag(buildingId: string, workerId: string): string {
  return `${buildingId}#${workerId}`;
}

function releaseReservation(ops: OperationsState, nodeId: string, tag: string): void {
  const delta = ops.nodeDeltas[nodeId];
  if (delta?.reservedBy === tag) {
    delete delta.reservedBy;
    if (delta.remaining === undefined && delta.regenerationAt === undefined) delete ops.nodeDeltas[nodeId];
  }
}

/** Nächsten bearbeitbaren Knoten der Auftragswarteschlange beanspruchen. */
function claimNode(
  state: GameState,
  ops: OperationsState,
  op: ActiveBuildingOperation,
  profile: BuildingOperationProfile,
  tag: string,
  now: number,
): ResourceNode | undefined {
  for (const id of op.targetNodeIds) {
    const node = resolveNode(state, profile.nodeTerrain, id, now);
    if (!node || node.remainingAmount <= 0) continue;
    if (node.state === 'regrowing' || node.state === 'depleted') continue;
    const delta = ops.nodeDeltas[id];
    if (delta?.reservedBy && delta.reservedBy !== tag) continue;
    const nextDelta = ops.nodeDeltas[id] ?? {};
    nextDelta.reservedBy = tag;
    if (nextDelta.remaining === undefined) nextDelta.remaining = node.remainingAmount;
    ops.nodeDeltas[id] = nextDelta;
    return node;
  }
  return undefined;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

// ---- Tick ------------------------------------------------------------------

/**
 * Ein Simulationsschritt aller aktiven Betriebe. Läuft NUR im Live-Tick (nie
 * offline). `dtMin` ist bereits mit dem Zeitfaktor skaliert, deshalb steuern
 * Pause/1×/2×/4× die Arbeit automatisch korrekt (§26.22/23).
 */
export function advanceOperations(state: GameState, config: GameConfig, dtMin: number, now: number): void {
  const ops = state.operations;
  if (!ops) return;
  for (const op of Object.values(ops.active)) {
    const b = state.buildings[op.buildingId];
    const def = b && config.buildings.get(b.defId);
    if (!b || !def?.operation || b.status !== 'active') continue;
    if (op.status === 'paused') continue;
    advanceBuildingOperation(state, config, ops, op, b, def, def.operation, dtMin, now);
  }
  regenerateNodes(ops, now);
}

function advanceBuildingOperation(
  state: GameState,
  config: GameConfig,
  ops: OperationsState,
  op: ActiveBuildingOperation,
  b: BuildingInstance,
  def: BuildingDef,
  profile: BuildingOperationProfile,
  dtMin: number,
  now: number,
): void {
  const stage = operationStage(profile, b.upgradeLevel);
  const { cx, cy } = centerOf(def, b);
  const inv = ensureInventory(state, b.id, stage.storageCapacity);
  const quality = siteQuality(state, config, def, b, profile.resource);
  const workers = ensureWorkers(state, b, stage.workerSlots, cx, cy);

  for (const w of workers) {
    const target = w.targetNodeId ? parseNodeId(w.targetNodeId) : undefined;
    const dist = target ? Math.max(1, chebyshev(cx, cy, target.x, target.y)) : 1;
    const eff = target ? rangeEfficiency(profile, dist) : 1;
    const moveStep = (stage.movementSpeed * quality * eff * dtMin) / dist;

    switch (w.status) {
      case 'idle':
      case 'waiting': {
        // Volles Lager → nicht neu anfangen (§26.8: nachvollziehbarer Stopp).
        if (inventoryFree(inv) <= 0) {
          w.status = 'waiting';
          break;
        }
        const node = claimNode(state, ops, op, profile, workerTag(b.id, w.id), now);
        if (!node) {
          w.status = 'idle';
          break;
        }
        w.targetNodeId = node.id;
        w.status = 'walking_to_target';
        w.progress = 0;
        w.x = cx;
        w.y = cy;
        break;
      }
      case 'walking_to_target': {
        if (!target) { w.status = 'idle'; break; }
        w.progress = Math.min(1, w.progress + moveStep);
        w.x = lerp(cx, target.x, w.progress);
        w.y = lerp(cy, target.y, w.progress);
        if (w.progress >= 1) { w.status = 'working'; w.progress = 0; w.x = target.x; w.y = target.y; }
        break;
      }
      case 'working': {
        const node = w.targetNodeId ? resolveNode(state, profile.nodeTerrain, w.targetNodeId, now) : undefined;
        if (!node || node.remainingAmount <= 0) {
          // Knoten weg/erschöpft: mit dem, was getragen wird, zurückkehren.
          w.status = w.carriedAmount > 0 ? 'returning' : 'idle';
          w.progress = 0;
          if (w.status === 'idle' && w.targetNodeId) { releaseReservation(ops, w.targetNodeId, workerTag(b.id, w.id)); delete w.targetNodeId; }
          break;
        }
        const capLeft = stage.carryCapacity - w.carriedAmount;
        const cut = Math.min(capLeft, node.remainingAmount, stage.workSpeed * quality * dtMin);
        w.carriedAmount += cut;
        const delta = ops.nodeDeltas[node.id] ?? {};
        delta.remaining = Math.max(0, node.remainingAmount - cut);
        delta.reservedBy = workerTag(b.id, w.id);
        ops.nodeDeltas[node.id] = delta;
        w.progress = Math.min(1, w.carriedAmount / stage.carryCapacity);
        if (delta.remaining <= 0) {
          // Baum gefällt → erschöpft, Nachwachsen terminieren, Reservierung lösen.
          delta.remaining = 0;
          delta.depletedAt = now;
          delta.regenerationAt = now + TREE_REGEN_MS;
          delete delta.reservedBy;
        }
        if (w.carriedAmount >= stage.carryCapacity || (delta.remaining ?? 0) <= 0) {
          w.status = 'returning';
          w.progress = 0;
        }
        break;
      }
      case 'returning':
      case 'blocked': {
        // Zurücklaufen; bei 'blocked' steht der Arbeiter schon am Betrieb.
        if (w.status === 'returning') {
          if (!target) { w.status = 'blocked'; w.x = cx; w.y = cy; break; }
          w.progress = Math.min(1, w.progress + moveStep);
          w.x = lerp(target.x, cx, w.progress);
          w.y = lerp(target.y, cy, w.progress);
          if (w.progress < 1) break;
          w.x = cx; w.y = cy;
        }
        // Am Betrieb: einlagern, soweit Platz ist (§23: erst bei Einlagerung gutschreiben).
        const free = inventoryFree(inv);
        const deposit = Math.min(w.carriedAmount, free);
        if (deposit > 0) {
          inv.items[profile.resource] = (inv.items[profile.resource] ?? 0) + deposit;
          w.carriedAmount -= deposit;
          state.stats.produced[profile.resource] = (state.stats.produced[profile.resource] ?? 0) + deposit;
        }
        if (w.carriedAmount > 0) {
          w.status = 'blocked'; // Lager voll — hält die Restladung (§26.8)
        } else {
          if (w.targetNodeId) { releaseReservation(ops, w.targetNodeId, workerTag(b.id, w.id)); delete w.targetNodeId; }
          w.status = 'idle';
          w.progress = 0;
        }
        break;
      }
    }
  }

  // Auftrag automatisch abschließen, wenn keine bearbeitbaren Knoten mehr da sind
  // und kein Arbeiter mehr etwas trägt oder unterwegs ist.
  const anyWorkable = op.targetNodeIds.some((id) => {
    const node = resolveNode(state, profile.nodeTerrain, id, now);
    return node && node.remainingAmount > 0 && node.state !== 'regrowing' && node.state !== 'depleted';
  });
  const anyBusy = workers.some((w) => w.status !== 'idle' && w.status !== 'waiting');
  if (!anyWorkable && !anyBusy) {
    for (const w of workers) {
      if (w.targetNodeId) releaseReservation(ops, w.targetNodeId, workerTag(b.id, w.id));
      delete w.targetNodeId;
      w.status = 'idle';
      w.progress = 0;
      w.x = cx;
      w.y = cy;
    }
    delete ops.active[b.id];
  }
}

/** Nachgewachsene Knoten aufräumen (Delta entfernen ⇒ wieder voll verfügbar). */
function regenerateNodes(ops: OperationsState, now: number): void {
  for (const [id, delta] of Object.entries(ops.nodeDeltas)) {
    if (delta.regenerationAt !== undefined && now >= delta.regenerationAt && !delta.reservedBy) {
      delete ops.nodeDeltas[id];
    }
  }
}

// ---- Commands (vom Controller aufgerufen) ----------------------------------

/** Startet/ersetzt den Auftrag eines Betriebs mit einer Knotenauswahl. */
export function startOperation(state: GameState, buildingId: string, nodeIds: string[], now: number): ActiveBuildingOperation {
  const ops = ensureOperationsState(state);
  // Alte Reservierungen dieses Betriebs freigeben, bevor neu gesetzt wird.
  cancelOperation(state, buildingId);
  const op: ActiveBuildingOperation = {
    buildingId,
    type: 'harvest',
    status: 'active',
    targetNodeIds: [...new Set(nodeIds)].slice(0, MAX_OPERATION_NODES),
    startedAt: now,
  };
  ops.active[buildingId] = op;
  return op;
}

/** Bricht den Auftrag ab und gibt alle Reservierungen frei (§23 Abbruch). */
export function cancelOperation(state: GameState, buildingId: string): void {
  const ops = state.operations;
  if (!ops) return;
  const workers = ops.workers[buildingId] ?? [];
  for (const w of workers) {
    if (w.targetNodeId) releaseReservation(ops, w.targetNodeId, workerTag(buildingId, w.id));
    delete w.targetNodeId;
    w.status = 'idle';
    w.carriedAmount = 0;
    w.progress = 0;
  }
  // Verbleibende Reservierungen dieses Betriebs (Sicherheit) lösen.
  const prefix = `${buildingId}#`;
  for (const [id, delta] of Object.entries(ops.nodeDeltas)) {
    if (delta.reservedBy?.startsWith(prefix)) {
      delete delta.reservedBy;
      if (delta.remaining === undefined && delta.regenerationAt === undefined) delete ops.nodeDeltas[id];
    }
  }
  delete ops.active[buildingId];
}

export function setOperationPaused(state: GameState, buildingId: string, paused: boolean): boolean {
  const op = state.operations?.active[buildingId];
  if (!op) return false;
  op.status = paused ? 'paused' : 'active';
  return true;
}

// ---- Vorschau (Read-Model für die UI) -------------------------------------

export interface OperationPreview {
  validTargetIds: string[];
  invalidTargetIds: string[];
  /** Erwarteter Roh-Ertrag der Auswahl (Summe verbleibender Mengen). */
  expectedYield: number;
  requiredWorkers: number;
  travelDistanceAvg: number;
  expectedDurationSec: number;
  storageFree: number;
  storageAfter: number;
  /** i18n-Schlüssel echter Warnungen (nie erfundene Platzhalter). */
  warnings: string[];
}

export function previewOperation(state: GameState, config: GameConfig, b: BuildingInstance, nodeIds: string[], now: number): OperationPreview | undefined {
  const def = config.buildings.get(b.defId);
  if (!def?.operation) return undefined;
  const profile = def.operation;
  const stage = operationStage(profile, b.upgradeLevel);
  const { cx, cy } = centerOf(def, b);
  const validTargetIds: string[] = [];
  const invalidTargetIds: string[] = [];
  let yieldSum = 0;
  let distSum = 0;
  for (const id of nodeIds) {
    const node = resolveNode(state, profile.nodeTerrain, id, now);
    const dist = parseNodeId(id);
    if (!node || node.remainingAmount <= 0 || node.state === 'regrowing' || node.state === 'depleted' || (dist && chebyshev(cx, cy, dist.x, dist.y) > profile.maxRadius)) {
      invalidTargetIds.push(id);
      continue;
    }
    validTargetIds.push(id);
    yieldSum += node.remainingAmount;
    if (dist) distSum += chebyshev(cx, cy, dist.x, dist.y);
  }
  const inv = getInventory(state, b.id);
  const storageFree = inv ? inventoryFree(inv) : stage.storageCapacity - inventoryUsed(inv);
  const avgDist = validTargetIds.length > 0 ? distSum / validTargetIds.length : 0;
  const collectible = Math.min(yieldSum, storageFree);
  const quality = siteQuality(state, config, def, b, profile.resource);
  // Grobe Dauer: Ladezyklen ÷ Arbeiter, Zyklus = Fällen + Hin-/Rückweg.
  const loads = stage.carryCapacity > 0 ? Math.ceil(collectible / stage.carryCapacity) : 0;
  const cycleMin = stage.carryCapacity / (stage.workSpeed * quality) + (2 * avgDist) / (stage.movementSpeed * quality);
  const durationMin = stage.workerSlots > 0 ? (loads * cycleMin) / stage.workerSlots : 0;
  const warnings: string[] = [];
  if (yieldSum > storageFree && storageFree >= 0) warnings.push('ui.operation.warn_storage');
  if (validTargetIds.length === 0) warnings.push('ui.operation.warn_no_targets');
  return {
    validTargetIds,
    invalidTargetIds,
    expectedYield: Math.round(yieldSum),
    requiredWorkers: stage.workerSlots,
    travelDistanceAvg: Math.round(avgDist * 10) / 10,
    expectedDurationSec: Math.round(durationMin * 60),
    storageFree: Math.round(storageFree),
    storageAfter: Math.round(Math.min((inv?.capacity ?? stage.storageCapacity), inventoryUsed(inv) + collectible)),
    warnings,
  };
}

// ---- Read-Model für den Renderer ------------------------------------------

export interface WorkerRenderState {
  id: string;
  buildingId: string;
  /** Tile-Position (kann fraktional sein). */
  x: number;
  y: number;
  status: BuildingWorkerState['status'];
  /** Getragene Menge relativ zur Traglast (0..1). */
  carriedRatio: number;
}

/** Alle sichtbaren Arbeiter aktiver Betriebe (additive Renderer-Darstellung). */
export function workerRenderStates(state: GameState, config: GameConfig): WorkerRenderState[] {
  const ops = state.operations;
  if (!ops) return [];
  const out: WorkerRenderState[] = [];
  for (const [buildingId, workers] of Object.entries(ops.workers)) {
    const b = state.buildings[buildingId];
    const def = b && config.buildings.get(b.defId);
    if (!b || !def?.operation) continue;
    const stage = operationStage(def.operation, b.upgradeLevel);
    for (const w of workers) {
      if (w.status === 'idle' || w.status === 'waiting') continue; // im Betrieb, nicht sichtbar
      out.push({
        id: w.id,
        buildingId,
        x: w.x,
        y: w.y,
        status: w.status,
        carriedRatio: stage.carryCapacity > 0 ? Math.min(1, w.carriedAmount / stage.carryCapacity) : 0,
      });
    }
  }
  return out;
}
