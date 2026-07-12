import type { GameConfig } from '../config/index.ts';
import type { BuildingDef } from '../config/types.ts';
import type { GameState } from '../types.ts';
import type { Derived } from '../simulation/derived.ts';
import { isTerrainBuildable, sectorOfTile, tileAt } from '../map/world.ts';
import { unlockedBuildings } from '../progression/levels.ts';
import { buildLimitAt, countOf } from './limits.ts';

export type PlacementError =
  | 'locked_building'
  | 'unique_exists'
  | 'limit_reached'
  | 'out_of_bounds'
  | 'sector_locked'
  | 'terrain'
  | 'occupied'
  | 'needs_road'
  | 'needs_water';

export interface PlacementOptions {
  /** Set when relocating an existing building: its own tiles don't block,
   *  and unlock/unique checks are skipped (it already exists). */
  ignoreBuildingId?: string;
}

export function validatePlacement(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  def: BuildingDef,
  x: number,
  y: number,
  options?: PlacementOptions,
): PlacementError | undefined {
  const moving = options?.ignoreBuildingId;
  if (!moving) {
    if (def.buildable === false) return 'locked_building';
    if (def.unlockLevel > state.level.current || (def.unlockLevel > 1 && !unlockedBuildings(config, state.level.current).has(def.id))) {
      return 'locked_building';
    }
    if (def.unique && Object.values(state.buildings).some((b) => b.defId === def.id)) return 'unique_exists';
    const cap = buildLimitAt(def, state.level.current);
    if (cap !== undefined && countOf(state, def.id) >= cap) return 'limit_reached';
  }

  for (let dy = 0; dy < def.size.h; dy++) {
    for (let dx = 0; dx < def.size.w; dx++) {
      const tile = tileAt(state, x + dx, y + dy);
      if (!tile) return 'out_of_bounds';
      const sector = sectorOfTile(state, x + dx, y + dy);
      if (!sector || sector.status !== 'unlocked') return 'sector_locked';
      if (!isTerrainBuildable(tile)) return 'terrain';
      if (tile.buildingId && tile.buildingId !== moving) return 'occupied';
    }
  }

  if (def.requiresRoad && !touchesConnectedRoad(derived, def, x, y)) return 'needs_road';
  if (def.category === 'roads' && !roadWouldConnect(state, config, derived, x, y)) return 'needs_road';
  if (def.adjacentTerrain && !touchesTerrain(state, def, x, y, def.adjacentTerrain)) return 'needs_water';
  return undefined;
}

/** A tile of `terrain` borders the footprint (riverfront/coast rule). */
function touchesTerrain(state: GameState, def: BuildingDef, x: number, y: number, terrain: string): boolean {
  for (let dy = -1; dy <= def.size.h; dy++) {
    for (let dx = -1; dx <= def.size.w; dx++) {
      if (dx >= 0 && dx < def.size.w && dy >= 0 && dy < def.size.h) continue; // skip footprint interior
      if (tileAt(state, x + dx, y + dy)?.terrain === terrain) return true;
    }
  }
  return false;
}

/** Any tile orthogonally adjacent to the footprint is a connected road. */
function touchesConnectedRoad(derived: Derived, def: BuildingDef, x: number, y: number): boolean {
  for (let dx = 0; dx < def.size.w; dx++) {
    if (derived.roadNetwork.has(`${x + dx},${y - 1}`) || derived.roadNetwork.has(`${x + dx},${y + def.size.h}`)) return true;
  }
  for (let dy = 0; dy < def.size.h; dy++) {
    if (derived.roadNetwork.has(`${x - 1},${y + dy}`) || derived.roadNetwork.has(`${x + def.size.w},${y + dy}`)) return true;
  }
  return false;
}

/** New road tiles must attach to the network or to a district center. */
function roadWouldConnect(state: GameState, config: GameConfig, derived: Derived, x: number, y: number): boolean {
  const deltas = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;
  if (deltas.some(([dx, dy]) => derived.roadNetwork.has(`${x + dx},${y + dy}`))) return true;
  // Adjacent to a district center footprint (seeds the network)?
  for (const district of Object.values(state.world.districts)) {
    const center = state.buildings[district.centerBuildingId];
    if (!center) continue;
    const def = config.buildings.get(center.defId);
    if (!def) continue;
    const inX = x >= center.x - 1 && x <= center.x + def.size.w;
    const inY = y >= center.y - 1 && y <= center.y + def.size.h;
    const corner = (x === center.x - 1 || x === center.x + def.size.w) && (y === center.y - 1 || y === center.y + def.size.h);
    if (inX && inY && !corner) return true;
  }
  return false;
}
