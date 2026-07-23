import { afterEach, describe, expect, it } from 'vitest';
import { useUiStore } from '../src/state/store.ts';
import { newController } from './helpers.ts';

afterEach(() => {
  useUiStore.setState({ fogDisabled: false, revealLockedRegionsVisually: false });
});

describe('Regionssicht und Gameplay-Freischaltung', () => {
  it('keeps the visual fog switch strictly outside persisted gameplay state', () => {
    const { controller } = newController();
    const before = structuredClone(controller.state.world.regions);
    useUiStore.getState().toggleRegionFog();
    expect(useUiStore.getState()).toMatchObject({
      fogDisabled: true,
      revealLockedRegionsVisually: true,
    });
    expect(controller.state.world.regions).toEqual(before);
  });

  it('unlocks only regular gameplay regions through the explicit controller cheat', () => {
    const { controller, config } = newController();
    expect(controller.debugUnlockAllRegions()).toEqual({ ok: true });
    for (const def of config.regions.values()) {
      const status = controller.state.world.regions[String(def.id)]?.status;
      if (def.unlockable) expect(status, `Region ${def.id}`).toBe('unlocked');
      else expect(status, `Teaser-Region ${def.id}`).not.toBe('unlocked');
    }
  });
});
