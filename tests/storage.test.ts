import { describe, expect, it } from 'vitest';
import { newController, T0 } from './helpers.ts';
import { exportSave, importSave } from '../src/game/storage/exportImport.ts';
import { migrateAndValidate, SaveValidationError } from '../src/game/storage/migrations.ts';

describe('save/load', () => {
  it('round-trips a live game through export/import', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27);
    controller.update(T0 + 5 * 60_000);
    const json = exportSave(controller.state);
    const restored = importSave(json);
    expect(restored).toEqual(JSON.parse(JSON.stringify(controller.state)));
  });

  it('rejects corrupt saves instead of silently resetting', () => {
    expect(() => importSave('{"schemaVersion": 1, "meta": "broken"}')).toThrow(SaveValidationError);
    expect(() => migrateAndValidate(null)).toThrow(SaveValidationError);
    expect(() => migrateAndValidate({ schemaVersion: 99 })).toThrow(SaveValidationError);
  });

  it('migrates v1 saves: buffers into storage, produced stats, fresh terrain', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    /* eslint-disable @typescript-eslint/no-explicit-any -- building an intentionally outdated v1 raw save */
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, any>;
    raw.schemaVersion = 1;
    raw.stats.collected = { money: 0, wood: 12, stone: 0, food: 0 };
    delete raw.stats.produced;
    for (const b of Object.values(raw.buildings as Record<string, any>)) b.buffer = 0;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    // A v1 sawmill with 25 uncollected wood.
    const sawmillId = 'b_test_sawmill';
    raw.buildings[sawmillId] = { id: sawmillId, defId: 'sawmill', x: 28, y: 27, upgradeLevel: 0, status: 'active', buffer: 25.7 };
    // v1 terrain did not know the lake: force grass at its center tile (10,42).
    const lakeSector = raw.world.sectors['0:2'];
    lakeSector.tiles[(42 - 32) * 16 + 10].terrain = 'grass';

    const woodBefore = raw.resources.wood as number;
    const migrated = migrateAndValidate(raw);
    expect(migrated.schemaVersion).toBe(8);
    expect(migrated.resources.wood).toBe(woodBefore + 25);
    expect(migrated.stats.produced.wood).toBe(12);
    expect('buffer' in migrated.buildings[sawmillId]!).toBe(false);
    expect(migrated.world.sectors['0:2']!.tiles[(42 - 32) * 16 + 10]!.terrain).toBe('water');
  });

  it('migrates v2 saves onto the v3 money scale', () => {
    const { controller } = newController();
    /* eslint-disable @typescript-eslint/no-explicit-any -- crafting a v2 raw save */
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, any>;
    raw.schemaVersion = 2;
    raw.resources.money = 500;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const migrated = migrateAndValidate(raw);
    expect(migrated.schemaVersion).toBe(8);
    expect(migrated.resources.money).toBe(50_000); // ×100 rescale
  });

  it('migrates v3/v4 saves by seeding the new needs (energy, safety, health)', () => {
    const { controller } = newController();
    /* eslint-disable @typescript-eslint/no-explicit-any -- crafting a v3 raw save */
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, any>;
    raw.schemaVersion = 3;
    delete raw.citizens.needs.energy; // v3 saves predate the energy grid
    delete raw.citizens.needs.safety; // and the emergency services
    delete raw.citizens.needs.health;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const migrated = migrateAndValidate(raw);
    expect(migrated.schemaVersion).toBe(8);
    expect(migrated.citizens.needs.energy).toEqual({ supply: 0, demand: 0, fulfillment: 1 });
    expect(migrated.citizens.needs.safety).toEqual({ supply: 0, demand: 0, fulfillment: 1 });
    expect(migrated.citizens.needs.health).toEqual({ supply: 0, demand: 0, fulfillment: 1 });
  });

  it('migrates v5 saves by seeding neutral tax policy', () => {
    const { controller } = newController();
    /* eslint-disable @typescript-eslint/no-explicit-any -- crafting a v5 raw save */
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, any>;
    raw.schemaVersion = 5;
    delete raw.policy; // v5 saves predate the tax sliders
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const migrated = migrateAndValidate(raw);
    expect(migrated.schemaVersion).toBe(8);
    expect(migrated.policy).toEqual({ residentialTaxRate: 1, commercialTaxRate: 1 });
  });

  it('migrates v6 saves by seeding the freshwater supply chain', () => {
    const { controller } = newController();
    /* eslint-disable @typescript-eslint/no-explicit-any -- crafting a v6 raw save */
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, any>;
    raw.schemaVersion = 6;
    delete raw.resources.freshwater; // v6 saves predate drinking water
    delete raw.citizens.needs.freshwater;
    delete raw.stats.produced.freshwater;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const migrated = migrateAndValidate(raw);
    expect(migrated.schemaVersion).toBe(8);
    expect(migrated.resources.freshwater).toBe(0);
    expect(migrated.citizens.needs.freshwater).toEqual({ supply: 0, demand: 0, fulfillment: 1 });
    expect(migrated.stats.produced.freshwater).toBe(0);
  });

  it('migrates v7 saves by filling in the bounded world (all biomes visible)', () => {
    const { controller } = newController();
    /* eslint-disable @typescript-eslint/no-explicit-any -- crafting a sparse v7 raw save */
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, any>;
    raw.schemaVersion = 7;
    // A v7 (open-end) save only ever materialized what the player explored: keep
    // just the start sector, drop the rest so migration must re-fill the board.
    raw.world.sectors = { '1:1': raw.world.sectors['1:1'] };
    const startBuildings = raw.world.sectors['1:1'].tiles.filter((t: any) => t.buildingId).length;
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const migrated = migrateAndValidate(raw);
    expect(migrated.schemaVersion).toBe(8);
    // Every in-bounds sector (6×5) now exists and is visible from the start…
    expect(Object.keys(migrated.world.sectors).length).toBe(30);
    // …the start sector is preserved (still unlocked, still holds its buildings)…
    expect(migrated.world.sectors['1:1']!.status).toBe('unlocked');
    expect(migrated.world.sectors['1:1']!.tiles.filter((t) => t.buildingId).length).toBe(startBuildings);
    // …the rest are locked, and far biomes (the eastern sea) are on show.
    expect(migrated.world.sectors['0:0']!.status).toBe('locked');
    expect(migrated.world.sectors['5:2']!.tiles.some((t) => t.terrain === 'water')).toBe(true);
  });
});
