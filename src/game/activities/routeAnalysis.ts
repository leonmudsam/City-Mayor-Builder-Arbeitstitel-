// Stadtarbeit-Routenanalyse (§ Overhaul 3.0 / Phase C2) — die kanonische,
// DETERMINISTISCHE Bewertung einer geplanten Route auf dem ECHTEN Straßengraphen.
//
// Ersetzt die frühere `TODO(CLAUDE_LOGIC)`-Schätzung in
// `components/panels/ActivityRoutePlanner.tsx` (Luftlinie + Hash). Reine
// Simulation/Domain: importiert nur Typen — kein three/react/zustand/Renderer
// (CLAUDE.md §1). Die UI liest ausschließlich das Ergebnis über den Controller-
// Read-Helper `analyseActivityRoute`; es wird nichts persistiert und kein RNG
// oder Zeitwert benutzt, damit dieselbe Planung immer dasselbe Ergebnis liefert.
//
// Graph = `derived.roadNetwork` (orthogonal verbundene Straßenkacheln, vom
// Rathaus/Distriktzentrum aus geflutet). Wegfindung = BFS auf diesen Kacheln;
// Endpunkte (Quelle/Ziele) werden an die nächstgelegene Straßenkachel
// „angedockt". Fehlt eine Straßenverbindung (frühe Stadt), fällt das Segment auf
// eine bestrafte Luftlinie zurück — nie ein Crash.

import type { GameConfig } from '../config/index.ts';
import type { GameState } from '../types.ts';
import type { Derived } from '../simulation/derived.ts';

/** Ein Streckenabschnitt zwischen zwei aufeinanderfolgenden Stopps. */
export interface RouteSegment {
  /** Gebäude-Id des Startpunkts oder `'source'`. */
  fromId: string;
  /** Gebäude-Id des Zielpunkts. */
  toId: string;
  fromXY: { x: number; y: number };
  toXY: { x: number; y: number };
  /** Streckenlänge in Kacheln (Straßenpfad, sonst Luftlinie). */
  distanceTiles: number;
  /** true, wenn ein echter Straßenpfad gefunden wurde. */
  onRoad: boolean;
  /** Verkehrslast 0..1 (aus Anrainerdichte der Straßenkacheln). */
  congestionScore: number;
  /** Für das UI-Overlay in 4 Stufen gebündelt (grün/gelb/orange/rot). */
  load: 0 | 1 | 2 | 3;
  /** Straßenkachel-Mittelpunkte des Pfades (Polyline); sonst [from, to]. */
  path: { x: number; y: number }[];
}

/** Gesamtbewertung einer Route — Prognose, keine Auszahlung. */
export interface RouteAnalysis {
  orderedTargetIds: string[];
  segments: RouteSegment[];
  /** Gesamtstrecke in Kacheln. */
  distanceTiles: number;
  /** Geschätzte Fahrzeit in ms (aus Strecke × Verkehrslast). */
  estimatedDurationMs: number;
  /** Straßen-Kreuzungen auf der Route (Kacheln mit ≥3 Straßen-Nachbarn). */
  intersections: number;
  /** Anteil der Segmente mit echter Straßenverbindung (0..1). */
  roadCoverage: number;
  congestionRisk: 'low' | 'medium' | 'high';
  /** Planungsgüte 0..100 (optimale Reihenfolge / gewählte Reihenfolge). */
  efficiencyScore: number;
  expectedMedal: 'bronze' | 'silver' | 'gold';
  /** Belohnungs-Prognosefaktor, gedeckelt [0.85, 1.2] — reine Anzeige (C2). */
  rewardMultiplier: number;
}

export interface RoutePointInput {
  id: string;
  x: number;
  y: number;
}

export interface RouteAnalysisInput {
  source: RoutePointInput;
  /** Ziele in der vom Spieler gewählten Reihenfolge. */
  targets: RoutePointInput[];
  roadNetwork: ReadonlySet<string>;
  /** Straßenkachel „x,y" → Anzahl anliegender Nicht-Straßen-Footprint-Kacheln. */
  busyness: ReadonlyMap<string, number>;
}

/** Exakte Straßenanker, die ein manueller Plan in dieser Reihenfolge berühren muss. */
export interface RouteRoadAnchors {
  source: { x: number; y: number };
  targets: { id: string; x: number; y: number }[];
}

// Fahr-/Bewertungs-Konstanten (Arcade, bewusst grob — es ist eine Prognose).
const MS_PER_TILE = 780; // Grundfahrzeit je Kachel
const CONGESTION_TIME_FACTOR = 1.4; // Verkehr streckt die Fahrzeit
const ROADLESS_DISTANCE_PENALTY = 1.6; // Luftlinie ohne Straße kostet extra
const SNAP_RADIUS = 4; // max. Chebyshev-Ring, um an eine Straßenkachel anzudocken
const BUSY_NORM = 6; // Anrainerzahl, ab der eine Kachel als „voll" gilt

const key = (x: number, y: number): string => `${x},${y}`;

/** Nächstgelegene Straßenkachel zu einem Punkt (Chebyshev-Ringe, deterministisch). */
function snapToRoad(px: number, py: number, roads: ReadonlySet<string>): { x: number; y: number } | undefined {
  const cx = Math.round(px);
  const cy = Math.round(py);
  if (roads.has(key(cx, cy))) return { x: cx, y: cy };
  for (let r = 1; r <= SNAP_RADIUS; r++) {
    // Ring in stabiler Reihenfolge absuchen (kein RNG): erst nähere Kacheln.
    let best: { x: number; y: number } | undefined;
    let bestD = Infinity;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = cx + dx;
        const y = cy + dy;
        if (!roads.has(key(x, y))) continue;
        const d = dx * dx + dy * dy;
        if (d < bestD || (d === bestD && (best === undefined || y < best.y || (y === best.y && x < best.x)))) {
          bestD = d;
          best = { x, y };
        }
      }
    }
    if (best) return best;
  }
  return undefined;
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** BFS-Kürzester-Pfad über Straßenkacheln (orthogonal). Gibt Kachelfolge zurück. */
function roadPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  roads: ReadonlySet<string>,
): { x: number; y: number }[] | undefined {
  const start = key(from.x, from.y);
  const goal = key(to.x, to.y);
  if (start === goal) return [{ x: from.x, y: from.y }];
  const prev = new Map<string, string>();
  const visited = new Set<string>([start]);
  let queue: string[] = [start];
  while (queue.length > 0) {
    const next: string[] = [];
    for (const k of queue) {
      const [x, y] = k.split(',').map(Number) as [number, number];
      for (const [dx, dy] of DIRS) {
        const nk = key(x + dx, y + dy);
        if (visited.has(nk) || !roads.has(nk)) continue;
        visited.add(nk);
        prev.set(nk, k);
        if (nk === goal) {
          // Pfad rückverfolgen.
          const path: { x: number; y: number }[] = [];
          let cur: string | undefined = goal;
          while (cur) {
            const [cx, cy] = cur.split(',').map(Number) as [number, number];
            path.push({ x: cx, y: cy });
            cur = prev.get(cur);
          }
          return path.reverse();
        }
        next.push(nk);
      }
    }
    queue = next;
  }
  return undefined;
}

/** Verkehrslast eines Pfades = durchschnittliche normierte Anrainerdichte. */
function pathCongestion(path: { x: number; y: number }[], busyness: ReadonlyMap<string, number>): number {
  if (path.length === 0) return 0;
  let sum = 0;
  for (const p of path) sum += Math.min(1, (busyness.get(key(p.x, p.y)) ?? 0) / BUSY_NORM);
  return sum / path.length;
}

function loadBucket(congestion: number): 0 | 1 | 2 | 3 {
  if (congestion < 0.2) return 0;
  if (congestion < 0.45) return 1;
  if (congestion < 0.7) return 2;
  return 3;
}

/** Analysiert eine EINZELNE Kette Quelle→Ziele in gegebener Reihenfolge. */
function analyseOrder(input: RouteAnalysisInput): { segments: RouteSegment[]; distanceTiles: number } {
  const stops = [input.source, ...input.targets];
  const segments: RouteSegment[] = [];
  let distanceTiles = 0;
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]!;
    const b = stops[i]!;
    const aRoad = snapToRoad(a.x, a.y, input.roadNetwork);
    const bRoad = snapToRoad(b.x, b.y, input.roadNetwork);
    let path = aRoad && bRoad ? roadPath(aRoad, bRoad, input.roadNetwork) : undefined;
    let onRoad = path !== undefined;
    let dist: number;
    if (path && aRoad && bRoad) {
      // Straßenpfad + kurze Andock-Stichwege von den Gebäuden zur Fahrbahn.
      dist = path.length - 1 + Math.hypot(a.x - aRoad.x, a.y - aRoad.y) + Math.hypot(b.x - bRoad.x, b.y - bRoad.y);
    } else {
      dist = Math.hypot(b.x - a.x, b.y - a.y) * ROADLESS_DISTANCE_PENALTY;
      path = [
        { x: a.x, y: a.y },
        { x: b.x, y: b.y },
      ];
      onRoad = false;
    }
    const congestion = onRoad ? pathCongestion(path, input.busyness) : 0;
    segments.push({
      fromId: i === 1 ? 'source' : input.targets[i - 2]!.id,
      toId: input.targets[i - 1]!.id,
      fromXY: { x: a.x, y: a.y },
      toXY: { x: b.x, y: b.y },
      distanceTiles: dist,
      onRoad,
      congestionScore: congestion,
      load: loadBucket(congestion),
      path,
    });
    distanceTiles += dist;
  }
  return { segments, distanceTiles };
}

/** Nächster-Nachbar-Reihenfolge als Effizienz-Referenz (deterministisch). */
function nearestNeighbourOrder(source: RoutePointInput, targets: RoutePointInput[]): RoutePointInput[] {
  const remaining = [...targets];
  const order: RoutePointInput[] = [];
  let cur: RoutePointInput = source;
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestD = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const t = remaining[i]!;
      const d = Math.hypot(t.x - cur.x, t.y - cur.y);
      // Gleichstand stabil nach Id auflösen → kein RNG.
      if (d < bestD || (d === bestD && t.id.localeCompare(remaining[bestIdx]!.id) < 0)) {
        bestD = d;
        bestIdx = i;
      }
    }
    cur = remaining.splice(bestIdx, 1)[0]!;
    order.push(cur);
  }
  return order;
}

function totalAerial(source: RoutePointInput, ordered: RoutePointInput[]): number {
  let d = 0;
  let cur = source;
  for (const t of ordered) {
    d += Math.hypot(t.x - cur.x, t.y - cur.y);
    cur = t;
  }
  return d;
}

function finaliseAnalysis(
  input: RouteAnalysisInput,
  segments: RouteSegment[],
  distanceTiles: number,
  manualEfficiency?: number,
): RouteAnalysis {
  // Fahrzeit: Grundzeit je Kachel, durch Verkehr gestreckt.
  let estimatedDurationMs = 0;
  for (const s of segments) {
    estimatedDurationMs += s.distanceTiles * MS_PER_TILE * (1 + s.congestionScore * CONGESTION_TIME_FACTOR);
  }
  estimatedDurationMs = Math.round(estimatedDurationMs);

  // Kreuzungen: Straßenkacheln mit ≥3 Straßen-Nachbarn auf dem Pfad.
  const seen = new Set<string>();
  let intersections = 0;
  for (const s of segments) {
    if (!s.onRoad) continue;
    for (const p of s.path) {
      const k = key(p.x, p.y);
      if (seen.has(k)) continue;
      seen.add(k);
      let n = 0;
      for (const [dx, dy] of DIRS) if (input.roadNetwork.has(key(p.x + dx, p.y + dy))) n++;
      if (n >= 3) intersections++;
    }
  }

  const roadCoverage = segments.length > 0 ? segments.filter((s) => s.onRoad).length / segments.length : 0;
  const avgCongestion = segments.length > 0 ? segments.reduce((sum, s) => sum + s.congestionScore, 0) / segments.length : 0;
  const congestionRisk = avgCongestion < 0.25 ? 'low' : avgCongestion < 0.55 ? 'medium' : 'high';

  // Effizienz = optimale (Nächster-Nachbar) / gewählte Reihenfolge, luftlinienbasiert
  // (Reihenfolge-Güte, unabhängig vom Straßennetz), 0..100.
  const chosenAerial = totalAerial(input.source, input.targets);
  const optimalAerial = totalAerial(input.source, nearestNeighbourOrder(input.source, input.targets));
  const efficiencyScore =
    manualEfficiency ??
    Math.max(40, Math.min(100, Math.round((optimalAerial / Math.max(0.001, chosenAerial)) * 100)));
  const expectedMedal = efficiencyScore >= 92 ? 'gold' : efficiencyScore >= 74 ? 'silver' : 'bronze';

  // Belohnungs-Prognose: gute Reihenfolge (+), viel Stau/kein Straßennetz (−).
  // Gedeckelt, damit die Planung die Balance nicht sprengt (reine Anzeige, C2).
  const rewardMultiplier = Math.max(
    0.85,
    Math.min(1.2, 0.9 + (efficiencyScore / 100) * 0.28 - avgCongestion * 0.18 + (roadCoverage - 0.5) * 0.12),
  );

  return {
    orderedTargetIds: input.targets.map((t) => t.id),
    segments,
    distanceTiles,
    estimatedDurationMs,
    intersections,
    roadCoverage,
    congestionRisk,
    efficiencyScore,
    expectedMedal,
    rewardMultiplier: Math.round(rewardMultiplier * 100) / 100,
  };
}

/** Kernanalyse: automatische Straßenpfade für eine gewählte Zielreihenfolge. */
export function analyseRoute(input: RouteAnalysisInput): RouteAnalysis {
  const { segments, distanceTiles } = analyseOrder(input);
  return finaliseAnalysis(input, segments, distanceTiles);
}

/**
 * Analysiert eine vollständig vom Spieler gezeichnete Straßenkette. Es wird
 * KEIN Weg zwischen zwei Klicks ergänzt: jede Kachel muss auf dem verbundenen
 * Straßengraph liegen und orthogonal an die vorige grenzen. Quelle und Ziele
 * müssen in ihrer gewählten Reihenfolge exakt berührt werden.
 */
export function analyseManualRoute(
  input: RouteAnalysisInput,
  manualPath: readonly { x: number; y: number }[],
): RouteAnalysis | undefined {
  if (manualPath.length < 2) return undefined;
  for (let index = 0; index < manualPath.length; index++) {
    const point = manualPath[index]!;
    if (!Number.isInteger(point.x) || !Number.isInteger(point.y) || !input.roadNetwork.has(key(point.x, point.y))) {
      return undefined;
    }
    if (index > 0) {
      const previous = manualPath[index - 1]!;
      if (Math.abs(previous.x - point.x) + Math.abs(previous.y - point.y) !== 1) return undefined;
    }
  }

  const anchors = routeRoadAnchors(input);
  if (!anchors) return undefined;
  if (manualPath[0]!.x !== anchors.source.x || manualPath[0]!.y !== anchors.source.y) return undefined;

  const segments: RouteSegment[] = [];
  let pathIndex = 0;
  let previousStop = input.source;
  let distanceTiles = 0;
  for (let targetIndex = 0; targetIndex < input.targets.length; targetIndex++) {
    const target = input.targets[targetIndex]!;
    const anchor = anchors.targets[targetIndex]!;
    let reachedIndex = -1;
    for (let index = pathIndex + 1; index < manualPath.length; index++) {
      const point = manualPath[index]!;
      if (point.x === anchor.x && point.y === anchor.y) {
        reachedIndex = index;
        break;
      }
    }
    if (reachedIndex < 0) return undefined;

    const segmentPath = manualPath.slice(pathIndex, reachedIndex + 1).map((point) => ({ ...point }));
    const distance =
      Math.max(0, segmentPath.length - 1) +
      (targetIndex === 0 ? Math.hypot(input.source.x - anchors.source.x, input.source.y - anchors.source.y) : 0) +
      Math.hypot(target.x - anchor.x, target.y - anchor.y);
    const congestion = pathCongestion(segmentPath, input.busyness);
    segments.push({
      fromId: targetIndex === 0 ? 'source' : input.targets[targetIndex - 1]!.id,
      toId: target.id,
      fromXY: { x: previousStop.x, y: previousStop.y },
      toXY: { x: target.x, y: target.y },
      distanceTiles: distance,
      onRoad: true,
      congestionScore: congestion,
      load: loadBucket(congestion),
      path: segmentPath,
    });
    distanceTiles += distance;
    pathIndex = reachedIndex;
    previousStop = target;
  }
  // Die Route endet am letzten Ziel; ein nicht zugeordnetes Nachspiel wäre
  // visuell irreführend und wird deshalb nicht still ignoriert.
  if (pathIndex !== manualPath.length - 1) return undefined;

  const reference = analyseOrder(input).distanceTiles;
  const efficiency = Math.max(40, Math.min(100, Math.round((reference / Math.max(0.001, distanceTiles)) * 100)));
  return finaliseAnalysis(input, segments, distanceTiles, efficiency);
}

/**
 * Zielreihenfolge, die sich tatsächlich aus einer Spielerroute ergibt. Jeder
 * Zielanker zählt bei seinem ersten Kontakt; unreichte Ziele fehlen bewusst.
 * Der Helfer sortiert nichts geometrisch und ergänzt keinen Weg.
 */
export function targetOrderOnPath(
  anchors: RouteRoadAnchors,
  targetIds: readonly string[],
  roadPath: readonly { x: number; y: number }[],
): string[] {
  return anchors.targets
    .map((anchor, index) => ({
      id: targetIds[index],
      pathIndex: roadPath.findIndex((point) => point.x === anchor.x && point.y === anchor.y),
    }))
    .filter((entry): entry is { id: string; pathIndex: number } => entry.id !== undefined && entry.pathIndex >= 0)
    .sort((a, b) => a.pathIndex - b.pathIndex || a.id.localeCompare(b.id))
    .map((entry) => entry.id);
}

function routeRoadAnchors(input: RouteAnalysisInput): RouteRoadAnchors | undefined {
  const source = snapToRoad(input.source.x, input.source.y, input.roadNetwork);
  if (!source) return undefined;
  const targets: RouteRoadAnchors['targets'] = [];
  for (const target of input.targets) {
    const point = snapToRoad(target.x, target.y, input.roadNetwork);
    if (!point) return undefined;
    targets.push({ id: target.id, ...point });
  }
  return { source, targets };
}

/**
 * Straßen-Anrainerdichte („busyness") aus dem State ableiten: je Straßenkachel
 * die Zahl anliegender Nicht-Straßen-Footprint-Kacheln (= Verkehrsquellen).
 * Rein aus State/Config, deterministisch, kein Renderer.
 */
export function computeRoadBusyness(state: GameState, config: GameConfig, roads: ReadonlySet<string>): Map<string, number> {
  const busy = new Map<string, number>();
  for (const b of Object.values(state.buildings)) {
    const def = config.buildings.get(b.defId);
    if (!def || def.category === 'roads') continue;
    // Jede Footprint-Kachel „belastet" ihre orthogonalen Straßen-Nachbarn.
    for (let dx = 0; dx < def.size.w; dx++) {
      for (let dy = 0; dy < def.size.h; dy++) {
        const fx = b.x + dx;
        const fy = b.y + dy;
        for (const [ox, oy] of DIRS) {
          const k = key(fx + ox, fy + oy);
          if (roads.has(k)) busy.set(k, (busy.get(k) ?? 0) + 1);
        }
      }
    }
  }
  return busy;
}

/** Mittelpunkt des Gebäude-Footprints (für Routenpunkte). */
export function buildingCenter(
  state: GameState,
  config: GameConfig,
  buildingId: string,
): { x: number; y: number } | undefined {
  const b = state.buildings[buildingId];
  if (!b) return undefined;
  const def = config.buildings.get(b.defId);
  const w = def?.size.w ?? 1;
  const h = def?.size.h ?? 1;
  return { x: b.x + w / 2, y: b.y + h / 2 };
}

/**
 * Baut die Analyse-Eingabe aus State/Config/Derived + gewählter Zielreihenfolge
 * und liefert die fertige `RouteAnalysis`. `undefined`, wenn Quelle oder ein Ziel
 * nicht auflösbar ist.
 */
export function analyseActivityRouteFrom(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  source: RoutePointInput,
  orderedTargetIds: string[],
): RouteAnalysis | undefined {
  const targets: RoutePointInput[] = [];
  for (const id of orderedTargetIds) {
    const c = buildingCenter(state, config, id);
    if (!c) return undefined;
    targets.push({ id, x: c.x, y: c.y });
  }
  if (targets.length === 0) return undefined;
  const busyness = computeRoadBusyness(state, config, derived.roadNetwork);
  return analyseRoute({ source, targets, roadNetwork: derived.roadNetwork, busyness });
}

function activityRouteInput(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  source: RoutePointInput,
  orderedTargetIds: string[],
): RouteAnalysisInput | undefined {
  const targets: RoutePointInput[] = [];
  for (const id of orderedTargetIds) {
    const center = buildingCenter(state, config, id);
    if (!center) return undefined;
    targets.push({ id, ...center });
  }
  if (targets.length === 0) return undefined;
  return {
    source,
    targets,
    roadNetwork: derived.roadNetwork,
    busyness: computeRoadBusyness(state, config, derived.roadNetwork),
  };
}

/** Exakte Straßenanker für die interaktive 2D-Karte. */
export function activityRouteRoadAnchorsFrom(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  source: RoutePointInput,
  orderedTargetIds: string[],
): RouteRoadAnchors | undefined {
  const input = activityRouteInput(state, config, derived, source, orderedTargetIds);
  return input ? routeRoadAnchors(input) : undefined;
}

/** Kanonische Bewertung der manuell gezeichneten Straßenkette. */
export function analyseManualActivityRouteFrom(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  source: RoutePointInput,
  orderedTargetIds: string[],
  manualPath: readonly { x: number; y: number }[],
): RouteAnalysis | undefined {
  const input = activityRouteInput(state, config, derived, source, orderedTargetIds);
  return input ? analyseManualRoute(input, manualPath) : undefined;
}
