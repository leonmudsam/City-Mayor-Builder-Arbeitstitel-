import type { BuildingDef } from '../config/types.ts';
import type { GameState, TerrainType } from '../types.ts';
import { tileAt } from '../map/world.ts';
import { terrainAt } from '../config/startRegion.config.ts';

/**
 * Terrain lookup that works for any world tile: materialized sectors read
 * their (possibly hand-edited) tile state, everything else falls back to the
 * deterministic terrain function — so previews outside unlocked land agree
 * with what will materialize later.
 */
export function terrainOf(state: GameState, x: number, y: number): TerrainType {
  return tileAt(state, x, y)?.terrain ?? terrainAt(x, y);
}

/**
 * Location bonus in percent for placing `def` at (x, y): counts matching
 * terrain tiles in a ring around the footprint. Built-over tiles no longer
 * count — clearing the forest around a sawmill costs its bonus.
 */
export function locationBonusPct(state: GameState, def: BuildingDef, x: number, y: number): number {
  const bonus = def.locationBonus;
  if (!bonus) return 0;
  let matching = 0;
  for (let ty = y - bonus.radius; ty < y + def.size.h + bonus.radius; ty++) {
    for (let tx = x - bonus.radius; tx < x + def.size.w + bonus.radius; tx++) {
      if (tx >= x && tx < x + def.size.w && ty >= y && ty < y + def.size.h) continue;
      const tile = tileAt(state, tx, ty);
      if (tile?.buildingId) continue;
      if ((tile?.terrain ?? terrainAt(tx, ty)) === bonus.terrain) matching += 1;
    }
  }
  return Math.min(bonus.maxPct, matching * bonus.perTilePct);
}
