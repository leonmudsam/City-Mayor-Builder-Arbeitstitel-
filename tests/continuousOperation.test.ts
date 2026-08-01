import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, paintResourceNodes, setLevel, T0 } from './helpers.ts';

// § 10.0 R2 — Dauerbetrieb. Bisher wurde ein Gebiets-Auftrag GELÖSCHT, sobald im
// Arbeitsgebiet nichts mehr zu holen war (`delete ops.active[...]`). Der Spieler
// musste nach jeder Abernte von Hand neu auswählen. Jetzt bleibt der Auftrag
// bestehen, schläft ein (`waiting`) und nimmt die Arbeit selbst wieder auf, sobald
// etwas nachgewachsen ist.

const MIN = 60_000;
const at = (dx: number, dy: number) => nearTownHall(dx, dy);

/** Sägewerk mit einem winzigen Waldstück — schnell leer geerntet. */
function sawmillWithTinyForest() {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 3);
  flattenTerrain(controller);
  // Genau zwei ECHTE Baumknoten, damit das Gebiet in überschaubarer Zeit
  // erschöpft ist. Sie müssen außerhalb der 4×4-Grundfläche des Sägewerks liegen
  // (belegte Kacheln sind keine Ressourcenknoten). `paintResourceNodes` prüft die
  // Knotendichte je Kachel — reines Waldmalen liefert je nach Weltkoordinate
  // gar keinen Baum (§ World Overhaul 12.0).
  paintResourceNodes(controller, 'tree', at(6, 6), 2, 2);
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

  it('meldet einen echten Durchsatz statt der passiven Config-Rate (§R2/§5)', () => {
    const { controller, sawmillId } = sawmillWithTinyForest();
    // Ohne Auftrag fließt nichts — und es wird auch nichts behauptet.
    const idle = controller.getOperationThroughput(sawmillId)!;
    expect(idle.perMinute).toBe(0);
    expect(idle.idleReason).toBe('no_targets');

    expect(controller.startBuildingOperation(sawmillId, 4)).toEqual({ ok: true });
    const running = controller.getOperationThroughput(sawmillId)!;
    expect(running.perMinute).toBeGreaterThan(0);
    expect(running.activeWorkers).toBeGreaterThan(0);
    expect(running.avgDistance).toBeGreaterThan(0);
    // Der Wert stammt aus der Arbeitsschleife, NICHT aus dem `produce`-Effekt der
    // Config (Sägewerk Stufe 1: 45 Holz/min) — sonst wäre es wieder die alte Lüge.
    const passiveRate = controller.config.buildings
      .get('sawmill')!
      .effects.find((e) => e.type === 'produce') as { perMinute: number } | undefined;
    expect(passiveRate?.perMinute).toBe(45);
    expect(running.perMinute).not.toBe(45);
  });

  it('meldet bei pausiertem Betrieb ehrlich 0 statt einer Wunschrate', () => {
    const { controller, sawmillId } = sawmillWithTinyForest();
    expect(controller.startBuildingOperation(sawmillId, 4)).toEqual({ ok: true });
    expect(controller.pauseBuildingOperation(sawmillId)).toEqual({ ok: true });
    const paused = controller.getOperationThroughput(sawmillId)!;
    expect(paused.perMinute).toBe(0);
    expect(paused.idleReason).toBe('paused');
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
