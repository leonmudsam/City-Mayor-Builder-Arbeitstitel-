import { FrontSide, type Material, type Mesh } from 'three';

/** Parameter und kleine Render-Invarianten des bestehenden Ozeanpfads. */

export const SHALLOW_WATER_MIN_OPACITY = 0.58;
export const SHALLOW_WATER_OPAQUE_DEPTH = 9;
export const WATER_FRESNEL_POWER = 2.25;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Ufer ist klar, Tiefwasser bleibt opak und verdeckt den endlichen Lakebed-Bake. */
export function shoreWaterOpacity(depthFromShore: number): number {
  const t = clamp01((depthFromShore - 1) / (SHALLOW_WATER_OPAQUE_DEPTH - 1));
  return SHALLOW_WATER_MIN_OPACITY + (1 - SHALLOW_WATER_MIN_OPACITY) * t;
}

/** Analytische Fresnel-Kurve für die günstige Horizontreflexion. */
export function analyticWaterFresnel(viewUp: number): number {
  return (1 - clamp01(Math.abs(viewUp))) ** WATER_FRESNEL_POWER;
}

/**
 * Die Wasseroberfläche wird ausschließlich von oben betrachtet. Transparentes
 * DoubleSide löst in Three sonst zwei komplette Renderdurchläufe aus; bei dem
 * hochaufgelösten Inselraster wäre das eine permanente Verdopplung der Last.
 */
export function configureWaterSurfacePerformance(mesh: Mesh): void {
  const materials: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const material of materials) {
    material.side = FrontSide;
    material.forceSinglePass = true;
    material.needsUpdate = true;
  }
  if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
  mesh.frustumCulled = true;
}
