import { describe, expect, it } from 'vitest';
import {
  buildBuildingOperationView,
  buildResourceNetworkView,
  buildSmartRoadPlanView,
  getSmartRoadPlanPreview,
  buildTransportPlannerView,
  buildWorkAreaPlannerView,
  defaultWorkAreaSelection,
} from '../src/components/operations/adapters.ts';
import { capacityTone, clampPercent, safeStatusLabel } from '../src/components/operations/viewModels.ts';
import { flattenTerrain, nearTownHall, newController, paintTerrain, setLevel, T0 } from './helpers.ts';

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

function visualSawmill() {
  const { controller } = newController();
  setLevel(controller, 8);
  flattenTerrain(controller);
  const forest: [number, number][] = [];
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) forest.push([at(6 + x, 6 + y).x, at(6 + x, 6 + y).y]);
  }
  paintTerrain(controller, forest, 'forest');
  expect(controller.placeBuilding('sawmill', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
  controller.update(T0 + 31_000, true);
  const sawmill = Object.values(controller.state.buildings).find((building) => building.defId === 'sawmill')!;
  return { controller, sawmillId: sawmill.id };
}

describe('Active Operations Visual ViewModels', () => {
  it('begrenzt Prozentwerte und hält Kapazitäts-/Fallbackzustände robust', () => {
    expect(clampPercent(-12)).toBe(0);
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent(undefined)).toBe(0);
    expect(capacityTone(0, 0)).toBe('good');
    expect(capacityTone(120, 120)).toBe('full');
    expect(safeStatusLabel(undefined)).toBe('Status unbekannt');
  });

  it('projiziert das Arbeitsgebiet aus echten Knoten und Controller-Vorschau', () => {
    const { controller, sawmillId } = visualSawmill();
    const info = controller.getBuildingOperationInfo(sawmillId)!;
    const selected = defaultWorkAreaSelection(controller, sawmillId, info.efficientRadius);
    const view = buildWorkAreaPlannerView(controller, sawmillId, 'circle', info.efficientRadius, selected)!;

    expect(view.nodes.length).toBeGreaterThan(0);
    expect(view.selectedNodeIds.length).toBeGreaterThan(0);
    expect(view.selectedNodeIds.every((id) => selected.includes(id))).toBe(true);
    expect(view.expectedYieldMin).toBe(controller.getBuildingOperationPreview(sawmillId, selected)!.expectedYield);
    expect(view.expectedYieldMax).toBe(view.expectedYieldMin);
    expect(view.localCapacity).toBe(info.inventory.capacity);
  });

  it('erfindet keine Durchsatzhistorie und keine globalen Lagerhausanteile', () => {
    const { controller, sawmillId } = visualSawmill();
    const operation = buildBuildingOperationView(controller, sawmillId)!;
    const network = buildResourceNetworkView(controller, 'wood');

    expect(operation.throughputPerMinute).toBeUndefined();
    expect(network.inWarehouses).toBeUndefined();
    expect(network.inTownHall).toBeUndefined();
    expect(network.locations[0]?.kind).toBe('network');
    expect(network.dataNotes.join(' ')).toContain('nicht vorgetäuscht');
  });

  it('hält den Handkarren sichtbar, aber deaktiviert, und nutzt echte Fahrzeugwerte', () => {
    const { controller, sawmillId } = visualSawmill();
    controller.startBuildingOperation(sawmillId);
    controller.update(controller.state.meta.lastSimTime + 8 * 60_000, true);
    controller.cancelBuildingOperation(sawmillId);
    const target = controller.getInventoryTransferTargets(sawmillId, 'wood')[0];
    const view = buildTransportPlannerView(
      controller,
      sawmillId,
      'wood',
      20,
      target?.buildingId,
      'van',
    );

    // Fahrzeugwerte kommen aus dem Katalog — nie aus hart kodierten Kopien.
    expect(view.methods.find((method) => method.id === 'van')?.capacity).toBe(
      controller.config.activities.vehicles.find((vehicle) => vehicle.id === 'van')?.capacity,
    );
  });

  // § R4: Der Handkarren stand hier zusätzlich als hart kodierter Platzhalter
  // („Nicht angebunden", Kapazität 0) — seit v0.91 ist er ein echtes Katalogfahrzeug.
  it('listet jede Transportmethode genau einmal, mit echten Katalogwerten (§R4)', () => {
    const { controller, sawmillId } = visualSawmill();
    setLevel(controller, 8);
    const view = buildTransportPlannerView(controller, sawmillId, 'wood', 10);
    const ids = view.methods.map((method) => method.id);
    expect(new Set(ids).size).toBe(ids.length); // keine Dubletten mehr

    const handcart = view.methods.find((method) => method.id === 'handcart')!;
    const catalog = controller.config.activities.vehicles.find((vehicle) => vehicle.id === 'handcart')!;
    expect(handcart.capacity).toBe(catalog.capacity);
    expect(handcart.capacity).toBeGreaterThan(0);
    expect(handcart.available).toBe(true); // ab Level 2 nutzbar
    expect(handcart.speedLabel).not.toBe('Nicht angebunden');
  });

  // § R3: Lagervergleich über die physischen Standorte.
  it('vergleicht die echten Lagerstandorte und nennt den Engpass (§R3)', () => {
    const { controller, sawmillId } = visualSawmill();
    controller.startBuildingOperation(sawmillId);
    controller.update(T0 + 31_000 + 20 * 60_000, true);

    const view = buildResourceNetworkView(controller, 'wood');
    const comparison = view.storageComparison;
    expect(comparison.locations).toBeGreaterThan(0);
    expect(comparison.totalCapacity).toBeGreaterThan(0);
    // Belegt + frei ergibt die Gesamtkapazität — keine erfundenen Restmengen.
    expect(comparison.totalStored + comparison.totalFree).toBe(comparison.totalCapacity);
    expect(comparison.utilizationPct).toBeGreaterThanOrEqual(0);
    expect(comparison.utilizationPct).toBeLessThanOrEqual(100);
    expect(comparison.fullestLocationName).toBeDefined();
    // Der zentrale Pool ist kein physischer Standort und darf nicht mitzählen.
    expect(comparison.locations).toBeLessThan(view.locations.length);
  });

  it('analysiert einen Straßenentwurf ohne den Spielzustand zu verändern', () => {
    const { controller } = newController();
    const roadsBefore = Object.values(controller.state.buildings).filter((building) => building.defId === 'road').length;
    const existing = [...controller.derived.roadNetwork]
      .slice(0, 2)
      .map((key) => {
        const [x, y] = key.split(',').map(Number);
        return { x: x!, y: y! };
      });
    const preview = getSmartRoadPlanPreview(controller, existing, 'road');
    expect(getSmartRoadPlanPreview(controller, existing, 'road')).toBe(preview);
    const view = buildSmartRoadPlanView(controller, existing, 'road', preview);
    const roadsAfter = Object.values(controller.state.buildings).filter((building) => building.defId === 'road').length;

    expect(view.tiles).toHaveLength(existing.length);
    expect(view.lengthMeters).toBe(preview.profile.lengthMeters);
    expect(view.elevationDeltaMeters).toBe(preview.profile.elevationDeltaMeters);
    expect(view.maxGradePercent).toBe(preview.profile.maxGradePercent);
    expect(view.averageGradePercent).toBe(preview.profile.averageGradePercent);
    expect(view.dominantVariant).toBe(preview.profile.dominantVariant);
    expect(view.costs).toEqual(preview.totalCost);
    expect(view.tiles.every((tile) => Number.isFinite(tile.roadHeight) && Number.isFinite(tile.gradePercent))).toBe(true);
    expect(roadsAfter).toBe(roadsBefore);
  });
});
