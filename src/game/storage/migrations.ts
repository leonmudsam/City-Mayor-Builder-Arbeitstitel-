import { SCHEMA_VERSION } from '../newGame.ts';
import { saveGameSchema } from '../config/schemas.ts';
import { SECTOR_SIZE, startRegionConfig, terrainAt } from '../config/startRegion.config.ts';
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
  // v2 → v3: money moved to a realistic municipal scale (§4). Stored cash is
  // scaled up so an old save keeps its relative wealth instead of being
  // bankrupt against the new costs. Housing/income are config-derived, so they
  // update automatically. Materials (wood/stone/food) keep their small scale.
  2: (raw) => {
    const resources = { ...(raw.resources as Record<string, number>) };
    if (typeof resources.money === 'number') resources.money = Math.round(resources.money * MONEY_SCALE_V3);
    return { ...raw, schemaVersion: 3, resources };
  },
  // v3 → v4: energy grid (MVP 2). The new `energy` need is seeded on old saves
  // so the citizens state stays complete; it only starts biting once the city
  // reaches its unlock level and buildings draw power.
  3: (raw) => {
    const citizens = { ...(raw.citizens as Record<string, unknown>) };
    const needs = { ...((citizens.needs as Record<string, unknown>) ?? {}) };
    needs.energy ??= { supply: 0, demand: 0, fulfillment: 1 };
    return { ...raw, schemaVersion: 4, citizens: { ...citizens, needs } };
  },
  // v4 → v5: emergency services (MVP 2). Seed the safety & health coverage needs
  // so old saves stay complete; they only bite once the city reaches their level.
  4: (raw) => {
    const citizens = { ...(raw.citizens as Record<string, unknown>) };
    const needs = { ...((citizens.needs as Record<string, unknown>) ?? {}) };
    needs.safety ??= { supply: 0, demand: 0, fulfillment: 1 };
    needs.health ??= { supply: 0, demand: 0, fulfillment: 1 };
    return { ...raw, schemaVersion: 5, citizens: { ...citizens, needs } };
  },
  // v5 → v6: mayor tax policy (§ tax sliders). Old saves start at neutral rates.
  5: (raw) => ({
    ...raw,
    schemaVersion: 6,
    policy: (raw.policy as unknown) ?? { residentialTaxRate: 1, commercialTaxRate: 1 },
  }),
  // v6 → v7: drinking-water supply chain. Seed the freshwater resource, need and
  // produced-stat so old saves stay complete; the chain only matters from L12.
  6: (raw) => {
    const resources = { ...(raw.resources as Record<string, number>) };
    resources.freshwater ??= 0;
    const citizens = { ...(raw.citizens as Record<string, unknown>) };
    const needs = { ...((citizens.needs as Record<string, unknown>) ?? {}) };
    needs.freshwater ??= { supply: 0, demand: 0, fulfillment: 1 };
    const stats = { ...(raw.stats as Record<string, unknown>) };
    const produced = { ...((stats.produced as Record<string, number>) ?? {}) };
    produced.freshwater ??= 0;
    return { ...raw, schemaVersion: 7, resources, citizens: { ...citizens, needs }, stats: { ...stats, produced } };
  },
  // v7 → v8: the world became a large but *bounded* board (§ bounded world). Fill
  // in every in-bounds sector an old (open-end) save never materialized, as
  // locked/visible, so all biomes now show from the start. Existing sectors —
  // including anything the player already unlocked or built beyond the new bounds
  // — are kept untouched; only missing in-bounds sectors are added.
  7: (raw) => {
    const world = { ...(raw.world as { sectors: Record<string, unknown>; districts: unknown }) };
    const sectors = { ...(world.sectors as Record<string, unknown>) };
    const { minSx, minSy, maxSx, maxSy } = startRegionConfig.worldBounds;
    for (let sy = minSy; sy <= maxSy; sy++) {
      for (let sx = minSx; sx <= maxSx; sx++) {
        const id = `${sx}:${sy}`;
        if (sectors[id]) continue;
        const tiles: { terrain: string }[] = [];
        for (let ly = 0; ly < SECTOR_SIZE; ly++) {
          for (let lx = 0; lx < SECTOR_SIZE; lx++) {
            tiles.push({ terrain: terrainAt(sx * SECTOR_SIZE + lx, sy * SECTOR_SIZE + ly) });
          }
        }
        sectors[id] = { id, sx, sy, districtId: 'main', status: 'locked', tiles };
      }
    }
    return { ...raw, schemaVersion: 8, world: { ...world, sectors } };
  },
};

/** Money rescale applied when upgrading v2 saves to the v3 economy. */
const MONEY_SCALE_V3 = 100;

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
