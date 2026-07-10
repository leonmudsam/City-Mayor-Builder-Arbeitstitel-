import { describe, expect, it } from 'vitest';
import { newController, setLevel, T0 } from './helpers.ts';

describe('mayor actions', () => {
  function withMayorHouse(level = 3) {
    const { controller } = newController();
    setLevel(controller, level);
    controller.placeBuilding('road', 26, 26);
    controller.placeBuilding('mayor_house', 26, 27); // 60s construction
    controller.update(T0 + 61_000);
    return controller;
  }

  it('requires the mayor house', () => {
    const { controller } = newController();
    setLevel(controller, 3);
    expect(controller.performMayorAction('speech')).toEqual({ ok: false, error: 'locked' });
  });

  it('speech applies a happiness buff and starts a cooldown', () => {
    const controller = withMayorHouse();
    expect(controller.performMayorAction('speech')).toEqual({ ok: true });
    expect(controller.state.buffs.some((b) => b.kind === 'happiness' && b.amount === 10)).toBe(true);
    expect(controller.performMayorAction('speech')).toEqual({ ok: false, error: 'cooldown' });
    expect(controller.state.stats.mayorActions['speech']).toBe(1);
  });

  it('buff expires after its duration', () => {
    const controller = withMayorHouse();
    controller.performMayorAction('speech');
    controller.update(T0 + 61_000 + 31 * 60_000); // 30 min buff
    expect(controller.state.buffs.length).toBe(0);
  });

  it('level-gates actions', () => {
    const controller = withMayorHouse(3);
    expect(controller.performMayorAction('festival')).toEqual({ ok: false, error: 'locked' });
  });
});
