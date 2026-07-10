import { SECTOR_SIZE, startRegionConfig, terrainAt } from '../config/startRegion.config.ts';
import type { GameConfig } from '../config/index.ts';
import type { GameState, SectorState, TileState } from '../types.ts';
import { sectorId } from '../types.ts';

export { SECTOR_SIZE };

export function worldToSector(x: number, y: number): { sx: number; sy: number } {
  return { sx: Math.floor(x / SECTOR_SIZE), sy: Math.floor(y / SECTOR_SIZE) };
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

/** Creates (locked) sector data from the world terrain function — open end. */
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
  state.world.sectors[id] = sector;
  return sector;
}

/** Ensure all 8 neighbors of an unlocked sector exist (visible locked ring). */
export function materializeNeighbors(state: GameState, sx: number, sy: number): void {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx !== 0 || dy !== 0) materializeSector(state, sx + dx, sy + dy);
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
  const count = state.stats.sectorsUnlocked;
  return Math.round(base * Math.pow(distanceFactor, Math.max(0, dist - 1)) * (1 + countFactor * (count - 1)));
}

const UNBUILDABLE: ReadonlySet<string> = new Set(['river', 'water', 'mountain']);

export function isTerrainBuildable(t: TileState): boolean {
  return !UNBUILDABLE.has(t.terrain);
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
