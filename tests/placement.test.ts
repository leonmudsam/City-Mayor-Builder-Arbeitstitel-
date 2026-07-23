import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, refreshDerived, START_REGION } from './helpers.ts';
import { bakedSurfaceAt, regionIdAt, WORLD_TILES } from '../src/game/config/startRegion.config.ts';

// Insel-Layout (v11, vom Bake): Rathaus 5×5 bei startRegionConfig.townHall,
// Startstraßen in Reihe townHall.y+5 (x..x+4). Tests arbeiten relativ zum
// Rathaus (nearTownHall) und flachen die Startregion auf Gras ab, damit die
// Platzierungsregeln — nicht zufälliges Insel-Terrain — getestet werden.

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

/** Erste Kachel nördlich des Rathauses, die in einer GESPERRTEN Region liegt. */
function lockedTile(): { x: number; y: number } {
  for (let y = 0; y < WORLD_TILES; y++) {
    for (let x = 0; x < WORLD_TILES; x++) {
      const rid = regionIdAt(x, y);
      if (rid !== 0 && rid !== START_REGION && bakedSurfaceAt(x, y).buildable) return { x, y };
    }
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

  it('allows a house without road access but marks it disconnected', () => {
    const { controller } = newController();
    flattenTerrain(controller);
    const housingBefore = controller.derived.capacity.housing;
    expect(controller.placeBuilding('house_small', at(-5, -3).x, at(-5, -3).y)).toEqual({ ok: true });
    const house = Object.values(controller.state.buildings).find((building) => building.defId === 'house_small')!;
    house.status = 'active';
    delete house.constructionEndsAt;
    refreshDerived(controller);
    expect(controller.getBuildingInfrastructureStatus(house.id)).toMatchObject({
      status: 'disconnected',
      problems: ['no_road'],
    });
    expect(controller.derived.capacity.housing).toBe(housingBefore);
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
