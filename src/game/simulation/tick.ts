import type { GameConfig } from '../config/index.ts';
import type { GameState, NeedId, ResourceId } from '../types.ts';
import type { Derived } from './derived.ts';
import { recomputeDerived } from './derived.ts';
import { effectiveEffects } from '../buildings/effects.ts';
import { addXp } from '../progression/levels.ts';
import { updateQuests } from './quests.ts';
import { nextRandom, newId } from '../engine/rng.ts';

export interface TickResult {
  derived: Derived;
  levelUps: number;
  structuralChange: boolean;
}

/**
 * Advances the simulation from state.meta.lastSimTime to `nowMs`.
 * The same code path handles the regular 1-second tick and offline catch-up:
 * long gaps are processed in bounded chunks (balancing.maxTickChunkSec) so
 * mid-interval effects (construction finishing, storage filling up) stay
 * reasonably accurate. Pure with respect to inputs — no I/O, no Date.now().
 */
export function advance(state: GameState, config: GameConfig, derived: Derived, nowMs: number): TickResult {
  let levelUps = 0;
  let structuralChange = false;
  const maxChunkMs = config.balancing.maxTickChunkSec * 1000;

  while (state.meta.lastSimTime < nowMs) {
    // Chunk boundaries align with construction completions so a building
    // never produces (or houses citizens) for time it spent under
    // construction — completions apply at the END of their chunk.
    let chunkEnd = Math.min(nowMs, state.meta.lastSimTime + maxChunkMs);
    for (const b of Object.values(state.buildings)) {
      if (b.status === 'constructing' && b.constructionEndsAt !== undefined &&
          b.constructionEndsAt > state.meta.lastSimTime && b.constructionEndsAt < chunkEnd) {
        chunkEnd = b.constructionEndsAt;
      }
    }
    const dtSec = (chunkEnd - state.meta.lastSimTime) / 1000;
    state.meta.lastSimTime = chunkEnd;
    state.meta.playTimeSec += dtSec;

    // 1. Buff & event expiry.
    state.buffs = state.buffs.filter((buff) => buff.endsAt > chunkEnd);
    for (const event of state.events) {
      if (event.endsAt <= chunkEnd) {
        const b = state.buildings[event.buildingId];
        if (b && b.status === 'paused') b.status = 'active';
        structuralChange = true;
      }
    }
    const expired = state.events.some((e) => e.endsAt <= chunkEnd);
    state.events = state.events.filter((e) => e.endsAt > chunkEnd);
    if (expired) derived = recomputeDerived(state, config);

    // 2. Production flows directly into city storage (no manual collecting).
    //    Storage caps make warehouses matter; full storage halts production.
    const dtMin = dtSec / 60;
    for (const b of Object.values(state.buildings)) {
      if (b.status !== 'active') continue;
      const def = config.buildings.get(b.defId);
      if (!def) continue;
      const bonus = 1 + (derived.productionBonus[b.id] ?? 0) / 100;
      for (const eff of effectiveEffects(def, b.upgradeLevel)) {
        if (eff.type !== 'produce') continue;
        // Production-chain hook: output scales with input availability.
        let efficiency = 1;
        if (eff.inputsPerMinute) {
          for (const [res, perMin] of Object.entries(eff.inputsPerMinute)) {
            const required = (perMin ?? 0) * dtMin;
            if (required > 0) efficiency = Math.min(efficiency, state.resources[res as ResourceId] / required);
          }
          efficiency = Math.max(0, Math.min(1, efficiency));
          for (const [res, perMin] of Object.entries(eff.inputsPerMinute)) {
            state.resources[res as ResourceId] -= (perMin ?? 0) * dtMin * efficiency;
          }
        }
        const produced = eff.perMinute * bonus * efficiency * dtMin;
        const cap = derived.storageCaps[eff.resource] ?? Number.POSITIVE_INFINITY;
        const stored = Math.min(produced, Math.max(0, cap - state.resources[eff.resource]));
        state.resources[eff.resource] += stored;
        state.stats.produced[eff.resource] = (state.stats.produced[eff.resource] ?? 0) + stored;
      }
    }

    // 3. Needs & happiness.
    const pop = state.citizens.population;
    const activeNeeds = config.needs.filter((n) => n.unlockLevel <= state.level.current);
    let weightSum = 0;
    let weighted = 0;
    for (const need of activeNeeds) {
      const ns = state.citizens.needs[need.id];
      if (need.kind === 'capacity') {
        // Radius-based sources (wells) only serve housing they actually reach:
        // total capacity × covered-housing share.
        ns.supply = derived.capacity[need.id];
        ns.demand = pop * need.demandPerCapita;
        const base = ns.demand <= 0 ? 1 : Math.min(1, ns.supply / ns.demand);
        ns.fulfillment = ns.demand <= 0 ? 1 : base * derived.needCoverage[need.id];
      } else if (need.kind === 'coverage') {
        ns.supply = derived.needCoverage[need.id];
        ns.demand = 1;
        ns.fulfillment = pop <= 0 ? 1 : derived.needCoverage[need.id];
      } else {
        // consumption (food): eat from storage, fulfillment = fed share.
        const required = pop * need.demandPerCapita * dtMin;
        const available = Math.min(state.resources.food, required);
        state.resources.food -= available;
        let fulfillment = required <= 0 ? 1 : available / required;
        if (!derived.hasFoodDistribution) {
          fulfillment = Math.min(fulfillment, config.balancing.foodWithoutDistributionCap);
        }
        ns.supply = state.resources.food;
        ns.demand = pop * need.demandPerCapita;
        ns.fulfillment = fulfillment;
      }
      weightSum += need.weight;
      weighted += need.weight * ns.fulfillment;
    }
    let happiness = pop <= 0 || weightSum <= 0 ? 75 : (100 * weighted) / weightSum;
    for (const buff of state.buffs) {
      if (buff.kind === 'happiness') happiness += buff.amount;
    }
    state.citizens.happiness = Math.max(0, Math.min(100, happiness));

    // 4. Taxes.
    const bal = config.balancing;
    const taxFactor = bal.taxFactorMin + (bal.taxFactorMax - bal.taxFactorMin) * (state.citizens.happiness / 100);
    let taxBuff = 1;
    for (const buff of state.buffs) {
      if (buff.kind === 'tax') taxBuff *= buff.amount;
    }
    state.resources.money += pop * bal.taxPerCapitaPerMin * taxFactor * taxBuff * dtMin;

    // 5. Population flow.
    const housingCap = derived.capacity.housing;
    if (state.citizens.happiness >= bal.growthHappinessThreshold && pop < housingCap) {
      state.citizens.population = Math.min(housingCap, pop + bal.growthPerMin * dtMin);
    } else if (state.citizens.happiness < bal.declineHappinessThreshold && pop > 0) {
      state.citizens.population = Math.max(0, pop - bal.declinePerMin * dtMin);
    }
    if (state.citizens.population > housingCap) {
      state.citizens.population = Math.max(housingCap, state.citizens.population - bal.declinePerMin * 3 * dtMin);
    }

    // 6. Fires (mild risk system from level 8 on).
    if (state.level.current >= bal.fireUnlockLevel) {
      for (const b of Object.values(state.buildings)) {
        if (b.status !== 'active') continue;
        const def = config.buildings.get(b.defId);
        if (!def || (def.category !== 'production' && def.category !== 'residential')) continue;
        if (nextRandom(state) < bal.fireChancePerBuildingPerMin * dtMin) {
          b.status = 'paused';
          const durationSec = derived.fireProtected.has(b.id) ? bal.fireDurationProtectedSec : bal.fireDurationSec;
          state.events.push({
            id: newId(state, 'ev'),
            type: 'fire',
            buildingId: b.id,
            startedAt: chunkEnd,
            endsAt: chunkEnd + durationSec * 1000,
          });
          state.mayor.messages.unshift({
            id: newId(state, 'msg'),
            textKey: 'message.fire',
            params: { building: def.nameKey },
            kind: 'complaint',
            createdAt: chunkEnd,
          });
          derived = recomputeDerived(state, config);
          structuralChange = true;
        }
      }
    }

    // 7. Citizen feedback messages (throttled).
    maybePushNeedComplaints(state, config, chunkEnd);

    // 8. Construction completions — applied at chunk end (see boundary above).
    let completed = false;
    for (const b of Object.values(state.buildings)) {
      if (b.status === 'constructing' && b.constructionEndsAt !== undefined && b.constructionEndsAt <= chunkEnd) {
        b.status = 'active';
        delete b.constructionEndsAt;
        const def = config.buildings.get(b.defId);
        if (def) {
          const xp = b.upgradeLevel > 0 ? (def.upgrades?.[b.upgradeLevel - 1]?.xpReward ?? 0) : def.xpReward;
          levelUps += addXp(state, config, derived, xp);
          if (def.id === 'mayor_house') state.mayor.houseLevel = Math.max(state.mayor.houseLevel, 1);
        }
        completed = true;
        structuralChange = true;
      }
    }
    if (completed) derived = recomputeDerived(state, config);
  }

  if (state.mayor.messages.length > 30) state.mayor.messages.length = 30;
  updateQuests(state, config);
  return { derived, levelUps, structuralChange };
}

const COMPLAINT_THROTTLE_MS = 10 * 60 * 1000;
const PRAISE_THROTTLE_MS = 30 * 60 * 1000;

function maybePushNeedComplaints(state: GameState, config: GameConfig, now: number): void {
  if (state.citizens.population < 5) return;
  for (const need of config.needs) {
    if (need.unlockLevel > state.level.current) continue;
    const ns = state.citizens.needs[need.id];
    if (ns.fulfillment >= 0.5) continue;
    const recent = state.mayor.messages.find(
      (m) => m.kind === 'complaint' && m.textKey === 'message.complaint' && m.params?.need === need.nameKey && now - m.createdAt < COMPLAINT_THROTTLE_MS,
    );
    if (!recent) {
      state.mayor.messages.unshift({
        id: newId(state, 'msg'),
        textKey: 'message.complaint',
        params: { need: need.nameKey },
        kind: 'complaint',
        createdAt: now,
      });
      state.mayor.reputation -= 1;
    }
  }
  if (state.citizens.happiness > 80) {
    const recent = state.mayor.messages.find((m) => m.kind === 'praise' && now - m.createdAt < PRAISE_THROTTLE_MS);
    if (!recent) {
      state.mayor.messages.unshift({
        id: newId(state, 'msg'),
        textKey: 'message.praise',
        kind: 'praise',
        createdAt: now,
      });
      state.mayor.reputation += 1;
    }
  }
}

export type { NeedId };
