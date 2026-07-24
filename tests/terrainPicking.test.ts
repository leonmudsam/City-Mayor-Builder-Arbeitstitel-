import { describe, expect, it } from 'vitest';
import { raycastHeightfield, type PickRay } from '../src/renderer/three/terrainPicking.ts';

// Strahl aus Ursprung O in Richtung (nx,ny,nz) — Richtung muss nicht normiert sein,
// der Helfer normiert selbst.
function ray(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number): PickRay {
  return { ox, oy, oz, dx, dy, dz };
}

const BAND = { minY: -5, maxY: 30 };

describe('raycastHeightfield (Terrain-Picking gegen das Höhenfeld)', () => {
  it('trifft flaches Gelände wie die alte Ebene', () => {
    // 45°-Strahl von (0,20,0) auf y=0 → Ebene schneidet bei x=20.
    const hit = raycastHeightfield(ray(0, 20, 0, 1, -1, 0), () => 0, BAND);
    expect(hit).toBeDefined();
    expect(hit!.x).toBeCloseTo(20, 1);
    expect(hit!.z).toBeCloseTo(0, 1);
  });

  it('trifft auf einem Hang die ECHTE Oberfläche — nicht die y=0-Ebene', () => {
    // Rampe, die nach +x ansteigt (Steigung 0.5). Derselbe 45°-Strahl.
    const ramp = (x: number) => 0.5 * x;
    const hit = raycastHeightfield(ray(0, 20, 0, 1, -1, 0), (x) => ramp(x), BAND);
    expect(hit).toBeDefined();

    // Die naive y=0-Ebene läge bei x=20; der Höhenschnitt liegt deutlich früher.
    const planeX = 20;
    expect(Math.abs(hit!.x - planeX)).toBeGreaterThan(5);
    expect(hit!.x).toBeCloseTo(40 / 3, 1); // analytisch: 20 - x = 0.5x → x = 13.33…

    // Der Treffer sitzt exakt AUF der Oberfläche: Strahlhöhe (20 - x) == Bodenhöhe (0.5x).
    const rayY = 20 - hit!.x;
    expect(rayY).toBeCloseTo(ramp(hit!.x), 1);
  });

  it('trifft ein Hochplateau senkrecht darunter (nicht bei y=0)', () => {
    // Plateau auf Höhe 24; senkrechter Strahl von oben.
    const hit = raycastHeightfield(ray(50, 100, 50, 0, -1, 0), () => 24, { minY: 0, maxY: 40 });
    expect(hit).toBeDefined();
    expect(hit!.x).toBeCloseTo(50, 2);
    expect(hit!.z).toBeCloseTo(50, 2);
  });

  it('liefert undefined, wenn der Strahl in den Himmel zeigt', () => {
    const hit = raycastHeightfield(ray(0, 20, 0, 1, 1, 0), () => 0, BAND);
    expect(hit).toBeUndefined();
  });

  it('findet über den flachen Streifpfad eine ansteigende Rampe (grazing)', () => {
    // Fast horizontaler Strahl auf Höhe 5; Rampe 0.5x kreuzt ihn bei x=10.
    const hit = raycastHeightfield(ray(0, 5, 0, 1, 0, 0), (x) => 0.5 * x, { minY: -5, maxY: 40 });
    expect(hit).toBeDefined();
    expect(hit!.x).toBeCloseTo(10, 1);
  });

  it('ist deterministisch (gleicher Strahl → gleicher Treffer)', () => {
    const r = ray(3, 18, 7, 0.6, -1, 0.2);
    const a = raycastHeightfield(r, (x, z) => 0.3 * x + 0.1 * z, BAND);
    const b = raycastHeightfield(r, (x, z) => 0.3 * x + 0.1 * z, BAND);
    expect(a).toBeDefined();
    expect(a).toEqual(b);
  });
});
