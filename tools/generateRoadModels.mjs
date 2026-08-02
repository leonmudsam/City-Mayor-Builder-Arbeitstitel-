// Erzeugt kleine, echte GLB-Near-LOD-Kits für das automatische Straßensystem.
// Die laufende Fahrbahn bleibt prozedural; diese Single-Mesh-Dateien werden je
// Variante instanziert und können später ohne Codeänderung ersetzt werden.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  BoxGeometry,
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  Scene,
  TorusGeometry,
} from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// GLTFExporter nutzt im Browser FileReader; diese kleine Node-Entsprechung
// deckt die beiden vom binären Export verwendeten Methoden ab.
globalThis.FileReader ??= class FileReader {
  result = null;
  onloadend = null;
  onerror = null;
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.({ target: this });
    }).catch((error) => this.onerror?.(error));
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;
      this.onloadend?.({ target: this });
    }).catch((error) => this.onerror?.(error));
  }
};

const root = resolve(import.meta.dirname, '..');
const roadsDir = resolve(root, 'src/assets/models/roads');
const bridgesDir = resolve(root, 'src/assets/models/bridges');
const material = new MeshStandardMaterial({ color: 0xb59a71, roughness: 0.9, metalness: 0.02 });

const box = (size, position, rotation = [0, 0, 0]) => {
  const geometry = new BoxGeometry(...size);
  geometry.rotateX(rotation[0]);
  geometry.rotateY(rotation[1]);
  geometry.rotateZ(rotation[2]);
  geometry.translate(...position);
  return geometry;
};
const cylinder = (radius, height, position) => {
  const geometry = new CylinderGeometry(radius * 0.82, radius, height, 10);
  geometry.translate(...position);
  return geometry;
};

const models = {
  road_flat: [box([0.76, 0.045, 0.98], [0, 0.023, 0])],
  road_slope: [
    box([0.76, 0.045, 1.02], [0, 0.075, 0], [-0.09, 0, 0]),
    box([0.09, 0.12, 1], [-0.4, 0.06, 0]),
  ],
  road_support: [
    box([0.74, 0.055, 1], [0, 0.2, 0]),
    box([0.12, 0.38, 1], [-0.4, 0.19, 0]),
    box([0.18, 0.08, 1.03], [-0.4, 0.4, 0]),
  ],
  road_viaduct: [
    box([0.76, 0.07, 1], [0, 0.5, 0]),
    box([0.12, 0.2, 0.12], [-0.28, 0.37, -0.3]),
    box([0.12, 0.2, 0.12], [0.28, 0.37, -0.3]),
    box([0.12, 0.2, 0.12], [-0.28, 0.37, 0.3]),
    box([0.12, 0.2, 0.12], [0.28, 0.37, 0.3]),
  ],
  road_bridge: [
    box([0.76, 0.075, 1.02], [0, 0.08, 0]),
    box([0.08, 0.17, 1.04], [-0.41, 0.16, 0]),
    box([0.08, 0.17, 1.04], [0.41, 0.16, 0]),
  ],
  road_hairpin_curve: (() => {
    const outer = new TorusGeometry(0.33, 0.12, 5, 28, Math.PI);
    outer.rotateX(Math.PI / 2);
    outer.translate(0, 0.08, 0.15);
    return [outer, box([0.12, 0.18, 0.72], [-0.36, 0.09, 0.14])];
  })(),
  road_coast: [
    box([0.74, 0.05, 1], [0, 0.08, 0]),
    box([0.12, 0.26, 1.02], [0.4, 0.13, 0]),
    ...[-0.34, 0, 0.34].map((z) => cylinder(0.055, 0.22, [0.4, 0.11, z])),
  ],
};

const exporter = new GLTFExporter();
for (const [name, geometries] of Object.entries(models)) {
  const geometry = mergeGeometries(geometries.map((entry) => entry.toNonIndexed()), false);
  geometry.computeVertexNormals();
  geometry.name = `${name}_geometry`;
  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  const scene = new Scene();
  scene.name = `${name}_scene`;
  scene.add(mesh);
  const binary = await exporter.parseAsync(scene, { binary: true, onlyVisible: true });
  const target = resolve(name === 'road_bridge' ? bridgesDir : roadsDir, `${name}.glb`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(binary));
  geometry.dispose();
}
