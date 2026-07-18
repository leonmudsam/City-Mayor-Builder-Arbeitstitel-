import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, START_REGION } from './helpers.ts';
import { regionIdAt } from '../src/game/config/startRegion.config.ts';

// Insel-Layout (v11, vom Bake): Rathaus 5×5 bei startRegionConfig.townHall,
// Startstraßen in Reihe townHall.y+5 (x..x+4). Tests arbeiten relativ zum
// Rathaus (nearTownHall) und flachen die Startregion auf Gras ab, damit die
// Platzierungsregeln — nicht zufälliges Insel-Terrain — getestet werden.

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

/** Erste Kachel nördlich des Rathauses, die in einer GESPERRTEN Region liegt. */
function lockedTile(): { x: number; y: number } {
  for (let dy = -1; dy > -200; dy--) {
    const { x, y } = at(0, dy);
    const rid = regionIdAt(x, y);
    if (rid !== 0 && rid !== START_REGION) return { x, y };
  }
  throw new Error('keine gesperrte Region nördlich des Rathauses gefunden');
}

describe('placement', () => {
  it('allows extending the road network and building a house next to it', () => {
    const { controller } = newController();
    flattenTerrain(controller);
    expect(controller.placeBuilding('road', at(5, 5).x, at(5, 5).y)).toEqual({ ok: true });
    expect(controller.placeBuilding('road', at(6, 5).x, at(6, 5).y)).toEqual({ ok: true });
    // House footprint 3×3 touches the road row above.
    expect(controller.placeBuilding('house_small', at(4, 6).x, at(4, 6).y)).toEqual({ ok: true });
  });

  it('rejects a house without road access', () => {
    const { controller } = newController();
    flattenTerrain(controller);
    expect(controller.placeBuilding('house_small', at(-5, -5).x, at(-5, -5).y)).toEqual({ ok: false, error: 'needs_road' });
  });

  it('rejects disconnected road tiles', () => {
    const { controller } = newController();
    flattenTerrain(controller);
    expect(controller.placeBuilding('road', at(8, 8).x, at(8, 8).y)).toEqual({ ok: false, error: 'needs_road' });
  });

  it('rejects buildings in locked regions', () => {
    const { controller } = newController();
    const t = lockedTile();
    expect(controller.placeBuilding('road', t.x, t.y)).toEqual({ ok: false, error: 'region_locked' });
  });

  it('rejects overlapping buildings and charges costs', () => {
    const { controller } = newController();
    flattenTerrain(controller);
    const moneyBefore = controller.state.resources.money;
    controller.placeBuilding('road', at(5, 5).x, at(5, 5).y);
    expect(controller.state.resources.money).toBe(moneyBefore - 300);
    expect(controller.placeBuilding('road', at(5, 5).x, at(5, 5).y)).toEqual({ ok: false, error: 'occupied' });
  });

  it('rejects locked building types', () => {
    const { controller } = newController();
    flattenTerrain(controller);
    expect(controller.placeBuilding('sawmill', at(3, 6).x, at(3, 6).y)).toEqual({ ok: false, error: 'locked_building' });
  });
});
