import type { GameState } from '../types.ts';

/**
 * Deterministic mulberry32 PRNG. The seed lives in the game state so the
 * whole simulation stays reproducible (offline catch-up, later server-side
 * validation and replays).
 */
export function nextRandom(state: GameState): number {
  let t = (state.rngSeed + 0x6d2b79f5) | 0;
  state.rngSeed = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function newId(state: GameState, prefix: string): string {
  state.nextId += 1;
  return `${prefix}_${state.nextId}`;
}
