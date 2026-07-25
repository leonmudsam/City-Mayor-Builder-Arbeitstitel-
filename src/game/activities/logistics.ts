// Stadtarbeit-Logistik 2.0 — Phase L2 (§ CITYWORK_LOGIC_2_PLAN.md). Reine,
// DETERMINISTISCHE Ladungs-/Kapazitätsplanung: aus einer Aktivität + Fahrzeug +
// gewählter Zielreihenfolge werden der physische Cargo-Bedarf und die daraus
// nötigen Be-/Nachladungen (Etappen) berechnet. Kein three/react/zustand/
// Renderer (CLAUDE.md §1) — nur Typen + der reine `effects`-Helfer. Kein RNG,
// keine Zeit, kein Save: dieselbe Planung liefert immer dasselbe Ergebnis.
//
// Wichtige Modellentscheidung (§ Plan A1/A5): Es gibt KEINE gebäudeeigene
// Lagerhaltung — Ressourcen liegen im globalen Pool. `cargoModel` beschreibt die
// TRANSPORTIERTE Menge (füllt das Fahrzeug, erzwingt Nachladen); der
// tatsächliche Ressourcenverbrauch bleibt `costPerTarget` (Ökonomie-Senke).
// Beide fallen standardmäßig zusammen; `scaleByResidents` lässt das transportierte
// Volumen realistisch mit der Zielgröße wachsen, ohne die Live-Ökonomie zu ändern.

import type { GameConfig } from '../config/index.ts';
import type { ActivityDef, ActivityVehicleDef } from '../config/types.ts';
import type { GameState, ResourceId } from '../types.ts';
import { effectiveEffects, isContributing } from '../buildings/effects.ts';
import type { RouteAnalysis } from './routeAnalysis.ts';

/** Physisches Ladungsmodell einer Delivery-Aktivität. */
export interface CargoModel {
  resource: ResourceId;
  /** Basis-Transportmenge je Ziel. */
  perTarget: number;
  /** §13: großes Wohnziel braucht eine größere Lieferung. */
  scaleByResidents?: boolean;
  /** §12: verderblich (Kühlfahrzeug reduziert Verlust). */
  perishable?: boolean;
}

/** Transportbedarf eines einzelnen Ziels. */
export interface CargoRequirement {
  targetId: string;
  resource: ResourceId;
  amount: number;
}

export type ActivityLegType = 'pickup' | 'delivery' | 'return';

/** Eine geplante Etappe (Projektion aus Plan + Kapazität, nicht persistiert). */
export interface ActivityLeg {
  index: number;
  type: ActivityLegType;
  /** pickup/return: Ankergebäude (Quelle). */
  sourceId?: string;
  /** delivery: in dieser Etappe belieferte Ziele. */
  targetIds: string[];
  resource: ResourceId;
  /** Geladene (pickup) bzw. gelieferte (delivery) Menge. */
  amount: number;
}

/** Gesamtergebnis der Ladungsplanung für eine Route. */
export interface CargoPlan {
  resource: ResourceId;
  capacity: number;
  /** Summe des Transportbedarfs aller Ziele. */
  totalRequired: number;
  /** Nötige Beladungen (Pickup-Etappen). ≥1, sobald Bedarf besteht. */
  loadsRequired: number;
  requirements: CargoRequirement[];
  legs: ActivityLeg[];
  /** Ziele, deren Einzelbedarf allein die Fahrzeugkapazität übersteigt. */
  oversizedTargetIds: string[];
  /** true, wenn mehr als eine Beladung nötig ist (§2: Kapazität greift). */
  needsReload: boolean;
}

/**
 * Eindeutiger Zustand eines Missionsstopps (§ Overhaul 8.0 / §3.2). Die
 * Planungsprojektion kennt nur die Zustände, die sie ehrlich ableiten kann:
 * `completed` (Menge vollständig übergeben), `partially_completed` (Kontakt mit
 * Teilmenge), `skipped` (berührt, aber zu wenig Ladung) und `planned` (noch nie
 * berührt). `approaching`/`loading`/`unloading`/`failed` beschreiben die
 * LAUFENDE Fahrt und werden von der Ausführung gesetzt — die Planung erfindet
 * sie nicht.
 */
export type ActivityStopStatus =
  | 'planned'
  | 'approaching'
  | 'loading'
  | 'unloading'
  | 'completed'
  | 'partially_completed'
  | 'skipped'
  | 'failed';

export interface CargoRouteStop {
  type: 'source' | 'delivery' | 'resupply';
  buildingId: string;
  pathIndex: number;
  amount: number;
  cargoAfter: number;
  /** §3.2: Ein Lieferziel ist erst `completed`, wenn seine Menge komplett übergeben wurde. */
  status: ActivityStopStatus;
  /**
   * Nur bei `resupply` (§ R5): **Pflichtstopp** — ohne dieses Nachladen reicht die
   * Ladung für das nächste angefahrene Ziel nicht. `false` = optionales Auffüllen
   * (die Tour liefe auch ohne). Ermittelt per Vorausschau auf dem echten Weg, nicht
   * geschätzt.
   */
  required?: boolean;
  /** Ziel, das ohne diesen Pflichtstopp leer ausginge (Anzeige/Begründung). */
  requiredForBuildingId?: string;
}

/**
 * Getrennte Fortschrittszählung (§3.2). Lieferziele, Nachfüllstopps und eine
 * eventuelle Rückkehr werden NIE in einer gemeinsamen Zahl vermischt — genau
 * diese Vermischung erzeugte die falsche „4/5 Stopps"-Anzeige.
 */
export interface ActivityProgress {
  deliveryTargetsCompleted: number;
  deliveryTargetsTotal: number;
  resupplyStopsCompleted: number;
  resupplyStopsTotal: number;
  /**
   * Das aktuelle Missionsmodell kennt keine Pflichtrückkehr zum Depot. Das Feld
   * existiert als kanonischer Vertrag für die spätere Leg-Planung und ist
   * deshalb heute immer `false` — es wird nichts vorgetäuscht.
   */
  returnRequired: boolean;
  returnCompleted: boolean;
}

/**
 * Live-Projektion eines gezeichneten Weges auf die Cargo-Planung. Der Helfer
 * erzeugt keinen Weg und verändert keinen State: Er erkennt nur tatsächliche
 * Quell-/Zielkontakte entlang der übergebenen Straßenkette.
 */
export interface CargoRouteEvaluation {
  stops: CargoRouteStop[];
  orderedTargetIds: string[];
  /**
   * Ziele, die der Weg berührt hat, die aber bis zum Ende NICHT vollständig
   * beliefert wurden. Ein Kontakt mit zu wenig Ladung macht ein Ziel nicht
   * dauerhaft ungültig: Führt der Weg nach dem Nachfüllen erneut hin, zählt
   * dieser spätere Kontakt (§3.1 — Ursache des „4/5"-Fehlers).
   */
  invalidTargetIds: string[];
  plannedResupplies: number;
  requiredResupplies: number;
  deliveredAmount: number;
  remainingAmount: number;
  cargoAtEnd: number;
  emptyTravelTiles: number;
  emptyTravelRatio: number;
  cargoValid: boolean;
  /** §3.2: getrennte Zählung von Lieferzielen und Nachfüllstopps. */
  progress: ActivityProgress;
}

export interface CargoRouteAnchor {
  buildingId: string;
  x: number;
  y: number;
}

// Balancing-Konstanten (benannt, dokumentiert — keine magischen Literale).
/** Einwohnerzahl, ab der ein Wohnziel den Basisbedarf verdoppelt (scaleByResidents). */
const RESIDENT_NORM = 8;
/** Deckelt den Größenzuschlag, damit ein einzelnes Ziel planbar bleibt. */
const MAX_RESIDENT_FACTOR = 4;

/**
 * Löst das Ladungsmodell einer Aktivität auf. Explizites `cargoModel` gewinnt;
 * sonst wird aus einer Ein-Ressourcen-`costPerTarget` ein Modell abgeleitet, damit
 * Planung und Ökonomie standardmäßig übereinstimmen. `undefined`, wenn die
 * Aktivität keine transportierbare Ladung hat (Inspektion/Entscheidung).
 */
export function resolveCargoModel(def: ActivityDef): CargoModel | undefined {
  if (def.cargoModel) return def.cargoModel;
  if (!def.costPerTarget) return undefined;
  const entries = Object.entries(def.costPerTarget).filter(([, amount]) => (amount ?? 0) > 0);
  if (entries.length !== 1) return undefined;
  const [resource, amount] = entries[0]!;
  return { resource: resource as ResourceId, perTarget: amount ?? 0 };
}

/** Wohnkapazität eines Zielgebäudes (Einwohner) an seiner aktuellen Stufe. */
function residentCapacity(state: GameState, config: GameConfig, buildingId: string): number {
  const b = state.buildings[buildingId];
  if (!b || !isContributing(b)) return 0;
  const def = config.buildings.get(b.defId);
  if (!def) return 0;
  let capacity = 0;
  for (const effect of effectiveEffects(def, b.upgradeLevel)) {
    if (effect.type === 'housing') capacity += effect.units * effect.maxResidentsPerUnit;
  }
  return capacity;
}

/** Größenfaktor eines Ziels für `scaleByResidents` (1 = Basis, gedeckelt). */
function residentFactor(state: GameState, config: GameConfig, buildingId: string): number {
  const capacity = residentCapacity(state, config, buildingId);
  if (capacity <= 0) return 1;
  return Math.min(MAX_RESIDENT_FACTOR, Math.max(1, Math.round((capacity / RESIDENT_NORM) * 2) / 2));
}

/** Transportbedarf je Ziel in gewählter Reihenfolge. */
export function cargoRequirements(
  state: GameState,
  config: GameConfig,
  model: CargoModel,
  orderedTargetIds: readonly string[],
): CargoRequirement[] {
  return orderedTargetIds.map((targetId) => {
    const factor = model.scaleByResidents ? residentFactor(state, config, targetId) : 1;
    return { targetId, resource: model.resource, amount: Math.round(model.perTarget * factor) };
  });
}

/**
 * Packt die Zielbedarfe in Fahrzeugladungen (Kapazität). Übersteigt der
 * Restbedarf die Restladung, wird eine Pickup-Etappe eingefügt (Nachladen) —
 * genau das erzwingt §2. Ein Ziel, dessen Bedarf allein die Kapazität übersteigt,
 * wird über mehrere volle Ladungen aufgeteilt und als `oversized` markiert.
 * Rein funktional: Eingabe Kapazität + Bedarfe, Ausgabe Etappen.
 */
export function planCargoLegs(
  capacity: number,
  requirements: readonly CargoRequirement[],
  sourceId: string,
  resource: ResourceId,
): { legs: ActivityLeg[]; loadsRequired: number; totalRequired: number; oversizedTargetIds: string[] } {
  const totalRequired = requirements.reduce((sum, r) => sum + r.amount, 0);
  const oversizedTargetIds = requirements.filter((r) => r.amount > capacity && capacity > 0).map((r) => r.targetId);
  const legs: ActivityLeg[] = [];
  if (totalRequired <= 0 || capacity <= 0) {
    return { legs, loadsRequired: 0, totalRequired, oversizedTargetIds };
  }

  let index = 0;
  let load = 0;
  let undelivered = totalRequired;
  let deliveryTargets: string[] = [];
  let deliveryAmount = 0;

  const flushDelivery = (): void => {
    if (deliveryTargets.length === 0) return;
    legs.push({ index: index++, type: 'delivery', targetIds: deliveryTargets, resource, amount: deliveryAmount });
    deliveryTargets = [];
    deliveryAmount = 0;
  };
  const pickup = (): void => {
    flushDelivery();
    const amount = Math.min(capacity, undelivered);
    legs.push({ index: index++, type: 'pickup', sourceId, targetIds: [], resource, amount });
    load = amount;
  };

  for (const req of requirements) {
    let remaining = req.amount;
    while (remaining > 0) {
      if (load <= 0) pickup();
      const deliverNow = Math.min(remaining, load);
      if (!deliveryTargets.includes(req.targetId)) deliveryTargets.push(req.targetId);
      deliveryAmount += deliverNow;
      load -= deliverNow;
      remaining -= deliverNow;
      undelivered -= deliverNow;
    }
  }
  flushDelivery();

  const loadsRequired = legs.filter((l) => l.type === 'pickup').length;
  return { legs, loadsRequired, totalRequired, oversizedTargetIds };
}

/** Fahrzeugkapazität aus dem Config-Katalog (0, wenn unbekannt/keins gewählt). */
export function vehicleCapacity(config: GameConfig, vehicle: ActivityVehicleDef['id'] | undefined): number {
  if (!vehicle) return 0;
  return config.activities.vehicles.find((v) => v.id === vehicle)?.capacity ?? 0;
}

/**
 * Vollständige Ladungsplanung für eine Aktivität: Bedarf je Ziel + nötige
 * Beladungen. `undefined`, wenn die Aktivität keine Ladung transportiert.
 * `sourceId` ist der räumliche Quell-Anker (Farm/Markt/Lager), aus dem geladen
 * wird; der Bestand selbst bleibt der globale Pool (§ Plan A1).
 */
export function cargoPlanFor(
  state: GameState,
  config: GameConfig,
  def: ActivityDef,
  vehicle: ActivityVehicleDef['id'] | undefined,
  sourceId: string,
  orderedTargetIds: readonly string[],
): CargoPlan | undefined {
  const model = resolveCargoModel(def);
  if (!model) return undefined;
  const capacity = vehicleCapacity(config, vehicle);
  const requirements = cargoRequirements(state, config, model, orderedTargetIds);
  const { legs, loadsRequired, totalRequired, oversizedTargetIds } = planCargoLegs(
    capacity,
    requirements,
    sourceId,
    model.resource,
  );
  return {
    resource: model.resource,
    capacity,
    totalRequired,
    loadsRequired,
    requirements,
    legs,
    oversizedTargetIds,
    needsReload: loadsRequired > 1,
  };
}

// ===========================================================================
// L4 — Infrastruktur-Bewertung (§19 Leerfahrtanteil, §6 Plan). Reine,
// deterministische Prognose aus Route + Ladungsplan + Fahrzeugeignung. KEINE
// Auszahlung, kein Save (bleibt Anzeige, DECISIONS D-013). Textbausteine liefert
// die UI (Codex); hier entstehen nur Zahlen und textfreie Hinweiscodes.
// ===========================================================================

/** Ein textfreier Infrastruktur-Hinweis; die UI übersetzt den Code. */
export interface InfrastructureWarning {
  code:
    | 'oversized_target'
    | 'many_reloads'
    | 'high_empty_travel'
    | 'low_vehicle_suitability'
    | 'oversized_vehicle'
    | 'perishable_no_cooling'
    | 'incomplete_road'
    | 'narrow_streets';
  severity: 'info' | 'warn' | 'critical';
}

/** Gesamtbewertung der Logistik-Infrastruktur einer geplanten Route. */
export interface InfrastructureEvaluation {
  /** Nötige Beladungen (≥1, sobald Bedarf besteht). */
  loadsRequired: number;
  /** Rückfahrten zum Nachladen (loadsRequired − 1, ≥0). */
  reloadTrips: number;
  /** Gesamtstrecke inkl. Nachlade-Rückfahrten (Kacheln). */
  totalDistanceTiles: number;
  /** Beladen zurückgelegte Strecke (Kacheln). */
  loadedDistanceTiles: number;
  /** Leer zurückgelegte Strecke — Nachlade-Rückfahrten (Kacheln). */
  emptyDistanceTiles: number;
  /** §19 Leerfahrtanteil 0..1 (leere ÷ gesamte Strecke). */
  emptyTravelRatio: number;
  /** Geradheit 0..1 (Luftlinienkette der Stopps ÷ gefahrene Strecke). */
  routeDirectness: number;
  /** Fahrzeugeignung 0..1 (Kapazität vs. Bedarf, Handling in engen Straßen). */
  vehicleSuitability: number;
  /** Quellenlage 0..1 (Nähe der Quelle zu den Zielen). */
  warehousePlacementScore: number;
  /** Verkehrslast 0..1 (aus der Routenanalyse übernommen). */
  congestionScore: number;
  /** Fahrzeit inkl. Lade-/Entladezeiten (ms). */
  estimatedDurationMs: number;
  /** Reine Fahrzeit inkl. Leerfahrten, ohne Be-/Entladen (ms). */
  drivingDurationMs: number;
  /** Summe der Lade-/Entladezeiten (ms). */
  handlingDurationMs: number;
  /** §12 Verderbrisiko 0..1 (verderbliche Ladung ohne Kühlung, lange Fahrt). */
  spoilageRisk: number;
  warnings: InfrastructureWarning[];
}

export interface InfrastructureEvalInput {
  source: { x: number; y: number };
  /** Ziele in gewählter Reihenfolge (mit Position). */
  targets: readonly { id: string; x: number; y: number }[];
  /** Forward-Routenanalyse derselben Reihenfolge (Strecke/Verkehr/Straßenanteil). */
  route: RouteAnalysis;
  /** Ladungsplan (Kapazität/Etappen); `undefined` bei Aktivitäten ohne Ladung. */
  cargo?: CargoPlan;
  vehicle?: ActivityVehicleDef;
  /** §12: transportiert die Ladung verderbliche Ware? */
  perishable?: boolean;
}

// Benannte Bewertungs-Konstanten (keine magischen Literale).
const DEFAULT_LOAD_TIME_SEC = 8;
const DEFAULT_UNLOAD_TIME_SEC_PER_TARGET = 5;
/** Distanz (Kacheln), ab der eine Quelle als „weit von den Zielen" gilt. */
const WAREHOUSE_DISTANCE_NORM = 44;
/** Ab diesem Leerfahrtanteil warnt die Bewertung. */
const EMPTY_TRAVEL_WARN = 0.35;
/** Ab so vielen Nachlade-Rückfahrten warnt die Bewertung. */
const MANY_RELOADS_WARN = 2;
/** Unter dieser Eignung warnt die Bewertung. */
const SUITABILITY_WARN = 0.5;
/** Kapazität über dem Faktor × Bedarf gilt als überdimensioniert. */
const OVERSIZED_VEHICLE_FACTOR = 4;
/** Fahrzeit (ms), ab der verderbliche Ware ohne Kühlung voll leidet. */
const SPOILAGE_FULL_MS = 120_000;

const aerial = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y);
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/**
 * Bewertet die Logistik-Infrastruktur einer Route (§19). Modell: Das Fahrzeug
 * startet beladen an der Quelle und liefert die Ziele in Reihenfolge. Reicht die
 * Ladung nicht, fährt es zur Quelle zurück (LEER) und lädt nach — genau diese
 * Rückfahrten sind der Leerfahrtanteil. Reihenfolge und Fahrzeugklasse bestimmen
 * damit, wie viel „unproduktive" Strecke entsteht. Rein deterministisch.
 */
export function evaluateInfrastructure(input: InfrastructureEvalInput): InfrastructureEvaluation {
  const { source, targets, route, cargo, vehicle } = input;
  const posOf = new Map(targets.map((t) => [t.id, t] as const));

  const loadsRequired = cargo ? Math.max(cargo.totalRequired > 0 ? 1 : 0, cargo.loadsRequired) : targets.length > 0 ? 1 : 0;
  const reloadTrips = Math.max(0, loadsRequired - 1);

  // Leer-/Nachlade-Strecke: an jeder Load-Grenze zurück zur Quelle (leer) und
  // wieder hinaus (beladen). Grenzen ergeben sich aus den Delivery-Etappen.
  const deliveryLegs = cargo ? cargo.legs.filter((l) => l.type === 'delivery') : [];
  let emptyDistance = 0;
  let reApproach = 0;
  for (let j = 0; j < deliveryLegs.length - 1; j++) {
    const boundaryId = deliveryLegs[j]!.targetIds.at(-1);
    const resumeId = deliveryLegs[j + 1]!.targetIds[0];
    const boundaryPos = boundaryId ? posOf.get(boundaryId) : undefined;
    const resumePos = resumeId ? posOf.get(resumeId) : undefined;
    if (boundaryPos) emptyDistance += aerial(boundaryPos, source);
    if (resumePos) reApproach += aerial(source, resumePos);
  }

  const loadedDistance = route.distanceTiles + reApproach;
  const totalDistance = loadedDistance + emptyDistance;
  const emptyTravelRatio = totalDistance > 0 ? clamp01(emptyDistance / totalDistance) : 0;

  // Geradheit: Luftlinienkette aller Stopps ÷ tatsächlich gefahrene Strecke.
  let aerialChain = 0;
  let prev = source;
  for (const t of targets) {
    aerialChain += aerial(prev, t);
    prev = t;
  }
  const routeDirectness = route.distanceTiles > 0 ? clamp01(aerialChain / route.distanceTiles) : 1;

  // Quellenlage: mittlere Luftliniendistanz Quelle↔Ziele, normiert (nah = gut).
  const meanSourceDist = targets.length > 0 ? targets.reduce((s, t) => s + aerial(source, t), 0) / targets.length : 0;
  const warehousePlacementScore = clamp01(1 - meanSourceDist / WAREHOUSE_DISTANCE_NORM);

  const congestionScore = clamp01(
    route.segments.length > 0 ? route.segments.reduce((s, seg) => s + seg.congestionScore, 0) / route.segments.length : 0,
  );

  // Fahrzeugeignung: Kapazitätspassung (wenig Nachladen, keine Übergröße) ×
  // Handling in engen/vollen Straßen. Zu großes Fahrzeug ist leicht ineffizient.
  const oversizedTargets = cargo?.oversizedTargetIds.length ?? 0;
  let capacityScore = clamp01(1 - reloadTrips * 0.18 - oversizedTargets * 0.12);
  const capacity = cargo?.capacity ?? vehicle?.capacity ?? 0;
  const demand = cargo?.totalRequired ?? 0;
  if (demand > 0 && capacity > OVERSIZED_VEHICLE_FACTOR * demand) capacityScore = clamp01(capacityScore - 0.15);
  const handling = vehicle?.handling ?? 3;
  const narrow = vehicle?.narrowStreetPenalty ?? 0;
  const handlingPenalty = congestionScore * narrow * (1 - handling / 5);
  const vehicleSuitability = clamp01(capacityScore * (1 - handlingPenalty));

  // Fahrzeit: effektive ms/Kachel aus der Routenanalyse (inkl. Verkehr), auf die
  // Gesamtstrecke inkl. Leerfahrten hochgerechnet, mit Fahrzeugtempo + Engstraßen.
  const perTileMs = route.distanceTiles > 0 ? route.estimatedDurationMs / route.distanceTiles : 0;
  const speedFactor = vehicle && vehicle.speedKph > 0 ? 60 / vehicle.speedKph : 1;
  const narrowFactor = 1 + narrow * congestionScore;
  const drivingDurationMs = Math.round(perTileMs * totalDistance * speedFactor * narrowFactor);

  const loadTimeSec = vehicle?.loadTimeSec ?? DEFAULT_LOAD_TIME_SEC;
  const unloadPerTarget = vehicle?.unloadTimeSecPerTarget ?? DEFAULT_UNLOAD_TIME_SEC_PER_TARGET;
  const handlingDurationMs = Math.round((loadsRequired * loadTimeSec + targets.length * unloadPerTarget) * 1000);
  const estimatedDurationMs = drivingDurationMs + handlingDurationMs;

  // Verderb: verderbliche Ladung ohne Kühlung leidet mit der Fahrzeit.
  const cooled = vehicle?.cooling ?? false;
  const spoilageRisk =
    input.perishable && !cooled ? clamp01(0.25 + 0.75 * Math.min(1, drivingDurationMs / SPOILAGE_FULL_MS)) : 0;

  const warnings: InfrastructureWarning[] = [];
  if (oversizedTargets > 0) warnings.push({ code: 'oversized_target', severity: 'critical' });
  if (reloadTrips >= MANY_RELOADS_WARN) warnings.push({ code: 'many_reloads', severity: 'warn' });
  if (emptyTravelRatio > EMPTY_TRAVEL_WARN) warnings.push({ code: 'high_empty_travel', severity: 'warn' });
  if (vehicleSuitability < SUITABILITY_WARN) warnings.push({ code: 'low_vehicle_suitability', severity: 'warn' });
  if (demand > 0 && capacity > OVERSIZED_VEHICLE_FACTOR * demand)
    warnings.push({ code: 'oversized_vehicle', severity: 'info' });
  if (input.perishable && !cooled)
    warnings.push({ code: 'perishable_no_cooling', severity: spoilageRisk > 0.5 ? 'warn' : 'info' });
  if (route.roadCoverage < 1)
    warnings.push({ code: 'incomplete_road', severity: route.roadCoverage < 0.5 ? 'warn' : 'info' });
  if (narrow > 0 && congestionScore > 0.5 && handling <= 2) warnings.push({ code: 'narrow_streets', severity: 'warn' });

  return {
    loadsRequired,
    reloadTrips,
    totalDistanceTiles: Math.round(totalDistance * 100) / 100,
    loadedDistanceTiles: Math.round(loadedDistance * 100) / 100,
    emptyDistanceTiles: Math.round(emptyDistance * 100) / 100,
    emptyTravelRatio: Math.round(emptyTravelRatio * 100) / 100,
    routeDirectness: Math.round(routeDirectness * 100) / 100,
    vehicleSuitability: Math.round(vehicleSuitability * 100) / 100,
    warehousePlacementScore: Math.round(warehousePlacementScore * 100) / 100,
    congestionScore: Math.round(congestionScore * 100) / 100,
    estimatedDurationMs,
    drivingDurationMs,
    handlingDurationMs,
    spoilageRisk: Math.round(spoilageRisk * 100) / 100,
    warnings,
  };
}

/**
 * Simuliert ausschließlich die Ladung auf einer bereits manuell gezeichneten
 * Route. Startladung und Nachfüllen geschehen nur am echten Quellanker.
 *
 * § Overhaul 8.0 / §3.1 — Der frühere Fehler „4/5 Stopps": Ein Ziel wurde beim
 * ERSTEN Kontakt dauerhaft abgehakt. Fuhr der Spieler leer daran vorbei, zur
 * Quelle zurück, füllte nach und kam wieder — der zweite, gültige Kontakt wurde
 * ignoriert und das Ziel blieb für immer „ungültig". Jetzt bleibt ein Ziel offen,
 * bis seine Menge wirklich übergeben wurde; jeder spätere Kontakt zählt erneut.
 * Ein erfolgloser Kontakt wird als `skipped`-Stopp sichtbar dokumentiert, statt
 * die Route still zu entwerten.
 */
export function evaluateCargoRoute(
  plan: CargoPlan,
  source: CargoRouteAnchor,
  targets: readonly CargoRouteAnchor[],
  roadPath: readonly { x: number; y: number }[],
): CargoRouteEvaluation {
  const requirements = new Map(plan.requirements.map((requirement) => [requirement.targetId, requirement.amount]));
  const targetByTile = new Map(targets.map((target) => [`${target.x},${target.y}`, target]));
  const delivered = new Set<string>();
  const touched = new Set<string>();
  const stops: CargoRouteStop[] = [];
  let remainingAmount = plan.totalRequired;
  let cargo = Math.min(plan.capacity, remainingAmount);
  let deliveredAmount = 0;
  let emptyTravelTiles = 0;

  if (roadPath.length > 0 && cargo > 0) {
    stops.push({
      type: 'source',
      buildingId: source.buildingId,
      pathIndex: 0,
      amount: cargo,
      cargoAfter: cargo,
      status: 'completed',
    });
  }

  for (let index = 1; index < roadPath.length; index += 1) {
    if (cargo <= 0) emptyTravelTiles += 1;
    const point = roadPath[index]!;
    const atSource = point.x === source.x && point.y === source.y;
    if (atSource) {
      const availableToLoad = Math.max(0, remainingAmount - cargo);
      const amount = Math.min(Math.max(0, plan.capacity - cargo), availableToLoad);
      if (amount > 0) {
        // § R5: Pflicht oder Kür? Vorausschau auf dem echten Weg — das nächste noch
        // offene Ziel entscheidet. Reicht die Ladung VOR dem Nachladen dafür nicht,
        // ist dieser Halt zwingend; sonst füllt er nur auf.
        const cargoBefore = cargo;
        let requiredFor: string | undefined;
        for (let ahead = index + 1; ahead < roadPath.length; ahead++) {
          const nextPoint = roadPath[ahead]!;
          const nextTarget = targetByTile.get(`${nextPoint.x},${nextPoint.y}`);
          if (!nextTarget || delivered.has(nextTarget.buildingId)) continue;
          const need = requirements.get(nextTarget.buildingId) ?? 0;
          if (need > 0 && cargoBefore < need) requiredFor = nextTarget.buildingId;
          break; // nur das unmittelbar nächste Ziel ist entscheidend
        }
        cargo += amount;
        stops.push({
          type: 'resupply',
          buildingId: source.buildingId,
          pathIndex: index,
          amount,
          cargoAfter: cargo,
          status: 'completed',
          required: requiredFor !== undefined,
          ...(requiredFor ? { requiredForBuildingId: requiredFor } : {}),
        });
      }
      continue;
    }

    const target = targetByTile.get(`${point.x},${point.y}`);
    // Bereits vollständig beliefert: erneutes Vorbeifahren ist Durchfahrt.
    if (!target || delivered.has(target.buildingId)) continue;
    const amount = requirements.get(target.buildingId) ?? 0;
    if (amount <= 0 || cargo < amount) {
      // Zu wenig Ladung: der Kontakt wird EINMAL als übersprungen dokumentiert,
      // das Ziel bleibt aber offen und kann nach dem Nachfüllen bedient werden.
      if (!touched.has(target.buildingId)) {
        touched.add(target.buildingId);
        stops.push({
          type: 'delivery',
          buildingId: target.buildingId,
          pathIndex: index,
          amount: 0,
          cargoAfter: cargo,
          status: 'skipped',
        });
      }
      continue;
    }
    touched.add(target.buildingId);
    cargo -= amount;
    remainingAmount -= amount;
    deliveredAmount += amount;
    delivered.add(target.buildingId);
    stops.push({
      type: 'delivery',
      buildingId: target.buildingId,
      pathIndex: index,
      amount,
      cargoAfter: cargo,
      status: 'completed',
    });
  }

  const plannedResupplies = stops.filter((stop) => stop.type === 'resupply').length;
  const requiredResupplies = Math.max(0, plan.loadsRequired - 1);
  const travelTiles = Math.max(0, roadPath.length - 1);
  // Nur wirklich berührte, aber unbeliefert gebliebene Ziele sind ein Problem;
  // nie angefahrene Ziele fehlen schlicht noch in der Route.
  const invalidTargetIds = [...touched].filter((id) => !delivered.has(id));
  return {
    stops,
    orderedTargetIds: stops
      .filter((stop) => stop.type === 'delivery' && stop.status === 'completed')
      .map((stop) => stop.buildingId),
    invalidTargetIds,
    plannedResupplies,
    requiredResupplies,
    deliveredAmount,
    remainingAmount,
    cargoAtEnd: cargo,
    emptyTravelTiles,
    emptyTravelRatio: travelTiles > 0 ? emptyTravelTiles / travelTiles : 0,
    cargoValid: invalidTargetIds.length === 0 && delivered.size === targets.length && remainingAmount === 0,
    progress: {
      deliveryTargetsCompleted: delivered.size,
      deliveryTargetsTotal: targets.length,
      resupplyStopsCompleted: plannedResupplies,
      resupplyStopsTotal: Math.max(plannedResupplies, requiredResupplies),
      returnRequired: false,
      returnCompleted: false,
    },
  };
}
