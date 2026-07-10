import type { BuildingCategory, TerrainType } from '../game/types.ts';

// Flat, friendly placeholder palette. Swapped for sprite assets later —
// the renderer draws everything programmatically in MVP 1 step 5.

export const TERRAIN_COLORS: Record<TerrainType, number> = {
  grass: 0x7cb85c,
  forest: 0x4d8a45,
  fertile: 0x94c161,
  river: 0x4a90cf,
  water: 0x3f86c9,
  mountain: 0x8d8d95,
  sand: 0xd9c98a,
};

export const CATEGORY_COLORS: Record<BuildingCategory, number> = {
  roads: 0x5b6068,
  residential: 0xe2a24b,
  production: 0xa9743c,
  services: 0x5fa8d3,
  leisure: 0x6fc276,
  economy: 0xba68c8,
  government: 0xe3627a,
  infrastructure: 0x90a4ae,
  decoration: 0x81c784,
  special: 0xffd54f,
};

export const COLOR_LOCKED_OVERLAY = 0x0c1017;
export const COLOR_GHOST_OK = 0x4caf50;
export const COLOR_GHOST_BAD = 0xe53935;
export const COLOR_SELECTION = 0xffffff;
export const COLOR_CONSTRUCTION = 0xc9b458;
export const COLOR_FIRE = 0xff5722;
export const COLOR_BONUS = 0x58c470;

// Roads: sidewalk frame + asphalt body + lane markings.
export const COLOR_SIDEWALK = 0x9aa1ab;
export const COLOR_ASPHALT = 0x454b54;
export const COLOR_LANE = 0xf5f0e6;

/** Radius overlays per effect kind (water/leisure/fire/ambience). */
export const RADIUS_COLORS: Record<string, number> = {
  water: 0x4a90cf,
  leisure: 0x6fc276,
  protection: 0xe35d5d,
  ambience: 0xffd54f,
};
