// Abgeleitete Oberflächenmasken für die Naturverteilung (§ Natur-Overhaul 14.0).
//
// WARUM DIESES MODUL EXISTIERT. Der Natur-Overhaul verteilt Vegetation nicht mehr
// nach „Terraintyp + Zufallszahl", sondern nach *Zonen* (Waldkern, Waldrand,
// Wiese, Felshochland, flache/felsige Küste, kleine Insel). Um eine Zone zu
// bestimmen, braucht die Regelschicht drei Auskünfte, die keine vorhandene
// Quelle direkt liefert:
//
//   1. Wie stark ist eine Kachel von Wald UMGEBEN? (Kern vs. Rand)
//   2. Wie nah ist die nächste Steilküste? (felsige vs. flache Küste)
//   3. Wie GROSS ist die Landmasse, auf der die Kachel liegt? (kleine Inseln)
//
// Alle drei sind reine Ableitungen aus bereits gebackenen Gittern — hier wird
// nichts erfunden und nichts geschrieben (§ D-043: Ableitung ja, Geometrie nie).
// Steigung, Klippen- und Bebaubarkeitsbits kommen unverändert aus
// `islandBuildability.gen.ts`; dieses Modul rechnet nur das aus, was dort fehlt.
//
// Die Gitter werden EINMAL beim ersten Zugriff berechnet und danach
// wiederverwendet: ein Vegetationsaufbau darf keine 262.144 Kacheln mehrfach
// durchlaufen. Bewusst ohne `three`/`react`-Import, damit die Masken testbar
// bleiben.

import {
  BUILDABLE_BIT,
  CLIFF_BIT,
  SURFACE_SLOPE_SCALE,
  buildabilityGrid,
  surfaceSlopeGrid,
} from '../../game/config/world/islandBuildability.gen.ts';
import { WORLD_TILES, terrainGrid } from '../../game/config/world/islandTerrain.gen.ts';
import { shoreTypeGrid } from './worldMasks.gen.ts';

/** Terrain-Ids des Bakes (Reihenfolge = `TERRAIN_IDS` in `islandTerrain.gen.ts`). */
const T_WATER = 0;
const T_RIVER = 1;
const T_FOREST = 5;

const SIZE = WORLD_TILES * WORLD_TILES;

/** Steilküste (`shoreTypeGrid === 4`) — die Kante, an der Fels ans Wasser stößt. */
const SHORE_CLIFF = 4;

/**
 * Landmassen bis zu dieser Kachelzahl gelten als „kleine Insel" und bekommen
 * eine eigene, kompaktere Bepflanzung (§6 des Auftrags: kleine Inseln reduziert,
 * aber nicht leer). Gemessen an der aktuellen Insel trennt der Wert die
 * vorgelagerten Eilande sauber von der Hauptlandmasse.
 */
export const SMALL_ISLAND_MAX_TILES = 900;

let forestNeighbourhood: Uint8Array | undefined;
let cliffDistance: Uint8Array | undefined;
let landComponentSize: Int32Array | undefined;

const isLand = (index: number): boolean => {
  const t = terrainGrid[index] ?? T_WATER;
  return t !== T_WATER && t !== T_RIVER;
};

/**
 * Anteil bewaldeter Kacheln im 5×5-Fenster, als 0..255. Das ist die Trennlinie
 * zwischen Waldkern und Waldrand: ein Baum mitten im Bestand hat ringsum Wald,
 * ein Baum am Saum nicht. Ein reiner Kachel-Terraintest kann das nicht sehen.
 */
function buildForestNeighbourhood(): Uint8Array {
  const grid = new Uint8Array(SIZE);
  // Zwei getrennte 1D-Durchläufe (separierbarer Box-Filter) statt eines
  // 25-fach geschachtelten Fensters — O(n) statt O(25n).
  const radius = 2;
  const span = radius * 2 + 1;
  const rowSum = new Uint16Array(SIZE);
  for (let y = 0; y < WORLD_TILES; y++) {
    const base = y * WORLD_TILES;
    let sum = 0;
    for (let x = -radius; x <= radius; x++) {
      const cx = Math.min(WORLD_TILES - 1, Math.max(0, x));
      if ((terrainGrid[base + cx] ?? T_WATER) === T_FOREST) sum++;
    }
    for (let x = 0; x < WORLD_TILES; x++) {
      rowSum[base + x] = sum;
      const outX = Math.min(WORLD_TILES - 1, Math.max(0, x - radius));
      const inX = Math.min(WORLD_TILES - 1, Math.max(0, x + radius + 1));
      if ((terrainGrid[base + outX] ?? T_WATER) === T_FOREST) sum--;
      if ((terrainGrid[base + inX] ?? T_WATER) === T_FOREST) sum++;
    }
  }
  for (let x = 0; x < WORLD_TILES; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) {
      const cy = Math.min(WORLD_TILES - 1, Math.max(0, y));
      sum += rowSum[cy * WORLD_TILES + x]!;
    }
    for (let y = 0; y < WORLD_TILES; y++) {
      grid[y * WORLD_TILES + x] = Math.round((sum / (span * span)) * 255);
      const outY = Math.min(WORLD_TILES - 1, Math.max(0, y - radius));
      const inY = Math.min(WORLD_TILES - 1, Math.max(0, y + radius + 1));
      sum -= rowSum[outY * WORLD_TILES + x]!;
      sum += rowSum[inY * WORLD_TILES + x]!;
    }
  }
  return grid;
}

/**
 * Kachel-Distanz zur nächsten Steilküste (gedeckelt bei 255). Klassische
 * Zwei-Durchlauf-Chamfer-Distanz — reicht für ein Küstenband völlig aus und
 * kostet zwei lineare Durchläufe statt einer echten BFS.
 */
function buildCliffDistance(): Uint8Array {
  const grid = new Uint8Array(SIZE).fill(255);
  for (let i = 0; i < SIZE; i++) if ((shoreTypeGrid[i] ?? 0) === SHORE_CLIFF) grid[i] = 0;
  for (let y = 0; y < WORLD_TILES; y++) {
    for (let x = 0; x < WORLD_TILES; x++) {
      const o = y * WORLD_TILES + x;
      let best = grid[o]!;
      if (x > 0) best = Math.min(best, grid[o - 1]! + 1);
      if (y > 0) best = Math.min(best, grid[o - WORLD_TILES]! + 1);
      grid[o] = Math.min(255, best);
    }
  }
  for (let y = WORLD_TILES - 1; y >= 0; y--) {
    for (let x = WORLD_TILES - 1; x >= 0; x--) {
      const o = y * WORLD_TILES + x;
      let best = grid[o]!;
      if (x < WORLD_TILES - 1) best = Math.min(best, grid[o + 1]! + 1);
      if (y < WORLD_TILES - 1) best = Math.min(best, grid[o + WORLD_TILES]! + 1);
      grid[o] = Math.min(255, best);
    }
  }
  return grid;
}

/**
 * Größe der zusammenhängenden Landmasse je Kachel (4er-Nachbarschaft). Erst
 * damit lässt sich „kleine Insel" als Zone überhaupt formulieren; ohne diese
 * Auskunft sieht ein Eiland aus wie irgendein Küstenstück der Hauptinsel.
 *
 * Iterative Flutfüllung mit einem festen Index-Stack — eine Rekursion würde bei
 * 50.000 Kacheln pro Komponente den Aufrufstapel sprengen.
 */
function buildLandComponentSize(): Int32Array {
  const sizes = new Int32Array(SIZE);
  const label = new Int32Array(SIZE).fill(-1);
  const stack = new Int32Array(SIZE);
  const members = new Int32Array(SIZE);
  let nextLabel = 0;
  for (let start = 0; start < SIZE; start++) {
    if (label[start] !== -1 || !isLand(start)) continue;
    const id = nextLabel++;
    let top = 0;
    let count = 0;
    stack[top++] = start;
    label[start] = id;
    while (top > 0) {
      const o = stack[--top]!;
      members[count++] = o;
      const x = o % WORLD_TILES;
      const y = (o - x) / WORLD_TILES;
      if (x > 0 && label[o - 1] === -1 && isLand(o - 1)) { label[o - 1] = id; stack[top++] = o - 1; }
      if (x < WORLD_TILES - 1 && label[o + 1] === -1 && isLand(o + 1)) { label[o + 1] = id; stack[top++] = o + 1; }
      if (y > 0 && label[o - WORLD_TILES] === -1 && isLand(o - WORLD_TILES)) { label[o - WORLD_TILES] = id; stack[top++] = o - WORLD_TILES; }
      if (y < WORLD_TILES - 1 && label[o + WORLD_TILES] === -1 && isLand(o + WORLD_TILES)) { label[o + WORLD_TILES] = id; stack[top++] = o + WORLD_TILES; }
    }
    for (let i = 0; i < count; i++) sizes[members[i]!] = count;
  }
  return sizes;
}

const offsetOf = (x: number, y: number): number => y * WORLD_TILES + x;
const inside = (x: number, y: number): boolean =>
  x >= 0 && y >= 0 && x < WORLD_TILES && y < WORLD_TILES;

/** Waldanteil im 5×5-Fenster, 0..1. Außerhalb der Welt: 0. */
export function forestDensityAt(x: number, y: number): number {
  if (!inside(x, y)) return 0;
  forestNeighbourhood ??= buildForestNeighbourhood();
  return (forestNeighbourhood[offsetOf(x, y)] ?? 0) / 255;
}

/** Kacheln bis zur nächsten Steilküste (255 = weit weg / keine). */
export function cliffDistanceAt(x: number, y: number): number {
  if (!inside(x, y)) return 255;
  cliffDistance ??= buildCliffDistance();
  return cliffDistance[offsetOf(x, y)] ?? 255;
}

/** Kachelzahl der zusammenhängenden Landmasse (0 auf Wasser). */
export function landMassSizeAt(x: number, y: number): number {
  if (!inside(x, y)) return 0;
  landComponentSize ??= buildLandComponentSize();
  return landComponentSize[offsetOf(x, y)] ?? 0;
}

/** Geländesteigung der Kachel in Welt-Einheiten je Kachel (aus dem Bake). */
export function surfaceSlopeAt(x: number, y: number): number {
  if (!inside(x, y)) return 0;
  return (surfaceSlopeGrid[offsetOf(x, y)] ?? 0) / SURFACE_SLOPE_SCALE;
}

/** Ist die Kachel im Bake als bebaubar markiert? */
export function isBuildableTile(x: number, y: number): boolean {
  if (!inside(x, y)) return false;
  return ((buildabilityGrid[offsetOf(x, y)] ?? 0) & BUILDABLE_BIT) !== 0;
}

/** Ist die Kachel als Klippe markiert? */
export function isCliffTile(x: number, y: number): boolean {
  if (!inside(x, y)) return false;
  return ((buildabilityGrid[offsetOf(x, y)] ?? 0) & CLIFF_BIT) !== 0;
}

/** Ufertyp der Kachel: 0 keine, 1 Meer, 2 Fluss, 3 See, 4 Steilküste. */
export function shoreTypeAt(x: number, y: number): number {
  if (!inside(x, y)) return 0;
  return shoreTypeGrid[offsetOf(x, y)] ?? 0;
}

/** Nur für Tests/Diagnose: erzwingt den Neuaufbau der memoisierten Gitter. */
export function resetSurfaceMaskCache(): void {
  forestNeighbourhood = undefined;
  cliffDistance = undefined;
  landComponentSize = undefined;
}
