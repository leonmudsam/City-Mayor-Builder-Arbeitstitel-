#!/usr/bin/env node
// bakeWorld.mjs — Offline-Bake der verbindlichen Welt-GLB (§ MVP4 Welt-Neuaufbau).
//
// Liest `reference/stylized island map 3d model.glb` (44 Meshes, reine Geometrie)
// und erzeugt daraus deterministisch die committeten Laufzeit-Daten:
//
//   src/game/config/world/islandTerrain.gen.ts   — 384×384 Terrain-Typ-Grid (Sim)
//   src/game/config/world/islandRegions.gen.ts   — 384×384 Region-Id-Grid + Statistik (Sim)
//   src/renderer/three/worldHeight.gen.ts        — 769×769 Höhen-Grid (Renderer)
//   tools/bake-report.md                         — Statistik + gewählter Start
//   tools/bake-preview.png                       — visuelle Kontrolle (Hypsometrie + Regionsgrenzen)
//
// Die GLB wird NIE zur Laufzeit geladen (45 MB); dieses Skript ist der einzige
// Konsument. Alle Regeln (Wasserlinie, Biome, Glättung) sind hier zentral und in
// docs/WORLD_REBUILD.md dokumentiert. Aufruf: `node tools/bakeWorld.mjs`.
//
// Pipeline: GLB parsen → Dreiecke top-down in ein Höhen-Grid rastern (Max-Y,
// baryzentrisch interpoliert) → Wasser klassifizieren (Flood-Fill: offener Ozean
// vs. eingeschlossene Seen; Breiten-Heuristik: schmale Rinnen = Fluss) → Biome
// regelbasiert (Höhe/Hang/Wassernähe/Noise) → bebaubares Land glätten (die Sim
// kennt keine Hangprüfung — Bauflächen MÜSSEN sanft sein) → ORGANISCHE REGIONEN
// segmentieren (§ Welt 2.0: Seeds auf Biom-Clustern, kostenbasiertes Wachstum
// entlang natürlicher Grenzen, kleine Regionen mergen) → Startregion wählen und
// validieren (≥ MIN_START_BUILDABLE bebaubare Kacheln) → Ausgaben schreiben.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import zlib from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GLB_PATH = join(ROOT, 'reference', 'stylized island map 3d model.glb');

// ---------------------------------------------------------------------------
// Verbindliche Maßstabs-Konstanten (siehe docs/WORLD_SCALE.md)
// ---------------------------------------------------------------------------
const WORLD_TILES = 384;          // Weltbreite/-tiefe in Kacheln (1 Kachel ≈ 4 m)
const SAMPLES_PER_TILE = 2;       // Höhen-Samples je Kachelkante
const GRID = WORLD_TILES * SAMPLES_PER_TILE + 1; // 769 — Höhen-Grid-Knoten je Achse
const OCEAN_MARGIN_TILES = 12;    // Ozean-Ring: Insel wird in [margin, TILES-margin] einbeschrieben
const PEAK_WORLD_HEIGHT = 20;     // künstlerischer Höhenfaktor: höchster Gipfel in Welt-Einheiten
const WATERLINE_N = 0.006;        // normalisierte GLB-Höhe der Wasserlinie (aus Histogramm kalibriert)

// Klassifikations-Schwellen (Welt-Einheiten / Kacheln)
const MOUNTAIN_HEIGHT = 5.5;      // ab dieser Höhe: Gebirge
const MOUNTAIN_SLOPE = 1.1;       // ODER ab diesem Höhendelta je Kachelschritt
const SAND_MAX_HEIGHT = 1.0;      // Strandband: niedrig …
const SAND_WATER_DIST = 2;        // … und ≤ 2 Kacheln vom Wasser
const FERTILE_MAX_HEIGHT = 2.4;   // fruchtbares Land: tief, flach, gewässernah
const FERTILE_MAX_SLOPE = 0.4;
const FERTILE_WATER_DIST = 7;
const FOREST_MIN_HEIGHT = 0.5;    // Wald-Patches: mittleres Band, per Noise
const FOREST_MAX_HEIGHT = 5.5;
const FOREST_MAX_SLOPE = 0.9;
const RIVER_WIDTH_WINDOW = 2;     // 5×5-Fenster für die Fluss-Breiten-Heuristik
const RIVER_MAX_NEIGHBORS = 14;   // < 14 Wasser-Nachbarn im Fenster ⇒ schmale Rinne ⇒ Fluss
const LAKE_MIN_TILES = 24;        // eingeschlossene Wasserflächen ab dieser Größe = See

// Glättung bebaubaren Landes (grass/fertile/sand/forest)
const SMOOTH_ITERATIONS = 10;
const SMOOTH_BLEND = 0.55;        // Anteil 4-Nachbar-Mittel je Iteration
const MAX_BUILDABLE_STEP = 0.07;  // max. Höhendelta zwischen Nachbar-Samples (≈ 0.14/Kachel — Gebäude sitzen sauber, ohne lokale Einebnung)

// Organische Regionen (§ Welt 2.0 — ersetzen die 36 Quadrat-Sektoren)
const REGION_TARGET_TILES = 3800; // Zielgröße einer Region (steuert Seed-Anzahl je Biom-Cluster)
const REGION_MIN_COMPONENT = 200; // Biom-Cluster kleiner als das bekommen keinen eigenen Seed
const REGION_MIN_TILES = 1000;    // kleinere Regionen werden in den Nachbarn mit längster Grenze gemerged
const REGION_MAX_SEEDS = 32;      // hartes Seed-Limit (Region-Ids passen in Uint8, Ozean = 0)
const COST_FOREIGN_BIOME = 4;     // Wachstums-Mehrkosten beim Betreten eines fremden Bioms
const COST_CROSS_RIVER = 6;       // Zusatzkosten, einen Fluss zu queren (Flüsse = natürliche Grenzen)
const COST_HEIGHT_FACTOR = 4;     // Zusatzkosten je Höhendelta (Gebirgskämme = natürliche Grenzen)

// Start-Validierung (§ Auftrag: 2.500–4.000 nutzbare Kacheln in der Startregion)
const MIN_START_BUILDABLE = 2500;

// Terrain-IDs (Encoding im Gen-Grid; Reihenfolge = TERRAIN_IDS im Gen-File)
const T = { water: 0, river: 1, sand: 2, fertile: 3, grass: 4, forest: 5, mountain: 6 };
const T_NAMES = ['water', 'river', 'sand', 'fertile', 'grass', 'forest', 'mountain'];
const BUILDABLE = new Set([T.sand, T.fertile, T.grass, T.forest]);

// ---------------------------------------------------------------------------
// 1. GLB parsen (roh, ohne Dependencies)
// ---------------------------------------------------------------------------
console.log('— GLB lesen:', GLB_PATH);
const glb = readFileSync(GLB_PATH);
if (glb.readUInt32LE(0) !== 0x46546c67) throw new Error('kein GLB');
const jsonLen = glb.readUInt32LE(12);
const gltf = JSON.parse(glb.slice(20, 20 + jsonLen).toString('utf8'));
const binStart = 20 + jsonLen + 8;
const A = gltf.accessors;
const BV = gltf.bufferViews;

function accessorInfo(idx) {
  const acc = A[idx];
  const bv = BV[acc.bufferView];
  return { acc, base: binStart + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0), stride: bv.byteStride };
}

// Gesamt-Bounds aus den POSITION-Accessoren
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, minYn = Infinity, maxYn = -Infinity;
for (const m of gltf.meshes) for (const p of m.primitives) {
  const acc = A[p.attributes.POSITION];
  minX = Math.min(minX, acc.min[0]); maxX = Math.max(maxX, acc.max[0]);
  minZ = Math.min(minZ, acc.min[2]); maxZ = Math.max(maxZ, acc.max[2]);
  minYn = Math.min(minYn, acc.min[1]); maxYn = Math.max(maxYn, acc.max[1]);
}
console.log(`  Bounds X[${minX.toFixed(3)},${maxX.toFixed(3)}] Z[${minZ.toFixed(3)},${maxZ.toFixed(3)}] Y[${minYn.toFixed(3)},${maxYn.toFixed(3)}]`);

// ---------------------------------------------------------------------------
// 2. Dreiecke top-down rastern → Höhen-Grid (Max-Y je Knoten)
// ---------------------------------------------------------------------------
// Insel einbeschrieben mit Ozean-Rand: GLB-XZ → Grid-Knoten [margin*S, (TILES-margin)*S]
const gMin = OCEAN_MARGIN_TILES * SAMPLES_PER_TILE;
const gMax = (WORLD_TILES - OCEAN_MARGIN_TILES) * SAMPLES_PER_TILE;
const gSpan = gMax - gMin;
const H = new Float32Array(GRID * GRID).fill(NaN); // normalisierte GLB-Höhe; NaN = keine Geometrie

const toGx = (x) => gMin + ((x - minX) / (maxX - minX)) * gSpan;
const toGz = (z) => gMin + ((z - minZ) / (maxZ - minZ)) * gSpan;

let triCount = 0;
console.log('— Dreiecke rastern …');
for (const m of gltf.meshes) for (const p of m.primitives) {
  const pos = accessorInfo(p.attributes.POSITION);
  const posStride = pos.stride ?? 12;
  const idx = accessorInfo(p.indices);
  const idxComp = idx.acc.componentType; // 5123 u16 | 5125 u32
  const readIdx = idxComp === 5125
    ? (i) => glb.readUInt32LE(idx.base + i * 4)
    : (i) => glb.readUInt16LE(idx.base + i * 2);
  const P = (i) => {
    const o = pos.base + i * posStride;
    return [glb.readFloatLE(o), glb.readFloatLE(o + 4), glb.readFloatLE(o + 8)];
  };
  const n = idx.acc.count;
  for (let t = 0; t < n; t += 3) {
    const [ax, ay, az] = P(readIdx(t));
    const [bx, by, bz] = P(readIdx(t + 1));
    const [cx, cy, cz] = P(readIdx(t + 2));
    const gax = toGx(ax), gaz = toGz(az);
    const gbx = toGx(bx), gbz = toGz(bz);
    const gcx = toGx(cx), gcz = toGz(cz);
    const x0 = Math.max(0, Math.floor(Math.min(gax, gbx, gcx)));
    const x1 = Math.min(GRID - 1, Math.ceil(Math.max(gax, gbx, gcx)));
    const z0 = Math.max(0, Math.floor(Math.min(gaz, gbz, gcz)));
    const z1 = Math.min(GRID - 1, Math.ceil(Math.max(gaz, gbz, gcz)));
    const d = (gbx - gax) * (gcz - gaz) - (gcx - gax) * (gbz - gaz);
    if (Math.abs(d) < 1e-12) { // degeneriert in der Draufsicht (senkrechte Wand) → Eckknoten setzen
      for (const [gx, gz, y] of [[gax, gaz, ay], [gbx, gbz, by], [gcx, gcz, cy]]) {
        const xi = Math.round(gx), zi = Math.round(gz);
        if (xi < 0 || zi < 0 || xi >= GRID || zi >= GRID) continue;
        const o = zi * GRID + xi;
        if (!(H[o] >= y)) H[o] = Math.max(Number.isNaN(H[o]) ? -Infinity : H[o], y);
      }
      triCount++;
      continue;
    }
    for (let zi = z0; zi <= z1; zi++) {
      for (let xi = x0; xi <= x1; xi++) {
        const w0 = ((gbx - xi) * (gcz - zi) - (gcx - xi) * (gbz - zi)) / d;
        const w1 = ((gcx - xi) * (gaz - zi) - (gax - xi) * (gcz - zi)) / d;
        const w2 = 1 - w0 - w1;
        if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
        const y = w0 * ay + w1 * by + w2 * cy;
        const o = zi * GRID + xi;
        if (Number.isNaN(H[o]) || y > H[o]) H[o] = y;
      }
    }
    triCount++;
  }
}
let covered = 0;
for (let i = 0; i < H.length; i++) if (!Number.isNaN(H[i])) covered++;
console.log(`  ${triCount.toLocaleString('de-DE')} Dreiecke, Abdeckung ${(100 * covered / H.length).toFixed(1)} % der Knoten`);

// ---------------------------------------------------------------------------
// 3. Wasser auf Kachel-Ebene klassifizieren
// ---------------------------------------------------------------------------
// Je Kachel: Abdeckung + mittlere Höhe der 2×2 inneren Knoten. Wasser-Kandidat =
// unbedeckt (Ozean/See — die GLB modelliert keinen Meeresboden) oder unter der
// Wasserlinie (gecarvte Fluss-/Uferrinnen).
const tileMeanN = new Float32Array(WORLD_TILES * WORLD_TILES).fill(NaN);
const isWaterCand = new Uint8Array(WORLD_TILES * WORLD_TILES);
for (let ty = 0; ty < WORLD_TILES; ty++) {
  for (let tx = 0; tx < WORLD_TILES; tx++) {
    let sum = 0, cnt = 0, miss = 0;
    for (let dz = 0; dz <= SAMPLES_PER_TILE; dz++) for (let dx = 0; dx <= SAMPLES_PER_TILE; dx++) {
      const v = H[(ty * SAMPLES_PER_TILE + dz) * GRID + tx * SAMPLES_PER_TILE + dx];
      if (Number.isNaN(v)) miss++; else { sum += v; cnt++; }
    }
    const o = ty * WORLD_TILES + tx;
    if (cnt > 0) tileMeanN[o] = sum / cnt;
    if (miss > cnt || (cnt > 0 && sum / cnt < WATERLINE_N)) isWaterCand[o] = 1;
  }
}

// Flood-Fill vom Rand: offener Ozean. Übrige Wasser-Kandidaten = eingeschlossen.
const oceanMask = new Uint8Array(WORLD_TILES * WORLD_TILES);
{
  const q = [];
  for (let i = 0; i < WORLD_TILES; i++) {
    for (const o of [i, (WORLD_TILES - 1) * WORLD_TILES + i, i * WORLD_TILES, i * WORLD_TILES + WORLD_TILES - 1]) {
      if (isWaterCand[o] && !oceanMask[o]) { oceanMask[o] = 1; q.push(o); }
    }
  }
  while (q.length) {
    const o = q.pop();
    const tx = o % WORLD_TILES, ty = (o / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const no = ny * WORLD_TILES + nx;
      if (isWaterCand[no] && !oceanMask[no]) { oceanMask[no] = 1; q.push(no); }
    }
  }
}

// Eingeschlossene Wasser-Blobs: groß = See, klein = Rinne (→ Fluss).
const enclosedLabel = new Int32Array(WORLD_TILES * WORLD_TILES).fill(-1);
const enclosedSizes = [];
for (let o = 0; o < isWaterCand.length; o++) {
  if (!isWaterCand[o] || oceanMask[o] || enclosedLabel[o] >= 0) continue;
  const label = enclosedSizes.length;
  const q = [o];
  enclosedLabel[o] = label;
  let size = 0;
  while (q.length) {
    const c = q.pop();
    size++;
    const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const no = ny * WORLD_TILES + nx;
      if (isWaterCand[no] && !oceanMask[no] && enclosedLabel[no] < 0) { enclosedLabel[no] = label; q.push(no); }
    }
  }
  enclosedSizes.push(size);
}

// ---------------------------------------------------------------------------
// 4. Höhen in Welt-Einheiten + Ozean-Tiefenrampe
// ---------------------------------------------------------------------------
const HEIGHT_SCALE = PEAK_WORLD_HEIGHT / (maxYn - WATERLINE_N);
// Distanz jeder Wasser-Kachel zum Land (BFS) für die Tiefenrampe.
const distToLand = new Int32Array(WORLD_TILES * WORLD_TILES).fill(-1);
{
  const q = [];
  for (let o = 0; o < isWaterCand.length; o++) {
    if (!isWaterCand[o]) { distToLand[o] = 0; q.push(o); }
  }
  let head = 0;
  while (head < q.length) {
    const c = q[head++];
    const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const no = ny * WORLD_TILES + nx;
      if (distToLand[no] < 0) { distToLand[no] = distToLand[c] + 1; q.push(no); }
    }
  }
}

// Welt-Höhen-Grid: bedeckt = (h - Wasserlinie) · Faktor; unbedeckt = Tiefenrampe.
const HW = new Float32Array(GRID * GRID);
for (let gz = 0; gz < GRID; gz++) {
  for (let gx = 0; gx < GRID; gx++) {
    const o = gz * GRID + gx;
    const tx = Math.min(WORLD_TILES - 1, (gx / SAMPLES_PER_TILE) | 0);
    const ty = Math.min(WORLD_TILES - 1, (gz / SAMPLES_PER_TILE) | 0);
    const to = ty * WORLD_TILES + tx;
    if (!Number.isNaN(H[o])) {
      HW[o] = (H[o] - WATERLINE_N) * HEIGHT_SCALE;
    } else {
      const d = Math.max(1, distToLand[to]);
      const enclosed = enclosedLabel[to] >= 0;
      // Seen flacher als offener Ozean; sanfte Rampe zur Küste.
      HW[o] = enclosed ? -0.8 : -Math.min(3.0, 0.45 + d * 0.28);
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Biome klassifizieren (Kachel-Ebene)
// ---------------------------------------------------------------------------
// Deterministische Noise (identisches Muster wie startRegion.tileHash/valueNoise).
function hash2(ix, iy) {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263)) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}
const smooth01 = (t) => t * t * (3 - 2 * t);
function valueNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smooth01(x - ix), fy = smooth01(y - iy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}
const fbm = (x, y) => valueNoise(x, y) * 0.65 + valueNoise(x * 2.1 + 5.2, y * 2.1 + 1.7) * 0.35;

const tileH = (tx, ty) => HW[(ty * SAMPLES_PER_TILE + 1) * GRID + tx * SAMPLES_PER_TILE + 1]; // Kachel-Mitte
function tileSlope(tx, ty) {
  const c = tileH(tx, ty);
  let m = 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = Math.min(WORLD_TILES - 1, Math.max(0, tx + dx));
    const ny = Math.min(WORLD_TILES - 1, Math.max(0, ty + dy));
    m = Math.max(m, Math.abs(tileH(nx, ny) - c));
  }
  return m;
}

// Distanz zu Fluss/See (für fertile) und zu beliebigem Wasser (für sand) — BFS folgt unten nach der Wasser-Typisierung.
const terrain = new Uint8Array(WORLD_TILES * WORLD_TILES);

// 5a. Wasser-Typen: Ozean/See = water, schmale Rinnen = river.
for (let ty = 0; ty < WORLD_TILES; ty++) {
  for (let tx = 0; tx < WORLD_TILES; tx++) {
    const o = ty * WORLD_TILES + tx;
    if (!isWaterCand[o]) continue;
    const enclosed = enclosedLabel[o] >= 0;
    if (enclosed && enclosedSizes[enclosedLabel[o]] < LAKE_MIN_TILES) { terrain[o] = T.river; continue; }
    // Breiten-Heuristik: wenige Wasser-Nachbarn im 5×5-Fenster ⇒ schmale Rinne ⇒ Fluss.
    let waterNear = 0;
    for (let dy = -RIVER_WIDTH_WINDOW; dy <= RIVER_WIDTH_WINDOW; dy++) {
      for (let dx = -RIVER_WIDTH_WINDOW; dx <= RIVER_WIDTH_WINDOW; dx++) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) { waterNear++; continue; }
        if (isWaterCand[ny * WORLD_TILES + nx]) waterNear++;
      }
    }
    terrain[o] = waterNear < RIVER_MAX_NEIGHBORS ? T.river : T.water;
  }
}

// 5b. Distanz zu Wasser (beliebig) und zu Süßwasser (river|see=eingeschlossenes water) per BFS.
function bfsDistance(isSource) {
  const dist = new Int32Array(WORLD_TILES * WORLD_TILES).fill(-1);
  const q = [];
  for (let o = 0; o < dist.length; o++) if (isSource(o)) { dist[o] = 0; q.push(o); }
  let head = 0;
  while (head < q.length) {
    const c = q[head++];
    const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const no = ny * WORLD_TILES + nx;
      if (dist[no] < 0) { dist[no] = dist[c] + 1; q.push(no); }
    }
  }
  return dist;
}
const distWater = bfsDistance((o) => isWaterCand[o] === 1);
const distFresh = bfsDistance((o) => terrain[o] === T.river || (terrain[o] === T.water && enclosedLabel[o] >= 0));

// 5c. Land-Biome.
for (let ty = 0; ty < WORLD_TILES; ty++) {
  for (let tx = 0; tx < WORLD_TILES; tx++) {
    const o = ty * WORLD_TILES + tx;
    if (isWaterCand[o]) continue;
    const h = tileH(tx, ty);
    const s = tileSlope(tx, ty);
    if (h > MOUNTAIN_HEIGHT || s > MOUNTAIN_SLOPE) { terrain[o] = T.mountain; continue; }
    if (h < SAND_MAX_HEIGHT && distWater[o] <= SAND_WATER_DIST) { terrain[o] = T.sand; continue; }
    if (h < FERTILE_MAX_HEIGHT && s < FERTILE_MAX_SLOPE && distFresh[o] <= FERTILE_WATER_DIST && fbm(tx * 0.11 + 40, ty * 0.11 + 8) > 0.42) {
      terrain[o] = T.fertile;
      continue;
    }
    const forestNoise = fbm(tx * 0.055 + 17, ty * 0.055 + 71);
    if (h > FOREST_MIN_HEIGHT && h < FOREST_MAX_HEIGHT && s < FOREST_MAX_SLOPE && forestNoise > 0.58) {
      terrain[o] = T.forest;
      continue;
    }
    terrain[o] = T.grass;
  }
}

// ---------------------------------------------------------------------------
// 6. Bebaubares Land glätten (Sim hat keine Hangprüfung)
// ---------------------------------------------------------------------------
const nodeBuildable = new Uint8Array(GRID * GRID);
for (let gz = 0; gz < GRID; gz++) {
  for (let gx = 0; gx < GRID; gx++) {
    const tx = Math.min(WORLD_TILES - 1, (gx / SAMPLES_PER_TILE) | 0);
    const ty = Math.min(WORLD_TILES - 1, (gz / SAMPLES_PER_TILE) | 0);
    if (BUILDABLE.has(terrain[ty * WORLD_TILES + tx])) nodeBuildable[gz * GRID + gx] = 1;
  }
}
for (let it = 0; it < SMOOTH_ITERATIONS; it++) {
  const src = HW.slice();
  for (let gz = 1; gz < GRID - 1; gz++) {
    for (let gx = 1; gx < GRID - 1; gx++) {
      const o = gz * GRID + gx;
      if (!nodeBuildable[o]) continue;
      const avg = (src[o - 1] + src[o + 1] + src[o - GRID] + src[o + GRID]) / 4;
      HW[o] = src[o] + (avg - src[o]) * SMOOTH_BLEND;
    }
  }
  // Hang-Kappung zwischen bebaubaren Nachbarn.
  for (let gz = 0; gz < GRID; gz++) {
    for (let gx = 0; gx < GRID - 1; gx++) {
      const a = gz * GRID + gx, b = a + 1;
      if (!nodeBuildable[a] || !nodeBuildable[b]) continue;
      const d = HW[b] - HW[a];
      if (Math.abs(d) > MAX_BUILDABLE_STEP) {
        const ex = (Math.abs(d) - MAX_BUILDABLE_STEP) / 2 * Math.sign(d);
        HW[a] += ex; HW[b] -= ex;
      }
    }
  }
  for (let gx = 0; gx < GRID; gx++) {
    for (let gz = 0; gz < GRID - 1; gz++) {
      const a = gz * GRID + gx, b = a + GRID;
      if (!nodeBuildable[a] || !nodeBuildable[b]) continue;
      const d = HW[b] - HW[a];
      if (Math.abs(d) > MAX_BUILDABLE_STEP) {
        const ex = (Math.abs(d) - MAX_BUILDABLE_STEP) / 2 * Math.sign(d);
        HW[a] += ex; HW[b] -= ex;
      }
    }
  }
}
// Abschließende Kappungs-Sweeps bis zur Konvergenz: ein einzelner Gauss-Seidel-
// Durchlauf je Iteration lässt an Klippenrändern Rest-Verletzungen stehen —
// hier wird die Bebaubar-Garantie (max. Schritt) hart erzwungen.
let lastViolations = -1;
for (let sweep = 0; sweep < 400; sweep++) {
  let violations = 0;
  for (let gz = 0; gz < GRID; gz++) {
    for (let gx = 0; gx < GRID - 1; gx++) {
      const a = gz * GRID + gx, b = a + 1;
      if (!nodeBuildable[a] || !nodeBuildable[b]) continue;
      const d = HW[b] - HW[a];
      if (Math.abs(d) > MAX_BUILDABLE_STEP) {
        const ex = (Math.abs(d) - MAX_BUILDABLE_STEP) / 2 * Math.sign(d);
        HW[a] += ex; HW[b] -= ex; violations++;
      }
    }
  }
  for (let gx = 0; gx < GRID; gx++) {
    for (let gz = 0; gz < GRID - 1; gz++) {
      const a = gz * GRID + gx, b = a + GRID;
      if (!nodeBuildable[a] || !nodeBuildable[b]) continue;
      const d = HW[b] - HW[a];
      if (Math.abs(d) > MAX_BUILDABLE_STEP) {
        const ex = (Math.abs(d) - MAX_BUILDABLE_STEP) / 2 * Math.sign(d);
        HW[a] += ex; HW[b] -= ex; violations++;
      }
    }
  }
  lastViolations = violations;
  if (violations === 0) break;
}
if (lastViolations > 0) console.warn(`  WARNUNG: ${lastViolations} Kappungs-Verletzungen nach 400 Sweeps übrig`);
// Bebaubares Land darf nach der Glättung nicht unter die Wasserlinie rutschen.
for (let o = 0; o < HW.length; o++) if (nodeBuildable[o] && HW[o] < 0.05) HW[o] = 0.05;

// ---------------------------------------------------------------------------
// 7. Organische Regionen segmentieren (§ Welt 2.0)
// ---------------------------------------------------------------------------
// Land (inkl. Seen/Flüsse — die gehören zur Landschaft, z. B. „Seenlandschaft")
// wird in ~24–32 zusammenhängende Regionen zerlegt: Seeds auf den größten
// Biom-Clustern, dann kostenbasiertes Multi-Source-Wachstum (Dijkstra); fremde
// Biome, Fluss-Querungen und Höhendeltas verteuern den Schritt, sodass Grenzen
// an Biomkanten, Flüssen und Kämmen entlanglaufen. Kleine Regionen werden in
// den Nachbarn mit der längsten gemeinsamen Grenze gemerged. Ozean = Region 0.
const SIZE = WORLD_TILES * WORLD_TILES;
const isLand = (o) => !oceanMask[o];

console.log('— Regionen segmentieren …');
// 7a. Biom-Cluster (zusammenhängende Komponenten gleichen Terrains auf Land).
const compOf = new Int32Array(SIZE).fill(-1);
const comps = [];
for (let o = 0; o < SIZE; o++) {
  if (!isLand(o) || compOf[o] >= 0) continue;
  const cls = terrain[o];
  const tiles = [o];
  compOf[o] = comps.length;
  for (let head = 0; head < tiles.length; head++) {
    const c = tiles[head];
    const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const no = ny * WORLD_TILES + nx;
      if (isLand(no) && compOf[no] < 0 && terrain[no] === cls) { compOf[no] = comps.length; tiles.push(no); }
    }
  }
  comps.push({ cls, tiles });
}

// 7b. Seeds: je Cluster ≥ REGION_MIN_COMPONENT, Anzahl ∝ Größe; Verteilung im
// Cluster per Farthest-Point-Sampling (BFS-Distanz innerhalb des Clusters).
const seeds = []; // { tile, cls }
const compsBySize = comps.map((c, i) => ({ ...c, i })).sort((a, b) => b.tiles.length - a.tiles.length || a.i - b.i);
for (const comp of compsBySize) {
  if (seeds.length >= REGION_MAX_SEEDS) break;
  if (comp.tiles.length < REGION_MIN_COMPONENT) continue;
  const want = Math.max(1, Math.min(8, Math.round(comp.tiles.length / REGION_TARGET_TILES), REGION_MAX_SEEDS - seeds.length));
  // Centroid-nächste Kachel als erster Seed.
  let cx = 0, cy = 0;
  for (const o of comp.tiles) { cx += o % WORLD_TILES; cy += (o / WORLD_TILES) | 0; }
  cx /= comp.tiles.length; cy /= comp.tiles.length;
  let first = comp.tiles[0], bestD = Infinity;
  for (const o of comp.tiles) {
    const d = Math.hypot((o % WORLD_TILES) - cx, ((o / WORLD_TILES) | 0) - cy);
    if (d < bestD - 1e-9 || (Math.abs(d - bestD) < 1e-9 && o < first)) { bestD = d; first = o; }
  }
  const local = [first];
  while (local.length < want) {
    // BFS-Distanz von allen bisherigen lokalen Seeds, nur innerhalb des Clusters.
    const dist = new Int32Array(SIZE).fill(-1);
    const q = local.slice();
    for (const s of q) dist[s] = 0;
    let head = 0;
    while (head < q.length) {
      const c = q[head++];
      const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
        const no = ny * WORLD_TILES + nx;
        if (compOf[no] === comp.i && dist[no] < 0) { dist[no] = dist[c] + 1; q.push(no); }
      }
    }
    let far = -1, farD = -1;
    for (const o of comp.tiles) if (dist[o] > farD || (dist[o] === farD && o < far)) { farD = dist[o]; far = o; }
    if (far < 0 || farD <= 4) break; // Cluster zu kompakt für weitere Seeds
    local.push(far);
  }
  for (const t of local) seeds.push({ tile: t, cls: comp.cls });
}
console.log(`  ${comps.length} Biom-Cluster → ${seeds.length} Region-Seeds`);

// 7c. Kostenbasiertes Multi-Source-Wachstum (deterministischer Binär-Heap).
const regionOf = new Int32Array(SIZE).fill(-1); // Seed-Index je Kachel
{
  const heap = []; // Einträge [cost, order, tile, seedIdx]; order = stabiler Tiebreak
  let order = 0;
  const push = (e) => {
    heap.push(e);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] < heap[i][0] || (heap[p][0] === heap[i][0] && heap[p][1] < heap[i][1])) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < heap.length && (heap[l][0] < heap[m][0] || (heap[l][0] === heap[m][0] && heap[l][1] < heap[m][1]))) m = l;
        if (r < heap.length && (heap[r][0] < heap[m][0] || (heap[r][0] === heap[m][0] && heap[r][1] < heap[m][1]))) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  const bestCost = new Float64Array(SIZE).fill(Infinity);
  seeds.forEach((s, i) => { bestCost[s.tile] = 0; push([0, order++, s.tile, i]); });
  while (heap.length) {
    const [cost, , tile, seedIdx] = pop();
    if (regionOf[tile] >= 0) continue;
    regionOf[tile] = seedIdx;
    const tx = tile % WORLD_TILES, ty = (tile / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const no = ny * WORLD_TILES + nx;
      if (!isLand(no) || regionOf[no] >= 0) continue;
      let step = 1;
      if (terrain[no] !== seeds[seedIdx].cls) step += COST_FOREIGN_BIOME;
      if (terrain[no] === T.river && seeds[seedIdx].cls !== T.river) step += COST_CROSS_RIVER;
      step += Math.min(6, Math.abs(tileH(nx, ny) - tileH(tx, ty)) * COST_HEIGHT_FACTOR);
      const nc = cost + step;
      if (nc < bestCost[no]) { bestCost[no] = nc; push([nc, order++, no, seedIdx]); }
    }
  }
}

// 7d. Kleine Regionen in den Nachbarn mit der längsten gemeinsamen Grenze mergen.
for (;;) {
  const count = new Map();
  for (let o = 0; o < SIZE; o++) if (regionOf[o] >= 0) count.set(regionOf[o], (count.get(regionOf[o]) ?? 0) + 1);
  let smallest = null;
  for (const [r, n] of count) if (n < REGION_MIN_TILES && (!smallest || n < smallest.n)) smallest = { r, n };
  if (!smallest) break;
  const border = new Map();
  for (let o = 0; o < SIZE; o++) {
    if (regionOf[o] !== smallest.r) continue;
    const tx = o % WORLD_TILES, ty = (o / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const rn = regionOf[ny * WORLD_TILES + nx];
      if (rn >= 0 && rn !== smallest.r) border.set(rn, (border.get(rn) ?? 0) + 1);
    }
  }
  let target = null;
  for (const [r, n] of border) if (!target || n > target.n || (n === target.n && r < target.r)) target = { r, n };
  if (!target) break; // isolierte Mini-Insel: bleibt eigene Region
  for (let o = 0; o < SIZE; o++) if (regionOf[o] === smallest.r) regionOf[o] = target.r;
}

// 7e. Finale Ids 1..N (0 = Ozean), Reihenfolge deterministisch nach Größe.
const finalIds = new Map(); // seedIdx → finale Id
{
  const count = new Map();
  const firstTile = new Map();
  for (let o = 0; o < SIZE; o++) {
    const r = regionOf[o];
    if (r < 0) continue;
    count.set(r, (count.get(r) ?? 0) + 1);
    if (!firstTile.has(r)) firstTile.set(r, o);
  }
  const ordered = [...count.keys()].sort((a, b) => count.get(b) - count.get(a) || firstTile.get(a) - firstTile.get(b));
  ordered.forEach((r, i) => finalIds.set(r, i + 1));
  if (ordered.length > 254) { console.error('FEHLER: zu viele Regionen für Uint8.'); process.exit(1); }
}
const regionGrid = new Uint8Array(SIZE);
for (let o = 0; o < SIZE; o++) regionGrid[o] = regionOf[o] >= 0 ? finalIds.get(regionOf[o]) : 0;

// 7f. Regions-Statistik + Adjazenzgraph.
const regionStats = new Map(); // id → stats
for (let ty = 0; ty < WORLD_TILES; ty++) {
  for (let tx = 0; tx < WORLD_TILES; tx++) {
    const o = ty * WORLD_TILES + tx;
    const id = regionGrid[o];
    if (id === 0) continue;
    let s = regionStats.get(id);
    if (!s) {
      s = { id, tiles: 0, buildable: 0, terrain: Object.fromEntries(T_NAMES.map((n) => [n, 0])), cx: 0, cy: 0, adjacent: new Set() };
      regionStats.set(id, s);
    }
    s.tiles++;
    s.cx += tx; s.cy += ty;
    const t = terrain[o];
    s.terrain[T_NAMES[t]]++;
    if (BUILDABLE.has(t)) s.buildable++;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const nid = regionGrid[ny * WORLD_TILES + nx];
      if (nid !== 0 && nid !== id) s.adjacent.add(nid);
    }
  }
}
// Adjazenz symmetrisch machen (oben nur Vorwärts-Kanten gesammelt).
for (const s of regionStats.values()) for (const a of s.adjacent) regionStats.get(a).adjacent.add(s.id);
const regions = [...regionStats.values()].sort((a, b) => a.id - b.id).map((s) => ({
  id: s.id,
  tiles: s.tiles,
  buildable: s.buildable,
  terrain: s.terrain,
  dominant: T_NAMES.reduce((best, n) => (s.terrain[n] > s.terrain[best] ? n : best), 'water'),
  centroid: { x: Math.round(s.cx / s.tiles), y: Math.round(s.cy / s.tiles) },
  adjacent: [...s.adjacent].sort((a, b) => a - b),
}));
console.log(`  ${regions.length} Regionen (${regions.map((r) => r.tiles).reduce((a, b) => a + b, 0).toLocaleString('de-DE')} Landkacheln)`);

// ---------------------------------------------------------------------------
// 8. Startregion wählen + Rathaus-Spot (5×5) suchen + validieren
// ---------------------------------------------------------------------------
// Zentrums-Bonus: zentrale, bebaubare Grasland-Region bevorzugt (Start in der Inselmitte).
const startRegion = regions
  .map((r) => {
    const centrality = 1 - Math.hypot(r.centroid.x - WORLD_TILES / 2, r.centroid.y - WORLD_TILES / 2) / (WORLD_TILES / 2);
    return { r, score: r.buildable + r.terrain.grass * 0.5 + centrality * 1500 };
  })
  .sort((a, b) => b.score - a.score)[0].r;
if (startRegion.buildable < MIN_START_BUILDABLE) {
  console.error(`FEHLER: beste Startregion ${startRegion.id} hat nur ${startRegion.buildable} bebaubare Kacheln (< ${MIN_START_BUILDABLE}).`);
  process.exit(1);
}

// Rathaus: flachster Gras-Block für das 5×5-Rathaus (§ Gebäudesystem 2.0) nahe
// der Regionsmitte. Validiert wird 7×7 Gras (5×5 + 1 Rand) PLUS die
// Startstraßen-Zeile (y+5). Anker (x,y) = linke obere Rathaus-Kachel.
let townHall = null;
{
  const cx0 = startRegion.centroid.x;
  const cy0 = startRegion.centroid.y;
  let best = null;
  for (let r = 0; r < WORLD_TILES / 2 && !((best && best.flat < 0.25) && r > 8); r++) {
    for (let ty = cy0 - r; ty <= cy0 + r; ty++) {
      for (let tx = cx0 - r; tx <= cx0 + r; tx++) {
        if (Math.max(Math.abs(tx - cx0), Math.abs(ty - cy0)) !== r) continue;
        if (tx < 1 || ty < 1 || tx + 5 >= WORLD_TILES || ty + 5 >= WORLD_TILES) continue;
        let ok = true, hMin = Infinity, hMax = -Infinity;
        for (let dy = -1; dy <= 5 && ok; dy++) {
          for (let dx = -1; dx <= 5; dx++) {
            const o = (ty + dy) * WORLD_TILES + tx + dx;
            if (terrain[o] !== T.grass || regionGrid[o] !== startRegion.id) { ok = false; break; }
            const h = tileH(tx + dx, ty + dy);
            hMin = Math.min(hMin, h); hMax = Math.max(hMax, h);
          }
        }
        if (!ok) continue;
        const flat = hMax - hMin;
        if (!best || flat < best.flat) best = { x: tx, y: ty, flat };
      }
    }
  }
  if (!best) { console.error('FEHLER: kein 7×7-Gras-Spot für das 5×5-Rathaus in der Startregion gefunden.'); process.exit(1); }
  townHall = best;
}
// Startstraßen: 5 Kacheln entlang der Rathaus-Südkante (x..x+4, y+5).
const startRoads = [0, 1, 2, 3, 4].map((i) => ({ x: townHall.x + i, y: townHall.y + 5 }));
for (const r of startRoads) {
  if (terrain[r.y * WORLD_TILES + r.x] !== T.grass) { console.error('FEHLER: Startstraßen-Kachel nicht Gras.'); process.exit(1); }
}

// ---------------------------------------------------------------------------
// 9. Ausgaben schreiben
// ---------------------------------------------------------------------------
// Flaches Array + join('') statt tiefer `+`-Ketten: tausende Konkatenationen
// erzeugen einen so tiefen AST, dass Parser (ESLint) per Stack-Overflow scheitern.
function toBase64Lines(bytes) {
  const b64 = Buffer.from(bytes).toString('base64');
  const lines = [];
  for (let i = 0; i < b64.length; i += 120) lines.push(`'${b64.slice(i, i + 120)}',`);
  return `[\n  ${lines.join('\n  ')}\n].join('')`;
}

// 8a. Terrain-Grid (Sim).
const terrainTs = `// AUTO-GENERIERT von tools/bakeWorld.mjs — NICHT von Hand editieren.
// Quelle: reference/stylized island map 3d model.glb (§ MVP4 Welt-Neuaufbau).
// Regeln/Schwellen: tools/bakeWorld.mjs + docs/WORLD_REBUILD.md; Statistik:
// tools/bake-report.md. Neu erzeugen: \`node tools/bakeWorld.mjs\`.
/* eslint-disable */

/** Weltbreite/-tiefe in Kacheln. */
export const WORLD_TILES = ${WORLD_TILES};

/** Terrain-Typ je ID im Grid (Index = gespeicherter Byte-Wert). */
export const TERRAIN_IDS = ${JSON.stringify(T_NAMES)} as const;

/** Vom Bake gewählter Start: Region, Rathaus (5×5, Anker links-oben), Startstraßen. */
export const BAKED_START = {
  regionId: ${startRegion.id},
  townHall: { x: ${townHall.x}, y: ${townHall.y} },
  startRoads: ${JSON.stringify(startRoads)},
} as const;

const DATA =
  ${toBase64Lines(terrain)};

function decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Row-major ${WORLD_TILES}×${WORLD_TILES} Terrain-IDs (siehe TERRAIN_IDS). */
export const terrainGrid: Uint8Array = decode(DATA);
`;
writeFileSync(join(ROOT, 'src', 'game', 'config', 'world', 'islandTerrain.gen.ts'), terrainTs);
console.log('— geschrieben: src/game/config/world/islandTerrain.gen.ts');

// 8a2. Region-Grid + Statistik (Sim; § Welt 2.0 organische Regionen).
const regionsTs = `// AUTO-GENERIERT von tools/bakeWorld.mjs — NICHT von Hand editieren.
// Organische Regionen (§ Welt 2.0): Segmentierung der Insel entlang natürlicher
// Grenzen (Biome, Flüsse, Kämme). Region-Id 0 = Ozean (nie freischaltbar);
// 1..REGION_COUNT = Landschaften. regions.config.ts gibt ihnen Namen/Gameplay.
// Neu erzeugen: \`node tools/bakeWorld.mjs\`.
/* eslint-disable */

export const REGION_COUNT = ${regions.length};

/** Vom Bake ermittelte Statistik je Region (Index = Id − 1). */
export const BAKED_REGIONS = ${JSON.stringify(
  regions.map((r) => ({ id: r.id, tiles: r.tiles, buildable: r.buildable, dominant: r.dominant, centroid: r.centroid, adjacent: r.adjacent, terrain: r.terrain })),
  null,
  2,
)} as const;

const DATA =
  ${toBase64Lines(regionGrid)};

function decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Row-major ${WORLD_TILES}×${WORLD_TILES} Region-Ids (0 = Ozean). */
export const regionGrid: Uint8Array = decode(DATA);
`;
writeFileSync(join(ROOT, 'src', 'game', 'config', 'world', 'islandRegions.gen.ts'), regionsTs);
console.log('— geschrieben: src/game/config/world/islandRegions.gen.ts');

// 8b. Höhen-Grid (Renderer), Uint16-quantisiert.
let hMin = Infinity, hMax = -Infinity;
for (const v of HW) { if (v < hMin) hMin = v; if (v > hMax) hMax = v; }
const hRange = hMax - hMin;
const HQ = new Uint16Array(GRID * GRID);
for (let i = 0; i < HW.length; i++) HQ[i] = Math.round(((HW[i] - hMin) / hRange) * 65535);
const heightTs = `// AUTO-GENERIERT von tools/bakeWorld.mjs — NICHT von Hand editieren.
// Quelle: reference/stylized island map 3d model.glb (§ MVP4 Welt-Neuaufbau).
// ${GRID}×${GRID} Höhen-Samples (${SAMPLES_PER_TILE}/Kachel + 1), Uint16-quantisiert.
// Neu erzeugen: \`node tools/bakeWorld.mjs\`.
/* eslint-disable */

export const HEIGHT_GRID = ${GRID};
export const HEIGHT_SAMPLES_PER_TILE = ${SAMPLES_PER_TILE};
export const HEIGHT_MIN = ${hMin.toFixed(5)};
export const HEIGHT_RANGE = ${hRange.toFixed(5)};

const DATA =
  ${toBase64Lines(new Uint8Array(HQ.buffer))};

function decode(b64: string): Uint16Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Uint16Array(bytes.buffer);
}

/** Row-major Höhen-Samples; Welt-Höhe = HEIGHT_MIN + (v/65535) · HEIGHT_RANGE. */
export const heightGrid: Uint16Array = decode(DATA);
`;
writeFileSync(join(ROOT, 'src', 'renderer', 'three', 'worldHeight.gen.ts'), heightTs);
console.log('— geschrieben: src/renderer/three/worldHeight.gen.ts');

// 8c. Vorschau-PNG (Hypsometrie + Biomfarben).
{
  const S = WORLD_TILES;
  const px = Buffer.alloc(S * S * 3);
  const COLORS = {
    [T.water]: [26, 62, 110], [T.river]: [58, 118, 170], [T.sand]: [214, 202, 150],
    [T.fertile]: [116, 154, 62], [T.grass]: [96, 152, 76], [T.forest]: [44, 98, 52], [T.mountain]: [138, 132, 126],
  };
  for (let ty = 0; ty < S; ty++) {
    for (let tx = 0; tx < S; tx++) {
      const t = terrain[ty * S + tx];
      let [r, g, b] = COLORS[t];
      const h = tileH(tx, ty);
      if (t === T.mountain && h > MOUNTAIN_HEIGHT + 7) { r = 235; g = 238; b = 244; } // Schneegipfel
      const shade = Math.max(-0.18, Math.min(0.18, (tileH(tx, ty) - tileH(Math.max(0, tx - 1), Math.max(0, ty - 1))) * 0.35));
      // Regionsgrenzen sichtbar machen (dunkle Linie), zur Kontrolle der Segmentierung.
      let borderMul = 1;
      const rid = regionGrid[ty * S + tx];
      if (rid !== 0) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const nx2 = tx + dx, ny2 = ty + dy;
          if (nx2 >= S || ny2 >= S) continue;
          const nrid = regionGrid[ny2 * S + nx2];
          if (nrid !== 0 && nrid !== rid) { borderMul = 0.45; break; }
        }
      }
      px[(ty * S + tx) * 3] = Math.max(0, Math.min(255, r * (1 + shade) * borderMul));
      px[(ty * S + tx) * 3 + 1] = Math.max(0, Math.min(255, g * (1 + shade) * borderMul));
      px[(ty * S + tx) * 3 + 2] = Math.max(0, Math.min(255, b * (1 + shade) * borderMul));
    }
  }
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return c ^ 0xffffffff; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const raw = Buffer.alloc((S * 3 + 1) * S);
  for (let y = 0; y < S; y++) { raw[y * (S * 3 + 1)] = 0; px.copy(raw, y * (S * 3 + 1) + 1, y * S * 3, (y + 1) * S * 3); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 2;
  writeFileSync(join(ROOT, 'tools', 'bake-preview.png'), Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]));
  console.log('— geschrieben: tools/bake-preview.png');
}

// 8d. Report.
{
  const counts = new Array(T_NAMES.length).fill(0);
  for (const t of terrain) counts[t]++;
  const total = terrain.length;
  const rows = regions
    .map((r) => `| ${r.id} | ${r.dominant} | ${r.tiles} | ${r.buildable} | (${r.centroid.x},${r.centroid.y}) | ${r.adjacent.join(', ')} |`)
    .join('\n');
  const report = `# Bake-Report — Insel-Welt (MVP4 + Welt 2.0 Regionen)

> **Auto-generiert** von \`tools/bakeWorld.mjs\`. Nicht von Hand editieren.

## Eckdaten

- Quelle: \`reference/stylized island map 3d model.glb\` (${triCount.toLocaleString('de-DE')} Dreiecke gerastert)
- Welt: ${WORLD_TILES}×${WORLD_TILES} Kacheln, ${regions.length} organische Regionen (+ Ozean)
- Ozeanrand: ${OCEAN_MARGIN_TILES} Kacheln; Höhenfaktor: Gipfel ≈ ${PEAK_WORLD_HEIGHT} Welt-Einheiten
- Wasserlinie (normalisiert): ${WATERLINE_N}; Höhenbereich Welt: [${hMin.toFixed(2)}, ${hMax.toFixed(2)}]
- Glättung bebaubaren Landes: ${SMOOTH_ITERATIONS} Iterationen, max. Schritt ${MAX_BUILDABLE_STEP}/Sample
- Regions-Parameter: Ziel ~${REGION_TARGET_TILES} Kacheln, min. ${REGION_MIN_TILES} (sonst Merge), Kosten fremdes Biom +${COST_FOREIGN_BIOME} / Fluss +${COST_CROSS_RIVER} / Höhe ×${COST_HEIGHT_FACTOR}

## Biomverteilung

${T_NAMES.map((n, i) => `- ${n}: ${counts[i].toLocaleString('de-DE')} (${(100 * counts[i] / total).toFixed(1)} %)`).join('\n')}

## Start (vom Bake gewählt & validiert)

- **Startregion: ${startRegion.id}** (${startRegion.dominant}) — ${startRegion.buildable.toLocaleString('de-DE')} bebaubare Kacheln (Ziel ≥ ${MIN_START_BUILDABLE})
- **Rathaus: (${townHall.x},${townHall.y})** (5×5, Anker links-oben; flachster 7×7-Gras-Block nahe Regionsmitte, ΔH=${townHall.flat.toFixed(2)})
- Startstraßen: ${startRoads.map((r) => `(${r.x},${r.y})`).join(', ')}

## Regionen (Grundlage für regions.config.ts)

| Id | Dominant | Kacheln | Bebaubar | Zentrum | Nachbarn |
| --- | --- | --- | --- | --- | --- |
${rows}
`;
  writeFileSync(join(ROOT, 'tools', 'bake-report.md'), report);
  console.log('— geschrieben: tools/bake-report.md');
}

console.log('\nFERTIG. %d Regionen, Startregion %d, Rathaus (%d,%d), %s bebaubar in der Startregion.',
  regions.length, startRegion.id, townHall.x, townHall.y, startRegion.buildable.toLocaleString('de-DE'));
