// harborNodes (v0.96, Infrastruktur 2.0 / I3) — der Anleger als **Netzknoten**
// statt als Einzelobjekt: Straße → Anleger → (Schiff) → Anleger → Straße.
//
// Beantwortet für jeden Anleger genau die Fragen, die der Spieler vor Ort hat:
//   · Landseite  — an welchem Straßen-Teilnetz hänge ich, und ist das das Stadtnetz?
//   · Wasserseite— habe ich einen befahrbaren Wasserknoten (Tiefe/Graph)?
//   · Netz       — welche anderen Anleger erreiche ich über Wasser?
//   · Nutzen     — würde eine Schiffsverbindung mein lokales Netz an die Stadt anbinden?
//
// Reine Projektion über bestehende Bausteine (`networkSegments`, `waterNavigation`,
// `buildingInfrastructure`) — kein zweiter Graph, kein persistierter Zustand.
// Kapazität, Reisezeit, Betriebskosten und Warenfluss gehören zu den **persistenten
// Schiffsrouten (I4)** und werden hier bewusst NICHT erfunden (§ nichts vortäuschen).

import type { GameConfig } from '../config/index.ts';
import type { GameState } from '../types.ts';
import { buildingInfrastructureStatus } from './buildingInfrastructure.ts';
import { segmentForFootprint, type RoadSegmentIndex, type RoadSegmentKind } from './networkSegments.ts';
import { getAvailableHarborConnections } from './waterNavigation.ts';

export type HarborNodeProblem =
  | 'no_land_access' // keine Straße an der Landkante
  | 'no_waterway' // kein befahrbarer Wasserknoten (zu flach / kein Graph)
  | 'isolated'; // Landseite hängt nur an einem lokalen Netz, ohne Wasseranbindung an die Stadt

export interface HarborNodeStatus {
  harborId: string;
  /** Straßen-Teilnetz an der Landkante (falls überhaupt eine Straße anliegt). */
  landSegmentId?: string;
  landSegmentKind?: RoadSegmentKind;
  /** Die Landseite hängt direkt am Stadtnetz (Distriktzentrum). */
  onCityNetwork: boolean;
  /** Wasserknoten des Anlegers (aus `buildingInfrastructureStatus`). */
  waterNodeId?: string;
  /** Wasserseite ist befahrbar. */
  navigable: boolean;
  /** Über Wasser tatsächlich erreichbare andere Anleger (Route `planned`). */
  reachableHarborIds: string[];
  /**
   * Erreichbare Anleger, die am **Stadtnetz** hängen — über sie würde eine
   * Schiffsverbindung dieses lokale Netz an die Stadt anbinden (Vorbereitung I4).
   * Leer, wenn der Anleger selbst schon am Stadtnetz liegt.
   */
  linksToCityVia: string[];
  problems: HarborNodeProblem[];
}

export interface HarborNetworkOverview {
  harbors: number;
  /** Anleger mit Straße UND befahrbarem Wasser. */
  operational: number;
  /** Anleger, deren Landseite am Stadtnetz hängt. */
  onCityNetwork: number;
  /** Anleger auf einem lokalen Netz, das per Schiff an die Stadt anschließbar wäre. */
  linkableToCity: number;
  /** Straßen-Teilnetze insgesamt (inkl. Stadtnetz). */
  roadSegments: number;
  /** Lokale Teilnetze ohne Stadtanschluss. */
  localSegments: number;
}

function isHarbor(state: GameState, config: GameConfig, buildingId: string): boolean {
  const building = state.buildings[buildingId];
  return !!building && !!config.buildings.get(building.defId)?.waterfront;
}

/** Landseitiges Teilnetz eines Anlegers (Straße an seiner Footprint-Kante). */
function landSegment(
  state: GameState,
  config: GameConfig,
  segments: RoadSegmentIndex,
  harborId: string,
) {
  const building = state.buildings[harborId];
  const def = building ? config.buildings.get(building.defId) : undefined;
  if (!building || !def) return undefined;
  return segmentForFootprint(segments, building.x, building.y, def.size.w, def.size.h);
}

export function getHarborNodeStatus(
  state: GameState,
  config: GameConfig,
  roadNetwork: Set<string>,
  segments: RoadSegmentIndex,
  harborId: string,
): HarborNodeStatus | undefined {
  const building = state.buildings[harborId];
  if (!building || !isHarbor(state, config, harborId)) return undefined;

  const infrastructure = buildingInfrastructureStatus(state, config, roadNetwork, building);
  const segment = landSegment(state, config, segments, harborId);
  const onCityNetwork = segment?.kind === 'city';
  const navigable = infrastructure.waterNodeId !== undefined;

  const reachableHarborIds = navigable
    ? getAvailableHarborConnections(state, config, roadNetwork, harborId)
        .filter((connection) => connection.status === 'planned')
        .map((connection) => connection.harborId)
    : [];

  // Welche erreichbaren Anleger hängen selbst am Stadtnetz? Über die entsteht mit
  // einer Schiffsroute (I4) der Anschluss dieses lokalen Netzes an die Stadt.
  const linksToCityVia = onCityNetwork
    ? []
    : reachableHarborIds.filter((id) => landSegment(state, config, segments, id)?.kind === 'city');

  const problems: HarborNodeProblem[] = [];
  if (!segment) problems.push('no_land_access');
  if (!navigable) problems.push('no_waterway');
  if (!onCityNetwork && linksToCityVia.length === 0) problems.push('isolated');

  return {
    harborId,
    ...(segment ? { landSegmentId: segment.id, landSegmentKind: segment.kind } : {}),
    onCityNetwork,
    ...(infrastructure.waterNodeId ? { waterNodeId: infrastructure.waterNodeId } : {}),
    navigable,
    reachableHarborIds,
    linksToCityVia,
    problems,
  };
}

export function getHarborNetworkOverview(
  state: GameState,
  config: GameConfig,
  roadNetwork: Set<string>,
  segments: RoadSegmentIndex,
): HarborNetworkOverview {
  let harbors = 0;
  let operational = 0;
  let onCityNetwork = 0;
  let linkableToCity = 0;
  for (const building of Object.values(state.buildings)) {
    if (!config.buildings.get(building.defId)?.waterfront) continue;
    harbors++;
    const node = getHarborNodeStatus(state, config, roadNetwork, segments, building.id);
    if (!node) continue;
    if (node.landSegmentId && node.navigable) operational++;
    if (node.onCityNetwork) onCityNetwork++;
    else if (node.linksToCityVia.length > 0) linkableToCity++;
  }
  return {
    harbors,
    operational,
    onCityNetwork,
    linkableToCity,
    roadSegments: segments.segments.length,
    localSegments: segments.segments.filter((segment) => segment.kind === 'local').length,
  };
}
