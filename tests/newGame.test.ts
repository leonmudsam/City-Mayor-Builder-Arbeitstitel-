import { describe, expect, it } from 'vitest';
import { newController } from './helpers.ts';
import { sectorId } from '../src/game/types.ts';

describe('new game', () => {
  it('materializes the whole bounded world with one unlocked sector', () => {
    const { controller } = newController();
    const sectors = Object.values(controller.state.world.sectors);
    // The finite board (6×5 sectors) is fully materialized and visible from the
    // start (§ bounded world), with only the start sector unlocked.
    expect(sectors.length).toBe(30);
    expect(sectors.filter((s) => s.status === 'unlocked').length).toBe(1);
    expect(controller.state.world.sectors[sectorId(1, 1)]?.status).toBe('unlocked');
    // Far biomes are on show as goals: the eastern coast has open water.
    expect(controller.state.world.sectors[sectorId(5, 2)]?.tiles.some((t) => t.terrain === 'water')).toBe(true);
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
    expect(controller.state.resources.money).toBe(45_000);
    expect(controller.state.citizens.population).toBe(0);
  });
});
