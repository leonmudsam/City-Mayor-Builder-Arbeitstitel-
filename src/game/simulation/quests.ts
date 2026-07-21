import type { GameConfig } from '../config/index.ts';
import type { QuestDef, QuestObjective } from '../config/types.ts';
import type { GameState } from '../types.ts';
import { BAKED_REGIONS, regionIdAt, startRegionConfig } from '../config/startRegion.config.ts';

function objectiveProgress(state: GameState, obj: QuestObjective): number {
  switch (obj.type) {
    case 'build':
      return Math.min(obj.count, state.stats.built[obj.defId] ?? 0);
    case 'population':
      return Math.min(obj.amount, Math.floor(state.citizens.population));
    case 'resource':
      return Math.min(obj.amount, Math.floor(state.resources[obj.resource]));
    case 'produce':
      return Math.min(obj.amount, Math.floor(state.stats.produced[obj.resource] ?? 0));
    case 'level':
      return Math.min(obj.level, state.level.current);
    case 'regions':
      return Math.min(obj.count, state.stats.regionsUnlocked);
    case 'mayorAction':
      return Math.min(obj.count, state.stats.mayorActions[obj.actionId] ?? 0);
    case 'happiness':
      return Math.min(obj.amount, Math.floor(state.citizens.happiness));
    case 'upgrade':
      return Math.min(obj.count, obj.defId ? state.stats.upgraded[obj.defId] ?? 0 : state.stats.upgradesCompleted);
    case 'activity':
      return Math.min(obj.count, state.stats.activitiesCompleted);
    case 'tradeEarnings':
      return Math.min(obj.amount, Math.floor(state.stats.tradeEarnings));
  }
}

export function objectiveTarget(obj: QuestObjective): number {
  switch (obj.type) {
    case 'build':
      return obj.count;
    case 'population':
    case 'happiness':
    case 'resource':
    case 'produce':
      return obj.amount;
    case 'level':
      return obj.level;
    case 'regions':
      return obj.count;
    case 'mayorAction':
      return obj.count;
    case 'upgrade':
    case 'activity':
      return obj.count;
    case 'tradeEarnings':
      return obj.amount;
  }
}

/** Kartenfokus eines Bürgeranliegens (§ Overhaul 3.0 / C3). */
export interface QuestFocus {
  x: number;
  y: number;
  regionId: number;
}

/** Schwerpunkt der Stadt (Nicht-Straßen/-Deko-Gebäude), sonst Rathaus. Rein. */
function cityCenter(state: GameState, config: GameConfig): { x: number; y: number } {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const b of Object.values(state.buildings)) {
    const d = config.buildings.get(b.defId);
    if (!d || d.category === 'roads' || d.category === 'decoration') continue;
    sx += b.x + d.size.w / 2;
    sy += b.y + d.size.h / 2;
    n += 1;
  }
  if (n > 0) return { x: sx / n, y: sy / n };
  const th = startRegionConfig.townHall;
  return { x: th.x + 2.5, y: th.y + 2.5 };
}

/**
 * Reine, DETERMINISTISCHE Kartenprojektion eines Anliegens (§ C3): der sinnvollste
 * Fokuspunkt, damit „Auf Karte zeigen" ohne erfundene Daten wirken kann. Priorität:
 * (1) ein echtes Gebäude eines gebäudebezogenen Ziels (upgrade/build),
 * (2) bei Regions-Zielen die nächste gesperrte, freischaltbare Region (Zentroid),
 * (3) sonst das Stadtzentrum. Kein Save, kein RNG. `undefined` nur bei unbekannter Quest.
 */
export function questFocus(state: GameState, config: GameConfig, questId: string): QuestFocus | undefined {
  const def = config.quests.get(questId);
  if (!def) return undefined;
  const buildings = Object.values(state.buildings);
  const withRegion = (p: { x: number; y: number }): QuestFocus => ({
    x: p.x,
    y: p.y,
    regionId: regionIdAt(Math.floor(p.x), Math.floor(p.y)),
  });
  const centerOf = (b: { x: number; y: number; defId: string }): { x: number; y: number } => {
    const d = config.buildings.get(b.defId);
    return { x: b.x + (d?.size.w ?? 1) / 2, y: b.y + (d?.size.h ?? 1) / 2 };
  };

  // 1) Gebäudebezogenes Ziel → passendes echtes Gebäude (stabil nach Id).
  for (const obj of def.objectives) {
    if ((obj.type === 'upgrade' || obj.type === 'build') && obj.defId) {
      const match = buildings
        .filter((b) => b.defId === obj.defId)
        .sort((a, b) => a.id.localeCompare(b.id))[0];
      if (match) return withRegion(centerOf(match));
    }
  }

  // 2) Regions-Ziel → nächste gesperrte, freischaltbare Region.
  if (def.objectives.some((o) => o.type === 'regions')) {
    const city = cityCenter(state, config);
    let best: QuestFocus | undefined;
    let bestD = Infinity;
    for (const r of Object.values(state.world.regions)) {
      if (r.status !== 'locked' || !config.regions.get(r.id)?.unlockable) continue;
      const c = BAKED_REGIONS[r.id - 1]?.centroid;
      if (!c) continue;
      const d = (c.x - city.x) ** 2 + (c.y - city.y) ** 2;
      // Gleichstand stabil nach Region-Id auflösen (kein RNG).
      if (d < bestD || (d === bestD && (best === undefined || r.id < best.regionId))) {
        bestD = d;
        best = { x: c.x, y: c.y, regionId: r.id };
      }
    }
    if (best) return best;
  }

  // 3) Fallback: Stadtzentrum.
  return withRegion(cityCenter(state, config));
}

function predecessorMap(config: GameConfig): Map<string, string> {
  const map = new Map<string, string>();
  for (const q of config.questList) {
    if (q.nextQuestId) map.set(q.nextQuestId, q.id);
  }
  return map;
}

/** Activates newly available quests and refreshes progress/claimable flags. */
export function updateQuests(state: GameState, config: GameConfig): void {
  const predecessors = predecessorMap(config);
  const completed = new Set(state.quests.completed);
  const activeIds = new Set(state.quests.active.map((a) => a.questId));

  for (const quest of config.questList) {
    if (completed.has(quest.id) || activeIds.has(quest.id)) continue;
    if (quest.unlockLevel > state.level.current) continue;
    const pred = predecessors.get(quest.id);
    if (pred && !completed.has(pred)) continue;
    state.quests.active.push({ questId: quest.id, progress: quest.objectives.map(() => 0), claimable: false });
    activeIds.add(quest.id);
  }

  for (const active of state.quests.active) {
    const quest = config.quests.get(active.questId);
    if (!quest) continue;
    active.progress = quest.objectives.map((obj) => objectiveProgress(state, obj));
    active.claimable = quest.objectives.every((obj, i) => (active.progress[i] ?? 0) >= objectiveTarget(obj));
  }
}

export function getQuestDef(config: GameConfig, questId: string): QuestDef | undefined {
  return config.quests.get(questId);
}
