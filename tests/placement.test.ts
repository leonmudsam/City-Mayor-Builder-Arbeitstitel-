import { describe, expect, it } from 'vitest';
import { newController } from './helpers.ts';

// The start layout: town hall 3×3 at (23,23), roads at (23..25, 26).

describe('placement', () => {
  it('allows extending the road network and building a house next to it', () => {
    const { controller } = newController();
    expect(controller.placeBuilding('road', 26, 26)).toEqual({ ok: true });
    expect(controller.placeBuilding('road', 27, 26)).toEqual({ ok: true });
    // House footprint 2×2 at (26,27) touches road (26,26) above.
    expect(controller.placeBuilding('house_small', 26, 27)).toEqual({ ok: true });
  });

  it('rejects a house without road access', () => {
    const { controller } = newController();
    const result = controller.placeBuilding('house_small', 18, 18);
    expect(result).toEqual({ ok: false, error: 'needs_road' });
  });

  it('rejects disconnected road tiles', () => {
    const { controller } = newController();
    expect(controller.placeBuilding('road', 30, 30)).toEqual({ ok: false, error: 'needs_road' });
  });

  it('rejects buildings on locked sectors', () => {
    const { controller } = newController();
    // Sector (0,0) is materialized but locked; tile (2,2) sits there.
    expect(controller.placeBuilding('road', 2, 2)).toEqual({ ok: false, error: 'sector_locked' });
  });

  it('rejects overlapping buildings and charges costs', () => {
    const { controller } = newController();
    const moneyBefore = controller.state.resources.money;
    controller.placeBuilding('road', 26, 26);
    expect(controller.state.resources.money).toBe(moneyBefore - 200);
    expect(controller.placeBuilding('road', 26, 26)).toEqual({ ok: false, error: 'occupied' });
  });

  it('rejects locked building types', () => {
    const { controller } = newController();
    expect(controller.placeBuilding('sawmill', 26, 27)).toEqual({ ok: false, error: 'locked_building' });
  });
});
