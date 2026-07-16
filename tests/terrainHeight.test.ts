import { describe, it, expect } from 'vitest';
import { terrainHeightAt, WATER_LEVEL } from '../src/renderer/three/terrainHeight.ts';
import { terrainAt } from '../src/game/config/startRegion.config.ts';

// The height field is the single source of truth for placement, so guard its
// shape: mountains tower, water dips below the shoreline, buildable land stays
// gentle (so buildings sit cleanly), and the surface is continuous (no cliffs
// between adjacent sample points on flat land).

/** Find a world tile of a given terrain type by scanning the board. */
function findTile(type: string): { x: number; y: number } {
  for (let y = 0; y < 80; y++) {
    for (let x = -32; x < 96; x++) {
      if (terrainAt(x, y) === type) return { x, y };
    }
  }
  throw new Error(`no ${type} tile`);
}

/** Find a grass tile whose whole 3×3 neighbourhood is grass (an open building
 *  site, not a lone patch wedged against a mountain). */
function findOpenGrass(): { x: number; y: number } {
  for (let y = 1; y < 79; y++) {
    for (let x = -31; x < 95; x++) {
      let open = true;
      for (let dx = -1; dx <= 1 && open; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (terrainAt(x + dx, y + dy) !== 'grass') {
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
    const m = findTile('mountain');
    const g = findOpenGrass();
    const hMountain = terrainHeightAt(m.x + 0.5, m.y + 0.5);
    const hGrass = terrainHeightAt(g.x + 0.5, g.y + 0.5);
    expect(hMountain).toBeGreaterThan(2);
    expect(hMountain).toBeGreaterThan(hGrass + 1.5);
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
    for (let y = 0; y < 80; y += 7) {
      for (let x = -32; x < 96; x += 7) {
        expect(Number.isFinite(terrainHeightAt(x + 0.5, y + 0.5))).toBe(true);
      }
    }
  });
});
