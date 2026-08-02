// § Stadtarbeit-Overhaul, Phase P3 — die Weltebenen der 2D-Logistikkarte.
//
// Hier wird aus den Zahlen der Weltprojektion (`renderer/worldProjection.ts`)
// ein Bild. Bewusst getrennt von der React-Komponente, weil beides sonst
// unlesbar würde — und weil die teuren Ebenen zwischengespeichert werden
// müssen, aber NICHT an Werten hängen dürfen, die sich bei jedem Bauklick
// ändern (die Lehre aus D-045).
//
// Zwei Aufbauten, zwei Schlüssel:
//   Weltbild  → Terrainfarbe je Kachel, Schlüssel = Freischaltzustand
//   Vegetation→ Naturprops je Kachel,   Schlüssel = Freischaltzustand
// Beides ändert sich nur beim Freischalten einer Region, nicht beim Bauen.
// Gebäude, Straßen, Route und Fahrzeug werden dagegen JEDES Bild neu gezeichnet.

import {
  LOCKED_VEGETATION_DENSITY,
  MAP_NATURE_MIN_SCALE,
  WORLD_TILES,
  collectMapNature,
  worldTileColor,
  type MapNatureInstance,
} from '../../renderer/worldProjection.ts';
import type { TerrainType } from '../../game/types.ts';

/** Kantenlänge einer Chunk-Zelle in Kacheln (Sichtbarkeitsprüfung der Vegetation). */
export const NATURE_CHUNK_TILES = 24;

export interface WorldImage {
  canvas: HTMLCanvasElement;
}

/**
 * Das Weltbild: EIN Pixel je Weltkachel, Farbe aus `worldTileColor`.
 *
 * Warum ein Bild und keine Kachelschleife: Bei kleinem Zoom sind rund 4.000
 * Kacheln sichtbar. Die pro Bild einzeln zu füllen (und dafür pro Kachel Höhe,
 * Hangneigung und Masken abzufragen) kostet mehr als die gesamte übrige Karte.
 * Einmal backen und skaliert blitten ist ein Zeichenaufruf — und sieht durch
 * die Glättung obendrein weicher aus als harte Kachelkanten (§12 des Auftrags).
 */
export function buildWorldImage(isLocked: (regionId: number) => boolean, regionIdAt: (x: number, y: number) => number): WorldImage {
  const canvas = document.createElement('canvas');
  canvas.width = WORLD_TILES;
  canvas.height = WORLD_TILES;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas };
  const image = ctx.createImageData(WORLD_TILES, WORLD_TILES);
  const data = image.data;
  for (let y = 0; y < WORLD_TILES; y++) {
    for (let x = 0; x < WORLD_TILES; x++) {
      const color = worldTileColor(x, y, isLocked(regionIdAt(x, y)));
      const offset = (y * WORLD_TILES + x) * 4;
      data[offset] = color.r;
      data[offset + 1] = color.g;
      data[offset + 2] = color.b;
      data[offset + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return { canvas };
}

export type NatureChunks = Map<string, MapNatureInstance[]>;

/**
 * Vegetation der ganzen Insel, in Chunks sortiert.
 *
 * Die Instanzen kommen aus `collectMapNature` → `collectRegionNature`: dieselbe
 * und einzige Verteilungsinstanz, aus der auch die 3D-Welt wächst. Die Karte
 * erfindet keinen Baum. Gesperrte Regionen werden wie in der Welt ausgedünnt
 * gezeigt statt verdeckt (D-045).
 */
export function buildNatureChunks(
  regionIds: readonly number[],
  isLocked: (regionId: number) => boolean,
  terrainAt: (x: number, y: number) => TerrainType,
): NatureChunks {
  const chunks: NatureChunks = new Map();
  const instances = collectMapNature(regionIds, {
    terrainAt,
    densityScale: (regionId) => (isLocked(regionId) ? LOCKED_VEGETATION_DENSITY : 1),
  });
  for (const instance of instances) {
    const key = `${Math.floor(instance.x / NATURE_CHUNK_TILES)},${Math.floor(instance.y / NATURE_CHUNK_TILES)}`;
    const bucket = chunks.get(key);
    if (bucket) bucket.push(instance);
    else chunks.set(key, [instance]);
  }
  return chunks;
}

/** Farben der Naturgruppen in der Draufsicht — Kronen von oben, nicht Stämme. */
const NATURE_COLORS = {
  tree: { fill: '#2f5f3c', crown: '#3f7c4b' },
  rock: { fill: '#6f6a62', crown: '#8b857b' },
  coast: { fill: '#8f8560', crown: '#a89b70' },
  ground: { fill: '#5d7a45', crown: '#6d8c50' },
} as const;

/**
 * Zeichnet die sichtbare Vegetation. `scale` ist die Kantenlänge einer Kachel in
 * Pixeln — daraus folgt das LOD: aus großer Höhe verschwinden erst Bodenprops,
 * dann Küstensteine, dann Steine; Bäume bleiben am längsten, weil sie die
 * Landschaft lesbar machen.
 */
export function drawNature(
  ctx: CanvasRenderingContext2D,
  chunks: NatureChunks,
  occupied: ReadonlySet<string>,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  toScreen: (x: number, y: number) => { x: number; y: number },
  scale: number,
): number {
  let drawn = 0;
  const cMinX = Math.floor(bounds.minX / NATURE_CHUNK_TILES);
  const cMaxX = Math.floor(bounds.maxX / NATURE_CHUNK_TILES);
  const cMinY = Math.floor(bounds.minY / NATURE_CHUNK_TILES);
  const cMaxY = Math.floor(bounds.maxY / NATURE_CHUNK_TILES);
  for (let cy = cMinY; cy <= cMaxY; cy++) {
    for (let cx = cMinX; cx <= cMaxX; cx++) {
      const bucket = chunks.get(`${cx},${cy}`);
      if (!bucket) continue;
      for (const instance of bucket) {
        if (scale < MAP_NATURE_MIN_SCALE[instance.group]) continue;
        if (instance.x < bounds.minX || instance.x > bounds.maxX) continue;
        if (instance.y < bounds.minY || instance.y > bounds.maxY) continue;
        // Props unter Stadt und Straße werden verdeckt statt weggelassen — so
        // bleibt der Vegetationsaufbau unabhängig von der Belegung (D-045).
        if (occupied.has(`${instance.x},${instance.y}`)) continue;
        const palette = NATURE_COLORS[instance.group];
        // Deterministischer Versatz innerhalb der Kachel: ohne ihn stünde alles
        // im Raster. Die Verteilung selbst bleibt unangetastet.
        const jitterX = ((instance.x * 37 + instance.y * 17) % 10) / 10;
        const jitterY = ((instance.x * 23 + instance.y * 61) % 10) / 10;
        const point = toScreen(instance.x + 0.18 + jitterX * 0.64, instance.y + 0.18 + jitterY * 0.64);
        const radius = Math.max(0.9, scale * 0.2 * instance.scale);
        ctx.fillStyle = palette.fill;
        ctx.beginPath();
        ctx.arc(point.x, point.y + radius * 0.22, radius, 0, Math.PI * 2);
        ctx.fill();
        if (radius > 2.4) {
          ctx.fillStyle = palette.crown;
          ctx.beginPath();
          ctx.arc(point.x - radius * 0.2, point.y - radius * 0.2, radius * 0.66, 0, Math.PI * 2);
          ctx.fill();
        }
        drawn += 1;
      }
    }
  }
  return drawn;
}
