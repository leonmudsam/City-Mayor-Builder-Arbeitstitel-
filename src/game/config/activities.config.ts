import type { ActivitiesConfig } from './types.ts';

/**
 * Stadtarbeit (v0.21, § aktives Stadtmanagement): short, repeatable, hands-on
 * mayor tasks that bridge build timers with active play. All values live here —
 * reward bands follow the progression spec: thousands early, tens of thousands
 * mid-game (L6–9), hundreds of thousands from L10, with rare ~1M trade mega
 * contracts. Rewards only ever pay out through controller commands, so none of
 * this can accrue offline.
 */
export const activitiesConfig: ActivitiesConfig = {
  activities: [
    // -- Deliveries: an ordered route run — click the numbered stops in turn.
    //    No cooldown (§2): a delivery is always available while food sources and
    //    homes exist. Speed + completion decide the Bronze/Silber/Gold grade.
    {
      id: 'food_delivery',
      type: 'delivery',
      category: 'supply',
      difficulty: 'easy',
      nameKey: 'activity.food_delivery',
      descriptionKey: 'activity.food_delivery.desc',
      unlockLevel: 4, // as soon as farms exist food can be hand-distributed (§3)
      sender: 'citizen',
      requiresAnyBuilding: ['farm', 'market', 'supermarket'],
      drive: true, // § A6: Lieferwagen selbst fahren (WASD, Verfolgerkamera)
      vehicle: 'van',
      targetCount: { min: 3, max: 5 },
      timeLimitSec: 75,
      speedBonusFactor: 1.25,
      costPerTarget: { food: 40 },
      rewardTiers: [
        { minLevel: 1, money: 4_000, xp: 10, buff: { kind: 'foodDistribution', amount: 1, durationSec: 10 * 60 } },
        { minLevel: 6, money: 16_000, xp: 22, buff: { kind: 'foodDistribution', amount: 1, durationSec: 10 * 60 } },
        { minLevel: 8, money: 42_000, xp: 38, buff: { kind: 'foodDistribution', amount: 1, durationSec: 12 * 60 } },
        { minLevel: 10, money: 130_000, xp: 60, buff: { kind: 'foodDistribution', amount: 1, durationSec: 15 * 60 } },
        { minLevel: 12, money: 300_000, xp: 90, buff: { kind: 'foodDistribution', amount: 1, durationSec: 15 * 60 } },
      ],
    },
    {
      id: 'material_delivery',
      type: 'delivery',
      category: 'supply',
      difficulty: 'medium',
      nameKey: 'activity.material_delivery',
      descriptionKey: 'activity.material_delivery.desc',
      unlockLevel: 7,
      sender: 'buildingDept',
      requiresAnyBuilding: ['sawmill', 'quarry', 'warehouse', 'depot'],
      drive: true, // § A6: Material selbst zur Baustelle fahren (Pritschenwagen)
      vehicle: 'flatbed',
      targetCount: { min: 3, max: 4 },
      timeLimitSec: 60,
      speedBonusFactor: 1.25,
      costPerTarget: { wood: 30, stone: 15 },
      rewardTiers: [
        { minLevel: 7, money: 26_000, xp: 28 },
        { minLevel: 9, money: 60_000, xp: 45 },
        { minLevel: 11, money: 180_000, xp: 70 },
        { minLevel: 13, money: 380_000, xp: 100 },
      ],
    },
    // -- Feuerwehr (§ A6): mit dem Löschfahrzeug zu mehreren Bränden fahren.
    //    Ziele = bewohnte/gewerbliche Gebäude; kein Materialverbrauch, dafür
    //    knappe Zeit. Setzt eine Feuerwache voraus.
    {
      id: 'fire_response',
      type: 'delivery',
      category: 'safety',
      difficulty: 'hard',
      nameKey: 'activity.fire_response',
      descriptionKey: 'activity.fire_response.desc',
      unlockLevel: 9,
      sender: 'fire',
      requiresAnyBuilding: ['fire_station'],
      drive: true,
      vehicle: 'fire_truck',
      targetCategories: ['residential', 'economy', 'leisure'],
      targetCount: { min: 3, max: 4 },
      timeLimitSec: 70,
      speedBonusFactor: 1.3,
      rewardTiers: [
        { minLevel: 9, money: 34_000, xp: 40, buff: { kind: 'happiness', amount: 3, durationSec: 10 * 60 } },
        { minLevel: 11, money: 90_000, xp: 60, buff: { kind: 'happiness', amount: 4, durationSec: 12 * 60 } },
        { minLevel: 14, money: 220_000, xp: 90, buff: { kind: 'happiness', amount: 5, durationSec: 15 * 60 } },
        { minLevel: 16, money: 420_000, xp: 130, buff: { kind: 'happiness', amount: 6, durationSec: 15 * 60 } },
      ],
    },
    // -- Holztransport (§ A6): Stämme vom Sägewerk ins Lager fahren. Ziele sind
    //    ausschließlich Lagergebäude (Def-Id-Auswahl), keine Häuser.
    {
      id: 'log_transport',
      type: 'delivery',
      category: 'logistics',
      difficulty: 'medium',
      nameKey: 'activity.log_transport',
      descriptionKey: 'activity.log_transport.desc',
      unlockLevel: 8,
      sender: 'buildingDept',
      requiresAnyBuilding: ['sawmill'],
      drive: true,
      vehicle: 'logging_truck',
      targetDefIds: ['warehouse', 'depot'],
      targetCount: { min: 2, max: 3 },
      timeLimitSec: 80,
      speedBonusFactor: 1.25,
      costPerTarget: { wood: 40 },
      rewardTiers: [
        { minLevel: 8, money: 30_000, xp: 34 },
        { minLevel: 10, money: 80_000, xp: 55 },
        { minLevel: 13, money: 210_000, xp: 85 },
        { minLevel: 15, money: 420_000, xp: 120 },
      ],
    },
    // -- Polizei (§ A6): Streifenfahrt zu mehreren Einsatzorten quer durch die
    //    Stadt. Ziele = beliebige größere Gebäude; belohnt Zufriedenheit.
    {
      id: 'police_patrol',
      type: 'delivery',
      category: 'safety',
      difficulty: 'medium',
      nameKey: 'activity.police_patrol',
      descriptionKey: 'activity.police_patrol.desc',
      unlockLevel: 11,
      sender: 'mayor',
      requiresAnyBuilding: ['police_station'],
      drive: true,
      vehicle: 'police_car',
      targetCategories: ['residential', 'economy', 'government', 'leisure'],
      targetCount: { min: 4, max: 5 },
      timeLimitSec: 90,
      speedBonusFactor: 1.3,
      rewardTiers: [
        { minLevel: 11, money: 70_000, xp: 55, buff: { kind: 'happiness', amount: 3, durationSec: 12 * 60 } },
        { minLevel: 14, money: 190_000, xp: 85, buff: { kind: 'happiness', amount: 4, durationSec: 15 * 60 } },
        { minLevel: 17, money: 420_000, xp: 130, buff: { kind: 'happiness', amount: 5, durationSec: 15 * 60 } },
      ],
    },
    // -- Inspection: visit flagged buildings, learn what's wrong, get paid.
    //    No cooldown — a new inspection can be run whenever the city has issues.
    {
      id: 'city_inspection',
      type: 'inspection',
      category: 'inspection',
      difficulty: 'medium',
      nameKey: 'activity.city_inspection',
      descriptionKey: 'activity.city_inspection.desc',
      unlockLevel: 6,
      sender: 'mayor',
      targetCount: { min: 3, max: 5 },
      rewardTiers: [
        { minLevel: 6, money: 12_000, xp: 30 },
        { minLevel: 8, money: 30_000, xp: 50 },
        { minLevel: 10, money: 90_000, xp: 75 },
        { minLevel: 12, money: 200_000, xp: 110 },
      ],
    },
    // -- Mayor decisions (§12): 3–4 real options with multi-effect trade-offs.
    //    These keep a modest cooldown so a single policy can't be spam-farmed.
    {
      id: 'decision_farm_subsidy',
      type: 'decision',
      category: 'politics',
      difficulty: 'medium',
      nameKey: 'activity.decision_farm_subsidy',
      descriptionKey: 'activity.decision_farm_subsidy.desc',
      unlockLevel: 6,
      cooldownSec: 15 * 60,
      sender: 'merchant',
      options: [
        {
          id: 'big',
          cost: { money: 40_000 },
          buffs: [
            { kind: 'production', amount: 1.3, durationSec: 10 * 60 },
            { kind: 'happiness', amount: 5, durationSec: 5 * 60 },
          ],
          reward: { xp: 30 },
        },
        { id: 'small', cost: { money: 12_000 }, buffs: [{ kind: 'production', amount: 1.1, durationSec: 10 * 60 }], reward: { xp: 15 } },
        {
          id: 'contract',
          requiresAnyBuilding: ['trading_post'],
          cost: { money: 15_000 },
          buffs: [{ kind: 'production', amount: 1.2, durationSec: 20 * 60 }],
          reward: { xp: 25 },
        },
        { id: 'decline', buffs: [{ kind: 'happiness', amount: -3, durationSec: 8 * 60 }], reward: { money: 5_000, xp: 8 } },
      ],
      rewardTiers: [
        { minLevel: 1, money: 0, xp: 5 },
        { minLevel: 10, money: 0, xp: 15 },
      ],
    },
    {
      id: 'decision_street_party',
      type: 'decision',
      category: 'event',
      difficulty: 'easy',
      nameKey: 'activity.decision_street_party',
      descriptionKey: 'activity.decision_street_party.desc',
      unlockLevel: 7,
      cooldownSec: 15 * 60,
      sender: 'citizen',
      options: [
        { id: 'big', cost: { money: 30_000 }, buffs: [{ kind: 'happiness', amount: 8, durationSec: 20 * 60 }], reward: { xp: 30 } },
        { id: 'small', cost: { money: 10_000 }, buffs: [{ kind: 'happiness', amount: 4, durationSec: 12 * 60 }], reward: { xp: 15 } },
        {
          id: 'sponsor',
          requiresAnyBuilding: ['market', 'supermarket', 'shop_small'],
          cost: { money: 18_000 },
          buffs: [{ kind: 'happiness', amount: 6, durationSec: 15 * 60 }],
          reward: { money: 6_000, xp: 22 },
        },
        { id: 'skip', reward: { money: 8_000, xp: 8 } },
      ],
      rewardTiers: [
        { minLevel: 1, money: 0, xp: 5 },
        { minLevel: 10, money: 0, xp: 15 },
      ],
    },
    {
      id: 'decision_overtime',
      type: 'decision',
      category: 'politics',
      difficulty: 'hard',
      nameKey: 'activity.decision_overtime',
      descriptionKey: 'activity.decision_overtime.desc',
      unlockLevel: 8,
      cooldownSec: 15 * 60,
      sender: 'buildingDept',
      options: [
        { id: 'pay', cost: { money: 60_000 }, buffs: [{ kind: 'production', amount: 1.2, durationSec: 30 * 60 }], reward: { xp: 40 } },
        { id: 'partial', cost: { money: 25_000 }, buffs: [{ kind: 'production', amount: 1.1, durationSec: 20 * 60 }], reward: { xp: 22 } },
        { id: 'refuse', buffs: [{ kind: 'happiness', amount: -6, durationSec: 15 * 60 }], reward: { money: 15_000, xp: 10 } },
      ],
      rewardTiers: [
        { minLevel: 1, money: 0, xp: 5 },
        { minLevel: 11, money: 0, xp: 18 },
      ],
    },
  ],

  // -- Trade contracts (§ Handelsaufträge): rotating offers at the trading ----
  // post. Fulfilling consumes the demanded goods and pays out well above the
  // plain sell value — active trading beats dumping stock. Weights steer how
  // often a template shows; the mega contracts are deliberately rare.
  tradeContracts: [
    { id: 'wood_small', minLevel: 5, demands: { wood: 150 }, rewardMoney: 2_600, rewardXp: 8, weight: 3 },
    { id: 'stone_small', minLevel: 6, demands: { stone: 120 }, rewardMoney: 4_200, rewardXp: 10, weight: 3 },
    { id: 'food_small', minLevel: 6, demands: { food: 400 }, rewardMoney: 3_400, rewardXp: 8, weight: 3 },
    { id: 'wood_medium', minLevel: 8, demands: { wood: 600 }, rewardMoney: 11_000, rewardXp: 20, weight: 2 },
    { id: 'stone_medium', minLevel: 8, demands: { stone: 500 }, rewardMoney: 17_000, rewardXp: 22, weight: 2 },
    { id: 'mixed_medium', minLevel: 9, demands: { wood: 400, stone: 300, food: 600 }, rewardMoney: 21_000, rewardXp: 26, weight: 2 },
    { id: 'food_large', minLevel: 10, demands: { food: 2_500 }, rewardMoney: 24_000, rewardXp: 30 },
    { id: 'wood_large', minLevel: 10, demands: { wood: 1_500 }, rewardMoney: 28_000, rewardXp: 30 },
    { id: 'stone_large', minLevel: 11, demands: { stone: 1_200 }, rewardMoney: 42_000, rewardXp: 34 },
    { id: 'mixed_large', minLevel: 11, demands: { wood: 1_200, stone: 900, food: 1_500 }, rewardMoney: 60_000, rewardXp: 45 },
    { id: 'mega_export', minLevel: 10, demands: { wood: 2_500, stone: 1_800 }, rewardMoney: 250_000, rewardXp: 90, rewardGold: 5, weight: 0.5 },
    { id: 'mega_metropolis', minLevel: 12, demands: { wood: 4_000, stone: 3_000, food: 4_000 }, rewardMoney: 1_000_000, rewardXp: 200, rewardGold: 15, weight: 0.25 },
  ],
  tradeRotationSec: 30 * 60,
  tradeOffersPerRotation: 3,
};
