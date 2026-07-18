import { z } from 'zod';
import { buildingsConfig } from './buildings.config.ts';
import { resourcesConfig } from './resources.config.ts';
import { needsConfig } from './needs.config.ts';
import { levelsConfig } from './levels.config.ts';
import { questsConfig } from './quests.config.ts';
import { mayorActionsConfig } from './mayorActions.config.ts';
import { activitiesConfig } from './activities.config.ts';
import { balancingConfig, featuresConfig } from './balancing.config.ts';
import { biomesConfig } from './biomes.config.ts';
import { regionsConfig } from './regions.config.ts';
import { BAKED_REGIONS, startRegionConfig } from './startRegion.config.ts';
import { activitiesConfigSchema, buildingDefSchema, levelDefSchema, mayorActionDefSchema, questDefSchema, regionDefSchema } from './schemas.ts';
import type { ActivitiesConfig, BuildingDef, LevelDef, MayorActionDef, NeedDef, QuestDef, RegionDef, ResourceDef } from './types.ts';
import type { BuildingDefId, QuestId, RegionId } from '../types.ts';

export interface GameConfig {
  buildings: Map<BuildingDefId, BuildingDef>;
  buildingList: BuildingDef[];
  resources: ResourceDef[];
  needs: NeedDef[];
  levels: LevelDef[];
  quests: Map<QuestId, QuestDef>;
  questList: QuestDef[];
  mayorActions: MayorActionDef[];
  activities: ActivitiesConfig;
  balancing: typeof balancingConfig;
  features: typeof featuresConfig;
  biomes: typeof biomesConfig;
  /** Die organischen Landschaften (§ Welt 2.0), Key = numerische RegionId. */
  regions: Map<RegionId, RegionDef>;
  regionList: RegionDef[];
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
  activitiesConfigSchema.parse(activitiesConfig);
  z.array(regionDefSchema).parse(regionsConfig);

  // Region-Querbezüge (§ Welt 2.0): Config-Ids ≡ gebackene Ids, Voraussetzungen
  // existieren und sind eine Teilmenge der gebackenen Nachbarschaft, die
  // Startregion ist ab Level 1 frei.
  const regionIds = new Set(regionsConfig.map((r) => r.id));
  if (regionIds.size !== regionsConfig.length) throw new Error('regions.config: doppelte Region-Ids');
  if (regionsConfig.length !== BAKED_REGIONS.length) {
    throw new Error(`regions.config: erwarte ${BAKED_REGIONS.length} Regionen (Bake), habe ${regionsConfig.length}`);
  }
  for (const baked of BAKED_REGIONS) {
    if (!regionIds.has(baked.id)) throw new Error(`regions.config: gebackene Region ${baked.id} fehlt`);
  }
  for (const r of regionsConfig) {
    const baked = BAKED_REGIONS[r.id - 1];
    if (!baked) throw new Error(`regions.config: Region ${r.id} existiert nicht im Bake`);
    for (const p of r.prerequisiteRegionIds ?? []) {
      if (!regionIds.has(p)) throw new Error(`regions.config: unbekannte Voraussetzung ${p} in Region ${r.id}`);
      if (!(baked.adjacent as readonly number[]).includes(p)) {
        throw new Error(`regions.config: Voraussetzung ${p} ist kein Bake-Nachbar von Region ${r.id}`);
      }
    }
  }
  const startDef = regionsConfig.find((r) => r.id === startRegionConfig.startRegionId);
  if (!startDef || !startDef.unlockable || startDef.unlockLevel !== 1 || startDef.unlockCost !== 0) {
    throw new Error('regions.config: Startregion muss unlockable, Level 1 und kostenlos sein');
  }

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
    activities: activitiesConfig,
    // Fresh copies so a controller/test can override a value without leaking
    // into the shared singleton (e.g. tests toggling features.moveBuildings).
    balancing: { ...balancingConfig },
    features: { ...featuresConfig },
    biomes: biomesConfig,
    regions: new Map(regionsConfig.map((r) => [r.id, r])),
    regionList: regionsConfig,
  };
}
