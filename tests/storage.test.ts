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
});
