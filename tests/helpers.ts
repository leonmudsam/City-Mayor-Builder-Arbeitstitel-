import { loadConfig, type GameConfig } from '../src/game/config/index.ts';
import { createNewGame } from '../src/game/newGame.ts';
import { GameController } from '../src/game/commands/controller.ts';
import { recomputeDerived } from '../src/game/simulation/derived.ts';
import type { TerrainType } from '../src/game/types.ts';

export const T0 = 1_700_000_000_000;

export function newController(now = T0): { controller: GameController; config: GameConfig } {
  const config = loadConfig();
  const state = createNewGame(config, 'Teststadt', now);
  return { controller: new GameController(config, state), config };
}

/** Cheat helper for tests: jump to a level without playing through it. */
export function setLevel(controller: GameController, level: number): void {
  const def = controller.config.levels.find((l) => l.level === level);
  controller.state.level.current = level;
  controller.state.level.xp = def?.xpRequired ?? 0;
}

/** Flatten all materialized terrain to grass so location bonuses are 0
 *  unless a test paints terrain explicitly. */
export function flattenTerrain(controller: GameController): void {
  for (const sector of Object.values(controller.state.world.sectors)) {
    for (const tile of sector.tiles) tile.terrain = 'grass';
  }
  refreshDerived(controller);
}

export function paintTerrain(controller: GameController, tiles: [number, number][], terrain: TerrainType): void {
  for (const [x, y] of tiles) {
    const sx = Math.floor(x / 16);
    const sy = Math.floor(y / 16);
    const sector = controller.state.world.sectors[`${sx}:${sy}`];
    const tile = sector?.tiles[(y - sy * 16) * 16 + (x - sx * 16)];
    if (tile) tile.terrain = terrain;
  }
  refreshDerived(controller);
}

/** Recompute derived values after direct state edits in tests. */
export function refreshDerived(controller: GameController): void {
  controller.derived = recomputeDerived(controller.state, controller.config);
}
