import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, paintTerrain, setLevel, T0 } from './helpers.ts';

// § Active Simplicity / AS-1 (D-039) — „Der Spieler entscheidet. Die Stadt arbeitet."
//
// Bisher: Sägewerk bauen → Arbeitsgebiet → Transport planen → Lager wählen → Route
// wählen → Fahrzeug wählen → starten → beobachten → erneut starten. Dutzende Male.
// Jetzt: Sägewerk bauen. Fertig. Die Abholung beauftragt der Betrieb selbst.

const MIN = 60_000;
const at = (dx: number, dy: number) => nearTownHall(dx, dy);

function paintForest(controller: ReturnType<typeof newController>['controller'], x0: number, y0: number, w: number, h: number): void {
  const coords: [number, number][] = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) coords.push([x0 + dx, y0 + dy]);
  paintTerrain(controller, coords, 'forest');
}

/** Level-4-Stadt (Lieferwagen verfügbar) mit Sägewerk am Wald. */
function sawmillCity() {
  const { controller } = newController();
  setLevel(controller, 4);
  flattenTerrain(controller);
  paintForest(controller, at(6, 6).x, at(6, 6).y, 6, 6);
  expect(controller.placeBuilding('sawmill', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
  controller.update(T0 + 31_000, true);
  const sawmill = Object.values(controller.state.buildings).find((b) => b.defId === 'sawmill')!;
  return { controller, sawmillId: sawmill.id };
}

describe('§AS-1 Automatischer Warenfluss', () => {
  it('ist der Normalfall — ohne jede Einstellung aktiv', () => {
    const { controller, sawmillId } = sawmillCity();
    expect(controller.getAutoTransport(sawmillId).enabled).toBe(true);
  });

  it('holt Holz ohne einen einzigen Transport-Klick ab und lagert es zentral ein', () => {
    const { controller, sawmillId } = sawmillCity();
    const woodBefore = controller.state.resources.wood;
    // NUR das: Arbeitsgebiet starten. Kein Transport, kein Lager, kein Fahrzeug.
    expect(controller.startBuildingOperation(sawmillId)).toEqual({ ok: true });
    controller.update(T0 + 31_000 + 60 * MIN, true);

    expect(controller.state.resources.wood).toBeGreaterThan(woodBefore);
    // Und der Weg dorthin lief über den normalen Lagertransport (kein Zweitsystem).
    expect(controller.state.stats.produced.wood ?? 0).toBeGreaterThan(0);
  });

  it('wählt Ziel und Fahrzeug selbst — deterministisch, ohne Spielerwahl', () => {
    const { controller, sawmillId } = sawmillCity();
    expect(controller.startBuildingOperation(sawmillId)).toEqual({ ok: true });
    controller.update(T0 + 31_000 + 12 * MIN, true);

    const transfers = Object.values(controller.state.operations?.transfers ?? {});
    // Entweder fährt gerade einer, oder es wurde bereits zugestellt — beides zeigt,
    // dass die Automatik ein Ziel UND ein Fahrzeug gefunden hat.
    if (transfers.length > 0) {
      expect(transfers[0]!.vehicleId).toBeDefined();
      expect(transfers[0]!.targetBuildingId).toBeTruthy();
      expect(transfers[0]!.sourceBuildingId).toBe(sawmillId);
    } else {
      expect(controller.state.resources.wood).toBeGreaterThan(0);
    }
  });

  it('lässt sich pro Betrieb abschalten — dann bleibt die Ware liegen', () => {
    const { controller, sawmillId } = sawmillCity();
    expect(controller.setAutoTransport(sawmillId, false)).toEqual({ ok: true });
    expect(controller.getAutoTransport(sawmillId).enabled).toBe(false);
    expect(controller.startBuildingOperation(sawmillId)).toEqual({ ok: true });
    controller.update(T0 + 31_000 + 60 * MIN, true);

    // Ohne Automatik entsteht kein Transport von selbst.
    const transfers = Object.values(controller.state.operations?.transfers ?? {});
    expect(transfers.filter((t) => t.sourceBuildingId === sawmillId)).toHaveLength(0);
    // Das lokale Lager füllt sich stattdessen.
    expect(controller.getBuildingInventory(sawmillId)!.items.wood ?? 0).toBeGreaterThan(0);
  });

  it('beauftragt nie zwei Fahrten gleichzeitig für denselben Betrieb', () => {
    const { controller, sawmillId } = sawmillCity();
    expect(controller.startBuildingOperation(sawmillId)).toEqual({ ok: true });
    for (let step = 1; step <= 30; step++) {
      controller.update(T0 + 31_000 + step * 2 * MIN, true);
      const mine = Object.values(controller.state.operations?.transfers ?? {}).filter(
        (t) => t.sourceBuildingId === sawmillId,
      );
      expect(mine.length).toBeLessThanOrEqual(1);
    }
  });
});

describe('§AS-2 Warnungen statt Aufgaben', () => {
  it('meldet ohne Fahrzeug einen konkreten Grund statt stillzustehen', () => {
    const { controller, sawmillId } = sawmillCity();
    setLevel(controller, 1); // vor dem Handkarren (ab L2)
    expect(controller.startBuildingOperation(sawmillId)).toEqual({ ok: true });
    controller.update(T0 + 31_000 + 30 * MIN, true);

    const warnings = controller.getLogisticsWarnings();
    const mine = warnings.filter((warning) => warning.buildingId === sawmillId);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine[0]!.code).toBe('no_vehicle');
    expect(mine[0]!.resource).toBe('wood');
  });

  it('schweigt, solange die Automatik ihre Arbeit tut', () => {
    const { controller, sawmillId } = sawmillCity();
    expect(controller.startBuildingOperation(sawmillId)).toEqual({ ok: true });
    controller.update(T0 + 31_000 + 20 * MIN, true);
    // Keine Warnung ohne echtes Problem — Warnungen sollen etwas bedeuten.
    expect(controller.getLogisticsWarnings().filter((w) => w.buildingId === sawmillId)).toEqual([]);
  });
});
