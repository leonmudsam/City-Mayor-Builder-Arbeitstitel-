// Insel-Höhenfeld (v0.49, § MVP4 P3). The ONE source of truth for how high the
// ground is at any world point — the heightfield chunks, buildings, roads,
// props, vegetation, cars and markers all read it so nothing floats or sinks.
//
// Seit dem Welt-Neuaufbau kommt die Höhe nicht mehr aus Terrain-Typ + Rauschen,
// sondern direkt aus dem Offline-Bake der Referenz-GLB
// (`tools/bakeWorld.mjs` → `worldHeight.gen.ts`, 1025×1025 Uint16-Samples,
// 2 je Kachelkante): die Inselform, Gebirgshöhen, Seebecken, Flussrinnen und
// die Ozean-Tiefenrampe sind exakt die gebackene Geografie. Bebaubares Land ist
// bereits im Bake geglättet — Städte sitzen sauber, ohne dass die Sim Hänge
// prüfen müsste. Purely visual, mutiert nie State (CLAUDE.md §1).
//
// Scale convention: 1 tile ≈ 4 m; Wasserlinie = y 0; Gipfel ≈ 48 Einheiten
// (künstlerischer Faktor, docs/WORLD_SCALE.md).

import { HEIGHT_GRID, HEIGHT_MIN, HEIGHT_RANGE, HEIGHT_SAMPLES_PER_TILE, heightGrid } from './worldHeight.gen.ts';

/** Flache Wasseroberfläche (Ozean/Seen/Flüsse teilen eine Ebene), knapp unter
 *  der Uferlinie (= y 0 der gebackenen Welt), damit Strände lesbar bleiben. */
export const WATER_LEVEL = -0.04;

/** Globale Höhengrenzen der gebackenen Insel (tiefster Ozeanboden … höchster
 *  Gipfel). Reine Ableitung aus dem Bake — dient dem Terrain-Picking als
 *  vertikales Suchband, damit der Cursor-Strahl nur die Terrain-Schale abtastet.
 *  Kleiner Puffer, damit Randfälle sicher innerhalb des Bandes liegen. */
export const TERRAIN_MIN_Y = HEIGHT_MIN - 1;
export const TERRAIN_MAX_Y = HEIGHT_MIN + HEIGHT_RANGE + 1;

/**
 * Höhen-Bänder für den Splat-Shader (§ P3): EINE Quelle statt der früheren
 * Duplikation zwischen BASE-Tabelle und hartkodierten smoothstep-Konstanten in
 * `applyGroundSplat`. Kalibriert auf die gebackene Insel: Strände < ~0.9,
 * bebaubares Land überwiegend ~0.05–8, Fels ab ~9, Gipfel bis 48.
 */
export const SPLAT_BANDS = {
  /** Sand: voll unterhalb, ausgeblendet oberhalb dieses Bandes. */
  sandFadeStart: 0.15,
  sandFadeEnd: 0.9,
  /** Gras: eingeblendet ab … */
  grassFadeStart: 0.2,
  grassFadeEnd: 0.6,
  /** Fels/Stein: eingeblendet zwischen … */
  stoneStart: 9,
  stoneFull: 16,
  mountainFull: 28,
  snowStart: 36,
  snowFull: 44,
} as const;

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

const G = HEIGHT_GRID;
const S = HEIGHT_SAMPLES_PER_TILE;

/** Höhe eines Grid-Knotens (geklemmt — außerhalb setzt sich die Randtiefe fort). */
function nodeHeight(ix: number, iy: number): number {
  const cx = ix < 0 ? 0 : ix >= G ? G - 1 : ix;
  const cy = iy < 0 ? 0 : iy >= G ? G - 1 : iy;
  return HEIGHT_MIN + (heightGrid[cy * G + cx]! / 65535) * HEIGHT_RANGE;
}

/**
 * Ground height at any world point (x,y in tile units). Sampelt das gebackene
 * Grid mit smoothstep-geglätteter bilinearer Interpolation — C1-stetig, keine
 * Gitter-Falten im Shading (§ MVP3 Phase 3 bleibt erhalten).
 */
export function terrainHeightAt(x: number, y: number): number {
  const gx = x * S;
  const gy = y * S;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = smooth(gx - x0);
  const fy = smooth(gy - y0);
  const h00 = nodeHeight(x0, y0);
  const h10 = nodeHeight(x0 + 1, y0);
  const h01 = nodeHeight(x0, y0 + 1);
  const h11 = nodeHeight(x0 + 1, y0 + 1);
  const a = h00 + (h10 - h00) * fx;
  const b = h01 + (h11 - h01) * fx;
  return a + (b - a) * fy;
}

/**
 * Niedrigste Bodenhöhe im Umkreis `radius` (Kachel-Einheiten) um (x,y) — reine
 * Ableitung aus `terrainHeightAt`, keine zweite Höhenquelle.
 *
 * Starre Modelle (Gipfel, Felsen, Silhouetten) auf nur einem Punkt zu erden
 * lässt sie an Hängen schweben: der Sockel sitzt auf der Höhe der Mitte,
 * während der Boden ringsum abfällt. Wer stattdessen auf dem TIEFSTEN Punkt der
 * eigenen Grundfläche erdet, gräbt das Modell in den Hang ein statt es
 * freizustellen — sichtbar verankert statt schwebend.
 */
export function terrainMinHeightAround(x: number, y: number, radius: number): number {
  if (!(radius > 0)) return terrainHeightAt(x, y);
  let min = terrainHeightAt(x, y);
  // Zwei Ringe (0.6 r und r) à 8 Richtungen — deterministisch und billig genug
  // für Instancing-Aufbau, ohne den Hang zu untertasten.
  for (const f of [0.6, 1]) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const h = terrainHeightAt(x + Math.cos(a) * radius * f, y + Math.sin(a) * radius * f);
      if (h < min) min = h;
    }
  }
  return min;
}
