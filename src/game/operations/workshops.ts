// Umwandlungsbetriebe (§ Wirtschafts-/Lieferketten-Overhaul §4/§5). Reine
// Simulation — kein Renderer/React (CLAUDE.md §1).
//
// Eine Werkstatt veredelt EINE Ware zu EINER anderen: Holz → Bretter,
// Stein → Werkstein. Sie hat **kein Arbeitsgebiet** (ausdrückliche Vorgabe des
// Auftrags), also keinen Knotentyp, keine laufenden Arbeiter und keine
// Standortgüte. Was sie hat, ist ein eigenes Lager — und genau das macht die
// Lieferkette zum Spiel: Ohne Anlieferung steht sie still, egal wie voll die
// Stadtbilanz ist.
//
// KEIN DRITTES LAGERMODELL (§2/§8): Es ist dasselbe `BuildingInventory` und
// dieselbe `operations.inventories`-Map wie beim Sägewerk seit Save v17. Der
// einzige Unterschied ist, dass hier ZWEI Waren nebeneinander liegen; die
// Teilung in Eingangs- und Ausgangsplatz macht `conversionStage`, nicht ein
// neues Feld im Save.
//
// KEINE ZWEITE WAHRHEIT ÜBER DEN DURCHSATZ (D-048): `workshopThroughput` ist
// die eine Rechnung. Der Tick verarbeitet damit, und die UI zeigt damit an —
// eine Werkstatt kann deshalb nicht „läuft" melden und stillstehen.

import type { GameConfig } from '../config/index.ts';
import type { BuildingConversionProfile, BuildingConversionStage, BuildingDef } from '../config/types.ts';
import type { Derived } from '../simulation/derived.ts';
import type { BuildingInventory, GameState, ResourceId, WorkshopSupplyRule } from '../types.ts';
import { isContributing } from '../buildings/effects.ts';
import { buildingInfrastructureStatus, isInfrastructureOperational } from '../infrastructure/buildingInfrastructure.ts';
import { ensureOperationsState, inventoryAmount } from './operations.ts';

/**
 * Standardregel einer frisch gebauten Werkstatt: an, Nachschub automatisch,
 * 80 % verarbeiten. Die 20 % Reserve sind kein Balancing-Detail, sondern der
 * Grund, warum die Werkstatt beim nächsten Lieferengpass nicht sofort
 * trockenläuft — und sie sind das, was der Spieler mit dem Regler bewusst
 * verschieben kann.
 */
export const DEFAULT_SUPPLY_RULE: WorkshopSupplyRule = { enabled: true, processRatio: 0.8, priority: 1 };

/** Ist dieses Gebäude ein Umwandlungsbetrieb? */
export function isWorkshopBuilding(
  def: BuildingDef | undefined,
): def is BuildingDef & { conversion: BuildingConversionProfile } {
  return !!def?.conversion;
}

/** Werte der aktuellen Ausbaustufe (letzter Eintrag als Fallback). */
export function conversionStage(profile: BuildingConversionProfile, upgradeLevel: number): BuildingConversionStage {
  return profile.stages[Math.min(upgradeLevel, profile.stages.length - 1)]!;
}

/** Lieferregel einer Werkstatt — fehlender Eintrag heißt Standardregel. */
export function supplyRuleOf(state: GameState, buildingId: string): WorkshopSupplyRule {
  const stored = state.operations?.supplyRules?.[buildingId];
  return stored ? { ...DEFAULT_SUPPLY_RULE, ...stored } : { ...DEFAULT_SUPPLY_RULE };
}

export function setSupplyRule(state: GameState, buildingId: string, patch: Partial<WorkshopSupplyRule>): WorkshopSupplyRule {
  const ops = ensureOperationsState(state);
  ops.supplyRules ??= {};
  const next: WorkshopSupplyRule = { ...supplyRuleOf(state, buildingId), ...patch };
  next.processRatio = Math.max(0, Math.min(1, next.processRatio));
  if (next.priority !== undefined) next.priority = Math.max(0, Math.round(next.priority));
  // Ein leerer Quellen-Eintrag heißt „automatisch" — als `undefined` speichern,
  // nicht als leerer String, sonst sucht die Automatik später ein Gebäude ''.
  if (!next.sourceBuildingId) delete next.sourceBuildingId;
  ops.supplyRules[buildingId] = next;
  return next;
}

/**
 * Lager einer Werkstatt. Die Gesamtkapazität ist Eingang + Ausgang; die
 * Aufteilung erzwingt `workshopThroughput`/`storeWorkshopOutput` über die
 * Stufenwerte. So bleibt `BuildingInventory` unverändert (ein Feld `capacity`)
 * und der Save braucht keine zweite Lagerstruktur.
 */
export function ensureWorkshopInventory(state: GameState, buildingId: string, stage: BuildingConversionStage): BuildingInventory {
  const ops = ensureOperationsState(state);
  const capacity = stage.inputCapacity + stage.outputCapacity;
  let inv = ops.inventories[buildingId];
  if (!inv) {
    inv = { capacity, items: {}, reserved: {} };
    ops.inventories[buildingId] = inv;
  } else if (inv.capacity !== capacity) {
    inv.capacity = capacity; // Ausbaustufe hat das Lager vergrößert
  }
  return inv;
}

/**
 * Warum steht die Werkstatt? Aufzählbare Menge statt freier Strings — `t()`
 * gibt einen fehlenden Schlüssel roh aus, TypeScript kann das nicht fangen,
 * ein aufzählender Test schon (D-046).
 */
export const WORKSHOP_IDLE_REASONS = [
  'paused', // Spieler hat die Verarbeitung abgeschaltet
  'no_road', // ohne Anschluss kommt kein Nachschub — und nichts geht raus
  'no_input', // Eingangslager leer
  'reserve_hold', // Bestand liegt vollständig in der eingestellten Reserve
  'output_full', // Ausgangslager voll: es wird nicht abgeholt
  'constructing', // im Bau / im Ausbau
] as const;
export type WorkshopIdleReason = (typeof WORKSHOP_IDLE_REASONS)[number];

/** Alles, was Tick und Anzeige über eine Werkstatt wissen müssen. */
export interface WorkshopThroughput {
  input: ResourceId;
  output: ResourceId;
  inputPerOutput: number;
  inputStock: number;
  inputCapacity: number;
  outputStock: number;
  outputCapacity: number;
  /** Menge Rohstoff, die die Reserve schützt (= „Mindestbestand"). */
  reserve: number;
  /** Ausstoß je Minute bei voller Versorgung (Stufenwert). */
  ratePerMinute: number;
  /** Ausstoß je Minute, den die Werkstatt JETZT wirklich schafft. */
  effectivePerMinute: number;
  idleReason?: WorkshopIdleReason;
}

/**
 * Die eine Durchsatzrechnung. `dtMin` bleibt bewusst draußen: Wer die Rate
 * braucht (Anzeige), fragt `effectivePerMinute`; wer einen Zeitschritt
 * verarbeitet (Tick), multipliziert selbst. Zwei Funktionen, die dasselbe
 * unterschiedlich runden, wären genau die zweite Wahrheit, die hier vermieden
 * werden soll.
 */
export function workshopThroughput(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  buildingId: string,
): WorkshopThroughput | undefined {
  const b = state.buildings[buildingId];
  const def = b && config.buildings.get(b.defId);
  if (!b || !isWorkshopBuilding(def)) return undefined;
  const profile = def.conversion;
  const stage = conversionStage(profile, b.upgradeLevel);
  const inv = state.operations?.inventories[buildingId];
  const inputStock = inventoryAmount(inv, profile.input);
  const outputStock = inventoryAmount(inv, profile.output);
  const rule = supplyRuleOf(state, buildingId);
  const reserve = (1 - rule.processRatio) * stage.inputCapacity;

  const base: WorkshopThroughput = {
    input: profile.input,
    output: profile.output,
    inputPerOutput: profile.inputPerOutput,
    inputStock,
    inputCapacity: stage.inputCapacity,
    outputStock,
    outputCapacity: stage.outputCapacity,
    reserve,
    ratePerMinute: stage.outputPerMinute,
    effectivePerMinute: 0,
  };

  if (!isContributing(b)) return { ...base, idleReason: 'constructing' };
  if (!isInfrastructureOperational(buildingInfrastructureStatus(state, config, derived.roadNetwork, b))) {
    return { ...base, idleReason: 'no_road' };
  }
  if (!rule.enabled) return { ...base, idleReason: 'paused' };
  if (inputStock <= 0) return { ...base, idleReason: 'no_input' };

  const workable = Math.max(0, inputStock - reserve);
  if (workable <= 0) return { ...base, idleReason: 'reserve_hold' };
  const outputFree = Math.max(0, stage.outputCapacity - outputStock);
  if (outputFree <= 0) return { ...base, idleReason: 'output_full' };

  // Die Rate ist das Minimum aus drei ehrlichen Grenzen: Maschine, Rohstoff,
  // Ausgangsplatz. Der Grund für eine gedrosselte Rate steht damit implizit
  // schon im Zahlenvergleich — er wird in der UI ausgeschrieben.
  const byInput = workable / profile.inputPerOutput;
  const effective = Math.min(stage.outputPerMinute, byInput, outputFree);
  return { ...base, effectivePerMinute: effective };
}

/**
 * Ein Simulationsschritt aller Werkstätten. Läuft NUR im Live-Tick mit dem
 * bereits zeitfaktor-skalierten `dtMin` — Pause/2×/4× wirken dadurch
 * automatisch, ohne dass dieses Modul die Uhr kennt (D-038).
 *
 * Das Produkt landet im LOKALEN Ausgangslager, nicht im Pool. Erst die
 * Abholung (`advanceAutoLogistics` → `advanceTransfers`) macht es zur Ware der
 * Stadt — genau wie beim Sägewerk seit A5.
 */
export function advanceWorkshops(state: GameState, config: GameConfig, derived: Derived, dtMin: number): void {
  if (dtMin <= 0) return;
  for (const b of Object.values(state.buildings)) {
    const def = config.buildings.get(b.defId);
    if (!isWorkshopBuilding(def)) continue;
    const stage = conversionStage(def.conversion, b.upgradeLevel);
    // Das Lager wird auch für eine stillstehende Werkstatt angelegt: Ohne
    // Lagereintrag findet die Anlieferung kein Ziel, und die Werkstatt könnte
    // nie anlaufen — ein Henne-Ei-Fehler, den man erst nach Minuten bemerkt.
    const inv = ensureWorkshopInventory(state, b.id, stage);
    const flow = workshopThroughput(state, config, derived, b.id);
    if (!flow || flow.effectivePerMinute <= 0) continue;

    const produced = flow.effectivePerMinute * dtMin;
    const consumed = produced * flow.inputPerOutput;
    const haveInput = inventoryAmount(inv, flow.input);
    const take = Math.min(consumed, haveInput);
    if (take <= 0) continue;
    const made = take / flow.inputPerOutput;

    const nextInput = haveInput - take;
    if (nextInput <= 1e-6) delete inv.items[flow.input];
    else inv.items[flow.input] = nextInput;
    inv.items[flow.output] = inventoryAmount(inv, flow.output) + made;

    // Gezählt wird beim Entstehen (wie beim Fällen); die spätere Einlagerung
    // zählt NICHT erneut — sonst stünde jede Ware zweimal in der Statistik.
    state.stats.produced[flow.output] = (state.stats.produced[flow.output] ?? 0) + made;
  }
}

/**
 * Freier Eingangsplatz — die Menge, die eine Anlieferung noch aufnehmen kann.
 * Wird von der Automatik gelesen, damit kein Fahrzeug mit einer Ladung losfährt,
 * die am Ziel nicht mehr hineinpasst.
 */
export function workshopInputFree(state: GameState, config: GameConfig, buildingId: string): number {
  const b = state.buildings[buildingId];
  const def = b && config.buildings.get(b.defId);
  if (!b || !isWorkshopBuilding(def)) return 0;
  const stage = conversionStage(def.conversion, b.upgradeLevel);
  const stock = inventoryAmount(state.operations?.inventories[buildingId], def.conversion.input);
  return Math.max(0, stage.inputCapacity - stock);
}

/** Nimmt diese Werkstatt genau diese Ware als Rohstoff an? */
export function workshopAcceptsResource(def: BuildingDef | undefined, resource: ResourceId): boolean {
  return isWorkshopBuilding(def) && def.conversion.input === resource;
}
