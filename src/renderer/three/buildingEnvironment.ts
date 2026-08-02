// Deterministische Umgebungspläne für Gebäude.
//
// Die Positionen sind lokal um den Footprint-Mittelpunkt. Der Three-Renderer
// sammelt sie anschließend weltglobal und zeichnet jede Prop-Art als genau ein
// InstancedMesh. Damit bleiben Rathaus, Sägewerk, Farm und Industrie auch dann
// eingebettet, wenn ihr eigentliches GLB den prozeduralen Gebäudefallback
// ersetzt.

import type { BuildingDef } from '../../game/config/types.ts';

export type BuildingEnvironmentKind =
  | 'plaza'
  | 'yard'
  | 'sawdust'
  | 'path'
  | 'log'
  | 'stump'
  | 'field'
  | 'fence'
  | 'hay'
  | 'flower'
  | 'bench'
  | 'crate'
  | 'pallet'
  | 'ore'
  | 'coal'
  | 'barrel'
  | 'basin';

export interface BuildingEnvironmentInstance {
  kind: BuildingEnvironmentKind;
  localX: number;
  localZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotationY: number;
  colorVariant: number;
}

const item = (
  kind: BuildingEnvironmentKind,
  localX: number,
  localZ: number,
  scaleX = 1,
  scaleY = 1,
  scaleZ = 1,
  rotationY = 0,
  colorVariant = 0,
): BuildingEnvironmentInstance => ({
  kind,
  localX,
  localZ,
  scaleX,
  scaleY,
  scaleZ,
  rotationY,
  colorVariant,
});

/** Rein visuelle Umgebung; Baustellen erhalten bewusst nur ihr Gerüst. */
export function buildingEnvironmentPlan(
  def: Pick<BuildingDef, 'id' | 'category' | 'size'>,
  upgradeLevel: number,
): BuildingEnvironmentInstance[] {
  const w = def.size.w;
  const h = def.size.h;
  const stage = Math.max(0, upgradeLevel);

  if (def.id === 'town_hall') {
    return [
      item('plaza', 0, h * 0.29, w * 0.82, 1, h * 0.28),
      item('path', 0, h * 0.43, w * 0.18, 1, h * 0.18),
      item('flower', -w * 0.34, h * 0.31, 1.15, 1, 1.15, 0, 1),
      item('flower', w * 0.34, h * 0.31, 1.15, 1, 1.15, 0, 2),
      item('bench', -w * 0.23, h * 0.42, 1, 1, 1, Math.PI / 2),
      item('bench', w * 0.23, h * 0.42, 1, 1, 1, -Math.PI / 2),
      ...(stage >= 1
        ? [
            item('flower', -w * 0.43, -h * 0.18, 0.9, 1, 0.9, 0, 3),
            item('flower', w * 0.43, -h * 0.18, 0.9, 1, 0.9, 0, 1),
          ]
        : []),
    ];
  }

  if (def.id === 'sawmill') {
    const logs: BuildingEnvironmentInstance[] = [];
    for (let row = 0; row < 2 + Math.min(stage, 1); row++) {
      for (let col = 0; col < 3; col++) {
        logs.push(item('log', -w * 0.32 + col * 0.34, h * 0.31 + row * 0.18, 1.15, 1, 1, Math.PI / 2, row));
      }
    }
    return [
      item('yard', 0, h * 0.18, w * 0.92, 1, h * 0.5),
      item('sawdust', w * 0.28, -h * 0.2, w * 0.28, 1, h * 0.24),
      item('path', 0, h * 0.43, w * 0.24, 1, h * 0.18),
      ...logs,
      item('stump', w * 0.39, h * 0.31, 1.1, 1, 1.1, 0, 1),
      item('stump', w * 0.32, h * 0.43, 0.85, 1, 0.85, 0, 2),
    ];
  }

  if (def.id === 'farm') {
    const fields: BuildingEnvironmentInstance[] = [];
    for (let row = -2; row <= 2; row++) {
      fields.push(item('field', -w * 0.27, row * h * 0.125, w * 0.34, 1, h * 0.075, 0, row + 2));
    }
    const fence: BuildingEnvironmentInstance[] = [
      item('fence', 0, h * 0.46, w * 0.9, 1, 1),
      item('fence', 0, -h * 0.46, w * 0.9, 1, 1),
      item('fence', w * 0.46, 0, h * 0.9, 1, 1, Math.PI / 2),
      item('fence', -w * 0.46, 0, h * 0.9, 1, 1, Math.PI / 2),
    ];
    return [
      ...fields,
      ...fence,
      item('hay', w * 0.31, h * 0.28, 1, 1, 1, Math.PI / 2),
      item('hay', w * 0.38, h * 0.1, 0.85, 0.85, 0.85, Math.PI / 2, 1),
      ...(stage >= 1 ? [item('hay', w * 0.26, -h * 0.22, 1.1, 1.1, 1.1, Math.PI / 2, 2)] : []),
    ];
  }

  if (def.id === 'quarry') {
    return [
      item('yard', 0, h * 0.18, w * 0.9, 1, h * 0.48, 0, 2),
      item('ore', -w * 0.32, h * 0.3, 1.5, 1.2, 1.3, 0, 0),
      item('ore', -w * 0.14, h * 0.38, 1.1, 0.9, 1.2, 0, 2),
      item('ore', w * 0.34, -h * 0.26, 1.35, 1.1, 1.25, 0, 1),
      item('crate', w * 0.31, h * 0.31, 1, 1, 1, 0, stage),
      item('path', 0, h * 0.44, w * 0.26, 1, h * 0.16),
    ];
  }

  if (def.id === 'warehouse' || def.id === 'depot') {
    return [
      item('yard', 0, h * 0.28, w * 0.92, 1, h * 0.38, 0, 1),
      item('pallet', -w * 0.31, h * 0.31, 1.2, 1, 1.2, 0, 0),
      item('crate', -w * 0.16, h * 0.34, 1.1, 1.1, 1.1, 0, 1),
      item('crate', w * 0.31, h * 0.3, 1, 1, 1, 0, 2),
      item('barrel', w * 0.18, h * 0.39, 0.9, 0.9, 0.9, 0, 1),
      ...(stage >= 1 ? [item('pallet', w * 0.35, -h * 0.22, 1.1, 1, 1.1, 0, 2)] : []),
    ];
  }

  if (def.id === 'waterworks') {
    return [
      item('yard', 0, h * 0.3, w * 0.9, 1, h * 0.34, 0, 2),
      item('basin', -w * 0.29, h * 0.26, 1.4, 1, 1.4, 0, 0),
      item('basin', w * 0.02, h * 0.32, 1.2, 1, 1.2, 0, 1),
      item('barrel', w * 0.34, h * 0.34, 0.9, 0.9, 0.9),
    ];
  }

  if (def.id === 'power_plant') {
    return [
      item('yard', 0, h * 0.3, w * 0.92, 1, h * 0.34, 0, 3),
      item('coal', -w * 0.31, h * 0.31, 1.7, 1.25, 1.45),
      item('coal', -w * 0.12, h * 0.37, 1.25, 1, 1.2, 0, 1),
      item('pallet', w * 0.29, h * 0.31, 1.3, 1, 1.3),
      item('barrel', w * 0.39, h * 0.39, 1.1, 1.1, 1.1, 0, 2),
    ];
  }

  if (def.category === 'production' || def.category === 'energy') {
    return [
      item('yard', 0, h * 0.32, w * 0.9, 1, h * 0.3, 0, 1),
      item('crate', -w * 0.32, h * 0.35, 1, 1, 1, 0, 1),
      item('pallet', w * 0.31, h * 0.34, 1, 1, 1, 0, 2),
    ];
  }

  return [];
}

