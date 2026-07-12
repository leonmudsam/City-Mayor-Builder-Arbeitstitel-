import type { GameConfig } from './config/index.ts';
import { startRegionConfig } from './config/startRegion.config.ts';
import type { GameState } from './types.ts';
import { sectorId } from './types.ts';
import { materializeSector, tileAt } from './map/world.ts';

export const SCHEMA_VERSION = 7;

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
    world: { sectors: {}, districts: {} },
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
    stats: { built: {}, produced: { money: 0, wood: 0, stone: 0, food: 0, freshwater: 0 }, mayorActions: {}, sectorsUnlocked: 1 },
    nextId: 0,
  };

  // Materialize the hand-designed start region (§8).
  const { minSx, minSy, maxSx, maxSy } = startRegionConfig.sectors;
  for (let sy = minSy; sy <= maxSy; sy++) {
    for (let sx = minSx; sx <= maxSx; sx++) {
      materializeSector(state, sx, sy);
    }
  }
  const start = startRegionConfig.startSector;
  const startSector = state.world.sectors[sectorId(start.sx, start.sy)];
  if (startSector) startSector.status = 'unlocked';

  // Pre-place the town hall (district center of 'main').
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
  for (let dy = 0; dy < townHallDef.size.h; dy++) {
    for (let dx = 0; dx < townHallDef.size.w; dx++) {
      const tile = tileAt(state, th.x + dx, th.y + dy);
      if (tile) {
        tile.terrain = 'grass';
        tile.buildingId = townHallId;
      }
    }
  }
  state.world.districts['main'] = { id: 'main', nameKey: 'district.main', centerBuildingId: townHallId };

  // Pre-place tutorial roads.
  let roadIndex = 0;
  for (const pos of startRegionConfig.startRoads) {
    const roadId = `b_startroad_${roadIndex++}`;
    state.buildings[roadId] = { id: roadId, defId: 'road', x: pos.x, y: pos.y, upgradeLevel: 0, status: 'active' };
    const tile = tileAt(state, pos.x, pos.y);
    if (tile) {
      tile.terrain = 'grass';
      tile.buildingId = roadId;
    }
  }
  return state;
}
