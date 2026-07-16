// Organic terrain height (v0.39). The ONE source of truth for how high the
// ground is at any world point — the heightfield mesh, buildings, roads, props,
// vegetation, cars and markers all read it so nothing floats or sinks. Purely
// visual: it derives height from the terrain *type* (which lives in the sim,
// `terrainAt`) plus coherent noise, but never mutates game state (CLAUDE.md §1).
//
// Scale convention: 1 tile ≈ 4 m. Buildable land (grass/fertile/sand/forest) is
// deliberately gentle so cities sit cleanly; water/river dip below the shoreline;
// mountains rise huge and smooth so the alpine biome reads as a real range and
// can be reinforced with drop-in rock/peak models.

import { terrainAt } from '../../game/config/startRegion.config.ts';
import type { TerrainType } from '../../game/types.ts';

/** Flat water surface level (lakes/rivers/sea share one plane). Just below the
 *  land shoreline so beaches read; the bed itself dips lower (see BASE). */
export const WATER_LEVEL = -0.12;

/** Per-type ground height: [base, noiseAmplitude]. Buildable land = low amplitude
 *  (clean building sites); mountains = huge; water/river = below the shoreline,
 *  with a little bed unevenness so they read as carved rather than a flat trench. */
const BASE: Record<TerrainType, [number, number]> = {
  water: [-0.85, 0.15],
  river: [-0.55, 0.12],
  sand: [0.0, 0.05],
  fertile: [0.03, 0.1],
  grass: [0.05, 0.18],
  forest: [0.18, 0.45],
  mountain: [2.6, 3.4],
};

// --- coherent value noise (smooth hills, deterministic) ---------------------

function hash2(ix: number, iy: number): number {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263)) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Value noise in [0,1] with smooth bilinear lattice interpolation. */
function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

/** 2-octave fractal noise in ~[0,1]. Smooth, rolling — used for gentle terrain
 *  (buildable land) so building sites stay clean. */
function fbm(x: number, y: number): number {
  return valueNoise(x, y) * 0.65 + valueNoise(x * 2.1 + 5.2, y * 2.1 + 1.7) * 0.35;
}

/** Folds value noise into a ridge: sharp, narrow peaks and V-shaped valleys
 *  instead of a smooth round hill — the shape real ridgelines/rock plates have. */
function ridged(x: number, y: number): number {
  return 1 - Math.abs(valueNoise(x, y) * 2 - 1);
}

/** 3-octave ridged fractal noise in ~[0,1] (§ World Graphics V2 — Gebirge
 *  überarbeiten): jagged ridgelines with broken, cliff-like high-frequency
 *  detail layered on top, instead of the smooth rolling-hill look of `fbm`. */
function ridgedFbm(x: number, y: number): number {
  return (
    ridged(x, y) * 0.6 +
    ridged(x * 2.3 + 5.2, y * 2.3 + 1.7) * 0.25 +
    ridged(x * 4.9 + 11.3, y * 4.9 + 3.1) * 0.15
  );
}

/** Land right next to a river/lake dips a little toward the water instead of
 *  ending in a flat table, so the shoreline reads as a carved bank (§ World
 *  Graphics V2 — Gebirgsflüsse: "sie graben sich in das Gelände ein"). */
function riverBankDip(tx: number, ty: number, type: TerrainType): number {
  if (type === 'water' || type === 'river' || type === 'mountain') return 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const nt = terrainAt(tx + dx, ty + dy);
    if (nt === 'water' || nt === 'river') return -0.06;
  }
  return 0;
}

/** Target height for a single tile (its centre), from type + coherent hills. */
function tileTarget(tx: number, ty: number): number {
  const type = terrainAt(tx, ty);
  const [base, amp] = BASE[type];
  if (amp === 0) return base;
  if (type === 'mountain') {
    return base + ridgedFbm(tx * 0.085 + 21, ty * 0.085 + 13) * amp;
  }
  const hills = fbm(tx * 0.09 + 3.3, ty * 0.09 + 7.1); // large rolling hills
  return base + hills * amp + riverBankDip(tx, ty, type);
}

/**
 * Ground height at any world point (x,y in tile units). Bilinearly interpolates
 * the four surrounding tile targets so the surface is smooth and organic — no
 * blocky steps — while staying continuous between neighbouring tiles.
 */
export function terrainHeightAt(x: number, y: number): number {
  const gx = x - 0.5;
  const gy = y - 0.5;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = gx - x0;
  const fy = gy - y0;
  const h00 = tileTarget(x0, y0);
  const h10 = tileTarget(x0 + 1, y0);
  const h01 = tileTarget(x0, y0 + 1);
  const h11 = tileTarget(x0 + 1, y0 + 1);
  const a = h00 + (h10 - h00) * fx;
  const b = h01 + (h11 - h01) * fx;
  return a + (b - a) * fy;
}
