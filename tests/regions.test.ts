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

// § 12.2: WENIGER, GRÖSSERE Regionen mit klarer Rolle. Der Spieler erschließt
// EINE zentrale Startregion und ACHT große Landschaften. Startregion = 9
// „Gründerland" mit DREI Landnachbarn: Ostterrassen (3, L2, H+F, 9.778
// bebaubar), Nordwald (7, L4, Holz — 55 % Wald) und Mittelmark (8, L6,
// Scharnier mit fünf Nachbarn).
// §2 (Nutzerwunsch 30.07.2026): Die erste Erweiterung kommt auf LEVEL 2 und ist
// über FREE_EXPANSION_LEVEL zugleich die kostenlose Erstwahl.

describe('region expansion (Insel-Welt, organische Landschaften)', () => {
  it('is locked below the region definition unlock level', () => {
    const { controller } = newController();
    // Südmassiv (5) verlangt Level 20 — auf Level 1 gesperrt.
    expect(controller.unlockRegion(5)).toEqual({ ok: false, error: 'locked' });
  });

  it('unlocks a further adjacent region for its configured cost after the free first expansion', () => {
    const { controller, config } = newController();
    setLevel(controller, 6);
    controller.state.resources.money = 2_000_000;
    // §6: Die ERSTE Erweiterung ab Level 2 ist gratis — hier Nordwald (7).
    expect(controller.unlockRegion(7)).toEqual({ ok: true });
    expect(controller.state.stats.regionsUnlocked).toBe(1);
    const moneyAfterFree = controller.state.resources.money;
    // Jede WEITERE Erweiterung kostet ihren konfigurierten Preis — die Westmark
    // (2) grenzt ebenfalls an Gründerland (9) und öffnet ab L4.
    const def = config.regions.get(2)!;
    expect(controller.getRegionCost(2)).toBe(def.unlockCost);
    expect(controller.unlockRegion(2)).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(moneyAfterFree - def.unlockCost);
    // regionsUnlocked zählt nur ZUSÄTZLICHE Regionen (§5).
    expect(controller.state.stats.regionsUnlocked).toBe(2);
  });

  it('rejects regions that do not border unlocked land or sea', () => {
    const { controller } = newController();
    setLevel(controller, 20);
    controller.state.resources.money = 5_000_000;
    // Die Dünenküste (4) grenzt weder über Land noch über See an das
    // Gründerland (9) — sie hängt allein an der Westmark (2).
    expect(BAKED_REGIONS[4 - 1]!.adjacent).not.toContain(START_REGION);
    expect(BAKED_REGIONS[4 - 1]!.seaAdjacent).not.toContain(START_REGION);
    expect(controller.unlockRegion(4)).toEqual({ ok: false, error: 'invalid' });
  });

  it('has no permanent teaser — every baked region is unlockable', () => {
    // § Modelltreue 13.1: keine dauerhaft gesperrten Teaser. Eine Startregion,
    // acht Freischaltungen, alle über Land erreichbar.
    const { config } = newController();
    expect(config.regionList.every((r) => r.unlockable)).toBe(true);
    expect(config.regionList.filter((r) => r.unlockLevel <= 1)).toHaveLength(1);
    expect(config.regionList.filter((r) => r.unlockable && r.unlockLevel > 1)).toHaveLength(8);
  });

  it('offers exactly one free first expansion at level 2 and grants no reward for it (§6)', () => {
    const { controller } = newController();
    // Unter Level 2 gibt es keine Gratisoption.
    setLevel(controller, 1);
    expect(controller.getFreeRegionExpansionOptions()).toEqual([]);
    // Ab Level 2 ist genau der Nordwald (7) gratis wählbar — Westmark (2),
    // Lagunenland (1) und Massiv (5) grenzen zwar auch an den Start, öffnen aber
    // erst später (§ 12.2 §2, Nutzerwunsch: direkter Nachbar ab L2).
    setLevel(controller, 2);
    expect(controller.getFreeRegionExpansionOptions()).toEqual([7]);
    const xpBefore = controller.state.level.xp;
    controller.state.resources.money = 0; // bewusst pleite: gratis heißt gratis
    expect(controller.isFreeRegionExpansionAvailable(7)).toBe(true);
    expect(controller.unlockRegion(7)).toEqual({ ok: true });
    // Weder Geld noch XP verbraucht/vergeben (§6: reine Progressionsgeste).
    expect(controller.state.resources.money).toBe(0);
    expect(controller.state.level.xp).toBe(xpBefore);
    // Danach ist keine weitere Erweiterung mehr gratis.
    expect(controller.getFreeRegionExpansionOptions()).toEqual([]);
  });

  it('gates a region that only borders unlocked land across water behind a harbor', () => {
    // § Modelltreue 13.1: Die Nordküste (6) grenzt über Land nur an den Nordwald
    // (7), über SEE aber an Ostterrassen (3) und Dünenküste (4). Wer sie über die
    // Dünenküste erschließen will, braucht einen Hafen — genau der Anreiz aus §6.
    // Sobald der Landweg offen ist, fällt die Pflicht weg.
    const { controller } = newController();
    setLevel(controller, 20);
    controller.state.resources.money = 50_000_000;
    expect(BAKED_REGIONS[6 - 1]!.adjacent).not.toContain(4);
    expect(BAKED_REGIONS[6 - 1]!.seaAdjacent).toContain(4);
    controller.state.world.regions['4']!.status = 'unlocked';
    // Ohne Hafen: nur über See erreichbar ⇒ gesperrt.
    expect(controller.getRegionUnlockBlocker(6)).toBe('needs_harbor');
    expect(controller.unlockRegion(6)).toEqual({ ok: false, error: 'locked' });
    // Über den Landweg (Nordwald 7) fällt die Hafenpflicht weg.
    controller.state.world.regions['7']!.status = 'unlocked';
    expect(controller.getRegionUnlockBlocker(6)).toBeUndefined();
    // Als DAUERHAFT hafenpflichtig gilt sie deshalb nicht (ehrliches Anzeigeflag).
    expect(controller.isRegionHarborDependent(6)).toBe(false);
  });

  it('founds the river district: a self-connected build area at the water (§8)', () => {
    const { controller } = newController();
    setLevel(controller, 12);
    controller.state.resources = { money: 2_000_000, wood: 2_000, stone: 2_000, food: 1_000, freshwater: 0 };
    // Kandidat: eine gesperrte, nicht-gebirgige Fluss-Landschaft mit echtem
    // Bauumfeld (§ 10.0: ein Gebirgs-Fluss-Pocket wäre von Bergen umschlossen und
    // ließe keine Anschlussstraße zu — der Distrikt braucht bebaubares Umland).
    const candidate = BAKED_REGIONS.find(
      (r) => r.terrain.river > 0 && r.id !== START_REGION && r.dominant !== 'mountain' && controller.canFoundDistrict(r.id).eligible,
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
    // § 10.0: das verdichtete Terrain macht einzelne Randkacheln unbebaubar —
    // daher der volle Perimeter-Ring statt nur vier Mittelkanten.
    const ring: [number, number][] = [];
    for (let d = -1; d <= 4; d++) {
      ring.push([center.x + d, center.y - 1], [center.x + d, center.y + 4]);
      ring.push([center.x - 1, center.y + d], [center.x + 4, center.y + d]);
    }
    const placed = ring.some(([x, y]) => controller.placeBuilding('road', x, y).ok);
    expect(placed).toBe(true);

    // Only one river district for now.
    const other = BAKED_REGIONS.find((r) => r.terrain.river > 0 && r.id !== riverId && r.id !== START_REGION);
    if (other) expect(controller.canFoundDistrict(other.id).eligible).toBe(false);
  });

  it('gives regions distinct production/road character; the start region is neutral', () => {
    const { config } = newController();
    // Gruenderland (9) ist bewusst neutral — der Bezugspunkt.
    const start = tileInRegion(START_REGION);
    expect(regionProductionFactorAt(config, start.x, start.y, 'wood')).toBe(1);
    expect(regionRoadCostFactorAt(config, start.x, start.y)).toBe(1);
    // Nordwald (7) gibt +45 % Holz (§ Regionscharakter).
    const forest = tileInRegion(7);
    expect(regionProductionFactorAt(config, forest.x, forest.y, 'wood')).toBe(1.45);
    // Suedmassiv (5): Strassen teurer (Nachteil), +70 % Stein.
    const mtn = tileInRegion(5);
    expect(regionRoadCostFactorAt(config, mtn.x, mtn.y)).toBeGreaterThan(1);
    expect(regionProductionFactorAt(config, mtn.x, mtn.y, 'stone')).toBe(1.7);
    // Ozean/außerhalb: immer neutral (total, kein Crash).
    expect(regionProductionFactorAt(config, -1, -1, 'wood')).toBe(1);
    expect(regionRoadCostFactorAt(config, -1, -1)).toBe(1);
  });

  it('charges more for roads in a high-cost region than in the start region', () => {
    const { controller } = newController();
    const start = tileInRegion(START_REGION);
    const mtn = tileInRegion(5); // Suedmassiv, roadCostFactor 1.5
    const baseCost = controller.getBuildCost('road', start.x, start.y).money!;
    const mtnCost = controller.getBuildCost('road', mtn.x, mtn.y).money!;
    expect(mtnCost).toBeGreaterThan(baseCost);
    // Das Menü ohne Ort zeigt weiter den Basispreis.
    expect(controller.getBuildCost('road').money).toBe(baseCost);
  });

  it('posts a citizen hint about a newly reachable neighbouring landscape on level-up', () => {
    const { controller, config } = newController();
    // Der Nordwald (7) grenzt an Gruenderland (9) und wird auf Level 2
    // erschliessbar (§ 12.2 §2).
    setLevel(controller, 1);
    const need = config.levels.find((l) => l.level === 2)!.xpRequired - controller.state.level.xp;
    addXp(controller.state, config, controller.derived, need);
    expect(controller.state.level.current).toBe(2);
    const hints = controller.state.mayor.messages.filter((m) => m.textKey === 'message.region_hint');
    expect(hints.some((h) => h.params?.name === 'region.r7')).toBe(true);
    // Der Hinweis nennt eine Himmelsrichtung und einen Kurzcharakter als i18n-Keys.
    const delta = hints.find((h) => h.params?.name === 'region.r7')!;
    expect(String(delta.params?.direction)).toMatch(/^ui\.dir\./);
    expect(String(delta.params?.boon)).toMatch(/^ui\.region\.boon\./);
  });

  it('has a hard world edge — nothing exists or unlocks past the baked regions', () => {
    const { controller } = newController();
    setLevel(controller, 2);
    controller.state.resources.money = 5_000_000;
    // Ein Start-Nachbar ist regulaer erschliessbar (Nordwald, 7, L2)…
    expect(controller.unlockRegion(7)).toEqual({ ok: true });
    // …aber jenseits der gebackenen Regionen existiert nichts.
    expect(controller.state.world.regions['99']).toBeUndefined();
    expect(controller.unlockRegion(99)).toEqual({ ok: false, error: 'invalid' });
    expect(controller.unlockRegion(0)).toEqual({ ok: false, error: 'invalid' });
  });
});
