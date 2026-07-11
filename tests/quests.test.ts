import { describe, expect, it } from 'vitest';
import { newController, T0 } from './helpers.ts';

describe('quests', () => {
  it('activates the first quest at game start', () => {
    const { controller } = newController();
    expect(controller.state.quests.active.map((a) => a.questId)).toContain('q01_roads');
  });

  it('tracks progress, becomes claimable, and pays out on claim', () => {
    const { controller } = newController();
    for (let i = 0; i < 5; i++) controller.placeBuilding('road', 26 + i, 26);
    const active = controller.state.quests.active.find((a) => a.questId === 'q01_roads');
    expect(active?.claimable).toBe(true);
    const moneyBefore = controller.state.resources.money;
    expect(controller.claimQuest('q01_roads')).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(moneyBefore + 6_000);
    expect(controller.state.quests.completed).toContain('q01_roads');
    // Chain: next quest activated.
    expect(controller.state.quests.active.map((a) => a.questId)).toContain('q02_houses');
  });

  it('rejects claiming unfinished quests', () => {
    const { controller } = newController();
    expect(controller.claimQuest('q01_roads')).toEqual({ ok: false, error: 'invalid' });
  });

  it('gates quests behind level', () => {
    const { controller } = newController();
    controller.update(T0 + 1000);
    expect(controller.state.quests.active.map((a) => a.questId)).not.toContain('q03_sawmill');
  });
});
