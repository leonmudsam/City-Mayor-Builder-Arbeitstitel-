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
  // Growth is quicker now so the bigger residential capacities (towers house
  // hundreds) fill in a believable time instead of trickling for hours (§6).
  growthPerMin: 10,
  declinePerMin: 5,
  growthHappinessThreshold: 60,
  declineHappinessThreshold: 40,
  foodWithoutDistributionCap: 0.3,
  startResources: { money: 45_000, wood: 60, stone: 0, food: 40, freshwater: 0 },
  startGold: 0,
  // Expansion is a genuine "special project" sink — and now a real brake on
  // sprawl (§7): each new sector costs more (distance) and every sector you own
  // raises the price of the next, so spreading out is a deliberate, expensive
  // choice and money stays valuable. Good, dense planning is rewarded over
  // grabbing land for free.
  sectorCost: { base: 120_000, distanceFactor: 1.7, countFactor: 0.35 },
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
  // Fern-Expansion (MVP 2): founding the river district is a genuine "special
  // project" — a big one-off cost that plants a district centre in the river
  // biome and opens a second, self-connected build area (§8).
  districtUnlockLevel: 12,
  districtFoundCost: { money: 300_000, wood: 150, stone: 250 },
  // Long-term progression (v0.15): from L4 up, buildings become real
  // investments. A building costing at least this much money reads as a
  // "Großprojekt" in the UI — it gets an investment framing and, when you can't
  // afford it, a helpful income hint instead of a bare "too little money". The
  // recommended net income shown is the money cost divided by the payback
  // window below (advisory only, no simulation effect).
  majorProjectMoneyThreshold: 300_000,
  majorProjectPaybackMinutes: 20,
};

// Feature flags: the test shop and gold system are wired in as the LAST
// MVP-1 step (§14/§19 of the concept) — off until then.
export const featuresConfig: FeaturesConfig = {
  goldSystem: false,
  testShop: false,
  debugTools: true,
  moveBuildings: false,
};
