// Lagertransport (§ Active Operations 2.0, Phase A5 + A5-Reste). Reine
// Simulation — kein Renderer/React (CLAUDE.md §1). Ein Betrieb füllt sein lokales
// Lager (operations.ts); dieser Modul bringt die Ware manuell in ein Zielgebäude
// mit Lagerkapazität (Rathaus/Lagerhaus = Zentrallager). ERST mit der Einlagerung
// am Ziel wird sie netzwerkweit/global verfügbar (§7.2). Es entsteht KEIN zweites
// Logistiksystem: Route/Distanz/Verkehr kommen aus `routeAnalysis.ts`, Kapazität/
// Fahrzeugdaten aus `logistics.ts` (§8).
//
// A5-Reste: Ein Transport darf mehr als eine Fahrzeugladung umfassen — das
// Fahrzeug pendelt dann in Nachfüllfahrten (Rückweg leer) zwischen Quelle und
// Ziel. Jede tatsächlich gefahrene Ladung kostet die Fahrzeug-Betriebskosten
// (Geldsenke, §15). Ein laufender Transport lässt sich jederzeit zurückrufen; die
// bereits verladene Restladung kehrt ins Quell-Lager zurück. Zeitfaktor/Pause
// skalieren automatisch (derselbe `dtMin`-Pfad). Details:
// docs/agents/LOGISTICS_INTEGRATION.md.

import type { GameConfig } from '../config/index.ts';
import type { ActivityVehicleDef } from '../config/types.ts';
import type { Derived } from '../simulation/derived.ts';
import type { DriveVehicle, GameState, InventoryTransfer, ResourceId } from '../types.ts';
import { effectiveEffects, isContributing } from '../buildings/effects.ts';
import { newId } from '../engine/rng.ts';
import { analyseActivityRouteFrom, buildingCenter } from '../activities/routeAnalysis.ts';
import { vehicleCapacity } from '../activities/logistics.ts';
import { ensureOperationsState, getInventory, inventoryAmount, inventoryFree } from './operations.ts';
import { isCityStorageBuilding } from '../economy/stockLedger.ts';

/** Untergrenze der reinen Fahrdauer, damit auch kurze Strecken kurz „fahren". */
const MIN_TRAVEL_MS = 1_500;
/** Standard-Ladezeit an der Quelle (s), falls das Fahrzeug keine definiert. */
const DEFAULT_LOAD_SEC = 8;
/** Standard-Entladezeit am Ziel (s), falls das Fahrzeug keine definiert. */
const DEFAULT_UNLOAD_SEC = 5;

// ---- State-Zugriff ---------------------------------------------------------

export function ensureTransfers(state: GameState): Record<string, InventoryTransfer> {
  const ops = ensureOperationsState(state);
  if (!ops.transfers) ops.transfers = {};
  return ops.transfers;
}

const deliveredOf = (t: InventoryTransfer): number => t.delivered ?? 0;
const onboardOf = (t: InventoryTransfer): number => t.onboard ?? 0;
/** Noch im Quell-Lager reservierte, aber unverladene Restmenge des Transports. */
const atSourceOf = (t: InventoryTransfer): number => Math.max(0, t.amount - deliveredOf(t) - onboardOf(t));

/** Bereits für Transporte gebundene Menge einer Ressource im lokalen Lager. */
export function reservedAmount(state: GameState, buildingId: string, resource: ResourceId): number {
  return getInventory(state, buildingId)?.reserved[resource] ?? 0;
}

/** Frei verfügbare (nicht reservierte) Menge im lokalen Lager. */
export function availableForTransfer(state: GameState, buildingId: string, resource: ResourceId): number {
  const inv = getInventory(state, buildingId);
  if (!inv) return 0;
  return Math.max(0, inventoryAmount(inv, resource) - (inv.reserved[resource] ?? 0));
}

function vehicleDef(config: GameConfig, vehicleId: DriveVehicle | undefined): ActivityVehicleDef | undefined {
  if (!vehicleId) return undefined;
  return config.activities.vehicles.find((v) => v.id === vehicleId);
}

// ---- Ziele -----------------------------------------------------------------

export interface TransferTarget {
  buildingId: string;
  defId: string;
  nameKey: string;
  x: number;
  y: number;
}

/**
 * Mögliche Transportziele: aktive Gebäude mit Lagerkapazität (Rathaus,
 * Distriktzentrum, Lagerhäuser) außer der Quelle selbst. Die Einlagerung
 * schreibt in den globalen/zentralen Pool (`state.resources`), der von genau
 * diesen Gebäuden gedeckelt wird — das Ziel ist der physische Anlieferpunkt.
 */
export function transferTargets(state: GameState, config: GameConfig, sourceId: string, resource: ResourceId): TransferTarget[] {
  const out: TransferTarget[] = [];
  for (const b of Object.values(state.buildings)) {
    if (b.id === sourceId || !isContributing(b)) continue;
    const def = config.buildings.get(b.defId);
    if (!def) continue;
    const storesResource = effectiveEffects(def, b.upgradeLevel).some(
      (e) => e.type === 'storage' && e.resource === resource,
    );
    if (!storesResource) continue;
    const center = buildingCenter(state, config, b.id) ?? { x: b.x, y: b.y };
    out.push({ buildingId: b.id, defId: def.id, nameKey: def.nameKey, x: center.x, y: center.y });
  }
  return out;
}

// ---- Erstellung ------------------------------------------------------------

export type TransferError = 'invalid' | 'no_vehicle' | 'no_cargo' | 'no_target' | 'no_route';

export interface CreateTransferInput {
  sourceBuildingId: string;
  targetBuildingId: string;
  resource: ResourceId;
  /** Gewünschte Menge; wird auf verfügbar gedeckelt (mehrere Ladungen erlaubt). */
  amount: number;
  vehicleId?: DriveVehicle;
}

/**
 * Reine Routen-/Dauerberechnung eines Transports (Anzeige + Erstellung nutzen
 * dasselbe Ergebnis). `undefined`, wenn Quelle/Ziel nicht auflösbar sind.
 */
export function transferRoute(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  sourceId: string,
  targetId: string,
  vehicleId: DriveVehicle | undefined,
): { travelMs: number; distanceTiles: number; roadCoverage: number; path: { x: number; y: number }[] } | undefined {
  const source = buildingCenter(state, config, sourceId);
  if (!source) return undefined;
  const route = analyseActivityRouteFrom(state, config, derived, { id: sourceId, ...source }, [targetId]);
  if (!route) return undefined;
  const vehicle = vehicleDef(config, vehicleId);
  const speedFactor = vehicle && vehicle.speedKph > 0 ? 60 / vehicle.speedKph : 1;
  const travelMs = Math.max(MIN_TRAVEL_MS, Math.round(route.estimatedDurationMs * speedFactor));
  const path = route.segments.flatMap((s) => s.path);
  return { travelMs, distanceTiles: Math.round(route.distanceTiles * 10) / 10, roadCoverage: route.roadCoverage, path };
}

export interface TransferPreview {
  amount: number;
  capacity: number;
  /** Nötige Fahrzeugladungen (Nachfüllfahrten). */
  loads: number;
  distanceTiles: number;
  roadCoverage: number;
  travelSec: number;
  loadSec: number;
  unloadSec: number;
  /** Gesamtdauer inkl. Nachfüll-Rückfahrten. */
  totalSec: number;
  /** Erwartete Betriebskosten (Geld) für alle Fahrten zusammen. */
  operatingCost: number;
  warnings: string[];
}

function loadCount(amount: number, capacity: number): number {
  return capacity > 0 ? Math.max(0, Math.ceil(amount / capacity)) : 0;
}

/** Vorschau eines geplanten Transports (echte Zahlen, keine Platzhalter). */
export function previewTransfer(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  input: CreateTransferInput,
): TransferPreview | undefined {
  const route = transferRoute(state, config, derived, input.sourceBuildingId, input.targetBuildingId, input.vehicleId);
  if (!route) return undefined;
  const vehicle = vehicleDef(config, input.vehicleId);
  const capacity = vehicleCapacity(config, input.vehicleId);
  const available = availableForTransfer(state, input.sourceBuildingId, input.resource);
  const amount = Math.floor(Math.max(0, Math.min(input.amount, available)));
  const loads = loadCount(amount, capacity);
  const loadSec = vehicle?.loadTimeSec ?? DEFAULT_LOAD_SEC;
  const unloadSec = vehicle?.unloadTimeSecPerTarget ?? DEFAULT_UNLOAD_SEC;
  const travelSec = Math.round(route.travelMs / 1000);
  // Pro Ladung: laden + hinfahren + entladen; jede weitere Ladung zusätzlich eine
  // leere Rückfahrt.
  const totalSec = loads * (loadSec + travelSec + unloadSec) + Math.max(0, loads - 1) * travelSec;
  const operatingCost = Math.round((vehicle?.operatingCost ?? 0) * loads);
  const warnings: string[] = [];
  if (capacity <= 0) warnings.push('ui.transport.warn_no_vehicle');
  if (available <= 0) warnings.push('ui.transport.warn_no_cargo');
  if (route.roadCoverage < 1) warnings.push('ui.transport.warn_incomplete_road');
  if (loads > 1) warnings.push('ui.transport.warn_multiple_loads');
  return {
    amount,
    capacity,
    loads,
    distanceTiles: route.distanceTiles,
    roadCoverage: route.roadCoverage,
    travelSec,
    loadSec,
    unloadSec,
    totalSec,
    operatingCost,
    warnings,
  };
}

/**
 * Legt einen Transport an: prüft Quelle/Ziel/Fahrzeug, RESERVIERT die gesamte
 * Ladung im Quell-Lager (§7.1 — sie bleibt physisch da, bis das Fahrzeug sie
 * verlädt) und fixiert Route/Dauer. Die Ware verlässt das Quell-Lager ladungsweise
 * (`loading → in_transit`) und erscheint am Ziel bei `unloading → delivered`.
 */
export function createInventoryTransfer(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  input: CreateTransferInput,
  now: number,
): InventoryTransfer | TransferError {
  const source = state.buildings[input.sourceBuildingId];
  const sourceDef = source && config.buildings.get(source.defId);
  if (!source || !sourceDef?.operation || source.status !== 'active') return 'invalid';
  const target = state.buildings[input.targetBuildingId];
  if (!target || target.id === source.id || !isContributing(target)) return 'no_target';
  const targetDef = config.buildings.get(target.defId);
  const targetStores = targetDef
    ? effectiveEffects(targetDef, target.upgradeLevel).some((e) => e.type === 'storage' && e.resource === input.resource)
    : false;
  if (!targetStores) return 'no_target';

  const capacity = vehicleCapacity(config, input.vehicleId);
  if (capacity <= 0) return 'no_vehicle';
  const available = availableForTransfer(state, input.sourceBuildingId, input.resource);
  const amount = Math.floor(Math.max(0, Math.min(input.amount, available)));
  if (amount <= 0) return 'no_cargo';

  const route = transferRoute(state, config, derived, input.sourceBuildingId, input.targetBuildingId, input.vehicleId);
  if (!route) return 'no_route';

  const inv = getInventory(state, input.sourceBuildingId);
  if (!inv) return 'no_cargo';
  inv.reserved[input.resource] = (inv.reserved[input.resource] ?? 0) + amount;

  const transfers = ensureTransfers(state);
  const transfer: InventoryTransfer = {
    id: newId(state, 'tr'),
    sourceBuildingId: input.sourceBuildingId,
    targetBuildingId: input.targetBuildingId,
    resource: input.resource,
    amount,
    delivered: 0,
    onboard: 0,
    ...(input.vehicleId ? { vehicleId: input.vehicleId } : {}),
    status: 'loading',
    progress: 0,
    startedAt: now,
    travelMs: route.travelMs,
    distanceTiles: route.distanceTiles,
  };
  transfers[transfer.id] = transfer;
  return transfer;
}

/**
 * Ruft einen laufenden Transport zurück. Die noch nicht verladene reservierte
 * Restmenge wird freigegeben; eine bereits auf dem Fahrzeug befindliche Ladung
 * kehrt — soweit Platz ist — ins Quell-Lager zurück (keine erfundene
 * Teleport-Rückgabe: passt sie nicht mehr ins volle Lager, verfällt der Rest wie
 * überschüssige Produktion). Bereits eingelagerte Teilmengen bleiben global.
 */
export function cancelInventoryTransfer(state: GameState, transferId: string): boolean {
  const transfers = state.operations?.transfers;
  const transfer = transfers?.[transferId];
  if (!transfer || transfer.status === 'delivered') return false;
  const inv = getInventory(state, transfer.sourceBuildingId);
  // Reservierung der unverladenen Restmenge lösen.
  releaseReservation(state, transfer, atSourceOf(transfer));
  // Verladene Ladung zurückgeben (gedeckelt durch freien Lagerplatz).
  const onboard = onboardOf(transfer);
  if (inv && onboard > 0) {
    const back = Math.min(onboard, inventoryFree(inv));
    if (back > 0) inv.items[transfer.resource] = (inv.items[transfer.resource] ?? 0) + back;
  }
  delete transfers![transferId];
  return true;
}

/** Löst `amount` der Quell-Reservierung dieses Transports. */
function releaseReservation(state: GameState, transfer: InventoryTransfer, amount: number): void {
  if (amount <= 0) return;
  const inv = getInventory(state, transfer.sourceBuildingId);
  if (!inv) return;
  const next = Math.max(0, (inv.reserved[transfer.resource] ?? 0) - amount);
  if (next <= 0) delete inv.reserved[transfer.resource];
  else inv.reserved[transfer.resource] = next;
}

// ---- Tick ------------------------------------------------------------------

/**
 * Ein Simulationsschritt aller laufenden Transporte. Läuft NUR im Live-Tick
 * (nie offline). `dtMin` ist bereits zeitfaktor-skaliert → Pause/1×/2×/4× wirken
 * automatisch. `derived.storageCaps` deckelt die Einlagerung am Ziel; Überschuss
 * über der Kapazität verfällt wie bei der übrigen Produktion.
 */
export function advanceTransfers(state: GameState, config: GameConfig, derived: Derived, dtMin: number): void {
  const transfers = state.operations?.transfers;
  if (!transfers) return;
  const dtMs = dtMin * 60_000;
  for (const transfer of Object.values(transfers)) {
    const source = state.buildings[transfer.sourceBuildingId];
    const target = state.buildings[transfer.targetBuildingId];
    // Quelle oder Ziel abgerissen: laufende Ladung + Reservierung sauber lösen.
    if (!source || !target) {
      releaseReservation(state, transfer, atSourceOf(transfer));
      delete transfers[transfer.id];
      continue;
    }
    const vehicle = vehicleDef(config, transfer.vehicleId);
    const capacity = vehicleCapacity(config, transfer.vehicleId);
    switch (transfer.status) {
      case 'loading': {
        const loadMs = (vehicle?.loadTimeSec ?? DEFAULT_LOAD_SEC) * 1000;
        transfer.progress += dtMs / loadMs;
        if (transfer.progress < 1) break;
        // Eine Ladung aufs Fahrzeug: aus items UND reserved des Quell-Lagers.
        const inv = getInventory(state, transfer.sourceBuildingId);
        const want = Math.min(capacity > 0 ? capacity : atSourceOf(transfer), atSourceOf(transfer));
        const present = inv ? inventoryAmount(inv, transfer.resource) : 0;
        const take = Math.max(0, Math.min(want, present));
        if (inv && take > 0) {
          inv.items[transfer.resource] = present - take;
          const res = (inv.reserved[transfer.resource] ?? 0) - take;
          if (res <= 0) delete inv.reserved[transfer.resource];
          else inv.reserved[transfer.resource] = res;
          transfer.onboard = onboardOf(transfer) + take;
        }
        // Quelle unerwartet leer: Restreservierung lösen, Gesamtmenge kappen.
        if (take < want) {
          releaseReservation(state, transfer, atSourceOf(transfer));
          transfer.amount = deliveredOf(transfer) + onboardOf(transfer);
        }
        if (onboardOf(transfer) <= 0) {
          delete transfers[transfer.id];
          break;
        }
        // Betriebskosten dieser Fahrt (Geldsenke, §15) — gefloort auf 0.
        state.resources.money = Math.max(0, state.resources.money - (vehicle?.operatingCost ?? 0));
        transfer.status = 'in_transit';
        transfer.progress = 0;
        break;
      }
      case 'in_transit': {
        transfer.progress += dtMs / Math.max(1, transfer.travelMs);
        if (transfer.progress >= 1) {
          transfer.status = 'unloading';
          transfer.progress = 0;
        }
        break;
      }
      case 'unloading': {
        const unloadMs = (vehicle?.unloadTimeSecPerTarget ?? DEFAULT_UNLOAD_SEC) * 1000;
        transfer.progress += dtMs / unloadMs;
        if (transfer.progress < 1) break;
        // Einlagerung in den globalen Pool, gedeckelt (Überschuss verfällt wie bei
        // der Passivproduktion). `stats.produced` wird NICHT erneut erhöht — die
        // Ware wurde beim Fällen gezählt (kein Doppelzählen).
        const onboard = onboardOf(transfer);
        const cap = derived.storageCaps[transfer.resource] ?? Number.POSITIVE_INFINITY;
        const stored = Math.min(onboard, Math.max(0, cap - state.resources[transfer.resource]));
        state.resources[transfer.resource] += stored;
        transfer.delivered = deliveredOf(transfer) + onboard;
        transfer.onboard = 0;
        transfer.progress = 0;
        if (deliveredOf(transfer) < transfer.amount) {
          transfer.status = 'returning'; // Nachfüllfahrt: leer zurück zur Quelle
        } else {
          transfer.status = 'delivered';
          transfer.progress = 1;
        }
        break;
      }
      case 'returning': {
        transfer.progress += dtMs / Math.max(1, transfer.travelMs);
        if (transfer.progress >= 1) {
          transfer.status = 'loading';
          transfer.progress = 0;
        }
        break;
      }
      case 'delivered': {
        delete transfers[transfer.id];
        break;
      }
    }
  }
}

// ---- Netzwerk-Übersicht (§7.2) --------------------------------------------

export interface ResourceNetworkStat {
  /** Global/zentral verfügbar (das, was die obere HUD-Leiste zeigt). */
  global: number;
  /** In lokalen Betriebslagern, frei (noch nicht für Transport gebunden). */
  localBound: number;
  /** In lokalen Betriebslagern für einen Transport reserviert. */
  reserved: number;
  /** Auf Fahrzeugen unterwegs. */
  inTransit: number;
  /** Summe aller vier. */
  total: number;
}

/**
 * Netzwerkweite Aufschlüsselung je Ressource (§7.2): global · lokal gebunden ·
 * reserviert · unterwegs. Macht sichtbar, dass lokal geerntete Ware erst nach
 * dem Transport global nutzbar ist — nichts wird vorgetäuscht.
 */
export function inventoryNetworkOverview(
  state: GameState,
  config: GameConfig,
): Record<ResourceId, ResourceNetworkStat> {
  const resources = Object.keys(state.resources) as ResourceId[];
  const stats = {} as Record<ResourceId, ResourceNetworkStat>;
  for (const r of resources) {
    stats[r] = { global: state.resources[r], localBound: 0, reserved: 0, inTransit: 0, total: state.resources[r] };
  }
  const ops = state.operations;
  if (ops) {
    for (const [buildingId, inv] of Object.entries(ops.inventories)) {
      // § P4: Seit dem Bestandsregister hält dieselbe Map auch den VERORTETEN
      // Bestand der Stadtlager. Der steckt bereits in `global` — würde er hier
      // erneut als „lokal gebunden" gezählt, wiese die Übersicht die Ware der
      // Stadt doppelt aus. Lokal ist nur, was ein Betrieb noch nicht abgegeben hat.
      if (isCityStorageBuilding(state, config, buildingId)) continue;
      for (const [res, amount] of Object.entries(inv.items)) {
        const r = res as ResourceId;
        if (!stats[r]) continue;
        const reserved = inv.reserved[r] ?? 0;
        const free = Math.max(0, (amount ?? 0) - reserved);
        stats[r].localBound += free;
        stats[r].reserved += Math.min(reserved, amount ?? 0);
      }
    }
    for (const transfer of Object.values(ops.transfers ?? {})) {
      // „reserviert-im-Lager" ist über inv.reserved bereits erfasst; unterwegs
      // zählt nur, was physisch auf dem Fahrzeug liegt (onboard).
      const onboard = transfer.onboard ?? 0;
      if (stats[transfer.resource]) stats[transfer.resource].inTransit += onboard;
    }
  }
  for (const r of resources) {
    const s = stats[r];
    s.total = s.global + s.localBound + s.reserved + s.inTransit;
  }
  return stats;
}

// ---- Read-Model für den Renderer ------------------------------------------

export interface TransferRenderState {
  id: string;
  resource: ResourceId;
  status: InventoryTransfer['status'];
  vehicleId?: DriveVehicle;
  /** Interpolierte Tile-Position (kann fraktional sein). */
  x: number;
  y: number;
}

/** Pure Interpolation eines Punkts entlang einer Kachel-Polyline (t = 0..1). */
export function sampleRoutePath(path: readonly { x: number; y: number }[], t: number): { x: number; y: number } | undefined {
  if (path.length === 0) return undefined;
  if (path.length === 1) return { x: path[0]!.x, y: path[0]!.y };
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (path.length - 1);
  const i = Math.min(path.length - 2, Math.floor(scaled));
  const f = scaled - i;
  const a = path[i]!;
  const b = path[i + 1]!;
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}
