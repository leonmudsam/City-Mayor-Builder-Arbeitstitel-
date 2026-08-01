import { describe, expect, it } from 'vitest';
import { Mesh } from 'three';
import {
  ambientVehicleColor,
  createStylizedVehicleFallback,
  createStylizedVehicleGeometry,
} from '../src/renderer/three/vehicleFallback.ts';

describe('gebündelte Cartoon-Fahrzeuge', () => {
  it('wählt Umgebungsfarben stabil statt bei jedem Rebuild neu zu würfeln', () => {
    const color = ambientVehicleColor('12,4:18,9:0');
    expect(color).toBe(ambientVehicleColor('12,4:18,9:0'));
    expect([0xc95343, 0x3f78a8, 0xd4a33b, 0xe8e1d3, 0x4f8b69, 0x48515e]).toContain(color);
  });

  it.each(['car', 'van', 'medium_truck', 'large_truck', 'logging_truck', 'police_car'])(
    'bündelt %s samt Rädern und Fahrgestell in genau ein Mesh',
    (kind) => {
      const fallback = createStylizedVehicleFallback(kind, `test:${kind}`);
      expect(fallback.children).toHaveLength(1);
      expect(fallback.children[0]).toBeInstanceOf(Mesh);

      const geometry = createStylizedVehicleGeometry(kind, `test:${kind}`);
      geometry.computeBoundingBox();
      expect(geometry.getAttribute('color')?.count).toBe(geometry.getAttribute('position').count);
      expect(geometry.boundingBox?.min.y).toBeGreaterThanOrEqual(0);
      expect(geometry.boundingBox?.max.y).toBeGreaterThan(0.25);
      geometry.dispose();
    },
  );
});
