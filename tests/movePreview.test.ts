import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, setLevel, T0, townHallOf } from './helpers.ts';
import type { GameController } from '../src/game/commands/controller.ts';

// § Core Gameplay G2 ④ — Verschieben als Entwurf.
//
// Befund, der diesen Test nötig macht: `ThreeMapRenderer.setMoving()` war ein
// No-op, dessen Kommentar auf den 2D-/Iso-Modus verwies — den es seit
// Ausbaustufe 2.0 nicht mehr gibt. 14 der 34 Gebäude tragen `canRelocate`
// (darunter Sägewerk, Steinbruch und Farm, die laut A6/D-046 umziehen MÜSSEN,
// weil Stein nie nachwächst); ihr „Versetzen"-Knopf führte ins Leere.
//
// Jetzt zeigt der Ghost den Umzug vorher. Damit Vorschau und Klick nie
// auseinanderlaufen, teilen sich `moveDiagnostics` und `moveBuilding` EINE
// Prüfung (`evaluateMove`) — dieselbe Disziplin wie D-042/D-047. Diese Suite
// prüft genau diese Deckungsgleichheit, nicht die Optik.

/** Zwei Controller im selben Zustand: einer zum Fragen, einer zum Ausführen. */
function pair(): { ask: GameController; act: GameController } {
  return { ask: relocatable(), act: relocatable() };
}

function relocatable(): GameController {
  const { controller } = newController();
  flattenTerrain(controller);
  return controller;
}

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

describe('§ G2 ④ — moveDiagnostics und moveBuilding urteilen gleich', () => {
  it('ein Umzug um eine Kachel ist gültig — die eigene Grundfläche blockiert nicht', () => {
    const { ask, act } = pair();
    const target = at(1, 0);
    const preview = ask.moveDiagnostics(townHallOf(ask).id, target.x, target.y)!;
    expect(preview.valid).toBe(true);
    expect(preview.reason).toBeUndefined();
    expect(act.moveBuilding(townHallOf(act).id, target.x, target.y)).toEqual({ ok: true });
  });

  it('genau dafür braucht es `ignoreBuildingId` — ohne es meldet dieselbe Kachel `occupied`', () => {
    const controller = relocatable();
    controller.config.features.moveBuildings = true;
    controller.placeBuilding('road', at(5, 5).x, at(5, 5).y);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    const target = at(4, 6); // überlappt die alte Grundfläche
    // Ein Ghost mit eigener Prüfung würde hier rot zeigen, obwohl der Command zusagt.
    expect(controller.placementDiagnostics('house_small', target.x, target.y)!.reason).toBe('occupied');
    expect(controller.moveDiagnostics(house.id, target.x, target.y)!.valid).toBe(true);
    expect(controller.moveBuilding(house.id, target.x, target.y)).toEqual({ ok: true });
    controller.config.features.moveBuildings = false;
  });

  it('meldet das aktuelle Grundstück als unverändert — der Klick kostet dort nichts', () => {
    const controller = relocatable();
    const hall = townHallOf(controller);
    const spot = { x: hall.x, y: hall.y };
    const money = controller.state.resources.money;
    const preview = controller.moveDiagnostics(hall.id, spot.x, spot.y)!;
    expect(preview.unchanged).toBe(true);
    expect(preview.valid).toBe(true);
    expect(controller.moveBuilding(hall.id, spot.x, spot.y)).toEqual({ ok: true });
    expect({ x: hall.x, y: hall.y }).toEqual(spot); // steht weiterhin da, wo es stand
    expect(controller.state.resources.money).toBe(money);
  });

  it('nennt dieselben Ablehnungsgründe wie der Command — über einen ganzen Streifen', () => {
    let rejected = 0;
    let accepted = 0;
    for (let dx = -20; dx <= 20; dx += 5) {
      for (let dy = -20; dy <= 20; dy += 5) {
        const { ask, act } = pair();
        const target = at(dx, dy);
        const preview = ask.moveDiagnostics(townHallOf(ask).id, target.x, target.y)!;
        const result = act.moveBuilding(townHallOf(act).id, target.x, target.y);
        expect(result.ok).toBe(preview.valid);
        if (result.ok) accepted++;
        else {
          rejected++;
          expect(result.error).toBe(preview.reason);
        }
      }
    }
    // Der Streifen muss beide Ausgänge enthalten, sonst prüft er nur einen.
    expect(accepted).toBeGreaterThan(0);
    expect(rejected).toBeGreaterThan(0);
  });

  it('gibt es kein Gebäude, gibt es auch keine Vorschau', () => {
    const controller = relocatable();
    expect(controller.moveDiagnostics('gibt-es-nicht', at(3, 3).x, at(3, 3).y)).toBeUndefined();
    expect(controller.moveBuilding('gibt-es-nicht', at(3, 3).x, at(3, 3).y)).toEqual({ ok: false, error: 'not_found' });
  });
});

describe('§ G2 ④ — die Gebühr steht VOR dem Klick', () => {
  /** Ein versetzbares Gebäude mit echter Gebühr (Bürgermeisterhaus, 3.000). */
  function withMayorHouse(): { controller: GameController; houseId: string } {
    const { controller } = newController();
    flattenTerrain(controller);
    setLevel(controller, 3);
    for (let dx = 5; dx <= 14; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    controller.placeBuilding('mayor_house', at(5, 6).x, at(5, 6).y);
    controller.update(T0 + 61_000); // Bau abschließen
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'mayor_house')!;
    return { controller, houseId: house.id };
  }

  it('nennt die Gebühr, die der Bestätigungsklick abbucht', () => {
    const { controller, houseId } = withMayorHouse();
    const preview = controller.moveDiagnostics(houseId, at(8, 6).x, at(8, 6).y)!;
    expect(preview.valid).toBe(true);
    expect(preview.relocationCost).toEqual({ money: 3_000 });
    const before = controller.state.resources.money;
    expect(controller.moveBuilding(houseId, at(8, 6).x, at(8, 6).y)).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(before - 3_000);
  });

  it('reicht das Budget nicht, ist der Ghost ROT statt grün', () => {
    const { controller, houseId } = withMayorHouse();
    controller.state.resources.money = 500;
    const target = at(8, 6);
    const preview = controller.moveDiagnostics(houseId, target.x, target.y)!;
    // Das ist der Kern von G2 ④: `validatePlacement` allein hielte die Kachel für
    // gültig — der Command lehnt trotzdem ab. Die Vorschau muss dem Command folgen.
    expect(controller.placementDiagnostics('mayor_house', target.x, target.y, houseId)!.valid).toBe(true);
    expect(preview.valid).toBe(false);
    expect(preview.reason).toBe('insufficient');
    expect(controller.moveBuilding(houseId, target.x, target.y)).toEqual({ ok: false, error: 'insufficient' });
  });

  it('ohne Versetzbarkeit ist die Vorschau ungültig statt still', () => {
    const { controller } = newController();
    flattenTerrain(controller);
    controller.placeBuilding('road', at(5, 5).x, at(5, 5).y);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    expect(controller.config.features.moveBuildings).toBe(false);
    const preview = controller.moveDiagnostics(house.id, at(6, 6).x, at(6, 6).y)!;
    expect(preview.valid).toBe(false);
    expect(preview.reason).toBe('feature_disabled');
  });

  it('das Dev-Flag versetzt gebührenfrei — und die Vorschau sagt das auch', () => {
    const controller = relocatable();
    controller.config.features.moveBuildings = true;
    setLevel(controller, 3);
    for (let dx = 5; dx <= 14; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    controller.placeBuilding('mayor_house', at(5, 6).x, at(5, 6).y);
    controller.update(T0 + 61_000);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'mayor_house')!;
    const before = controller.state.resources.money;
    const preview = controller.moveDiagnostics(house.id, at(8, 6).x, at(8, 6).y)!;
    expect(preview.valid).toBe(true);
    expect(preview.relocationCost).toBeUndefined();
    expect(controller.moveBuilding(house.id, at(8, 6).x, at(8, 6).y)).toEqual({ ok: true });
    expect(controller.state.resources.money).toBe(before);
    controller.config.features.moveBuildings = false;
  });
});

describe('§ G2 ④ — der Umzug erbt die Warnungen der Bauvorschau', () => {
  it('warnt, wenn das Ziel den Straßenanschluss verliert', () => {
    const controller = relocatable();
    controller.config.features.moveBuildings = true;
    controller.placeBuilding('road', at(5, 5).x, at(5, 5).y);
    controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;

    const far = controller.moveDiagnostics(house.id, at(-14, -12).x, at(-14, -12).y)!;
    // Erlaubt, aber wirkungslos (D-047) — beim Versetzen genauso wie beim Bauen.
    expect(far.valid).toBe(true);
    expect(far.requiresRoad).toBe(true);
    expect(far.roadAccess).toBe(false);
    expect(far.roadTiles).toEqual([]);

    const road = [...controller.derived.roadNetwork][0]!.split(',').map(Number);
    const near = controller.moveDiagnostics(house.id, road[0]!, road[1]! - 3)!;
    expect(near.roadAccess).toBe(true);
    expect(near.roadTiles.length).toBeGreaterThan(0);
    controller.config.features.moveBuildings = false;
  });
});
