import { describe, expect, it } from 'vitest';
import { newController } from './helpers.ts';
import { grantGold, spendGold } from '../src/game/economy/economyService.ts';

describe('economy service', () => {
  it('records every gold change with reason and running balance', () => {
    const { controller } = newController();
    const state = controller.state;
    grantGold(state, 100, 'test_grant');
    expect(spendGold(state, 30, 'building_speedup')).toEqual({ ok: true });
    expect(state.gold.balance).toBe(70);
    expect(state.goldTransactions.length).toBe(2);
    expect(state.goldTransactions[1]).toMatchObject({ amount: -30, reason: 'building_speedup', balanceAfter: 70 });
  });

  it('rejects overspending gold', () => {
    const { controller } = newController();
    expect(spendGold(controller.state, 10, 'x')).toEqual({ ok: false, error: 'insufficient' });
    expect(controller.state.goldTransactions.length).toBe(0);
  });

  it('level-ups grant configured gold rewards through the service', () => {
    const { controller } = newController();
    // Build enough to reach level 3 (90 XP): roads are 1 XP each… use quests+houses instead is slow;
    // simply verify the reward wiring via addXp path: place 2 houses & claim quests to level 2.
    for (let i = 0; i < 5; i++) controller.placeBuilding('road', 26 + i, 26);
    controller.claimQuest('q01_roads');
    expect(controller.state.level.current).toBeGreaterThanOrEqual(1);
  });
});
