import type { GameState, ResourceId } from '../types.ts';
import { newId } from '../engine/rng.ts';

// The single choke point for every balance change (money, resources, gold).
// No other code may touch state.resources or state.gold directly — this is
// what makes server-side validation a drop-in replacement later (§14).

export type EconomyResult = { ok: true } | { ok: false; error: 'insufficient' };

export type Cost = Partial<Record<ResourceId, number>>;

export function canAfford(state: GameState, cost: Cost): boolean {
  return Object.entries(cost).every(([res, amount]) => state.resources[res as ResourceId] >= (amount ?? 0));
}

export function spendCost(state: GameState, cost: Cost, _reason: string): EconomyResult {
  if (!canAfford(state, cost)) return { ok: false, error: 'insufficient' };
  for (const [res, amount] of Object.entries(cost)) {
    state.resources[res as ResourceId] -= amount ?? 0;
  }
  return { ok: true };
}

/** Grant resources, respecting storage caps (money is uncapped). */
export function grantResources(state: GameState, grant: Cost, storageCaps: Record<ResourceId, number>, _reason: string): void {
  for (const [res, amount] of Object.entries(grant)) {
    const id = res as ResourceId;
    const cap = storageCaps[id] ?? Number.POSITIVE_INFINITY;
    state.resources[id] = Math.min(cap, state.resources[id] + (amount ?? 0));
  }
}

export function grantGold(state: GameState, amount: number, reason: string): void {
  if (amount <= 0) return;
  state.gold.balance += amount;
  state.goldTransactions.push({
    id: newId(state, 'tx'),
    timestamp: state.meta.lastSimTime,
    amount,
    reason,
    balanceAfter: state.gold.balance,
  });
}

export function spendGold(state: GameState, amount: number, reason: string): EconomyResult {
  if (state.gold.balance < amount) return { ok: false, error: 'insufficient' };
  state.gold.balance -= amount;
  state.goldTransactions.push({
    id: newId(state, 'tx'),
    timestamp: state.meta.lastSimTime,
    amount: -amount,
    reason,
    balanceAfter: state.gold.balance,
  });
  return { ok: true };
}
