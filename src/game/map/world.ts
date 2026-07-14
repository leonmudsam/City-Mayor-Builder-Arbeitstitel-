import { SECTOR_SIZE, startRegionConfig, terrainAt } from '../config/startRegion.config.ts';
import type { GameConfig } from '../config/index.ts';
import type { GameState, SectorState, TileState } from '../types.ts';
import { sectorId } from '../types.ts';

export { SECTOR_SIZE };

export function worldToSector(x: number, y: number): { sx: number; sy: number } {
  return { sx: Math.floor(x / SECTOR_SIZE), sy: Math.floor(y / SECTOR_SIZE) };
}

/**
 * Whether a sector lies inside the finite world (§ bounded world). The map is a
 * large but hard-edged board: sectors outside these bounds are never
 * materialized, never rendered and can never be unlocked — there is no open end.
 */
export function isSectorInBounds(sx: number, sy: number): boolean {
  const { minSx, minSy, maxSx, maxSy } = startRegionConfig.worldBounds;
  return sx >= minSx && sx <= maxSx && sy >= minSy && sy <= maxSy;
}

/** All in-bounds sector coordinates (§ bounded world, used to fill the board). */
export function allWorldSectors(): { sx: number; sy: number }[] {
  const { minSx, minSy, maxSx, maxSy } = startRegionConfig.worldBounds;
  const out: { sx: number; sy: number }[] = [];
  for (let sy = minSy; sy <= maxSy; sy++) {
    for (let sx = minSx; sx <= maxSx; sx++) out.push({ sx, sy });
  }
  return out;
}

export function tileAt(state: GameState, x: number, y: number): TileState | undefined {
  const { sx, sy } = worldToSector(x, y);
  const sector = state.world.sectors[sectorId(sx, sy)];
  if (!sector) return undefined;
  const lx = x - sx * SECTOR_SIZE;
  const ly = y - sy * SECTOR_SIZE;
  return sector.tiles[ly * SECTOR_SIZE + lx];
}

export function sectorOfTile(state: GameState, x: number, y: number): SectorState | undefined {
  const { sx, sy } = worldToSector(x, y);
  return state.world.sectors[sectorId(sx, sy)];
}

/**
 * Creates (locked) sector data from the world terrain function. Sectors outside
 * the world bounds are never created — the board is finite (§ bounded world).
 * Callers that might reach the edge must guard with `isSectorInBounds`; this
 * still returns a (transient) sector for an out-of-bounds request so internal
 * lookups stay total, but it is not stored.
 */
export function materializeSector(state: GameState, sx: number, sy: number): SectorState {
  const id = sectorId(sx, sy);
  const existing = state.world.sectors[id];
  if (existing) return existing;
  const tiles: TileState[] = [];
  for (let ly = 0; ly < SECTOR_SIZE; ly++) {
    for (let lx = 0; lx < SECTOR_SIZE; lx++) {
      tiles.push({ terrain: terrainAt(sx * SECTOR_SIZE + lx, sy * SECTOR_SIZE + ly) });
    }
  }
  const sector: SectorState = { id, sx, sy, districtId: 'main', status: 'locked', tiles };
  // Only in-bounds sectors are persisted; the edge is hard (§ bounded world).
  if (isSectorInBounds(sx, sy)) state.world.sectors[id] = sector;
  return sector;
}

/** Ensure the 8 in-bounds neighbors of a sector exist (visible locked ring). */
export function materializeNeighbors(state: GameState, sx: number, sy: number): void {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if ((dx !== 0 || dy !== 0) && isSectorInBounds(sx + dx, sy + dy)) materializeSector(state, sx + dx, sy + dy);
    }
  }
}

export function isSectorAdjacentToUnlocked(state: GameState, sx: number, sy: number): boolean {
  const deltas = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;
  return deltas.some(([dx, dy]) => state.world.sectors[sectorId(sx + dx, sy + dy)]?.status === 'unlocked');
}

/** Price formula from balancing.config: grows with distance and count. */
export function sectorUnlockCost(state: GameState, config: GameConfig, sx: number, sy: number): number {
  const { base, distanceFactor, countFactor } = config.balancing.sectorCost;
  const start = startRegionConfig.startSector;
  const dist = Math.max(Math.abs(sx - start.sx), Math.abs(sy - start.sy));
  // sectorsUnlocked counts only ADDITIONAL sectors (§5), so the first purchase
  // pays the plain base price and each one after raises it by countFactor.
  const additional = state.stats.sectorsUnlocked;
  return Math.round(base * Math.pow(distanceFactor, Math.max(0, dist - 1)) * (1 + countFactor * additional));
}

const UNBUILDABLE: ReadonlySet<string> = new Set(['river', 'water', 'mountain']);

export function isTerrainBuildable(t: TileState): boolean {
  return !UNBUILDABLE.has(t.terrain);
}

/** True if any tile in the sector has the given terrain (biome detection). */
export function sectorHasTerrain(sector: SectorState, terrain: TileState['terrain']): boolean {
  return sector.tiles.some((t) => t.terrain === terrain);
}

/**
 * Find a buildable `size × size` block inside a sector for a district centre,
 * preferring a spot on the riverfront (a river tile within Chebyshev 3). Returns
 * the world-tile top-left corner, or undefined if the sector has no room. Used
 * by the found-district project so the centre lands sensibly by the water (§8).
 */
export function findDistrictCenterSpot(
  sector: SectorState,
  size: number,
): { x: number; y: number } | undefined {
  const ox = sector.sx * SECTOR_SIZE;
  const oy = sector.sy * SECTOR_SIZE;
  const at = (lx: number, ly: number): TileState => sector.tiles[ly * SECTOR_SIZE + lx]!;
  const blockOk = (lx: number, ly: number): boolean => {
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const t = at(lx + dx, ly + dy);
        if (!isTerrainBuildable(t) || t.buildingId !== undefined) return false;
      }
    }
    return true;
  };
  const nearRiver = (lx: number, ly: number): boolean => {
    const cx = lx + (size - 1) / 2;
    const cy = ly + (size - 1) / 2;
    for (let y = 0; y < SECTOR_SIZE; y++) {
      for (let x = 0; x < SECTOR_SIZE; x++) {
        if (at(x, y).terrain !== 'river') continue;
        if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) <= size + 1) return true;
      }
    }
    return false;
  };
  let fallback: { x: number; y: number } | undefined;
  for (let ly = 0; ly <= SECTOR_SIZE - size; ly++) {
    for (let lx = 0; lx <= SECTOR_SIZE - size; lx++) {
      if (!blockOk(lx, ly)) continue;
      const spot = { x: ox + lx, y: oy + ly };
      if (nearRiver(lx, ly)) return spot;
      fallback ??= spot;
    }
  }
  return fallback;
}

/**
 * Road connectivity: flood fill over road tiles, seeded by roads orthogonally
 * adjacent to the town hall (or a district center). Returns the set of
 * connected road tile keys "x,y".
 */
export function computeRoadNetwork(state: GameState, config: GameConfig): Set<string> {
  const roads = new Set<string>();
  const seeds: string[] = [];
  const centerFootprints: { x: number; y: number; w: number; h: number }[] = [];

  for (const district of Object.values(state.world.districts)) {
    const center = state.buildings[district.centerBuildingId];
    if (!center) continue;
    const def = config.buildings.get(center.defId);
    if (def) centerFootprints.push({ x: center.x, y: center.y, w: def.size.w, h: def.size.h });
  }

  for (const b of Object.values(state.buildings)) {
    if (config.buildings.get(b.defId)?.category !== 'roads') continue;
    const key = `${b.x},${b.y}`;
    roads.add(key);
    const nextToCenter = centerFootprints.some(
      (f) => b.x >= f.x - 1 && b.x <= f.x + f.w && b.y >= f.y - 1 && b.y <= f.y + f.h &&
        // orthogonal adjacency only: inside the expanded box but not a diagonal corner
        !((b.x === f.x - 1 || b.x === f.x + f.w) && (b.y === f.y - 1 || b.y === f.y + f.h)),
    );
    if (nextToCenter) seeds.push(key);
  }

  const connected = new Set<string>(seeds);
  const queue = [...seeds];
  while (queue.length > 0) {
    const key = queue.pop() as string;
    const [x, y] = key.split(',').map(Number) as [number, number];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nKey = `${x + dx},${y + dy}`;
      if (roads.has(nKey) && !connected.has(nKey)) {
        connected.add(nKey);
        queue.push(nKey);
      }
    }
  }
  return connected;
}
