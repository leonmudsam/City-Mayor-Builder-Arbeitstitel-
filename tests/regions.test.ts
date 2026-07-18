import { describe, expect, it } from 'vitest';
import { newController, setLevel, START_REGION } from './helpers.ts';
import {
  BAKED_REGIONS,
  regionBounds,
  regionIdAt,
} from '../src/game/config/startRegion.config.ts';
import { regionProductionFactorAt, regionRoadCostFactorAt } from '../src/game/map/world.ts';
import { addXp } from '../src/game/progression/levels.ts';

/** Erste Kachel, die zur gegebenen Region gehört (Scan über ihre Bounding-Box). */
function tileInRegion(id: number): { x: number; y: number } {
  const b = regionBounds(id)!;
  for (let y = b.minY; y <= b.maxY; y++)
    for (let x = b.minX; x <= b.maxX; x++) if (regionIdAt(x, y) === id) return { x, y };
  throw new Error(`keine Kachel in Region ${id}`);
}

// § Welt 2.0: Der Spieler erschließt Landschaften (organische Regionen aus dem
// Bake) — jede eine strategische Einzel-Entscheidung aus regions.config.ts
// (explizite Kosten, Level-Gates, Voraussetzungen, nie freischaltbare
// Teaser-Insel). Startregion = 2 „Lichtungsland"; Nachbarn u. a. 4 „Fruchtdelta"
// (L5/320k); der Hochgebirgskern (1) braucht die Randgebirge 24 UND 25.

describe('region expansion (Insel-Welt, organische Landschaften)', () => {
  it('is locked below the region definition unlock level', () => {
    const { controller } = newController();
    // Fruchtdelta (4) verlangt Level 5 — auf Level 1 gesperrt.
    expect(controller.unlockRegion(4)).toEqual({ ok: false, error: 'locked' });
  });

  it('unlocks an adjacent region for its configured cost', () => {
    const { controller, config } = newController();
    setLevel(controller, 5);
    controller.state.resources.money = 1_000_000;
    const def = config.regions.get(4)!;
    expect(controller.getRegionCost(4)).toBe(def.unlockCost);
    expect(controller.unlockRegion(4)).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(1_000_000 - def.unlockCost);
    // regionsUnlocked zählt nur ZUSÄTZLICHE Regionen (§5).
    expect(controller.state.stats.regionsUnlocked).toBe(1);
  });

  it('rejects regions that do not border unlocked land', () => {
    const { controller } = newController();
    setLevel(controller, 10);
    controller.state.resources.money = 5_000_000;
    // Region 5 (Ostweiden) grenzt nicht an die Startregion (Nachbarn laut Bake:
    // 6, 7, 8, 21) — logische Expansion erzwungen (§2 Auftrag B).
    expect(BAKED_REGIONS[5 - 1]!.adjacent).not.toContain(START_REGION);
    expect(controller.unlockRegion(5)).toEqual({ ok: false, error: 'invalid' });
  });

  it('enforces prerequisite regions (Hochgebirgskern) and blocks the teaser island', () => {
    const { controller } = newController();
    setLevel(controller, 20);
    controller.state.resources.money = 50_000_000;
    // Hochgebirgskern (1) verlangt Graue Zinnen (24) UND Sturmspitzen (25).
    expect(controller.unlockRegion(1)).toEqual({ ok: false, error: 'locked' });
    // Die vorgelagerte Insel (32) ist nie erschließbar.
    expect(controller.unlockRegion(32)).toEqual({ ok: false, error: 'invalid' });
  });

  it('founds the river district: a self-connected build area at the water (§8)', () => {
    const { controller } = newController();
    setLevel(controller, 12);
    controller.state.resources = { money: 2_000_000, wood: 2_000, stone: 2_000, food: 1_000, freshwater: 0 };
    // Kandidat: eine gesperrte Fluss-Landschaft, in der das Projekt möglich ist.
    const candidate = BAKED_REGIONS.find(
      (r) => r.terrain.river > 0 && r.id !== START_REGION && controller.canFoundDistrict(r.id).eligible,
    );
    expect(candidate).toBeDefined();
    const riverId = candidate!.id;
    expect(controller.foundDistrict(riverId)).toEqual({ ok: true });

    const region = controller.state.world.regions[String(riverId)]!;
    expect(region.status).toBe('unlocked');
    expect(region.districtId).toBe('river');
    const district = controller.state.world.districts['river'];
    expect(district).toBeDefined();
    const center = controller.state.buildings[district!.centerBuildingId]!;
    expect(center.defId).toBe('district_center');
    expect(center.status).toBe('active');

    // The centre seeds its own road network: a road placed next to it connects
    // without any link back to downtown (district_center ist jetzt 4×4).
    const placed = [
      [center.x, center.y - 1], [center.x, center.y + 4],
      [center.x - 1, center.y], [center.x + 4, center.y],
    ].some(([x, y]) => controller.placeBuilding('road', x!, y!).ok);
    expect(placed).toBe(true);

    // Only one river district for now.
    const other = BAKED_REGIONS.find((r) => r.terrain.river > 0 && r.id !== riverId && r.id !== START_REGION);
    if (other) expect(controller.canFoundDistrict(other.id).eligible).toBe(false);
  });

  it('gives regions distinct production/road character; the start region is neutral', () => {
    const { config } = newController();
    // Startregion (2) ist bewusst neutral — der Bezugspunkt.
    const start = tileInRegion(START_REGION);
    expect(regionProductionFactorAt(config, start.x, start.y, 'wood')).toBe(1);
    expect(regionRoadCostFactorAt(config, start.x, start.y)).toBe(1);
    // Waldregion 17 (Nordwald) gibt +50 % Holz (§ Welt 2.0 Vorteil).
    const forest = tileInRegion(17);
    expect(regionProductionFactorAt(config, forest.x, forest.y, 'wood')).toBe(1.5);
    // Gebirgsregion 27 (Steinbruchgrat): Straßen teurer (Nachteil), +50 % Stein.
    const mtn = tileInRegion(27);
    expect(regionRoadCostFactorAt(config, mtn.x, mtn.y)).toBeGreaterThan(1);
    expect(regionProductionFactorAt(config, mtn.x, mtn.y, 'stone')).toBe(1.5);
    // Ozean/außerhalb: immer neutral (total, kein Crash).
    expect(regionProductionFactorAt(config, -1, -1, 'wood')).toBe(1);
    expect(regionRoadCostFactorAt(config, -1, -1)).toBe(1);
  });

  it('charges more for roads in a high-cost region than in the start region', () => {
    const { controller } = newController();
    const start = tileInRegion(START_REGION);
    const mtn = tileInRegion(27); // roadCostFactor 1.6
    const baseCost = controller.getBuildCost('road', start.x, start.y).money!;
    const mtnCost = controller.getBuildCost('road', mtn.x, mtn.y).money!;
    expect(mtnCost).toBeGreaterThan(baseCost);
    // Das Menü ohne Ort zeigt weiter den Basispreis.
    expect(controller.getBuildCost('road').money).toBe(baseCost);
  });

  it('posts a citizen hint about a newly reachable neighbouring landscape on level-up', () => {
    const { controller, config } = newController();
    // Fruchtdelta (4) grenzt an den Start und wird auf Level 5 erschließbar —
    // ein Level-Up auf 5 muss den Bürger-Hinweis mit Richtung + Boon posten (§4).
    setLevel(controller, 4);
    const need = config.levels.find((l) => l.level === 5)!.xpRequired - controller.state.level.xp;
    addXp(controller.state, config, controller.derived, need);
    expect(controller.state.level.current).toBe(5);
    const hints = controller.state.mayor.messages.filter((m) => m.textKey === 'message.region_hint');
    expect(hints.some((h) => h.params?.name === 'region.r4')).toBe(true);
    // Der Hinweis nennt eine Himmelsrichtung und einen Kurzcharakter als i18n-Keys.
    const delta = hints.find((h) => h.params?.name === 'region.r4')!;
    expect(String(delta.params?.direction)).toMatch(/^ui\.dir\./);
    expect(String(delta.params?.boon)).toMatch(/^ui\.region\.boon\./);
  });

  it('has a hard world edge — nothing exists or unlocks past the baked regions', () => {
    const { controller } = newController();
    setLevel(controller, 8);
    controller.state.resources.money = 5_000_000;
    // Ein Start-Nachbar ist regulär erschließbar…
    expect(controller.unlockRegion(7)).toEqual({ ok: true });
    // …aber jenseits der gebackenen Regionen existiert nichts.
    expect(controller.state.world.regions['99']).toBeUndefined();
    expect(controller.unlockRegion(99)).toEqual({ ok: false, error: 'invalid' });
    expect(controller.unlockRegion(0)).toEqual({ ok: false, error: 'invalid' });
  });
});
