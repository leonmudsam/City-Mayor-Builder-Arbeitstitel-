// Kanonisches Höhenprofil des EINEN Straßensystems. Der Spieler zeichnet nur
// eine Straße; diese reine Domain-Projektion leitet aus derselben gebackenen
// Oberfläche wie die Platzierung automatisch Fahrbahnhöhe, Steigung und
// Bauvariante ab. Renderer und UI lesen das Ergebnis, mutieren es aber nie.

import { samplePlacementSurface, worldTerrainAt } from '../map/world.ts';
import type { GameState, RoadVariant, TerrainType } from '../types.ts';
export type { RoadVariant } from '../types.ts';

/** Eine Weltkachel entspricht laut WORLD_SCALE ungefähr vier Metern. */
export const ROAD_TILE_METERS = 4;
/** Komfortziel der Mockups: Passstraßen bleiben bei ungefähr 5–8 %. */
export const ROAD_MAX_PASS_GRADE_PERCENT = 8;
export const ROAD_TARGET_PASS_GRADE_PERCENT = 6.5;

export interface RoadProfileSample {
  x: number;
  y: number;
  terrain: TerrainType;
  terrainHeight: number;
  /** Gebackene lokale Steilheit der Kachel. */
  terrainSlope: number;
  coast: boolean;
  cliff: boolean;
  /** Bereits gebaute Anschlussknoten frieren ihre Deckhöhe ein. */
  fixedRoadHeight?: number;
}

export interface RoadProfilePoint extends RoadProfileSample {
  /** Geplante Fahrbahn-Mittellinie in Welt-Y. */
  roadHeight: number;
  /** Vorzeichenbehaftete Steigung vom vorherigen Punkt in Prozent. */
  gradePercent: number;
  /** Fahrbahn über (+) oder im Einschnitt unter (−) dem Gelände. */
  clearance: number;
  variant: RoadVariant;
  /** Ein lokaler Richtungswechsel; Passkurven können daraus Hairpins ableiten. */
  turn: boolean;
}

export interface RoadHeightProfile {
  points: RoadProfilePoint[];
  lengthMeters: number;
  elevationDeltaMeters: number;
  maxGradePercent: number;
  averageGradePercent: number;
  minRoadHeight: number;
  maxRoadHeight: number;
  dominantVariant: RoadVariant;
  variantCounts: Record<RoadVariant, number>;
  turnCount: number;
  /** Endpunkte liegen auf tragfähigem Land und das Profil hält maximal 8 % ein. */
  feasible: boolean;
}

export const ROAD_VARIANTS: readonly RoadVariant[] = [
  'flat',
  'slope',
  'pass',
  'support',
  'viaduct',
  'bridge',
  'coast',
] as const;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

function isWater(terrain: TerrainType): boolean {
  return terrain === 'water' || terrain === 'river';
}

function isTurn(samples: readonly RoadProfileSample[], index: number): boolean {
  if (index <= 0 || index >= samples.length - 1) return false;
  const previous = samples[index - 1]!;
  const current = samples[index]!;
  const next = samples[index + 1]!;
  const ax = Math.sign(current.x - previous.x);
  const ay = Math.sign(current.y - previous.y);
  const bx = Math.sign(next.x - current.x);
  const by = Math.sign(next.y - current.y);
  return ax !== bx || ay !== by;
}

/**
 * Wasser- und Schluchtboden ist keine sinnvolle Deck-Zielhöhe. Zwischen den
 * nächsten tragfähigen Landpunkten wird deshalb zunächst linear gespannt; die
 * anschließende Gradientenbegrenzung formt daraus die sanften Rampen.
 */
function structuralTargets(samples: readonly RoadProfileSample[]): number[] {
  const targets = samples.map((sample) => sample.fixedRoadHeight ?? sample.terrainHeight);
  let index = 0;
  while (index < samples.length) {
    if (!isWater(samples[index]!.terrain) && !samples[index]!.cliff) {
      index += 1;
      continue;
    }
    const first = index;
    while (
      index + 1 < samples.length &&
      (isWater(samples[index + 1]!.terrain) || samples[index + 1]!.cliff)
    ) {
      index += 1;
    }
    const last = index;
    const before = Math.max(0, first - 1);
    const after = Math.min(samples.length - 1, last + 1);
    const startHeight = targets[before]!;
    const endHeight = targets[after]!;
    const span = Math.max(1, after - before);
    for (let cursor = first; cursor <= last; cursor++) {
      const t = (cursor - before) / span;
      targets[cursor] = startHeight + (endHeight - startHeight) * t;
    }
    index += 1;
  }
  return targets;
}

/**
 * Glättet das Längsprofil und begrenzt benachbarte Deckpunkte auf die
 * Passstraßen-Steigung. Sind Start und Ziel für die vorhandene Länge physisch
 * nicht mit 8 % verbindbar, bleibt die gleichmäßige (zu steile) Linie sichtbar;
 * der Router versucht diesen Fall zuvor durch Serpentinen zu verlängern und die
 * Vorschau kann den verbleibenden Grenzwert ehrlich anzeigen.
 */
export function solveRoadHeights(
  samples: readonly RoadProfileSample[],
  maxGradePercent = ROAD_MAX_PASS_GRADE_PERCENT,
): number[] {
  if (samples.length === 0) return [];
  if (samples.length === 1) return [samples[0]!.terrainHeight];

  const targets = structuralTargets(samples);
  // Mehrere kleine Low-pass-Schritte entfernen einzelne Bake-Zacken, ohne das
  // Geländeprofil in eine vollkommen gerade Hochbahn zu verwandeln.
  let smoothed = [...targets];
  for (let pass = 0; pass < 4; pass++) {
    const next = [...smoothed];
    for (let index = 1; index < smoothed.length - 1; index++) {
      next[index] =
        smoothed[index - 1]! * 0.22 +
        targets[index]! * 0.56 +
        smoothed[index + 1]! * 0.22;
    }
    smoothed = next;
  }

  const segments = samples.length - 1;
  const maxStep = maxGradePercent / 100;
  const heights = [...smoothed];
  // Persistierte Straßenknoten sind harte Anker. Die abschnittsweise Lösung
  // hält Kreuzungen und Save-v31-Deckhöhen in jeder späteren Vorschau stabil.
  const anchors = [0];
  for (let index = 1; index < segments; index++) {
    if (samples[index]!.fixedRoadHeight !== undefined) anchors.push(index);
  }
  anchors.push(segments);

  for (let anchorIndex = 0; anchorIndex < anchors.length - 1; anchorIndex++) {
    const from = anchors[anchorIndex]!;
    const to = anchors[anchorIndex + 1]!;
    const intervalSegments = to - from;
    const start = samples[from]!.fixedRoadHeight ?? targets[from]!;
    const end = samples[to]!.fixedRoadHeight ?? targets[to]!;

    // Ein unmöglicher Abschnitt bleibt als gleichmäßige Grenzwertüberschreitung
    // sichtbar. Der Aufrufer sperrt ihn, damit das Routing Serpentinen sucht.
    if (Math.abs(end - start) > maxStep * intervalSegments + 1e-6) {
      for (let index = from; index <= to; index++) {
        heights[index] = start + ((end - start) * (index - from)) / intervalSegments;
      }
      continue;
    }

    for (let index = from; index <= to; index++) {
      const travelled = index - from;
      const remaining = to - index;
      const lower = Math.max(start - travelled * maxStep, end - remaining * maxStep);
      const upper = Math.min(start + travelled * maxStep, end + remaining * maxStep);
      heights[index] = clamp(smoothed[index]!, lower, upper);
    }
    heights[from] = start;
    heights[to] = end;
    for (let pass = 0; pass < 6; pass++) {
      for (let index = from + 1; index <= to; index++) {
        heights[index] = clamp(heights[index]!, heights[index - 1]! - maxStep, heights[index - 1]! + maxStep);
      }
      heights[to] = end;
      for (let index = to - 1; index >= from; index--) {
        heights[index] = clamp(heights[index]!, heights[index + 1]! - maxStep, heights[index + 1]! + maxStep);
      }
      heights[from] = start;
    }
  }
  return heights;
}

function variantFor(
  sample: RoadProfileSample,
  roadHeight: number,
  gradePercent: number,
  passContext: boolean,
): RoadVariant {
  if (isWater(sample.terrain)) return 'bridge';
  const clearance = roadHeight - sample.terrainHeight;
  if (sample.cliff || clearance > 0.62) return 'viaduct';
  if (clearance > 0.2 || clearance < -0.32) return 'support';
  if (sample.coast) return 'coast';
  if (passContext || sample.terrainSlope >= 0.82 || Math.abs(gradePercent) >= 4.5) return 'pass';
  if (sample.terrainSlope >= 0.28 || Math.abs(gradePercent) >= 1.5) return 'slope';
  return 'flat';
}

/** Reine, synthetisch testbare Profilauswertung. */
export function buildRoadHeightProfileFromSamples(
  samples: readonly RoadProfileSample[],
): RoadHeightProfile {
  const heights = solveRoadHeights(samples);
  const turnFlags = samples.map((_, index) => isTurn(samples, index));
  const turnCount = turnFlags.filter(Boolean).length;
  const terrainRange = samples.length > 0
    ? Math.max(...samples.map((sample) => sample.terrainHeight)) - Math.min(...samples.map((sample) => sample.terrainHeight))
    : 0;
  // Zwei oder mehr Kehren an einem messbaren Höhenzug sind eine Passstraße —
  // nicht bloß eine normale Stadtkurve.
  const passContext = turnCount >= 2 && terrainRange >= 0.45;
  const points: RoadProfilePoint[] = samples.map((sample, index) => {
    const previous = heights[Math.max(0, index - 1)] ?? heights[index] ?? sample.terrainHeight;
    const roadHeight = heights[index] ?? sample.terrainHeight;
    const gradePercent = index === 0 ? 0 : (roadHeight - previous) * 100;
    return {
      ...sample,
      roadHeight,
      gradePercent,
      clearance: roadHeight - sample.terrainHeight,
      variant: variantFor(sample, roadHeight, gradePercent, passContext),
      turn: turnFlags[index] ?? false,
    };
  });

  const variantCounts = Object.fromEntries(ROAD_VARIANTS.map((variant) => [variant, 0])) as Record<RoadVariant, number>;
  for (const point of points) variantCounts[point.variant] += 1;
  // Bei Gleichstand gewinnt die konstruktiv stärkere, für die Entscheidung
  // wichtigere Variante statt einer zufälligen Objekt-Reihenfolge.
  const priority: readonly RoadVariant[] = ['bridge', 'viaduct', 'support', 'pass', 'coast', 'slope', 'flat'];
  const dominantVariant = priority.reduce((best, variant) =>
    variantCounts[variant] > variantCounts[best] ? variant : best,
  priority.at(-1)!);
  const grades = points.slice(1).map((point) => Math.abs(point.gradePercent));
  const firstHeight = points[0]?.roadHeight ?? 0;
  const lastHeight = points.at(-1)?.roadHeight ?? firstHeight;
  const endpointsOnLand = points.length >= 2 &&
    !isWater(points[0]!.terrain) && !points[0]!.cliff &&
    !isWater(points.at(-1)!.terrain) && !points.at(-1)!.cliff;
  const maxGradePercent = grades.length > 0 ? Math.max(...grades) : 0;

  return {
    points,
    lengthMeters: Math.max(0, points.length - 1) * ROAD_TILE_METERS,
    elevationDeltaMeters: (lastHeight - firstHeight) * ROAD_TILE_METERS,
    maxGradePercent,
    averageGradePercent: grades.length > 0 ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : 0,
    minRoadHeight: points.length > 0 ? Math.min(...points.map((point) => point.roadHeight)) : 0,
    maxRoadHeight: points.length > 0 ? Math.max(...points.map((point) => point.roadHeight)) : 0,
    dominantVariant,
    variantCounts,
    turnCount,
    feasible: endpointsOnLand && maxGradePercent <= ROAD_MAX_PASS_GRADE_PERCENT + 1e-6,
  };
}

/** Profil eines schon gerasterten Weltpfades aus der kanonischen Bake-Fläche. */
export function buildRoadHeightProfile(
  state: GameState,
  path: readonly { x: number; y: number }[],
): RoadHeightProfile {
  const samples = path.map(({ x, y }): RoadProfileSample => {
    const surface = samplePlacementSurface(state, x, y, 1, 1);
    const terrain = worldTerrainAt(state, x, y);
    const stored = Object.values(state.buildings).find(
      (building) => building.x === x && building.y === y && building.roadEngineering,
    )?.roadEngineering;
    return {
      x,
      y,
      terrain,
      terrainHeight: surface.averageHeight,
      terrainSlope: surface.slope,
      coast: surface.waterfrontRatio > 0 || surface.shoreTypes.size > 0,
      cliff: surface.cliffOverlap > 0,
      ...(stored ? { fixedRoadHeight: stored.roadHeight } : {}),
    };
  });
  return buildRoadHeightProfileFromSamples(samples);
}

/** Minimal nötige Kantenanzahl für eine 8-%-Verbindung zweier Höhen. */
export function minimumRoadSegmentsForGrade(startHeight: number, endHeight: number): number {
  return Math.ceil(Math.abs(endHeight - startHeight) / (ROAD_MAX_PASS_GRADE_PERCENT / 100));
}
