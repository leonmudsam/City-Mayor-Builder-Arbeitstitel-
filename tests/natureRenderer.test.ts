import { describe, expect, it } from 'vitest';
import { InstancedMesh, MeshLambertMaterial } from 'three';
import {
  emptyPlacement,
  type NatureInstance,
} from '../src/renderer/three/natureDistribution.ts';
import {
  buildNatureMass,
  updateNatureWind,
} from '../src/renderer/three/natureRenderer.ts';

const instance = (
  x: number,
  y: number,
  scale = 1,
  zone: NatureInstance['zone'] = 'forest_core',
): NatureInstance => ({ x, y, scale, zone });

describe('Nature-Renderer-HLOD', () => {
  it('ersetzt ausschliesslich den Fernwald hinter der mittleren LOD-Grenze', () => {
    const placement = emptyPlacement();
    for (const baseX of [24, 96]) {
      for (let y = 24; y < 28; y++) {
        for (let x = baseX; x < baseX + 4; x++) placement.pine.push(instance(x, y));
      }
    }
    placement.sapling.push(instance(30, 30, 0.7, 'forest_edge'));
    placement.rock.push(instance(50, 50, 1, 'rocky_highland'));
    placement.flower.push(instance(54, 54, 0.8, 'meadow'));
    const unchangedPlacement = structuredClone(placement);

    const built = buildNatureMass(placement, {
      viewDistance: 180,
      smallPropDistance: 70,
      lodDistances: [60, 120, 180],
      impostorsEnabled: true,
      claimShadow: () => false,
    });

    const pine = built.lod.filter((entry) => entry.object.userData.natureKind === 'pine');
    const saplings = built.lod.filter((entry) => entry.object.userData.natureKind === 'sapling');
    const rocks = built.lod.filter((entry) => entry.object.userData.natureKind === 'rock');
    const flowers = built.lod.filter((entry) => entry.object.userData.natureKind === 'flower');
    const forestHlod = built.lod.filter((entry) => entry.object.userData.natureHlod === true);

    expect(pine).toHaveLength(2);
    for (const entry of pine) {
      expect(entry).toMatchObject({ minDistance: 0, maxDistance: 120 });
    }
    expect(saplings[0]).toMatchObject({ minDistance: 0, maxDistance: 120 });
    expect(rocks[0]).toMatchObject({ minDistance: 0, maxDistance: 180 });
    expect(flowers[0]).toMatchObject({ minDistance: 0, maxDistance: 70 });
    expect(forestHlod).toHaveLength(2);
    for (const entry of forestHlod) {
      expect(entry).toMatchObject({ minDistance: 120, maxDistance: 180 });
      expect(entry.object.userData.sourceInstances).toBe(16);
    }
    // Echte Batchradien + kleinere Übergangschunks halten Vollwald/Proxy nur
    // wenige statt mehr als hundert Kacheln gleichzeitig aktiv.
    const transitionOverlap = Math.max(...pine.map((entry) => entry.paddingRadius ?? 0)) +
      Math.max(...forestHlod.map((entry) => entry.paddingRadius ?? 0));
    expect(transitionOverlap).toBeLessThan(12);

    const proxyCount = forestHlod.reduce(
      (sum, entry) => sum + (entry.object as InstancedMesh).count,
      0,
    );
    expect(proxyCount).toBeLessThan(placement.pine.length / 3);
    expect(placement).toEqual(unchangedPlacement);
  });

  it('bleibt ohne aktivierte Impostors voll rueckwaertskompatibel', () => {
    const placement = emptyPlacement();
    placement.pine.push(instance(10, 10));
    const built = buildNatureMass(placement, {
      viewDistance: 160,
      smallPropDistance: 60,
      lodDistances: [50, 100, 160],
      claimShadow: () => false,
    });

    expect(built.lod).toHaveLength(1);
    expect(built.lod[0]).toMatchObject({ minDistance: 0, maxDistance: 160 });
    expect(built.lod[0]!.object.userData.natureHlod).toBe(false);
  });

  it('behält sparse Solitärbäume bis zur Fernsicht statt sie ohne Proxy auszublenden', () => {
    const placement = emptyPlacement();
    placement.pine.push(instance(10, 10), instance(28, 10));
    const built = buildNatureMass(placement, {
      viewDistance: 180,
      smallPropDistance: 70,
      lodDistances: [60, 120, 180],
      impostorsEnabled: true,
      claimShadow: () => false,
    });

    const pine = built.lod.filter((entry) => entry.object.userData.natureKind === 'pine');
    expect(pine).not.toHaveLength(0);
    expect(pine.every((entry) => entry.maxDistance === 180)).toBe(true);
    expect(built.lod.some((entry) => entry.object.userData.natureHlod === true)).toBe(false);
    expect(pine.every((entry) => (entry.paddingRadius ?? 0) < 16)).toBe(true);
  });

  it('verlängert die Sichtweite eines isolierten Kleinprops nur um dessen echte Ausdehnung', () => {
    const placement = emptyPlacement();
    placement.flower.push(instance(54, 54, 0.8, 'meadow'));
    const built = buildNatureMass(placement, {
      viewDistance: 180,
      smallPropDistance: 45,
      claimShadow: () => false,
    });

    expect(built.lod).toHaveLength(1);
    expect(built.lod[0]).toMatchObject({ maxDistance: 45 });
    expect(built.lod[0]!.paddingRadius).toBeGreaterThan(0);
    expect(built.lod[0]!.paddingRadius).toBeLessThan(2);
  });
});

describe('Nature-Renderer-Wind', () => {
  it('deformiert per Instanz-Weltposition ueber ein gemeinsam aktualisiertes Uniform', () => {
    const placement = emptyPlacement();
    placement.pine.push(instance(10, 10), instance(100, 10));
    placement.rock.push(instance(14, 14, 1, 'rocky_highland'));
    const built = buildNatureMass(placement, {
      viewDistance: 160,
      smallPropDistance: 60,
      claimShadow: () => false,
    });
    const treeMeshes = built.group.children.filter(
      (child) => child.userData.natureKind === 'pine',
    ) as InstancedMesh[];
    const rockMesh = built.group.children.find(
      (child) => child.userData.natureKind === 'rock',
    ) as InstancedMesh;

    expect(treeMeshes).toHaveLength(2);
    expect(treeMeshes[0]!.material).toBe(treeMeshes[1]!.material);
    expect(treeMeshes[0]!.material).not.toBe(rockMesh.material);

    const material = treeMeshes[0]!.material as MeshLambertMaterial;
    type Shader = Parameters<MeshLambertMaterial['onBeforeCompile']>[0];
    const shader = {
      uniforms: {},
      vertexShader: 'void main() {\n#include <begin_vertex>\n}',
      fragmentShader: '',
    } as unknown as Shader;
    material.onBeforeCompile(shader, {} as never);

    expect(shader.vertexShader).toContain('instanceMatrix');
    expect(shader.vertexShader).toContain('cmbNatureAnchor');
    const windUniform = shader.uniforms.cmbNatureWindTime as { value: number };
    expect(windUniform).toBeDefined();
    updateNatureWind(7.25);
    expect(windUniform.value).toBe(7.25);
    updateNatureWind(Number.NaN);
    expect(windUniform.value).toBe(0);
  });
});
