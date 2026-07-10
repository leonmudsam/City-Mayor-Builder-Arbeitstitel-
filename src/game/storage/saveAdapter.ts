import type { SaveGame } from '../types.ts';

/**
 * Storage abstraction (§15): async from day one so IndexedDB (MVP 2) and a
 * CloudSaveAdapter (MVP 2/3) are drop-in replacements — the rest of the game
 * never changes.
 */
export interface SaveAdapter {
  save(slot: string, data: SaveGame): Promise<void>;
  load(slot: string): Promise<SaveGame | undefined>;
  list(): Promise<string[]>;
  delete(slot: string): Promise<void>;
}

export const DEFAULT_SLOT = 'city1';
