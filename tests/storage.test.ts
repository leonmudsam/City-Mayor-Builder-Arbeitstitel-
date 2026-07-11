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
    expect(migrated.schemaVersion).toBe(4);
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
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.resources.money).toBe(50_000); // ×100 rescale
  });

  it('migrates v3 saves by seeding the energy need', () => {
    const { controller } = newController();
    /* eslint-disable @typescript-eslint/no-explicit-any -- crafting a v3 raw save */
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, any>;
    raw.schemaVersion = 3;
    delete raw.citizens.needs.energy; // v3 saves predate the energy grid
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const migrated = migrateAndValidate(raw);
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.citizens.needs.energy).toEqual({ supply: 0, demand: 0, fulfillment: 1 });
  });
});
