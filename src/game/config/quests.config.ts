import type { QuestDef } from './types.ts';

// Linear tutorial/build-up chain that carries the player through level 1–10.
// Quests activate when their unlockLevel is reached AND the previous quest in
// the chain is completed. Money rewards match the municipal scale (§4) and act
// as "city development grants" — with building costs raised (v0.8), these
// challenge grants are now the *rewarding* money source: active play (finishing
// objectives) funds the next expansion far better than passive AFK income.
export const questsConfig: QuestDef[] = [
  {
    id: 'q01_roads',
    titleKey: 'quest.q01.title',
    descriptionKey: 'quest.q01.desc',
    unlockLevel: 1,
    objectives: [{ type: 'build', defId: 'road', count: 5 }],
    rewards: { money: 8_000, xp: 12 },
    nextQuestId: 'q02_houses',
  },
  {
    id: 'q02_houses',
    titleKey: 'quest.q02.title',
    descriptionKey: 'quest.q02.desc',
    unlockLevel: 1,
    objectives: [{ type: 'build', defId: 'house_small', count: 2 }],
    rewards: { money: 16_000, xp: 18 },
    nextQuestId: 'q03_sawmill',
  },
  {
    id: 'q03_sawmill',
    titleKey: 'quest.q03.title',
    descriptionKey: 'quest.q03.desc',
    unlockLevel: 2,
    objectives: [
      { type: 'build', defId: 'sawmill', count: 1 },
      { type: 'produce', resource: 'wood', amount: 30 },
    ],
    rewards: { money: 24_000, xp: 25 },
    nextQuestId: 'q04_water',
  },
  {
    id: 'q04_water',
    titleKey: 'quest.q04.title',
    descriptionKey: 'quest.q04.desc',
    unlockLevel: 3,
    objectives: [{ type: 'build', defId: 'well', count: 2 }],
    rewards: { money: 24_000, xp: 25 },
    nextQuestId: 'q05_mayor',
  },
  {
    id: 'q05_mayor',
    titleKey: 'quest.q05.title',
    descriptionKey: 'quest.q05.desc',
    unlockLevel: 3,
    objectives: [
      { type: 'build', defId: 'mayor_house', count: 1 },
      { type: 'mayorAction', actionId: 'speech', count: 1 },
    ],
    rewards: { money: 36_000, xp: 35 },
    nextQuestId: 'q06_food',
  },
  {
    id: 'q06_food',
    titleKey: 'quest.q06.title',
    descriptionKey: 'quest.q06.desc',
    unlockLevel: 4,
    objectives: [
      { type: 'build', defId: 'farm', count: 1 },
      { type: 'produce', resource: 'food', amount: 50 },
    ],
    rewards: { money: 36_000, xp: 32 },
    nextQuestId: 'q07_stone',
  },
  {
    id: 'q07_stone',
    titleKey: 'quest.q07.title',
    descriptionKey: 'quest.q07.desc',
    unlockLevel: 4,
    objectives: [
      { type: 'build', defId: 'quarry', count: 1 },
      { type: 'produce', resource: 'stone', amount: 40 },
    ],
    rewards: { money: 45_000, xp: 45 },
    nextQuestId: 'q08_market',
  },
  {
    id: 'q08_market',
    titleKey: 'quest.q08.title',
    descriptionKey: 'quest.q08.desc',
    unlockLevel: 5,
    objectives: [
      { type: 'build', defId: 'market', count: 1 },
      { type: 'happiness', amount: 70 },
    ],
    rewards: { money: 70_000, xp: 60 },
    nextQuestId: 'q09_expand',
  },
  {
    id: 'q09_expand',
    titleKey: 'quest.q09.title',
    descriptionKey: 'quest.q09.desc',
    unlockLevel: 5,
    objectives: [{ type: 'sectors', count: 2 }],
    rewards: { money: 95_000, xp: 75 },
    nextQuestId: 'q10_growth',
  },
  {
    id: 'q10_growth',
    titleKey: 'quest.q10.title',
    descriptionKey: 'quest.q10.desc',
    unlockLevel: 5,
    objectives: [{ type: 'population', amount: 80 }],
    rewards: { money: 80_000, xp: 40 },
    nextQuestId: 'q11_economy',
  },
  {
    id: 'q11_economy',
    titleKey: 'quest.q11.title',
    descriptionKey: 'quest.q11.desc',
    unlockLevel: 6,
    objectives: [
      { type: 'build', defId: 'shop_small', count: 2 },
      { type: 'build', defId: 'warehouse', count: 1 },
    ],
    rewards: { money: 130_000, xp: 95 },
    nextQuestId: 'q12_leisure',
  },
  {
    id: 'q12_leisure',
    titleKey: 'quest.q12.title',
    descriptionKey: 'quest.q12.desc',
    unlockLevel: 7,
    objectives: [
      { type: 'build', defId: 'park', count: 1 },
      { type: 'build', defId: 'playground', count: 1 },
      { type: 'happiness', amount: 75 },
    ],
    rewards: { money: 160_000, xp: 120 },
    nextQuestId: 'q13_fire',
  },
  {
    id: 'q13_fire',
    titleKey: 'quest.q13.title',
    descriptionKey: 'quest.q13.desc',
    unlockLevel: 8,
    objectives: [{ type: 'build', defId: 'fire_station', count: 1 }],
    rewards: { money: 190_000, xp: 140 },
    nextQuestId: 'q14_density',
  },
  {
    id: 'q14_density',
    titleKey: 'quest.q14.title',
    descriptionKey: 'quest.q14.desc',
    unlockLevel: 9,
    objectives: [
      { type: 'build', defId: 'apartment', count: 1 },
      { type: 'population', amount: 250 },
    ],
    rewards: { money: 280_000, xp: 190 },
    nextQuestId: 'q15_metropolis',
  },
  {
    id: 'q15_metropolis',
    titleKey: 'quest.q15.title',
    descriptionKey: 'quest.q15.desc',
    unlockLevel: 10,
    objectives: [
      { type: 'sectors', count: 4 },
      { type: 'population', amount: 400 },
      { type: 'happiness', amount: 80 },
    ],
    rewards: { money: 550_000, gold: 50, xp: 340 },
    nextQuestId: 'q16_power',
  },
  // ---- MVP 2: energy grid ----
  {
    id: 'q16_power',
    titleKey: 'quest.q16.title',
    descriptionKey: 'quest.q16.desc',
    unlockLevel: 11,
    objectives: [
      { type: 'build', defId: 'power_plant', count: 1 },
      { type: 'happiness', amount: 70 },
    ],
    rewards: { money: 380_000, xp: 260 },
    nextQuestId: 'q17_grid',
  },
  {
    id: 'q17_grid',
    titleKey: 'quest.q17.title',
    descriptionKey: 'quest.q17.desc',
    unlockLevel: 12,
    objectives: [
      { type: 'build', defId: 'wind_farm', count: 1 },
      { type: 'population', amount: 550 },
    ],
    rewards: { money: 520_000, gold: 30, xp: 360 },
    nextQuestId: 'q18_safety',
  },
  // ---- MVP 2: emergency services ----
  {
    id: 'q18_safety',
    titleKey: 'quest.q18.title',
    descriptionKey: 'quest.q18.desc',
    unlockLevel: 13,
    objectives: [
      { type: 'build', defId: 'police_station', count: 1 },
      { type: 'happiness', amount: 72 },
    ],
    rewards: { money: 650_000, xp: 430 },
    nextQuestId: 'q19_health',
  },
  {
    id: 'q19_health',
    titleKey: 'quest.q19.title',
    descriptionKey: 'quest.q19.desc',
    unlockLevel: 14,
    objectives: [
      { type: 'build', defId: 'hospital', count: 1 },
      { type: 'population', amount: 700 },
    ],
    rewards: { money: 850_000, gold: 40, xp: 560 },
  },
];
