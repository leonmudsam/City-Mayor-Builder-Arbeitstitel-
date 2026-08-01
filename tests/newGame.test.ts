import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, START_REGION, T0, TOWN_HALL, townHallOf } from './helpers.ts';
import { regionHasTerrain } from '../src/game/map/world.ts';
import { REGION_COUNT, regionIdAt, startRegionConfig } from '../src/game/config/startRegion.config.ts';

describe('new game (Insel-Welt v11, organische Regionen)', () => {
  it('creates all region stubs with one unlocked start region', () => {
    const { controller } = newController();
    const regions = Object.values(controller.state.world.regions);
    // Alle gebackenen Landschaften sichtbar (§ Welt 2.0), nur der Bake-Start frei.
    expect(regions.length).toBe(REGION_COUNT);
    expect(regions.filter((r) => r.status === 'unlocked').length).toBe(1);
    expect(controller.state.world.regions[String(START_REGION)]?.status).toBe('unlocked');
    // Der Ozean ist KEINE Region (Id 0) — die Weltecke gehört niemandem.
    expect(regionIdAt(0, 0)).toBe(0);
    // Seenlandschaften existieren als Regionen mit Wasser-Kacheln (Bake-Statistik).
    const lakeRegion = Object.values(controller.state.world.regions).find((r) => regionHasTerrain(r.id, 'water'));
    expect(lakeRegion).toBeDefined();
  });

  // § Welt-Feinschliff 12.2 (Nutzerwunsch): Das Rathaus wird NICHT mehr
  // vorplatziert — der Spieler wählt den Gründungsplatz selbst.
  it('starts unfounded: no town hall, no district, no roads', () => {
    const { controller } = newController(T0, { found: false });
    expect(controller.isCityFounded()).toBe(false);
    expect(Object.keys(controller.state.buildings)).toHaveLength(0);
    expect(controller.state.world.districts['main']).toBeUndefined();
    expect(controller.derived.roadNetwork.size).toBe(0);
  });

  it('founds the city where the player chooses and lays the tutorial axes there', () => {
    const { controller } = newController(T0, { found: false });
    // Bewusst NICHT der Bake-Vorschlag: die Wahl ist frei.
    const spot = nearTownHall(6, -4);
    expect(controller.foundCity(spot.x, spot.y)).toEqual({ ok: true });
    const townHall = townHallOf(controller);
    expect(townHall).toMatchObject({ x: spot.x, y: spot.y });
    expect(controller.state.buildings[townHall.id]?.status).toBe('active');
    expect(controller.state.world.districts['main']?.centerBuildingId).toBe(townHall.id);
    // Die Achsen entstehen relativ zum GEWÄHLTEN Anker, nicht am Bake-Vorschlag.
    expect(controller.derived.roadNetwork.size).toBeGreaterThan(0);
    for (const tile of controller.derived.roadNetwork) {
      const [rx, ry] = tile.split(',').map(Number);
      expect(Math.abs(rx! - spot.x)).toBeLessThanOrEqual(6);
      expect(ry!).toBeGreaterThanOrEqual(spot.y);
    }
  });

  it('refuses a second founding and rejects unbuildable ground', () => {
    const { controller } = newController();
    expect(controller.isCityFounded()).toBe(true);
    expect(controller.foundCity(TOWN_HALL.x, TOWN_HALL.y)).toEqual({ ok: false, error: 'unique_exists' });
    // Ozeanecke: außerhalb jeder erschlossenen Landschaft.
    const { controller: fresh } = newController(T0, { found: false });
    expect(fresh.foundCity(0, 0).ok).toBe(false);
  });

  it('keeps the baked founding suggestion valid — the button must never fail', () => {
    const { controller } = newController(T0, { flatten: false, found: false });
    expect(controller.getFoundingBlocker(startRegionConfig.townHall.x, startRegionConfig.townHall.y)).toBeUndefined();
  });

  it('starts with configured resources and no population', () => {
    const { controller } = newController();
    expect(controller.state.resources.money).toBe(45_000);
    expect(controller.state.citizens.population).toBe(0);
  });
});
