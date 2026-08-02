import { describe, expect, it } from 'vitest';
import { DoubleSide, FrontSide, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';
import {
  analyticWaterFresnel,
  configureWaterSurfacePerformance,
  shoreWaterOpacity,
} from '../src/renderer/three/waterAppearance.ts';

describe('Premium-Wasserwirkung', () => {
  it('macht nur das flache Ufer klar und Tiefwasser vollständig opak', () => {
    expect(shoreWaterOpacity(1)).toBeCloseTo(0.58, 6);
    expect(shoreWaterOpacity(5)).toBeGreaterThan(shoreWaterOpacity(1));
    expect(shoreWaterOpacity(9)).toBe(1);
    expect(shoreWaterOpacity(255)).toBe(1);
  });

  it('verstärkt die Himmelsreflexion nur bei streifendem Blick', () => {
    expect(analyticWaterFresnel(0)).toBe(1);
    expect(analyticWaterFresnel(0.5)).toBeGreaterThan(analyticWaterFresnel(0.9));
    expect(analyticWaterFresnel(1)).toBe(0);
  });

  it('rendert das dichte Ozeanraster einseitig, einmalig und frustum-cullbar', () => {
    const geometry = new PlaneGeometry(512, 512, 2, 2);
    const material = new MeshStandardMaterial({ transparent: true, side: DoubleSide });
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    expect(geometry.boundingSphere).toBeNull();

    configureWaterSurfacePerformance(mesh);

    expect(material.side).toBe(FrontSide);
    expect(material.forceSinglePass).toBe(true);
    expect(geometry.boundingSphere).not.toBeNull();
    expect(mesh.frustumCulled).toBe(true);
    geometry.dispose();
    material.dispose();
  });
});
