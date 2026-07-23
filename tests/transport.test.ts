import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, paintTerrain, setLevel, T0 } from './helpers.ts';

const MIN = 60_000;
const at = (dx: number, dy: number) => nearTownHall(dx, dy);

function paintForest(controller: ReturnType<typeof newController>['controller'], x0: number, y0: number, w: number, h: number): void {
  const coords: [number, number][] = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) coords.push([x0 + dx, y0 + dy]);
  paintTerrain(controller, coords, 'forest');
}

/**
 * Ein Startsägewerk mit Wald im effizienten Arbeitsgebiet, das `harvestMin`
 * Minuten aktiv arbeitet und danach den Auftrag stoppt — das lokale Lager ist
 * damit gefüllt und friert ein (kein weiteres Wachstum während des Transports).
 */
function sawmillWithLocalWood(harvestMin = 6) {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 4);
  flattenTerrain(controller);
  paintForest(controller, at(6, 6).x, at(6, 6).y, 5, 6);
  expect(controller.placeBuilding('sawmill', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
  controller.update(T0 + 31_000, true); // Bau (30s) fertig
  const sawmill = Object.values(controller.state.buildings).find((b) => b.defId === 'sawmill')!;
  const townHall = Object.values(controller.state.buildings).find((b) => b.defId === 'town_hall')!;
  controller.startBuildingOperation(sawmill.id);
  controller.update(T0 + 31_000 + harvestMin * MIN, true);
  controller.cancelBuildingOperation(sawmill.id); // Lager einfrieren
  return { controller, sawmillId: sawmill.id, townHallId: townHall.id };
}

describe('§ Active Operations 2.0 — A5 Transport: Ziele & Reservierung', () => {
  it('bietet Lagergebäude (Rathaus) als Ziel an und reserviert die Ladung', () => {
    const { controller, sawmillId, townHallId } = sawmillWithLocalWood();
    const wood = controller.getBuildingInventory(sawmillId)!.items.wood ?? 0;
    expect(wood).toBeGreaterThan(0);

    const targets = controller.getInventoryTransferTargets(sawmillId, 'wood');
    expect(targets.map((t) => t.buildingId)).toContain(townHallId);

    const res = controller.createInventoryTransfer({ sourceBuildingId: sawmillId, targetBuildingId: townHallId, resource: 'wood', amount: wood, vehicleId: 'van' });
    expect(res).toEqual({ ok: true });
    // Reserviert im Quell-Lager, nichts mehr frei verfügbar.
    expect(controller.getAvailableForTransfer(sawmillId, 'wood')).toBe(0);
    expect(controller.getBuildingInventory(sawmillId)!.reserved.wood).toBe(wood);
  });

  it('lehnt Transport ohne Fahrzeug / ohne Ladung / ohne Lagerziel ab', () => {
    const { controller, sawmillId, townHallId } = sawmillWithLocalWood();
    const wood = controller.getBuildingInventory(sawmillId)!.items.wood ?? 0;
    // ohne Fahrzeug
    expect(controller.createInventoryTransfer({ sourceBuildingId: sawmillId, targetBuildingId: townHallId, resource: 'wood', amount: wood })).toEqual({ ok: false, error: 'no_vehicle' });
    // Quelle == Ziel → kein gültiges Lagerziel
    expect(controller.createInventoryTransfer({ sourceBuildingId: sawmillId, targetBuildingId: sawmillId, resource: 'wood', amount: wood, vehicleId: 'van' })).toEqual({ ok: false, error: 'no_target' });
    // leeres Lager → keine Ladung
    const empty = sawmillWithLocalWood(0);
    empty.controller.cancelBuildingOperation(empty.sawmillId);
    // Nach 0 Minuten Ernte kann Restholz vom letzten Tragen vorhanden sein — leeren:
    const inv = empty.controller.getBuildingInventory(empty.sawmillId);
    if (inv) inv.items.wood = 0;
    expect(empty.controller.createInventoryTransfer({ sourceBuildingId: empty.sawmillId, targetBuildingId: empty.townHallId, resource: 'wood', amount: 100, vehicleId: 'van' })).toEqual({ ok: false, error: 'no_cargo' });
  });
});

describe('§ Active Operations 2.0 — A5 Transport: Voller Loop', () => {
  it('bringt lokal geerntetes Holz ins Zentrallager (global) ohne Doppelzählung', () => {
    const { controller, sawmillId, townHallId } = sawmillWithLocalWood();
    const wood = controller.getBuildingInventory(sawmillId)!.items.wood ?? 0;
    const globalBefore = controller.state.resources.wood;
    const producedBefore = controller.state.stats.produced.wood;
    const cap = controller.derived.storageCaps.wood;

    controller.createInventoryTransfer({ sourceBuildingId: sawmillId, targetBuildingId: townHallId, resource: 'wood', amount: wood, vehicleId: 'van' });
    const now = controller.state.meta.lastSimTime;
    controller.update(now + 15 * MIN, true); // lange genug: laden + fahren + entladen

    // Transport abgeschlossen und aufgeräumt.
    expect(controller.getAllTransfers().length).toBe(0);
    // Global gutgeschrieben (gedeckelt); lokales Lager geleert.
    const expected = globalBefore + Math.min(wood, Math.max(0, cap - globalBefore));
    expect(controller.state.resources.wood).toBeCloseTo(expected, 4);
    expect(controller.getBuildingInventory(sawmillId)!.items.wood ?? 0).toBe(0);
    // §23: NICHT erneut als Produktion gezählt (das geschah beim Fällen).
    expect(controller.state.stats.produced.wood).toBe(producedBefore);
  });

  it('advanciert Transporte NUR im Live-Tick (nie offline)', () => {
    const { controller, sawmillId, townHallId } = sawmillWithLocalWood();
    const wood = controller.getBuildingInventory(sawmillId)!.items.wood ?? 0;
    controller.createInventoryTransfer({ sourceBuildingId: sawmillId, targetBuildingId: townHallId, resource: 'wood', amount: wood, vehicleId: 'van' });
    const globalBefore = controller.state.resources.wood;
    const now = controller.state.meta.lastSimTime;
    controller.update(now + 60 * MIN, false); // offline
    expect(controller.getAllTransfers()[0]?.status).toBe('loading');
    expect(controller.state.resources.wood).toBe(globalBefore);
  });

  it('ein noch ladender Transport lässt sich abbrechen und gibt die Reservierung frei', () => {
    const { controller, sawmillId, townHallId } = sawmillWithLocalWood();
    const wood = controller.getBuildingInventory(sawmillId)!.items.wood ?? 0;
    const created = controller.createInventoryTransfer({ sourceBuildingId: sawmillId, targetBuildingId: townHallId, resource: 'wood', amount: wood, vehicleId: 'van' });
    expect(created.ok).toBe(true);
    const id = controller.getAllTransfers()[0]!.id;
    expect(controller.cancelInventoryTransfer(id)).toEqual({ ok: true });
    expect(controller.getAllTransfers().length).toBe(0);
    // Reservierung gelöst, Ware wieder voll verfügbar.
    expect(controller.getAvailableForTransfer(sawmillId, 'wood')).toBe(wood);
    expect(controller.getBuildingInventory(sawmillId)!.reserved.wood ?? 0).toBe(0);
  });
});

describe('§ Active Operations 2.0 — A5-Reste: Mehrfachladung, Rückruf, Betriebskosten', () => {
  it('transportiert mehr als eine Fahrzeugladung in Nachfüllfahrten', () => {
    const { controller, sawmillId, townHallId } = sawmillWithLocalWood();
    // White-box: großes lokales Lager erzwingt mehrere Ladungen (van fasst 250).
    controller.getBuildingInventory(sawmillId); // stellt sicher, dass das Lager existiert
    controller.state.operations!.inventories[sawmillId]!.items.wood = 600;
    controller.state.operations!.inventories[sawmillId]!.reserved = {};
    controller.state.resources.wood = 0; // saubere Deckelprüfung (Rathaus: 400)

    const res = controller.createInventoryTransfer({ sourceBuildingId: sawmillId, targetBuildingId: townHallId, resource: 'wood', amount: 600, vehicleId: 'van' });
    expect(res).toEqual({ ok: true });
    const now = controller.state.meta.lastSimTime;
    controller.update(now + 40 * MIN, true); // reicht für 3 Fahrten (250+250+100)

    expect(controller.getAllTransfers().length).toBe(0); // abgeschlossen
    expect(controller.getBuildingInventory(sawmillId)!.items.wood ?? 0).toBe(0); // alles verladen
    expect(controller.state.resources.wood).toBe(400); // 600 geliefert, bei 400 gedeckelt
  });

  it('ein in Fahrt befindlicher Transport lässt sich zurückrufen (Ladung kehrt zurück)', () => {
    const { controller, sawmillId, townHallId } = sawmillWithLocalWood();
    const wood = controller.getBuildingInventory(sawmillId)!.items.wood ?? 0;
    controller.createInventoryTransfer({ sourceBuildingId: sawmillId, targetBuildingId: townHallId, resource: 'wood', amount: wood, vehicleId: 'van' });
    // Bis „unterwegs" laufen lassen (van lädt in 6s).
    let now = controller.state.meta.lastSimTime;
    for (let m = 1; m <= 20 && controller.getAllTransfers()[0]?.status === 'loading'; m++) {
      controller.update(now + m * MIN, true);
    }
    const transfer = controller.getAllTransfers()[0];
    expect(transfer && transfer.status !== 'loading').toBe(true);
    const onboard = transfer!.onboard ?? 0;
    expect(onboard).toBeGreaterThan(0);

    now = controller.state.meta.lastSimTime;
    expect(controller.cancelInventoryTransfer(transfer!.id)).toEqual({ ok: true });
    expect(controller.getAllTransfers().length).toBe(0);
    // Die verladene Ladung ist zurück im Quell-Lager, keine Reservierung offen.
    expect(controller.getBuildingInventory(sawmillId)!.items.wood ?? 0).toBeGreaterThanOrEqual(onboard);
    expect(controller.getBuildingInventory(sawmillId)!.reserved.wood ?? 0).toBe(0);
  });

  it('die Vorschau weist Fahrten und Betriebskosten deterministisch aus', () => {
    const { controller, sawmillId, townHallId } = sawmillWithLocalWood();
    controller.state.operations!.inventories[sawmillId]!.items.wood = 600;
    controller.state.operations!.inventories[sawmillId]!.reserved = {};
    const preview = controller.getInventoryTransferPreview({ sourceBuildingId: sawmillId, targetBuildingId: townHallId, resource: 'wood', amount: 600, vehicleId: 'van' })!;
    expect(preview.loads).toBe(3); // 600 ÷ 250 (van) aufgerundet
    expect(preview.operatingCost).toBe(3 * 120); // van-Betriebskosten je Fahrt
    expect(preview.amount).toBe(600);
  });

  it('jede tatsächlich gefahrene Ladung kostet Betriebskosten (Geldsenke)', () => {
    const { controller, sawmillId, townHallId } = sawmillWithLocalWood();
    const wood = controller.getBuildingInventory(sawmillId)!.items.wood ?? 0;
    controller.state.resources.money = 100_000; // hoch genug, kein Floor
    const moneyBefore = controller.state.resources.money;
    controller.createInventoryTransfer({ sourceBuildingId: sawmillId, targetBuildingId: townHallId, resource: 'wood', amount: wood, vehicleId: 'van' });
    const now = controller.state.meta.lastSimTime;
    controller.update(now + 15 * MIN, true);
    // Eine Fahrt (van 120) plus etwaiger Unterhalt — Geld sinkt um mindestens 120.
    expect(moneyBefore - controller.state.resources.money).toBeGreaterThanOrEqual(120);
  });
});

describe('§ Active Operations 2.0 — A5 Transport: Netzwerk-Übersicht (§7.2)', () => {
  it('unterscheidet global · lokal gebunden · reserviert · unterwegs', () => {
    const { controller, sawmillId, townHallId } = sawmillWithLocalWood();
    const wood = controller.getBuildingInventory(sawmillId)!.items.wood ?? 0;

    // Vor dem Transport: das Holz ist lokal gebunden (nicht global, nicht reserviert).
    let net = controller.getInventoryNetworkOverview().wood;
    expect(net.localBound).toBeCloseTo(wood, 4);
    expect(net.reserved).toBe(0);
    expect(net.inTransit).toBe(0);
    expect(net.global).toBe(controller.state.resources.wood);

    // Nach dem Anlegen: reserviert (noch im Lager), nicht mehr lokal frei.
    controller.createInventoryTransfer({ sourceBuildingId: sawmillId, targetBuildingId: townHallId, resource: 'wood', amount: wood, vehicleId: 'van' });
    net = controller.getInventoryNetworkOverview().wood;
    expect(net.reserved).toBeCloseTo(wood, 4);
    expect(net.localBound).toBeCloseTo(0, 4);
    expect(net.inTransit).toBe(0);

    // Nach dem Beladen: unterwegs (aus dem Lager entnommen).
    const now = controller.state.meta.lastSimTime;
    controller.update(now + MIN, true); // van lädt in 6s → in_transit
    const transfer = controller.getAllTransfers()[0];
    if (transfer && transfer.status !== 'loading') {
      net = controller.getInventoryNetworkOverview().wood;
      expect(net.inTransit).toBeGreaterThan(0);
    }
  });
});

describe('§ Active Operations 2.0 — A5 Transport: Save v18', () => {
  it('persistiert laufende Transporte über einen Roundtrip', async () => {
    const { controller, sawmillId, townHallId } = sawmillWithLocalWood();
    const wood = controller.getBuildingInventory(sawmillId)!.items.wood ?? 0;
    controller.createInventoryTransfer({ sourceBuildingId: sawmillId, targetBuildingId: townHallId, resource: 'wood', amount: wood, vehicleId: 'van' });
    const { exportSave, importSave } = await import('../src/game/storage/exportImport.ts');
    const restored = importSave(exportSave(controller.state));
    expect(restored.schemaVersion).toBe(20);
    expect(restored.operations!.transfers).toEqual(controller.state.operations!.transfers);
  });

  // § Change 9.0: Der v18→v19-Weltumbau (größerer zentraler Start) ist
  // save-brechend — ein Pre-9.0-Stand (v17) wird gesichert und neu gestartet.
  it('ein Pre-9.0-Save (v17) löst den transparenten Weltneustart aus', async () => {
    const { migrateAndValidate, WorldRebuildSaveError } = await import('../src/game/storage/migrations.ts');
    const { controller } = sawmillWithLocalWood(0);
    const raw = JSON.parse(JSON.stringify(controller.state)) as Record<string, unknown>;
    raw.schemaVersion = 17;
    delete (raw.operations as Record<string, unknown>).transfers;
    expect(() => migrateAndValidate(raw)).toThrow(WorldRebuildSaveError);
  });
});
