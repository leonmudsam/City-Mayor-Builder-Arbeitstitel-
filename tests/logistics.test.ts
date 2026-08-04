import { describe, expect, it } from 'vitest';
import {
  resolveCargoModel,
  planCargoLegs,
  evaluateInfrastructure,
  evaluateCargoRoute,
  type CargoRequirement,
  type CargoPlan,
} from '../src/game/activities/logistics.ts';
import type { RouteAnalysis } from '../src/game/activities/routeAnalysis.ts';
import type { ActivityDef } from '../src/game/config/types.ts';
import { nearTownHall, newController, setLevel, flattenTerrain, T0 } from './helpers.ts';

// Reine, deterministische Ladungslogik (§ Stadtarbeit-Logik 2.0, Phase L2).
// Belegt die Akzeptanzkriterien §26: Kapazität, Nachladen, Teilentladung, reale
// Bedarfe. Keine Save-/Renderer-Berührung.

const req = (targetId: string, amount: number): CargoRequirement => ({ targetId, resource: 'food', amount });

describe('logistics.planCargoLegs — Kapazität & Nachladen (§26)', () => {
  it('lädt nie über die Fahrzeugkapazität (Überladeschutz)', () => {
    const { legs } = planCargoLegs(250, [req('a', 100), req('b', 100), req('c', 100)], 'farm', 'food');
    for (const leg of legs.filter((l) => l.type === 'pickup')) {
      expect(leg.amount).toBeLessThanOrEqual(250);
    }
  });

  it('erzwingt mehrere Beladungen, wenn der Bedarf die Kapazität übersteigt', () => {
    const plan = planCargoLegs(250, [req('a', 100), req('b', 100), req('c', 100)], 'farm', 'food');
    expect(plan.totalRequired).toBe(300);
    expect(plan.loadsRequired).toBe(2);
    // Genau eine Beladung, solange alles in eine Ladung passt.
    const small = planCargoLegs(250, [req('a', 100), req('b', 100)], 'farm', 'food');
    expect(small.loadsRequired).toBe(1);
  });

  it('liefert exakt den Gesamtbedarf aus (Teilentladung reduziert die Ladung korrekt)', () => {
    const { legs, totalRequired } = planCargoLegs(250, [req('a', 100), req('b', 100), req('c', 100)], 'farm', 'food');
    const pickedUp = legs.filter((l) => l.type === 'pickup').reduce((s, l) => s + l.amount, 0);
    const delivered = legs.filter((l) => l.type === 'delivery').reduce((s, l) => s + l.amount, 0);
    expect(pickedUp).toBe(totalRequired);
    expect(delivered).toBe(totalRequired);
  });

  it('jede Delivery-Etappe folgt auf eine Beladung (Pickup vor Delivery)', () => {
    const { legs } = planCargoLegs(250, [req('a', 200), req('b', 200)], 'farm', 'food');
    let loaded = false;
    for (const leg of legs) {
      if (leg.type === 'pickup') loaded = true;
      if (leg.type === 'delivery') expect(loaded).toBe(true);
    }
  });

  it('teilt ein übergroßes Einzelziel über volle Ladungen und markiert es', () => {
    const plan = planCargoLegs(250, [req('big', 600)], 'farm', 'food');
    expect(plan.oversizedTargetIds).toContain('big');
    expect(plan.loadsRequired).toBe(3); // 250 + 250 + 100
    const delivered = plan.legs.filter((l) => l.type === 'delivery').reduce((s, l) => s + l.amount, 0);
    expect(delivered).toBe(600);
  });

  it('ist deterministisch', () => {
    const input: [number, CargoRequirement[], string, 'food'] = [250, [req('a', 130), req('b', 140)], 'farm', 'food'];
    expect(planCargoLegs(...input)).toEqual(planCargoLegs(...input));
  });

  it('bleibt bei fehlendem Bedarf leer (keine Geister-Etappe)', () => {
    const plan = planCargoLegs(250, [], 'farm', 'food');
    expect(plan.legs).toHaveLength(0);
    expect(plan.loadsRequired).toBe(0);
  });
});

describe('logistics.resolveCargoModel', () => {
  const base: ActivityDef = {
    id: 't',
    type: 'delivery',
    nameKey: 'x',
    descriptionKey: 'y',
    unlockLevel: 1,
    sender: 'citizen',
    rewardTiers: [{ minLevel: 1, money: 1, xp: 1 }],
  };

  it('nimmt ein explizites cargoModel', () => {
    const model = resolveCargoModel({ ...base, cargoModel: { resource: 'wood', perTarget: 30 } });
    expect(model).toEqual({ resource: 'wood', perTarget: 30 });
  });

  it('leitet aus einer Ein-Ressourcen-costPerTarget ab', () => {
    expect(resolveCargoModel({ ...base, costPerTarget: { food: 40 } })).toEqual({ resource: 'food', perTarget: 40 });
  });

  it('liefert undefined bei mehrdeutiger oder fehlender Ladung', () => {
    expect(resolveCargoModel({ ...base, costPerTarget: { wood: 30, stone: 15 } })).toBeUndefined();
    expect(resolveCargoModel(base)).toBeUndefined();
  });
});

describe('controller.getActivityCargoPlan — echte food_delivery-Config', () => {
  it('meldet Nachladen, sobald genug Ziele den Van übersteigen', () => {
    const { controller } = newController();
    setLevel(controller, 12);
    // Fünf Ziele × 60 Transportbedarf = 300 > Van-Kapazität 250 ⇒ Nachladen.
    const targets = ['h1', 'h2', 'h3', 'h4', 'h5'];
    const plan = controller.getActivityCargoPlan('food_delivery', targets, 'van');
    expect(plan?.resource).toBe('food');
    expect(plan?.capacity).toBe(250);
    expect(plan?.totalRequired).toBe(300);
    expect(plan?.needsReload).toBe(true);
    expect(plan?.loadsRequired).toBe(2);
  });

  it('braucht mit dem großen LKW keine zweite Beladung', () => {
    const { controller } = newController();
    setLevel(controller, 12);
    const targets = ['h1', 'h2', 'h3', 'h4', 'h5'];
    const plan = controller.getActivityCargoPlan('food_delivery', targets, 'large_truck');
    expect(plan?.capacity).toBe(1_000);
    expect(plan?.needsReload).toBe(false);
    expect(plan?.loadsRequired).toBe(1);
  });
});

// -- L4: Infrastruktur-Bewertung (§19 Leerfahrtanteil) ------------------------

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

/** Level-6-Stadt mit Straße, Häusern und einer Farm (Nahrungsquelle). */
function deliveryCity() {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 12);
  flattenTerrain(controller);
  controller.state.resources = { money: 500_000, wood: 500, stone: 500, food: 4_000, freshwater: 0, planks: 0, cut_stone: 0 };
  for (let dx = 5; dx <= 23; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
  for (const dx of [3, 6, 9, 12, 15]) controller.placeBuilding('house_small', at(dx, 6).x, at(dx, 6).y);
  controller.placeBuilding('farm', at(18, 6).x, at(18, 6).y);
  controller.update(T0 + 90_000, false);
  return bundle;
}

/** Minimale RouteAnalysis für reine Bewertungstests (keine Straßendaten nötig). */
function fakeRoute(distanceTiles: number): RouteAnalysis {
  return {
    orderedTargetIds: [],
    segments: [],
    distanceTiles,
    estimatedDurationMs: Math.round(distanceTiles * 780),
    intersections: 0,
    roadCoverage: 1,
    congestionRisk: 'low',
    efficiencyScore: 100,
    expectedMedal: 'gold',
    rewardMultiplier: 1,
  };
}

function cargoPlan(capacity: number, reqs: CargoRequirement[]): CargoPlan {
  const { legs, loadsRequired, totalRequired, oversizedTargetIds } = planCargoLegs(capacity, reqs, 'src', 'food');
  return { resource: 'food', capacity, totalRequired, loadsRequired, requirements: [...reqs], legs, oversizedTargetIds, needsReload: loadsRequired > 1 };
}

describe('logistics.evaluateInfrastructure — Leerfahrtanteil (§19)', () => {
  const targets = [
    { id: 'a', x: 10, y: 0 },
    { id: 'b', x: 20, y: 0 },
    { id: 'c', x: 30, y: 0 },
  ];
  const source = { x: 0, y: 0 };

  it('meldet keine Leerfahrt, wenn alles in eine Ladung passt', () => {
    const evalResult = evaluateInfrastructure({
      source,
      targets,
      route: fakeRoute(60),
      cargo: cargoPlan(1_000, [req('a', 100), req('b', 100), req('c', 100)]),
    });
    expect(evalResult.loadsRequired).toBe(1);
    expect(evalResult.reloadTrips).toBe(0);
    expect(evalResult.emptyDistanceTiles).toBe(0);
    expect(evalResult.emptyTravelRatio).toBe(0);
  });

  it('rechnet die Rückfahrt zur Quelle als Leerfahrt (Nachladen)', () => {
    // Kapazität 200 ⇒ Grenze zwischen b und c: leer zurück b→Quelle (20).
    const evalResult = evaluateInfrastructure({
      source,
      targets,
      route: fakeRoute(60),
      cargo: cargoPlan(200, [req('a', 100), req('b', 100), req('c', 100)]),
    });
    expect(evalResult.loadsRequired).toBe(2);
    expect(evalResult.reloadTrips).toBe(1);
    expect(evalResult.emptyDistanceTiles).toBe(20);
    // total = route 60 + Wiederanfahrt 30 + leer 20 = 110.
    expect(evalResult.emptyTravelRatio).toBeCloseTo(20 / 110, 2);
  });

  it('addiert Lade-/Entladezeiten in die Gesamtdauer (Standardwerte)', () => {
    const evalResult = evaluateInfrastructure({
      source,
      targets,
      route: fakeRoute(60),
      cargo: cargoPlan(200, [req('a', 100), req('b', 100), req('c', 100)]),
    });
    // 2 Ladungen × 8 s + 3 Ziele × 5 s = 31 s Handling.
    expect(evalResult.handlingDurationMs).toBe(31_000);
    expect(evalResult.estimatedDurationMs).toBe(evalResult.drivingDurationMs + evalResult.handlingDurationMs);
  });

  it('ist deterministisch', () => {
    const input = { source, targets, route: fakeRoute(60), cargo: cargoPlan(200, [req('a', 100), req('b', 100), req('c', 100)]) };
    expect(evaluateInfrastructure(input)).toEqual(evaluateInfrastructure(input));
  });
});

describe('logistics.evaluateCargoRoute — konkrete Fahrt auf gezeichnetem Pfad', () => {
  it('liefert ohne Nachladen aus, wenn eine Ladung reicht', () => {
    const plan = cargoPlan(200, [req('a', 100), req('b', 100)]);
    const ev = evaluateCargoRoute(
      plan,
      { buildingId: 'farm', x: 0, y: 0 },
      [
        { buildingId: 'a', x: 2, y: 0 },
        { buildingId: 'b', x: 4, y: 0 },
      ],
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
      ],
    );
    expect(ev.deliveredAmount).toBe(200);
    expect(ev.cargoValid).toBe(true);
    expect(ev.emptyTravelTiles).toBe(0);
    expect(ev.plannedResupplies).toBe(0);
  });

  it('erkennt eine echte Nachladung an der Quelle und misst die Leerfahrt', () => {
    const plan = cargoPlan(100, [req('a', 100), req('b', 100)]);
    const ev = evaluateCargoRoute(
      plan,
      { buildingId: 'farm', x: 0, y: 0 },
      [
        { buildingId: 'a', x: 2, y: 0 },
        { buildingId: 'b', x: 4, y: 0 },
      ],
      [
        { x: 0, y: 0 }, // laden
        { x: 1, y: 0 },
        { x: 2, y: 0 }, // a liefern → leer
        { x: 1, y: 0 }, // leer zurück
        { x: 0, y: 0 }, // Quelle: nachladen
        { x: 1, y: 0 },
        { x: 2, y: 0 }, // a erneut berührt (übersprungen)
        { x: 3, y: 0 },
        { x: 4, y: 0 }, // b liefern
      ],
    );
    expect(ev.plannedResupplies).toBe(1);
    expect(ev.requiredResupplies).toBe(1);
    expect(ev.deliveredAmount).toBe(200);
    expect(ev.emptyTravelTiles).toBe(2);
    expect(ev.cargoValid).toBe(true);
  });

  // § Overhaul 8.0 / §3.1 — Regression zum gemeldeten „4/5 Stopps"-Fehler.
  it('beliefert ein leer passiertes Ziel nach dem Nachfüllen beim zweiten Kontakt', () => {
    const plan = cargoPlan(100, [req('a', 100), req('b', 100)]);
    const ev = evaluateCargoRoute(
      plan,
      { buildingId: 'farm', x: 0, y: 0 },
      [
        { buildingId: 'a', x: 2, y: 0 },
        { buildingId: 'b', x: 4, y: 0 },
      ],
      [
        { x: 0, y: 0 }, // laden (100)
        { x: 1, y: 0 },
        { x: 2, y: 0 }, // a liefern → leer
        { x: 3, y: 0 },
        { x: 4, y: 0 }, // b LEER passiert — früher dauerhaft „ungültig"
        { x: 3, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 0 }, // Quelle: nachladen
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 }, // b jetzt wirklich liefern
      ],
    );
    expect(ev.orderedTargetIds).toEqual(['a', 'b']);
    expect(ev.deliveredAmount).toBe(200);
    expect(ev.remainingAmount).toBe(0);
    expect(ev.invalidTargetIds).toEqual([]);
    expect(ev.cargoValid).toBe(true);
    // Der erfolglose Kontakt bleibt als Hinweis sichtbar, entwertet die Route aber nicht.
    expect(ev.stops.filter((stop) => stop.status === 'skipped')).toHaveLength(1);
  });

  // § R5: Ein Nachfüllstopp ist Pflicht oder Kür — das entscheidet, ob der Spieler ihn
  // weglassen darf. Der Marker entsteht per Vorausschau auf dem echten Weg.
  it('markiert einen unverzichtbaren Nachfüllstopp als Pflicht (§R5)', () => {
    // Kapazität 100, zwei Ziele à 100: ohne das Nachladen bleibt „b" leer.
    const plan = cargoPlan(100, [req('a', 100), req('b', 100)]);
    const ev = evaluateCargoRoute(
      plan,
      { buildingId: 'farm', x: 0, y: 0 },
      [
        { buildingId: 'a', x: 2, y: 0 },
        { buildingId: 'b', x: 4, y: 0 },
      ],
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }, // a beliefert → Ladung 0
        { x: 1, y: 0 },
        { x: 0, y: 0 }, // nachladen (zwingend)
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 }, // b
      ],
    );
    const resupply = ev.stops.filter((stop) => stop.type === 'resupply');
    expect(resupply).toHaveLength(1);
    expect(resupply[0]!.required).toBe(true);
    expect(resupply[0]!.requiredForBuildingId).toBe('b');
  });

  it('markiert ein reines Auffüllen als optional (§R5)', () => {
    // Kapazität 100, Gesamtbedarf 60 — die Erstladung reicht bereits für alles.
    const plan = cargoPlan(100, [req('a', 30), req('b', 30)]);
    const ev = evaluateCargoRoute(
      plan,
      { buildingId: 'farm', x: 0, y: 0 },
      [
        { buildingId: 'a', x: 2, y: 0 },
        { buildingId: 'b', x: 4, y: 0 },
      ],
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }, // a (Ladung 30 weg, 30 übrig)
        { x: 1, y: 0 },
        { x: 0, y: 0 }, // optionales Auffüllen — 30 reichen für b bereits
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 }, // b
      ],
    );
    const resupply = ev.stops.filter((stop) => stop.type === 'resupply');
    for (const stop of resupply) {
      expect(stop.required).toBe(false);
      expect(stop.requiredForBuildingId).toBeUndefined();
    }
  });

  it('zählt Lieferziele und Nachfüllstopps getrennt (§3.2)', () => {
    const plan = cargoPlan(100, [req('a', 100), req('b', 100)]);
    const ev = evaluateCargoRoute(
      plan,
      { buildingId: 'farm', x: 0, y: 0 },
      [
        { buildingId: 'a', x: 2, y: 0 },
        { buildingId: 'b', x: 4, y: 0 },
      ],
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }, // a
        { x: 1, y: 0 },
        { x: 0, y: 0 }, // nachladen
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 }, // b
      ],
    );
    expect(ev.progress).toEqual({
      deliveryTargetsCompleted: 2,
      deliveryTargetsTotal: 2,
      resupplyStopsCompleted: 1,
      resupplyStopsTotal: 1,
      returnRequired: false,
      returnCompleted: false,
    });
  });

  it('meldet ein wirklich unbeliefertes Ziel weiterhin als ungültig', () => {
    const plan = cargoPlan(100, [req('a', 100), req('b', 100)]);
    const ev = evaluateCargoRoute(
      plan,
      { buildingId: 'farm', x: 0, y: 0 },
      [
        { buildingId: 'a', x: 2, y: 0 },
        { buildingId: 'b', x: 4, y: 0 },
      ],
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 }, // a liefern → leer
        { x: 3, y: 0 },
        { x: 4, y: 0 }, // b leer passiert, danach endet die Route
      ],
    );
    expect(ev.invalidTargetIds).toEqual(['b']);
    expect(ev.cargoValid).toBe(false);
    expect(ev.progress.deliveryTargetsCompleted).toBe(1);
    expect(ev.progress.deliveryTargetsTotal).toBe(2);
  });
});

/** Echte Gebäude-Ids der platzierten Häuser (sortiert, deterministisch). */
function houseIds(controller: ReturnType<typeof deliveryCity>['controller']): string[] {
  return Object.values(controller.state.buildings)
    .filter((b) => b.defId === 'house_small')
    .map((b) => b.id)
    .sort();
}

describe('controller.getActivityInfrastructure — echte Stadt', () => {
  it('bündelt Quellen, Ziele und Fahrzeuge im RNG-neutralen Planungskontext', () => {
    const { controller } = deliveryCity();
    const context = controller.getActivityPlanningContext('food_delivery');
    expect(context).toBeDefined();
    expect(context?.sourceBuildingIds.length).toBeGreaterThan(0);
    expect(context?.targetBuildingIds.length).toBeGreaterThanOrEqual(3);
    expect(context?.vehicles.map((vehicle) => vehicle.id)).toEqual(
      expect.arrayContaining(['van', 'refrigerated_truck', 'medium_truck', 'large_truck']),
    );
    expect(controller.getActivitySupplySources('food_delivery')).toEqual(context?.sourceBuildingIds);
    expect(controller.getActivityDeliveryTargets('food_delivery')).toEqual(context?.targetBuildingIds);
  });

  it('liefert eine ehrliche unvollständige Vorschau ohne automatische Wegergänzung', () => {
    const { controller } = deliveryCity();
    const context = controller.getActivityPlanningContext('food_delivery')!;
    const preview = controller.getActivityRoutePreview('food_delivery', context.targetBuildingIds, [], 'van');
    expect(preview).toBeDefined();
    expect(preview?.orderedTargetIds).toEqual([]);
    expect(preview?.analysis).toBeUndefined();
    expect(preview?.complete).toBe(false);
  });

  it('weist mit dem Van mehr Nachladen/Leerfahrt aus als mit dem großen LKW', () => {
    const { controller } = deliveryCity();
    const targets = houseIds(controller);
    const van = controller.getActivityInfrastructure('food_delivery', targets, 'van')!;
    const truck = controller.getActivityInfrastructure('food_delivery', targets, 'large_truck')!;
    // Van (250) muss nachladen; der große LKW (1000) fasst alles.
    expect(van.reloadTrips).toBeGreaterThanOrEqual(1);
    expect(van.emptyTravelRatio).toBeGreaterThan(0);
    expect(truck.reloadTrips).toBeLessThan(van.reloadTrips);
    expect(truck.emptyTravelRatio).toBeLessThanOrEqual(van.emptyTravelRatio);
    // Bewertung stimmt mit der reinen Ladungsplanung überein.
    const truckPlan = controller.getActivityCargoPlan('food_delivery', targets, 'large_truck')!;
    expect(truck.loadsRequired).toBe(truckPlan.loadsRequired);
  });

  it('warnt bei verderblicher Ladung ohne Kühlung, nicht mit Kühltransporter', () => {
    const { controller } = deliveryCity();
    const targets = houseIds(controller).slice(0, 3);
    const warm = controller.getActivityInfrastructure('food_delivery', targets, 'van')!;
    expect(warm.spoilageRisk).toBeGreaterThan(0);
    expect(warm.warnings.some((w) => w.code === 'perishable_no_cooling')).toBe(true);

    const cooled = controller.getActivityInfrastructure('food_delivery', targets, 'refrigerated_truck')!;
    expect(cooled.spoilageRisk).toBe(0);
    expect(cooled.warnings.some((w) => w.code === 'perishable_no_cooling')).toBe(false);
  });

  it('liefert die Hinweise auch über den schlanken Warnungs-Helfer', () => {
    const { controller } = deliveryCity();
    const warnings = controller.getActivityInfrastructureWarnings('food_delivery', houseIds(controller).slice(0, 3), 'van');
    expect(Array.isArray(warnings)).toBe(true);
  });

  it('verdrahtet die gezeichnete Cargo-Route und liefert ein Auswertungsobjekt', () => {
    const { controller } = deliveryCity();
    const result = controller.getActivityCargoRoute('food_delivery', houseIds(controller).slice(0, 3), []);
    // Read-Helper ist verdrahtet und liefert die erwartete Auswertungsform.
    expect(result).toBeDefined();
    expect(Array.isArray(result?.stops)).toBe(true);
    expect(Array.isArray(result?.orderedTargetIds)).toBe(true);
    expect(result?.deliveredAmount).toBe(0);
  });
});
