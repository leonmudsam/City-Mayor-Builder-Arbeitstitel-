import type { SaveGame } from '../types.ts';
import { migrateAndValidate } from './migrations.ts';

// JSON export/import: player backups, device moves, and bug reports — the
// "poor man's cloud save" until MVP 2 (§15).

export function exportSave(state: SaveGame): string {
  return JSON.stringify(state, null, 2);
}

export function importSave(json: string): SaveGame {
  return migrateAndValidate(JSON.parse(json));
}
