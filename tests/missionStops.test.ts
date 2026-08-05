import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, refreshDerived, setLevel } from './helpers.ts';
import { openMissionStops } from '../src/game/activities/missionStops.ts';
import { reconcileStock, stockAt } from '../src/game/economy/stockLedger.ts';
import { SCHEMA_VERSION } from '../src/game/newGame.ts';

// § Stadtarbeit 3.0 / A6 — DIE HALTE SIND ABGELEITET, NICHT GESPEICHERT.
//
// D-069 hatte `ActiveActivity.stops` samt Migration v33→v34 vorgesehen. Diese
// Suite prüft die Korrektur: Das Modell existiert, ABER es entsteht bei jeder
// Abfrage neu aus Quelle, Zielen und Lagerregister. Der Beleg, dass das die
// richtige Entscheidung war, ist der letzte Test — ein abgerissenes Lager
// verschwindet sofort aus den Halten. Ein Save-Feld hätte es stehen lassen, bis
// jemand daran denkt, es nachzuziehen.

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

/**
 * Stadt mit Häusern (Lieferziele), einer Farm (Nahrungsquelle) und DREI echten
 * Lagerorten. Ohne Lager gäbe es keine Halte mit der Rolle `storage` — und
 * damit nichts, woran sich die Ortsgenauigkeit aus D-052 zeigen ließe.
 */
function missionCity() {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 14);
  flattenTerrain(controller);
  controller.state.resources = {
    money: 5_000_000, wood: 100_000, stone: 100_000, food: 5_000, freshwater: 0, planks: 0, cut_stone: 0,
  };
  // Von der Rathauskante nach außen wachsen — eine isolierte Kachel lehnt
  // `validatePlacement` zu Recht mit `needs_road` ab.
  for (let dx = 0; dx <= 44; dx++) {
    const spot = at(dx, 4);
    const result = controller.placeBuilding('road', spot.x, spot.y);
    if (!result.ok && result.error !== 'occupied') throw new Error(`Fixture: Straße +${dx} → ${result.error}`);
  }
  for (let dx = -1; dx >= -8; dx--) {
    const spot = at(dx, 4);
    const result = controller.placeBuilding('road', spot.x, spot.y);
    if (!result.ok && result.error !== 'occupied') throw new Error(`Fixture: Straße ${dx} → ${result.error}`);
  }
  // Platziert wird entlang der Teststraße an der ersten freien Stelle. Feste
  // Koordinaten wären hier eine zweite Bebauungsplanung — die Suite prüft die
  // Halte, nicht die Geometrie der Fixture.
  const along = (defId: string) => {
    for (let dx = -8; dx <= 44; dx++) {
      for (const dy of [5]) {
        const spot = at(dx, dy);
        if (controller.placeBuilding(defId, spot.x, spot.y).ok) return;
      }
    }
    throw new Error(`Fixture: ${defId} fand keinen Platz`);
  };
  for (let i = 0; i < 5; i++) along('house_small');
  for (const defId of ['farm', 'warehouse', 'warehouse', 'supermarket']) along(defId);
  for (const building of Object.values(controller.state.buildings)) building.status = 'active';
  refreshDerived(controller);
  controller.state.resources = {
    money: 500_000, wood: 900, stone: 300, food: 900, freshwater: 0, planks: 0, cut_stone: 0,
  };
  reconcileStock(controller.state, controller.config, controller.derived);
  return controller;
}

/** Setzt einen laufenden Auftrag mit Quelle und zwei Zielen (ohne Fahrt). */
function startAnyDriveMission(controller: ReturnType<typeof missionCity>) {
  const board = controller.getActivityBoard().filter((entry) => entry.def.drive && entry.available);
  for (const entry of board) {
    const context = controller.getActivityPlanningContext(entry.def.id);
    if (!context || context.targetBuildingIds.length === 0) continue;
    const result = controller.startActivity(entry.def.id, context.targetBuildingIds, { mode: 'manual' });
    if (result.ok) return entry.def.id;
  }
  return undefined;
}

describe('Halte des Einsatzes (A6)', () => {
  it('ohne laufenden Auftrag gibt es keine Halte', () => {
    const controller = missionCity();
    // Eine Liste aller Stadtlager wäre hier keine Antwort auf „wo muss ich
    // hin" — sie wäre nur eine Liste.
    expect(controller.getMissionStops()).toEqual([]);
  });

  it('kein Save-Feld: das Schema bleibt unverändert und `stops` steht in keinem Auftrag', () => {
    const controller = missionCity();
    startAnyDriveMission(controller);
    // Die eigentliche Aussage von A6: Das Modell kam OHNE Migration aus.
    expect(SCHEMA_VERSION).toBe(33);
    const active = controller.state.activities.active;
    if (active) expect(Object.keys(active)).not.toContain('stops');
  });

  it('Quelle, Ziele und Lager erscheinen mit ihrer Rolle — jeder Ort genau einmal', () => {
    const controller = missionCity();
    // Kein `if (!started) return` — ein Test, der sich selbst überspringt, misst
    // nichts. Findet die Fixture keine fahrbare Mission, ist DAS der Befund.
    expect(startAnyDriveMission(controller)).toBeDefined();
    const stops = controller.getMissionStops();
    expect(stops.length).toBeGreaterThan(0);

    // Kein Ort doppelt: Ein Lager, das zugleich Quelle ist, ist EIN Halt.
    const ids = stops.map((stop) => stop.buildingId);
    expect(new Set(ids).size).toBe(ids.length);

    // Jedes offene Ziel des Auftrags ist ein Halt mit der Rolle `target`.
    const active = controller.state.activities.active!;
    for (const target of active.targets) {
      const stop = stops.find((candidate) => candidate.buildingId === target.buildingId);
      expect(stop).toBeDefined();
      // Die Quelle darf ein Ziel überschreiben, wenn es dasselbe Gebäude ist —
      // sonst muss die Rolle stimmen.
      if (stop!.buildingId !== active.sourceBuildingId) expect(stop!.role).toBe('target');
    }

    // Jedes Stadtlager taucht auf; die Reihenfolge ist die der Simulation.
    for (const site of controller.derived.storageSites) {
      expect(ids).toContain(site.buildingId);
    }
  });

  it('die Menge an einem Lager ist der Bestand DORT, nicht die Bilanz der Stadt (D-052)', () => {
    const controller = missionCity();
    expect(startAnyDriveMission(controller)).toBeDefined();
    const stops = controller.getMissionStops();
    for (const stop of stops) {
      if (stop.role !== 'storage' || !stop.resource) continue;
      expect(stop.amount).toBe(stockAt(controller.state, stop.buildingId, stop.resource));
      // Der Beleg, dass es NICHT die Bilanz ist: Die Stadt führt mehr, als an
      // einem einzelnen Ort liegt (drei Lager teilen sich denselben Vorrat).
      expect(stop.amount!).toBeLessThanOrEqual(controller.state.resources[stop.resource]);
    }
  });

  it('`open` lässt erledigte Ziele und leere Lager weg — der Filter liegt in der Simulation', () => {
    const controller = missionCity();
    expect(startAnyDriveMission(controller)).toBeDefined();
    const active = controller.state.activities.active!;
    const first = active.targets[0];
    if (first) first.done = true;

    const open = controller.getMissionStops({ open: true });
    if (first) expect(open.map((stop) => stop.buildingId)).not.toContain(first.buildingId);
    for (const stop of open) {
      if (stop.role === 'storage') expect(stop.amount ?? 0).toBeGreaterThan(0);
    }
    // Dieselbe Regel als reine Funktion — die Oberfläche darf sie nicht selbst
    // erfinden, sonst heißt „nützlich" in jedem Panel etwas anderes.
    expect(openMissionStops(controller.getMissionStops())).toEqual(open);
  });

  it('ein abgerissenes Gebäude verschwindet sofort aus den Halten', () => {
    const controller = missionCity();
    expect(startAnyDriveMission(controller)).toBeDefined();
    // Ein Lagerhaus, nicht das Rathaus: Das ist `unique` und lässt sich nicht
    // abreißen — der Test würde dann nichts entfernen und trotzdem grün wirken
    // wollen. Deshalb steht das Ergebnis des Commands mit im Test.
    const site = controller.derived.storageSites.find(
      (candidate) => candidate.defId === 'warehouse'
        && candidate.buildingId !== controller.state.activities.active?.sourceBuildingId,
    );
    expect(site).toBeDefined();
    expect(controller.getMissionStops().map((stop) => stop.buildingId)).toContain(site!.buildingId);

    expect(controller.demolishBuilding(site!.buildingId)).toEqual({ ok: true });
    refreshDerived(controller);
    // GENAU DAS ist der Grund gegen ein Save-Feld: Hier musste niemand etwas
    // nachziehen. Eine persistierte Halteliste hätte den Ort behalten, und der
    // Spieler wäre zu einem Gebäude gefahren, das es nicht mehr gibt.
    expect(controller.getMissionStops().map((stop) => stop.buildingId)).not.toContain(site!.buildingId);
  });
});
