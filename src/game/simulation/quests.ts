import type { GameConfig } from '../config/index.ts';
import type { QuestDef, QuestObjective } from '../config/types.ts';
import type { GameState } from '../types.ts';

function objectiveProgress(state: GameState, obj: QuestObjective): number {
  switch (obj.type) {
    case 'build':
      return Math.min(obj.count, state.stats.built[obj.defId] ?? 0);
    case 'population':
      return Math.min(obj.amount, Math.floor(state.citizens.population));
    case 'resource':
      return Math.min(obj.amount, Math.floor(state.resources[obj.resource]));
    case 'collect':
      return Math.min(obj.amount, Math.floor(state.stats.collected[obj.resource] ?? 0));
    case 'level':
      return Math.min(obj.level, state.level.current);
    case 'sectors':
      return Math.min(obj.count, state.stats.sectorsUnlocked);
    case 'mayorAction':
      return Math.min(obj.count, state.stats.mayorActions[obj.actionId] ?? 0);
    case 'happiness':
      return Math.min(obj.amount, Math.floor(state.citizens.happiness));
  }
}

export function objectiveTarget(obj: QuestObjective): number {
  switch (obj.type) {
    case 'build':
      return obj.count;
    case 'population':
    case 'happiness':
    case 'resource':
    case 'collect':
      return obj.amount;
    case 'level':
      return obj.level;
    case 'sectors':
      return obj.count;
    case 'mayorAction':
      return obj.count;
  }
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
