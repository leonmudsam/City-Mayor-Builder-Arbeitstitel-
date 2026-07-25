import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, paintTerrain, refreshDerived, setLevel, T0 } from './helpers.ts';
import { occupyTiles } from '../src/game/map/world.ts';

// § Infrastruktur 2.0 / I4 — persistente Schiffsrouten.
//
// Kernlücke: `createInventoryTransfer` fährt über den Straßengraphen. Liegen Quelle
// und Ziel durch Wasser getrennt, gibt es keine Route — die Ware bleibt im lokalen
// Betriebslager stecken. Eine Schiffsroute schließt genau das und läuft — anders als
// der einmalige Transport — zyklisch weiter, bis sie pausiert/gelöscht wird.

const MIN = 60_000;
const at = (dx: number, dy: number) => nearTownHall(dx, dy);

/** Offene See der gebackenen Welt: hier liegen verbundene Wasserknoten (Region 0). */
const OCEAN_A = { x: 10, y: 10 };
const OCEAN_B = { x: 26, y: 10 };

function injectDock(
  controller: ReturnType<typeof newController>['controller'],
  id: string,
  pos: { x: number; y: number },
): string {
  controller.state.buildings[id] = { id, defId: 'dock_small', x: pos.x, y: pos.y, upgradeLevel: 0, status: 'active' };
  occupyTiles(controller.state, pos.x, pos.y, 2, 2, id);
  refreshDerived(controller);
  return id;
}

function paintForest(controller: ReturnType<typeof newController>['controller'], x0: number, y0: number, w: number, h: number): void {
  const coords: [number, number][] = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) coords.push([x0 + dx, y0 + dy]);
  paintTerrain(controller, coords, 'forest');
}

/** Stadt mit Sägewerk (lokales Holz im Betriebslager) + zwei Anlegern auf See. */
function harborCity(harvestMin = 6) {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 6);
  flattenTerrain(controller);
  paintForest(controller, at(6, 6).x, at(6, 6).y, 5, 6);
  expect(controller.placeBuilding('sawmill', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
  controller.update(T0 + 31_000, true);
  const sawmill = Object.values(controller.state.buildings).find((b) => b.defId === 'sawmill')!;
  const townHall = Object.values(controller.state.buildings).find((b) => b.defId === 'town_hall')!;
  controller.startBuildingOperation(sawmill.id);
  controller.update(T0 + 31_000 + harvestMin * MIN, true);
  controller.cancelBuildingOperation(sawmill.id); // Lagerstand einfrieren
  const originHarborId = injectDock(controller, 'dock_a', OCEAN_A);
  const destinationHarborId = injectDock(controller, 'dock_b', OCEAN_B);
  return { controller, sawmillId: sawmill.id, townHallId: townHall.id, originHarborId, destinationHarborId };
}

const routeInput = (c: ReturnType<typeof harborCity>) => ({
  sourceBuildingId: c.sawmillId,
  originHarborId: c.originHarborId,
  destinationHarborId: c.destinationHarborId,
  targetBuildingId: c.townHallId,
  resource: 'wood' as const,
});

describe('§I4 Schiffsrouten — Wasserweg und Anlegen', () => {
  it('findet zwischen zwei Anlegern einen befahrbaren Wasserweg mit Fahrzeit', () => {
    const city = harborCity();
    const legs = city.controller.getShippingRouteLegs(city.originHarborId, city.destinationHarborId, 'cargo_barge');
    expect(legs).toBeDefined();
    expect(legs!.waterDistance).toBeGreaterThan(0);
    expect(legs!.travelMs).toBeGreaterThan(0);
  });

  it('legt eine persistente Route an und speichert sie im State', () => {
    const city = harborCity();
    const res = city.controller.createShippingRoute(routeInput(city));
    expect(res.ok).toBe(true);
    const routes = city.controller.getShippingRoutes();
    expect(routes).toHaveLength(1);
    expect(routes[0]!.resource).toBe('wood');
    expect(routes[0]!.capacity).toBeGreaterThan(0);
    expect(routes[0]!.operatingCost).toBeGreaterThan(0);
    // Anders als ein Transport reserviert eine Dauerroute das Lager NICHT vorab.
    expect(city.controller.getAvailableForTransfer(city.sawmillId, 'wood')).toBeGreaterThan(0);
  });

  it('lehnt eine zweite identische Route ab (keine Doppelbuchung)', () => {
    const city = harborCity();
    expect(city.controller.createShippingRoute(routeInput(city)).ok).toBe(true);
    const again = city.controller.createShippingRoute(routeInput(city));
    expect(again).toEqual({ ok: false, error: 'duplicate' });
  });

  it('lehnt ungültige Quelle, Ziel und Anleger konkret ab', () => {
    const city = harborCity();
    const { controller } = city;
    // Ziel existiert nicht → kein Lagerplatz.
    expect(controller.createShippingRoute({ ...routeInput(city), targetBuildingId: 'gibt_es_nicht' }))
      .toEqual({ ok: false, error: 'invalid_target' });
    // Quelle ist kein Betrieb mit lokalem Lager (das Rathaus produziert nichts aktiv).
    expect(controller.createShippingRoute({ ...routeInput(city), sourceBuildingId: city.townHallId }))
      .toEqual({ ok: false, error: 'invalid_source' });
    // Start- und Zielhafen identisch → keine Route.
    expect(controller.createShippingRoute({ ...routeInput(city), destinationHarborId: city.originHarborId }))
      .toEqual({ ok: false, error: 'invalid_harbor' });
    // Ein Nicht-Hafen als Anleger ist ebenfalls ungültig.
    expect(controller.createShippingRoute({ ...routeInput(city), originHarborId: city.townHallId }))
      .toEqual({ ok: false, error: 'invalid_harbor' });
  });
});

describe('§I4 Schiffsrouten — Betrieb über die Zeit', () => {
  it('bringt Holz über das Wasser in den globalen Pool und fährt zyklisch weiter', () => {
    const city = harborCity();
    const { controller } = city;
    const woodBefore = controller.state.resources.wood;
    const localBefore = controller.getBuildingInventory(city.sawmillId)!.items.wood ?? 0;
    expect(localBefore).toBeGreaterThan(0);

    expect(controller.createShippingRoute(routeInput(city)).ok).toBe(true);
    // Genug Zeit für Laden → Fahrt → Entladen.
    controller.update(T0 + 31_000 + 6 * MIN + 40 * MIN, true);

    expect(controller.state.resources.wood).toBeGreaterThan(woodBefore);
    const route = controller.getShippingRoutes()[0]!;
    expect(route.deliveredTotal ?? 0).toBeGreaterThan(0);
    // Die Route bleibt bestehen (Persistenz — anders als ein Transport).
    expect(controller.getShippingRoutes()).toHaveLength(1);
  });

  it('pausiert und setzt fort, ohne die Route zu verlieren', () => {
    const city = harborCity();
    const { controller } = city;
    expect(controller.createShippingRoute(routeInput(city)).ok).toBe(true);
    const id = controller.getShippingRoutes()[0]!.id;

    expect(controller.setShippingRoutePaused(id, true)).toBe(true);
    const afterPause = controller.getShippingRoutes()[0]!;
    expect(afterPause.paused).toBe(true);
    const deliveredAtPause = afterPause.deliveredTotal ?? 0;
    controller.update(T0 + 31_000 + 6 * MIN + 40 * MIN, true);
    expect(controller.getShippingRoutes()[0]!.deliveredTotal ?? 0).toBe(deliveredAtPause);

    expect(controller.setShippingRoutePaused(id, false)).toBe(true);
    expect(controller.getShippingRoutes()[0]!.paused).toBe(false);
  });

  it('löscht eine Route und gibt die Ladung an Bord zurück', () => {
    const city = harborCity();
    const { controller } = city;
    expect(controller.createShippingRoute(routeInput(city)).ok).toBe(true);
    const id = controller.getShippingRoutes()[0]!.id;
    expect(controller.deleteShippingRoute(id)).toBe(true);
    expect(controller.getShippingRoutes()).toHaveLength(0);
    expect(controller.deleteShippingRoute(id)).toBe(false);
  });

  it('wartet bei leerem Quell-Lager, statt zu verschwinden', () => {
    const city = harborCity(0); // nichts geerntet
    const { controller } = city;
    expect(controller.createShippingRoute(routeInput(city)).ok).toBe(true);
    controller.update(T0 + 31_000 + 30 * MIN, true);
    const routes = controller.getShippingRoutes();
    expect(routes).toHaveLength(1);
    expect(routes[0]!.waitingForCargo).toBe(true);
    expect(routes[0]!.deliveredTotal ?? 0).toBe(0);
  });

  it('liefert eine Netzübersicht mit Betriebskosten je Rundfahrt', () => {
    const city = harborCity();
    const { controller } = city;
    expect(controller.createShippingRoute(routeInput(city)).ok).toBe(true);
    const overview = controller.getShippingNetworkOverview();
    expect(overview.routes).toBe(1);
    expect(overview.active).toBe(1);
    expect(overview.operatingCostPerCycle).toBeGreaterThan(0);
  });
});
