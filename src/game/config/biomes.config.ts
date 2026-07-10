import type { BiomeDef } from './types.ts';

// MVP 1 only ships the plains + forest start region (river visible but
// locked). Later biomes are content additions here, not code changes.
export const biomesConfig: BiomeDef[] = [
  { id: 'plains', nameKey: 'biome.plains', terrainTypes: ['grass', 'fertile'], unlockLevel: 1 },
  { id: 'forest', nameKey: 'biome.forest', terrainTypes: ['forest'], unlockLevel: 1 },
  { id: 'river', nameKey: 'biome.river', terrainTypes: ['river'], unlockLevel: 11 },
];
