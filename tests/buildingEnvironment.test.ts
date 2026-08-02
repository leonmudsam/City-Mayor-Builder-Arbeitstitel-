import { InstancedMesh, MeshStandardMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { buildingsConfig } from '../src/game/config/buildings.config.ts';
import { buildingMaterialProfile } from '../src/renderer/three/buildingAppearance.ts';
import { buildingEnvironmentPlan } from '../src/renderer/three/buildingEnvironment.ts';
import {
  buildBuildingEnvironment,
  rotatedLocalPosition,
} from '../src/renderer/three/buildingEnvironmentRenderer.ts';

const def = (id: string) => buildingsConfig.find((entry) => entry.id === id)!;

describe('Gebäudeintegration in die Welt', () => {
  it('gibt Rathaus, Sägewerk, Farm und Industrie unterscheidbare Umgebungen', () => {
    const hall = buildingEnvironmentPlan(def('town_hall'), 0);
    const sawmill = buildingEnvironmentPlan(def('sawmill'), 0);
    const farm = buildingEnvironmentPlan(def('farm'), 0);
    const quarry = buildingEnvironmentPlan(def('quarry'), 0);
    expect(hall.map((entry) => entry.kind)).toContain('flower');
    expect(sawmill.map((entry) => entry.kind)).toContain('log');
    expect(farm.map((entry) => entry.kind)).toContain('field');
    expect(quarry.map((entry) => entry.kind)).toContain('ore');
    expect(new Set([hall, sawmill, farm, quarry].map((plan) => plan.map((entry) => entry.kind).join(','))).size).toBe(4);
  });

  it('lässt die Umgebung mit der Ausbaustufe wachsen', () => {
    expect(buildingEnvironmentPlan(def('sawmill'), 2).length).toBeGreaterThan(
      buildingEnvironmentPlan(def('sawmill'), 0).length,
    );
    expect(buildingEnvironmentPlan(def('town_hall'), 1).length).toBeGreaterThan(
      buildingEnvironmentPlan(def('town_hall'), 0).length,
    );
  });

  it('dreht lokale Prop-Positionen zusammen mit dem Gebäude', () => {
    const p = rotatedLocalPosition(10, 20, 2, 0, 90);
    expect(p.x).toBeCloseTo(10, 6);
    expect(p.z).toBeCloseTo(18, 6);
    expect(p.rotationY).toBeCloseTo(Math.PI / 2, 6);
  });

  it('harmonisiert rote/rurale und industrielle GLBs getrennt', () => {
    const rural = buildingMaterialProfile(def('farm'));
    const industrial = buildingMaterialProfile(def('power_plant'));
    expect(rural.saturation).toBeLessThan(1);
    expect(industrial.saturation).toBeLessThan(rural.saturation);
    expect(industrial.metalnessMax).toBeGreaterThan(rural.metalnessMax);
    expect(buildingMaterialProfile(def('town_hall')).roughnessMin).toBeGreaterThan(0.7);
  });

  it('verwendet eine neutrale Materialbasis statt Instanzfarben doppelt abzudunkeln', () => {
    const built = buildBuildingEnvironment([
      {
        kind: 'yard',
        x: 10,
        y: 2,
        z: 10,
        scaleX: 2,
        scaleY: 1,
        scaleZ: 2,
        rotationY: 0,
        colorVariant: 0,
      },
    ]);
    const mesh = built.group.children[0] as InstancedMesh;
    expect((mesh.material as MeshStandardMaterial).color.getHex()).toBe(0xffffff);
    expect(mesh.instanceColor).not.toBeNull();
  });
});
