import type { GameConfig } from '../config/index.ts';
import type { GameState } from '../types.ts';
import { grantGold, grantResources } from '../economy/economyService.ts';
import type { Derived } from '../simulation/derived.ts';
import { newId } from '../engine/rng.ts';

export function levelForXp(config: GameConfig, xp: number): number {
  let level = 1;
  for (const def of config.levels) {
    if (xp >= def.xpRequired) level = def.level;
  }
  return level;
}

export function xpForNextLevel(config: GameConfig, currentLevel: number): number | undefined {
  return config.levels.find((l) => l.level === currentLevel + 1)?.xpRequired;
}

/** Adds XP, applies level-ups (rewards + message). Returns levels gained. */
export function addXp(state: GameState, config: GameConfig, derived: Derived, amount: number): number {
  state.level.xp += amount;
  const newLevel = levelForXp(config, state.level.xp);
  let gained = 0;
  while (state.level.current < newLevel) {
    state.level.current += 1;
    gained += 1;
    const def = config.levels.find((l) => l.level === state.level.current);
    if (def) {
      if (def.rewards.money) grantResources(state, { money: def.rewards.money }, derived.storageCaps, 'level_up_reward');
      if (def.rewards.gold) grantGold(state, def.rewards.gold, 'level_up_reward');
    }
    state.mayor.messages.unshift({
      id: newId(state, 'msg'),
      textKey: 'message.level_up',
      params: { level: state.level.current },
      kind: 'info',
      createdAt: state.meta.lastSimTime,
    });
    state.mayor.reputation += 2;
  }
  return gained;
}

export function unlockedBuildings(config: GameConfig, level: number): Set<string> {
  const ids = new Set<string>();
  for (const l of config.levels) {
    if (l.level <= level) for (const id of l.unlocks) ids.add(id);
  }
  // Pre-placed/unique non-buildables are never in unlock lists.
  return ids;
}
