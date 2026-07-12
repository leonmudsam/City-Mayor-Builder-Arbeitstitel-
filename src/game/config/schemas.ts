import { z } from 'zod';

// Zod schemas validate the static configs at startup (fail fast on broken
// balancing data) and every save game after loading.

const resourceId = z.enum(['money', 'wood', 'stone', 'food', 'freshwater']);
const needId = z.enum(['housing', 'water', 'food', 'work', 'leisure', 'energy', 'safety', 'health', 'freshwater']);

const terrainType = z.enum(['grass', 'forest', 'water', 'river', 'mountain', 'sand', 'fertile']);

const buildingEffect = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('produce'),
    resource: resourceId,
    perMinute: z.number().positive(),
    inputsPerMinute: z.record(resourceId, z.number().positive()).optional(),
  }),
  z.object({ type: z.literal('capacity'), need: needId, amount: z.number().positive(), radius: z.number().positive().optional() }),
  z.object({
    type: z.literal('housing'),
    units: z.number().int().positive(),
    minResidentsPerUnit: z.number().int().positive(),
    maxResidentsPerUnit: z.number().int().positive(),
    ambienceSensitivity: z.number().positive().optional(),
  }),
  z.object({ type: z.literal('revenue'), category: z.enum(['commercial', 'industrial']), perMinute: z.number().positive() }),
  z.object({ type: z.literal('upkeep'), resource: resourceId, perMinute: z.number().positive() }),
  z.object({ type: z.literal('logistics'), boostPct: z.number().positive(), radius: z.number().positive() }),
  z.object({ type: z.literal('coverage'), need: needId, radius: z.number().positive(), capacity: z.number().positive().optional() }),
  z.object({ type: z.literal('storage'), resource: resourceId, amount: z.number().positive() }),
  z.object({ type: z.literal('jobs'), amount: z.number().positive() }),
  z.object({ type: z.literal('demand'), need: needId, amount: z.number().positive() }),
  z.object({ type: z.literal('distribution'), need: needId, radius: z.number().positive() }),
  z.object({ type: z.literal('protection'), hazard: z.literal('fire'), radius: z.number().positive() }),
  z.object({ type: z.literal('ambience'), amount: z.number(), radius: z.number().positive() }),
]);

export const buildingDefSchema = z.object({
  id: z.string().min(1),
  category: z.enum(['roads', 'residential', 'production', 'services', 'leisure', 'economy', 'government', 'infrastructure', 'decoration', 'special']),
  nameKey: z.string(),
  size: z.object({ w: z.number().int().min(1).max(4), h: z.number().int().min(1).max(4) }),
  requiresRoad: z.boolean(),
  unlockLevel: z.number().int().min(1),
  cost: z.record(resourceId, z.number().nonnegative()),
  constructionSec: z.number().nonnegative(),
  xpReward: z.number().nonnegative(),
  effects: z.array(buildingEffect),
  upgrades: z
    .array(z.object({ cost: z.record(resourceId, z.number().nonnegative()), constructionSec: z.number().nonnegative(), effects: z.array(buildingEffect), xpReward: z.number().nonnegative() }))
    .optional(),
  locationBonus: z
    .object({ terrain: terrainType, radius: z.number().positive(), perTilePct: z.number().positive(), maxPct: z.number().positive() })
    .optional(),
  buildLimit: z.array(z.object({ level: z.number().int().min(1), max: z.number().int().nonnegative() })).optional(),
  unique: z.boolean().optional(),
  canDemolish: z.boolean().optional(),
  canRelocate: z.boolean().optional(),
  relocationCost: z.record(resourceId, z.number().nonnegative()).optional(),
  buildable: z.boolean().optional(),
  biomeRequirement: z.array(z.string()).optional(),
  adjacentTerrain: z.string().optional(),
  costScaling: z.number().positive().optional(),
});

export const levelDefSchema = z.object({
  level: z.number().int().min(1),
  xpRequired: z.number().nonnegative(),
  unlocks: z.array(z.string()),
  rewards: z.object({ money: z.number().optional(), gold: z.number().optional() }),
});

export const questDefSchema = z.object({
  id: z.string(),
  titleKey: z.string(),
  descriptionKey: z.string(),
  unlockLevel: z.number().int().min(1),
  objectives: z.array(
    z.discriminatedUnion('type', [
      z.object({ type: z.literal('build'), defId: z.string(), count: z.number().int().positive() }),
      z.object({ type: z.literal('population'), amount: z.number().positive() }),
      z.object({ type: z.literal('resource'), resource: resourceId, amount: z.number().positive() }),
      z.object({ type: z.literal('produce'), resource: resourceId, amount: z.number().positive() }),
      z.object({ type: z.literal('level'), level: z.number().int().positive() }),
      z.object({ type: z.literal('sectors'), count: z.number().int().positive() }),
      z.object({ type: z.literal('mayorAction'), actionId: z.string(), count: z.number().int().positive() }),
      z.object({ type: z.literal('happiness'), amount: z.number().positive() }),
    ]),
  ),
  rewards: z.object({ money: z.number().optional(), gold: z.number().optional(), xp: z.number().optional() }),
  nextQuestId: z.string().optional(),
});

export const mayorActionDefSchema = z.object({
  id: z.string(),
  nameKey: z.string(),
  descriptionKey: z.string(),
  unlockLevel: z.number().int().min(1),
  cooldownSec: z.number().positive(),
  effect: z.discriminatedUnion('type', [
    z.object({ type: z.literal('buff'), kind: z.enum(['happiness', 'tax']), amount: z.number(), durationSec: z.number().positive() }),
    z.object({ type: z.literal('resolveEvents'), eventType: z.literal('fire') }),
  ]),
});

// ---- Save game ------------------------------------------------------------

const terrain = z.enum(['grass', 'forest', 'water', 'river', 'mountain', 'sand', 'fertile']);

export const saveGameSchema = z.object({
  schemaVersion: z.number().int().positive(),
  meta: z.object({
    cityName: z.string(),
    createdAt: z.number(),
    lastSimTime: z.number(),
    playTimeSec: z.number(),
  }),
  rngSeed: z.number(),
  level: z.object({ current: z.number().int().min(1), xp: z.number().nonnegative() }),
  resources: z.record(resourceId, z.number()),
  gold: z.object({ balance: z.number().nonnegative() }),
  policy: z.object({ residentialTaxRate: z.number().positive(), commercialTaxRate: z.number().positive() }),
  goldTransactions: z.array(
    z.object({ id: z.string(), timestamp: z.number(), amount: z.number(), reason: z.string(), balanceAfter: z.number() }),
  ),
  world: z.object({
    sectors: z.record(
      z.string(),
      z.object({
        id: z.string(),
        sx: z.number().int(),
        sy: z.number().int(),
        districtId: z.string(),
        status: z.enum(['locked', 'unlocked']),
        tiles: z.array(z.object({ terrain, buildingId: z.string().optional() })),
      }),
    ),
    districts: z.record(z.string(), z.object({ id: z.string(), nameKey: z.string(), centerBuildingId: z.string() })),
  }),
  buildings: z.record(
    z.string(),
    z.object({
      id: z.string(),
      defId: z.string(),
      x: z.number().int(),
      y: z.number().int(),
      upgradeLevel: z.number().int().nonnegative(),
      status: z.enum(['constructing', 'active', 'paused']),
      constructionEndsAt: z.number().optional(),
    }),
  ),
  citizens: z.object({
    population: z.number().nonnegative(),
    happiness: z.number().min(0).max(100),
    needs: z.record(needId, z.object({ supply: z.number(), demand: z.number(), fulfillment: z.number() })),
  }),
  mayor: z.object({
    houseLevel: z.number().int().nonnegative(),
    reputation: z.number(),
    actionCooldowns: z.record(z.string(), z.number()),
    messages: z.array(
      z.object({
        id: z.string(),
        textKey: z.string(),
        params: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
        kind: z.enum(['complaint', 'praise', 'info']),
        createdAt: z.number(),
      }),
    ),
  }),
  quests: z.object({
    completed: z.array(z.string()),
    active: z.array(z.object({ questId: z.string(), progress: z.array(z.number()), claimable: z.boolean() })),
  }),
  buffs: z.array(z.object({ id: z.string(), kind: z.enum(['happiness', 'tax']), amount: z.number(), endsAt: z.number() })),
  events: z.array(
    z.object({ id: z.string(), type: z.literal('fire'), buildingId: z.string(), startedAt: z.number(), endsAt: z.number() }),
  ),
  stats: z.object({
    built: z.record(z.string(), z.number()),
    produced: z.record(resourceId, z.number()),
    mayorActions: z.record(z.string(), z.number()),
    sectorsUnlocked: z.number(),
  }),
  nextId: z.number().int(),
});
