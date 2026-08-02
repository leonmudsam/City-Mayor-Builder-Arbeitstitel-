import { InstancedMesh, MeshStandardMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { buildingsConfig } from '../src/game/config/buildings.config.ts';
import {
  buildBuildingHlod,
  buildingHlodRole,
  type BuildingHlodInstance,
} from '../src/renderer/three/buildingHlodRenderer.ts';

const def = (id: string) => buildingsConfig.find((entry) => entry.id === id)!;

describe('Gebäude-Fernansicht', () => {
  it('ordnet Rathaus, Landbetrieb und Industrie unterscheidbaren Rollen zu', () => {
    expect(buildingHlodRole(def('town_hall'))).toBe('civic');
    expect(buildingHlodRole(def('farm'))).toBe('rural');
    expect(buildingHlodRole(def('power_plant'))).toBe('industrial');
  });

  it('bündelt nahe Gebäude in höchstens eine Instanzgruppe je Rolle', () => {
    const instances: BuildingHlodInstance[] = [
      { buildingId: 'a', role: 'residential', x: 1, y: 2, z: 3, width: 2, height: 3, depth: 2, rotationY: 0, colorVariant: 1 },
      { buildingId: 'b', role: 'residential', x: 5, y: 2, z: 3, width: 2, height: 3, depth: 2, rotationY: 0, colorVariant: 2 },
      { buildingId: 'c', role: 'industrial', x: 9, y: 1, z: 7, width: 4, height: 5, depth: 3, rotationY: 0, colorVariant: 0 },
    ];
    const group = buildBuildingHlod(instances);
    expect(group.children).toHaveLength(2);
    expect(group.children.every((child) => child instanceof InstancedMesh)).toBe(true);
    expect(group.userData.buildingHlodInstances).toBe(3);
    expect(group.userData.buildingHlodDrawCalls).toBe(2);
    for (const child of group.children as InstancedMesh[]) {
      expect((child.material as MeshStandardMaterial).color.getHex()).toBe(0xffffff);
      expect(child.instanceColor).not.toBeNull();
      expect(child.userData.buildingIds).toHaveLength(child.count);
    }
  });
});
