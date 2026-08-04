// Automatischer Warenfluss (§ Active Simplicity / AS-1, D-039). Reine Simulation —
// kein Renderer/React (CLAUDE.md §1).
//
// LEITREGEL: „Der Spieler entscheidet. Die Stadt arbeitet." Ein Betrieb liefert
// selbstständig ins beste erreichbare Lager, sobald sich sein lokales Lager füllt.
// Zielwahl, Fahrzeugwahl und Nachfüllen passieren OHNE Klick — damit entfällt die
// Schleife „Transport planen → Lager wählen → Route wählen → Fahrzeug wählen →
// starten", die der Spieler bisher dutzende Male durchlaufen musste.
//
// KEIN ZWEITES TRANSPORTSYSTEM (§2/§8): Dieses Modul **erteilt nur Aufträge** an den
// bestehenden Lagertransport (`createInventoryTransfer`) und benutzt dessen Ziel-,
// Routen- und Fahrzeuglogik unverändert. Es rechnet nichts eigenes.
//
// SICHTBARKEIT (D-039 „keine stillen Fehlschläge"): Kann nicht geliefert werden,
// entsteht eine **Warnung mit Grund** (`getLogisticsWarnings`) statt eines
// unsichtbaren Stillstands.

import type { GameConfig } from '../config/index.ts';
import type { Derived } from '../simulation/derived.ts';
import type { DriveVehicle, GameState, ResourceId } from '../types.ts';
import { vehicleCapacity } from '../activities/logistics.ts';
import { ensureOperationsState, getInventory, inventoryAmount } from './operations.ts';
import {
  availableForTransfer,
  createInventoryTransfer,
  transferRoute,
  transferTargets,
} from './transport.ts';
import { stockSources } from '../economy/stockLedger.ts';
import {
  conversionStage,
  isWorkshopBuilding,
  supplyRuleOf,
} from './workshops.ts';

/**
 * Ab welchem Füllstand des lokalen Lagers automatisch abtransportiert wird. Bewusst
 * kein 100 %: Ein Betrieb stoppt bei vollem Lager (§26.8) — die Abholung muss vorher
 * anlaufen, sonst steht er trotz Automatik still.
 */
export const AUTO_TRANSPORT_FILL_RATIO = 0.6;

/** Automatik ist der Normalfall (D-039). Nur ein ausdrückliches `false` schaltet ab. */
export function isAutoTransportEnabled(state: GameState, buildingId: string): boolean {
  return state.operations?.autoTransport?.[buildingId] !== false;
}

export function setAutoTransport(state: GameState, buildingId: string, enabled: boolean): void {
  const ops = ensureOperationsState(state);
  if (!ops.autoTransport) ops.autoTransport = {};
  ops.autoTransport[buildingId] = enabled;
}

/** Bestes verfügbares Fahrzeug: größte Kapazität, die der Spieler schon hat. */
export function bestAvailableVehicle(config: GameConfig, level: number): DriveVehicle | undefined {
  let best: { id: DriveVehicle; capacity: number } | undefined;
  for (const vehicle of config.activities.vehicles) {
    if (vehicle.future || vehicle.unlockLevel > level) continue;
    // Schiffe fahren nur auf Schiffsrouten (I4), nicht im Landtransport.
    if (vehicle.id === 'cargo_barge') continue;
    if (!best || vehicle.capacity > best.capacity) best = { id: vehicle.id, capacity: vehicle.capacity };
  }
  return best?.id;
}

export type LogisticsWarningCode =
  | 'no_storage_target' // kein Lagergebäude nimmt die Ware auf
  | 'no_route' // Ziel existiert, aber keine Straßenverbindung
  | 'no_vehicle' // noch kein Fahrzeug freigeschaltet
  | 'storage_full'; // lokales Lager voll → der Betrieb steht

export interface LogisticsWarning {
  buildingId: string;
  resource: ResourceId;
  code: LogisticsWarningCode;
}

/**
 * Freier Platz am Ziel — die Einlagerung geht in den globalen Pool, gedeckelt durch
 * `derived.storageCaps`. Ein Ziel ohne freien Platz ist kein sinnvolles Ziel.
 */
function globalFree(state: GameState, derived: Derived, resource: ResourceId): number {
  const cap = derived.storageCaps[resource] ?? Number.POSITIVE_INFINITY;
  return Math.max(0, cap - state.resources[resource]);
}

/**
 * Bestes Ziel: **nächstes erreichbares Lager** (D-039 §5 „nicht Lager auswählen").
 * Deterministisch: kürzeste Route, bei Gleichstand die kleinere Id.
 */
function pickTarget(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  sourceId: string,
  resource: ResourceId,
  vehicleId: DriveVehicle,
): { targetId: string } | { error: LogisticsWarningCode } {
  const targets = transferTargets(state, config, sourceId, resource);
  if (targets.length === 0) return { error: 'no_storage_target' };
  let best: { targetId: string; distance: number } | undefined;
  for (const target of targets) {
    const route = transferRoute(state, config, derived, sourceId, target.buildingId, vehicleId);
    if (!route) continue;
    if (
      !best ||
      route.distanceTiles < best.distance ||
      (route.distanceTiles === best.distance && target.buildingId < best.targetId)
    ) {
      best = { targetId: target.buildingId, distance: route.distanceTiles };
    }
  }
  return best ? { targetId: best.targetId } : { error: 'no_route' };
}

/** Läuft für diesen Betrieb schon eine Fahrt? Dann nicht doppelt beauftragen. */
function hasRunningTransfer(state: GameState, sourceId: string, resource: ResourceId): boolean {
  const transfers = state.operations?.transfers;
  if (!transfers) return false;
  return Object.values(transfers).some(
    (transfer) => transfer.sourceBuildingId === sourceId && transfer.resource === resource,
  );
}

/**
 * Ein Schritt der Auto-Logistik: prüft jeden Betrieb mit lokalem Lager und beauftragt
 * bei Bedarf **einen** Transport. Läuft im Live-Tick nach `advanceOperations`, also
 * mit derselben zeitfaktor-skalierten Taktung wie alles andere.
 */
export function advanceAutoLogistics(state: GameState, config: GameConfig, derived: Derived): void {
  const ops = state.operations;
  if (!ops) return;

  for (const [buildingId, inventory] of Object.entries(ops.inventories)) {
    const building = state.buildings[buildingId];
    const def = building ? config.buildings.get(building.defId) : undefined;
    if (!building || building.status !== 'active') continue;
    // Betrieb ODER Werkstatt: beide geben eine Ware ab. Für die Werkstatt ist
    // das ihr PRODUKT — der Rohstoff bleibt, wo er ist.
    const outgoing = def?.operation?.resource ?? (isWorkshopBuilding(def) ? def.conversion.output : undefined);
    if (!def || outgoing === undefined) continue;
    if (!isAutoTransportEnabled(state, buildingId)) continue;

    const resource = outgoing;
    if (hasRunningTransfer(state, buildingId, resource)) continue;

    const available = availableForTransfer(state, buildingId, resource);
    if (available <= 0) continue;

    const vehicleId = bestAvailableVehicle(config, state.level.current);
    if (!vehicleId) continue; // ohne Fahrzeug keine Fahrt — als Warnung sichtbar
    const capacity = vehicleCapacity(config, vehicleId);

    // Abholen, sobald eine volle Ladung zusammenkommt ODER das Lager spürbar voll
    // wird. So steht ein kleiner Betrieb nicht ewig auf einer Teilladung.
    // Bezugsgröße ist der Platz für GENAU DIESE Ware. Beim Betrieb ist das das
    // ganze Lager; bei der Werkstatt liegen Rohstoff und Produkt im selben
    // Eintrag, und `capacity` wäre die Summe — der Ausgang gälte dann nie als
    // voll, und die Werkstatt bliebe auf ihrem Produkt sitzen.
    const outCapacity = isWorkshopBuilding(def)
      ? conversionStage(def.conversion, building.upgradeLevel).outputCapacity
      : inventory.capacity;
    const fillRatio = outCapacity > 0 ? inventoryAmount(inventory, resource) / outCapacity : 0;
    if (available < capacity && fillRatio < AUTO_TRANSPORT_FILL_RATIO) continue;

    if (globalFree(state, derived, resource) <= 0) continue; // nirgends Platz → Warnung
    const target = pickTarget(state, config, derived, buildingId, resource, vehicleId);
    if ('error' in target) continue;

    createInventoryTransfer(
      state,
      config,
      derived,
      {
        sourceBuildingId: buildingId,
        targetBuildingId: target.targetId,
        resource,
        amount: Math.min(available, capacity),
        vehicleId,
      },
      state.meta.lastSimTime,
    );
  }
}

// ---- Nachschub für Werkstätten (§ Lieferketten-Overhaul §5) ----------------

/**
 * Ab welchem Füllstand des EINGANGS-Lagers Nachschub angefordert wird. Bewusst
 * hoch: Eine Werkstatt, die erst bei 20 % bestellt, steht während der Fahrt
 * still — und die Fahrt dauert bei einer Insel dieser Größe minutenlang.
 */
export const WORKSHOP_REFILL_RATIO = 0.5;

export interface WorkshopDemand {
  buildingId: string;
  resource: ResourceId;
  /** Freier Eingangsplatz — mehr geht physisch nicht hinein. */
  missing: number;
  priority: number;
}

/**
 * Was fehlt welcher Werkstatt? Reine Projektion, absteigend nach Priorität —
 * **das ist die einzige Stelle, an der `priority` wirkt**, und sie wirkt echt:
 * Bei knappem Rohstoff bekommt die vordere Werkstatt die Ladung, die hintere
 * geht leer aus. (Anders als der gleichnamige, wirkungslose Vertrag der
 * Stadtarbeit — der ist bis heute nicht gebaut, weil dahinter keine Simulation
 * steht. Hier steht eine.)
 */
export function workshopSupplyDemand(state: GameState, config: GameConfig): WorkshopDemand[] {
  const out: WorkshopDemand[] = [];
  for (const b of Object.values(state.buildings)) {
    const def = config.buildings.get(b.defId);
    if (!isWorkshopBuilding(def) || b.status !== 'active') continue;
    const rule = supplyRuleOf(state, b.id);
    if (!rule.enabled) continue; // pausiert = kein Nachschub, nicht „später"
    const stage = conversionStage(def.conversion, b.upgradeLevel);
    const stock = inventoryAmount(getInventory(state, b.id), def.conversion.input);
    if (stock >= stage.inputCapacity * WORKSHOP_REFILL_RATIO) continue;
    out.push({
      buildingId: b.id,
      resource: def.conversion.input,
      missing: Math.max(0, stage.inputCapacity - stock),
      priority: rule.priority ?? 1,
    });
  }
  // Deterministisch: höhere Priorität zuerst, bei Gleichstand die kleinere Id.
  return out.sort((a, b) => b.priority - a.priority || (a.buildingId < b.buildingId ? -1 : 1));
}

/**
 * Ein Schritt des Werkstatt-Nachschubs: beauftragt je Werkstatt höchstens
 * **eine** Fahrt beim besten Lagerort. „Bester" heißt: der vom Spieler gewählte
 * (`rule.sourceBuildingId`), sonst der mit dem meisten Bestand — die Reihenfolge
 * kommt aus `stockSources`, also aus dem Bestandsregister und nicht aus einer
 * zweiten Lagerliste (D-052).
 *
 * Erteilt wird wieder nur ein Auftrag an den bestehenden Lagertransport; Route,
 * Fahrzeug, Ladezeit und Betriebskosten bleiben unverändert (§2/§8).
 */
export function advanceWorkshopSupply(state: GameState, config: GameConfig, derived: Derived): void {
  const demands = workshopSupplyDemand(state, config);
  if (demands.length === 0) return;
  const vehicleId = bestAvailableVehicle(config, state.level.current);
  if (!vehicleId) return;
  const capacity = vehicleCapacity(config, vehicleId);

  for (const demand of demands) {
    if (hasIncomingTransfer(state, demand.buildingId, demand.resource)) continue;
    const rule = supplyRuleOf(state, demand.buildingId);
    const sources = stockSources(state, derived, demand.resource);
    const preferred = rule.sourceBuildingId
      ? sources.filter((share) => share.site.buildingId === rule.sourceBuildingId)
      : sources;
    // Eine ausdrücklich gewählte Quelle wird NICHT stillschweigend ersetzt:
    // Wer „aus dem Nordlager" sagt, meint das auch, wenn dort gerade nichts
    // liegt. Der Stillstand ist dann sichtbar (`no_input`), nicht überspielt.
    for (const share of preferred) {
      const amount = Math.min(share.stored, demand.missing, capacity);
      if (amount <= 0) continue;
      const created = createInventoryTransfer(
        state,
        config,
        derived,
        {
          sourceBuildingId: share.site.buildingId,
          targetBuildingId: demand.buildingId,
          resource: demand.resource,
          amount,
          vehicleId,
        },
        state.meta.lastSimTime,
      );
      if (typeof created !== 'string') break; // Fahrt läuft
    }
  }
}

/** Läuft schon eine Anlieferung zu diesem Gebäude? Dann nicht doppelt bestellen. */
function hasIncomingTransfer(state: GameState, targetId: string, resource: ResourceId): boolean {
  const transfers = state.operations?.transfers;
  if (!transfers) return false;
  return Object.values(transfers).some(
    (transfer) => transfer.targetBuildingId === targetId && transfer.resource === resource,
  );
}

/**
 * Warnungen statt Aufgaben (§ AS-2). Sagt, **warum** gerade nichts fließt — mit
 * genau der Information, die für einen Ein-Klick-Fix nötig ist. Reine Projektion.
 */
export function getLogisticsWarnings(
  state: GameState,
  config: GameConfig,
  derived: Derived,
): LogisticsWarning[] {
  const ops = state.operations;
  if (!ops) return [];
  const warnings: LogisticsWarning[] = [];
  const vehicleId = bestAvailableVehicle(config, state.level.current);

  for (const [buildingId, inventory] of Object.entries(ops.inventories)) {
    const building = state.buildings[buildingId];
    const def = building ? config.buildings.get(building.defId) : undefined;
    if (!building || !def?.operation || building.status !== 'active') continue;
    if (!isAutoTransportEnabled(state, buildingId)) continue;

    const resource = def.operation.resource;
    const stored = inventoryAmount(inventory, resource);
    if (stored <= 0) continue;

    const full = inventory.capacity > 0 && stored >= inventory.capacity;
    if (!vehicleId) {
      warnings.push({ buildingId, resource, code: 'no_vehicle' });
      continue;
    }
    if (globalFree(state, derived, resource) <= 0) {
      warnings.push({ buildingId, resource, code: 'storage_full' });
      continue;
    }
    if (hasRunningTransfer(state, buildingId, resource)) continue;
    const target = pickTarget(state, config, derived, buildingId, resource, vehicleId);
    if ('error' in target) {
      warnings.push({ buildingId, resource, code: target.error });
      continue;
    }
    // Ein volles Lager trotz möglichem Ziel heißt: der Betrieb steht bereits.
    if (full) warnings.push({ buildingId, resource, code: 'storage_full' });
  }
  return warnings;
}

/** Für die UI: nutzt dieser Betrieb die Automatik? */
export function getAutoTransportState(state: GameState, buildingId: string): { enabled: boolean } {
  return { enabled: isAutoTransportEnabled(state, buildingId) };
}

/** Reserviert für spätere Regelwerke (AS-4). */
export function ensureAutoTransportMap(state: GameState): Record<string, boolean> {
  const ops = ensureOperationsState(state);
  if (!ops.autoTransport) ops.autoTransport = {};
  return ops.autoTransport;
}

/** Ein Betrieb ohne lokales Lager kann nichts liefern — kein Kandidat. */
export function hasLocalInventory(state: GameState, buildingId: string): boolean {
  return getInventory(state, buildingId) !== undefined;
}
