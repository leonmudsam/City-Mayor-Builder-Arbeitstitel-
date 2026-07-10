import type { BalancingConfig, FeaturesConfig } from './types.ts';

export const balancingConfig: BalancingConfig = {
  taxPerCapitaPerMin: 0.5,
  taxFactorMin: 0.5,
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
};

// Feature flags: the test shop and gold system are wired in as the LAST
// MVP-1 step (§14/§19 of the concept) — off until then.
export const featuresConfig: FeaturesConfig = {
  goldSystem: false,
  testShop: false,
  debugTools: true,
};
