import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, paintResourceNodes, paintTerrain, setLevel, T0 } from './helpers.ts';
import { RESOURCE_NODE_PROFILES } from '../src/game/operations/nodes.ts';
import type { GameController } from '../src/game/commands/controller.ts';
import type { TerrainType } from '../src/game/types.ts';

// § Active Operations 2.0 — Phasen A6 (Steinbruch) und A7 (Farm).
//
// Bis v1.11 war GENAU EIN Gebäude von 34 ein aktiver Betrieb: das Sägewerk.
// Steinbruch und Farm waren weiter passive Zahlenticker. Diese Tests sichern die
// Generalisierung ab — und zwar an den Punkten, an denen sich Stein und Nahrung
// vom Holz UNTERSCHEIDEN, nicht an einer Kopie der Sägewerk-Tests:
//
//   · Fels wächst NICHT nach (endliches Vorkommen, ehrlicher Grund statt „Nachwuchs")
//   · Felder wachsen schnell nach (Feld-Lebenszyklus über dieselbe Regeneration)
//   · beide Betriebe erreichen ungefähr ihre frühere Passivrate (Progression)

const MIN = 60_000;
const at = (dx: number, dy: number) => nearTownHall(dx, dy);

function paintBlock(controller: GameController, x0: number, y0: number, w: number, h: number, terrain: TerrainType): void {
  const coords: [number, number][] = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) coords.push([x0 + dx, y0 + dy]);
  paintTerrain(controller, coords, terrain);
}

/**
 * Steinbruch (5×5) mit einem Felsfeld östlich im effizienten Arbeitsgebiet.
 *
 * `exactNodes` erzwingt GENAU so viele echte Felsvorkommen (statt eines Blocks
 * fester Größe). Nötig, weil ein Knoten zusätzlich zum Terrain den
 * Positions-Hash bestehen muss: ein 1×1-„Felsfeld" trägt je nach absoluter
 * Weltkoordinate gar keinen Knoten (§ World Overhaul 12.0).
 */
function quarryWithRock(rockW = 6, rockH = 6, exactNodes?: number) {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 4);
  flattenTerrain(controller);
  controller.state.resources = { money: 900_000, wood: 800, stone: 0, food: 200, freshwater: 0, planks: 0, cut_stone: 0 };
  // Grundfläche (1..5, 6..10); Fels ab dx 7, damit er nicht überbaut wird.
  if (exactNodes !== undefined) paintResourceNodes(controller, 'rock', at(7, 6), exactNodes, 3);
  else paintBlock(controller, at(7, 6).x, at(7, 6).y, rockW, rockH, 'mountain');
  expect(controller.placeBuilding('quarry', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
  controller.update(T0 + 91_000, true);
  const quarry = Object.values(controller.state.buildings).find((b) => b.defId === 'quarry')!;
  return { controller, quarryId: quarry.id };
}

/** Farm (6×6) mit fruchtbaren Feldern östlich im effizienten Arbeitsgebiet.
 *  `exactNodes` wie bei `quarryWithRock` — genau so viele echte Feldknoten. */
function farmWithFields(fieldW = 6, fieldH = 6, exactNodes?: number) {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 4);
  flattenTerrain(controller);
  controller.state.resources = { money: 900_000, wood: 800, stone: 400, food: 0, freshwater: 0, planks: 0, cut_stone: 0 };
  // Grundfläche (1..6, 6..11); Felder ab dx 8.
  if (exactNodes !== undefined) paintResourceNodes(controller, 'crop', at(8, 6), exactNodes, 3);
  else paintBlock(controller, at(8, 6).x, at(8, 6).y, fieldW, fieldH, 'fertile');
  expect(controller.placeBuilding('farm', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
  controller.update(T0 + 61_000, true);
  const farm = Object.values(controller.state.buildings).find((b) => b.defId === 'farm')!;
  return { controller, farmId: farm.id };
}

describe('§A6 Steinbruch — aktiver Abbau statt Passivrate', () => {
  it('gewinnt Stein über Arbeiter ins lokale Lager, nicht passiv in den Stadtpool', () => {
    const { controller, quarryId } = quarryWithRock();
    const globalBefore = controller.state.resources.stone;
    expect(controller.startBuildingOperation(quarryId)).toEqual({ ok: true });
    controller.update(T0 + 91_000 + 6 * MIN, true);

    const inv = controller.getBuildingInventory(quarryId)!;
    expect(inv.items.stone ?? 0).toBeGreaterThan(0);
    // Der globale Pool wächst nur über den (automatischen) Transport, nie direkt.
    expect(controller.derived.productionPerMin.stone).toBe(0);
    expect(controller.state.resources.stone).toBeGreaterThanOrEqual(globalBefore);
  });

  it('ohne Fels in Reichweite startet kein Auftrag (kein leerer Betrieb)', () => {
    const bundle = newController();
    const { controller } = bundle;
    setLevel(controller, 4);
    flattenTerrain(controller); // nur Gras
    controller.state.resources = { money: 900_000, wood: 800, stone: 0, food: 200, freshwater: 0, planks: 0, cut_stone: 0 };
    expect(controller.placeBuilding('quarry', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
    controller.update(T0 + 91_000, true);
    const quarry = Object.values(controller.state.buildings).find((b) => b.defId === 'quarry')!;
    expect(controller.startBuildingOperation(quarry.id)).toEqual({ ok: false, error: 'invalid' });
  });

  it('Fels wächst NIE nach — ein abgebautes Vorkommen bleibt leer', () => {
    // Ein einziges Felsfeld, damit es in Testzeit sicher leer wird.
    const { controller, quarryId } = quarryWithRock(1, 1, 1);
    expect(controller.startBuildingOperation(quarryId)).toEqual({ ok: true });
    const nodesBefore = controller.getResourceNodesNear(quarryId);
    expect(nodesBefore.length).toBe(1);

    // Weit über jede denkbare Nachwachszeit hinaus (Bäume brauchen 8 Simminuten).
    controller.update(T0 + 91_000 + 120 * MIN, true);

    const node = controller.getResourceNodesNear(quarryId)[0]!;
    expect(node.remainingAmount).toBe(0);
    expect(node.state).toBe('depleted'); // NICHT 'regrowing'
    expect(node.regenerationAt).toBeUndefined();
  });

  it('meldet ein leeres Vorkommen ehrlich als erschöpft, nicht als „wartet auf Nachwuchs"', () => {
    const { controller, quarryId } = quarryWithRock(1, 1, 1);
    expect(controller.startBuildingOperation(quarryId)).toEqual({ ok: true });
    controller.update(T0 + 91_000 + 120 * MIN, true);

    const status = controller.getContinuousOperationStatus(quarryId)!;
    expect(status.renewable).toBe(false);
    expect(status.status).toBe('waiting');
    expect(status.remainingInArea).toBe(0);
    expect(status.nextRegrowthAt).toBeUndefined();

    const throughput = controller.getOperationThroughput(quarryId)!;
    expect(throughput.idleReason).toBe('deposit_exhausted');
  });
});

describe('§A7 Farm — bewirtschaftete Felder statt Passivrate', () => {
  it('erntet Nahrung über Landarbeiter ins lokale Lager', () => {
    const { controller, farmId } = farmWithFields();
    expect(controller.startBuildingOperation(farmId)).toEqual({ ok: true });
    controller.update(T0 + 61_000 + 4 * MIN, true);

    const inv = controller.getBuildingInventory(farmId)!;
    expect(inv.items.food ?? 0).toBeGreaterThan(0);
    expect(controller.derived.productionPerMin.food).toBe(0); // keine Passivrate mehr
  });

  it('Felder wachsen nach — der Dauerbetrieb erntet mehrfach vom selben Feld', () => {
    const { controller, farmId } = farmWithFields(1, 1, 1); // genau ein Feld
    expect(controller.startBuildingOperation(farmId)).toEqual({ ok: true });
    // Deutlich länger als ein Nachwachszyklus (10 Simminuten).
    controller.update(T0 + 61_000 + 45 * MIN, true);

    const harvested = controller.state.stats.produced.food ?? 0;
    const perField = RESOURCE_NODE_PROFILES.crop!.maxAmount;
    // Mehr als eine Feldfüllung ⇒ es wurde nachgewachsen und erneut geerntet.
    expect(harvested).toBeGreaterThan(perField);

    const status = controller.getContinuousOperationStatus(farmId)!;
    expect(status.renewable).toBe(true);
  });

  it('eine Ausbaustufe vergrößert das Arbeitsgebiet, ohne die Wahl des Spielers zu verwerfen', () => {
    const { controller, farmId } = farmWithFields();
    // Bewusst kleines Gebiet: Radius 3 statt der Vorgabe 6.
    expect(controller.startBuildingOperation(farmId, 3)).toEqual({ ok: true });
    expect(controller.getContinuousOperationStatus(farmId)!.workAreaRadius).toBe(3);

    // Großfarm (Stufe 1) bewirtschaftet 3 Kacheln mehr — die Wahl bleibt der Anker.
    const farm = controller.state.buildings[farmId]!;
    farm.upgradeLevel = 1;
    expect(controller.getContinuousOperationStatus(farmId)!.workAreaRadius).toBe(6);
  });
});

describe('§A6/A7 Kalibrierung — die Umstellung kippt die Progression nicht', () => {
  // Die frühere Passivrate ist die Messlatte: ein gut platzierter Betrieb muss sie
  // ungefähr erreichen, sonst bricht die Wirtschaft mit der Umstellung ein.
  // Toleranz bewusst weit (±35 %), weil der echte Wert von der Zielentfernung
  // abhängt — geprüft wird die Größenordnung, nicht eine Scheingenauigkeit.
  const roughly = (value: number, target: number, tolerance = 0.35) => {
    expect(value).toBeGreaterThan(target * (1 - tolerance));
    expect(value).toBeLessThan(target * (1 + tolerance));
  };

  it('Sägewerk erreicht ungefähr seine frühere Passivrate von 45 Holz/min', () => {
    // § 12.1 §3: Diese Zusicherung fehlte als einzige. Gemessen lieferte Stufe 1
    // nur 13,5 Holz/min — ein Drittel der Passivrate, während Steinbruch und Farm
    // kalibriert waren. Genau das war im Spieltest „Holzproduktion zu langsam".
    const bundle = newController();
    const { controller } = bundle;
    setLevel(controller, 4);
    flattenTerrain(controller);
    controller.state.resources = { money: 900_000, wood: 800, stone: 400, food: 200, freshwater: 0, planks: 0, cut_stone: 0 };
    paintBlock(controller, at(6, 6).x, at(6, 6).y, 8, 8, 'forest');
    expect(controller.placeBuilding('sawmill', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
    controller.update(T0 + 31_000, true);
    const sawmill = Object.values(controller.state.buildings).find((b) => b.defId === 'sawmill')!;
    expect(controller.startBuildingOperation(sawmill.id)).toEqual({ ok: true });
    roughly(controller.getOperationThroughput(sawmill.id)!.perMinute, 45);
  });

  it('jede Ausbaustufe verbessert die Infrastruktur auf ALLEN Achsen (§3)', () => {
    // §3 verlangt ausdrücklich: Upgrades sind keine „+X/min"-Zahl, sondern
    // bessere Infrastruktur. Für jeden aktiven Betrieb muss deshalb jede Stufe
    // Arbeiter, Tempo, Werkzeug, Traglast und Lager verbessern — und das
    // Arbeitsgebiet darf nie schrumpfen.
    const { controller } = newController();
    for (const def of controller.config.buildings.values()) {
      if (!def.operation) continue;
      const stages = def.operation.stages;
      for (let i = 1; i < stages.length; i++) {
        const previous = stages[i - 1]!;
        const stage = stages[i]!;
        const where = `${def.id} Stufe ${i + 1}`;
        expect(stage.workerSlots, `${where}: Arbeiter`).toBeGreaterThan(previous.workerSlots);
        expect(stage.movementSpeed, `${where}: Tempo`).toBeGreaterThan(previous.movementSpeed);
        expect(stage.workSpeed, `${where}: Werkzeug`).toBeGreaterThan(previous.workSpeed);
        expect(stage.carryCapacity, `${where}: Traglast`).toBeGreaterThan(previous.carryCapacity);
        expect(stage.storageCapacity, `${where}: Lager`).toBeGreaterThan(previous.storageCapacity);
        const radius = stage.efficientRadius ?? def.operation.efficientRadius;
        const previousRadius = previous.efficientRadius ?? def.operation.efficientRadius;
        expect(radius, `${where}: Arbeitsgebiet schrumpft`).toBeGreaterThanOrEqual(previousRadius);
      }
      // Die letzte Stufe muss das Arbeitsgebiet WIRKLICH erweitert haben.
      const last = stages.at(-1)!;
      expect(
        last.efficientRadius ?? def.operation.efficientRadius,
        `${def.id}: Endstufe erweitert das Arbeitsgebiet nicht`,
      ).toBeGreaterThan(def.operation.efficientRadius);
    }
  });

  it('Steinbruch erreicht ungefähr seine frühere Passivrate von 38 Stein/min', () => {
    const { controller, quarryId } = quarryWithRock(8, 8);
    expect(controller.startBuildingOperation(quarryId)).toEqual({ ok: true });
    roughly(controller.getOperationThroughput(quarryId)!.perMinute, 38);
  });

  it('Farm erreicht ungefähr ihre frühere Passivrate von 260 Nahrung/min', () => {
    const { controller, farmId } = farmWithFields(8, 8);
    expect(controller.startBuildingOperation(farmId)).toEqual({ ok: true });
    roughly(controller.getOperationThroughput(farmId)!.perMinute, 260);
  });

  it('jede Traglast passt in eine Knotenmenge (sonst liefe jeder Arbeiter halb leer heim)', () => {
    const { controller } = newController();
    for (const def of controller.config.buildings.values()) {
      if (!def.operation) continue;
      const profile = RESOURCE_NODE_PROFILES[def.operation.nodeType];
      expect(profile, `Knotenprofil fehlt für ${def.id}`).toBeDefined();
      for (const stage of def.operation.stages) {
        expect(stage.carryCapacity, `${def.id}: Traglast > Knotenmenge`).toBeLessThanOrEqual(profile!.maxAmount);
      }
    }
  });
});
