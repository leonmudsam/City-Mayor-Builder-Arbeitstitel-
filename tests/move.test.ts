import { describe, expect, it } from 'vitest';
import { newController, setLevel, T0 } from './helpers.ts';
import { tileAt } from '../src/game/map/world.ts';
import type { GameController } from '../src/game/commands/controller.ts';

// Moving is disabled in MVP 1 (§5) but the engine command is retained behind a
// feature flag. These tests exercise the command with the flag enabled.
function movableController(): GameController {
  const { controller } = newController();
  controller.config.features.moveBuildings = true;
  return controller;
}

describe('moveBuilding', () => {
  it('is disabled by default — buildings must be demolished and rebuilt', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    expect(controller.moveBuilding(house.id, 28, 27)).toEqual({ ok: false, error: 'feature_disabled' });
  });

  it('relocates a building and rewrites its footprint tiles', () => {
    const controller = movableController();
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
    const controller = movableController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('road', 27, 26);
    controller.placeBuilding('house_small', 26, 27);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    expect(controller.moveBuilding(house.id, 27, 27)).toEqual({ ok: true });
    expect(tileAt(controller.state, 26, 27)?.buildingId).toBeUndefined();
    expect(tileAt(controller.state, 27, 27)?.buildingId).toBe(house.id);
  });

  it('rejects occupied or roadless targets and keeps the building in place', () => {
    const controller = movableController();
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
    const controller = movableController();
    const townHall = controller.state.buildings['b_townhall']!;
    expect(controller.demolishBuilding(townHall.id)).toEqual({ ok: false, error: 'invalid' });
    expect(controller.moveBuilding(townHall.id, 18, 20)).toEqual({ ok: true });
    expect(tileAt(controller.state, 18, 20)?.buildingId).toBe(townHall.id);
    expect(tileAt(controller.state, 23, 23)?.buildingId).toBeUndefined();
  });

  it('rejects moves into locked sectors', () => {
    const controller = movableController();
    const townHall = controller.state.buildings['b_townhall']!;
    expect(controller.moveBuilding(townHall.id, 2, 2)).toEqual({ ok: false, error: 'sector_locked' });
  });
});

// §2: non-demolishable specials relocate via their own action even with the
// global move feature OFF, re-validating placement and charging a fee.
describe('relocate special buildings', () => {
  it('relocates the town hall without the move feature (it cannot be demolished)', () => {
    const { controller } = newController();
    expect(controller.config.features.moveBuildings).toBe(false);
    const townHall = controller.state.buildings['b_townhall']!;
    expect(controller.demolishBuilding(townHall.id)).toEqual({ ok: false, error: 'invalid' });
    expect(controller.moveBuilding(townHall.id, 18, 20)).toEqual({ ok: true });
    expect(tileAt(controller.state, 18, 20)?.buildingId).toBe(townHall.id);
    expect(tileAt(controller.state, 23, 23)?.buildingId).toBeUndefined();
  });

  it('charges the relocation fee for the mayor house and rejects when unaffordable', () => {
    const { controller } = newController();
    setLevel(controller, 3);
    for (let x = 26; x <= 31; x++) controller.placeBuilding('road', x, 26);
    controller.placeBuilding('mayor_house', 26, 27);
    controller.update(T0 + 61_000); // finish construction
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'mayor_house')!;
    controller.state.resources.money = 5_000;
    expect(controller.moveBuilding(house.id, 28, 27)).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(2_000); // 3 000 fee
    // Valid target, but now too poor for the fee.
    controller.state.resources.money = 500;
    expect(controller.moveBuilding(house.id, 30, 27)).toEqual({ ok: false, error: 'insufficient' });
    expect(house.x).toBe(28);
  });

  it('still refuses to relocate ordinary buildings with the feature off', () => {
    const { controller } = newController();
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('house_small', 26, 27);
    const h = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    expect(controller.moveBuilding(h.id, 28, 27)).toEqual({ ok: false, error: 'feature_disabled' });
  });
});
