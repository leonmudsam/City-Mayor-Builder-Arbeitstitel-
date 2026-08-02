// § Stadtarbeit-Overhaul, Phase P2 — EIN Auftragsmodell für alle Aufgabenarten.
//
// Ein Transportauftrag beantwortet sechs Fragen an EINER Stelle: wo wird
// gestartet, was liegt auf dem Fahrzeug, welche Stopps mit welcher Aktion,
// welche Ziele sind Pflicht, wie dringend — und wer fährt.
//
// **Kein zweites Logistiksystem (CLAUDE.md §2/§8).** Ladung und Stopps sind eine
// reine PROJEKTION der bestehenden `CargoRouteEvaluation` aus `logistics.ts`:
// Dieses Modul erfindet keine Menge, keinen Weg und keine Reihenfolge, es
// benennt nur, was dort bereits auf dem echten gezeichneten Weg berechnet wurde.
// Wer hier eine Zahl ergänzt, die `logistics.ts` nicht kennt, hat ein zweites
// Modell angelegt.
//
// Reine Simulation: kein three/react/zustand, kein RNG, keine Zeit, kein State.
// Dieselben Eingaben liefern immer denselben Auftrag.

import type {
  BuildingInstanceId,
  DriveVehicle,
  ResourceId,
  TransportMode,
  TransportPriority,
  TransportStopAction,
} from '../types.ts';
import type { ActivityStopStatus, CargoPlan, CargoRouteEvaluation, CargoRouteStop } from './logistics.ts';

export type { TransportMode, TransportPriority, TransportStopAction };

/**
 * Aufzählbare Vokabellisten (D-046): `t()` gibt einen fehlenden Schlüssel roh
 * aus, TypeScript kann das nicht fangen — ein aufzählender Test schon. Wer einen
 * Modus/eine Aktion ergänzt, muss hier vorbei und fällt im Test auf, wenn die
 * Beschriftung fehlt.
 */
export const TRANSPORT_MODES = ['auto', 'manual'] as const;
export const TRANSPORT_PRIORITIES = ['low', 'normal', 'high'] as const;
export const TRANSPORT_STOP_ACTIONS = ['load', 'unload', 'reload', 'wait'] as const;

/** Standard, solange der Spieler nichts wählt: die Stadt fährt (D-039). */
export const DEFAULT_TRANSPORT_MODE: TransportMode = 'auto';
export const DEFAULT_TRANSPORT_PRIORITY: TransportPriority = 'normal';

/**
 * Übersetzung der bestehenden Stopp-Typen in die Auftragssprache (§5). Total
 * über `CargoRouteStop['type']` — ein neuer Stopp-Typ in `logistics.ts` fällt
 * hier sofort im Compiler auf, statt still als „irgendwas" durchzulaufen.
 */
export const STOP_ACTION_BY_CARGO_TYPE: Record<CargoRouteStop['type'], TransportStopAction> = {
  source: 'load',
  delivery: 'unload',
  resupply: 'reload',
};

/** Eine Ladungsposition des Auftrags. */
export interface TransportCargo {
  resource: ResourceId;
  /** Zu transportierende Gesamtmenge über alle Ziele. */
  amount: number;
}

/** Ein Halt der Tour — Typ, Ort, Aktion. Mehr braucht die Liste nicht (§5). */
export interface TransportStop {
  buildingId: BuildingInstanceId;
  action: TransportStopAction;
  /** Bewegte Menge an diesem Halt (0 bei `wait`). */
  amount: number;
  resource?: ResourceId;
  /**
   * Pflichtstopp: ohne ihn geht ein Ziel leer aus. Für Lieferziele immer `true`,
   * für Nachladestopps übernimmt es die Vorausschau aus `logistics.ts`.
   */
  required: boolean;
  /** Nur bei `reload`: das Ziel, das ohne diesen Halt leer ausginge. */
  requiredForBuildingId?: string;
  status: ActivityStopStatus;
}

/**
 * Der eine Auftrag (§9). Gilt für Lieferung, Inspektion und jede spätere
 * Aufgabenart — Felder, die eine Art nicht kennt, bleiben leer, statt dass eine
 * zweite Struktur entsteht.
 */
export interface TransportOrder {
  defId: string;
  /** Startpunkt/Quelle. Fehlt nur, wenn die Aufgabe keinen Anker hat (Inspektion). */
  start?: BuildingInstanceId;
  vehicle?: DriveVehicle;
  cargo: TransportCargo[];
  stops: TransportStop[];
  /** Pflichtziele in gefahrener Reihenfolge. */
  targets: BuildingInstanceId[];
  priority: TransportPriority;
  mode: TransportMode;
}

export interface TransportOrderInput {
  defId: string;
  start?: BuildingInstanceId;
  vehicle?: DriveVehicle;
  targets: BuildingInstanceId[];
  mode?: TransportMode;
  priority?: TransportPriority;
  /** Ladungsplanung der Aktivität (aus `planCargo`), falls es eine Ladung gibt. */
  cargoPlan?: CargoPlan;
  /** Projektion des gezeichneten Weges (aus `evaluateCargoRoute`). */
  cargoRoute?: CargoRouteEvaluation;
}

/**
 * Baut den Auftrag aus dem, was Planung und Wegprojektion bereits wissen.
 *
 * Ohne `cargoRoute` bleibt `stops` leer — eine Aufgabe ohne gezeichneten Weg hat
 * schlicht noch keine Halte, und geschätzte Halte wären erfunden. Ebenso bleibt
 * `cargo` leer, wenn die Aktivität nichts transportiert (Inspektion).
 */
export function buildTransportOrder(input: TransportOrderInput): TransportOrder {
  const cargo: TransportCargo[] = [];
  if (input.cargoPlan && input.cargoPlan.totalRequired > 0) {
    cargo.push({ resource: input.cargoPlan.resource, amount: input.cargoPlan.totalRequired });
  }
  const stops: TransportStop[] = (input.cargoRoute?.stops ?? []).map((stop) => ({
    buildingId: stop.buildingId,
    action: STOP_ACTION_BY_CARGO_TYPE[stop.type],
    amount: stop.amount,
    ...(input.cargoPlan ? { resource: input.cargoPlan.resource } : {}),
    // Ein Lieferziel ist per Definition Pflicht; beim Nachladen entscheidet die
    // Vorausschau (§ R5), ob es ohne diesen Halt nicht weitergeht.
    required: stop.type === 'resupply' ? stop.required === true : true,
    ...(stop.requiredForBuildingId ? { requiredForBuildingId: stop.requiredForBuildingId } : {}),
    status: stop.status,
  }));
  return {
    defId: input.defId,
    ...(input.start ? { start: input.start } : {}),
    ...(input.vehicle ? { vehicle: input.vehicle } : {}),
    cargo,
    stops,
    // Die gefahrene Reihenfolge der Wegprojektion gewinnt; sie ist die Wahrheit
    // über die Tour. Ohne Weg bleibt die übergebene Planungsreihenfolge stehen.
    targets: input.cargoRoute?.orderedTargetIds.length
      ? [...input.cargoRoute.orderedTargetIds]
      : [...input.targets],
    priority: input.priority ?? DEFAULT_TRANSPORT_PRIORITY,
    mode: input.mode ?? DEFAULT_TRANSPORT_MODE,
  };
}

/** Halte, die der Spieler nicht auslassen darf (Anzeige/Warnung). */
export function requiredStops(order: TransportOrder): TransportStop[] {
  return order.stops.filter((stop) => stop.required);
}

/**
 * Prämienfaktor der gewählten Ausführungsart (§ MODUS 1/2 des Auftrags).
 *
 * `auto` zahlt genau die reguläre Prämie — Bequemlichkeit ist kostenlos, nicht
 * bestraft. `manual` zahlt den konfigurierten Aufschlag; er ist der einzige
 * mechanische Unterschied und liegt als Config-Wert vor, nicht als Literal im
 * Code. Ein fehlender/ungültiger Config-Wert fällt still auf 1 zurück, damit
 * eine Fehlkonfiguration niemals Geld verschenkt.
 */
export function modeRewardFactor(mode: TransportMode, manualBonusFactor: number | undefined): number {
  if (mode !== 'manual') return 1;
  if (typeof manualBonusFactor !== 'number' || !Number.isFinite(manualBonusFactor) || manualBonusFactor < 1) {
    return 1;
  }
  return manualBonusFactor;
}
