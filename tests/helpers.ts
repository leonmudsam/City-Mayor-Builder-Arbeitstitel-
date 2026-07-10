import { loadConfig, type GameConfig } from '../src/game/config/index.ts';
import { createNewGame } from '../src/game/newGame.ts';
import { GameController } from '../src/game/commands/controller.ts';

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
