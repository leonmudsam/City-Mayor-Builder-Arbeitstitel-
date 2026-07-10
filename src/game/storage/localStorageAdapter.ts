import type { SaveAdapter } from './saveAdapter.ts';
import type { SaveGame } from '../types.ts';
import { migrateAndValidate } from './migrations.ts';

const PREFIX = 'cmb.save.';
const BACKUP_SUFFIX = '.backup';

/**
 * MVP-1 storage: localStorage with a one-generation backup slot. A corrupt
 * primary save falls back to the backup instead of silently resetting (§15).
 */
export class LocalStorageSaveAdapter implements SaveAdapter {
  async save(slot: string, data: SaveGame): Promise<void> {
    const key = PREFIX + slot;
    const previous = localStorage.getItem(key);
    if (previous !== null) localStorage.setItem(key + BACKUP_SUFFIX, previous);
    localStorage.setItem(key, JSON.stringify(data));
  }

  async load(slot: string): Promise<SaveGame | undefined> {
    const key = PREFIX + slot;
    for (const candidate of [key, key + BACKUP_SUFFIX]) {
      const raw = localStorage.getItem(candidate);
      if (raw === null) continue;
      try {
        return migrateAndValidate(JSON.parse(raw));
      } catch {
        // fall through to backup
      }
    }
    return undefined;
  }

  async list(): Promise<string[]> {
    const slots: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX) && !key.endsWith(BACKUP_SUFFIX)) slots.push(key.slice(PREFIX.length));
    }
    return slots;
  }

  async delete(slot: string): Promise<void> {
    localStorage.removeItem(PREFIX + slot);
    localStorage.removeItem(PREFIX + slot + BACKUP_SUFFIX);
  }
}
