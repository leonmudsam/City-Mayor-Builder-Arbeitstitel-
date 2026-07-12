import type { TerrainType } from '../types.ts';

export const SECTOR_SIZE = 16;

// The start region is a hand-designed 4×4 sector area (64×64 tiles):
// forest to the north, a river along the east (visible but locked in MVP 1),
// fertile plains in the south-center. Sector (1,1) is the free start sector,
// with the town hall pre-placed at its center.
export const startRegionConfig = {
  /** Sector-grid extents of the initially materialized region. */
  sectors: { minSx: 0, minSy: 0, maxSx: 3, maxSy: 3 },
  /**
   * Hard edges of the world (§ bounded world). Unlike the open-end model, the
   * map is a large but *finite* board: every sector inside these bounds exists
   * and is visible from the first minute (locked/dimmed until unlocked), so all
   * biomes — forest, mountains, river, coast, plains — are on show as goals from
   * the start, and nothing can be unlocked beyond the edge. The bounds are wider
   * than the hand-designed start region: the extra eastern columns hold the coast
   * and the southern row more plains, giving room for every biome to read.
   */
  worldBounds: { minSx: 0, minSy: 0, maxSx: 5, maxSy: 4 },
  startSector: { sx: 1, sy: 1 },
  townHall: { x: 23, y: 23 }, // world tile coords (3×3 footprint)
  /** Pre-placed road tiles below the town hall so the tutorial has an anchor. */
  startRoads: [
    { x: 23, y: 26 },
    { x: 24, y: 26 },
    { x: 25, y: 26 },
  ],
};

/** Small deterministic hash so terrain variation is stable per tile. */
function tileHash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}

/** The lake ("Weiher") in the western neighbor sector — not just decoration:
 * shore tiles stay buildable and are reserved for water-side gameplay
 * (fishing hut, kayak rental …) in later MVPs. */
export const lakeConfig = { cx: 10, cy: 42, rx: 4.2, ry: 3.2 };

/**
 * Terrain for any world tile — also used for sectors materialized later,
 * so expansion beyond the start region keeps a coherent landscape (open end).
 */
export function terrainAt(x: number, y: number): TerrainType {
  // Eastern sea: the far-east coast biome (§ bounded world, all biomes on show).
  // A sandy beach gives way to open water at the world's east edge — the seaside
  // district goal (harbour/beach in a later MVP).
  if (x >= 85) return 'water';
  if (x >= 81) return 'sand';

  // River: vertical band around x = 57 with a gentle meander.
  const riverCenter = 57 + Math.round(Math.sin(y / 9) * 2);
  if (x >= riverCenter - 1 && x <= riverCenter + 1) return 'river';
  if (x === riverCenter - 2 || x === riverCenter + 2) return 'sand';

  // Lake in sector (0,2) with a sandy shore ring.
  const lakeDist = Math.hypot((x - lakeConfig.cx) / lakeConfig.rx, (y - lakeConfig.cy) / lakeConfig.ry);
  if (lakeDist <= 1) return 'water';
  if (lakeDist <= 1.35) return 'sand';

  // Mountains on the western edge (quarry location bonus target), widened into a
  // visible alpine wall along the far-west column so the mountain biome reads as
  // a real region from the start (§ all biomes visible).
  const ridgeDist = Math.hypot((x - 3) / 3.2, (y - 28) / 6.5);
  if (ridgeDist <= 1 && tileHash(x * 3, y * 5) > 0.15) return 'mountain';
  if (x <= 2 && tileHash(x * 5, y * 7) > 0.35) return 'mountain';

  // Forest: northern band, thinning toward the south.
  if (y < 12 && tileHash(x, y) > 0.15) return 'forest';
  if (y < 16 && tileHash(x, y) > 0.6) return 'forest';

  // Fertile plains: south-center band.
  if (y >= 40 && y < 60 && x >= 12 && x < 48 && tileHash(x, y) > 0.35) return 'fertile';

  // Scattered forest patches everywhere else.
  if (tileHash(x * 7, y * 3) > 0.93) return 'forest';

  return 'grass';
}
