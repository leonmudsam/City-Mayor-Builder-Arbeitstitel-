// § Stadtarbeit 3.0 / A6 — DIE HALTE DES EINSATZES.
//
// Der Auftrag schlägt ein Modell `CityWorkStop` vor: „die Liste der anfahrbaren
// Orte mit ihrer Rolle (Quelle / Ziel / Lager), Ware und Menge". Genau das
// steht hier — aber als ABLEITUNG, nicht als Save-Feld.
//
// ── Warum abgeleitet und nicht persistiert (Korrektur zu D-069) ──────────────
//
// D-069 hatte `ActiveActivity.stops` samt Migration v33→v34 vorgesehen. Beim
// Bauen zeigte sich, dass jedes einzelne Feld dieser Liste bereits im Save
// steht, nur woanders:
//
//   Quelle   → `active.sourceBuildingId`   (D-052, Save v32)
//   Ziele    → `active.targets[]`          (mit `done`)
//   Lager    → `derived.storageSites`      (D-052, aus der Config abgeleitet)
//   Ware     → `activityDef.costPerTarget` (Config)
//
// Eine persistierte Kopie wäre eine ZWEITE Wahrheit über dieselben Orte: Wer
// ein Lager abreißt, das Fahrzeug umlädt oder ein Ziel beliefert, müsste sie
// nachziehen — und die erste Stelle, die das vergisst, zeigt dem Spieler ein
// Ziel, das die Simulation nicht mehr kennt. Genau davor warnen D-052
// („der Abgleich läuft an EINER Stelle") und D-059 („Feldfolgen werden
// abgeleitet, nie gespeichert").
//
// Deshalb: Das Modell aus D-069 wird gebaut, die Migration NICHT. Save bleibt
// v33. Persistiert wird erst, wenn der Spieler an einem Halt etwas ENTSCHEIDET,
// das sich nicht ableiten lässt — bis dahin wäre ein Save-Feld nur ein Ort, an
// dem etwas veralten kann.

import type { ActivitiesConfig, BuildingDef } from '../config/types.ts';
import { stockAt } from '../economy/stockLedger.ts';
import type { Derived } from '../simulation/derived.ts';
import type { GameState, ResourceId } from '../types.ts';

/**
 * Wofür der Wagen hier anhält. Bewusst drei Rollen und nicht vier: Der Auftrag
 * nennt zusätzlich `optional`, aber es gibt im Spiel nichts, was einen Halt
 * optional MACHT — jedes Lager ist gleichermaßen anfahrbar. Eine vierte Rolle
 * ohne Unterscheidungsmerkmal wäre eine Beschriftung, keine Information.
 */
export type MissionStopRole = 'source' | 'target' | 'storage';

export interface MissionStop {
  buildingId: string;
  defId: string;
  nameKey: string;
  role: MissionStopRole;
  /** Mittelpunkt der Grundfläche — dieselbe Rechnung wie beim Zielpfeil. */
  cx: number;
  cy: number;
  /** Nur bei `target` aussagekräftig: schon beliefert? */
  done: boolean;
  /** Die Ware, um die es an diesem Halt geht (Ladung des Auftrags). */
  resource?: ResourceId;
  /**
   * Bei `target` der offene Bedarf, bei `source`/`storage` der Bestand DIESER
   * Ware an DIESEM Ort (D-052 — nicht die Bilanz der Stadt).
   */
  amount?: number;
}

/**
 * Alle Halte des laufenden Auftrags, deterministisch geordnet: erst die Quelle,
 * dann die Ziele in der Reihenfolge des Auftrags, dann die übrigen Stadtlager
 * nach Gebäude-Id (die Ordnung von `derived.storageSites`).
 *
 * Ohne laufenden Auftrag ist die Liste leer — es gibt dann nichts anzufahren,
 * und eine Liste aller Lager wäre keine Antwort auf „wo muss ich hin".
 */
export function missionStops(
  state: GameState,
  buildings: ReadonlyMap<string, BuildingDef>,
  activities: ActivitiesConfig,
  derived: Derived,
): MissionStop[] {
  const active = state.activities.active;
  if (!active) return [];
  const def = activities.activities.find((activity) => activity.id === active.defId);
  // Die Ladung des Auftrags: erste Kostenstelle je Ziel. Dieselbe Lesart wie in
  // `getCityworkBuildingInfo` — zwei Auslegungen derselben Config wären zwei
  // Angaben darüber, was der Wagen geladen hat.
  const perTarget = def?.costPerTarget;
  const resource = perTarget ? ((Object.keys(perTarget)[0] ?? undefined) as ResourceId | undefined) : undefined;
  const perTargetAmount = perTarget
    ? Object.values(perTarget).reduce<number>((sum, value) => sum + (value ?? 0), 0)
    : undefined;

  const stops: MissionStop[] = [];
  const seen = new Set<string>();

  const push = (buildingId: string, role: MissionStopRole, done: boolean, amount?: number) => {
    if (seen.has(buildingId)) return;
    const building = state.buildings[buildingId];
    const definition = building && buildings.get(building.defId);
    if (!building || !definition) return; // abgerissen: kein Halt, keine Leiche
    seen.add(buildingId);
    stops.push({
      buildingId,
      defId: building.defId,
      nameKey: definition.nameKey,
      role,
      cx: building.x + definition.size.w / 2,
      cy: building.y + definition.size.h / 2,
      done,
      ...(resource ? { resource } : {}),
      ...(amount !== undefined ? { amount } : {}),
    });
  };

  if (active.sourceBuildingId) {
    push(
      active.sourceBuildingId,
      'source',
      false,
      resource ? stockAt(state, active.sourceBuildingId, resource) : undefined,
    );
  }
  for (const target of active.targets) {
    push(target.buildingId, 'target', target.done, target.done ? 0 : perTargetAmount);
  }
  for (const site of derived.storageSites) {
    push(site.buildingId, 'storage', false, resource ? stockAt(state, site.buildingId, resource) : undefined);
  }
  return stops;
}

/**
 * Die Halte, die JETZT etwas bringen: offene Ziele und Lager, die die Ware
 * wirklich führen. Die Quelle bleibt immer dabei — sie ist der Ort, an dem die
 * Tour beginnt und an den man mit Restladung zurückkann.
 *
 * Bewusst eine eigene Funktion statt eines Filters in der Oberfläche: „führt
 * dieses Lager die Ware?" ist eine Aussage über die Simulation, keine über die
 * Darstellung — sonst entscheidet jedes Panel selbst, was es für nützlich hält.
 */
export function openMissionStops(stops: readonly MissionStop[]): MissionStop[] {
  return stops.filter((stop) => {
    if (stop.role === 'target') return !stop.done;
    if (stop.role === 'storage') return (stop.amount ?? 0) > 0;
    return true;
  });
}
