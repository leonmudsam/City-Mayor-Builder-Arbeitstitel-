import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  MathUtils,
  MeshStandardMaterial,
  Object3D,
  type BufferGeometry,
} from 'three';
import type { BuildingEnvironmentKind } from './buildingEnvironment.ts';

export interface WorldBuildingEnvironmentInstance {
  kind: BuildingEnvironmentKind;
  x: number;
  y: number;
  z: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotationY: number;
  colorVariant: number;
}

interface RenderSpec {
  geometry: () => BufferGeometry;
  color: number;
  roughness: number;
  metalness?: number;
  yOffset: number;
  castShadow?: boolean;
}

/** Räumliche Bündelung hält die Draw-Calls niedrig, ohne eine inselweite
 * Bounding-Sphere zu erzeugen, die praktisch nie aus dem Frustum fällt. */
export const BUILDING_ENVIRONMENT_CHUNK_TILES = 96;

const rotateLogGeometry = (): BufferGeometry => {
  const geometry = new CylinderGeometry(0.095, 0.11, 0.72, 7);
  geometry.rotateZ(Math.PI / 2);
  return geometry;
};

const rotateHayGeometry = (): BufferGeometry => {
  const geometry = new CylinderGeometry(0.18, 0.18, 0.42, 10);
  geometry.rotateZ(Math.PI / 2);
  return geometry;
};

const SPECS: Record<BuildingEnvironmentKind, RenderSpec> = {
  plaza: { geometry: () => new BoxGeometry(1, 0.035, 1), color: 0xc9b890, roughness: 0.94, yOffset: 0.015 },
  yard: { geometry: () => new BoxGeometry(1, 0.028, 1), color: 0x716d61, roughness: 0.98, yOffset: 0.012 },
  sawdust: { geometry: () => new CylinderGeometry(0.5, 0.58, 0.055, 14), color: 0xc58d46, roughness: 1, yOffset: 0.025 },
  path: { geometry: () => new BoxGeometry(1, 0.04, 1), color: 0xb98e58, roughness: 1, yOffset: 0.02 },
  log: { geometry: rotateLogGeometry, color: 0x84512d, roughness: 0.96, yOffset: 0.13, castShadow: true },
  stump: { geometry: () => new CylinderGeometry(0.18, 0.23, 0.22, 8), color: 0x79502f, roughness: 1, yOffset: 0.11, castShadow: true },
  field: { geometry: () => new BoxGeometry(1, 0.055, 1), color: 0x7a9a3d, roughness: 1, yOffset: 0.028 },
  fence: { geometry: () => new BoxGeometry(1, 0.22, 0.045), color: 0x87623a, roughness: 0.96, yOffset: 0.11, castShadow: true },
  hay: { geometry: rotateHayGeometry, color: 0xc4a342, roughness: 1, yOffset: 0.19, castShadow: true },
  flower: { geometry: () => new ConeGeometry(0.16, 0.24, 7), color: 0xdb7f55, roughness: 0.92, yOffset: 0.12 },
  bench: { geometry: () => new BoxGeometry(0.65, 0.14, 0.22), color: 0x855b35, roughness: 0.9, yOffset: 0.2, castShadow: true },
  crate: { geometry: () => new BoxGeometry(0.32, 0.3, 0.32), color: 0x8b5b32, roughness: 0.92, yOffset: 0.15, castShadow: true },
  pallet: { geometry: () => new BoxGeometry(0.58, 0.1, 0.42), color: 0x9a7043, roughness: 0.95, yOffset: 0.05 },
  ore: { geometry: () => new ConeGeometry(0.35, 0.34, 7), color: 0x85847d, roughness: 1, yOffset: 0.17, castShadow: true },
  coal: { geometry: () => new ConeGeometry(0.38, 0.31, 7), color: 0x343a3c, roughness: 0.98, yOffset: 0.15, castShadow: true },
  barrel: { geometry: () => new CylinderGeometry(0.13, 0.13, 0.34, 10), color: 0x58626a, roughness: 0.72, metalness: 0.18, yOffset: 0.17, castShadow: true },
  basin: { geometry: () => new CylinderGeometry(0.42, 0.46, 0.12, 16), color: 0x5b9aa6, roughness: 0.36, metalness: 0.08, yOffset: 0.06 },
};

export interface BuildingEnvironmentRenderResult {
  group: Group;
  instances: number;
  drawCalls: number;
}

/** Eine Instanzgruppe je Prop-Art und räumlichem Stadtsektor. */
export function buildBuildingEnvironment(
  instances: readonly WorldBuildingEnvironmentInstance[],
): BuildingEnvironmentRenderResult {
  const group = new Group();
  const buckets = new Map<string, {
    kind: BuildingEnvironmentKind;
    list: WorldBuildingEnvironmentInstance[];
  }>();
  for (const instance of instances) {
    const chunkX = Math.floor(instance.x / BUILDING_ENVIRONMENT_CHUNK_TILES);
    const chunkZ = Math.floor(instance.z / BUILDING_ENVIRONMENT_CHUNK_TILES);
    const key = `${instance.kind}:${chunkX},${chunkZ}`;
    const bucket = buckets.get(key) ?? { kind: instance.kind, list: [] };
    bucket.list.push(instance);
    buckets.set(key, bucket);
  }

  const dummy = new Object3D();
  const color = new Color();
  let drawCalls = 0;
  for (const { kind, list } of buckets.values()) {
    const spec = SPECS[kind];
    const geometry = spec.geometry();
    const material = new MeshStandardMaterial({
      // Three multipliziert Material- und Instanzfarbe. Weiß hält die unten
      // gesetzte Propfarbe unverändert, statt sie ein zweites Mal abzudunkeln.
      color: 0xffffff,
      roughness: spec.roughness,
      metalness: spec.metalness ?? 0,
      vertexColors: false,
    });
    const mesh = new InstancedMesh(geometry, material, list.length);
    mesh.castShadow = Boolean(spec.castShadow);
    mesh.receiveShadow = true;
    for (let index = 0; index < list.length; index++) {
      const instance = list[index]!;
      dummy.position.set(instance.x, instance.y + spec.yOffset * instance.scaleY, instance.z);
      dummy.rotation.set(0, instance.rotationY, 0);
      dummy.scale.set(instance.scaleX, instance.scaleY, instance.scaleZ);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      const shift = (instance.colorVariant % 5 - 2) * 0.035;
      color.set(spec.color).offsetHSL(shift * 0.15, shift * 0.35, shift);
      mesh.setColorAt(index, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
    drawCalls++;
  }
  group.userData['environmentInstances'] = instances.length;
  group.userData['environmentDrawCalls'] = drawCalls;
  group.userData['environmentChunks'] = new Set(
    instances.map((instance) =>
      `${Math.floor(instance.x / BUILDING_ENVIRONMENT_CHUNK_TILES)},${Math.floor(instance.z / BUILDING_ENVIRONMENT_CHUNK_TILES)}`,
    ),
  ).size;
  return { group, instances: instances.length, drawCalls };
}

export function rotatedLocalPosition(
  centerX: number,
  centerZ: number,
  localX: number,
  localZ: number,
  degrees: 0 | 90 | 180 | 270,
): { x: number; z: number; rotationY: number } {
  const rotationY = MathUtils.degToRad(degrees);
  const c = Math.cos(rotationY);
  const s = Math.sin(rotationY);
  return {
    // Gleiche rechtshändige Y-Rotation wie Object3D/Matrix4 in Three:
    // x' = c*x + s*z, z' = -s*x + c*z.
    x: centerX + localX * c + localZ * s,
    z: centerZ - localX * s + localZ * c,
    rotationY,
  };
}
