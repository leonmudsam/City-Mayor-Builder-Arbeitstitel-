import type { CargoPlan, InfrastructureEvaluation } from '../../game/activities/logistics.ts';
import type { RouteAnalysis } from '../../game/activities/routeAnalysis.ts';
import type { DriveVehicle } from '../../game/config/types.ts';

export interface SmartRouteReader {
  analyseActivityRoute(defId: string, orderedTargetIds: string[]): RouteAnalysis | undefined;
  getActivityCargoPlan(
    defId: string,
    orderedTargetIds: string[],
    vehicle?: DriveVehicle,
  ): CargoPlan | undefined;
  getActivityInfrastructure(
    defId: string,
    orderedTargetIds: string[],
    vehicle?: DriveVehicle,
  ): InfrastructureEvaluation | undefined;
  getActivityRoutePreview(
    defId: string,
    candidateTargetIds: string[],
    roadPath: readonly { x: number; y: number }[],
    vehicle?: DriveVehicle,
  ): { complete: boolean } | undefined;
}

export interface SmartRouteSuggestion {
  vehicle: DriveVehicle;
  orderedTargetIds: string[];
  roadPath: { x: number; y: number }[];
  ready: boolean;
  reloadTrips: number;
  explanation: string;
}

interface RankedVehicle {
  id: DriveVehicle;
  score: number;
  reloadTrips: number;
  explanation: string;
}

/**
 * Erstellt ausschließlich einen UI-Vorschlag aus kanonischen Controller-
 * ReadModels. Die Funktion baut weder einen eigenen Straßengraphen noch
 * persistiert sie Planungszustand.
 */
export function createSmartRouteSuggestion(
  reader: SmartRouteReader,
  defId: string,
  candidateTargetIds: readonly string[],
  vehicles: readonly { id: DriveVehicle }[],
): SmartRouteSuggestion | undefined {
  if (candidateTargetIds.length === 0 || vehicles.length === 0) return undefined;
  const orderedTargetIds = suggestTargetOrder(reader, defId, candidateTargetIds);
  const rankedVehicles = rankVehicles(reader, defId, orderedTargetIds, vehicles);
  let fallback: SmartRouteSuggestion | undefined;

  for (const vehicle of rankedVehicles) {
    const roadPath = buildSmartRoadPath(reader, defId, orderedTargetIds, vehicle.id);
    if (roadPath.length < 2) continue;
    const ready = reader.getActivityRoutePreview(defId, orderedTargetIds, roadPath, vehicle.id)?.complete === true;
    const suggestion: SmartRouteSuggestion = {
      vehicle: vehicle.id,
      orderedTargetIds,
      roadPath,
      ready,
      reloadTrips: vehicle.reloadTrips,
      explanation: vehicle.explanation,
    };
    if (ready) return suggestion;
    fallback ??= suggestion;
  }

  return fallback;
}

/**
 * Ordnet Ziele greedy nach der realen Straßenentfernung. Die Distanzen und
 * Pfade selbst kommen weiterhin ausschließlich aus `analyseActivityRoute`.
 */
export function suggestTargetOrder(
  reader: Pick<SmartRouteReader, 'analyseActivityRoute'>,
  defId: string,
  candidateTargetIds: readonly string[],
): string[] {
  const remaining = [...new Set(candidateTargetIds)].sort((a, b) => a.localeCompare(b));
  const ordered: string[] = [];
  let previousTargetId: string | undefined;

  while (remaining.length > 0) {
    const ranked = remaining
      .map((candidate) => {
        const analysis = reader.analyseActivityRoute(
          defId,
          previousTargetId ? [previousTargetId, candidate] : [candidate],
        );
        const segment = analysis?.segments.at(-1);
        return {
          candidate,
          connected: segment?.onRoad === true,
          distance: segment?.distanceTiles ?? Number.POSITIVE_INFINITY,
        };
      })
      .sort(
        (a, b) =>
          Number(b.connected) - Number(a.connected) ||
          a.distance - b.distance ||
          a.candidate.localeCompare(b.candidate),
      );
    const next = ranked[0]?.candidate;
    if (!next) break;
    ordered.push(next);
    remaining.splice(remaining.indexOf(next), 1);
    previousTargetId = next;
  }

  return ordered.length === candidateTargetIds.length ? ordered : [...candidateTargetIds];
}

/**
 * Baut Quelle→Ziele inklusive notwendiger Nachlade-Rückfahrten aus den
 * kanonischen BFS-Segmenten zusammen. Jeder Abschnitt wird durch den Controller
 * berechnet; diese Funktion verbindet nur bereits validierte Polylinien.
 */
export function buildSmartRoadPath(
  reader: Pick<SmartRouteReader, 'analyseActivityRoute' | 'getActivityCargoPlan'>,
  defId: string,
  orderedTargetIds: readonly string[],
  vehicle: DriveVehicle,
): { x: number; y: number }[] {
  const cargoPlan = reader.getActivityCargoPlan(defId, [...orderedTargetIds], vehicle);
  const stops: Array<'source' | string> = ['source'];

  if (cargoPlan) {
    for (const leg of cargoPlan.legs) {
      if (leg.type === 'pickup') {
        if (stops.at(-1) !== 'source') stops.push('source');
        continue;
      }
      if (leg.type === 'delivery') stops.push(...leg.targetIds);
    }
    // Ein Auftrag mit aktuell null Transportmenge bleibt ein Fahr-Auftrag:
    // Ziele werden weiterhin besucht, statt einen leeren Geisterplan zu zeigen.
    if (stops.length === 1) stops.push(...orderedTargetIds);
  } else {
    stops.push(...orderedTargetIds);
  }

  const roadPath: { x: number; y: number }[] = [];
  for (let index = 1; index < stops.length; index += 1) {
    const segment = routeBetween(reader, defId, stops[index - 1]!, stops[index]!);
    if (!segment || !appendConnected(roadPath, segment)) return [];
  }
  return roadPath;
}

function rankVehicles(
  reader: Pick<SmartRouteReader, 'getActivityCargoPlan' | 'getActivityInfrastructure'>,
  defId: string,
  orderedTargetIds: string[],
  vehicles: readonly { id: DriveVehicle }[],
): RankedVehicle[] {
  return vehicles
    .map(({ id }) => {
      const cargo = reader.getActivityCargoPlan(defId, orderedTargetIds, id);
      const infrastructure = reader.getActivityInfrastructure(defId, orderedTargetIds, id);
      const reloadTrips = infrastructure?.reloadTrips ?? Math.max(0, (cargo?.loadsRequired ?? 1) - 1);
      const oversized = cargo?.oversizedTargetIds.length ?? 0;
      const criticalWarnings = infrastructure?.warnings.filter((warning) => warning.severity === 'critical').length ?? 0;
      const suitabilityPenalty = 1 - (infrastructure?.vehicleSuitability ?? 1);
      const duration = infrastructure?.estimatedDurationMs ?? Number.MAX_SAFE_INTEGER / 1_000;
      const score =
        oversized * 1_000_000_000 +
        criticalWarnings * 100_000_000 +
        reloadTrips * 10_000_000 +
        suitabilityPenalty * 100_000 +
        duration;
      const explanation =
        oversized > 0
          ? 'Größte verfügbare Kapazität; einzelne Lieferungen brauchen mehrere Fahrten.'
          : reloadTrips === 0
            ? 'Passt zur gesamten Ladung – kein Nachladen nötig.'
            : `${reloadTrips} automatische Nachladefahrt${reloadTrips === 1 ? '' : 'en'} eingeplant.`;
      return { id, score, reloadTrips, explanation };
    })
    .sort((a, b) => a.score - b.score || a.id.localeCompare(b.id));
}

function routeBetween(
  reader: Pick<SmartRouteReader, 'analyseActivityRoute'>,
  defId: string,
  from: 'source' | string,
  to: 'source' | string,
): { x: number; y: number }[] | undefined {
  if (from === to) return [];
  if (from === 'source' && to !== 'source') {
    const segment = reader.analyseActivityRoute(defId, [to])?.segments[0];
    return segment?.onRoad ? segment.path.map((point) => ({ ...point })) : undefined;
  }
  if (from !== 'source' && to === 'source') {
    const segment = reader.analyseActivityRoute(defId, [from])?.segments[0];
    return segment?.onRoad ? [...segment.path].reverse().map((point) => ({ ...point })) : undefined;
  }
  if (from !== 'source' && to !== 'source') {
    const segment = reader.analyseActivityRoute(defId, [from, to])?.segments[1];
    return segment?.onRoad ? segment.path.map((point) => ({ ...point })) : undefined;
  }
  return undefined;
}

function appendConnected(
  destination: { x: number; y: number }[],
  segment: readonly { x: number; y: number }[],
): boolean {
  if (segment.length === 0) return true;
  if (destination.length === 0) {
    destination.push(...segment.map((point) => ({ ...point })));
    return true;
  }
  const tail = destination.at(-1)!;
  const head = segment[0]!;
  if (tail.x !== head.x || tail.y !== head.y) return false;
  destination.push(...segment.slice(1).map((point) => ({ ...point })));
  return true;
}
