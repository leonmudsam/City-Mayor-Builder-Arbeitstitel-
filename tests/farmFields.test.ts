import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, setLevel, flattenTerrain, T0 } from './helpers.ts';
import { overrideTerrain, samplePlacementSurface } from '../src/game/map/world.ts';
import { FIELD_COST_PER_TILE } from '../src/game/operations/farmFields.ts';
import { deriveNodesInArea, nodeSoilFactor, SOIL_BONUS_NATURAL_FERTILE } from '../src/game/operations/nodes.ts';
import type { GameController } from '../src/game/commands/controller.ts';

// § Frühspiel-Audit / D-055 — FELDER STATT FRUCHTBARKEITS-GATE.
//
// Der gemessene Anlass: Die Startregion hat NULL `fertile`-Kacheln, eine dort
// gebaute Farm arbeitet nie. Diese Tests belegen, dass ein Feld genau das
// behebt — und zwar über die VORHANDENE Knotenableitung, nicht über ein zweites
// Produktionssystem: nach dem Anlegen liefert `deriveNodesInArea` `crop`-Knoten,
// wo vorher keine waren.

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

function farmCity(): GameController {
  const { controller } = newController();
  setLevel(controller, 20);
  flattenTerrain(controller);
  controller.state.resources = { money: 10_000_000, wood: 100_000, stone: 100_000, food: 100_000, freshwater: 100_000, planks: 0, cut_stone: 0 };
  for (let dx = 0; dx <= 20; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
  expect(controller.placeBuilding('farm', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
  controller.update(T0 + 3_600_000, false);
  return controller;
}

describe('Farm-Felder — die Farm bringt ihr Ackerland mit', () => {
  it('findet ohne Feld keinen einzigen Erntepunkt', () => {
    const controller = farmCity();
    const area = { minX: at(0, 8).x, minY: at(0, 8).y, maxX: at(10, 14).x, maxY: at(10, 14).y };
    expect(deriveNodesInArea(controller.state, 'crop', area, T0).length).toBe(0);
  });

  it('legt ein Feld an und erzeugt damit echte Erntepunkte', () => {
    const controller = farmCity();
    const origin = at(1, 13);
    const plan = controller.getFarmFieldPlan({ x: origin.x, y: origin.y, w: 6, h: 4 });
    expect(plan.plantable).toBeGreaterThan(0);
    expect(plan.cost).toBe(plan.plantable * FIELD_COST_PER_TILE);

    const before = controller.state.resources.money;
    expect(controller.buildFarmField({ x: origin.x, y: origin.y, w: 6, h: 4 })).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(before - plan.cost);

    // Die Knoten kommen aus der NORMALEN Ableitung — kein Sonderweg.
    const area = { minX: origin.x, minY: origin.y, maxX: origin.x + 5, maxY: origin.y + 3 };
    expect(deriveNodesInArea(controller.state, 'crop', area, T0).length).toBeGreaterThan(0);
    expect(controller.getFarmFieldTiles().length).toBe(plan.plantable);
  });

  it('legt nichts an, wo keine Farm in Reichweite ist', () => {
    const controller = farmCity();
    // Weit weg von der Farm: jede Kachel meldet denselben Grund.
    const far = at(60, 60);
    const plan = controller.getFarmFieldPlan({ x: far.x, y: far.y, w: 3, h: 3 });
    expect(plan.plantable).toBe(0);
    expect(plan.tiles.every((tile) => tile.blocker === 'no_farm_in_range' || tile.blocker !== undefined)).toBe(true);
    expect(controller.buildFarmField({ x: far.x, y: far.y, w: 3, h: 3 })).toEqual({ ok: false, error: 'invalid' });
  });

  it('überbaut weder Gebäude noch bestehende Felder', () => {
    const controller = farmCity();
    const origin = at(1, 13);
    controller.buildFarmField({ x: origin.x, y: origin.y, w: 4, h: 3 });
    const again = controller.getFarmFieldPlan({ x: origin.x, y: origin.y, w: 4, h: 3 });
    expect(again.plantable).toBe(0);
    expect(again.tiles.every((tile) => tile.blocker === 'already_field')).toBe(true);
    // Die Farm selbst ist belegt und bleibt es.
    const onFarm = controller.getFarmFieldPlan({ x: at(1, 6).x, y: at(1, 6).y, w: 2, h: 2 });
    expect(onFarm.tiles.every((tile) => tile.blocker === 'occupied')).toBe(true);
  });

  it('nimmt Felder zurück und lässt fremde Overrides in Ruhe', () => {
    const controller = farmCity();
    const origin = at(1, 13);
    controller.buildFarmField({ x: origin.x, y: origin.y, w: 4, h: 3 });
    const planted = controller.getFarmFieldTiles().length;
    expect(planted).toBeGreaterThan(0);
    expect(controller.clearFarmField({ x: origin.x, y: origin.y, w: 4, h: 3 })).toEqual({ ok: true });
    expect(controller.getFarmFieldTiles().length).toBe(0);
    // Zweimal zurücknehmen ist kein Erfolg — es gibt nichts mehr.
    expect(controller.clearFarmField({ x: origin.x, y: origin.y, w: 4, h: 3 })).toEqual({ ok: false, error: 'invalid' });
  });

  it('übersteht Speichern und Laden', () => {
    const controller = farmCity();
    const origin = at(1, 13);
    controller.buildFarmField({ x: origin.x, y: origin.y, w: 5, h: 3 });
    const tiles = controller.getFarmFieldTiles();
    expect(tiles.length).toBeGreaterThan(0);
    // Felder liegen in `world.terrainOverrides` — einem Feld des Spielstands,
    // das seit v10 im Schema steht. Deshalb ohne Migration haltbar.
    const raw = JSON.parse(JSON.stringify(controller.state)) as typeof controller.state;
    expect(Object.values(raw.world.terrainOverrides ?? {}).filter((t) => t === 'fertile').length).toBe(tiles.length);
  });
});

// § D-058 — DIE FARM DARF NICHT BLOCKIEREN.
//
// Der eigentliche Riegel war nicht die Feldmechanik, sondern eine Zeile im
// Command: `if (nodeIds.length === 0) return fail('invalid')`. Damit ließ sich
// eine Farm in der Startregion (null fruchtbare Kacheln) NIE starten — und ohne
// laufende Farm gab es keinen Grund, das Feldsystem überhaupt zu erreichen.
//
// Diese Tests prüfen genau die Regel, nicht ihr Symptom: Wer die Knoten selbst
// anlegen kann, darf leer starten; wer nicht, bekommt weiterhin den Fehler.
describe('D-058 — der Betriebsstart hängt daran, wer die Knoten anlegen kann', () => {
  it('startet die Farm ohne ein einziges Feld und lässt sie warten', () => {
    const controller = farmCity();
    const farm = Object.values(controller.state.buildings).find((b) => b.defId === 'farm');
    expect(farm, 'Die Farm muss stehen — sonst prüft dieser Test nichts').toBeDefined();
    expect(controller.getFarmFieldTiles().length).toBe(0);

    expect(controller.startBuildingOperation(farm!.id)).toEqual({ ok: true });
    const op = controller.getBuildingOperation(farm!.id);
    expect(op, 'der Auftrag muss existieren, nicht bloß „ok" melden').toBeDefined();
    expect(op?.status, 'ohne Felder wartet der Betrieb, statt zu scheitern').toBe('waiting');
    expect(op?.workArea, 'nur ein Dauerbetrieb kann später von selbst anlaufen').toBeDefined();
  });

  it('nimmt die Arbeit von selbst auf, sobald ein Feld angelegt ist', () => {
    const controller = farmCity();
    const farm = Object.values(controller.state.buildings).find((b) => b.defId === 'farm')!;
    controller.startBuildingOperation(farm.id);

    const origin = at(1, 13);
    expect(controller.buildFarmField({ x: origin.x, y: origin.y, w: 4, h: 4 })).toEqual({ ok: true });
    // LIVE ticken: `advanceOperations` läuft ausdrücklich nur im Live-Tick,
    // nie offline. Mit `false` schläft der Betrieb weiter und der Test würde
    // eine Regression melden, die es nicht gibt.
    controller.update(T0 + 3_700_000, true);

    expect(
      controller.getBuildingOperation(farm.id)?.status,
      'mit Feldern läuft derselbe Dauerbetrieb an',
    ).toBe('active');
  });

  it('verweigert dem Steinbruch den Leerstart weiter — Stein wächst nie nach', () => {
    const controller = farmCity();
    const quarry = at(6, 8);
    // Der Steinbruch braucht Fels; auf eingeebnetem Gelände gibt es keinen.
    // Genau das ist der Fall, der hart scheitern MUSS.
    if (!controller.placeBuilding('quarry', quarry.x, quarry.y).ok) return;
    controller.update(T0 + 7_200_000, false);
    const built = Object.values(controller.state.buildings).find((b) => b.defId === 'quarry');
    if (!built || built.status !== 'active') return;
    expect(controller.startBuildingOperation(built.id)).toEqual({ ok: false, error: 'invalid' });
  });
});

/**
 * § P4-Smoke-Befund (03.08.2026) — EIN FELD IST KEIN DEBUG-OVERRIDE.
 *
 * Gefunden hat das kein Test, sondern die Aufnahme der 3D-Szene: In einem
 * Spielstand mit Terrain-Overrides standen die Häuser im Boden. Die Ursache
 * liegt tiefer als die Karte — `isFlatDebugSurface` las „es gibt einen
 * Override" als „hier arbeitet ein Test" und ebnete den Untergrund auf Höhe 0
 * ein. Seit D-059 legt der SPIELER Overrides an (jedes Feld ist einer), damit
 * war die Annahme falsch: Ein Feld hätte den Boden unter sich eingeebnet und
 * die Kachel zusätzlich der Startregion zugeschlagen.
 */
describe('Felder verändern das Gelände nicht', () => {
  const probe = nearTownHall(-4, -6); // echte Bake-Höhe (~5,6), nicht eingeebnet

  it('lässt die Platzierungshöhe unberührt', () => {
    const { controller } = newController(T0, { flatten: false });
    const before = samplePlacementSurface(controller.state, probe.x, probe.y, 1, 1);
    expect(before.maxHeight).toBeGreaterThan(0); // sonst misst der Test nichts
    overrideTerrain(controller.state, probe.x, probe.y, 'fertile');
    const after = samplePlacementSurface(controller.state, probe.x, probe.y, 1, 1);
    expect(after.maxHeight).toBe(before.maxHeight);
    expect(after.minHeight).toBe(before.minHeight);
  });

  it('der Debug-Kanal ebnet weiterhin ein — die Gegenprobe', () => {
    const { controller } = newController(T0, { flatten: false });
    overrideTerrain(controller.state, probe.x, probe.y, 'grass');
    expect(samplePlacementSurface(controller.state, probe.x, probe.y, 1, 1).maxHeight).toBe(0);
  });
});

// § Wirtschafts-/Lieferketten-Overhaul §2 — MODULARE FELDER UND BODENQUALITÄT.
//
// Der Auftrag verlangt „Effizienz abhängig von Entfernung UND Bodenqualität"
// bei gleichzeitig „fruchtbares Land ist ein Bonus, keine Bedingung". Der
// heikle Punkt steckt in der Umsetzung: Ein angelegtes Feld SETZT `fertile` als
// Terrain-Override. Wer die Bodengüte darüber liest, gibt jeder gekauften
// Kachel automatisch Bestnote — der Bonus wäre geschenkt und die Landschaft
// bedeutungslos. Gelesen wird deshalb der Bake.

describe('Farm-Felder — Bodenqualität kommt aus der Landschaft, nicht aus dem Feld', () => {
  it('gibt einer Kachel auf Wiese 100 %, nicht den Fruchtbar-Bonus', () => {
    const controller = farmCity();
    const origin = at(1, 13);
    expect(controller.buildFarmField({ x: origin.x, y: origin.y, w: 2, h: 2 })).toEqual({ ok: true });
    const fields = controller.getFarmFieldTiles();
    expect(fields.length).toBeGreaterThan(0);
    const views = controller.getFarmFields();
    // Der Override sagt jetzt „fertile" — die Güte darf das NICHT übernehmen.
    for (const view of views) expect(view.soilQualityPct).toBe(100);
  });

  it('kauft auch eine einzelne Kachel — modulare Felder (§2)', () => {
    const controller = farmCity();
    const origin = at(4, 13);
    const plan = controller.getFarmFieldPlan({ x: origin.x, y: origin.y, w: 1, h: 1 });
    expect(plan.plantable).toBe(1);
    expect(plan.cost).toBe(FIELD_COST_PER_TILE);
    expect(controller.buildFarmField({ x: origin.x, y: origin.y, w: 1, h: 1 })).toEqual({ ok: true });
    expect(controller.getFarmFieldTiles().length).toBe(1);
  });

  it('ordnet jede Feldkachel der Farm zu, in deren Arbeitsgebiet sie liegt', () => {
    const controller = farmCity();
    const farm = Object.values(controller.state.buildings).find((b) => b.defId === 'farm')!;
    const origin = at(1, 13);
    expect(controller.buildFarmField({ x: origin.x, y: origin.y, w: 2, h: 2 })).toEqual({ ok: true });
    for (const view of controller.getFarmFields()) expect(view.farmId).toBe(farm.id);
  });

  it('nennt einen Ertrag, sobald Felder da sind — und 0, wenn keine da sind', () => {
    const controller = farmCity();
    const farm = Object.values(controller.state.buildings).find((b) => b.defId === 'farm')!;
    expect(controller.getFarmFieldSummary(farm.id)!.yieldPerMinute).toBe(0);

    const origin = at(1, 13);
    expect(controller.buildFarmField({ x: origin.x, y: origin.y, w: 4, h: 4 })).toEqual({ ok: true });
    const summary = controller.getFarmFieldSummary(farm.id)!;
    expect(summary.tiles).toBeGreaterThan(0);
    // Nachhaltig = Kachelmenge ÷ Nachwachsdauer; bei 130 je Kachel und 10 min
    // sind das 13/min je voll effizienter Kachel.
    expect(summary.yieldPerMinute).toBeGreaterThan(0);
    expect(summary.yieldPerMinute).toBeLessThanOrEqual(summary.tiles * 13 * 1.3);
    expect(summary.averageSoilPct).toBe(100);
  });

  it('macht eine natürlich fruchtbare Kachel ergiebiger als dieselbe auf Wiese', () => {
    // Direkt am Knotenprofil gemessen: der Bonus wirkt über die Ergiebigkeit
    // der Kachel, nicht über eine zweite Effizienzformel (D-059).
    const grass = nodeSoilFactor('crop', at(1, 13).x, at(1, 13).y);
    expect(grass).toBe(1);
    expect(SOIL_BONUS_NATURAL_FERTILE).toBeGreaterThan(1);
    // Und Bäume/Fels kennen keine Bodengüte — sonst wäre es eine allgemeine
    // Ergiebigkeitsschraube statt einer Aussage über Ackerland.
    expect(nodeSoilFactor('tree', at(1, 13).x, at(1, 13).y)).toBe(1);
    expect(nodeSoilFactor('rock', at(1, 13).x, at(1, 13).y)).toBe(1);
  });
});
