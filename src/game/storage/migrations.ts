import { SCHEMA_VERSION } from '../newGame.ts';
import { saveGameSchema } from '../config/schemas.ts';
import type { SaveGame } from '../types.ts';

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/**
 * Migration chain: migrations[n] upgrades a save from schemaVersion n to n+1.
 * Every future schema change adds exactly one entry here — old saves survive
 * every release (§15).
 */
const migrations: Record<number, Migration> = {
  // Example for the future:
  // 1: (raw) => ({ ...raw, schemaVersion: 2, newField: defaultValue }),
};

export class SaveValidationError extends Error {}

export function migrateAndValidate(rawInput: unknown): SaveGame {
  if (typeof rawInput !== 'object' || rawInput === null) {
    throw new SaveValidationError('Save is not an object');
  }
  let raw = rawInput as Record<string, unknown>;
  let version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  if (version < 1 || version > SCHEMA_VERSION) {
    throw new SaveValidationError(`Unsupported save schemaVersion ${version}`);
  }
  while (version < SCHEMA_VERSION) {
    const migrate = migrations[version];
    if (!migrate) throw new SaveValidationError(`Missing migration from v${version}`);
    raw = migrate(raw);
    version = raw.schemaVersion as number;
  }
  const parsed = saveGameSchema.safeParse(raw);
  if (!parsed.success) {
    throw new SaveValidationError(`Save validation failed: ${parsed.error.issues[0]?.message ?? 'unknown'}`);
  }
  return parsed.data as SaveGame;
}
