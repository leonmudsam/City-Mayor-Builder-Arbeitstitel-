import type { ActivitiesConfig, ActivityDef, ActivityRewardTier, TradeContractTemplate } from '../config/types.ts';
import type { GameState, ResourceId } from '../types.ts';
import { nextRandom } from '../engine/rng.ts';

// Pure Stadtarbeit logic (v0.21): target picking, reward-band resolution and
// the deterministic trade-contract rotation. No I/O, no Date.now() — the
// controller passes `now` (its lastSimTime) in.

/** The reward band for the player's level: highest matching minLevel wins. */
export function rewardTierFor(def: ActivityDef, level: number): ActivityRewardTier {
  let best: ActivityRewardTier | undefined = def.rewardTiers[0];
  for (const tier of def.rewardTiers) {
    if (tier.minLevel <= level && (best === undefined || tier.minLevel >= best.minLevel)) best = tier;
  }
  if (best === undefined) throw new Error(`activity ${def.id} has no reward tiers`);
  return best;
}

/**
 * Seeded shuffle-pick of activity targets. Uses the state RNG (commands may
 * mutate the seed), so target sets differ run to run but stay replayable.
 */
export function pickTargets(state: GameState, candidates: string[], min: number, max: number): string[] {
  const pool = [...candidates];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(state) * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  const span = Math.max(0, max - min);
  const count = Math.min(pool.length, min + Math.floor(nextRandom(state) * (span + 1)));
  return pool.slice(0, count);
}

/** A concrete offer in the current rotation window. */
export interface TradeContractOffer {
  /** Unique per template AND window, e.g. `wood_small@812345`. */
  id: string;
  template: TradeContractTemplate;
  /** When this rotation window ends and offers reroll. */
  expiresAt: number;
}

/**
 * The deterministic offers of the rotation window containing `now`. Same city,
 * same window → same offers, no matter how often the UI asks — and no state
 * mutation, so rendering can never reroll the market. Seeded per city via
 * meta.createdAt.
 */
export function currentTradeContracts(state: GameState, cfg: ActivitiesConfig, now: number): TradeContractOffer[] {
  const windowMs = cfg.tradeRotationSec * 1000;
  const window = Math.floor(now / windowMs);
  const eligible = cfg.tradeContracts.filter((t) => t.minLevel <= state.level.current);
  if (eligible.length === 0) return [];
  const rand = windowRandom((window ^ (state.meta.createdAt & 0x7fffffff)) | 1);
  const pool = [...eligible];
  const picked: TradeContractTemplate[] = [];
  const count = Math.min(cfg.tradeOffersPerRotation, pool.length);
  // Weighted sampling without replacement: rare mega contracts stay rare.
  for (let i = 0; i < count; i++) {
    const totalWeight = pool.reduce((sum, t) => sum + (t.weight ?? 1), 0);
    let roll = rand() * totalWeight;
    let index = 0;
    for (let j = 0; j < pool.length; j++) {
      roll -= pool[j]!.weight ?? 1;
      if (roll <= 0) {
        index = j;
        break;
      }
    }
    picked.push(pool[index]!);
    pool.splice(index, 1);
  }
  const expiresAt = (window + 1) * windowMs;
  return picked.map((template) => ({ id: `${template.id}@${window}`, template, expiresAt }));
}

/** Deterministic local PRNG (mulberry32) for rotation windows. */
function windowRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sum helper for UI: total demanded units of a contract. */
export function contractDemandList(template: TradeContractTemplate): { resource: ResourceId; amount: number }[] {
  return Object.entries(template.demands).map(([resource, amount]) => ({ resource: resource as ResourceId, amount: amount ?? 0 }));
}
