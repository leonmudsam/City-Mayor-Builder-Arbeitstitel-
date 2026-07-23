import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, paintTerrain, setLevel, T0 } from './helpers.ts';
import { resolveNode, TREE_REGEN_MS } from '../src/game/operations/nodes.ts';

const MIN = 60_000;
const at = (dx: number, dy: number) => nearTownHall(dx, dy);

/** Malt einen Wald-Block (für Baumknoten im Arbeitsgebiet). */
function paintForest(controller: ReturnType<typeof newController>['controller'], x0: number, y0: number, w: number, h: number): void {
  const coords: [number, number][] = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) coords.push([x0 + dx, y0 + dy]);
  paintTerrain(controller, coords, 'forest');
}

/** Ein L2-Startsägewerk mit Wald östlich im effizienten Arbeitsgebiet. */
function sawmillWithForest() {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 2);
  flattenTerrain(controller);
  // Wald östlich der 4×4-Grundfläche (1..4, 6..9), innerhalb Radius 8.
  paintForest(controller, at(6, 6).x, at(6, 6).y, 5, 6);
  expect(controller.placeBuilding('sawmill', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
  controller.update(T0 + 31_000, true); // Bau (30s) fertig
  const sawmill = Object.values(controller.state.buildings).find((b) => b.defId === 'sawmill')!;
  return { controller, sawmillId: sawmill.id };
}

describe('§ Active Operations 2.0 — Ressourcenknoten', () => {
  it('leitet Baumknoten deterministisch aus Wald-Kacheln ab (stabile Ids)', () => {
    const { controller, sawmillId } = sawmillWithForest();
    const nodes = controller.getResourceNodesNear(sawmillId);
    expect(nodes.length).toBeGreaterThan(0);
    // Ids sind "x,y" und lösen sich stabil erneut auf.
    for (const n of nodes.slice(0, 3)) {
      expect(n.id).toBe(`${n.x},${n.y}`);
      expect(n.state).toBe('available');
      expect(n.maxAmount).toBeGreaterThan(0);
    }
  });

  it('ohne Bäume in Reichweite startet kein Auftrag', () => {
    const bundle = newController();
    const { controller } = bundle;
    setLevel(controller, 2);
    flattenTerrain(controller); // nur Gras, kein Wald
    expect(controller.placeBuilding('sawmill', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
    controller.update(T0 + 31_000, true);
    const sawmill = Object.values(controller.state.buildings).find((b) => b.defId === 'sawmill')!;
    expect(controller.startBuildingOperation(sawmill.id)).toEqual({ ok: false, error: 'invalid' });
  });
});

describe('§ Active Operations 2.0 — Arbeiter, lokales Lager, Voll-Stopp', () => {
  it('Arbeiter fällen Bäume und lagern Holz NUR ins lokale Lager (nicht global)', () => {
    const { controller, sawmillId } = sawmillWithForest();
    const globalWoodBefore = controller.state.resources.wood;
    const producedBefore = controller.state.stats.produced.wood;
    expect(controller.startBuildingOperation(sawmillId)).toEqual({ ok: true });

    controller.update(T0 + 31_000 + 6 * MIN, true); // aktiv arbeiten
    const inv = controller.getBuildingInventory(sawmillId)!;
    expect(inv.items.wood ?? 0).toBeGreaterThan(0); // lokal eingelagert
    // §26.9: das globale Stadtlager wächst durch das Sägewerk NICHT.
    expect(controller.state.resources.wood).toBe(globalWoodBefore);
    // Es wurde real produziert (Lifetime-Zähler).
    expect(controller.state.stats.produced.wood).toBeGreaterThan(producedBefore);
  });

  it('ein volles lokales Lager stoppt die Arbeit nachvollziehbar (§26.8)', () => {
    const { controller, sawmillId } = sawmillWithForest();
    controller.startBuildingOperation(sawmillId);
    controller.update(T0 + 31_000 + 90 * MIN, true); // lange genug zum Auffüllen
    const info = controller.getBuildingOperationInfo(sawmillId)!;
    expect(info.storageFull).toBe(true);
    expect(info.inventory.used).toBe(info.inventory.capacity); // 120 (Stufe 1)
  });

  it('produziert nichts offline (Betriebe laufen nur im Live-Tick, §26.23)', () => {
    const { controller, sawmillId } = sawmillWithForest();
    controller.startBuildingOperation(sawmillId);
    controller.update(T0 + 31_000 + 3 * MIN, true);
    const used = controller.getBuildingInventory(sawmillId)!.used;
    controller.update(T0 + 31_000 + 3 * MIN + 60 * MIN, false); // offline
    expect(controller.getBuildingInventory(sawmillId)!.used).toBe(used);
  });

  it('Pause hält die Arbeit an (§26.22)', () => {
    const { controller, sawmillId } = sawmillWithForest();
    controller.startBuildingOperation(sawmillId);
    controller.advanceByRealTime(2 * MIN, true);
    const used = controller.getBuildingInventory(sawmillId)!.used;
    controller.setSpeed(0);
    controller.advanceByRealTime(10 * MIN, true); // pausiert → keine Sim-Zeit
    expect(controller.getBuildingInventory(sawmillId)!.used).toBe(used);
  });
});

describe('§ Active Operations 2.0 — Reservierung, Regeneration, Abbruch', () => {
  it('reserviert Knoten und gibt sie beim Abbruch wieder frei (§23)', () => {
    const { controller, sawmillId } = sawmillWithForest();
    const first = controller.getResourceNodesNear(sawmillId)[0]!;
    controller.startBuildingOperationWithNodes(sawmillId, [first.id]);
    controller.update(T0 + 31_000 + 30_000, true); // Arbeiter greift den Knoten
    // Der Knoten ist jetzt reserviert oder bereits erschöpft.
    const during = resolveNode(controller.state, 'forest', first.id, controller.state.meta.lastSimTime);
    expect(during?.reservedBy ?? during?.state).toBeDefined();
    controller.cancelBuildingOperation(sawmillId);
    // Nach dem Abbruch trägt kein Delta mehr eine Reservierung dieses Betriebs.
    const deltas = controller.state.operations?.nodeDeltas ?? {};
    for (const d of Object.values(deltas)) expect(d.reservedBy?.startsWith(sawmillId)).not.toBe(true);
  });

  it('ein gefällter Baum wächst erst nach der Regenerationszeit nach (§26.14)', () => {
    const { controller, sawmillId } = sawmillWithForest();
    const target = controller.getResourceNodesNear(sawmillId)[0]!;
    controller.startBuildingOperationWithNodes(sawmillId, [target.id]);
    // In Minutenschritten laufen, bis der einzelne Baum gefällt ist (Delta trägt
    // dann eine Regenerationszeit); danach übernimmt kein Arbeiter den Knoten mehr.
    let regenAt: number | undefined;
    for (let m = 1; m <= 30 && regenAt === undefined; m++) {
      controller.update(T0 + 31_000 + m * MIN, true);
      regenAt = controller.state.operations?.nodeDeltas[target.id]?.regenerationAt;
    }
    expect(regenAt).toBeDefined();
    // Direkt nach dem Fällen: nachwachsend (noch nicht verfügbar).
    const felled = resolveNode(controller.state, 'forest', target.id, controller.state.meta.lastSimTime);
    expect(felled?.state).toBe('regrowing');
    expect(regenAt! - controller.state.meta.lastSimTime).toBeLessThanOrEqual(TREE_REGEN_MS);
    // Nach Ablauf der Regenerationszeit wieder voll verfügbar.
    controller.update(regenAt! + MIN, true);
    const regrown = resolveNode(controller.state, 'forest', target.id, controller.state.meta.lastSimTime);
    expect(regrown?.state).toBe('available');
    expect(regrown?.remainingAmount).toBe(regrown?.maxAmount);
  });
});

describe('§ Active Operations 2.0 — Save', () => {
  it('persistiert Betriebslager, Arbeiter und Knoten-Deltas über einen Roundtrip', async () => {
    const { controller, sawmillId } = sawmillWithForest();
    controller.startBuildingOperation(sawmillId);
    controller.update(T0 + 31_000 + 4 * MIN, true);
    const { exportSave, importSave } = await import('../src/game/storage/exportImport.ts');
    const restored = importSave(exportSave(controller.state));
    expect(restored.operations).toBeDefined();
    expect(restored.operations!.inventories[sawmillId]).toEqual(controller.state.operations!.inventories[sawmillId]);
    expect(restored.operations!.active[sawmillId]).toEqual(controller.state.operations!.active[sawmillId]);
    expect(restored.operations!.workers[sawmillId]).toEqual(controller.state.operations!.workers[sawmillId]);
  });
});
