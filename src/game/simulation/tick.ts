import type { GameConfig } from '../config/index.ts';
import type { GameState, NeedId, ResourceId } from '../types.ts';
import type { Derived } from './derived.ts';
import { recomputeDerived } from './derived.ts';
import { effectiveEffects, isContributing } from '../buildings/effects.ts';
import { buildingInfrastructureStatus, isInfrastructureOperational } from '../infrastructure/buildingInfrastructure.ts';
import { computeIncome } from '../economy/income.ts';
import { addXp } from '../progression/levels.ts';
import { updateQuests } from './quests.ts';
import { advanceOperations } from '../operations/operations.ts';
import { advanceTransfers } from '../operations/transport.ts';
import { advanceShippingRoutes } from '../infrastructure/shippingRoutes.ts';
import { advanceAutoLogistics } from '../operations/autoLogistics.ts';
import { nextRandom, newId } from '../engine/rng.ts';

export interface TickResult {
  derived: Derived;
  levelUps: number;
  structuralChange: boolean;
}

/**
 * Citizens moving in per minute given free housing and current happiness.
 * A flat floor (`growthPerMin`) keeps small towns filling; the dominant term
 * takes a share (`growthFillRatePerMin`) of the free housing, scaled by how far
 * happiness sits above the growth threshold (0.35× at the threshold, up to 1×
 * at 100 %). Shared by the tick and the UI growth diagnostic so the shown rate
 * matches what actually accrues.
 */
export function moveInPerMin(
  bal: { growthPerMin: number; growthFillRatePerMin: number; growthHappinessThreshold: number },
  freeHousing: number,
  happiness: number,
): number {
  const span = Math.max(1, 100 - bal.growthHappinessThreshold);
  const happinessFactor = Math.max(0, Math.min(1, (happiness - bal.growthHappinessThreshold) / span));
  return bal.growthPerMin + freeHousing * bal.growthFillRatePerMin * (0.35 + 0.65 * happinessFactor);
}

/**
 * Advances the simulation from state.meta.lastSimTime to `nowMs`.
 * The same code path handles the regular 1-second tick and offline catch-up:
 * long gaps are processed in bounded chunks (balancing.maxTickChunkSec) so
 * mid-interval effects (construction finishing) stay accurate.
 * Pure with respect to inputs — no I/O, no Date.now().
 *
 * @param live `true` only for real, foreground 1-second ticks while the tab is
 * visible. The whole economy — production, consumption, needs/happiness,
 * income, population flow, fires — runs only then: the game is not an idle
 * farm. With `live=false` (load catch-up, tab return, hidden tab) time still
 * passes for the things a mayor can reasonably leave running: construction and
 * upgrade timers (including their XP on completion), buff/event expiry, and
 * action cooldowns (those compare against wall-clock lastSimTime anyway).
 */
export function advance(state: GameState, config: GameConfig, derived: Derived, nowMs: number, live = false): TickResult {
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

    // 1. Buff & event expiry (wall-clock: a speech's 30 minutes are 30 real
    //    minutes whether the game is open or not).
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

    // 2–7. The live economy. Skipped entirely while the game is closed or the
    // tab is hidden — no production, no consumption, no income, no growth, no
    // fires. Playing actively is what earns (§ no AFK farming).
    if (live) {
      const eco = advanceLiveEconomy(state, config, derived, dtSec / 60, chunkEnd);
      derived = eco.derived;
      structuralChange = structuralChange || eco.structuralChange;
    }

    // 8. Construction completions — applied at chunk end (see boundary above).
    //    These DO run offline: build/upgrade timers are the one thing waiting
    //    is for, and their XP belongs to the build the player already paid for.
    let completed = false;
    for (const b of Object.values(state.buildings)) {
      if (b.status === 'constructing' && b.constructionEndsAt !== undefined && b.constructionEndsAt <= chunkEnd) {
        // Only now — at completion — does an in-progress upgrade become the live
        // stage (§2): copy the target into upgradeLevel and clear it, then flip
        // to active. Until this moment the old stage's effects stayed on.
        const wasUpgrade = b.targetUpgradeLevel !== undefined;
        if (b.targetUpgradeLevel !== undefined) {
          b.upgradeLevel = b.targetUpgradeLevel;
          delete b.targetUpgradeLevel;
        }
        b.status = 'active';
        delete b.constructionEndsAt;
        const def = config.buildings.get(b.defId);
        if (def) {
          const xp = wasUpgrade ? (def.upgrades?.[b.upgradeLevel - 1]?.xpReward ?? 0) : def.xpReward;
          levelUps += addXp(state, config, derived, xp);
          if (def.id === 'mayor_house') state.mayor.houseLevel = Math.max(state.mayor.houseLevel, 1);
          if (wasUpgrade) {
            state.stats.upgradesCompleted += 1;
            state.stats.upgraded[def.id] = (state.stats.upgraded[def.id] ?? 0) + 1;
          }
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

/**
 * Steps 2–7 of a chunk: production, needs/happiness, income, population flow,
 * fires and citizen feedback. Only ever called for live foreground time —
 * earning and growing require an open, visible game.
 */
function advanceLiveEconomy(
  state: GameState,
  config: GameConfig,
  derived: Derived,
  dtMin: number,
  chunkEnd: number,
): { derived: Derived; structuralChange: boolean } {
  let structuralChange = false;
  const bal = config.balancing;

  // 2. Production flows directly into city storage (no manual collecting).
  //    Storage caps make warehouses matter; full storage halts production —
  //    surplus only becomes money when actively sold via trade (§7).
  let productionBuff = 1;
  for (const buff of state.buffs) {
    if (buff.kind === 'production') productionBuff *= buff.amount;
  }
  for (const b of Object.values(state.buildings)) {
    // A building mid-upgrade keeps producing at its current stage (§2).
    if (!isContributing(b)) continue;
    const def = config.buildings.get(b.defId);
    if (!def) continue;
    if (!isInfrastructureOperational(buildingInfrastructureStatus(state, config, derived.roadNetwork, b))) continue;
    const bonus = (1 + (derived.productionBonus[b.id] ?? 0) / 100) * productionBuff;
    // § Active Operations 2.0: Ein Betrieb mit Operationsprofil (Sägewerk)
    // erzeugt seine Ressource NICHT passiv — sie entsteht über Arbeiter +
    // Ressourcenknoten und landet im lokalen Lager (advanceOperations unten).
    if (def.operation) continue;
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

  // 2b. Aktive Betriebe (§ Active Operations 2.0): Arbeiter fällen Bäume und
  //     lagern Holz ins lokale Betriebslager. Nur live, mit dem bereits
  //     zeitfaktor-skalierten dtMin — Pause/2×/4× wirken dadurch automatisch.
  advanceOperations(state, config, dtMin, chunkEnd);

  // 2c. Lagertransporte (§ Active Operations 2.0, A5): manuell erteilte Fahrten
  //     bringen lokal geerntete Ware ins Zentrallager (globaler Pool). Nur live,
  //     zeitfaktor-korrekt; `derived.storageCaps` deckelt die Einlagerung.
  // 2b2. Automatischer Warenfluss (§ Active Simplicity / AS-1, D-039): Betriebe
  //      beauftragen ihre Abholung selbst — der Spieler muss keinen Transport mehr
  //      planen. Erteilt nur Aufträge an denselben Lagertransport (kein zweites
  //      System) und läuft VOR dessen Schritt, damit eine neue Fahrt sofort anläuft.
  advanceAutoLogistics(state, config, derived);

  advanceTransfers(state, config, derived, dtMin);

  // 2d. Schiffsrouten (§ Infrastruktur 2.0, I4): persistente Anleger↔Anleger-Routen
  //     fahren zyklisch weiter und schließen die Lücke, an der der Landtransport
  //     mangels Straße über Wasser scheitert. Derselbe dtMin-Pfad → Pause/2×/4×
  //     wirken automatisch; `derived.storageCaps` deckelt die Einlagerung.
  advanceShippingRoutes(state, config, derived, dtMin);

  // 3. Needs & happiness.
  const pop = state.citizens.population;
  const activeNeeds = config.needs.filter((n) => n.unlockLevel <= state.level.current);
  // Expectation creep: citizens want more as the city levels up (§3). Combined
  // with per-building demand (bigger homes want more water) this keeps a
  // growing city working for its happiness instead of coasting at 100 %.
  const expectation = 1 + Math.max(0, state.level.current - 1) * bal.needExpectationPerLevel;
  // A manual distribution run (§ Stadtarbeit) temporarily delivers to homes no
  // market reaches — full effectiveness instead of the undistributed cap.
  const manualDistribution = state.buffs.some((buff) => buff.kind === 'foodDistribution');
  let weightSum = 0;
  let weighted = 0;
  for (const need of activeNeeds) {
    const ns = state.citizens.needs[need.id];
    const extra = derived.extraDemand[need.id];
    if (need.kind === 'capacity') {
      // Radius-based sources (wells) only serve housing they actually reach:
      // total capacity × covered-housing share. Both per-capita and
      // per-building demand grow with expectation (§3).
      ns.supply = derived.capacity[need.id];
      ns.demand = (pop * need.demandPerCapita + extra) * expectation;
      const base = ns.demand <= 0 ? 1 : Math.min(1, ns.supply / ns.demand);
      ns.fulfillment = ns.demand <= 0 ? 1 : base * derived.needCoverage[need.id];
    } else if (need.kind === 'coverage') {
      // Radius reaches a share of homes; a capacitated service (police,
      // hospital) additionally only serves so many residents, so a big city
      // that outgrows the served capacity gets only partial coverage even in
      // range (§ radius vs. capacity). Uncapped sources (parks) → radius only.
      const cov = derived.needCoverage[need.id];
      const servable = derived.coverageCapacity[need.id];
      const coveredPop = pop * cov;
      const capFactor = servable > 0 && coveredPop > 0 ? Math.min(1, servable / coveredPop) : 1;
      ns.supply = servable > 0 ? servable : pop;
      ns.demand = pop;
      ns.fulfillment = pop <= 0 ? 1 : cov * capFactor;
    } else {
      // consumption (food, drinking water …): eat/drink from the stored
      // product, fulfillment = supplied share. One generic path per resource.
      const resource = need.consumesResource ?? 'food';
      const required = (pop * need.demandPerCapita + extra) * expectation * dtMin;
      const available = Math.min(state.resources[resource], required);
      state.resources[resource] -= available;
      let fulfillment = required <= 0 ? 1 : available / required;
      // Only the housing share a distributor (market/supermarket) reaches gets
      // full delivery; the rest is capped (no logistics) — placement matters
      // (§8) — unless the mayor is out distributing by hand right now.
      const coverage = derived.distributionCoverage[need.id];
      const floor = manualDistribution ? 1 : bal.foodWithoutDistributionCap;
      const distCap = coverage + (1 - coverage) * floor;
      fulfillment = Math.min(fulfillment, distCap);
      ns.supply = state.resources[resource];
      ns.demand = (pop * need.demandPerCapita + extra) * expectation;
      ns.fulfillment = fulfillment;
    }
    weightSum += need.weight;
    weighted += need.weight * ns.fulfillment;
  }
  let happiness = pop <= 0 || weightSum <= 0 ? 75 : (100 * weighted) / weightSum;
  if (pop > 0) {
    // Zoning: residential quality shifts happiness. Nearby parks/decoration
    // lift it, nearby industry drags it down (§12 residential attractiveness).
    const cap = bal.ambienceHappinessCap;
    const ambienceDelta = derived.avgAmbience * bal.ambienceHappinessPerPoint;
    happiness += Math.max(-cap, Math.min(cap, ambienceDelta));
    // Tax policy: rates above neutral cost happiness, below neutral buy it
    // (§ tax sliders). Residents feel residential tax more than commercial.
    happiness -= (state.policy.residentialTaxRate - 1) * bal.residentialTaxHappinessPer;
    happiness -= (state.policy.commercialTaxRate - 1) * bal.commercialTaxHappinessPer;
  }
  for (const buff of state.buffs) {
    if (buff.kind === 'happiness') happiness += buff.amount;
  }
  state.citizens.happiness = Math.max(0, Math.min(100, happiness));

  // 4. Income net of running costs (§5 + money sink). Upkeep keeps large
  //    cities from drowning in tax; money is floored at 0 so a deficit drains
  //    the treasury but never goes negative.
  state.resources.money = Math.max(0, state.resources.money + computeIncome(state, config, derived).net * dtMin);
  // Material upkeep (rare; money is the default) drains its own stores.
  for (const res of ['wood', 'stone', 'food'] as const) {
    if (derived.upkeep[res] > 0) state.resources[res] = Math.max(0, state.resources[res] - derived.upkeep[res] * dtMin);
  }

  // 5. Population flow. Move-in scales with free housing (a big happy city
  //    fills fast, a village keeps a flat trickle) so a 45 000-cap metropolis
  //    at 99 % happiness actually populates instead of crawling (§ growth fix).
  const housingCap = derived.capacity.housing;
  const freeHousing = housingCap - pop;
  if (state.citizens.happiness >= bal.growthHappinessThreshold && freeHousing > 0) {
    const rate = moveInPerMin(bal, freeHousing, state.citizens.happiness);
    state.citizens.population = Math.min(housingCap, pop + rate * dtMin);
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

  return { derived, structuralChange };
}

const COMPLAINT_THROTTLE_MS = 10 * 60 * 1000;
const PRAISE_THROTTLE_MS = 30 * 60 * 1000;

function maybePushNeedComplaints(state: GameState, config: GameConfig, now: number): void {
  // Threshold scaled with the ×20 population (§9) so complaints still start once
  // a real neighbourhood exists, not at the very first family.
  if (state.citizens.population < 100) return;
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
