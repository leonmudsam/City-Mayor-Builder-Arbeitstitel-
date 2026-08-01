import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const AMBIENT_PALETTE = [0xc95343, 0x3f78a8, 0xd4a33b, 0xe8e1d3, 0x4f8b69, 0x48515e] as const;

type Part = {
  geometry: BufferGeometry;
  color: number;
};

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function ambientVehicleColor(seed: string): number {
  return AMBIENT_PALETTE[stableHash(seed) % AMBIENT_PALETTE.length]!;
}

function box(parts: Part[], size: [number, number, number], at: [number, number, number], color: number): void {
  const geometry = new BoxGeometry(...size);
  geometry.translate(...at);
  parts.push({ geometry, color });
}

function cylinder(
  parts: Part[],
  radius: number,
  length: number,
  at: [number, number, number],
  color: number,
  axis: 'x' | 'z' = 'x',
): void {
  const geometry = new CylinderGeometry(radius, radius, length, 8);
  if (axis === 'x') geometry.rotateZ(Math.PI / 2);
  else geometry.rotateX(Math.PI / 2);
  geometry.translate(...at);
  parts.push({ geometry, color });
}

function addWheels(parts: Part[], width: number, length: number, axles: 2 | 3): void {
  const wheelZ = axles === 3 ? [-length * 0.3, 0, length * 0.3] : [-length * 0.29, length * 0.29];
  for (const z of wheelZ) {
    cylinder(parts, 0.075, 0.055, [-width / 2 - 0.015, 0.085, z], 0x24282b);
    cylinder(parts, 0.075, 0.055, [width / 2 + 0.015, 0.085, z], 0x24282b);
  }
}

function addUndercarriage(parts: Part[], width: number, length: number): void {
  box(parts, [width * 0.78, 0.035, length * 0.72], [0, 0.055, 0], 0x34383a);
}

function tintVertices(part: Part): BufferGeometry {
  const count = part.geometry.getAttribute('position').count;
  const color = new Color(part.color);
  const values = new Float32Array(count * 3);
  for (let index = 0; index < count; index++) color.toArray(values, index * 3);
  part.geometry.setAttribute('color', new Float32BufferAttribute(values, 3));
  return part.geometry;
}

/**
 * Charmanter Low-poly-Fallback mit einer einzigen, vertexgefärbten Geometrie.
 * Front ist +Z. Räder und ein flaches Fahrgestell geben echten Bodenkontakt;
 * es gibt bewusst keine dunkle Kreisscheibe unter dem Fahrzeug.
 */
export function createStylizedVehicleGeometry(vehicle: string | undefined, seed = vehicle ?? 'van'): BufferGeometry {
  const parts: Part[] = [];
  const kind = vehicle ?? 'van';
  const glass = 0x29475a;
  const trim = 0xf3d28a;
  let width = 0.44;
  let length = 0.74;
  let axles: 2 | 3 = 2;
  let paint = 0xe8e1d3;

  if (kind === 'car') {
    width = 0.38;
    length = 0.58;
    paint = ambientVehicleColor(seed);
    box(parts, [0.38, 0.15, 0.58], [0, 0.15, 0], paint);
    box(parts, [0.3, 0.14, 0.3], [0, 0.265, -0.015], glass);
    box(parts, [0.31, 0.035, 0.24], [0, 0.345, -0.025], paint);
    box(parts, [0.25, 0.035, 0.025], [0, 0.17, 0.3], trim);
  } else if (kind === 'handcart') {
    width = 0.4;
    length = 0.64;
    paint = 0x9a6436;
    box(parts, [0.4, 0.09, 0.5], [0, 0.17, -0.03], paint);
    box(parts, [0.32, 0.22, 0.3], [0, 0.31, -0.05], 0xc18b4a);
    cylinder(parts, 0.11, 0.045, [-0.225, 0.12, -0.02], 0x34302b);
    cylinder(parts, 0.11, 0.045, [0.225, 0.12, -0.02], 0x34302b);
    box(parts, [0.035, 0.035, 0.34], [-0.13, 0.19, 0.37], 0x6f482b);
    box(parts, [0.035, 0.035, 0.34], [0.13, 0.19, 0.37], 0x6f482b);
    addUndercarriage(parts, width, length);
    const merged = mergeGeometries(parts.map(tintVertices), false);
    if (!merged) throw new Error('Fahrzeug-Fallback konnte nicht gebündelt werden.');
    merged.computeBoundingSphere();
    return merged;
  } else if (kind === 'police_car') {
    width = 0.42;
    length = 0.72;
    paint = 0xe9ece8;
    box(parts, [0.42, 0.17, 0.72], [0, 0.16, 0], paint);
    box(parts, [0.34, 0.15, 0.34], [0, 0.28, -0.02], glass);
    box(parts, [0.43, 0.055, 0.4], [0, 0.17, 0], 0x2c5d91);
    box(parts, [0.28, 0.055, 0.1], [0, 0.39, -0.02], 0x4b8dcc);
  } else {
    const large = kind === 'large_truck' || kind === 'heavy_transporter' || kind === 'logging_truck';
    const fire = kind === 'fire_truck';
    const logging = kind === 'logging_truck';
    const flatbed = kind === 'flatbed' || kind === 'heavy_transporter';
    width = large ? 0.56 : 0.48;
    length = large ? 1.02 : 0.82;
    axles = large ? 3 : 2;
    paint = fire ? 0xc84435 : logging ? 0x47734b : flatbed ? 0xd0832f : kind === 'medium_truck' ? 0x3d78aa : 0xe7e4da;
    box(parts, [width, 0.3, 0.34], [0, 0.23, length / 2 - 0.19], paint);
    box(parts, [width * 0.82, 0.14, 0.025], [0, 0.3, length / 2 - 0.005], glass);
    if (logging) {
      box(parts, [width * 0.9, 0.08, length * 0.62], [0, 0.15, -length * 0.17], 0x574431);
      for (const x of [-0.15, 0, 0.15]) cylinder(parts, 0.075, length * 0.58, [x, 0.28, -length * 0.17], 0x966139, 'z');
    } else if (flatbed) {
      box(parts, [width, 0.09, length * 0.64], [0, 0.15, -length * 0.16], 0x4e5558);
      box(parts, [width * 0.72, 0.25, length * 0.34], [0, 0.3, -length * 0.17], 0xb8874f);
    } else {
      const cargoColor = kind === 'refrigerated_truck' ? 0xf1f2ec : fire ? 0xb9362c : kind === 'medium_truck' ? 0x315f88 : 0xddd4bf;
      box(parts, [width, large ? 0.42 : 0.36, length * 0.62], [0, large ? 0.29 : 0.26, -length * 0.17], cargoColor);
      if (kind === 'refrigerated_truck') box(parts, [0.28, 0.1, 0.14], [0, 0.51, 0.02], 0x79bdc7);
      if (fire) box(parts, [0.1, 0.07, length * 0.58], [0, 0.5, -0.12], 0xf0d9ad);
    }
  }

  addWheels(parts, width, length, axles);
  addUndercarriage(parts, width, length);
  const merged = mergeGeometries(parts.map(tintVertices), false);
  if (!merged) throw new Error('Fahrzeug-Fallback konnte nicht gebündelt werden.');
  merged.computeBoundingSphere();
  return merged;
}

export function createStylizedVehicleMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.82,
    metalness: 0.04,
    flatShading: true,
  });
}

export function createStylizedVehicleFallback(vehicle: string | undefined, seed?: string): Group {
  const group = new Group();
  const mesh = new Mesh(createStylizedVehicleGeometry(vehicle, seed), createStylizedVehicleMaterial());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return group;
}
