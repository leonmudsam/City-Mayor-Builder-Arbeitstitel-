import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, paintTerrain, setLevel, T0 } from './helpers.ts';

// § 10.0 R2 — Dauerbetrieb. Bisher wurde ein Gebiets-Auftrag GELÖSCHT, sobald im
// Arbeitsgebiet nichts mehr zu holen war (`delete ops.active[...]`). Der Spieler
// musste nach jeder Abernte von Hand neu auswählen. Jetzt bleibt der Auftrag
// bestehen, schläft ein (`waiting`) und nimmt die Arbeit selbst wieder auf, sobald
// etwas nachgewachsen ist.

const MIN = 60_000;
const at = (dx: number, dy: number) => nearTownHall(dx, dy);

function paintForest(controller: ReturnType<typeof newController>['controller'], x0: number, y0: number, w: number, h: number): void {
  const coords: [number, number][] = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) coords.push([x0 + dx, y0 + dy]);
  paintTerrain(controller, coords, 'forest');
}

/** Sägewerk mit einem winzigen Waldstück — schnell leer geerntet. */
function sawmillWithTinyForest() {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 3);
  flattenTerrain(controller);
  // Nur zwei Bäume, damit das Gebiet in überschaubarer Zeit erschöpft ist. Sie
  // müssen außerhalb der 4×4-Grundfläche des Sägewerks liegen (belegte Kacheln
  // sind keine Ressourcenknoten).
  paintForest(controller, at(6, 6).x, at(6, 6).y, 2, 1);
  expect(controller.placeBuilding('sawmill', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
  controller.update(T0 + 31_000, true);
  const sawmill = Object.values(controller.state.buildings).find((b) => b.defId === 'sawmill')!;
  return { controller, sawmillId: sawmill.id };
}

describe('§R2 Dauerbetrieb', () => {
  it('merkt sich das Arbeitsgebiet beim Gebiets-Start', () => {
    const { controller, sawmillId } = sawmillWithTinyForest();
    expect(controller.startBuildingOperation(sawmillId, 4)).toEqual({ ok: true });
    const op = controller.state.operations!.active[sawmillId]!;
    expect(op.continuous).toBe(true);
    expect(op.workArea).toEqual({ kind: 'circle', radius: 4 });

    const status = controller.getContinuousOperationStatus(sawmillId)!;
    expect(status.continuous).toBe(true);
    expect(status.workAreaRadius).toBe(4);
    expect(status.status).toBe('active');
  });

  it('löscht den Dauerbetrieb nie — er bleibt über das Abernten hinaus bestehen', () => {
    const { controller, sawmillId } = sawmillWithTinyForest();
    expect(controller.startBuildingOperation(sawmillId, 4)).toEqual({ ok: true });
    // Weit über mehrere Abernte-/Nachwachszyklen hinaus (Nachwuchs = 8 Simminuten).
    controller.update(T0 + 31_000 + 90 * MIN, true);

    const op = controller.state.operations!.active[sawmillId];
    expect(op).toBeDefined(); // FRÜHER: hier war der Auftrag ersatzlos weg
    // Er ist entweder am Arbeiten oder wartet auf Nachwuchs — nie gelöscht.
    expect(['active', 'waiting']).toContain(op!.status);
  });

  it('erntet über mehrere Nachwuchszyklen weiter — der einmalige Auftrag nicht', () => {
    // Beide Varianten laufen exakt gleich lang auf identischem Aufbau. Der
    // Unterschied kann nur aus der Wiederaufnahme kommen.
    const runFor = (continuous: boolean) => {
      const { controller, sawmillId } = sawmillWithTinyForest();
      expect(controller.startBuildingOperation(sawmillId, 4, undefined, continuous)).toEqual({ ok: true });
      controller.update(T0 + 31_000 + 120 * MIN, true);
      return controller.state.stats.produced.wood ?? 0;
    };
    const oneShot = runFor(false);
    const continuous = runFor(true);
    expect(oneShot).toBeGreaterThan(0);
    expect(continuous).toBeGreaterThan(oneShot);
  });

  it('bleibt bei einem einmaligen Auftrag beim alten Verhalten (kein Dauerbetrieb)', () => {
    const { controller, sawmillId } = sawmillWithTinyForest();
    expect(controller.startBuildingOperation(sawmillId, 4, undefined, false)).toEqual({ ok: true });
    const op = controller.state.operations!.active[sawmillId]!;
    expect(op.continuous).toBeUndefined();
    expect(op.workArea).toBeUndefined();
    controller.update(T0 + 31_000 + 90 * MIN, true);
    // Ohne Dauerbetrieb wird der erledigte Auftrag wie bisher entfernt.
    expect(controller.state.operations!.active[sawmillId]).toBeUndefined();
  });

  it('lässt sich weiterhin manuell pausieren und abbrechen', () => {
    const { controller, sawmillId } = sawmillWithTinyForest();
    expect(controller.startBuildingOperation(sawmillId, 4)).toEqual({ ok: true });
    expect(controller.pauseBuildingOperation(sawmillId)).toEqual({ ok: true });
    expect(controller.getContinuousOperationStatus(sawmillId)!.status).toBe('paused');
    expect(controller.resumeBuildingOperation(sawmillId)).toEqual({ ok: true });
    expect(controller.getContinuousOperationStatus(sawmillId)!.status).toBe('active');
    expect(controller.cancelBuildingOperation(sawmillId)).toEqual({ ok: true });
    expect(controller.getContinuousOperationStatus(sawmillId)).toBeUndefined();
  });
});
