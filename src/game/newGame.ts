import type { GameConfig } from './config/index.ts';
import { startRegionConfig } from './config/startRegion.config.ts';
import type { GameState } from './types.ts';
import { allRegionIds, createRegionStub, occupyTiles } from './map/world.ts';

/**
 * v11 (§ Gebäudesystem 2.0 + Welt 2.0): organische Regionen ersetzen die 36
 * Quadrat-Sektoren, Gebäude haben neue Footprints/Größenklassen. v10-Saves
 * werden migriert (Regionen übertragen, nicht mehr passende Gebäude zu 100 %
 * erstattet — docs/SAVE_MIGRATION.md). Saves ≤ v9: Backup + Neustart (alte
 * Geografie, sanktionierte Ausnahme von CLAUDE.md §3).
 */
export const SCHEMA_VERSION = 11;

export function createNewGame(config: GameConfig, cityName: string, now: number): GameState {
  const state: GameState = {
    schemaVersion: SCHEMA_VERSION,
    meta: { cityName, createdAt: now, lastSimTime: now, playTimeSec: 0 },
    rngSeed: (now % 2147483647) | 1,
    level: { current: 1, xp: 0 },
    resources: { ...config.balancing.startResources },
    gold: { balance: config.balancing.startGold },
    goldTransactions: [],
    policy: { residentialTaxRate: 1, commercialTaxRate: 1 },
    world: { regions: {}, districts: {} },
    buildings: {},
    citizens: {
      population: 0,
      happiness: 75,
      needs: {
        housing: { supply: 0, demand: 0, fulfillment: 1 },
        water: { supply: 0, demand: 0, fulfillment: 1 },
        food: { supply: 0, demand: 0, fulfillment: 1 },
        work: { supply: 0, demand: 0, fulfillment: 1 },
        leisure: { supply: 0, demand: 0, fulfillment: 1 },
        energy: { supply: 0, demand: 0, fulfillment: 1 },
        safety: { supply: 0, demand: 0, fulfillment: 1 },
        health: { supply: 0, demand: 0, fulfillment: 1 },
        freshwater: { supply: 0, demand: 0, fulfillment: 1 },
      },
    },
    mayor: { houseLevel: 0, reputation: 50, actionCooldowns: {}, messages: [] },
    quests: { completed: [], active: [] },
    buffs: [],
    events: [],
    activities: { cooldowns: {}, fulfilledContracts: [] },
    stats: {
      built: {},
      produced: { money: 0, wood: 0, stone: 0, food: 0, freshwater: 0 },
      mayorActions: {},
      // Counts only regions the player actively unlocks — the start region is
      // free and does not count towards expansion quests (§5).
      regionsUnlocked: 0,
      upgradesCompleted: 0,
      upgraded: {},
      tradeEarnings: 0,
      activitiesCompleted: 0,
    },
    nextId: 0,
  };

  // Alle organischen Regionen als Stubs anlegen (§ Welt 2.0 / Slim-Save):
  // sichtbar ab der ersten Minute (gesperrt/vernebelt), Geometrie und Terrain
  // kommen live aus dem Insel-Bake. Nur die vom Bake gewählte Startregion ist frei.
  for (const id of allRegionIds()) {
    const stub = createRegionStub(id);
    state.world.regions[String(id)] = stub;
  }
  const startRegion = state.world.regions[String(startRegionConfig.startRegionId)];
  if (startRegion) startRegion.status = 'unlocked';

  // Pre-place the town hall (district center of 'main'). Der Bake garantiert
  // einen flachen 7×7-Gras-Block für das 5×5-Rathaus — kein Terrain-Überschreiben nötig.
  const th = startRegionConfig.townHall;
  const townHallDef = config.buildings.get('town_hall');
  if (!townHallDef) throw new Error('config: town_hall missing');
  const townHallId = 'b_townhall';
  state.buildings[townHallId] = {
    id: townHallId,
    defId: 'town_hall',
    x: th.x,
    y: th.y,
    upgradeLevel: 0,
    status: 'active',
  };
  occupyTiles(state, th.x, th.y, townHallDef.size.w, townHallDef.size.h, townHallId);
  state.world.districts['main'] = { id: 'main', nameKey: 'district.main', centerBuildingId: townHallId };

  // Pre-place tutorial roads (Kacheln laut Bake garantiert Gras).
  let roadIndex = 0;
  for (const pos of startRegionConfig.startRoads) {
    const roadId = `b_startroad_${roadIndex++}`;
    state.buildings[roadId] = { id: roadId, defId: 'road', x: pos.x, y: pos.y, upgradeLevel: 0, status: 'active' };
    occupyTiles(state, pos.x, pos.y, 1, 1, roadId);
  }
  return state;
}
