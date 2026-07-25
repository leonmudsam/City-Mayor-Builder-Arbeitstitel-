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
  category: z.enum(['roads', 'residential', 'production', 'services', 'energy', 'leisure', 'economy', 'government', 'infrastructure', 'decoration', 'special']),
  nameKey: z.string(),
  // § Gebäudesystem 2.0: Footprints bis 8×8 (XXL); 12 lässt Luft für Hero-Bauten.
  size: z.object({ w: z.number().int().min(1).max(12), h: z.number().int().min(1).max(12) }),
  sizeClass: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  requiresRoad: z.boolean(),
  infrastructureModes: z.array(z.enum(['road', 'water', 'rail', 'air'])).optional(),
  // Straßen-Bauklasse (§ Infrastruktur 2.0 / I1) — nur für category 'roads'.
  road: z.object({
    crossesWater: z.boolean().optional(),
    crossesCliff: z.boolean().optional(),
    maxSlope: z.number().positive().optional(),
    bridgeCostPerTile: z.record(resourceId, z.number().nonnegative()).optional(),
  }).optional(),
  // Bau auf Fels/Gebirge (§ Steinbruch) — flache Felsschelfe statt Klippenwände.
  buildsOnRock: z.object({ maxSlope: z.number().positive().optional() }).optional(),
  waterfront: z.object({
    landWidth: z.number().int().positive(),
    landDepth: z.number().int().positive(),
    waterWidth: z.number().int().positive(),
    waterDepth: z.number().int().positive(),
    shorelineTolerance: z.number().min(0).max(1),
    minimumWaterDepth: z.number().positive(),
  }).optional(),
  unlockLevel: z.number().int().min(1),
  cost: z.record(resourceId, z.number().nonnegative()),
  constructionSec: z.number().nonnegative(),
  xpReward: z.number().nonnegative(),
  effects: z.array(buildingEffect),
  upgrades: z
    .array(z.object({ cost: z.record(resourceId, z.number().nonnegative()), constructionSec: z.number().nonnegative(), effects: z.array(buildingEffect), xpReward: z.number().nonnegative(), unlockLevel: z.number().int().min(1).optional(), nameKey: z.string().optional() }))
    .optional(),
  // Aktiver Betrieb (§ Active Operations 2.0) — schaltet passive Produktion ab.
  operation: z
    .object({
      resource: resourceId,
      nodeType: z.enum(['tree', 'rock', 'crop', 'livestock', 'water_source', 'wild_plant']),
      nodeTerrain: terrainType,
      efficientRadius: z.number().int().positive(),
      maxRadius: z.number().int().positive(),
      stages: z
        .array(
          z.object({
            workerSlots: z.number().int().positive(),
            movementSpeed: z.number().positive(),
            workSpeed: z.number().positive(),
            carryCapacity: z.number().positive(),
            storageCapacity: z.number().positive(),
          }),
        )
        .min(1),
    })
    .refine((op) => op.maxRadius >= op.efficientRadius, { message: 'operation: maxRadius < efficientRadius' })
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
  firstBuildDiscount: z.number().min(0).max(1).optional(),
  tradePost: z.boolean().optional(),
  // Forward-looking visual metadata (v0.21) — optional, ignored by the current
  // renderer; kept loose (passthrough) so future asset fields don't need a
  // schema change. Logic never reads it.
  visual: z.object({}).passthrough().optional(),
});

export const levelDefSchema = z.object({
  level: z.number().int().min(1),
  xpRequired: z.number().nonnegative(),
  unlocks: z.array(z.string()),
  rewards: z.object({ money: z.number().optional(), gold: z.number().optional() }),
});

/** Region-Definitionen der organischen Landschaften (§ Welt 2.0, regions.config.ts). */
export const regionDefSchema = z.object({
  id: z.number().int().positive(),
  nameKey: z.string().min(1),
  biome: z.enum(['zentrum', 'ebene', 'wald', 'gebirge', 'huegel', 'see', 'kueste', 'fruchtbar', 'flusstal', 'insel']),
  unlockable: z.boolean(),
  unlockLevel: z.number().int().min(1),
  unlockCost: z.number().nonnegative(),
  prerequisiteRegionIds: z.array(z.number().int().positive()).optional(),
  buildableTiles: z.number().int().nonnegative(),
  productionModifiers: z
    .record(z.enum(['wood', 'stone', 'food', 'water', 'energy']), z.number().positive())
    .optional(),
  roadCostFactor: z.number().positive().optional(),
  requiresHarbor: z.boolean().optional(),
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
      z.object({ type: z.literal('regions'), count: z.number().int().positive() }),
      z.object({ type: z.literal('mayorAction'), actionId: z.string(), count: z.number().int().positive() }),
      z.object({ type: z.literal('happiness'), amount: z.number().positive() }),
      z.object({ type: z.literal('upgrade'), defId: z.string().optional(), count: z.number().int().positive() }),
      z.object({ type: z.literal('activity'), count: z.number().int().positive() }),
      z.object({ type: z.literal('tradeEarnings'), amount: z.number().positive() }),
    ]),
  ),
  rewards: z.object({
    money: z.number().optional(),
    gold: z.number().optional(),
    xp: z.number().optional(),
    resources: z.record(resourceId, z.number()).optional(),
  }),
  nextQuestId: z.string().optional(),
  sender: z.enum(['citizen', 'buildingDept', 'fire', 'merchant', 'mayor']).optional(),
});

const activityBuff = z.object({
  kind: z.enum(['happiness', 'tax', 'production', 'foodDistribution']),
  amount: z.number(),
  durationSec: z.number().positive(),
});

const driveVehicle = z.enum([
  'handcart',
  'van',
  'medium_truck',
  'large_truck',
  'refrigerated_truck',
  'heavy_transporter',
  'fire_truck',
  'logging_truck',
  'police_car',
  'flatbed',
  'freight_train',
  'cargo_plane',
  'cargo_barge',
]);

const activityVehicleDefSchema = z.object({
  id: driveVehicle,
  nameKey: z.string(),
  descriptionKey: z.string(),
  unlockLevel: z.number().int().min(1),
  capacity: z.number().int().positive(),
  speedKph: z.number().positive(),
  handling: z.number().int().min(1).max(5),
  operatingCost: z.number().nonnegative(),
  consumption: z.enum(['low', 'medium', 'high']),
  imageKey: z.string().min(1),
  strengthsKeys: z.array(z.string()).min(1),
  weaknessesKeys: z.array(z.string()).min(1),
  future: z.boolean().optional(),
  // Fahrzeugeignung (L4 / A6): optional, nur Bewertung/Prognose — kein Save.
  loadTimeSec: z.number().nonnegative().optional(),
  unloadTimeSecPerTarget: z.number().nonnegative().optional(),
  narrowStreetPenalty: z.number().min(0).max(1).optional(),
  cooling: z.boolean().optional(),
});

export const activityDefSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['delivery', 'inspection', 'decision']),
  category: z.enum(['supply', 'inspection', 'politics', 'event', 'safety', 'trade', 'environment', 'logistics']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  nameKey: z.string(),
  descriptionKey: z.string(),
  unlockLevel: z.number().int().min(1),
  cooldownSec: z.number().nonnegative().optional(),
  sender: z.enum(['citizen', 'buildingDept', 'fire', 'merchant', 'mayor']),
  requiresAnyBuilding: z.array(z.string()).optional(),
  targetCount: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }).optional(),
  drive: z.boolean().optional(),
  vehicle: driveVehicle.optional(),
  vehicleOptions: z.array(driveVehicle).min(1).optional(),
  targetCategories: z
    .array(z.enum(['roads', 'residential', 'production', 'services', 'energy', 'leisure', 'economy', 'government', 'infrastructure', 'decoration', 'special']))
    .optional(),
  targetDefIds: z.array(z.string()).optional(),
  timeLimitSec: z.number().positive().optional(),
  speedBonusFactor: z.number().min(1).optional(),
  costPerTarget: z.record(resourceId, z.number().nonnegative()).optional(),
  cargoModel: z
    .object({
      resource: resourceId,
      perTarget: z.number().positive(),
      scaleByResidents: z.boolean().optional(),
      perishable: z.boolean().optional(),
    })
    .optional(),
  options: z
    .array(
      z.object({
        id: z.string().min(1),
        cost: z.record(resourceId, z.number().nonnegative()).optional(),
        reward: z.object({ money: z.number().optional(), xp: z.number().optional() }).optional(),
        buff: activityBuff.optional(),
        buffs: z.array(activityBuff).optional(),
        requiresAnyBuilding: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  rewardTiers: z
    .array(
      z.object({
        minLevel: z.number().int().min(1),
        money: z.number().nonnegative(),
        xp: z.number().nonnegative(),
        gold: z.number().optional(),
        resources: z.record(resourceId, z.number()).optional(),
        buff: activityBuff.optional(),
      }),
    )
    .min(1),
});

export const tradeContractTemplateSchema = z.object({
  id: z.string().min(1),
  minLevel: z.number().int().min(1),
  demands: z.record(resourceId, z.number().positive()),
  rewardMoney: z.number().positive(),
  rewardXp: z.number().nonnegative(),
  rewardGold: z.number().optional(),
  weight: z.number().positive().optional(),
});

export const activitiesConfigSchema = z.object({
  activities: z.array(activityDefSchema),
  vehicles: z.array(activityVehicleDefSchema),
  tradeContracts: z.array(tradeContractTemplateSchema),
  tradeRotationSec: z.number().positive(),
  tradeOffersPerRotation: z.number().int().positive(),
});

export const mayorActionDefSchema = z.object({
  id: z.string(),
  nameKey: z.string(),
  descriptionKey: z.string(),
  unlockLevel: z.number().int().min(1),
  cooldownSec: z.number().positive(),
  effect: z.discriminatedUnion('type', [
    z.object({ type: z.literal('buff'), kind: z.enum(['happiness', 'tax', 'production', 'foodDistribution']), amount: z.number(), durationSec: z.number().positive() }),
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
  // Schema v11 (§ Slim-Save + Welt 2.0): Regionen sind reine Fortschritts-Stubs —
  // Geometrie/Terrain kommen deterministisch aus dem Insel-Bake, die
  // Gebäude-Belegung aus `buildings`. Sparse `terrainOverrides` nur für
  // Debug/Tests. Details: docs/SAVE_MIGRATION.md.
  world: z.object({
    regions: z.record(
      z.string(),
      z.object({
        id: z.number().int().positive(),
        districtId: z.string(),
        status: z.enum(['locked', 'unlocked']),
      }),
    ),
    districts: z.record(z.string(), z.object({ id: z.string(), nameKey: z.string(), centerBuildingId: z.string() })),
    terrainOverrides: z.record(z.string(), terrain).optional(),
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
      targetUpgradeLevel: z.number().int().nonnegative().optional(),
      constructionEndsAt: z.number().optional(),
      rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).optional(),
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
  buffs: z.array(z.object({ id: z.string(), kind: z.enum(['happiness', 'tax', 'production', 'foodDistribution']), amount: z.number(), endsAt: z.number() })),
  events: z.array(
    z.object({ id: z.string(), type: z.literal('fire'), buildingId: z.string(), startedAt: z.number(), endsAt: z.number() }),
  ),
  activities: z.object({
    active: z
      .object({
        defId: z.string(),
        startedAt: z.number(),
        expiresAt: z.number().optional(),
        vehicle: driveVehicle.optional(),
        plannedRoadPath: z
          .array(z.object({ x: z.number().int(), y: z.number().int() }))
          .min(2)
          .optional(),
        reserved: z.record(resourceId, z.number().nonnegative()).optional(),
        targets: z.array(z.object({ buildingId: z.string(), done: z.boolean() })),
      })
      .optional(),
    // § Stadtarbeit-Stabilität 9.1 (Save v21): eingefrorener Planungssnapshot
    // des offenen Auftrags. Optional/additiv — Alt-Saves besitzen ihn nicht.
    selection: z
      .object({
        defId: z.string(),
        createdAt: z.number(),
        epoch: z.number().int().nonnegative(),
        sourceBuildingId: z.string().optional(),
        targetBuildingIds: z.array(z.string()),
      })
      .optional(),
    cooldowns: z.record(z.string(), z.number()),
    fulfilledContracts: z.array(z.string()),
  }),
  // § Active Operations 2.0 (Save v17): lokale Betriebslager, Arbeiterzustände,
  // aktive Aufträge und Ressourcenknoten-Deltas. Optional/additiv — Alt-Saves
  // ohne das Feld bleiben gültig; der Controller initialisiert lazily.
  operations: z
    .object({
      inventories: z.record(
        z.string(),
        z.object({
          capacity: z.number().nonnegative(),
          items: z.record(resourceId, z.number()),
          reserved: z.record(resourceId, z.number()),
        }),
      ),
      workers: z.record(
        z.string(),
        z.array(
          z.object({
            id: z.string(),
            status: z.enum(['idle', 'walking_to_target', 'working', 'returning', 'waiting', 'blocked']),
            targetNodeId: z.string().optional(),
            carriedAmount: z.number().nonnegative(),
            progress: z.number(),
            x: z.number(),
            y: z.number(),
          }),
        ),
      ),
      active: z.record(
        z.string(),
        z.object({
          buildingId: z.string(),
          type: z.literal('harvest'),
          // 'waiting' = Dauerbetrieb ohne verfügbare Knoten (§R2, Save v23).
          status: z.enum(['active', 'paused', 'waiting']),
          targetNodeIds: z.array(z.string()),
          startedAt: z.number(),
          continuous: z.boolean().optional(),
          workArea: z.object({ kind: z.literal('circle'), radius: z.number().nonnegative() }).optional(),
        }),
      ),
      nodeDeltas: z.record(
        z.string(),
        z.object({
          remaining: z.number().optional(),
          reservedBy: z.string().optional(),
          depletedAt: z.number().optional(),
          regenerationAt: z.number().optional(),
        }),
      ),
      // A5 Transport (Save v18): laufende Lagertransporte. Optional/additiv —
      // v17-Saves ohne das Feld bleiben gültig (Migration ergänzt es lazily).
      transfers: z
        .record(
          z.string(),
          z.object({
            id: z.string(),
            sourceBuildingId: z.string(),
            targetBuildingId: z.string(),
            resource: resourceId,
            amount: z.number().nonnegative(),
            delivered: z.number().nonnegative().optional(),
            onboard: z.number().nonnegative().optional(),
            vehicleId: driveVehicle.optional(),
            status: z.enum(['loading', 'in_transit', 'unloading', 'returning', 'delivered']),
            progress: z.number(),
            startedAt: z.number(),
            travelMs: z.number().nonnegative(),
            distanceTiles: z.number().nonnegative(),
          }),
        )
        .optional(),
      // § Active Simplicity / AS-1 (Save v24): Auto-Warenfluss je Betrieb.
      // Fehlender Eintrag = an (D-039).
      autoTransport: z.record(z.string(), z.boolean()).optional(),
    })
    .optional(),
  // § Infrastruktur 2.0 / I4 (Save v22): persistente Schiffsrouten. Optional/additiv —
  // v21-Saves ohne das Feld bleiben gültig (lineare Migration setzt nur die Version).
  shipping: z
    .object({
      routes: z.record(
        z.string(),
        z.object({
          id: z.string(),
          sourceBuildingId: z.string(),
          originHarborId: z.string(),
          destinationHarborId: z.string(),
          targetBuildingId: z.string(),
          resource: resourceId,
          vehicleId: driveVehicle.optional(),
          paused: z.boolean().optional(),
          phase: z.enum(['loading', 'outbound', 'unloading', 'returning']),
          progress: z.number(),
          onboard: z.number().nonnegative().optional(),
          deliveredTotal: z.number().nonnegative().optional(),
          cycles: z.number().nonnegative().optional(),
          capacity: z.number().nonnegative(),
          travelMs: z.number().nonnegative(),
          waterDistance: z.number().nonnegative(),
          operatingCost: z.number().nonnegative(),
          createdAt: z.number(),
        }),
      ),
    })
    .optional(),
  stats: z.object({
    built: z.record(z.string(), z.number()),
    produced: z.record(resourceId, z.number()),
    mayorActions: z.record(z.string(), z.number()),
    regionsUnlocked: z.number(),
    upgradesCompleted: z.number(),
    upgraded: z.record(z.string(), z.number()),
    tradeEarnings: z.number(),
    activitiesCompleted: z.number(),
  }),
  nextId: z.number().int(),
});
