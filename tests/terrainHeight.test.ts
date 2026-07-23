import { describe, it, expect } from 'vitest';
import { terrainHeightAt, WATER_LEVEL } from '../src/renderer/three/terrainHeight.ts';
import { bakedSurfaceAt, terrainAt } from '../src/game/config/startRegion.config.ts';

// The height field is the single source of truth for placement, so guard its
// shape: mountains tower, water dips below the shoreline, buildable land stays
// gentle (so buildings sit cleanly), and the surface is continuous (no cliffs
// between adjacent sample points on flat land).

// Neue Insel-Welt: 512×512 Kacheln aus dem GLB-Bake — die Scans laufen über
// das ganze Brett (Schrittweite 1 wäre 147k Iterationen; früh gefundene Treffer
// halten die Laufzeit trotzdem klein).
import { WORLD_TILES } from '../src/game/config/startRegion.config.ts';

/** Find a world tile of a given terrain type by scanning the board. */
function findTile(type: string): { x: number; y: number } {
  for (let y = 0; y < WORLD_TILES; y++) {
    for (let x = 0; x < WORLD_TILES; x++) {
      if (terrainAt(x, y) === type) return { x, y };
    }
  }
  throw new Error(`no ${type} tile`);
}

/** Find a grass tile whose whole 5×5 neighbourhood is grass — a real interior
 *  building site. (Der Bake glättet nur bebaubares Land; direkt an einer
 *  Klippen-/Küstenkante darf der Übergang steil bleiben, deshalb 5×5 statt 3×3.) */
function findOpenGrass(): { x: number; y: number } {
  for (let y = 2; y < WORLD_TILES - 2; y++) {
    for (let x = 2; x < WORLD_TILES - 2; x++) {
      let open = true;
      for (let dx = -2; dx <= 2 && open; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          if (terrainAt(x + dx, y + dy) !== 'grass' || !bakedSurfaceAt(x + dx, y + dy).buildable) {
            open = false;
            break;
          }
        }
      }
      if (open) return { x, y };
    }
  }
  throw new Error('no open grass');
}

describe('terrain height field', () => {
  it('mountains rise far above buildable land', () => {
    // `mountain` umfasst auch niedrige Klippen (Slope-Klassifikation) — der
    // Anspruch ist, dass das GEBIRGE aufragt: höchster Gipfel deutlich über Gras.
    let peak = -Infinity;
    for (let y = 0; y < WORLD_TILES; y += 2) {
      for (let x = 0; x < WORLD_TILES; x += 2) {
        if (terrainAt(x, y) !== 'mountain') continue;
        peak = Math.max(peak, terrainHeightAt(x + 0.5, y + 0.5));
      }
    }
    const g = findOpenGrass();
    const hGrass = terrainHeightAt(g.x + 0.5, g.y + 0.5);
    expect(peak).toBeGreaterThan(10); // Gipfel ≈ 20 (docs/WORLD_SCALE.md)
    expect(peak).toBeGreaterThan(hGrass + 5);
  });

  it('water and river dip below the water surface level', () => {
    const w = findTile('water');
    expect(terrainHeightAt(w.x + 0.5, w.y + 0.5)).toBeLessThan(WATER_LEVEL);
  });

  it('keeps buildable land gentle (clean building sites)', () => {
    // A patch of grass should not vary wildly across a 3-tile span.
    const g = findOpenGrass();
    let min = Infinity;
    let max = -Infinity;
    for (let dx = 0; dx < 3; dx++) {
      for (let dy = 0; dy < 3; dy++) {
        // only measure where it stays grass so we don't cross into a mountain
        if (terrainAt(g.x + dx, g.y + dy) !== 'grass') continue;
        const h = terrainHeightAt(g.x + dx + 0.5, g.y + dy + 0.5);
        min = Math.min(min, h);
        max = Math.max(max, h);
      }
    }
    expect(max - min).toBeLessThan(0.5);
  });

  it('is continuous — small steps in position give small steps in height', () => {
    const g = findOpenGrass();
    const a = terrainHeightAt(g.x + 0.5, g.y + 0.5);
    const b = terrainHeightAt(g.x + 0.5 + 0.05, g.y + 0.5);
    expect(Math.abs(a - b)).toBeLessThan(0.1);
  });

  it('returns finite heights across the whole board', () => {
    for (let y = 0; y < WORLD_TILES; y += 13) {
      for (let x = 0; x < WORLD_TILES; x += 13) {
        expect(Number.isFinite(terrainHeightAt(x + 0.5, y + 0.5))).toBe(true);
      }
    }
  });
});
