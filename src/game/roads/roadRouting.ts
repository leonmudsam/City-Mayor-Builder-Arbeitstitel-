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
import { worldTerrainAt } from '../map/world.ts';
import { WORLD_TILES } from '../config/startRegion.config.ts';

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
  return spanned ? WEIGHT_BRIDGE : WEIGHT_LAND;
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
    const segment = routeSegment(ctx, a, b) ?? straightFill(a, b);
    for (const tile of segment) pushTile(tile);
  }
  return out;
}
