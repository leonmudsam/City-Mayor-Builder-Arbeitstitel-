import { describe, expect, it } from 'vitest';
import { newController, setLevel, flattenTerrain, nearTownHall, T0 } from './helpers.ts';
import { stockAt } from '../src/game/economy/stockLedger.ts';
import type { GameController } from '../src/game/commands/controller.ts';

// § Stadtarbeit 2.0 / D-057 — DIE TRAGLAST IST PHYSISCH.
//
// Vorher reservierte der Start immer `costPerTarget × Ziele`; `capacity` stand
// nur in Warntexten, der Wagen trug beliebig viel, und „Nachladen" war eine
// Beschriftung ohne Vorgang. Jetzt passt auf den Wagen, was auf ihn passt.
//
// ZWEI DINGE, DIE DIESER TEST BEWUSST ANDERS MACHT als sein erster Entwurf:
//
//   1. Er steigt NIRGENDS still aus. Der erste Entwurf hatte `if (… !== 'ready')
//      return` — `getActivitySelectionStatus()` liefert aber `'ok'`. Alle
//      Zusicherungen waren damit tot, der Test grün und wertlos. Wo eine
//      Voraussetzung fehlt, scheitert er jetzt laut.
//   2. Er verengt die Traglast ABSICHTLICH. Gemessen: Für `material_delivery`
//      ist das kleinste ERLAUBTE Fahrzeug der 500er-Truck, die ganze Tour wiegt
//      135–180 Einheiten — die Kapazität bindet in der ausgelieferten Config
//      also nie. Getestet wird der Mechanismus, nicht das Balancing; die
//      Balancing-Lücke ist im Frühspiel-Audit vermerkt, nicht hier versteckt.

const at = (dx: number, dy: number) => nearTownHall(dx, dy);
const DELIVERY = 'material_delivery';

/** Kleine Stadt mit Straße, angebundenem Lagerhaus und genug Lieferzielen. */
function deliveryCity(): { controller: GameController; warehouseId: string } {
  const { controller } = newController();
  setLevel(controller, 20);
  flattenTerrain(controller);
  controller.state.resources = { money: 10_000_000, wood: 500_000, stone: 500_000, food: 500_000, freshwater: 500_000 };
  for (let dx = 0; dx <= 24; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
  expect(controller.placeBuilding('warehouse', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
  for (let dx = 8; dx <= 22; dx += 3) controller.placeBuilding('house_small', at(dx, 6).x, at(dx, 6).y);
  controller.update(T0 + 3_600_000, false);
  // Vorrat KLEINER als die Lagerkapazität. Mit 500.000 Holz und 1.000 Kapazität
  // füllt der Abgleich aus D-052 jedes Lager sofort wieder randvoll — eine
  // Entnahme wäre dann unsichtbar, und der Test hätte den Abgleich gemessen
  // statt den Vorgang.
  controller.state.resources = { ...controller.state.resources, wood: 600, stone: 400, food: 300, freshwater: 300 };
  controller.update(T0 + 3_601_000, false);

  // Ohne Straßenanschluss hat ein Lagerhaus keine Lagerwirkung (D-047) und
  // taucht in `storageSites` nicht auf — dann misst der Test nichts.
  const site = controller.derived.storageSites.find((entry) => entry.defId === 'warehouse');
  expect(site, 'Lagerhaus muss ein Lagerplatz sein — sonst prüft dieser Test nichts').toBeDefined();
  return { controller, warehouseId: site!.buildingId };
}

/** Startet die Liefermission mit künstlich auf EINE Ladung verengter Traglast. */
function startTightRun(controller: GameController): { perTarget: number } {
  const def = controller.config.activities.activities.find((activity) => activity.id === DELIVERY);
  expect(def, `Aktivität ${DELIVERY} muss existieren`).toBeDefined();
  const perTarget = Object.values(def!.costPerTarget!).reduce((sum, value) => sum + (value ?? 0), 0);
  expect(perTarget).toBeGreaterThan(0);

  let started = false;
  for (const vehicle of controller.config.activities.vehicles) {
    controller.selectActivity(DELIVERY);
    // Genau EINE Lieferung passt drauf — die Enge ist der Prüfgegenstand.
    vehicle.capacity = perTarget;
    if (controller.startActivity(DELIVERY, undefined, { vehicle: vehicle.id }).ok) {
      started = true;
      break;
    }
  }
  expect(started, 'Mission muss startbar sein — sonst prüft dieser Test nichts').toBe(true);
  return { perTarget };
}

describe('Nachladen unterwegs — die Traglast begrenzt wirklich', () => {
  it('lädt höchstens eine Wagenladung und meldet den Nachladebedarf', () => {
    const { controller } = deliveryCity();
    const { perTarget } = startTightRun(controller);

    const status = controller.getActivityCargoStatus();
    expect(status).toBeDefined();
    expect(status!.perTarget).toBe(perTarget);
    expect(status!.carriedLoads).toBe(1);
    expect(status!.onboard).toBe(perTarget);
    expect(status!.openTargets).toBeGreaterThan(1);
    // Mehr Stopps als Ladungen ⇒ es MUSS unterwegs nachgeladen werden.
    expect(status!.needsReload).toBe(true);
  });

  it('verweigert die Auslieferung mit leerem Wagen statt Ware zu erfinden', () => {
    const { controller } = deliveryCity();
    startTightRun(controller);
    const open = () => controller.state.activities.active!.targets.filter((t) => !t.done);

    // Erster Stopp: die Ladung an Bord deckt ihn.
    expect(controller.progressActivity(open()[0]!.buildingId)).toEqual({ ok: true });
    // Zweiter Stopp: der Wagen ist leer — das ist jetzt eine Aussage, kein Freibrief.
    expect(controller.getActivityCargoStatus()!.onboard).toBe(0);
    expect(controller.progressActivity(open()[0]!.buildingId)).toEqual({ ok: false, error: 'no_cargo' });
  });

  it('lädt an einem Lager nach und nimmt die Ware GENAU DORT weg', () => {
    const { controller, warehouseId } = deliveryCity();
    startTightRun(controller);
    const open = () => controller.state.activities.active!.targets.filter((t) => !t.done);
    expect(controller.progressActivity(open()[0]!.buildingId)).toEqual({ ok: true });

    const before = controller.getActivityCargoStatus()!;
    expect(before.missingLoads).toBe(1);
    const resource = before.resource;
    // Kein künstlich gesetzter Bestand: Der Abgleich aus D-052 verteilt
    // `state.resources` ohnehin auf die Lagerplätze. Ein handgesetztes Inventar
    // würde beim nächsten `notify` zurückgerechnet — und der Test prüfte dann
    // seinen eigenen Eingriff statt den Vorgang.
    const storeBefore = stockAt(controller.state, warehouseId, resource);
    expect(storeBefore, 'Das Lager muss Ware führen — sonst prüft dieser Test nichts').toBeGreaterThan(0);

    expect(controller.reloadActivityCargo(warehouseId)).toEqual({ ok: true });

    const after = controller.getActivityCargoStatus()!;
    expect(after.onboard).toBe(before.onboard + before.perTarget);
    // D-052: Der Bestand wird an DIESEM Ort kleiner, nicht im Stadtkonto.
    // Abgezogen wird der Anteil DIESER Ressource — `material_delivery` kostet
    // 30 Holz UND 15 Stein; gegen die Summe zu prüfen wäre schlicht falsch.
    const def = controller.config.activities.activities.find((activity) => activity.id === DELIVERY)!;
    const perResource = def.costPerTarget![resource] ?? 0;
    expect(perResource).toBeGreaterThan(0);
    expect(stockAt(controller.state, warehouseId, resource)).toBe(storeBefore - perResource);
    // Und danach liefert der Wagen wieder aus.
    expect(controller.progressActivity(open()[0]!.buildingId)).toEqual({ ok: true });
  });

  it('lädt nicht an einem Gebäude ohne Lagerwirkung', () => {
    const { controller } = deliveryCity();
    startTightRun(controller);
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small');
    expect(house).toBeDefined();
    // Ein Wohnhaus ist kein Lager — Farm, Sägewerk und Pumpwerk übrigens auch
    // nicht (die ehrliche Grenze aus D-052).
    expect(controller.reloadActivityCargo(house!.id)).toEqual({ ok: false, error: 'invalid' });
    expect(controller.reloadActivityCargo('gibt-es-nicht')).toEqual({ ok: false, error: 'invalid' });
  });

  it('gibt ohne laufenden Auftrag keine Ladung heraus', () => {
    const { controller } = newController();
    expect(controller.getActivityCargoStatus()).toBeUndefined();
    expect(controller.reloadActivityCargo('egal')).toEqual({ ok: false, error: 'invalid' });
  });
});
