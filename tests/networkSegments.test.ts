import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, refreshDerived } from './helpers.ts';
import { occupyTiles } from '../src/game/map/world.ts';
import { computeRoadSegments } from '../src/game/infrastructure/networkSegments.ts';

// § Infrastruktur 2.0 / I3 — Anleger als Netzknoten.
//
// Ausgangslage: `derived.roadNetwork` ist EIN flaches Set aus Distriktzentren UND
// Anlegern (v0.92). Ein lokales Straßennetz hinter Wasser war dadurch nicht vom
// Stadtnetz unterscheidbar. I3 zerlegt dasselbe Netz in Teilnetze und benennt das
// Stadtnetz — ohne einen zweiten Verkehrsgraphen anzulegen.

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

function injectDock(controller: ReturnType<typeof newController>['controller'], x: number, y: number, id = 'test_dock'): string {
  controller.state.buildings[id] = { id, defId: 'dock_small', x, y, upgradeLevel: 0, status: 'active' };
  occupyTiles(controller.state, x, y, 2, 2, id);
  refreshDerived(controller);
  return id;
}

const segmentsOf = (controller: ReturnType<typeof newController>['controller']) =>
  computeRoadSegments(controller.state, controller.config, controller.derived.roadNetwork);

describe('§I3 Straßen-Teilnetze', () => {
  it('erkennt das Startnetz am Rathaus als Stadtnetz', () => {
    const { controller } = newController();
    const index = segmentsOf(controller);
    expect(index.citySegmentId).toBeDefined();
    const city = index.segments.find((segment) => segment.id === index.citySegmentId);
    expect(city?.kind).toBe('city');
    expect(city?.tileCount).toBeGreaterThan(0);
  });

  it('trennt ein isoliertes Anleger-Netz als eigenes lokales Teilnetz vom Stadtnetz', () => {
    const { controller } = newController();
    const dock = at(16, 16);
    injectDock(controller, dock.x, dock.y);
    // Lokales Netz am Anleger-Landanker (v0.92 erlaubt diesen Start).
    expect(controller.placeBuilding('road', dock.x, dock.y - 1)).toEqual({ ok: true });
    expect(controller.placeBuilding('road', dock.x + 1, dock.y - 1)).toEqual({ ok: true });

    const index = segmentsOf(controller);
    const local = index.segments.find((segment) => segment.kind === 'local');
    expect(local).toBeDefined();
    expect(local!.id).not.toBe(index.citySegmentId);
    // Das lokale Netz kennt seinen Anleger — das macht ihn zum Netzknoten.
    expect(local!.harborIds).toContain('test_dock');
    // Und es ist wirklich getrennt: mindestens zwei Teilnetze.
    expect(index.segments.length).toBeGreaterThanOrEqual(2);
  });

  it('ist deterministisch und unabhängig von der Einfügereihenfolge', () => {
    const { controller } = newController();
    const dock = at(16, 16);
    injectDock(controller, dock.x, dock.y);
    controller.placeBuilding('road', dock.x, dock.y - 1);
    const a = segmentsOf(controller);
    const b = segmentsOf(controller);
    expect(b.segments.map((s) => `${s.id}:${s.kind}:${s.tileCount}`))
      .toEqual(a.segments.map((s) => `${s.id}:${s.kind}:${s.tileCount}`));
    expect(b.citySegmentId).toBe(a.citySegmentId);
  });

  it('hängt am Derived und wird ohne zweiten Graphen mitgeführt', () => {
    const { controller } = newController();
    expect(controller.derived.roadSegments.segments.length).toBeGreaterThan(0);
    expect(controller.getRoadSegments()).toBe(controller.derived.roadSegments.segments);
  });
});

describe('§I3 Anleger als Netzknoten', () => {
  it('meldet einen Anleger am isolierten lokalen Netz als nicht am Stadtnetz', () => {
    const { controller } = newController();
    const dock = at(16, 16);
    const id = injectDock(controller, dock.x, dock.y);
    controller.placeBuilding('road', dock.x, dock.y - 1);
    refreshDerived(controller);

    const node = controller.getHarborNodeStatus(id);
    expect(node).toBeDefined();
    expect(node!.landSegmentId).toBeDefined();
    expect(node!.onCityNetwork).toBe(false);
    expect(node!.landSegmentKind).toBe('local');
  });

  it('meldet fehlenden Landanschluss, solange keine Straße am Anleger liegt', () => {
    const { controller } = newController();
    const dock = at(16, 16);
    const id = injectDock(controller, dock.x, dock.y);
    const node = controller.getHarborNodeStatus(id);
    expect(node!.landSegmentId).toBeUndefined();
    expect(node!.problems).toContain('no_land_access');
  });

  it('täuscht keine Schiffsroute vor: erreichbare Häfen sind leer ohne zweiten Anleger', () => {
    const { controller } = newController();
    const dock = at(16, 16);
    const id = injectDock(controller, dock.x, dock.y);
    const node = controller.getHarborNodeStatus(id);
    expect(node!.reachableHarborIds).toEqual([]);
    expect(node!.linksToCityVia).toEqual([]);
  });

  it('zählt Bodenstraßen, Höhenstraßen/Brücken und Anleger getrennt (§I5)', () => {
    const { controller } = newController();
    const before = controller.getInfrastructureNetworkOverview();
    const road = at(5, 5);
    expect(controller.placeBuilding('road', road.x, road.y)).toEqual({ ok: true });
    const after = controller.getInfrastructureNetworkOverview();
    expect(after.groundRoadTiles).toBe(before.groundRoadTiles + 1);
    // Eine Bodenstraße ist keine Höhenstraße und kein Anleger.
    expect(after.elevatedRoadTiles).toBe(before.elevatedRoadTiles);
    expect(after.harbors).toBe(before.harbors);

    const dock = at(16, 16);
    injectDock(controller, dock.x, dock.y);
    expect(controller.getInfrastructureNetworkOverview().harbors).toBe(before.harbors + 1);
  });

  it('liefert eine Netzübersicht, die lokale Teilnetze getrennt zählt', () => {
    const { controller } = newController();
    const dock = at(16, 16);
    injectDock(controller, dock.x, dock.y);
    controller.placeBuilding('road', dock.x, dock.y - 1);
    refreshDerived(controller);

    const overview = controller.getHarborNetworkOverview();
    expect(overview.harbors).toBe(1);
    expect(overview.roadSegments).toBeGreaterThanOrEqual(2);
    expect(overview.localSegments).toBeGreaterThanOrEqual(1);
  });
});
