import { describe, expect, it } from 'vitest';
import { newController, setLevel } from './helpers.ts';
import { sectorId } from '../src/game/types.ts';

describe('sector expansion (open-end world)', () => {
  it('is locked before level 5', () => {
    const { controller } = newController();
    expect(controller.unlockSector(sectorId(1, 2))).toEqual({ ok: false, error: 'locked' });
  });

  it('unlocks adjacent sectors for scaling money costs', () => {
    const { controller } = newController();
    setLevel(controller, 5);
    controller.state.resources.money = 1_000_000;
    const cost1 = controller.getSectorCost(sectorId(1, 2));
    expect(controller.unlockSector(sectorId(1, 2))).toEqual({ ok: true });
    expect(controller.state.stats.sectorsUnlocked).toBe(2);
    const cost2 = controller.getSectorCost(sectorId(1, 3));
    expect(cost2).toBeGreaterThan(cost1); // distance + count scaling
  });

  it('rejects non-adjacent sectors', () => {
    const { controller } = newController();
    setLevel(controller, 5);
    controller.state.resources.money = 1_000_000;
    expect(controller.unlockSector(sectorId(3, 3))).toEqual({ ok: false, error: 'invalid' });
  });

  it('founds the river district: a self-connected build area at the water (§8)', () => {
    const { controller } = newController();
    setLevel(controller, 12);
    controller.state.resources = { money: 2_000_000, wood: 2_000, stone: 2_000, food: 1_000, freshwater: 0 };
    const river = sectorId(3, 1); // eastern sector — the river runs through it
    expect(controller.canFoundDistrict(river).eligible).toBe(true);
    expect(controller.foundDistrict(river)).toEqual({ ok: true });

    const sector = controller.state.world.sectors[river]!;
    expect(sector.status).toBe('unlocked');
    expect(sector.districtId).toBe('river');
    const district = controller.state.world.districts['river'];
    expect(district).toBeDefined();
    const center = controller.state.buildings[district!.centerBuildingId]!;
    expect(center.defId).toBe('district_center');
    expect(center.status).toBe('active');

    // The centre seeds its own road network: a road placed next to it connects
    // without any link back to downtown.
    const placed = [
      [center.x, center.y - 1], [center.x, center.y + 3],
      [center.x - 1, center.y], [center.x + 3, center.y],
    ].some(([x, y]) => controller.placeBuilding('road', x!, y!).ok);
    expect(placed).toBe(true);

    // Only one river district for now.
    expect(controller.canFoundDistrict(sectorId(3, 2)).eligible).toBe(false);
  });

  it('materializes new terrain beyond the start region (open end)', () => {
    const { controller } = newController();
    setLevel(controller, 5);
    controller.state.resources.money = 5_000_000;
    expect(controller.unlockSector(sectorId(1, 0))).toEqual({ ok: true });
    expect(controller.unlockSector(sectorId(1, -1))).toEqual({ ok: true }); // outside start region
    // Neighbor ring materialized for the "visible but locked" effect.
    expect(controller.state.world.sectors[sectorId(1, -2)]).toBeDefined();
    expect(controller.state.world.sectors[sectorId(1, -2)]?.status).toBe('locked');
  });
});
