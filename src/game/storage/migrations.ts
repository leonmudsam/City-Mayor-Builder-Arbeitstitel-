import { SCHEMA_VERSION } from '../newGame.ts';
import { saveGameSchema } from '../config/schemas.ts';
import { SECTOR_SIZE, terrainAt } from '../config/startRegion.config.ts';
import type { SaveGame } from '../types.ts';

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/**
 * Migration chain: migrations[n] upgrades a save from schemaVersion n to n+1.
 * Every future schema change adds exactly one entry here — old saves survive
 * every release (§15).
 */
const migrations: Record<number, Migration> = {
  // v1 → v2: manual collecting removed (buffers credited to storage once),
  // stats.collected renamed to stats.produced, and unbuilt tiles re-derive
  // their terrain so the new lake/mountain features appear in old saves.
  1: (raw) => {
    const resources = { ...(raw.resources as Record<string, number>) };
    const buildings: Record<string, Record<string, unknown>> = {};
    for (const [id, b] of Object.entries(raw.buildings as Record<string, Record<string, unknown>>)) {
      const { buffer, ...rest } = b;
      buildings[id] = rest;
      if (typeof buffer === 'number' && buffer > 0) {
        const def = String(b.defId);
        const resource = def === 'sawmill' ? 'wood' : def === 'quarry' ? 'stone' : def === 'shop_small' ? 'money' : 'food';
        resources[resource] = (resources[resource] ?? 0) + Math.floor(buffer);
      }
    }
    const stats = raw.stats as Record<string, unknown>;
    const world = raw.world as { sectors: Record<string, { sx: number; sy: number; tiles: { terrain: string; buildingId?: string }[] }> };
    for (const sector of Object.values(world.sectors)) {
      sector.tiles.forEach((tile, i) => {
        if (tile.buildingId) return;
        tile.terrain = terrainAt(sector.sx * SECTOR_SIZE + (i % SECTOR_SIZE), sector.sy * SECTOR_SIZE + Math.floor(i / SECTOR_SIZE));
      });
    }
    return {
      ...raw,
      schemaVersion: 2,
      resources,
      buildings,
      stats: { ...stats, produced: (stats.collected as Record<string, number> | undefined) ?? { money: 0, wood: 0, stone: 0, food: 0 }, collected: undefined },
    };
  },
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
    try {
      raw = migrate(raw);
    } catch (error) {
      // A migration crashing means the save is structurally broken.
      throw new SaveValidationError(`Migration from v${version} failed: ${String(error)}`);
    }
    version = raw.schemaVersion as number;
  }
  const parsed = saveGameSchema.safeParse(raw);
  if (!parsed.success) {
    throw new SaveValidationError(`Save validation failed: ${parsed.error.issues[0]?.message ?? 'unknown'}`);
  }
  return parsed.data as SaveGame;
}
