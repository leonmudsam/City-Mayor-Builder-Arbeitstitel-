import { describe, expect, it, afterEach } from 'vitest';
import {
  MAX_PIXELS_PER_TILE,
  MAX_SNAPSHOT_SIDE,
  captureWorldSnapshot,
  hasWorldSnapshotSource,
  planWorldSnapshot,
  setWorldSnapshotSource,
  snapshotCovers,
} from '../src/renderer/worldSnapshot.ts';

const WORLD = 512;

afterEach(() => setWorldSnapshotSource(undefined));

describe('§ P4 — der Ausschnitt der Weltaufnahme', () => {
  it('legt einen Rand um den sichtbaren Bereich, damit Verschieben nicht sofort neu aufnimmt', () => {
    const visible = { minX: 200, minY: 200, maxX: 240, maxY: 226 };
    const { area } = planWorldSnapshot(visible, 20, WORLD);
    expect(area.x).toBeLessThan(visible.minX);
    expect(area.y).toBeLessThan(visible.minY);
    expect(area.x + area.w).toBeGreaterThan(visible.maxX);
    expect(area.y + area.h).toBeGreaterThan(visible.maxY);
  });

  it('bleibt in der Welt — kein Ausschnitt jenseits des Randes', () => {
    const { area } = planWorldSnapshot({ minX: 0, minY: 490, maxX: 30, maxY: 511 }, 20, WORLD);
    expect(area.x).toBeGreaterThanOrEqual(0);
    expect(area.y).toBeGreaterThanOrEqual(0);
    expect(area.x + area.w).toBeLessThanOrEqual(WORLD);
    expect(area.y + area.h).toBeLessThanOrEqual(WORLD);
  });

  it('deckelt die Bildgröße — die ganze Insel passt unter die Kantenlänge', () => {
    const { area, pixelsPerTile } = planWorldSnapshot(
      { minX: 0, minY: 0, maxX: WORLD, maxY: WORLD },
      30,
      WORLD,
    );
    expect(Math.max(area.w, area.h) * pixelsPerTile).toBeLessThanOrEqual(MAX_SNAPSHOT_SIDE + 1);
  });

  it('nimmt nie feiner auf als die Karte zeichnet', () => {
    const plan = planWorldSnapshot({ minX: 250, minY: 250, maxX: 258, maxY: 256 }, 400, WORLD);
    expect(plan.pixelsPerTile).toBeLessThanOrEqual(MAX_PIXELS_PER_TILE);
  });
});

describe('§ P4 — wann eine Aufnahme neu gebraucht wird', () => {
  const snapshot = { area: { x: 100, y: 100, w: 60, h: 40 }, pixelsPerTile: 20 };

  it('deckt einen Blick, der ganz darin liegt', () => {
    expect(snapshotCovers(snapshot, { minX: 110, minY: 110, maxX: 150, maxY: 130 }, 20)).toBe(true);
  });

  it('deckt einen Blick nicht, der herausragt', () => {
    expect(snapshotCovers(snapshot, { minX: 110, minY: 110, maxX: 170, maxY: 130 }, 20)).toBe(false);
  });

  it('reicht nicht mehr, wenn deutlich näher gezoomt wird', () => {
    expect(snapshotCovers(snapshot, { minX: 110, minY: 110, maxX: 130, maxY: 120 }, 39)).toBe(false);
  });

  it('bleibt beim Herauszoomen gültig — eine zu FEINE Aufnahme ist kein Grund', () => {
    expect(snapshotCovers(snapshot, { minX: 105, minY: 105, maxX: 155, maxY: 135 }, 4)).toBe(true);
  });
});

describe('§ P4 — die Anmeldung des Renderers', () => {
  it('liefert ohne laufende Welt nichts, statt zu werfen', () => {
    expect(hasWorldSnapshotSource()).toBe(false);
    expect(captureWorldSnapshot({ x: 0, y: 0, w: 10, h: 10 }, 8)).toBeUndefined();
  });

  it('reicht Ausschnitt und Auflösung unverändert an den Renderer weiter', () => {
    const calls: { w: number; pixelsPerTile: number }[] = [];
    setWorldSnapshotSource((area, pixelsPerTile) => {
      calls.push({ w: area.w, pixelsPerTile });
      return undefined;
    });
    expect(hasWorldSnapshotSource()).toBe(true);
    captureWorldSnapshot({ x: 4, y: 4, w: 32, h: 24 }, 12);
    expect(calls).toEqual([{ w: 32, pixelsPerTile: 12 }]);
  });
});
