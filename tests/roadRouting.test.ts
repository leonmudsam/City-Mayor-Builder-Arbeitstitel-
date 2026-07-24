import { describe, expect, it } from 'vitest';
import { newController, nearTownHall, paintTerrain, refreshDerived, setLevel } from './helpers.ts';
import type { GameController } from '../src/game/commands/controller.ts';

// § Infrastruktur 2.0 / I2 (überlappt 10.0-R6): der terrainbewusste Straßen-Router
// verbindet Kontrollpunkte LÜCKENLOS über wirklich bebaubares Gelände. Bodenstraßen
// weichen Wasser aus, Höhenstraßen überbrücken es; gebaut wird atomar (alles oder
// nichts). Die Passierbarkeit ist deckungsgleich mit `validatePlacement` (§2) — der
// Router ist nur ein Vorschlag, `analyseRoadPath` bleibt die Wahrheit.
describe('Straßen-Router (Infrastruktur 2.0 / I2)', () => {
  const at = (dx: number, dy: number) => nearTownHall(dx, dy);

  /** Alle Regionen freischalten, damit ein Weg nicht an einer Regionssperre statt
   *  am Terrain scheitert. */
  function unlockAll(controller: GameController): void {
    for (const region of Object.values(controller.state.world.regions)) region.status = 'unlocked';
    refreshDerived(controller);
  }

  function ready(): GameController {
    const { controller } = newController(); // flach begraster Start
    unlockAll(controller);
    controller.state.resources = { money: 2_000_000, wood: 2_000, stone: 500, food: 40, freshwater: 0 };
    return controller;
  }

  /** Jede aufeinanderfolgende Kachel eines Pfades ist orthogonal benachbart. */
  function isGapless(tiles: readonly { x: number; y: number }[]): boolean {
    for (let i = 1; i < tiles.length; i++) {
      const a = tiles[i - 1]!;
      const b = tiles[i]!;
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) !== 1) return false;
    }
    return true;
  }

  it('füllt die Lücke zwischen zwei entfernten Kontrollpunkten lückenlos', () => {
    const controller = ready();
    // Nur Start + Ziel; der Router füllt die 10 Kacheln dazwischen.
    const preview = controller.roadPathPreview([at(0, 6), at(0, 16)], 'road');
    expect(preview.tiles.length).toBeGreaterThanOrEqual(11);
    expect(isGapless(preview.tiles)).toBe(true);
    expect(preview.tiles[0]).toMatchObject({ x: at(0, 6).x, y: at(0, 6).y });
    expect(preview.tiles[preview.tiles.length - 1]).toMatchObject({ x: at(0, 16).x, y: at(0, 16).y });
    expect(preview.valid).toBe(true);
  });

  it('lässt bereits benachbarte Punkte unverändert (idempotent, Regressionsschutz)', () => {
    const controller = ready();
    const preview = controller.roadPathPreview([at(0, 6), at(1, 6), at(2, 6)], 'road');
    expect(preview.tiles.map((t) => `${t.x},${t.y}`)).toEqual([
      `${at(0, 6).x},${at(0, 6).y}`,
      `${at(1, 6).x},${at(1, 6).y}`,
      `${at(2, 6).x},${at(2, 6).y}`,
    ]);
  });

  it('Bodenstraße routet um eine Wasserkachel herum (kein Wasser im Pfad)', () => {
    const controller = ready();
    // Wasser mitten auf die direkte Ost-Linie; der Router muss ausweichen.
    paintTerrain(controller, [[at(2, 6).x, at(2, 6).y]], 'water');
    const preview = controller.roadPathPreview([at(0, 6), at(4, 6)], 'road');
    expect(preview.valid).toBe(true);
    expect(isGapless(preview.tiles)).toBe(true);
    // Keine einzige Kachel liegt auf Wasser (die Bodenstraße kann Wasser nicht bauen).
    expect(preview.tiles.every((t) => t.terrain !== 'water' && t.terrain !== 'river')).toBe(true);
    // Der Umweg ist länger als die 5 Kacheln der geraden Linie.
    expect(preview.tiles.length).toBeGreaterThan(5);
  });

  it('Höhenstraße überbrückt eine breite Wasserwand statt endlos auszuweichen', () => {
    const controller = ready();
    setLevel(controller, 2); // road_elevated freigeschaltet
    // Breites Wasserband quer über die ganze Suchbreite, WEIT südlich des
    // Startnetzes (das sonst mit bestehenden Straßen die Wand unterquert) → der
    // einzige Weg über die Wand ist eine FRISCHE Brücke, kein Umweg möglich.
    const tx = at(0, 0).x;
    const band: [number, number][] = [];
    for (let x = tx - 25; x <= tx + 25; x++) {
      for (let dy = 40; dy <= 42; dy++) band.push([x, at(0, dy).y]);
    }
    paintTerrain(controller, band, 'water');

    // Start hängt am Netz (bei y+5), Ziel liegt südlich der Wand.
    const elevated = controller.roadPathPreview([at(0, 6), at(0, 46)], 'road_elevated');
    expect(elevated.valid).toBe(true);
    expect(isGapless(elevated.tiles)).toBe(true);
    expect(elevated.tiles.some((t) => t.status === 'bridge')).toBe(true);

    // Die Bodenstraße kommt hier nicht durch (Regressionsschutz der Trennlinie).
    const ground = controller.roadPathPreview([at(0, 6), at(0, 46)], 'road');
    expect(ground.valid).toBe(false);
    expect(ground.blocked).toBeGreaterThan(0);
  });

  it('buildRoadPath baut den ganzen Pfad atomar (Instanzen + Abbuchung + Netz)', () => {
    const controller = ready();
    const moneyBefore = controller.state.resources.money;
    const roadsBefore = Object.values(controller.state.buildings).filter((b) => b.defId === 'road').length;

    const result = controller.buildRoadPath([at(0, 6), at(0, 10)], 'road');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.built).toBe(5); // y 6..10
    const roadsAfter = Object.values(controller.state.buildings).filter((b) => b.defId === 'road').length;
    expect(roadsAfter).toBe(roadsBefore + 5);
    // Basis 300 Geld je Bodenstraßenkachel → 5 × 300.
    expect(controller.state.resources.money).toBe(moneyBefore - 5 * 300);
    // Alle Kacheln sind Teil des Straßennetzes.
    for (let dy = 6; dy <= 10; dy++) {
      expect(controller.derived.roadNetwork.has(`${at(0, dy).x},${at(0, dy).y}`)).toBe(true);
    }
  });

  it('buildRoadPath baut NICHTS, wenn der Pfad blockiert ist (kein halber Stummel)', () => {
    const controller = ready();
    const moneyBefore = controller.state.resources.money;
    const buildingsBefore = Object.keys(controller.state.buildings).length;
    // Einzelner Kontrollpunkt ohne Netzanschluss → kompletter Plan ungültig.
    const result = controller.buildRoadPath([at(30, 30)], 'road');
    expect(result.ok).toBe(false);
    expect(Object.keys(controller.state.buildings).length).toBe(buildingsBefore);
    expect(controller.state.resources.money).toBe(moneyBefore);
  });
});
