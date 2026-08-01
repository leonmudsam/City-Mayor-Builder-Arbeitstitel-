import { describe, expect, it } from 'vitest';
import { deriveCityFrame } from '../src/renderer/three/cityFraming.ts';

describe('dynamisches City-Framing', () => {
  it('zeigt einen kleinen Stadtkern nah und zentriert', () => {
    const frame = deriveCityFrame([
      { x: 100, y: 200, w: 5, h: 5 },
      { x: 107, y: 202, w: 3, h: 3 },
    ], 102.5, 202.5);
    expect(frame.x).toBeCloseTo(105);
    expect(frame.z).toBeCloseTo(202.5);
    expect(frame.dist).toBe(34);
  });

  it('deckt einen wachsenden Kern ab, wird aber nie zur Regionsübersicht', () => {
    const frame = deriveCityFrame([
      { x: 90, y: 190, w: 4, h: 4 },
      { x: 124, y: 220, w: 4, h: 4 },
    ], 102.5, 202.5);
    expect(frame.dist).toBeGreaterThan(40);
    expect(frame.dist).toBeLessThanOrEqual(48);
  });
});
