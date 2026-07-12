import type { ResourceDef } from './types.ts';

export const resourcesConfig: ResourceDef[] = [
  { id: 'money', nameKey: 'resource.money', baseStorage: Number.POSITIVE_INFINITY },
  { id: 'wood', nameKey: 'resource.wood', baseStorage: 300 },
  { id: 'stone', nameKey: 'resource.stone', baseStorage: 300 },
  { id: 'food', nameKey: 'resource.food', baseStorage: 300 },
  // Drinking water is a *product* (MVP 2 supply chain), distinct from the water
  // infrastructure need. It has no base storage — it only accumulates once the
  // chain exists (waterworks/warehouse/supermarket provide the storage), so it
  // can't pile up before there's anywhere to keep it.
  { id: 'freshwater', nameKey: 'resource.freshwater', baseStorage: 0 },
];
