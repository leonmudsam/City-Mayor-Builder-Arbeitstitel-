import type { MayorActionDef } from './types.ts';

export const mayorActionsConfig: MayorActionDef[] = [
  {
    id: 'speech',
    nameKey: 'mayor.action.speech',
    descriptionKey: 'mayor.action.speech.desc',
    unlockLevel: 3,
    cooldownSec: 4 * 3600,
    effect: { type: 'buff', kind: 'happiness', amount: 10, durationSec: 30 * 60 },
  },
  {
    id: 'visit',
    nameKey: 'mayor.action.visit',
    descriptionKey: 'mayor.action.visit.desc',
    unlockLevel: 8,
    cooldownSec: 8 * 3600,
    effect: { type: 'resolveEvents', eventType: 'fire' },
  },
  {
    id: 'festival',
    nameKey: 'mayor.action.festival',
    descriptionKey: 'mayor.action.festival.desc',
    unlockLevel: 9,
    cooldownSec: 24 * 3600,
    effect: { type: 'buff', kind: 'tax', amount: 1.25, durationSec: 2 * 3600 },
  },
];
