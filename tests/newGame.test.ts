import { describe, expect, it } from 'vitest';
import { newController, START_REGION } from './helpers.ts';
import { regionHasTerrain } from '../src/game/map/world.ts';
import { REGION_COUNT, regionIdAt, startRegionConfig } from '../src/game/config/startRegion.config.ts';

describe('new game (Insel-Welt v11, organische Regionen)', () => {
  it('creates all region stubs with one unlocked start region', () => {
    const { controller } = newController();
    const regions = Object.values(controller.state.world.regions);
    // Alle gebackenen Landschaften sichtbar (§ Welt 2.0), nur der Bake-Start frei.
    expect(regions.length).toBe(REGION_COUNT);
    expect(regions.filter((r) => r.status === 'unlocked').length).toBe(1);
    expect(controller.state.world.regions[String(START_REGION)]?.status).toBe('unlocked');
    // Der Ozean ist KEINE Region (Id 0) — die Weltecke gehört niemandem.
    expect(regionIdAt(0, 0)).toBe(0);
    // Seenlandschaften existieren als Regionen mit Wasser-Kacheln (Bake-Statistik).
    const lakeRegion = Object.values(controller.state.world.regions).find((r) => regionHasTerrain(r.id, 'water'));
    expect(lakeRegion).toBeDefined();
  });

  it('pre-places the 5×5 town hall as district center with connected roads', () => {
    const { controller } = newController();
    const townHall = controller.state.buildings['b_townhall'];
    expect(townHall?.status).toBe('active');
    expect(controller.state.world.districts['main']?.centerBuildingId).toBe('b_townhall');
    // Zwei verlängerbare Achsen mit zusammen 16 Startstraßen (§ Welt 6.1).
    expect(startRegionConfig.startRoads.length).toBe(16);
    expect(controller.derived.roadNetwork.size).toBe(16);
  });

  it('starts with configured resources and no population', () => {
    const { controller } = newController();
    expect(controller.state.resources.money).toBe(45_000);
    expect(controller.state.citizens.population).toBe(0);
  });
});
