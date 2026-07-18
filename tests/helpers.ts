import { loadConfig, type GameConfig } from '../src/game/config/index.ts';
import { regionBounds, regionIdAt, startRegionConfig } from '../src/game/config/startRegion.config.ts';
import { createNewGame } from '../src/game/newGame.ts';
import { GameController } from '../src/game/commands/controller.ts';
import { recomputeDerived } from '../src/game/simulation/derived.ts';
import { overrideTerrain } from '../src/game/map/world.ts';
import type { TerrainType } from '../src/game/types.ts';

export const T0 = 1_700_000_000_000;

/** Rathaus-Position der Insel (vom Bake gewählt) — Tests platzieren relativ dazu. */
export const TOWN_HALL = startRegionConfig.townHall;
/** Startregion-Id (vom Bake gewählt, § Welt 2.0 organische Regionen). */
export const START_REGION = startRegionConfig.startRegionId;

/** Welt-Kachel relativ zum Rathaus (ersetzt die alten absoluten Test-Koordinaten). */
export function nearTownHall(dx: number, dy: number): { x: number; y: number } {
  return { x: TOWN_HALL.x + dx, y: TOWN_HALL.y + dy };
}

/**
 * Test-Controller auf der Insel-Welt. `flatten` (Default AN) glättet die
 * Startregion per Overrides auf Gras — die Alt-Suiten wurden gegen einen
 * grasigen Start geschrieben; der Insel-Start hat Wald-/Wasser-Flecken, die
 * sonst Platzierungen und Location-Boni nichtdeterministisch beeinflussen.
 * Tests, die ECHTES Insel-Terrain brauchen (Save-Größe, Biome), opten aus.
 */
export function newController(
  now = T0,
  opts: { flatten?: boolean } = {},
): { controller: GameController; config: GameConfig } {
  const config = loadConfig();
  const state = createNewGame(config, 'Teststadt', now);
  const controller = new GameController(config, state);
  if (opts.flatten !== false) flattenTerrain(controller);
  return { controller, config };
}

/** Cheat helper for tests: jump to a level without playing through it. */
export function setLevel(controller: GameController, level: number): void {
  const def = controller.config.levels.find((l) => l.level === level);
  controller.state.level.current = level;
  controller.state.level.xp = def?.xpRequired ?? 0;
}

/**
 * Flatten the START REGION's terrain to grass (§ v10/v11: via sparse overrides —
 * Terrain ist nicht mehr im Save), so location bonuses around the town hall are
 * 0 unless a test paints terrain explicitly.
 */
export function flattenTerrain(controller: GameController): void {
  const b = regionBounds(START_REGION);
  if (!b) throw new Error('helpers: Startregion ohne Bounds');
  for (let y = b.minY; y <= b.maxY; y++) {
    for (let x = b.minX; x <= b.maxX; x++) {
      if (regionIdAt(x, y) !== START_REGION) continue;
      overrideTerrain(controller.state, x, y, 'grass');
    }
  }
  refreshDerived(controller);
}

export function paintTerrain(controller: GameController, tiles: [number, number][], terrain: TerrainType): void {
  for (const [x, y] of tiles) overrideTerrain(controller.state, x, y, terrain);
  refreshDerived(controller);
}

/** Recompute derived values after direct state edits in tests. */
export function refreshDerived(controller: GameController): void {
  controller.derived = recomputeDerived(controller.state, controller.config);
}
