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

// § Final World Compaction 8.1: Der Spieler erschließt EINE zentrale Startregion
// und ZWÖLF bedeutende Landschaften (konsolidiert aus 40) — jede eine
// strategische Einzel-Entscheidung aus regions.config.ts (explizite Kosten,
// Level-Gates, Land- oder See-Erschließung mit Hafenpflicht). Startregion = 13
// „Zentralland"; direkte Landnachbarn sind Westweiden (7, L3) und Nordwald
// (10, L3). Die erste Erweiterung ab Level 3 ist gratis (§6).

describe('region expansion (Insel-Welt, organische Landschaften)', () => {
  it('is locked below the region definition unlock level', () => {
    const { controller } = newController();
    // Kronengebirge (1) verlangt Level 20 — auf Level 1 gesperrt.
    expect(controller.unlockRegion(1)).toEqual({ ok: false, error: 'locked' });
  });

  it('unlocks a further adjacent region for its configured cost after the free first expansion', () => {
    const { controller, config } = newController();
    setLevel(controller, 6);
    controller.state.resources.money = 2_000_000;
    // §6: Die ERSTE Erweiterung ab Level 3 ist gratis — hier Westweiden (7).
    expect(controller.unlockRegion(7)).toEqual({ ok: true });
    expect(controller.state.stats.regionsUnlocked).toBe(1);
    const moneyAfterFree = controller.state.resources.money;
    // Jede WEITERE Erweiterung kostet ihren konfigurierten Preis — Nordwald (10)
    // grenzt ebenfalls an Zentralland.
    const def = config.regions.get(10)!;
    expect(controller.getRegionCost(10)).toBe(def.unlockCost);
    expect(controller.unlockRegion(10)).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(moneyAfterFree - def.unlockCost);
    // regionsUnlocked zählt nur ZUSÄTZLICHE Regionen (§5).
    expect(controller.state.stats.regionsUnlocked).toBe(2);
  });

  it('rejects regions that do not border unlocked land or sea', () => {
    const { controller } = newController();
    setLevel(controller, 20);
    controller.state.resources.money = 5_000_000;
    // Ostebene (6) grenzt weder über Land noch über See an Zentralland (13).
    expect(BAKED_REGIONS[6 - 1]!.adjacent).not.toContain(START_REGION);
    expect(BAKED_REGIONS[6 - 1]!.seaAdjacent).not.toContain(START_REGION);
    expect(controller.unlockRegion(6)).toEqual({ ok: false, error: 'invalid' });
  });

  it('has no permanent teaser — every baked region is unlockable', () => {
    // § Final World Compaction 8.1 §4: keine dauerhaft gesperrten Teaser mehr.
    // Genau eine Startregion, zwölf Freischaltungen, alle erreichbar.
    const { config } = newController();
    expect(config.regionList.every((r) => r.unlockable)).toBe(true);
    expect(config.regionList.filter((r) => r.unlockLevel <= 1)).toHaveLength(1);
    expect(config.regionList.filter((r) => r.unlockable && r.unlockLevel > 1)).toHaveLength(12);
  });

  it('offers exactly one free first expansion at level 3 and grants no reward for it (§6)', () => {
    const { controller } = newController();
    // Unter Level 3 gibt es keine Gratisoption.
    setLevel(controller, 2);
    expect(controller.getFreeRegionExpansionOptions()).toEqual([]);
    // Ab Level 3 sind beide Start-Landnachbarn (7, 10) gratis wählbar.
    setLevel(controller, 3);
    expect(controller.getFreeRegionExpansionOptions()).toEqual([7, 10]);
    const xpBefore = controller.state.level.xp;
    controller.state.resources.money = 0; // bewusst pleite: gratis heißt gratis
    expect(controller.isFreeRegionExpansionAvailable(10)).toBe(true);
    expect(controller.unlockRegion(10)).toEqual({ ok: true });
    // Weder Geld noch XP verbraucht/vergeben (§6: reine Progressionsgeste).
    expect(controller.state.resources.money).toBe(0);
    expect(controller.state.level.xp).toBe(xpBefore);
    // Danach ist keine weitere Erweiterung mehr gratis.
    expect(controller.getFreeRegionExpansionOptions()).toEqual([]);
    expect(controller.isFreeRegionExpansionAvailable(7)).toBe(false);
  });

  it('gates a sea-only region behind an operational harbor (§ Archipel)', () => {
    const { controller } = newController();
    setLevel(controller, 20);
    // Südplateau (4) hängt nur über See an Südterrassen (3): erst gar nicht adjazent…
    expect(controller.getRegionUnlockBlocker(4)).toBe('not_adjacent');
    // …nach Erschließung des Seenachbarn 3, aber ohne Hafen: hafenpflichtig.
    controller.state.world.regions['3']!.status = 'unlocked';
    expect(controller.getRegionUnlockBlocker(4)).toBe('needs_harbor');
    expect(controller.isRegionHarborDependent(4)).toBe(true);
    controller.state.resources.money = 50_000_000;
    expect(controller.unlockRegion(4)).toEqual({ ok: false, error: 'locked' });
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
    // Zentralland (13) ist bewusst neutral — der Bezugspunkt.
    const start = tileInRegion(START_REGION);
    expect(regionProductionFactorAt(config, start.x, start.y, 'wood')).toBe(1);
    expect(regionRoadCostFactorAt(config, start.x, start.y)).toBe(1);
    // Nordwald (10) gibt +45 % Holz (§ Regionscharakter).
    const forest = tileInRegion(10);
    expect(regionProductionFactorAt(config, forest.x, forest.y, 'wood')).toBe(1.45);
    // Kronengebirge (1): Straßen teurer (Nachteil), +90 % Stein.
    const mtn = tileInRegion(1);
    expect(regionRoadCostFactorAt(config, mtn.x, mtn.y)).toBeGreaterThan(1);
    expect(regionProductionFactorAt(config, mtn.x, mtn.y, 'stone')).toBe(1.9);
    // Ozean/außerhalb: immer neutral (total, kein Crash).
    expect(regionProductionFactorAt(config, -1, -1, 'wood')).toBe(1);
    expect(regionRoadCostFactorAt(config, -1, -1)).toBe(1);
  });

  it('charges more for roads in a high-cost region than in the start region', () => {
    const { controller } = newController();
    const start = tileInRegion(START_REGION);
    const mtn = tileInRegion(1); // Kronengebirge, roadCostFactor 1.9
    const baseCost = controller.getBuildCost('road', start.x, start.y).money!;
    const mtnCost = controller.getBuildCost('road', mtn.x, mtn.y).money!;
    expect(mtnCost).toBeGreaterThan(baseCost);
    // Das Menü ohne Ort zeigt weiter den Basispreis.
    expect(controller.getBuildCost('road').money).toBe(baseCost);
  });

  it('posts a citizen hint about a newly reachable neighbouring landscape on level-up', () => {
    const { controller, config } = newController();
    // Nordwald (10) grenzt an Zentralland und wird auf Level 3 erschließbar.
    setLevel(controller, 2);
    const need = config.levels.find((l) => l.level === 3)!.xpRequired - controller.state.level.xp;
    addXp(controller.state, config, controller.derived, need);
    expect(controller.state.level.current).toBe(3);
    const hints = controller.state.mayor.messages.filter((m) => m.textKey === 'message.region_hint');
    expect(hints.some((h) => h.params?.name === 'region.r10')).toBe(true);
    // Der Hinweis nennt eine Himmelsrichtung und einen Kurzcharakter als i18n-Keys.
    const delta = hints.find((h) => h.params?.name === 'region.r10')!;
    expect(String(delta.params?.direction)).toMatch(/^ui\.dir\./);
    expect(String(delta.params?.boon)).toMatch(/^ui\.region\.boon\./);
  });

  it('has a hard world edge — nothing exists or unlocks past the baked regions', () => {
    const { controller } = newController();
    setLevel(controller, 3);
    controller.state.resources.money = 5_000_000;
    // Ein Start-Nachbar ist regulär erschließbar (Nordwald, 10)…
    expect(controller.unlockRegion(10)).toEqual({ ok: true });
    // …aber jenseits der gebackenen Regionen existiert nichts.
    expect(controller.state.world.regions['99']).toBeUndefined();
    expect(controller.unlockRegion(99)).toEqual({ ok: false, error: 'invalid' });
    expect(controller.unlockRegion(0)).toEqual({ ok: false, error: 'invalid' });
  });
});
