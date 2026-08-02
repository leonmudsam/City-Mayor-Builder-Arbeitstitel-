// Terrainbewusster Straßen-Router (§ Infrastruktur 2.0 / I2, überlappt 10.0-R6).
// Der Spieler setzt nur noch Kontrollpunkte (Start, Zwischenpunkte, Ziel); dieses
// Modul verbindet aufeinanderfolgende Kontrollpunkte LÜCKENLOS über wirklich
// bebaubares Gelände statt über die frühere naive L-Form (die stur durch Wasser
// und Klippen lief). Bodenstraßen weichen Wasser/Klippen aus, Höhenstraßen
// überbrücken sie zu einem gewichteten Aufpreis.
//
// KEIN zweites Verkehrs-/Platzierungssystem (§2/§8): die Passierbarkeit jeder
// Kachel ist EXAKT `validatePlacement` — der Router ist nur ein Vorschlag, die
// spätere `analyseRoadPath`-Prüfung bleibt die alleinige Wahrheit für Status,
// Kosten und Blockaden. Reine Simulation/Domain: importiert nur Sim-Module, kein
// three/react/zustand/Renderer (CLAUDE.md §1). Vollständig deterministisch (kein
// RNG, keine Zeit) — dieselben Kontrollpunkte ergeben immer denselben Weg.

import type { GameConfig } from '../config/index.ts';
import type { GameState } from '../types.ts';
import type { Derived } from '../simulation/derived.ts';
import type { BuildingDef } from '../config/types.ts';
import { validatePlacement } from '../buildings/placement.ts';
import { samplePlacementSurface, worldTerrainAt } from '../map/world.ts';
import { WORLD_TILES } from '../config/startRegion.config.ts';
import {
  buildRoadHeightProfile,
  minimumRoadSegmentsForGrade,
} from './roadProfile.ts';

export interface RoadRouteContext {
  state: GameState;
  config: GameConfig;
  derived: Derived;
  def: BuildingDef;
}

const key = (x: number, y: number): string => `${x},${y}`;
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

// Kantengewichte: bestehende Straße quasi gratis (Wiederverwendung), normales
// Bauland günstig, eine Brücke/ein Viadukt teuer — so weicht der Router einer
// schmalen Wasserstelle nur aus, wenn der Umweg kürzer als ~sechs Landkacheln
// ist, überbrückt sie aber, wenn das klar der direktere Weg ist.
const WEIGHT_EXISTING = 0.25;
const WEIGHT_LAND = 1;
const WEIGHT_BRIDGE = 6;
/** Aufpreis je Welt-Einheit Steigung: ein Hang an der Obergrenze (1,1) kostet
 *  wie ~2,2 flache Kacheln, bleibt also gangbar, wird aber gemieden. */
const WEIGHT_SLOPE = 2;
// Sicherheitsrand um die Segment-Bounding-Box, damit ein Umweg um eine Bucht
// möglich ist, ohne je die ganze 512²-Insel zu durchsuchen.
const SEARCH_MARGIN = 22;
// Harte Obergrenze an expandierten Knoten je Segment (deterministischer Abbruch,
// nie ein Hänger). Wird sie überschritten, greift der gerade Rückfall-Pfad.
const MAX_EXPANSIONS = 60_000;

const clampTile = (value: number): number => Math.max(0, Math.min(WORLD_TILES - 1, Math.round(value)));

/**
 * Passierbarkeitsgewicht einer Kachel oder `null`, wenn sie für diese
 * Straßen-Bauklasse gar nicht baubar ist. Die Passierbarkeit ist deckungsgleich
 * mit `validatePlacement` (§2): `needs_road` gilt als passierbar, weil der Weg
 * den Anschluss selbst herstellt; jeder andere Fehler (Terrain, Belegung,
 * gesperrte Region, außerhalb) macht die Kachel unpassierbar.
 */
export function tileWeight(ctx: RoadRouteContext, x: number, y: number): number | null {
  if (x < 0 || y < 0 || x >= WORLD_TILES || y >= WORLD_TILES) return null;
  const k = key(x, y);
  // Bestehende, verbundene Straße: frei befahrbar/wiederverwendbar (später
  // „exists", kostenlos). `validatePlacement` würde hier „occupied" melden.
  if (ctx.derived.roadNetwork.has(k)) return WEIGHT_EXISTING;
  const reason = validatePlacement(ctx.state, ctx.config, ctx.derived, ctx.def, x, y);
  if (reason !== undefined && reason !== 'needs_road') return null;
  const terrain = worldTerrainAt(ctx.state, x, y);
  const rc = ctx.def.road;
  const spanned =
    (rc?.crossesWater === true && (terrain === 'water' || terrain === 'river')) ||
    (rc?.crossesCliff === true && terrain === 'mountain');
  if (spanned) return WEIGHT_BRIDGE;
  // § Map Flattening Phase D: Seit dem Einebnen darf eine Bodenstraße spürbar
  // steileres Gelände nehmen (GROUND_ROAD_MAX_SLOPE). Damit sie das nicht
  // beiläufig tut, kostet Steigung extra — der Router legt die Trasse von
  // selbst ins flache Land und klettert nur, wenn der Umweg teurer wäre.
  // Passierbarkeit bleibt allein Sache von `validatePlacement` (§2).
  return WEIGHT_LAND + samplePlacementSurface(ctx.state, x, y, 1, 1).slope * WEIGHT_SLOPE;
}

/** Orthogonaler L-Rückfall (früheres `extendRoadDraft`), falls kein Weg gefunden
 *  wird — nie eine Lücke, damit die spätere Prüfung die Blockade rot zeigt. */
function straightFill(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [{ x: a.x, y: a.y }];
  let x = a.x;
  let y = a.y;
  const xFirst = Math.abs(b.x - x) >= Math.abs(b.y - y);
  const walkX = () => {
    while (x !== b.x) {
      x += Math.sign(b.x - x);
      out.push({ x, y });
    }
  };
  const walkY = () => {
    while (y !== b.y) {
      y += Math.sign(b.y - y);
      out.push({ x, y });
    }
  };
  if (xFirst) {
    walkX();
    walkY();
  } else {
    walkY();
    walkX();
  }
  return out;
}

/** Binärer Min-Heap über (dist, y, x) für ein deterministisches Dijkstra. */
class MinHeap {
  private heap: { d: number; x: number; y: number }[] = [];
  get size(): number {
    return this.heap.length;
  }
  private less(a: { d: number; x: number; y: number }, b: { d: number; x: number; y: number }): boolean {
    return a.d < b.d || (a.d === b.d && (a.y < b.y || (a.y === b.y && a.x < b.x)));
  }
  push(node: { d: number; x: number; y: number }): void {
    const h = this.heap;
    h.push(node);
    let i = h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.less(h[i]!, h[p]!)) {
        [h[i], h[p]] = [h[p]!, h[i]!];
        i = p;
      } else break;
    }
  }
  pop(): { d: number; x: number; y: number } | undefined {
    const h = this.heap;
    const top = h[0];
    if (top === undefined) return undefined;
    const last = h.pop()!;
    if (h.length > 0) {
      h[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let s = i;
        if (l < h.length && this.less(h[l]!, h[s]!)) s = l;
        if (r < h.length && this.less(h[r]!, h[s]!)) s = r;
        if (s === i) break;
        [h[i], h[s]] = [h[s]!, h[i]!];
        i = s;
      }
    }
    return top;
  }
}

/**
 * Kürzester (gewichteter) Weg zwischen zwei Kacheln über passierbares Gelände,
 * begrenzt auf die um `SEARCH_MARGIN` erweiterte Bounding-Box. Ziel und Start
 * dürfen selbst „teuer" (Brücke) sein. `undefined`, wenn innerhalb der Box kein
 * Weg existiert.
 */
function routeSegment(ctx: RoadRouteContext, a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number }[] | undefined {
  if (a.x === b.x && a.y === b.y) return [{ x: a.x, y: a.y }];
  const minX = Math.max(0, Math.min(a.x, b.x) - SEARCH_MARGIN);
  const maxX = Math.min(WORLD_TILES - 1, Math.max(a.x, b.x) + SEARCH_MARGIN);
  const minY = Math.max(0, Math.min(a.y, b.y) - SEARCH_MARGIN);
  const maxY = Math.min(WORLD_TILES - 1, Math.max(a.y, b.y) + SEARCH_MARGIN);

  const startK = key(a.x, a.y);
  const goalK = key(b.x, b.y);
  // Start-/Zielkachel müssen für diese Bauklasse überhaupt betretbar sein.
  if (tileWeight(ctx, a.x, a.y) === null || tileWeight(ctx, b.x, b.y) === null) return undefined;

  const dist = new Map<string, number>([[startK, 0]]);
  const prev = new Map<string, string>();
  const done = new Set<string>();
  const heap = new MinHeap();
  heap.push({ d: 0, x: a.x, y: a.y });
  let expansions = 0;

  while (heap.size > 0) {
    const cur = heap.pop()!;
    const ck = key(cur.x, cur.y);
    if (done.has(ck)) continue;
    done.add(ck);
    if (ck === goalK) {
      const path: { x: number; y: number }[] = [];
      let step: string | undefined = goalK;
      while (step) {
        const [sx, sy] = step.split(',').map(Number) as [number, number];
        path.push({ x: sx, y: sy });
        step = prev.get(step);
      }
      return path.reverse();
    }
    if (++expansions > MAX_EXPANSIONS) return undefined;
    for (const [dx, dy] of DIRS) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx < minX || nx > maxX || ny < minY || ny > maxY) continue;
      const nk = key(nx, ny);
      if (done.has(nk)) continue;
      const w = tileWeight(ctx, nx, ny);
      if (w === null) continue;
      const nd = cur.d + w;
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd);
        prev.set(nk, ck);
        heap.push({ d: nd, x: nx, y: ny });
      }
    }
  }
  return undefined;
}

const sameTile = (a: { x: number; y: number }, b: { x: number; y: number }): boolean =>
  a.x === b.x && a.y === b.y;

/**
 * Synthetische Kehren-Kontrollpunkte für einen zu kurzen Höhenzug. Die Punkte
 * liegen abwechselnd links/rechts der direkten Achse und sind bewusst weit
 * auseinander, damit `roundedRoadPolyline` später echte Radien statt Zacken
 * zeichnen kann. Passierbarkeit wird erst im Router-Kontext geprüft.
 */
export function serpentineControlPoints(
  a: { x: number; y: number },
  b: { x: number; y: number },
  requiredSegments: number,
  amplitude: number,
  initialSide: -1 | 1 = 1,
): { x: number; y: number }[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const directSegments = Math.abs(dx) + Math.abs(dy);
  const extra = Math.max(0, requiredSegments - directSegments);
  const bends = Math.max(2, Math.min(10, Math.ceil(extra / Math.max(4, amplitude * 1.6))));
  const px = -dy / distance;
  const py = dx / distance;
  const points: { x: number; y: number }[] = [a];
  for (let index = 1; index <= bends; index++) {
    const t = index / (bends + 1);
    const side = (index % 2 === 1 ? initialSide : -initialSide);
    points.push({
      x: clampTile(a.x + dx * t + px * amplitude * side),
      y: clampTile(a.y + dy * t + py * amplitude * side),
    });
  }
  points.push(b);
  return points.filter((point, index, all) => index === 0 || !sameTile(point, all[index - 1]!));
}

function nearestPassable(
  ctx: RoadRouteContext,
  desired: { x: number; y: number },
): { x: number; y: number } | undefined {
  for (let radius = 0; radius <= 5; radius++) {
    for (let oy = -radius; oy <= radius; oy++) {
      for (let ox = -radius; ox <= radius; ox++) {
        if (radius > 0 && Math.max(Math.abs(ox), Math.abs(oy)) !== radius) continue;
        const x = clampTile(desired.x + ox);
        const y = clampTile(desired.y + oy);
        const terrain = worldTerrainAt(ctx.state, x, y);
        // Eine Kehre braucht tragfähigen Boden; Wasser-/Schluchtabschnitte
        // entstehen später automatisch zwischen den Landankern.
        if ((terrain === 'water' || terrain === 'river') || samplePlacementSurface(ctx.state, x, y, 1, 1).cliffOverlap > 0) continue;
        if (tileWeight(ctx, x, y) !== null) return { x, y };
      }
    }
  }
  return undefined;
}

function routeThrough(
  ctx: RoadRouteContext,
  controlPoints: readonly { x: number; y: number }[],
): { x: number; y: number }[] | undefined {
  const out: { x: number; y: number }[] = [];
  const seen = new Set<string>();
  for (let index = 1; index < controlPoints.length; index++) {
    const segment = routeSegment(ctx, controlPoints[index - 1]!, controlPoints[index]!);
    if (!segment) return undefined;
    for (const tile of segment) {
      const last = out.at(-1);
      if (last && sameTile(last, tile)) continue;
      const tileKey = key(tile.x, tile.y);
      // Ein selbstkreuzender Rasterpfad hätte an dieser Stelle zwei voneinander
      // abweichende Profilhöhen. Solche Kandidaten werden verworfen.
      if (seen.has(tileKey)) return undefined;
      seen.add(tileKey);
      out.push(tile);
    }
  }
  return out;
}

function routeSegmentWithGrade(
  ctx: RoadRouteContext,
  a: { x: number; y: number },
  b: { x: number; y: number },
): { x: number; y: number }[] | undefined {
  const direct = routeSegment(ctx, a, b);
  if (!direct) return undefined;
  const startHeight = samplePlacementSurface(ctx.state, a.x, a.y, 1, 1).averageHeight;
  const endHeight = samplePlacementSurface(ctx.state, b.x, b.y, 1, 1).averageHeight;
  const requiredSegments = minimumRoadSegmentsForGrade(startHeight, endHeight);
  const directProfile = buildRoadHeightProfile(ctx.state, direct);
  if (direct.length - 1 >= requiredSegments && directProfile.feasible) return direct;

  // Kleine bis große Korridore beidseitig prüfen. Die erste gültige Lösung ist
  // wegen fester Reihenfolge deterministisch; kürzere, direkte Flachlandrouten
  // zahlen keinen Serpentinen-Overhead.
  const minimumAmplitude = Math.max(3, Math.ceil((requiredSegments - direct.length + 1) / 12));
  for (let amplitude = minimumAmplitude; amplitude <= 22; amplitude += 2) {
    for (const side of [1, -1] as const) {
      const desired = serpentineControlPoints(a, b, requiredSegments, amplitude, side);
      const anchors: { x: number; y: number }[] = [a];
      let anchorsValid = true;
      for (const point of desired.slice(1, -1)) {
        const anchor = nearestPassable(ctx, point);
        if (!anchor || sameTile(anchor, anchors.at(-1)!)) {
          anchorsValid = false;
          break;
        }
        anchors.push(anchor);
      }
      if (!anchorsValid) continue;
      anchors.push(b);
      const candidate = routeThrough(ctx, anchors);
      if (!candidate || candidate.length - 1 < requiredSegments) continue;
      if (buildRoadHeightProfile(ctx.state, candidate).feasible) return candidate;
    }
  }
  // Rückgabe der direkten Trasse ist absichtlich erlaubt: Die kanonische
  // Profilprüfung markiert sie unbaubar und zeigt den Grund in der Vorschau,
  // statt heimlich eine >8-%-Straße zu errichten.
  return direct;
}

/**
 * Expandiert eine Kette von Kontrollpunkten zu einem lückenlosen, orthogonal
 * verbundenen Kachelweg. Zwischen zwei Punkten wird terrainbewusst geroutet;
 * findet sich kein Weg, füllt ein gerader L-Rückfall die Lücke (die spätere
 * Prüfung zeigt sie dann rot). Aufeinanderfolgende Duplikate werden entfernt.
 */
export function routeRoadWaypoints(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  def: BuildingDef,
  waypoints: readonly { x: number; y: number }[],
): { x: number; y: number }[] {
  const points = waypoints
    .map((p) => ({ x: clampTile(p.x), y: clampTile(p.y) }))
    .filter((p, index, all) => index === 0 || p.x !== all[index - 1]!.x || p.y !== all[index - 1]!.y);
  if (points.length === 0) return [];
  if (points.length === 1) return [points[0]!];

  const ctx: RoadRouteContext = { state, config, derived, def };
  const out: { x: number; y: number }[] = [];
  const pushTile = (tile: { x: number; y: number }) => {
    const last = out[out.length - 1];
    if (!last || last.x !== tile.x || last.y !== tile.y) out.push(tile);
  };

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const segment = routeSegmentWithGrade(ctx, a, b) ?? straightFill(a, b);
    for (const tile of segment) pushTile(tile);
  }
  return out;
}
