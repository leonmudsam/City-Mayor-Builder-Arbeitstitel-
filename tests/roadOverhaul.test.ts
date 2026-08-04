import { describe, expect, it } from 'vitest';
import { exportSave, importSave } from '../src/game/storage/exportImport.ts';
import { nearTownHall, newController } from './helpers.ts';

describe('automatischer Straßen-Overhaul', () => {
  const at = (dx: number, dy: number) => nearTownHall(dx, dy);

  it('kündigt die Legacy-Höhenstraße nicht als zweites Werkzeug an', () => {
    const { controller } = newController();
    expect(controller.unlocksAtLevel(2)).not.toContain('road_elevated');
  });

  it('baut einen Pfad in einem Bulk-Commit und friert das Engineering im Save ein', () => {
    const { controller } = newController();
    controller.state.resources = { money: 2_000_000, wood: 2_000, stone: 2_000, food: 40, freshwater: 0, planks: 0, cut_stone: 0 };
    const waypoints = [at(0, 6), at(0, 12)];
    const preview = controller.roadPathPreview(waypoints);
    expect(preview.valid).toBe(true);
    let changes = 0;
    const unsubscribe = controller.subscribe((event) => {
      if (event.type === 'change') changes += 1;
    });
    const before = { ...controller.state.resources };
    const result = controller.buildRoadPath(waypoints);
    unsubscribe();
    expect(result.ok).toBe(true);
    expect(changes).toBe(1);
    for (const [resource, amount] of Object.entries(preview.totalCost)) {
      expect(controller.state.resources[resource as keyof typeof before]).toBe(before[resource as keyof typeof before] - (amount ?? 0));
    }
    const built = Object.values(controller.state.buildings).filter(
      (building) => building.defId === 'road' && building.y >= at(0, 6).y && building.y <= at(0, 12).y,
    );
    expect(built).toHaveLength(preview.buildTiles);
    expect(built.every((building) => building.roadEngineering !== undefined)).toBe(true);
    expect(new Set(built.map((building) => building.roadEngineering!.routeId)).size).toBe(1);

    const restored = importSave(exportSave(controller.state));
    for (const building of built) {
      expect(restored.buildings[building.id]?.roadEngineering).toEqual(building.roadEngineering);
    }
  });

  it('lehnt einen Ein-Punkt-Command defensiv ohne Abbuchung ab', () => {
    const { controller } = newController();
    const money = controller.state.resources.money;
    const count = Object.keys(controller.state.buildings).length;
    expect(controller.buildRoadPath([at(0, 6)])).toEqual({ ok: false, error: 'invalid' });
    expect(controller.state.resources.money).toBe(money);
    expect(Object.keys(controller.state.buildings)).toHaveLength(count);
  });
});
