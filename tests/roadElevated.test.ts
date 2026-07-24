import { describe, expect, it } from 'vitest';
import { newController, nearTownHall, paintTerrain, setLevel } from './helpers.ts';

// § Infrastruktur 2.0 / I1 (D-036): die Höhenstraße `road_elevated` ist eine
// Straßen-Bauklasse, die Wasser/Fluss (Brücke) und Klippen (Viadukt) überwindet —
// über denselben roadNetwork/validatePlacement/analyseRoadPath, KEIN zweites
// Verkehrssystem. Diese Suite prüft genau die Trennlinie: Bodenstraße bleibt auf
// Wasser gesperrt, die Höhenstraße überbrückt es, und der Preis enthält den
// Pfeiler-Aufschlag.
describe('Höhenstraße / Brücke (Infrastruktur 2.0 / I1)', () => {
  const at = (dx: number, dy: number) => nearTownHall(dx, dy);

  /** Setzt Level 2 (road_elevated freigeschaltet) + reichlich Ressourcen. */
  function elevatedReady() {
    const { controller } = newController();
    setLevel(controller, 2);
    controller.state.resources = { money: 2_000_000, wood: 2_000, stone: 500, food: 40, freshwater: 0 };
    return controller;
  }

  it('Bodenstraße bleibt auf Wasser gesperrt (Regressionsschutz)', () => {
    const controller = elevatedReady();
    // Wasser direkt neben eine Start-Straße (bei y+5, dx 0..4) malen.
    paintTerrain(controller, [[at(5, 5).x, at(5, 5).y]], 'water');
    const preview = controller.roadPathPreview([at(5, 5)], 'road');
    expect(preview.valid).toBe(false);
    expect(preview.tiles[0]!.status).toBe('blocked');
    expect(preview.tiles[0]!.reason).toBe('terrain');
  });

  it('Höhenstraße überbrückt Wasser und meldet Brückensegmente', () => {
    const controller = elevatedReady();
    paintTerrain(controller, [[at(5, 5).x, at(5, 5).y], [at(6, 5).x, at(6, 5).y]], 'water');
    const preview = controller.roadPathPreview([at(5, 5), at(6, 5)], 'road_elevated');
    expect(preview.valid).toBe(true);
    expect(preview.blocked).toBe(0);
    expect(preview.tiles.every((t) => t.status === 'bridge')).toBe(true);
  });

  it('Brückenkacheln tragen den Pfeiler-Aufschlag (gezeigter = gezahlter Preis)', () => {
    const controller = elevatedReady();
    // Landkachel (Gras) vs. Wasserkachel: die Wasserkachel muss teurer sein.
    paintTerrain(controller, [[at(6, 5).x, at(6, 5).y]], 'water');
    const landCost = controller.getBuildCost('road_elevated', at(5, 5).x, at(5, 5).y);
    const bridgeCost = controller.getBuildCost('road_elevated', at(6, 5).x, at(6, 5).y);
    // Basis 1.200 Geld / 40 Holz; Aufschlag +800 Geld / +20 Holz über Wasser.
    expect(landCost.money).toBe(1_200);
    expect(bridgeCost.money).toBe(2_000);
    expect(bridgeCost.wood).toBe(60);
  });

  it('baut eine echte Brücke ins Netz (Instanz + Abbuchung + roadNetwork)', () => {
    const controller = elevatedReady();
    paintTerrain(controller, [[at(5, 5).x, at(5, 5).y]], 'water');
    const moneyBefore = controller.state.resources.money;
    const result = controller.placeBuilding('road_elevated', at(5, 5).x, at(5, 5).y);
    expect(result.ok).toBe(true);
    // Kachel ist jetzt Teil des Straßennetzes (verbindet weiter).
    expect(controller.derived.roadNetwork.has(`${at(5, 5).x},${at(5, 5).y}`)).toBe(true);
    // Es wurde eine road_elevated-Instanz gesetzt.
    const built = Object.values(controller.state.buildings).find(
      (b) => b.defId === 'road_elevated' && b.x === at(5, 5).x && b.y === at(5, 5).y,
    );
    expect(built).toBeDefined();
    // Kosten wurden abgebucht (Basis + Brückenaufschlag = 2.000 Geld).
    expect(controller.state.resources.money).toBe(moneyBefore - 2_000);
  });

  it('Höhenstraße bleibt ohne Netzanschluss blockiert (kein freischwebender Steg)', () => {
    const controller = elevatedReady();
    paintTerrain(controller, [[at(20, 20).x, at(20, 20).y]], 'water');
    const preview = controller.roadPathPreview([at(20, 20)], 'road_elevated');
    expect(preview.valid).toBe(false);
    expect(preview.tiles[0]!.reason).toBe('needs_road');
  });
});
