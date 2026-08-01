#!/usr/bin/env node
/**
 * Vollständiger, dependency-freier Audit der Authoring-Quelle der Insel.
 *
 * Die Ausgabe ist Diagnose-/Bake-Metadaten, keine Runtime-Datenquelle. Die
 * stabilen IDs werden ausschließlich aus Geografie und einer stabilen
 * Sortierung abgeleitet; Tripo-Namen bleiben reine Debug-Metadaten.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'reference', 'world', 'new island 3d model.glb');
const JSON_OUT = join(ROOT, 'tools', 'new-island-report.json');
const MD_OUT = join(ROOT, 'tools', 'new-island-report.md');

const round = (value, digits = 4) => Number(value.toFixed(digits));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function parseGlb(buffer) {
  if (buffer.length < 20 || buffer.readUInt32LE(0) !== 0x46546c67) throw new Error('Quelle ist keine GLB-Datei.');
  if (buffer.readUInt32LE(4) !== 2) throw new Error('Nur GLB 2.0 wird unterstützt.');
  const declaredLength = buffer.readUInt32LE(8);
  if (declaredLength !== buffer.length) throw new Error(`GLB-Länge ${declaredLength} stimmt nicht mit ${buffer.length} Bytes überein.`);
  let offset = 12;
  let json;
  let binary;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) json = JSON.parse(data.toString('utf8').replace(/\0+$/u, '').trimEnd());
    if (type === 0x004e4942) binary = data;
    offset += 8 + length;
  }
  if (!json || !binary) throw new Error('GLB benötigt genau einen JSON- und einen BIN-Chunk.');
  return { gltf: json, binary };
}

const COMPONENT = {
  5120: { bytes: 1, read: (b, o) => b.readInt8(o) },
  5121: { bytes: 1, read: (b, o) => b.readUInt8(o) },
  5122: { bytes: 2, read: (b, o) => b.readInt16LE(o) },
  5123: { bytes: 2, read: (b, o) => b.readUInt16LE(o) },
  5125: { bytes: 4, read: (b, o) => b.readUInt32LE(o) },
  5126: { bytes: 4, read: (b, o) => b.readFloatLE(o) },
};
const ARITY = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

function accessorReader(gltf, binary, accessorIndex) {
  const accessor = gltf.accessors?.[accessorIndex];
  if (!accessor) throw new Error(`Accessor ${accessorIndex} fehlt.`);
  if (accessor.sparse) throw new Error(`Sparse Accessor ${accessorIndex} wird für den Insel-Bake nicht unterstützt.`);
  const view = gltf.bufferViews?.[accessor.bufferView];
  if (!view) throw new Error(`BufferView für Accessor ${accessorIndex} fehlt.`);
  const component = COMPONENT[accessor.componentType];
  const arity = ARITY[accessor.type];
  if (!component || !arity) throw new Error(`Accessor ${accessorIndex} besitzt ein unbekanntes Format.`);
  const stride = view.byteStride ?? component.bytes * arity;
  const base = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return {
    accessor,
    value(index, componentIndex = 0) {
      return component.read(binary, base + index * stride + componentIndex * component.bytes);
    },
    vector(index) {
      return Array.from({ length: arity }, (_, componentIndex) => component.read(binary, base + index * stride + componentIndex * component.bytes));
    },
  };
}

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function multiplyMatrix(a, b) {
  const out = Array(16).fill(0);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 4; k++) out[column * 4 + row] += a[k * 4 + row] * b[column * 4 + k];
    }
  }
  return out;
}

function matrixFromNode(node) {
  if (node.matrix) return [...node.matrix];
  const [x, y, z, w] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}

function transformPoint(matrix, point) {
  const [x, y, z] = point;
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
  ];
}

function emptyBounds() {
  return { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
}

function expandBounds(bounds, point) {
  for (let axis = 0; axis < 3; axis++) {
    bounds.min[axis] = Math.min(bounds.min[axis], point[axis]);
    bounds.max[axis] = Math.max(bounds.max[axis], point[axis]);
  }
}

function mergeBounds(target, source) {
  expandBounds(target, source.min);
  expandBounds(target, source.max);
}

function finiteBounds(bounds) {
  return bounds.min.every(Number.isFinite) && bounds.max.every(Number.isFinite);
}

function boundsDto(bounds) {
  return {
    min: bounds.min.map((value) => round(value, 6)),
    max: bounds.max.map((value) => round(value, 6)),
    size: bounds.max.map((value, axis) => round(value - bounds.min[axis], 6)),
    center: bounds.max.map((value, axis) => round((value + bounds.min[axis]) / 2, 6)),
  };
}

class DisjointSet {
  constructor(size) {
    this.parent = new Int32Array(size);
    this.rank = new Uint8Array(size);
    this.used = new Uint8Array(size);
    for (let i = 0; i < size; i++) this.parent[i] = i;
  }
  find(value) {
    let root = value;
    while (this.parent[root] !== root) root = this.parent[root];
    while (this.parent[value] !== value) {
      const next = this.parent[value];
      this.parent[value] = root;
      value = next;
    }
    return root;
  }
  union(a, b) {
    this.used[a] = 1;
    this.used[b] = 1;
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return;
    if (this.rank[ra] < this.rank[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    if (this.rank[ra] === this.rank[rb]) this.rank[ra] += 1;
  }
  count() {
    const roots = new Set();
    for (let i = 0; i < this.used.length; i++) if (this.used[i]) roots.add(this.find(i));
    return roots.size;
  }
}

function sceneInstances(gltf) {
  const parent = new Int32Array(gltf.nodes?.length ?? 0).fill(-1);
  for (let i = 0; i < parent.length; i++) for (const child of gltf.nodes[i]?.children ?? []) parent[child] = i;
  const localMatrices = (gltf.nodes ?? []).map(matrixFromNode);
  const worldMatrices = Array.from({ length: parent.length });
  const worldMatrix = (index) => {
    if (worldMatrices[index]) return worldMatrices[index];
    worldMatrices[index] = parent[index] < 0 ? localMatrices[index] : multiplyMatrix(worldMatrix(parent[index]), localMatrices[index]);
    return worldMatrices[index];
  };
  const pathFor = (index) => {
    const path = [];
    for (let current = index; current >= 0; current = parent[current]) path.unshift(gltf.nodes[current]?.name ?? `node_${current}`);
    return path.join('/');
  };
  const instances = [];
  for (let nodeIndex = 0; nodeIndex < parent.length; nodeIndex++) {
    const meshIndex = gltf.nodes[nodeIndex]?.mesh;
    if (meshIndex === undefined) continue;
    instances.push({ nodeIndex, meshIndex, path: pathFor(nodeIndex), localMatrix: localMatrices[nodeIndex], worldMatrix: worldMatrix(nodeIndex) });
  }
  const usedMeshes = new Set(instances.map((instance) => instance.meshIndex));
  for (let meshIndex = 0; meshIndex < (gltf.meshes?.length ?? 0); meshIndex++) {
    if (!usedMeshes.has(meshIndex)) instances.push({ nodeIndex: null, meshIndex, path: `(nicht instanziert)/mesh_${meshIndex}`, localMatrix: IDENTITY, worldMatrix: IDENTITY });
  }
  return { instances, parent, localMatrices, worldMatrices };
}

function primitiveIndices(gltf, binary, primitive, vertexCount) {
  if (primitive.indices === undefined) return { count: vertexCount, value: (index) => index };
  const reader = accessorReader(gltf, binary, primitive.indices);
  return { count: reader.accessor.count, value: (index) => reader.value(index) };
}

function analyzePart(gltf, binary, instance) {
  const mesh = gltf.meshes[instance.meshIndex];
  const localBounds = emptyBounds();
  const worldBounds = emptyBounds();
  const materialIds = new Set();
  let vertices = 0, triangles = 0, surfaceArea = 0, projectedAreaXZ = 0, signedVolume = 0;
  let weightedSlope = 0, openEdges = 0, nonManifoldEdges = 0, components = 0;
  let hasNormals = true, hasUvs = true;
  const primitiveReports = [];

  for (let primitiveIndex = 0; primitiveIndex < mesh.primitives.length; primitiveIndex++) {
    const primitive = mesh.primitives[primitiveIndex];
    if ((primitive.mode ?? 4) !== 4) throw new Error(`Mesh ${instance.meshIndex}, Primitive ${primitiveIndex}: Nur TRIANGLES werden unterstützt.`);
    const positions = accessorReader(gltf, binary, primitive.attributes.POSITION);
    const index = primitiveIndices(gltf, binary, primitive, positions.accessor.count);
    const transformed = Array.from({ length: positions.accessor.count }, (_, vertex) => {
      const local = positions.vector(vertex);
      const world = transformPoint(instance.worldMatrix, local);
      expandBounds(localBounds, local);
      expandBounds(worldBounds, world);
      return world;
    });
    const dsu = new DisjointSet(positions.accessor.count);
    const edges = new Map();
    const edge = (a, b) => {
      if (a > b) [a, b] = [b, a];
      const key = a * positions.accessor.count + b;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    };
    let primitiveArea = 0, primitiveProjected = 0, primitiveSlope = 0, primitiveVolume = 0;
    for (let cursor = 0; cursor + 2 < index.count; cursor += 3) {
      const ia = index.value(cursor), ib = index.value(cursor + 1), ic = index.value(cursor + 2);
      const a = transformed[ia], b = transformed[ib], c = transformed[ic];
      if (!a || !b || !c) throw new Error(`Mesh ${instance.meshIndex}: Index außerhalb des POSITION-Accessors.`);
      const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2];
      const acx = c[0] - a[0], acy = c[1] - a[1], acz = c[2] - a[2];
      const nx = aby * acz - abz * acy;
      const ny = abz * acx - abx * acz;
      const nz = abx * acy - aby * acx;
      const doubleArea = Math.hypot(nx, ny, nz);
      const area = doubleArea * 0.5;
      if (area > 1e-14) {
        primitiveArea += area;
        primitiveProjected += Math.abs(ny) * 0.5;
        primitiveSlope += Math.acos(clamp(Math.abs(ny) / doubleArea, 0, 1)) * (180 / Math.PI) * area;
        primitiveVolume += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
      }
      dsu.union(ia, ib); dsu.union(ib, ic); dsu.union(ic, ia);
      edge(ia, ib); edge(ib, ic); edge(ic, ia);
    }
    let primitiveOpenEdges = 0, primitiveNonManifold = 0;
    for (const count of edges.values()) {
      if (count === 1) primitiveOpenEdges += 1;
      else if (count > 2) primitiveNonManifold += 1;
    }
    vertices += positions.accessor.count;
    triangles += Math.floor(index.count / 3);
    surfaceArea += primitiveArea;
    projectedAreaXZ += primitiveProjected;
    weightedSlope += primitiveSlope;
    signedVolume += primitiveVolume;
    openEdges += primitiveOpenEdges;
    nonManifoldEdges += primitiveNonManifold;
    components += dsu.count();
    hasNormals &&= primitive.attributes.NORMAL !== undefined;
    hasUvs &&= primitive.attributes.TEXCOORD_0 !== undefined;
    if (primitive.material !== undefined) materialIds.add(primitive.material);
    primitiveReports.push({
      primitiveIndex,
      vertices: positions.accessor.count,
      triangles: Math.floor(index.count / 3),
      indexed: primitive.indices !== undefined,
      material: primitive.material ?? null,
      hasNormals: primitive.attributes.NORMAL !== undefined,
      hasUvs: primitive.attributes.TEXCOORD_0 !== undefined,
      connectedComponents: dsu.count(),
      openEdges: primitiveOpenEdges,
      nonManifoldEdges: primitiveNonManifold,
    });
  }

  return {
    sourceName: mesh.name ?? `mesh_${instance.meshIndex}`,
    meshIndex: instance.meshIndex,
    nodeIndex: instance.nodeIndex,
    nodePath: instance.path,
    localMatrix: instance.localMatrix.map((value) => round(value, 8)),
    worldMatrix: instance.worldMatrix.map((value) => round(value, 8)),
    localBounds: boundsDto(localBounds),
    bounds: boundsDto(worldBounds),
    vertices,
    triangles,
    surfaceArea: round(surfaceArea, 8),
    projectedAreaXZ: round(projectedAreaXZ, 8),
    approximateSignedVolume: round(signedVolume, 8),
    meanSlopeDeg: round(surfaceArea > 0 ? weightedSlope / surfaceArea : 0, 3),
    heightRange: round(worldBounds.max[1] - worldBounds.min[1], 6),
    connectedComponents: components,
    openEdges,
    nonManifoldEdges,
    hasNormals,
    hasUvs,
    materialIds: [...materialIds].sort((a, b) => a - b),
    primitives: primitiveReports,
  };
}

function classifyParts(parts, globalBounds) {
  const width = globalBounds.max[0] - globalBounds.min[0];
  const depth = globalBounds.max[2] - globalBounds.min[2];
  const height = globalBounds.max[1] - globalBounds.min[1];
  const globalMinY = globalBounds.min[1];
  const byClass = new Map();
  const ordered = [...parts].sort((a, b) => a.bounds.center[2] - b.bounds.center[2] || a.bounds.center[0] - b.bounds.center[0] || a.meshIndex - b.meshIndex);
  for (const part of ordered) {
    const nx = (part.bounds.center[0] - globalBounds.min[0]) / width;
    const nz = (part.bounds.center[2] - globalBounds.min[2]) / depth;
    const minH = (part.bounds.min[1] - globalMinY) / height;
    const maxH = (part.bounds.max[1] - globalMinY) / height;
    const avgH = (minH + maxH) / 2;
    const edgeDistance = Math.min(nx, 1 - nx, nz, 1 - nz);
    let terrain = 'grass';
    let possibleType = 'Ebene/Hügelland';
    if (maxH > 0.62 || (avgH > 0.36 && part.meanSlopeDeg > 42)) { terrain = 'mountain'; possibleType = 'Bergkette/Gipfel'; }
    else if (part.meanSlopeDeg > 52) { terrain = 'cliff'; possibleType = 'Steilhang/Klippe'; }
    else if (avgH > 0.28 && part.meanSlopeDeg < 30) { terrain = 'plateau'; possibleType = 'Hochplateau'; }
    else if (edgeDistance < 0.12 && minH < 0.12) { terrain = 'coast'; possibleType = 'Küstenplateau'; }
    const ew = nx > 0.61 ? 'east' : nx < 0.39 ? 'west' : 'central';
    const ns = nz > 0.61 ? 'south' : nz < 0.39 ? 'north' : 'mid';
    const base = `${ns}_${ew}_${terrain}`;
    const serial = (byClass.get(base) ?? 0) + 1;
    byClass.set(base, serial);
    part.stableId = `${base}_${String(serial).padStart(2, '0')}`;
    part.dominantTerrain = terrain;
    part.possibleType = possibleType;
    part.materialProfile = terrain === 'mountain' || terrain === 'cliff' ? 'mountain_strata' : terrain === 'plateau' ? 'plateau_grass_cliff' : terrain === 'coast' ? 'coastal_grass_rock' : 'temperate_grass';
    part._normalizedCenter = [nx, nz];
  }

  // Deterministisches, flächengewichtetes K-Means gruppiert Source-Teile zu
  // Regionskandidaten. Es ist ausdrücklich nur Audit-Metadaten, nicht die
  // spätere organische Kachelsegmentierung des Bakes.
  const target = clamp(Math.round(parts.length / 2.3), 30, 45);
  const sorted = [...parts].sort((a, b) => a._normalizedCenter[0] - b._normalizedCenter[0] || a._normalizedCenter[1] - b._normalizedCenter[1]);
  let centers = Array.from({ length: target }, (_, i) => [...sorted[Math.floor((i + 0.5) * sorted.length / target)]._normalizedCenter]);
  let assignment = new Int32Array(parts.length);
  for (let iteration = 0; iteration < 24; iteration++) {
    for (let i = 0; i < parts.length; i++) {
      const [x, z] = parts[i]._normalizedCenter;
      let best = 0, bestDistance = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const dx = x - centers[c][0], dz = z - centers[c][1];
        const distance = dx * dx + dz * dz;
        if (distance < bestDistance) { bestDistance = distance; best = c; }
      }
      assignment[i] = best;
    }
    const sums = Array.from({ length: centers.length }, () => [0, 0, 0]);
    for (let i = 0; i < parts.length; i++) {
      const weight = Math.max(parts[i].projectedAreaXZ, 1e-9);
      const sum = sums[assignment[i]];
      sum[0] += parts[i]._normalizedCenter[0] * weight;
      sum[1] += parts[i]._normalizedCenter[1] * weight;
      sum[2] += weight;
    }
    centers = centers.map((center, i) => sums[i][2] > 0 ? [sums[i][0] / sums[i][2], sums[i][1] / sums[i][2]] : center);
  }
  const centerOrder = centers.map((center, original) => ({ center, original })).sort((a, b) => a.center[1] - b.center[1] || a.center[0] - b.center[0]);
  const regionId = new Map(centerOrder.map((entry, i) => [entry.original, i + 1]));
  for (let i = 0; i < parts.length; i++) {
    parts[i].candidateRegionId = regionId.get(assignment[i]);
    parts[i].runtimeGroup = `region_chunk_${String(parts[i].candidateRegionId).padStart(2, '0')}`;
    delete parts[i]._normalizedCenter;
  }
}

function detectOverlaps(parts) {
  for (const part of parts) part.overlaps = [];
  for (let i = 0; i < parts.length; i++) {
    const a = parts[i].bounds;
    for (let j = i + 1; j < parts.length; j++) {
      const b = parts[j].bounds;
      const overlap = [0, 1, 2].every((axis) => a.min[axis] <= b.max[axis] && a.max[axis] >= b.min[axis]);
      if (!overlap) continue;
      parts[i].overlaps.push(parts[j].stableId);
      parts[j].overlaps.push(parts[i].stableId);
    }
  }
}

function materialReport(gltf) {
  const textureName = (index) => {
    const texture = gltf.textures?.[index];
    if (!texture) return null;
    const image = gltf.images?.[texture.source];
    return image?.name ?? image?.uri ?? `image_${texture.source}`;
  };
  return (gltf.materials ?? []).map((material, id) => {
    const pbr = material.pbrMetallicRoughness ?? {};
    const refs = {
      baseColor: pbr.baseColorTexture?.index,
      metallicRoughness: pbr.metallicRoughnessTexture?.index,
      normal: material.normalTexture?.index,
      occlusion: material.occlusionTexture?.index,
      emissive: material.emissiveTexture?.index,
    };
    return {
      id,
      name: material.name ?? `material_${id}`,
      alphaMode: material.alphaMode ?? 'OPAQUE',
      doubleSided: material.doubleSided ?? false,
      baseColorFactor: pbr.baseColorFactor ?? [1, 1, 1, 1],
      metallicFactor: pbr.metallicFactor ?? 1,
      roughnessFactor: pbr.roughnessFactor ?? 1,
      textures: Object.fromEntries(Object.entries(refs).filter(([, value]) => value !== undefined).map(([usage, value]) => [usage, { textureId: value, source: textureName(value) }])),
    };
  });
}

function markdown(report) {
  const fmtBounds = (bounds) => `${bounds.size[0].toFixed(3)}×${bounds.size[1].toFixed(3)}×${bounds.size[2].toFixed(3)}`;
  const rows = report.parts.map((part) => `| ${part.sourceName} | ${part.stableId} | ${fmtBounds(part.bounds)} | ${part.projectedAreaXZ.toFixed(4)} | ${part.heightRange.toFixed(4)} | ${part.meanSlopeDeg.toFixed(1)}° | ${part.possibleType} | ${part.candidateRegionId} |`);
  const materialRows = report.materials.length > 0
    ? report.materials.map((material) => `| ${material.id} | ${material.name} | ${material.alphaMode} | ${Object.values(material.textures).map((texture) => texture.source).join(', ') || '–'} |`)
    : ['| – | Keine Materialdefinition | – | – |'];
  return `# Neue Insel – GLB-Audit\n\n` +
    `Automatisch erzeugt mit \`node tools/analyzeNewIsland.mjs\`. Die Source-Namen sind Debug-Metadaten; \`stableId\`, Materialprofil und Runtime-Gruppe sind die eigene, reproduzierbare Zuordnung.\n\n` +
    `## Kurzbefund\n\n` +
    `- Quelle: \`${report.source.path}\`\n` +
    `- SHA-256: \`${report.source.sha256}\`\n` +
    `- GLB: ${(report.source.bytes / 1024 / 1024).toFixed(2)} MiB, Asset-Version ${report.asset.version}\n` +
    `- Szenenknoten: ${report.counts.nodes}; Mesh-Ressourcen: ${report.counts.meshes}; ausgewertete Mesh-Instanzen: ${report.counts.parts}\n` +
    `- Primitive: ${report.counts.primitives}; Vertices: ${report.counts.vertices.toLocaleString('de-DE')}; Dreiecke: ${report.counts.triangles.toLocaleString('de-DE')}\n` +
    `- Original-Bounds: X ${report.bounds.size[0].toFixed(6)}, Y ${report.bounds.size[1].toFixed(6)}, Z ${report.bounds.size[2].toFixed(6)}\n` +
    `- Oberfläche: ${report.totals.surfaceArea.toFixed(4)}; projizierte XZ-Fläche: ${report.totals.projectedAreaXZ.toFixed(4)}\n` +
    `- Topologie: ${report.totals.connectedComponents} verbundene Komponenten, ${report.totals.openEdges.toLocaleString('de-DE')} offene und ${report.totals.nonManifoldEdges.toLocaleString('de-DE')} nicht-manifold Kanten\n` +
    `- Attribute: Normalen ${report.capabilities.normalsOnEveryPrimitive ? 'vollständig' : 'unvollständig'}, UV0 ${report.capabilities.uvsOnEveryPrimitive ? 'vollständig' : 'unvollständig'}\n` +
    `- Regionskandidaten aus Segmentzentren: ${report.counts.candidateRegions} (noch keine Gameplayregionen)\n\n` +
    `## Einordnung\n\n` +
    `Die Segmentklassifikation nutzt transformierte Geometrie, relative Höhe, Flächenneigung und Lage. Überlappungen sind AABB-Kandidaten und müssen beim Bake geometrisch aufgelöst werden. Offene Ränder markieren potentielle Küsten-/Wasserlochgrenzen, sind aber allein kein Beweis für ein Gewässer. Seen, Flüsse, echte Bauflächen und organische Regionsgrenzen werden deshalb erst aus dem gemeinsamen Höhen-/Wasserraster abgeleitet.\n\n` +
    `## Source-Part-Map (${report.parts.length} Teile)\n\n` +
    `| Quelle | stabile ID | Bounds X×Y×Z | proj. Fläche | Höhe | mittlere Neigung | möglicher Typ | Regionskandidat |\n|---|---|---:|---:|---:|---:|---|---:|\n` + rows.join('\n') + `\n\n` +
    `## Materialien und Texturen\n\n| ID | Material | Alpha | referenzierte Texturen |\n|---:|---|---|---|\n` + materialRows.join('\n') + `\n\n` +
    `## Verbindliche Folgerungen für den Bake\n\n` +
    `1. Die Authoring-GLB darf wegen ${report.counts.triangles.toLocaleString('de-DE')} Dreiecken nicht als unverändertes Runtime-Mesh geladen werden.\n` +
    `2. Die ${report.parts.length} Source-Teile werden nicht 1:1 zu Regionen; die Audit-Gruppierung liefert nur ${report.counts.candidateRegions} Kandidaten.\n` +
    `3. Runtime-Höhen, Wasser, Bauflächen und Regionen müssen aus einer gemeinsamen deterministischen Bake-Quelle entstehen.\n` +
    `4. Die endgültige Ost-Startfläche wird anhand zusammenhängender flacher Kacheln gewählt, nicht anhand eines Mesh-Namens.\n` +
    `5. Offene bzw. überlappende Geometrie wird im Höhenraster über Top-down-Max-Y konsolidiert; Wasserlöcher werden anschließend per Flood-Fill geprüft.\n`;
}

const sourceBuffer = readFileSync(SOURCE);
const { gltf, binary } = parseGlb(sourceBuffer);
const scene = sceneInstances(gltf);
console.log(`Analysiere ${scene.instances.length} Mesh-Instanzen …`);
const parts = [];
for (let i = 0; i < scene.instances.length; i++) {
  const part = analyzePart(gltf, binary, scene.instances[i]);
  parts.push(part);
  process.stdout.write(`\r${String(i + 1).padStart(3, ' ')}/${scene.instances.length}: ${part.sourceName.padEnd(24).slice(0, 24)} ${part.triangles.toLocaleString('de-DE').padStart(12)} Dreiecke`);
}
process.stdout.write('\n');

const globalBounds = emptyBounds();
for (const part of parts) mergeBounds(globalBounds, { min: part.bounds.min, max: part.bounds.max });
if (!finiteBounds(globalBounds)) throw new Error('Keine gültige Geometrie gefunden.');
classifyParts(parts, globalBounds);
detectOverlaps(parts);

const counts = {
  scenes: gltf.scenes?.length ?? 0,
  nodes: gltf.nodes?.length ?? 0,
  meshes: gltf.meshes?.length ?? 0,
  parts: parts.length,
  primitives: parts.reduce((sum, part) => sum + part.primitives.length, 0),
  vertices: parts.reduce((sum, part) => sum + part.vertices, 0),
  triangles: parts.reduce((sum, part) => sum + part.triangles, 0),
  materials: gltf.materials?.length ?? 0,
  textures: gltf.textures?.length ?? 0,
  images: gltf.images?.length ?? 0,
  candidateRegions: new Set(parts.map((part) => part.candidateRegionId)).size,
};
const report = {
  generatedAt: new Date().toISOString(),
  generator: 'tools/analyzeNewIsland.mjs',
  source: {
    path: relative(ROOT, SOURCE).replaceAll('\\', '/'),
    bytes: sourceBuffer.length,
    sha256: createHash('sha256').update(sourceBuffer).digest('hex'),
  },
  asset: gltf.asset ?? {},
  defaultScene: gltf.scene ?? 0,
  counts,
  bounds: boundsDto(globalBounds),
  totals: {
    surfaceArea: round(parts.reduce((sum, part) => sum + part.surfaceArea, 0), 8),
    projectedAreaXZ: round(parts.reduce((sum, part) => sum + part.projectedAreaXZ, 0), 8),
    approximateSignedVolume: round(parts.reduce((sum, part) => sum + part.approximateSignedVolume, 0), 8),
    connectedComponents: parts.reduce((sum, part) => sum + part.connectedComponents, 0),
    openEdges: parts.reduce((sum, part) => sum + part.openEdges, 0),
    nonManifoldEdges: parts.reduce((sum, part) => sum + part.nonManifoldEdges, 0),
  },
  capabilities: {
    normalsOnEveryPrimitive: parts.every((part) => part.hasNormals),
    uvsOnEveryPrimitive: parts.every((part) => part.hasUvs),
  },
  scenes: (gltf.scenes ?? []).map((sceneDef, id) => ({ id, name: sceneDef.name ?? `scene_${id}`, rootNodes: sceneDef.nodes ?? [] })),
  nodes: (gltf.nodes ?? []).map((node, id) => ({ id, name: node.name ?? `node_${id}`, parent: scene.parent[id], children: node.children ?? [], mesh: node.mesh ?? null, localMatrix: scene.localMatrices[id].map((value) => round(value, 8)), worldMatrix: (scene.worldMatrices[id] ?? scene.localMatrices[id]).map((value) => round(value, 8)) })),
  materials: materialReport(gltf),
  parts,
};

writeFileSync(JSON_OUT, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(MD_OUT, markdown(report));
console.log(`Geschrieben: ${relative(ROOT, JSON_OUT)}, ${relative(ROOT, MD_OUT)}`);

