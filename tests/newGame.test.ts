import { describe, expect, it } from 'vitest';
import { newController } from './helpers.ts';
import { sectorId } from '../src/game/types.ts';

describe('new game', () => {
  it('materializes the 4×4 start region with one unlocked sector', () => {
    const { controller } = newController();
    const sectors = Object.values(controller.state.world.sectors);
    expect(sectors.length).toBe(16);
    expect(sectors.filter((s) => s.status === 'unlocked').length).toBe(1);
    expect(controller.state.world.sectors[sectorId(1, 1)]?.status).toBe('unlocked');
  });

  it('pre-places the town hall as district center with connected roads', () => {
    const { controller } = newController();
    const townHall = controller.state.buildings['b_townhall'];
    expect(townHall?.status).toBe('active');
    expect(controller.state.world.districts['main']?.centerBuildingId).toBe('b_townhall');
    expect(controller.derived.roadNetwork.size).toBe(3);
  });

  it('starts with configured resources and no population', () => {
    const { controller } = newController();
    expect(controller.state.resources.money).toBe(500);
    expect(controller.state.citizens.population).toBe(0);
  });
});
