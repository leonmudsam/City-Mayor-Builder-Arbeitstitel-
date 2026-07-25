// Persistente Schiffsrouten (§ Infrastruktur 2.0 / I4, Save v22). Reine Simulation —
// kein Renderer/React (CLAUDE.md §1).
//
// WARUM ES DIESES MODUL GIBT: Der vorhandene Lagertransport (`operations/transport.ts`)
// fährt über den Straßengraphen. Liegen Quelle und Ziel durch Wasser getrennt, liefert
// er `no_route` — die Ware bleibt im lokalen Betriebslager stecken. Genau diese Lücke
// schließt eine Schiffsroute: Betrieb → Verladehafen → **Schiff** → Zielhafen →
// Lagergebäude.
//
// KEIN ZWEITES TRANSPORTSYSTEM (§2/§8):
//   · Wasserweg/Distanz  ← `waterNavigation.getShippingRoutePreview` (bestehender Dijkstra)
//   · Anlegerzustand     ← `harborNodes.getHarborNodeStatus` (I3)
//   · Kapazität/Fahrzeug ← `activities/logistics.vehicleCapacity` (derselbe Katalog)
//   · Lager/Reservierung ← `operations/transport` + `operations.ts` (dieselben Lager)
//   · Phasenvokabular    ← `InventoryTransferStatus` (loading/…/returning)
// Der Unterschied zum Transport ist allein die **Persistenz**: eine Route verschwindet
// nicht nach der Lieferung, sondern fährt zyklisch weiter, bis sie pausiert/gelöscht wird.
//
// GENAUER UMFANG (nicht mehr behaupten, als simuliert wird): Modelliert wird die
// **Schiffsfahrt zwischen den beiden Anlegern** — Distanz und Fahrzeit kommen aus dem
// Wassergraphen. Die Landwege Betrieb→Verladehafen und Zielhafen→Lager sind in Lade-
// und Entladezeit abstrahiert und werden NICHT als eigene Fahrten simuliert; dafür
// bleibt der Lagertransport zuständig.
//
// Bewusst offen (nicht vorgetäuscht): Schiffs-3D-Modelle, Zwischenlager an Häfen,
// Kraftstoff/Schiffszustand, mehrere Schiffe je Route, echte multimodale Legs.

import type { GameConfig } from '../config/index.ts';
import type { ActivityVehicleDef } from '../config/types.ts';
import type { Derived } from '../simulation/derived.ts';
import type { DriveVehicle, GameState, ResourceId, ShippingRoute } from '../types.ts';
import { effectiveEffects, isContributing } from '../buildings/effects.ts';
import { newId } from '../engine/rng.ts';
import { vehicleCapacity } from '../activities/logistics.ts';
import { getInventory, inventoryAmount } from '../operations/operations.ts';
import { availableForTransfer } from '../operations/transport.ts';
import { getShippingRoutePreview } from './waterNavigation.ts';

/** Untergrenze der reinen Fahrdauer je Richtung, damit kurze Wege kurz „fahren". */
const MIN_TRAVEL_MS = 2_000;
/** Umrechnung Wasserdistanz → Fahrzeit: Kacheln / (km/h) → ms, gleiche Skala wie Land. */
const WATER_MS_PER_TILE_AT_1KPH = 3_600;
const DEFAULT_LOAD_SEC = 18;
const DEFAULT_UNLOAD_SEC = 14;

export function ensureShippingRoutes(state: GameState): Record<string, ShippingRoute> {
  if (!state.shipping) state.shipping = { routes: {} };
  return state.shipping.routes;
}

function vehicleDef(config: GameConfig, vehicleId: DriveVehicle | undefined): ActivityVehicleDef | undefined {
  if (!vehicleId) return undefined;
  return config.activities.vehicles.find((v) => v.id === vehicleId);
}

/** Standardschiff, wenn der Aufrufer keines wählt. */
export const DEFAULT_SHIP: DriveVehicle = 'cargo_barge';

export type ShippingRouteError =
  | 'invalid_source'
  | 'invalid_target'
  | 'invalid_harbor'
  | 'no_waterway'
  | 'no_ship'
  | 'duplicate';

export interface CreateShippingRouteInput {
  sourceBuildingId: string;
  originHarborId: string;
  destinationHarborId: string;
  targetBuildingId: string;
  resource: ResourceId;
  vehicleId?: DriveVehicle;
}

function storesResource(
  state: GameState,
  config: GameConfig,
  buildingId: string,
  resource: ResourceId,
): boolean {
  const building = state.buildings[buildingId];
  const def = building ? config.buildings.get(building.defId) : undefined;
  if (!building || !def || !isContributing(building)) return false;
  return effectiveEffects(def, building.upgradeLevel).some(
    (effect) => effect.type === 'storage' && effect.resource === resource,
  );
}

const isHarbor = (state: GameState, config: GameConfig, id: string): boolean =>
  !!config.buildings.get(state.buildings[id]?.defId ?? '')?.waterfront;

/**
 * Reine Vorschau von Wasserweg und Fahrzeit — Anzeige und Erstellung nutzen
 * dasselbe Ergebnis. `undefined`, wenn kein befahrbarer Wasserweg existiert.
 */
export function shippingRouteLegs(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  originHarborId: string,
  destinationHarborId: string,
  vehicleId: DriveVehicle | undefined,
): { travelMs: number; waterDistance: number } | undefined {
  const preview = getShippingRoutePreview(
    state,
    config,
    derived.roadNetwork,
    originHarborId,
    destinationHarborId,
  );
  if (!preview || preview.status !== 'planned') return undefined;
  const vehicle = vehicleDef(config, vehicleId);
  const speedKph = vehicle && vehicle.speedKph > 0 ? vehicle.speedKph : 18;
  const travelMs = Math.max(
    MIN_TRAVEL_MS,
    Math.round((preview.distance * WATER_MS_PER_TILE_AT_1KPH) / speedKph),
  );
  return { travelMs, waterDistance: Math.round(preview.distance * 10) / 10 };
}

/**
 * Legt eine persistente Schiffsroute an. Anders als beim einmaligen Transport wird
 * hier **nichts** vorab reserviert: die Route lädt je Fahrt genau das, was gerade
 * frei im Quell-Lager liegt (sonst würde eine Dauerroute das Lager dauerhaft binden).
 */
export function createShippingRoute(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  input: CreateShippingRouteInput,
  now: number,
): ShippingRoute | ShippingRouteError {
  const source = state.buildings[input.sourceBuildingId];
  const sourceDef = source && config.buildings.get(source.defId);
  if (!source || !sourceDef?.operation || source.status !== 'active') return 'invalid_source';
  if (!storesResource(state, config, input.targetBuildingId, input.resource)) return 'invalid_target';
  if (
    !isHarbor(state, config, input.originHarborId) ||
    !isHarbor(state, config, input.destinationHarborId) ||
    input.originHarborId === input.destinationHarborId
  ) {
    return 'invalid_harbor';
  }

  const vehicleId = input.vehicleId ?? DEFAULT_SHIP;
  const capacity = vehicleCapacity(config, vehicleId);
  if (capacity <= 0) return 'no_ship';

  const legs = shippingRouteLegs(state, config, derived, input.originHarborId, input.destinationHarborId, vehicleId);
  if (!legs) return 'no_waterway';

  const routes = ensureShippingRoutes(state);
  const duplicate = Object.values(routes).some(
    (route) =>
      route.sourceBuildingId === input.sourceBuildingId &&
      route.targetBuildingId === input.targetBuildingId &&
      route.resource === input.resource &&
      route.originHarborId === input.originHarborId &&
      route.destinationHarborId === input.destinationHarborId,
  );
  if (duplicate) return 'duplicate';

  const route: ShippingRoute = {
    id: newId(state, 'sr'),
    sourceBuildingId: input.sourceBuildingId,
    originHarborId: input.originHarborId,
    destinationHarborId: input.destinationHarborId,
    targetBuildingId: input.targetBuildingId,
    resource: input.resource,
    vehicleId,
    phase: 'loading',
    progress: 0,
    onboard: 0,
    deliveredTotal: 0,
    cycles: 0,
    capacity,
    travelMs: legs.travelMs,
    waterDistance: legs.waterDistance,
    operatingCost: vehicleDef(config, vehicleId)?.operatingCost ?? 0,
    createdAt: now,
  };
  routes[route.id] = route;
  return route;
}

/** Pausiert/entpausiert eine Route. Die Ladung an Bord bleibt erhalten. */
export function setShippingRoutePaused(state: GameState, routeId: string, paused: boolean): boolean {
  const route = state.shipping?.routes[routeId];
  if (!route) return false;
  route.paused = paused;
  return true;
}

/**
 * Löscht eine Route. Ware an Bord kehrt — soweit Platz ist — ins Quell-Lager zurück
 * (keine erfundene Teleport-Rückgabe: was nicht mehr passt, verfällt wie Überschuss).
 */
export function deleteShippingRoute(state: GameState, routeId: string): boolean {
  const routes = state.shipping?.routes;
  const route = routes?.[routeId];
  if (!route) return false;
  const onboard = route.onboard ?? 0;
  if (onboard > 0) {
    const inv = getInventory(state, route.sourceBuildingId);
    if (inv) {
      const free = Math.max(0, inv.capacity - Object.values(inv.items).reduce((sum, n) => sum + (n ?? 0), 0));
      const back = Math.min(onboard, free);
      if (back > 0) inv.items[route.resource] = (inv.items[route.resource] ?? 0) + back;
    }
  }
  delete routes![routeId];
  return true;
}

/**
 * Ein Simulationsschritt aller Schiffsrouten. Läuft NUR im Live-Tick. `dtMin` ist
 * bereits zeitfaktor-skaliert → Pause/1×/2×/4× wirken automatisch (derselbe Pfad wie
 * bei Transporten). `derived.storageCaps` deckelt die Einlagerung; Überschuss verfällt
 * wie bei der übrigen Produktion. `stats.produced` wird NICHT erneut erhöht — die Ware
 * wurde bei der Ernte gezählt (kein Doppelzählen, §A5).
 */
export function advanceShippingRoutes(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  dtMin: number,
): void {
  const routes = state.shipping?.routes;
  if (!routes) return;
  const dtMs = dtMin * 60_000;

  for (const route of Object.values(routes)) {
    const source = state.buildings[route.sourceBuildingId];
    const target = state.buildings[route.targetBuildingId];
    const origin = state.buildings[route.originHarborId];
    const destination = state.buildings[route.destinationHarborId];
    // Ein abgerissener Knoten beendet die Route sauber (Ladung zurück, s. o.).
    if (!source || !target || !origin || !destination) {
      deleteShippingRoute(state, route.id);
      continue;
    }
    if (route.paused) continue;

    const vehicle = vehicleDef(config, route.vehicleId);
    switch (route.phase) {
      case 'loading': {
        const loadMs = (vehicle?.loadTimeSec ?? DEFAULT_LOAD_SEC) * 1000;
        route.progress += dtMs / loadMs;
        if (route.progress < 1) break;
        route.progress = 0;
        // Es wird genommen, was gerade frei ist — nie mehr als eine Schiffsladung.
        const inv = getInventory(state, route.sourceBuildingId);
        const free = availableForTransfer(state, route.sourceBuildingId, route.resource);
        const take = Math.floor(Math.min(route.capacity, free));
        if (!inv || take <= 0) break; // Lager leer: die Route wartet, statt zu verschwinden
        inv.items[route.resource] = Math.max(0, inventoryAmount(inv, route.resource) - take);
        route.onboard = (route.onboard ?? 0) + take;
        // Betriebskosten dieser Fahrt (Geldsenke, §15) — gefloort auf 0.
        state.resources.money = Math.max(0, state.resources.money - route.operatingCost);
        route.phase = 'outbound';
        break;
      }
      case 'outbound': {
        route.progress += dtMs / Math.max(1, route.travelMs);
        if (route.progress >= 1) {
          route.phase = 'unloading';
          route.progress = 0;
        }
        break;
      }
      case 'unloading': {
        const unloadMs = (vehicle?.unloadTimeSecPerTarget ?? DEFAULT_UNLOAD_SEC) * 1000;
        route.progress += dtMs / unloadMs;
        if (route.progress < 1) break;
        const onboard = route.onboard ?? 0;
        const cap = derived.storageCaps[route.resource] ?? Number.POSITIVE_INFINITY;
        const stored = Math.min(onboard, Math.max(0, cap - state.resources[route.resource]));
        state.resources[route.resource] += stored;
        route.deliveredTotal = (route.deliveredTotal ?? 0) + stored;
        route.onboard = 0;
        route.progress = 0;
        route.phase = 'returning';
        break;
      }
      case 'returning': {
        route.progress += dtMs / Math.max(1, route.travelMs);
        if (route.progress >= 1) {
          route.phase = 'loading';
          route.progress = 0;
          route.cycles = (route.cycles ?? 0) + 1;
        }
        break;
      }
    }
  }
}

// ---- Reads -----------------------------------------------------------------

export interface ShippingRouteView extends ShippingRoute {
  /** Frei verfügbare Menge im Quell-Lager (was die nächste Fahrt mitnehmen kann). */
  availableAtSource: number;
  /** Route wartet auf Nachschub (Lager leer). */
  waitingForCargo: boolean;
}

export function getShippingRoutes(state: GameState): ShippingRouteView[] {
  const routes = state.shipping?.routes;
  if (!routes) return [];
  return Object.values(routes)
    .map((route) => {
      const availableAtSource = availableForTransfer(state, route.sourceBuildingId, route.resource);
      return {
        ...route,
        availableAtSource,
        waitingForCargo: route.phase === 'loading' && availableAtSource <= 0 && (route.onboard ?? 0) <= 0,
      };
    })
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

export interface ShippingNetworkOverview {
  routes: number;
  active: number;
  paused: number;
  waiting: number;
  /** Summe der bisher per Schiff eingelagerten Menge. */
  deliveredTotal: number;
  /** Betriebskosten je Rundfahrt aller aktiven Routen. */
  operatingCostPerCycle: number;
}

export function getShippingNetworkOverview(state: GameState): ShippingNetworkOverview {
  const views = getShippingRoutes(state);
  let active = 0;
  let paused = 0;
  let waiting = 0;
  let deliveredTotal = 0;
  let operatingCostPerCycle = 0;
  for (const route of views) {
    if (route.paused) paused++;
    else {
      active++;
      operatingCostPerCycle += route.operatingCost;
    }
    if (route.waitingForCargo) waiting++;
    deliveredTotal += route.deliveredTotal ?? 0;
  }
  return { routes: views.length, active, paused, waiting, deliveredTotal, operatingCostPerCycle };
}
