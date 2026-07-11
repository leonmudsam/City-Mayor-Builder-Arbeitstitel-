import type { GameConfig } from '../config/index.ts';
import type { GameState } from '../types.ts';
import type { Derived } from '../simulation/derived.ts';

/**
 * Per-minute municipal income, split into the legible sources the UI shows
 * (§5). This is the single source of truth: the tick credits `total × dtMin`
 * and the UI renders the same breakdown, so "where the money comes from" always
 * matches what actually accrues.
 *
 * - residential: property/residence tax, per capita, scaled by happiness.
 * - commercial:  shop & market fees, scaled by staffing (filled jobs) + happiness.
 * - industrial:  production levies, scaled by staffing + happiness.
 */
export interface IncomeBreakdown {
  residential: number;
  commercial: number;
  industrial: number;
  total: number;
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

  const residential = pop * bal.taxPerCapitaPerMin * factor;
  const commercial = derived.revenueBase.commercial * employment * factor;
  const industrial = derived.revenueBase.industrial * employment * factor;
  return { residential, commercial, industrial, total: residential + commercial + industrial, employment };
}
