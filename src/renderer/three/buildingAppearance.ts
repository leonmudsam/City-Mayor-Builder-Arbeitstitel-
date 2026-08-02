// Visuelle Materialprofile für bestehende Gebäude-GLBs.
//
// Gebäude besitzen ihre eigenen Texturen; Terrain-Splat kann sie deshalb nicht
// harmonisieren. Diese reine Tabelle liefert dem Renderer eine zurückhaltende
// Farb-/PBR-Kalibrierung je Gebäuderolle, ohne Texturen umzuschreiben oder neue
// Gameplaydaten einzuführen.

import type { BuildingDef } from '../../game/config/types.ts';

export interface BuildingMaterialProfile {
  tint: number;
  saturation: number;
  lightness: number;
  roughnessMin: number;
  metalnessMax: number;
  normalStrength: number;
}

const CIVIC: BuildingMaterialProfile = {
  tint: 0xfff4df,
  saturation: 0.88,
  lightness: 1.04,
  roughnessMin: 0.72,
  metalnessMax: 0.12,
  normalStrength: 0.72,
};

const RURAL: BuildingMaterialProfile = {
  tint: 0xf2e5cf,
  saturation: 0.82,
  lightness: 1.01,
  roughnessMin: 0.8,
  metalnessMax: 0.08,
  normalStrength: 0.78,
};

const INDUSTRIAL: BuildingMaterialProfile = {
  tint: 0xe1e2d7,
  saturation: 0.74,
  lightness: 0.98,
  roughnessMin: 0.76,
  metalnessMax: 0.24,
  normalStrength: 0.82,
};

const RESIDENTIAL: BuildingMaterialProfile = {
  tint: 0xffeee1,
  saturation: 0.86,
  lightness: 1.025,
  roughnessMin: 0.76,
  metalnessMax: 0.1,
  normalStrength: 0.74,
};

const NEUTRAL: BuildingMaterialProfile = {
  tint: 0xf4eee2,
  saturation: 0.86,
  lightness: 1.01,
  roughnessMin: 0.74,
  metalnessMax: 0.16,
  normalStrength: 0.78,
};

export function buildingMaterialProfile(def: Pick<BuildingDef, 'id' | 'category'>): BuildingMaterialProfile {
  if (def.id === 'town_hall' || def.category === 'government') return CIVIC;
  if (def.id === 'farm' || def.id === 'sawmill') return RURAL;
  if (def.category === 'production' || def.category === 'energy') return INDUSTRIAL;
  if (def.category === 'residential') return RESIDENTIAL;
  return NEUTRAL;
}

