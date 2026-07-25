// networkSegments (v0.96, Infrastruktur 2.0 / I3) — zerlegt das EINE vorhandene
// Straßennetz (`derived.roadNetwork`) in seine zusammenhängenden Teilnetze und sagt,
// welches davon das Stadtnetz ist.
//
// Warum: Seit v0.92 seedet ein Anleger den Straßengraphen wie ein Distriktzentrum,
// damit hinter Wasser überhaupt gebaut werden kann. `roadNetwork` ist aber EIN flaches
// Set — ein isoliertes Anleger-Netz war dadurch nicht vom Stadtnetz unterscheidbar.
// Genau diese Unterscheidung macht den Anleger erst zum *Netzknoten* (§I3): Straße →
// Anleger → Schiff → Anleger → Straße.
//
// Kein zweiter Verkehrsgraph (§2/§8): Eingabe ist ausschließlich das bestehende
// `roadNetwork`; hier werden nur seine Komponenten benannt und klassifiziert. Rein,
// deterministisch, ohne Renderer/React — wird einmal je `computeDerived` gebaut.

import type { GameConfig } from '../config/index.ts';
import type { GameState } from '../types.ts';

export type RoadSegmentKind = 'city' | 'local';

export interface RoadSegment {
  /** Deterministisch: kleinste Kachel (nach y, dann x) des Teilnetzes. */
  id: string;
  kind: RoadSegmentKind;
  /** Kachelanzahl — Größe des Teilnetzes. */
  tileCount: number;
  /** Aktive Anleger/Häfen, die an dieses Teilnetz grenzen (sortiert). */
  harborIds: string[];
}

export interface RoadSegmentIndex {
  segments: RoadSegment[];
  /** Kachelschlüssel `"x,y"` → Segment-Id. */
  byTile: Map<string, string>;
  /** Id des Stadtnetzes (Teilnetz am Distriktzentrum), falls vorhanden. */
  citySegmentId?: string;
}

interface Footprint {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Orthogonale Kanten-Adjazenz zu einem Footprint (kein Diagonal-Eck) — dieselbe
 * Regel, mit der `computeRoadNetwork` seine Saatpunkte bestimmt.
 */
function touchesFootprintEdge(x: number, y: number, f: Footprint): boolean {
  const inBox = x >= f.x - 1 && x <= f.x + f.w && y >= f.y - 1 && y <= f.y + f.h;
  if (!inBox) return false;
  const cornerX = x === f.x - 1 || x === f.x + f.w;
  const cornerY = y === f.y - 1 || y === f.y + f.h;
  return !(cornerX && cornerY);
}

/** Sortierschlüssel für stabile, gitterorientierte Reihenfolge (y vor x). */
function tileOrder(key: string): number {
  const comma = key.indexOf(',');
  const x = Number(key.slice(0, comma));
  const y = Number(key.slice(comma + 1));
  return y * 100000 + x;
}

/**
 * Zerlegt `roadNetwork` in zusammenhängende Teilnetze. Ein Teilnetz ist `city`,
 * sobald es ein Distriktzentrum berührt — alles andere ist ein `local`-Netz
 * (typisch: das lokale Straßennetz hinter einer Wasserverbindung an einem Anleger).
 */
export function computeRoadSegments(
  state: GameState,
  config: GameConfig,
  roadNetwork: Set<string>,
): RoadSegmentIndex {
  const districtFootprints: Footprint[] = [];
  const harborFootprints: Footprint[] = [];

  for (const district of Object.values(state.world.districts)) {
    const center = state.buildings[district.centerBuildingId];
    if (!center) continue;
    const def = config.buildings.get(center.defId);
    if (def) districtFootprints.push({ id: center.id, x: center.x, y: center.y, w: def.size.w, h: def.size.h });
  }
  for (const building of Object.values(state.buildings)) {
    if (building.status !== 'active') continue;
    const def = config.buildings.get(building.defId);
    if (def?.waterfront) {
      harborFootprints.push({ id: building.id, x: building.x, y: building.y, w: def.size.w, h: def.size.h });
    }
  }

  const byTile = new Map<string, string>();
  const segments: RoadSegment[] = [];
  let citySegmentId: string | undefined;

  // Deterministische Startreihenfolge: unabhängig von der Einfügereihenfolge im Set.
  const ordered = [...roadNetwork].sort((a, b) => tileOrder(a) - tileOrder(b));

  for (const start of ordered) {
    if (byTile.has(start)) continue;
    // BFS über die Komponente.
    const tiles: string[] = [];
    const queue = [start];
    byTile.set(start, start); // vorläufig; die endgültige Id folgt unten
    while (queue.length > 0) {
      const key = queue.pop() as string;
      tiles.push(key);
      const comma = key.indexOf(',');
      const x = Number(key.slice(0, comma));
      const y = Number(key.slice(comma + 1));
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const next = `${x + dx},${y + dy}`;
        if (roadNetwork.has(next) && !byTile.has(next)) {
          byTile.set(next, start);
          queue.push(next);
        }
      }
    }

    // `start` ist durch die sortierte Iteration bereits die kleinste Kachel.
    const id = start;
    let kind: RoadSegmentKind = 'local';
    const harborIds = new Set<string>();
    for (const key of tiles) {
      const comma = key.indexOf(',');
      const x = Number(key.slice(0, comma));
      const y = Number(key.slice(comma + 1));
      if (kind === 'local' && districtFootprints.some((f) => touchesFootprintEdge(x, y, f))) kind = 'city';
      for (const harbor of harborFootprints) {
        if (touchesFootprintEdge(x, y, harbor)) harborIds.add(harbor.id);
      }
    }
    if (kind === 'city') citySegmentId ??= id;
    segments.push({ id, kind, tileCount: tiles.length, harborIds: [...harborIds].sort() });
  }

  return { segments, byTile, ...(citySegmentId ? { citySegmentId } : {}) };
}

/** Teilnetz einer Kachel (falls sie zum verbundenen Netz gehört). */
export function segmentAtTile(index: RoadSegmentIndex, x: number, y: number): RoadSegment | undefined {
  const id = index.byTile.get(`${x},${y}`);
  return id ? index.segments.find((segment) => segment.id === id) : undefined;
}

/**
 * Teilnetz an der Landkante eines Gebäude-Footprints — die Straße, an der das
 * Gebäude tatsächlich hängt.
 */
export function segmentForFootprint(
  index: RoadSegmentIndex,
  x: number,
  y: number,
  w: number,
  h: number,
): RoadSegment | undefined {
  const footprint: Footprint = { id: '', x, y, w, h };
  for (const [tileKey, segmentId] of index.byTile) {
    const comma = tileKey.indexOf(',');
    const tx = Number(tileKey.slice(0, comma));
    const ty = Number(tileKey.slice(comma + 1));
    if (touchesFootprintEdge(tx, ty, footprint)) {
      return index.segments.find((segment) => segment.id === segmentId);
    }
  }
  return undefined;
}
