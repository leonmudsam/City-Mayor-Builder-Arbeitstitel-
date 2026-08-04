import type { BalancingConfig, FeaturesConfig } from './types.ts';

export const balancingConfig: BalancingConfig = {
  // Income runs on a believable municipal scale (§4/§5). Residential tax is
  // deliberately modest so raw population no longer prints money on its own; the
  // upside comes from commercial & industrial revenue, which scale with *filled*
  // jobs (offices, shops, industry). A balanced, employed city earns far more
  // than a wall of houses — money rewards good zoning, not AFK growth. Real
  // pacing still comes from materials, build limits, supply radii and space.
  // Realistic city scale (§9): homes hold 20× their stated households, so a
  // built-up Level-11 city reaches ~80–120k residents instead of ~5k. Every
  // per-capita coefficient below is divided by 20 to keep the economy identical
  // at the larger head count; growth rates and coverage capacities are ×20.
  populationScale: 20,
  taxPerCapitaPerMin: 2,
  taxFactorMin: 0.4,
  taxFactorMax: 1.5,
  // Half the population works; commercial/industrial income scales with how
  // many jobs that labor force actually fills. Divided by the population scale
  // so the absolute labor force (and thus employment) is unchanged.
  laborParticipation: 0.025,
  // Move-in now scales with the city (§ believable growth). `growthPerMin` is
  // just the flat floor for tiny villages; `growthFillRatePerMin` fills a share
  // of the *free* housing every minute, so a happy metropolis with tens of
  // thousands of empty flats actually populates instead of crawling at a flat
  // trickle. At 6 %/min a 45 000-cap city that is 99 % happy adds ~2 700 in the
  // first minute and approaches full occupancy within ~20–30 simulated minutes.
  // Scaled ×20 with the population so the flat move-in floor and shedding rate
  // stay proportional; growthFillRatePerMin is a fraction of (now ×20) free
  // housing, so it scales on its own.
  growthPerMin: 240,
  growthFillRatePerMin: 0.06,
  declinePerMin: 100,
  growthHappinessThreshold: 60,
  declineHappinessThreshold: 40,
  foodWithoutDistributionCap: 0.3,
  // Bretter/Werkstein starten bei 0 und haben das auch zu tun: Sie sind das
  // Ergebnis einer Kette, die der Spieler ab Level 5 selbst baut (§3/§4).
  startResources: { money: 45_000, wood: 60, stone: 0, food: 40, freshwater: 0, planks: 0, cut_stone: 0 },
  startGold: 0,
  // Expansion (§ Welt 2.0): Freischaltkosten stehen explizit pro Region in
  // regions.config.ts — keine Distanz-Formel mehr.
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
  // Tax sliders (§9): the mayor can dial each rate from 50 % up to a punishing
  // 500 %. Above neutral earns more per head but citizens feel it — residents
  // strongly, business softer ("business climate"). At 300–500 % the happiness
  // hit is so large (residential −48 … −96) that zuzug collapses and the city
  // sheds people, so a sky-high rate is a deliberate trade-off, never free money.
  taxRateMin: 0.5,
  taxRateMax: 5,
  residentialTaxHappinessPer: 24,
  commercialTaxHappinessPer: 10,
  // Active resource economy (§7). Money per unit sold at the trading post:
  // scarcer inputs are worth more (stone hardest to produce). Raised sharply in
  // v0.21 because selling is now the ONLY way surplus becomes money — the
  // passive overflow export is gone, trade is a deliberate player action.
  exportRates: { wood: 10, stone: 20, food: 5, freshwater: 3 },
  // Each trading-post stage lifts the manual sell price by 25 % of the base rate.
  tradeSellBonusPerLevel: 0.25,
  // Buying costs 4× the base rate — far above any sell price, so trade can never
  // be arbitraged and production stays the real source of resources.
  tradeBuyMarkup: 4,
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
