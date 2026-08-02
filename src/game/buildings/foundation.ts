// Kanonische Fundamentplanung für Platzierung, Kosten, Bauzeit und Renderer.
// Das Insel-Bake bleibt unverändert; Terrassen, Stützmauern und Pfähle sind
// abgeleitete Konstruktionen über dem vorhandenen Gelände (D-043).

import type { ResourceId } from '../types.ts';
import type { PlacementSurfaceSample } from '../map/world.ts';
import { plinthDepthFor } from './terrainFit.ts';

export type TerrainBuildCategory =
  | 'BUILDABLE_FLAT'
  | 'BUILDABLE_SLOPE'
  | 'BUILDABLE_TERRACE'
  | 'WATER_EDGE'
  | 'CLIFF';

export type FoundationKind = 'natural' | 'stepped' | 'terrace' | 'piles' | 'cliff_wall';

export interface FoundationPlan {
  category: TerrainBuildCategory;
  kind: FoundationKind;
  heightDelta: number;
  slope: number;
  supportDepth: number;
  tiers: number;
  extraCost: Partial<Record<ResourceId, number>>;
  extraConstructionSec: number;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Reine Tabellen-/Renderer-freie Klassifikation einer geprüften Grundfläche. */
export function foundationPlanForSurface(
  surface: PlacementSurfaceSample,
  width: number,
  height: number,
): FoundationPlan {
  const area = Math.max(1, width * height);
  const heightDelta = Math.max(0, surface.maxHeight - surface.minHeight);
  const supportDepth = plinthDepthFor(heightDelta);

  let category: TerrainBuildCategory;
  let kind: FoundationKind;
  if (surface.waterOverlap > 0 || surface.waterfrontRatio >= 0.12) {
    category = 'WATER_EDGE';
    kind = 'piles';
  } else if (surface.cliffOverlap > 0) {
    category = 'CLIFF';
    kind = 'cliff_wall';
  } else if (heightDelta <= 0.16 && surface.slope <= 0.24) {
    category = 'BUILDABLE_FLAT';
    kind = 'natural';
  } else if (heightDelta <= 0.72 && surface.slope <= 0.9) {
    category = 'BUILDABLE_SLOPE';
    kind = 'stepped';
  } else {
    category = 'BUILDABLE_TERRACE';
    kind = 'terrace';
  }

  const tiers = kind === 'terrace' || kind === 'cliff_wall'
    ? Math.max(2, Math.min(5, Math.ceil(heightDelta / 0.42)))
    : (kind === 'stepped' ? 2 : 1);
  const extraCost: Partial<Record<ResourceId, number>> = {};
  let extraConstructionSec = 0;

  if (kind === 'stepped') {
    extraCost.money = Math.round(area * (38 + heightDelta * 34));
    extraCost.stone = Math.max(1, Math.ceil(area * 0.35 + heightDelta * 2));
    extraConstructionSec = Math.ceil(8 + area * 1.5 + heightDelta * 10);
  } else if (kind === 'terrace') {
    extraCost.money = Math.round(area * (86 + heightDelta * 58));
    extraCost.stone = Math.max(2, Math.ceil(area * 0.8 + heightDelta * 5));
    extraCost.wood = Math.max(1, Math.ceil(area * 0.15));
    extraConstructionSec = Math.ceil(20 + area * 2.5 + heightDelta * 18);
  } else if (kind === 'piles') {
    extraCost.money = Math.round(area * (72 + supportDepth * 42));
    extraCost.wood = Math.max(2, Math.ceil(area * 0.75 + supportDepth * 2));
    extraCost.stone = Math.max(1, Math.ceil(area * 0.25));
    extraConstructionSec = Math.ceil(16 + area * 2 + supportDepth * 12);
  } else if (kind === 'cliff_wall') {
    extraCost.money = Math.round(area * (118 + supportDepth * 72));
    extraCost.stone = Math.max(3, Math.ceil(area * 1.1 + supportDepth * 6));
    extraCost.wood = Math.max(1, Math.ceil(area * 0.2));
    extraConstructionSec = Math.ceil(28 + area * 3 + supportDepth * 22);
  }

  return {
    category,
    kind,
    heightDelta: round2(heightDelta),
    slope: round2(surface.slope),
    supportDepth: round2(supportDepth),
    tiers,
    extraCost,
    extraConstructionSec,
  };
}
