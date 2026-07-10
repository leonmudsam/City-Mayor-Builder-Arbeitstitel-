import type { ResourceDef } from './types.ts';

export const resourcesConfig: ResourceDef[] = [
  { id: 'money', nameKey: 'resource.money', baseStorage: Number.POSITIVE_INFINITY },
  { id: 'wood', nameKey: 'resource.wood', baseStorage: 300 },
  { id: 'stone', nameKey: 'resource.stone', baseStorage: 300 },
  { id: 'food', nameKey: 'resource.food', baseStorage: 300 },
];
