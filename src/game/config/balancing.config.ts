import type { BalancingConfig, FeaturesConfig } from './types.ts';

export const balancingConfig: BalancingConfig = {
  // Income runs on a believable municipal scale (§4/§5). Residential tax is
  // deliberately modest so raw population no longer prints money on its own; the
  // upside comes from commercial & industrial revenue, which scale with *filled*
  // jobs (offices, shops, industry). A balanced, employed city earns far more
  // than a wall of houses — money rewards good zoning, not AFK growth. Real
  // pacing still comes from materials, build limits, supply radii and space.
  taxPerCapitaPerMin: 40,
  taxFactorMin: 0.4,
  taxFactorMax: 1.5,
  // Half the population works; commercial/industrial income scales with how
  // many jobs that labor force actually fills.
  laborParticipation: 0.5,
  growthPerMin: 4,
  declinePerMin: 2,
  growthHappinessThreshold: 60,
  declineHappinessThreshold: 40,
  foodWithoutDistributionCap: 0.3,
  startResources: { money: 45_000, wood: 60, stone: 0, food: 40 },
  startGold: 0,
  // Expansion is a genuine "special project" sink now, not a rounding error.
  sectorCost: { base: 80_000, distanceFactor: 1.6, countFactor: 0.25 },
  fireChancePerBuildingPerMin: 0.002,
  fireDurationSec: 30 * 60,
  fireDurationProtectedSec: 5 * 60,
  fireUnlockLevel: 8,
  maxTickChunkSec: 60,
  speedupMinutesPerGold: 3,
  // Since buildings can no longer be moved (§5), demolition is the redesign
  // tool — but it now returns only a quarter of the invested material, so
  // misplacement has a real (small) cost. Tunable here.
  demolishRefundFactor: 0.25,
  // Zoning: living next to parks/decoration/the town hall lifts happiness,
  // living next to industry (sawmill, quarry, farm) lowers it. Makes separating
  // residential and industrial areas — and greening neighborhoods — a real
  // planning decision (§9/§11/§12). Cap widened so green space matters more.
  ambienceHappinessPerPoint: 3,
  ambienceHappinessCap: 20,
  // Expectation creep: at level 10 citizens demand ~1.36× the basics of level 1.
  // A growing city must keep investing in supply, so happiness rarely sticks at
  // 100 % — a well-run city lands around 70–90 % (§3).
  needExpectationPerLevel: 0.04,
  // Tax sliders (MVP 2): the mayor can dial each rate within ±50 % of neutral.
  // Residents feel residential tax strongly; the commercial rate bites softer
  // (it reads as "business climate"), so pushing it up is the gentler lever.
  taxRateMin: 0.5,
  taxRateMax: 1.5,
  residentialTaxHappinessPer: 24,
  commercialTaxHappinessPer: 10,
};

// Feature flags: the test shop and gold system are wired in as the LAST
// MVP-1 step (§14/§19 of the concept) — off until then.
export const featuresConfig: FeaturesConfig = {
  goldSystem: false,
  testShop: false,
  debugTools: true,
  moveBuildings: false,
};
