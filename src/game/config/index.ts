import { z } from 'zod';
import { buildingsConfig } from './buildings.config.ts';
import { resourcesConfig } from './resources.config.ts';
import { needsConfig } from './needs.config.ts';
import { levelsConfig } from './levels.config.ts';
import { questsConfig } from './quests.config.ts';
import { mayorActionsConfig } from './mayorActions.config.ts';
import { balancingConfig, featuresConfig } from './balancing.config.ts';
import { biomesConfig } from './biomes.config.ts';
import { buildingDefSchema, levelDefSchema, mayorActionDefSchema, questDefSchema } from './schemas.ts';
import type { BuildingDef, LevelDef, MayorActionDef, NeedDef, QuestDef, ResourceDef } from './types.ts';
import type { BuildingDefId, QuestId } from '../types.ts';

export interface GameConfig {
  buildings: Map<BuildingDefId, BuildingDef>;
  buildingList: BuildingDef[];
  resources: ResourceDef[];
  needs: NeedDef[];
  levels: LevelDef[];
  quests: Map<QuestId, QuestDef>;
  questList: QuestDef[];
  mayorActions: MayorActionDef[];
  balancing: typeof balancingConfig;
  features: typeof featuresConfig;
  biomes: typeof biomesConfig;
}

/**
 * Validates all static config at startup and returns the typed config object
 * used everywhere in the simulation. Throws (fail fast) on broken data.
 */
export function loadConfig(): GameConfig {
  z.array(buildingDefSchema).parse(buildingsConfig);
  z.array(levelDefSchema).parse(levelsConfig);
  z.array(questDefSchema).parse(questsConfig);
  z.array(mayorActionDefSchema).parse(mayorActionsConfig);

  // Cross-reference checks: every unlock and quest target must exist.
  const buildingIds = new Set(buildingsConfig.map((b) => b.id));
  for (const lvl of levelsConfig) {
    for (const id of lvl.unlocks) {
      if (!buildingIds.has(id)) throw new Error(`levels.config: unknown building '${id}' in level ${lvl.level}`);
    }
  }
  const questIds = new Set(questsConfig.map((q) => q.id));
  for (const q of questsConfig) {
    if (q.nextQuestId && !questIds.has(q.nextQuestId)) throw new Error(`quests.config: unknown nextQuestId '${q.nextQuestId}'`);
    for (const o of q.objectives) {
      if (o.type === 'build' && !buildingIds.has(o.defId)) throw new Error(`quests.config: unknown building '${o.defId}' in ${q.id}`);
    }
  }

  return {
    buildings: new Map(buildingsConfig.map((b) => [b.id, b])),
    buildingList: buildingsConfig,
    resources: resourcesConfig,
    needs: needsConfig,
    levels: levelsConfig,
    quests: new Map(questsConfig.map((q) => [q.id, q])),
    questList: questsConfig,
    mayorActions: mayorActionsConfig,
    balancing: balancingConfig,
    features: featuresConfig,
    biomes: biomesConfig,
  };
}
