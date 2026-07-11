import type { GameConfig } from '../config/index.ts';
import type { GameState } from '../types.ts';
import type { Derived } from '../simulation/derived.ts';

/**
 * Per-minute municipal income, split into the legible sources the UI shows
 * (§5). This is the single source of truth: the tick credits `net × dtMin`
 * and the UI renders the same breakdown, so "where the money comes from" always
 * matches what actually accrues.
 *
 * - residential: property/residence tax, per capita, scaled by happiness.
 * - commercial:  shop & market fees, scaled by staffing (filled jobs) + happiness.
 * - industrial:  production levies, scaled by staffing + happiness.
 * - upkeep:      running cost of active buildings; makes income *net* so big
 *                cities pay to operate rather than drown in tax (money sink).
 */
export interface IncomeBreakdown {
  residential: number;
  commercial: number;
  industrial: number;
  /** Gross income before running costs (residential + commercial + industrial). */
  total: number;
  /** Money running cost per minute across active buildings. */
  upkeep: number;
  /** What actually accrues per minute: total − upkeep (may be negative). */
  net: number;
  /** 0..1 share of jobs the labor force fills (drives commercial/industrial). */
  employment: number;
}

export function computeIncome(state: GameState, config: GameConfig, derived: Derived): IncomeBreakdown {
  const bal = config.balancing;
  const pop = state.citizens.population;
  const taxFactor = bal.taxFactorMin + (bal.taxFactorMax - bal.taxFactorMin) * (state.citizens.happiness / 100);
  let taxBuff = 1;
  for (const buff of state.buffs) if (buff.kind === 'tax') taxBuff *= buff.amount;
  const factor = taxFactor * taxBuff;

  const jobs = derived.capacity.work;
  const laborForce = pop * bal.laborParticipation;
  const employment = jobs > 0 ? Math.max(0, Math.min(1, laborForce / jobs)) : 0;

  // Mayor tax policy scales each source; the happiness cost of a high rate is
  // applied in the tick (so it feeds back into `factor` next tick).
  const resRate = state.policy.residentialTaxRate;
  const busRate = state.policy.commercialTaxRate;
  const residential = pop * bal.taxPerCapitaPerMin * factor * resRate;
  const commercial = derived.revenueBase.commercial * employment * factor * busRate;
  const industrial = derived.revenueBase.industrial * employment * factor * busRate;
  const total = residential + commercial + industrial;
  const upkeep = derived.upkeep.money;
  return { residential, commercial, industrial, total, upkeep, net: total - upkeep, employment };
}
