import { describe, expect, it } from 'vitest';
import { chebyshev } from '../src/game/buildings/effects.ts';
import { coverageArea, coversTile } from '../src/game/buildings/coverage.ts';
import { flattenTerrain, nearTownHall, newController, setLevel, T0 } from './helpers.ts';

// § Core Gameplay G2 ⑤ — Wirkungsradien.
//
// Befund: Die Reichweite ist `chebyshev(...) <= radius`, also ein
// ACHSENPARALLELES QUADRAT. Der Renderer zeichnete dafür einen eingeschriebenen
// Kreis — gemessen über alle Radiusgebäude blieben damit 19–30 % der wirklich
// versorgten Kacheln unsichtbar (Brunnen r9: 108 von 361). Sichtbar wurde nie
// zu viel, immer zu wenig: die Ecken, in denen ein Haus versorgt IST, ohne dass
// man es sah.
//
// Diese Suite prüft nicht die Optik, sondern die Deckungsgleichheit von
// gezeichneter Fläche und Reichweitenregel (dieselbe Disziplin wie D-042).

/** Alle Footprints, die im Gebäudekatalog wirklich Radien tragen. */
const FOOTPRINTS: { w: number; h: number }[] = [
  { w: 1, h: 1 },
  { w: 2, h: 2 },
  { w: 3, h: 3 },
  { w: 2, h: 3 }, // ungleiche Parität: die Fläche ist dann ein Rechteck
];

describe('coverageArea ist deckungsgleich mit der Reichweitenprüfung', () => {
  it('trifft für jede Kachel dasselbe Urteil wie chebyshev', () => {
    let covered = 0;
    for (const { w, h } of FOOTPRINTS) {
      for (const radius of [1, 2, 3, 8, 9, 14, 16, 18, 21, 32]) {
        const x = 40;
        const y = 55;
        const area = coverageArea(x, y, w, h, radius);
        const cx = x + (w - 1) / 2;
        const cy = y + (h - 1) / 2;
        for (let ix = x - radius - 2; ix <= x + w + radius + 2; ix++) {
          for (let iy = y - radius - 2; iy <= y + h + radius + 2; iy++) {
            const byRule = chebyshev(ix, iy, cx, cy) <= radius;
            if (byRule) covered++;
            expect(coversTile(area, ix, iy), `${w}x${h} r${radius} @ ${ix},${iy}`).toBe(byRule);
          }
        }
      }
    }
    expect(covered).toBeGreaterThan(0); // ein leerer Durchlauf wäre kein Beweis
  });

  it('umschließt den eigenen Footprint vollständig', () => {
    for (const { w, h } of FOOTPRINTS) {
      const area = coverageArea(10, 10, w, h, 1);
      for (let dx = 0; dx < w; dx++) {
        for (let dy = 0; dy < h; dy++) {
          expect(coversTile(area, 10 + dx, 10 + dy)).toBe(true);
        }
      }
    }
  });

  it('belegt den Fehler des alten Kreises: er zeigte weniger, nie mehr', () => {
    // Der Renderer zeichnete einen Kreis mit Radius r um die Weltmitte
    // (x + w/2). Kachelmitte in Weltkoordinaten = Index + 0.5.
    const misses: number[] = [];
    for (const { w, h } of FOOTPRINTS) {
      for (const radius of [8, 9, 14, 16, 18, 32]) {
        const area = coverageArea(0, 0, w, h, radius);
        let coveredNotDrawn = 0;
        let drawnNotCovered = 0;
        for (let ix = -radius - 2; ix <= w + radius + 2; ix++) {
          for (let iy = -radius - 2; iy <= h + radius + 2; iy++) {
            const isCovered = coversTile(area, ix, iy);
            const isDrawn = Math.hypot(ix + 0.5 - w / 2, iy + 0.5 - h / 2) <= radius;
            if (isCovered && !isDrawn) coveredNotDrawn++;
            if (!isCovered && isDrawn) drawnNotCovered++;
          }
        }
        const total = (area.maxX - area.minX + 1) * (area.maxY - area.minY + 1);
        expect(drawnNotCovered).toBe(0); // der Kreis versprach nie zu viel
        misses.push((100 * coveredNotDrawn) / total);
      }
    }
    expect(Math.min(...misses)).toBeGreaterThan(15);
    expect(Math.max(...misses)).toBeLessThan(35);
  });
});

describe('das Overlay liefert die Fläche mit', () => {
  it('nennt für jede Quelle den Bereich, den der Renderer zeichnen muss', () => {
    const { controller } = newController();
    setLevel(controller, 3);
    flattenTerrain(controller);
    const spot = nearTownHall(7, 6);
    expect(controller.placeBuilding('well', spot.x, spot.y)).toEqual({ ok: true });
    controller.update(T0 + 45_000);

    const well = Object.values(controller.state.buildings).find((b) => b.defId === 'well')!;
    const overlay = controller.getCoverageOverlay(well.id)!;
    const source = overlay.sources.find((s) => s.selected)!;
    // Kein zweiter Ableitungsweg: die mitgelieferte Fläche muss exakt die des
    // Radius um diesen Footprint sein.
    expect(source.area).toEqual(coverageArea(source.x, source.y, source.w, source.h, source.radius));
    // …und sie muss den versorgten Bereich beschreiben, nicht den Footprint.
    expect(source.area.maxX - source.area.minX + 1).toBe(2 * source.radius + source.w);
  });
});
