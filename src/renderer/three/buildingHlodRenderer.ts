// Günstige Stadt-Silhouette für die Inselübersicht.
//
// Die teuren monolithischen Gebäude-GLBs bleiben im Nahbereich unverändert.
// Hinter der mittleren Grafik-LOD ersetzen räumliche Instanzgruppen pro
// Stilrolle ihre Silhouette. Das reduziert Dreiecke und Schatten, ohne ein
// Gameplay- oder Save-System einzuführen.

import {
  BoxGeometry,
  Color,
  ConeGeometry,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  type BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { BuildingDef } from '../../game/config/types.ts';

export type BuildingHlodRole = 'civic' | 'rural' | 'industrial' | 'residential' | 'neutral';

export interface BuildingHlodInstance {
  buildingId: string;
  role: BuildingHlodRole;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  rotationY: number;
  colorVariant: number;
}

/** Fernsilhouetten bleiben je Stadtsektor cullbar statt eine weltweite
 * Rollen-Bounding-Sphere zu bilden. */
export const BUILDING_HLOD_CHUNK_TILES = 96;

const COLORS: Record<BuildingHlodRole, number> = {
  civic: 0xd8c8a7,
  rural: 0xb98b5f,
  industrial: 0x858a84,
  residential: 0xc58b6d,
  neutral: 0xb7a78e,
};

export function buildingHlodRole(def: Pick<BuildingDef, 'id' | 'category'>): BuildingHlodRole {
  if (def.id === 'town_hall' || def.category === 'government') return 'civic';
  if (def.id === 'farm' || def.id === 'sawmill') return 'rural';
  if (def.category === 'production' || def.category === 'energy') return 'industrial';
  if (def.category === 'residential') return 'residential';
  return 'neutral';
}

function pitchedGeometry(): BufferGeometry {
  const body = new BoxGeometry(1, 0.7, 1);
  body.translate(0, 0.35, 0);
  const roof = new ConeGeometry(0.72, 0.3, 4);
  roof.rotateY(Math.PI / 4);
  roof.translate(0, 0.85, 0);
  const merged = mergeGeometries([body, roof], false);
  body.dispose();
  roof.dispose();
  if (!merged) throw new Error('Gebäude-HLOD konnte nicht gebündelt werden.');
  merged.computeBoundingSphere();
  return merged;
}

function flatGeometry(): BufferGeometry {
  const geometry = new BoxGeometry(1, 1, 1);
  geometry.translate(0, 0.5, 0);
  geometry.computeBoundingSphere();
  return geometry;
}

export function buildBuildingHlod(instances: readonly BuildingHlodInstance[]): Group {
  const group = new Group();
  const buckets = new Map<string, {
    role: BuildingHlodRole;
    list: BuildingHlodInstance[];
  }>();
  for (const instance of instances) {
    const chunkX = Math.floor(instance.x / BUILDING_HLOD_CHUNK_TILES);
    const chunkZ = Math.floor(instance.z / BUILDING_HLOD_CHUNK_TILES);
    const key = `${instance.role}:${chunkX},${chunkZ}`;
    const bucket = buckets.get(key) ?? { role: instance.role, list: [] };
    bucket.list.push(instance);
    buckets.set(key, bucket);
  }

  const dummy = new Object3D();
  const color = new Color();
  for (const { role, list: bucket } of buckets.values()) {
    const geometry = role === 'industrial' ? flatGeometry() : pitchedGeometry();
    const material = new MeshStandardMaterial({
      // Instanzfarbe wird vom Standardshader multipliziert, daher neutrale Basis.
      color: 0xffffff,
      roughness: 0.9,
      metalness: role === 'industrial' ? 0.08 : 0,
    });
    const mesh = new InstancedMesh(geometry, material, bucket.length);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = true;
    mesh.userData.buildingHlodRole = role;
    mesh.userData.buildingIds = bucket.map((instance) => instance.buildingId);
    bucket.forEach((instance, index) => {
      dummy.position.set(instance.x, instance.y, instance.z);
      dummy.rotation.set(0, instance.rotationY, 0);
      dummy.scale.set(instance.width, instance.height, instance.depth);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      const shift = (instance.colorVariant % 7 - 3) * 0.018;
      color.set(COLORS[role]).offsetHSL(shift * 0.2, shift * 0.18, shift);
      mesh.setColorAt(index, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
  }
  group.userData.buildingHlodInstances = instances.length;
  group.userData.buildingHlodDrawCalls = buckets.size;
  return group;
}
