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

/** Deepest a river/lake canyon carves into adjacent land (§ MVP3 Phase 1 —
 *  Organisches Terrain-Mesh). Kept well short of the -0.32 first tried in
 *  design so the shoreline can look a little sandy/muddy (realistic) without
 *  the splat shader's sand band (`smoothstep(-0.05,0.12,h)`) misfiring far
 *  inland — see `docs/PATCHNOTES.md`. */
const RIVER_CANYON_DEPTH = 0.22;

/** Land near a river/lake dips toward the water in a V-shaped canyon profile
 *  (radius 2 falloff) instead of ending in a flat table or a single flat
 *  step, so the shoreline reads as a real carved valley (§ World Graphics V2
 *  — Gebirgsflüsse: "sie graben sich in das Gelände ein"). */
function riverBankDip(tx: number, ty: number, type: TerrainType): number {
  if (type === 'water' || type === 'river' || type === 'mountain') return 0;
  let best = Infinity;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (dx === 0 && dy === 0) continue;
      const dist = Math.hypot(dx, dy);
      if (dist > 2) continue;
      const nt = terrainAt(tx + dx, ty + dy);
      if ((nt === 'water' || nt === 'river') && dist < best) best = dist;
    }
  }
  if (best === Infinity) return 0;
  const t = clamp01((best - 1) / 1);
  return -RIVER_CANYON_DEPTH * Math.pow(1 - smooth(t), 1.3);
}

function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Snaps a [0,1] height into flat shelves with steep risers between them —
 *  reads as rock strata/plateaus instead of one smoothly rolling ridge
 *  (§ MVP3 Phase 1). `steps` = shelf count, `sharpness` = how much of each
 *  step is flat plateau vs. riser (higher = flatter shelves, narrower risers).
 *  Always stays in [0,1]. */
function terrace(h: number, steps: number, sharpness: number): number {
  const n = h * steps;
  const fl = Math.floor(n);
  const fr = n - fl;
  const rw = 0.5 / sharpness;
  const t = clamp01((fr - (0.5 - rw)) / (2 * rw));
  return (fl + smooth(t)) / steps;
}

/** Only for `sand` tiles touching water/river: a fine, low-amplitude ripple
 *  so beaches read as dunes/wet sand instead of a dead-flat table. Amplitude
 *  stays low enough to remain buildable-safe next to sand's own 0.05. */
function coastalDune(tx: number, ty: number, type: TerrainType): number {
  if (type !== 'sand') return 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const nt = terrainAt(tx + dx, ty + dy);
    if (nt === 'water' || nt === 'river') return fbm(tx * 0.6 + 50, ty * 0.6 + 90) * 0.04;
  }
  return 0;
}

const tileTargetCache = new Map<string, number>();

/** Target height for a single tile (its centre), from type + coherent hills.
 *  Pure/deterministic — memoised because mesh subdivision now re-queries the
 *  same tile corners several times per cell (§ MVP3 Phase 1). */
function tileTarget(tx: number, ty: number): number {
  const key = `${tx},${ty}`;
  const cached = tileTargetCache.get(key);
  if (cached !== undefined) return cached;

  const type = terrainAt(tx, ty);
  const [base, amp] = BASE[type];
  let result: number;
  if (amp === 0) {
    result = base;
  } else if (type === 'mountain') {
    const raw = ridgedFbm(tx * 0.085 + 21, ty * 0.085 + 13);
    const terraced = raw * 0.35 + terrace(raw, 5, 3) * 0.65;
    result = base + terraced * amp;
  } else {
    const hills = fbm(tx * 0.09 + 3.3, ty * 0.09 + 7.1); // large rolling hills
    result = base + hills * amp + riverBankDip(tx, ty, type) + coastalDune(tx, ty, type);
  }
  tileTargetCache.set(key, result);
  return result;
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
