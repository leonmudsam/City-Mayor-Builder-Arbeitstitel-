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
