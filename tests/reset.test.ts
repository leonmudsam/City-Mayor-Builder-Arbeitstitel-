import { describe, expect, it } from 'vitest';
import { newController, T0 } from './helpers.ts';
import { createNewGame } from '../src/game/newGame.ts';

// The "start over" button swaps a fresh state into the live controller in place
// (no page reload, which used to let the autosave clobber the delete). These
// lock that the swap fully replaces the world and re-arms the tutorial.
describe('in-place reset (resetTo)', () => {
  it('replaces the whole state and reactivates the first quest', () => {
    const { controller, config } = newController();
    controller.placeBuilding('road', 160, 224);
    controller.placeBuilding('house_small', 160, 225);
    controller.state.resources.money = 12_345;
    const before = controller.version;

    const fresh = createNewGame(config, 'Neustadt', T0 + 1000);
    controller.resetTo(fresh);

    // Only the pre-placed buildings remain (town hall + start roads) — the
    // player's house/road are gone.
    expect(controller.state.buildings['b_townhall']).toBeDefined();
    expect(Object.values(controller.state.buildings).some((b) => b.defId === 'house_small')).toBe(false);
    // Money is back to the fresh starting budget, not the old 12 345.
    expect(controller.state.resources.money).toBe(config.balancing.startResources.money);
    // A change was broadcast (UI re-renders) and the tutorial quest is active again.
    expect(controller.version).toBeGreaterThan(before);
    expect(controller.state.quests.active.some((a) => a.questId === 'q01_roads')).toBe(true);
  });
});
