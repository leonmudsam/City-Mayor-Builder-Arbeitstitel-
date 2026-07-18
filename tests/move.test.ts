import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, setLevel, START_REGION, T0 } from './helpers.ts';
import { tileAt } from '../src/game/map/world.ts';
import { regionIdAt } from '../src/game/config/startRegion.config.ts';
import type { GameController } from '../src/game/commands/controller.ts';

// Moving is disabled in MVP 1 (§5) but the engine command is retained behind a
// feature flag. These tests exercise the command with the flag enabled.
// Insel-Layout (v11): Rathaus 5×5 am Bake-Anker, Startstraßen-Zeile bei y+5
// (x..x+4); Anbauten liegen ab y+6, Erweiterungs-Straßen ab x+5 in der Zeile.
function movableController(): GameController {
  const { controller } = newController();
  controller.config.features.moveBuildings = true;
  flattenTerrain(controller);
  return controller;
}

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

/** Erste Kachel nördlich des Rathauses in einer GESPERRTEN Region. */
function lockedTile(): { x: number; y: number } {
  for (let dy = -1; dy > -200; dy--) {
    const { x, y } = at(0, dy);
    const rid = regionIdAt(x, y);
    if (rid !== 0 && rid !== START_REGION) return { x, y };
  }
  throw new Error('keine gesperrte Region nördlich des Rathauses gefunden');
}

describe('moveBuilding', () => {
  it('is disabled by default — buildings must be demolished and rebuilt', () => {
    const { controller } = newController();
    flattenTerrain(controller);
    controller.placeBuilding('road', at(5, 5).x, at(5, 5).y);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    expect(controller.moveBuilding(house.id, at(5, 6).x, at(5, 6).y)).toEqual({ ok: false, error: 'feature_disabled' });
  });

  it('relocates a building and rewrites its footprint tiles', () => {
    const controller = movableController();
    controller.placeBuilding('road', at(5, 5).x, at(5, 5).y);
    controller.placeBuilding('road', at(6, 5).x, at(6, 5).y);
    controller.placeBuilding('road', at(7, 5).x, at(7, 5).y);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;

    expect(controller.moveBuilding(house.id, at(6, 6).x, at(6, 6).y)).toEqual({ ok: true });
    expect(house.x).toBe(at(6, 6).x);
    expect(tileAt(controller.state, at(3, 6).x, at(3, 6).y)?.buildingId).toBeUndefined();
    expect(tileAt(controller.state, at(6, 6).x, at(6, 6).y)?.buildingId).toBe(house.id);
    // 3×3-Footprint: auch die Mitte des neuen Grundstücks gehört dem Haus.
    expect(tileAt(controller.state, at(7, 7).x, at(7, 7).y)?.buildingId).toBe(house.id);
  });

  it('allows moving onto tiles overlapping the old position', () => {
    const controller = movableController();
    controller.placeBuilding('road', at(5, 5).x, at(5, 5).y);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    expect(controller.moveBuilding(house.id, at(4, 6).x, at(4, 6).y)).toEqual({ ok: true });
    expect(tileAt(controller.state, at(3, 6).x, at(3, 6).y)?.buildingId).toBeUndefined();
    expect(tileAt(controller.state, at(4, 6).x, at(4, 6).y)?.buildingId).toBe(house.id);
  });

  it('rejects occupied or roadless targets and keeps the building in place', () => {
    const controller = movableController();
    controller.placeBuilding('road', at(5, 5).x, at(5, 5).y);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    // Onto the town hall footprint:
    expect(controller.moveBuilding(house.id, at(0, 0).x, at(0, 0).y)).toEqual({ ok: false, error: 'occupied' });
    // Away from any road:
    expect(controller.moveBuilding(house.id, at(-5, -5).x, at(-5, -5).y)).toEqual({ ok: false, error: 'needs_road' });
    expect(house.x).toBe(at(3, 6).x);
    expect(tileAt(controller.state, at(3, 6).x, at(3, 6).y)?.buildingId).toBe(house.id);
  });

  it('moves unique buildings (town hall) even though they cannot be demolished', () => {
    const controller = movableController();
    const townHall = controller.state.buildings['b_townhall']!;
    expect(controller.demolishBuilding(townHall.id)).toEqual({ ok: false, error: 'invalid' });
    expect(controller.moveBuilding(townHall.id, at(-7, -3).x, at(-7, -3).y)).toEqual({ ok: true });
    expect(tileAt(controller.state, at(-7, -3).x, at(-7, -3).y)?.buildingId).toBe(townHall.id);
    expect(tileAt(controller.state, at(0, 0).x, at(0, 0).y)?.buildingId).toBeUndefined();
  });

  it('rejects moves into locked regions', () => {
    const controller = movableController();
    const townHall = controller.state.buildings['b_townhall']!;
    const t = lockedTile();
    expect(controller.moveBuilding(townHall.id, t.x, t.y)).toEqual({ ok: false, error: 'region_locked' });
  });
});

// §2: non-demolishable specials relocate via their own action even with the
// global move feature OFF, re-validating placement and charging a fee.
describe('relocate special buildings', () => {
  it('relocates the town hall without the move feature (it cannot be demolished)', () => {
    const { controller } = newController();
    flattenTerrain(controller);
    expect(controller.config.features.moveBuildings).toBe(false);
    const townHall = controller.state.buildings['b_townhall']!;
    expect(controller.demolishBuilding(townHall.id)).toEqual({ ok: false, error: 'invalid' });
    expect(controller.moveBuilding(townHall.id, at(-7, -3).x, at(-7, -3).y)).toEqual({ ok: true });
    expect(tileAt(controller.state, at(-7, -3).x, at(-7, -3).y)?.buildingId).toBe(townHall.id);
    expect(tileAt(controller.state, at(0, 0).x, at(0, 0).y)?.buildingId).toBeUndefined();
  });

  it('charges the relocation fee for the mayor house and rejects when unaffordable', () => {
    const { controller } = newController();
    flattenTerrain(controller);
    setLevel(controller, 3);
    for (let dx = 5; dx <= 14; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    controller.placeBuilding('mayor_house', at(5, 6).x, at(5, 6).y);
    controller.update(T0 + 61_000); // finish construction
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'mayor_house')!;
    controller.state.resources.money = 5_000;
    expect(controller.moveBuilding(house.id, at(8, 6).x, at(8, 6).y)).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(2_000); // 3 000 fee
    // Valid target, but now too poor for the fee.
    controller.state.resources.money = 500;
    expect(controller.moveBuilding(house.id, at(11, 6).x, at(11, 6).y)).toEqual({ ok: false, error: 'insufficient' });
    expect(house.x).toBe(at(8, 6).x);
  });

  it('still refuses to relocate ordinary buildings with the feature off', () => {
    const { controller } = newController();
    flattenTerrain(controller);
    controller.placeBuilding('road', at(5, 5).x, at(5, 5).y);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    const h = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    expect(controller.moveBuilding(h.id, at(6, 6).x, at(6, 6).y)).toEqual({ ok: false, error: 'feature_disabled' });
  });
});
