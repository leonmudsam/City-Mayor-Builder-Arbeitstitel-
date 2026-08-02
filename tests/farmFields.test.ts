import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, setLevel, flattenTerrain, T0 } from './helpers.ts';
import { FIELD_COST_PER_TILE } from '../src/game/operations/farmFields.ts';
import { deriveNodesInArea } from '../src/game/operations/nodes.ts';
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
  controller.state.resources = { money: 10_000_000, wood: 100_000, stone: 100_000, food: 100_000, freshwater: 100_000 };
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
