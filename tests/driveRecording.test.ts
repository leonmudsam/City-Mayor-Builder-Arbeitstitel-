import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, setLevel, flattenTerrain, T0 } from './helpers.ts';
import type { GameController } from '../src/game/commands/controller.ts';
import { modeRewardFactor } from '../src/game/activities/transportOrder.ts';

// § Stadtarbeit-Overhaul 2.0, Phasen 1+3 (D-054) — „Die Route wird NICHT
// gezeichnet. Die Route wird gefahren."
//
// Zwei Regeln stehen hier auf dem Prüfstand, und beide haben vorher ANDERS
// gegolten:
//   1. Jedes offene Ziel zählt, in der Reihenfolge, in der der Spieler es
//      anfährt (vorher: ausschließlich `targets.find(!done)`).
//   2. Die gefahrene Strecke IST die Route des Auftrags — sie wird beim Fahren
//      aufgezeichnet (vorher: vom Planer vorberechnet und mitgeschickt).
//
// Aufgezeichnet wird nur, was das Straßennetz hergibt: `recordActivityDrive`
// liest dieselbe `derived.roadNetwork`, aus der auch die Fahrt selbst ihre
// Befahrbarkeit zieht — kein zweiter Verkehrsgraph (§2/§8).

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

function deliveryCity(): GameController {
  const { controller } = newController();
  setLevel(controller, 20);
  flattenTerrain(controller);
  controller.state.resources = { money: 10_000_000, wood: 100_000, stone: 100_000, food: 100_000, freshwater: 100_000 };
  for (let dx = 0; dx <= 18; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
  controller.placeBuilding('warehouse', at(0, 6).x, at(0, 6).y);
  controller.placeBuilding('house_small', at(6, 6).x, at(6, 6).y);
  controller.placeBuilding('house_small', at(12, 6).x, at(12, 6).y);
  controller.placeBuilding('house_small', at(17, 6).x, at(17, 6).y);
  controller.update(T0 + 3_600_000, false);
  return controller;
}

/** Startet den ersten verfügbaren Fahrauftrag ausdrücklich zum Selbstfahren. */
function startManualDrive(controller: GameController): string | undefined {
  for (const entry of controller.getActivityBoard()) {
    if (!entry.def.drive || !entry.available) continue;
    const targets = controller.getActivityPlanningContext(entry.def.id)?.targetBuildingIds ?? [];
    if (controller.startActivity(entry.def.id, targets, { mode: 'manual' }).ok) return entry.def.id;
  }
  return undefined;
}

/** Startet den ersten verfügbaren Fahrauftrag ohne jede Wegvorgabe. */
function startAnyDrive(controller: GameController): string | undefined {
  for (const entry of controller.getActivityBoard()) {
    if (!entry.def.drive || !entry.available) continue;
    if (controller.startActivity(entry.def.id).ok) return entry.def.id;
  }
  return undefined;
}

describe('Stadtarbeit 2.0 — die Route entsteht beim Fahren', () => {
  it('startet einen Fahrauftrag ganz ohne Route', () => {
    const controller = deliveryCity();
    const defId = startAnyDrive(controller);
    expect(defId, 'kein Fahrauftrag verfügbar — Fixture prüfen').toBeTruthy();
    const active = controller.state.activities.active!;
    // Kein vorgezeichneter Weg: DAS ist der Kern des Auftrags (§4/§13).
    expect(active.plannedRoadPath).toBeUndefined();
    expect(active.targets.length).toBeGreaterThanOrEqual(2);
  });

  it('zeichnet befahrene Straßenkacheln auf und ignoriert alles daneben', () => {
    const controller = deliveryCity();
    expect(startAnyDrive(controller)).toBeTruthy();
    const road = (dx: number) => ({ x: at(dx, 5).x, y: at(dx, 5).y });

    expect(controller.recordActivityDrive([road(0)])).toEqual({ ok: true });
    expect(controller.recordActivityDrive([road(1)])).toEqual({ ok: true });
    // Dieselbe Kachel erneut: Stehen ist kein Fahren.
    controller.recordActivityDrive([road(1)]);
    // Wiese neben der Straße: wird nicht Teil der Route.
    controller.recordActivityDrive([{ x: at(2, 9).x, y: at(2, 9).y }]);
    controller.recordActivityDrive([road(2)]);

    const path = controller.state.activities.active!.plannedRoadPath!;
    expect(path).toEqual([road(0), road(1), road(2)]);
  });

  it('rät keinen Sprung: eine unerreichbare Kachel bleibt draußen', () => {
    const controller = deliveryCity();
    expect(startAnyDrive(controller)).toBeTruthy();
    controller.recordActivityDrive([{ x: at(0, 5).x, y: at(0, 5).y }]);
    // Sechs Kacheln weiter — dazwischen wird nichts erfunden (§18).
    controller.recordActivityDrive([{ x: at(6, 5).x, y: at(6, 5).y }]);
    expect(controller.state.activities.active!.plannedRoadPath).toEqual([{ x: at(0, 5).x, y: at(0, 5).y }]);
  });

  it('ergänzt bei einer diagonal geschnittenen Kurve die Straßenkachel dazwischen', () => {
    const controller = deliveryCity();
    // Zweite Reihe, damit es eine echte Ecke gibt.
    for (let dy = 6; dy <= 8; dy++) {
      expect(controller.placeBuilding('road', at(9, dy).x, at(9, dy).y)).toEqual({ ok: true });
    }
    controller.update(T0 + 7_200_000, false);
    expect(startAnyDrive(controller)).toBeTruthy();
    controller.recordActivityDrive([{ x: at(8, 5).x, y: at(8, 5).y }]);
    // Diagonalschritt von (8,5) nach (9,6): die Ecke (9,5) ist Straße.
    controller.recordActivityDrive([{ x: at(9, 6).x, y: at(9, 6).y }]);
    const path = controller.state.activities.active!.plannedRoadPath!;
    expect(path).toEqual([
      { x: at(8, 5).x, y: at(8, 5).y },
      { x: at(9, 5).x, y: at(9, 5).y },
      { x: at(9, 6).x, y: at(9, 6).y },
    ]);
  });

  it('nimmt ohne laufenden Auftrag nichts auf', () => {
    const controller = deliveryCity();
    expect(controller.recordActivityDrive([{ x: at(0, 5).x, y: at(0, 5).y }])).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('protokolliert die tatsächlich gefahrene Zielreihenfolge', () => {
    const controller = deliveryCity();
    expect(startAnyDrive(controller)).toBeTruthy();
    const targets = controller.getActivityTargets().map((target) => target.buildingId);
    expect(targets.length).toBeGreaterThanOrEqual(3);
    // Letztes Ziel zuerst, dann das mittlere: früher gab beides `invalid`.
    expect(controller.progressActivity(targets.at(-1)!)).toEqual({ ok: true });
    expect(controller.progressActivity(targets[1]!)).toEqual({ ok: true });
    const done = controller
      .getActivityTargets()
      .filter((target) => target.done)
      .map((target) => target.buildingId);
    expect(done).toEqual([targets.at(-1), targets[1]]);
  });
});

/**
 * § P6 (D-061) — DEN REST FAHREN LASSEN.
 *
 * D-050 hat die Ausführungsart eingefroren, damit der Aufschlag nicht nach der
 * bequemen Hälfte zuschaltbar ist. Der Riegel traf aber auch den ehrlichen
 * Fall: Wer aussteigt, ließ eine Tour zurück, die niemand mehr fährt. Erlaubt
 * ist deshalb genau ein Wechsel, und nur in eine Richtung — er KOSTET den
 * Aufschlag für die ganze Tour.
 */
describe('Übergabe an die Stadt', () => {
  it('schaltet eine manuelle Tour auf automatisch — und nur in diese Richtung', () => {
    const controller = deliveryCity();
    const defId = startManualDrive(controller);
    expect(defId, 'kein Fahrauftrag verfügbar — Fixture prüfen').toBeTruthy();
    expect(controller.state.activities.active?.mode).toBe('manual');

    expect(controller.handOverActivityDrive()).toEqual({ ok: true });
    expect(controller.state.activities.active?.mode).toBe('auto');

    // Zurück ans Steuer gibt es nicht — sonst wäre der Aufschlag am Ende doch
    // wieder zuschaltbar.
    expect(controller.handOverActivityDrive().ok).toBe(false);
  });

  it('lehnt ohne laufenden Auftrag ab, statt still nichts zu tun', () => {
    const controller = deliveryCity();
    expect(controller.handOverActivityDrive()).toEqual({ ok: false, error: 'invalid' });
  });

  it('kostet den Aufschlag: die Prämie folgt dem Modus zum Zeitpunkt der Auszahlung', () => {
    const controller = deliveryCity();
    const bonus = controller.config.activities.manualDriveBonusFactor;
    expect(modeRewardFactor('manual', bonus)).toBeGreaterThan(modeRewardFactor('auto', bonus));
  });
});
