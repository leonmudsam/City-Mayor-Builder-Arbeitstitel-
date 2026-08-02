import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture } from 'three';
import { describe, expect, it } from 'vitest';
import { buildingsConfig } from '../src/game/config/buildings.config.ts';
import { buildingMaterialProfile } from '../src/renderer/three/buildingAppearance.ts';
import {
  gradeBuildingAlbedo,
  harmonizeBuildingAppearance,
} from '../src/renderer/three/buildingAppearanceRenderer.ts';

const def = (id: string) => buildingsConfig.find((entry) => entry.id === id)!;

function shaderFixture(): Parameters<MeshStandardMaterial['onBeforeCompile']>[0] {
  return {
    uniforms: {},
    vertexShader: '',
    fragmentShader: 'void main() {\n#include <map_fragment>\n#include <color_fragment>\n}',
  } as Parameters<MeshStandardMaterial['onBeforeCompile']>[0];
}

describe('Gebaeude-Materialharmonisierung', () => {
  it('gradet texturbasierte Albedo rein und schont dunkle kuehle Fensterpixel', () => {
    const profile = buildingMaterialProfile(def('farm'));
    const warmSource = [0.82, 0.18, 0.07] as const;
    const darkWindow = [0.02, 0.03, 0.08] as const;
    const warmResult = gradeBuildingAlbedo(warmSource, profile);
    const windowResult = gradeBuildingAlbedo(darkWindow, profile);

    expect(warmSource).toEqual([0.82, 0.18, 0.07]);
    expect(Math.max(...warmResult) - Math.min(...warmResult)).toBeLessThan(
      Math.max(...warmSource) - Math.min(...warmSource),
    );
    expect(warmResult[0]).toBeGreaterThan(warmResult[1]);
    expect(windowResult[0]).toBeCloseTo(darkWindow[0], 2);
    expect(windowResult[1]).toBeCloseTo(darkWindow[1], 2);
    expect(windowResult[2]).toBeCloseTo(darkWindow[2], 2);
  });

  it('klont Materialhuellen je Mesh, teilt Maps und kalibriert PBR-Werte', () => {
    const map = new Texture();
    const normalMap = new Texture();
    const source = new MeshStandardMaterial({
      map,
      normalMap,
      roughness: 0.25,
      metalness: 0.9,
      flatShading: true,
    });
    source.normalScale.set(1, -0.75);
    const first = new Mesh(new BoxGeometry(), source);
    const second = new Mesh(new BoxGeometry(), source);
    const building = new Group().add(first, second);

    expect(harmonizeBuildingAppearance(building, def('farm'))).toBe(building);
    const firstMaterial = first.material as MeshStandardMaterial;
    const secondMaterial = second.material as MeshStandardMaterial;
    const profile = buildingMaterialProfile(def('farm'));

    expect(firstMaterial).not.toBe(source);
    expect(secondMaterial).not.toBe(source);
    expect(firstMaterial).not.toBe(secondMaterial);
    expect(firstMaterial.map).toBe(map);
    expect(firstMaterial.normalMap).toBe(normalMap);
    expect(firstMaterial.roughness).toBe(profile.roughnessMin);
    expect(firstMaterial.metalness).toBe(profile.metalnessMax);
    expect(firstMaterial.normalScale.x).toBeCloseTo(profile.normalStrength, 6);
    expect(firstMaterial.normalScale.y).toBeCloseTo(-0.75 * profile.normalStrength, 6);
    expect(firstMaterial.flatShading).toBe(false);
    expect(source.roughness).toBe(0.25);
    expect(source.metalness).toBe(0.9);
    expect(source.flatShading).toBe(true);
  });

  it('injiziert das Grading nach map_fragment und liefert stabile Programmschluessel', () => {
    const material = new MeshStandardMaterial({ map: new Texture() });
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = `// Quell-Hook\n${shader.fragmentShader}`;
    };
    material.customProgramCacheKey = () => 'source-hook-v1';
    const firstMesh = new Mesh(new BoxGeometry(), material);
    const secondMesh = new Mesh(new BoxGeometry(), material);
    harmonizeBuildingAppearance(firstMesh, def('farm'));
    harmonizeBuildingAppearance(secondMesh, def('farm'));
    const first = firstMesh.material as MeshStandardMaterial;
    const second = secondMesh.material as MeshStandardMaterial;
    const shader = shaderFixture();

    first.onBeforeCompile(shader, {} as never);
    expect(shader.fragmentShader).toContain('// Quell-Hook');
    expect(shader.fragmentShader.indexOf('#include <map_fragment>')).toBeLessThan(
      shader.fragmentShader.indexOf('cmbBuildingSourceAlbedo'),
    );
    expect(first.customProgramCacheKey()).toBe(second.customProgramCacheKey());

    const industrialMesh = new Mesh(new BoxGeometry(), material);
    harmonizeBuildingAppearance(industrialMesh, def('power_plant'));
    expect((industrialMesh.material as MeshStandardMaterial).customProgramCacheKey()).not.toBe(
      first.customProgramCacheKey(),
    );
  });

  it('klont Glas- und Emissivmaterialien, ohne deren Oberflaechen umzudeuten', () => {
    const glass = new MeshStandardMaterial({
      color: 0x88bbdd,
      roughness: 0.12,
      metalness: 0.62,
      transparent: true,
      opacity: 0.65,
    });
    glass.name = 'window_glass';
    const emissive = new MeshStandardMaterial({
      color: 0x332211,
      emissive: 0xffaa44,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.5,
    });
    const glassMesh = new Mesh(new BoxGeometry(), glass);
    const emissiveMesh = new Mesh(new BoxGeometry(), emissive);
    harmonizeBuildingAppearance(new Group().add(glassMesh, emissiveMesh), def('town_hall'));

    for (const [mesh, source] of [
      [glassMesh, glass],
      [emissiveMesh, emissive],
    ] as const) {
      const cloned = mesh.material as MeshStandardMaterial;
      const shader = shaderFixture();
      cloned.onBeforeCompile(shader, {} as never);
      expect(cloned).not.toBe(source);
      expect(cloned.roughness).toBe(source.roughness);
      expect(cloned.metalness).toBe(source.metalness);
      expect(shader.fragmentShader).not.toContain('cmbBuildingSourceAlbedo');
    }
  });
});
