import type { BalancingConfig, FeaturesConfig } from './types.ts';

export const balancingConfig: BalancingConfig = {
  // Taxes are deliberately modest and strongly happiness-coupled: money should
  // reward a well-run city, not accumulate while idling (§ AFK reduction).
  taxPerCapitaPerMin: 0.3,
  taxFactorMin: 0.35,
  taxFactorMax: 1.5,
  growthPerMin: 2,
  declinePerMin: 1,
  growthHappinessThreshold: 60,
  declineHappinessThreshold: 40,
  foodWithoutDistributionCap: 0.3,
  startResources: { money: 500, wood: 60, stone: 0, food: 40 },
  startGold: 0,
  sectorCost: { base: 400, distanceFactor: 1.6, countFactor: 0.25 },
  fireChancePerBuildingPerMin: 0.002,
  fireDurationSec: 30 * 60,
  fireDurationProtectedSec: 5 * 60,
  fireUnlockLevel: 8,
  maxTickChunkSec: 60,
  speedupMinutesPerGold: 3,
  // Demolishing returns half of everything invested (build + upgrades). Tearing
  // down is a plannable refactor, not a punishment — but the 50 % haircut keeps
  // build/demolish loops from being free (§ economy balancing).
  demolishRefundFactor: 0.5,
};

// Feature flags: the test shop and gold system are wired in as the LAST
// MVP-1 step (§14/§19 of the concept) — off until then.
export const featuresConfig: FeaturesConfig = {
  goldSystem: false,
  testShop: false,
  debugTools: true,
};
