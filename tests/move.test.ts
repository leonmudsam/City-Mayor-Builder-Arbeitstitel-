import { describe, expect, it } from 'vitest';
import { newController } from './helpers.ts';
import { tileAt } from '../src/game/map/world.ts';

describe('moveBuilding', () => {
  it('relocates a building and rewrites its footprint tiles', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('road', 27, 26);
    controller.placeBuilding('road', 28, 26);
    controller.placeBuilding('house_small', 26, 27);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;

    expect(controller.moveBuilding(house.id, 28, 27)).toEqual({ ok: true });
    expect(house.x).toBe(28);
    expect(tileAt(controller.state, 26, 27)?.buildingId).toBeUndefined();
    expect(tileAt(controller.state, 28, 27)?.buildingId).toBe(house.id);
    expect(tileAt(controller.state, 29, 28)?.buildingId).toBe(house.id);
  });

  it('allows moving onto tiles overlapping the old position', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('road', 27, 26);
    controller.placeBuilding('house_small', 26, 27);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    expect(controller.moveBuilding(house.id, 27, 27)).toEqual({ ok: true });
    expect(tileAt(controller.state, 26, 27)?.buildingId).toBeUndefined();
    expect(tileAt(controller.state, 27, 27)?.buildingId).toBe(house.id);
  });

  it('rejects occupied or roadless targets and keeps the building in place', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    // Onto the town hall footprint:
    expect(controller.moveBuilding(house.id, 23, 23)).toEqual({ ok: false, error: 'occupied' });
    // Away from any road:
    expect(controller.moveBuilding(house.id, 18, 18)).toEqual({ ok: false, error: 'needs_road' });
    expect(house.x).toBe(26);
    expect(tileAt(controller.state, 26, 27)?.buildingId).toBe(house.id);
  });

  it('moves unique buildings (town hall) even though they cannot be demolished', () => {
    const { controller } = newController();
    const townHall = controller.state.buildings['b_townhall']!;
    expect(controller.demolishBuilding(townHall.id)).toEqual({ ok: false, error: 'invalid' });
    expect(controller.moveBuilding(townHall.id, 18, 20)).toEqual({ ok: true });
    expect(tileAt(controller.state, 18, 20)?.buildingId).toBe(townHall.id);
    expect(tileAt(controller.state, 23, 23)?.buildingId).toBeUndefined();
  });

  it('rejects moves into locked sectors', () => {
    const { controller } = newController();
    const townHall = controller.state.buildings['b_townhall']!;
    expect(controller.moveBuilding(townHall.id, 2, 2)).toEqual({ ok: false, error: 'sector_locked' });
  });
});
