import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, setLevel, flattenTerrain, T0 } from './helpers.ts';
import { activitiesConfig } from '../src/game/config/activities.config.ts';
import type { GameController } from '../src/game/commands/controller.ts';

// § A6 — Fahr-Minispiele (Stadtarbeit). Der Fahrmodus selbst lebt rein im
// Renderer (Input/Kamera, nicht unit-testbar); die SIM-Seite ist dieselbe
// Aktivitäts-Maschinerie wie Klick-Lieferungen, nur mit expliziter Zielauswahl
// (targetDefIds/targetCategories) und einem `drive`/`vehicle`-Flag. Diese Tests
// decken genau diese Sim-Seite ab: Zielauswahl, Belohnung, Gating.

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

function richCity(level = 20): GameController {
  const { controller } = newController();
  setLevel(controller, level);
  flattenTerrain(controller);
  controller.state.resources = { money: 10_000_000, wood: 100_000, stone: 100_000, food: 100_000, freshwater: 100_000, planks: 400, cut_stone: 400 };
  return controller;
}

function roadRow(controller: GameController, fromDx: number, toDx: number, dy = 5): void {
  for (let dx = fromDx; dx <= toDx; dx++) controller.placeBuilding('road', at(dx, dy).x, at(dx, dy).y);
}

/** Ids der aktuell laufenden Aktivitäts-Ziele. */
function targetIds(controller: GameController): string[] {
  return controller.getActivityTargets().map((t) => t.buildingId);
}

/** DefId eines Gebäude-Instanz-Ids. */
function defOf(controller: GameController, id: string): string {
  return controller.state.buildings[id]!.defId;
}

describe('A6 Fahr-Minispiele — Konfiguration', () => {
  it('markiert alle acht datengetriebenen Fahr-Missionen mit ihrem Standardfahrzeug', () => {
    const byId = new Map(activitiesConfig.activities.map((a) => [a.id, a]));
    const expected: Record<string, string> = {
      food_delivery: 'van',
      fire_response: 'fire_truck',
      log_transport: 'logging_truck',
      police_patrol: 'police_car',
      material_delivery: 'flatbed',
      water_delivery: 'van',
      market_restock: 'refrigerated_truck',
      park_supply: 'flatbed',
    };
    for (const [id, vehicle] of Object.entries(expected)) {
      const def = byId.get(id);
      expect(def, `Aktivität ${id} fehlt`).toBeTruthy();
      expect(def!.drive).toBe(true);
      expect(def!.vehicle).toBe(vehicle);
    }
    // Und: keine andere Aktivität behauptet fälschlich, eine Fahrmission zu sein.
    const driveIds = activitiesConfig.activities.filter((a) => a.drive).map((a) => a.id).sort();
    expect(driveIds).toEqual(Object.keys(expected).sort());
  });

  it('stellt mehrere echte Straßenfahrzeuge sowie sichtbare Zukunftsträger bereit', () => {
    const food = activitiesConfig.activities.find((activity) => activity.id === 'food_delivery')!;
    expect(food.vehicleOptions).toEqual(['van', 'refrigerated_truck', 'medium_truck', 'large_truck']);
    const ids = activitiesConfig.vehicles.map((vehicle) => vehicle.id);
    expect(ids).toEqual(expect.arrayContaining(['van', 'medium_truck', 'large_truck', 'refrigerated_truck', 'heavy_transporter']));
    expect(activitiesConfig.vehicles.filter((vehicle) => vehicle.future).map((vehicle) => vehicle.id)).toEqual([
      'freight_train',
      'cargo_plane',
    ]);
  });
});

describe('A6 Holztransport — Ziele nur Lager', () => {
  it('wählt ausschließlich Lager (warehouse/depot), niemals Häuser', () => {
    const controller = richCity();
    roadRow(controller, 0, 18);
    expect(controller.placeBuilding('sawmill', at(0, 6).x, at(0, 6).y)).toEqual({ ok: true });
    expect(controller.placeBuilding('warehouse', at(5, 6).x, at(5, 6).y)).toEqual({ ok: true });
    expect(controller.placeBuilding('depot', at(10, 6).x, at(10, 6).y)).toEqual({ ok: true });
    expect(controller.placeBuilding('house_small', at(16, 6).x, at(16, 6).y)).toEqual({ ok: true });
    controller.update(T0 + 3_600_000, false); // Bau abschließen

    const money0 = controller.state.resources.money;
    const wood0 = controller.state.resources.wood;
    const rngBeforePlan = controller.state.rngSeed;
    const plan = controller.getActivityRoutePlan('log_transport');
    expect(plan).toBeTruthy();
    expect(controller.state.rngSeed).toBe(rngBeforePlan); // reine UI-Vorschau
    const plannedOrder = [...plan!.targetBuildingIds].reverse();
    expect(controller.startActivity('log_transport', plannedOrder)).toEqual({ ok: true });

    const targets = targetIds(controller);
    expect(targets).toEqual(plannedOrder);
    expect(targets.length).toBeGreaterThanOrEqual(2);
    for (const id of targets) expect(['warehouse', 'depot']).toContain(defOf(controller, id));

    const rerouted = [...targets].reverse();
    expect(controller.setActiveActivityRoute(rerouted)).toEqual({ ok: true });
    expect(targetIds(controller)).toEqual(rerouted);
    // § Overhaul 2.0 (§5, D-054): Die Reihenfolge gehört dem Spieler. Wer das
    // zweite Ziel zuerst anfährt, liefert dort — vorher gab das `invalid`, und
    // die Liste des Planers war damit Pflicht. Danach steht die TATSÄCHLICH
    // gefahrene Reihenfolge vorne in der Liste.
    expect(controller.progressActivity(rerouted[1]!)).toEqual({ ok: true });
    expect(targetIds(controller)[0]).toBe(rerouted[1]);
    // Ein bereits erledigtes Ziel zählt nicht doppelt.
    expect(controller.progressActivity(rerouted[1]!)).toEqual({ ok: false, error: 'invalid' });
    for (const id of rerouted) controller.progressActivity(id);
    expect(controller.state.activities.active).toBeUndefined();
    expect(controller.state.resources.money).toBeGreaterThan(money0);
    // costPerTarget wood:40 je Ziel wird abgebucht.
    expect(controller.state.resources.wood).toBe(wood0 - 40 * targets.length);
  });

  it('ist ohne Lager nicht startbar (zu wenig Ziele)', () => {
    const controller = richCity();
    roadRow(controller, 0, 8);
    controller.placeBuilding('sawmill', at(0, 6).x, at(0, 6).y);
    controller.update(T0 + 3_600_000, false);
    expect(controller.startActivity('log_transport')).toEqual({ ok: false, error: 'invalid' });
  });
});

describe('Stadtarbeit 2D — manueller Startplan', () => {
  it('validiert und persistiert Fahrzeug sowie exakte Straßenkette am Command-Rand', () => {
    const controller = richCity();
    roadRow(controller, 0, 20);
    expect(controller.placeBuilding('farm', at(0, 6).x, at(0, 6).y)).toEqual({ ok: true });
    for (const dx of [7, 12, 17]) {
      expect(controller.placeBuilding('house_small', at(dx, 6).x, at(dx, 6).y)).toEqual({ ok: true });
    }
    controller.update(T0 + 3_600_000, false);

    const preview = controller.getActivityRoutePlan('food_delivery');
    expect(preview).toBeDefined();
    const targets = preview!.targetBuildingIds;
    const reference = controller.analyseActivityRoute('food_delivery', targets);
    expect(reference?.roadCoverage).toBe(1);
    const roadPath = reference!.segments.flatMap((segment, index) =>
      index === 0 ? segment.path : segment.path.slice(1),
    );
    expect(
      controller.startActivity('food_delivery', targets, {
        vehicle: 'refrigerated_truck',
        roadPath,
      }),
    ).toEqual({ ok: true });
    expect(controller.state.activities.active?.vehicle).toBe('refrigerated_truck');
    expect(controller.state.activities.active?.plannedRoadPath).toEqual(roadPath);
  });
});

describe('A6 Feuerwehr — Ziele Wohn/Gewerbe, kein Materialverbrauch', () => {
  it('liefert Belohnung + Zufriedenheits-Buff ohne Ressourcenkosten', () => {
    const controller = richCity();
    roadRow(controller, 0, 18);
    expect(controller.placeBuilding('fire_station', at(0, 6).x, at(0, 6).y)).toEqual({ ok: true });
    for (const dx of [6, 10, 14]) expect(controller.placeBuilding('house_small', at(dx, 6).x, at(dx, 6).y)).toEqual({ ok: true });
    controller.update(T0 + 3_600_000, false);

    const money0 = controller.state.resources.money;
    const wood0 = controller.state.resources.wood;
    const buffs0 = controller.state.buffs.length;
    expect(controller.startActivity('fire_response')).toEqual({ ok: true });

    const targets = targetIds(controller);
    expect(targets.length).toBeGreaterThanOrEqual(3);
    for (const id of targets) expect(defOf(controller, id)).toBe('house_small');

    for (const id of targets) controller.progressActivity(id);
    expect(controller.state.activities.active).toBeUndefined();
    expect(controller.state.resources.money).toBeGreaterThan(money0);
    expect(controller.state.resources.wood).toBe(wood0); // kein costPerTarget
    expect(controller.state.buffs.length).toBeGreaterThan(buffs0); // Happiness-Buff
  });

  it('ist ohne Feuerwache gesperrt', () => {
    const controller = richCity();
    roadRow(controller, 0, 12);
    for (const dx of [3, 6, 9] as const) controller.placeBuilding('house_small', at(dx, 6).x, at(dx, 6).y);
    controller.update(T0 + 3_600_000, false);
    expect(controller.startActivity('fire_response')).toEqual({ ok: false, error: 'locked' });
  });
});

describe('A6 Polizeistreife — breite Zielauswahl', () => {
  it('fährt mehrere Einsatzorte ab und zahlt aus', () => {
    const controller = richCity();
    roadRow(controller, 0, 20);
    expect(controller.placeBuilding('police_station', at(0, 6).x, at(0, 6).y)).toEqual({ ok: true });
    for (const dx of [5, 9, 13, 17]) expect(controller.placeBuilding('house_small', at(dx, 6).x, at(dx, 6).y)).toEqual({ ok: true });
    controller.update(T0 + 3_600_000, false);

    const money0 = controller.state.resources.money;
    expect(controller.startActivity('police_patrol')).toEqual({ ok: true });
    const targets = targetIds(controller);
    expect(targets.length).toBeGreaterThanOrEqual(4);
    for (const id of targets) controller.progressActivity(id);
    expect(controller.state.activities.active).toBeUndefined();
    expect(controller.state.resources.money).toBeGreaterThan(money0);
  });
});
