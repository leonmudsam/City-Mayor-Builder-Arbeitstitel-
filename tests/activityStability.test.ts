import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, setLevel, flattenTerrain, T0 } from './helpers.ts';
import { exportSave } from '../src/game/storage/exportImport.ts';
import { migrateAndValidate } from '../src/game/storage/migrations.ts';
import { SCHEMA_VERSION } from '../src/game/newGame.ts';
import { activitySelectionSeed, pickTargetsSeeded } from '../src/game/simulation/activities.ts';

// § Stadtarbeit-Stabilität 9.1 (D-037): Der Planungsauftrag darf sich während der
// Planung nicht mehr selbst verändern. Ursache des früheren Bugs: die Zielmenge
// wurde bei JEDER Abfrage aus der laufenden, pro Tick weiterlaufenden Sim-RNG neu
// gewürfelt. Fix: ein einmalig eingefrorener, deterministischer Planungssnapshot
// (Save v21). Diese Suite belegt §17 „Stadtarbeit-Stabilität".

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

/** Level-6-Stadt mit fünf Häusern (Lieferziele) und einer Farm (Nahrungsquelle). */
function deliveryCity() {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 6);
  flattenTerrain(controller);
  controller.state.resources = { money: 100_000, wood: 500, stone: 500, food: 1_000, freshwater: 0 };
  for (let dx = 5; dx <= 23; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
  for (const dx of [3, 6, 9, 12, 15]) controller.placeBuilding('house_small', at(dx, 6).x, at(dx, 6).y);
  controller.placeBuilding('farm', at(18, 6).x, at(18, 6).y);
  controller.update(T0 + 90_000, false);
  return bundle;
}

describe('Stadtarbeit-Stabilität 9.1 — eingefrorener Planungssnapshot (§2.3/§2.4)', () => {
  it('friert die Ziele ein; sie springen nicht, während die Sim-RNG weiterläuft', () => {
    const { controller } = deliveryCity();
    expect(controller.selectActivity('food_delivery')).toEqual({ ok: true });
    const frozen = controller.getActivityDeliveryTargets('food_delivery');
    expect(frozen.length).toBeGreaterThanOrEqual(3);
    // Genau die frühere Fehlerursache nachstellen: die RNG läuft (wie pro Tick) weiter.
    for (let i = 0; i < 100; i++) {
      controller.state.rngSeed = (controller.state.rngSeed + 0x6d2b79f5) | 0;
      expect(controller.getActivityDeliveryTargets('food_delivery')).toEqual(frozen);
    }
  });

  it('bleibt über echte Ticks (auch bei „Speed" = viele Ticks) identisch', () => {
    const { controller } = deliveryCity();
    controller.selectActivity('food_delivery');
    const frozen = controller.getActivityDeliveryTargets('food_delivery');
    let now = T0 + 90_000;
    for (let i = 0; i < 30; i++) {
      now += 1_000;
      controller.update(now, false);
      expect(controller.getActivityDeliveryTargets('food_delivery')).toEqual(frozen);
    }
  });

  it('mehrfaches Öffnen/Schließen (erneutes Wählen) verändert die Ziele nicht', () => {
    const { controller } = deliveryCity();
    controller.selectActivity('food_delivery');
    const first = controller.getActivityDeliveryTargets('food_delivery');
    // „Schließen und wieder öffnen": selectActivity ist idempotent.
    expect(controller.selectActivity('food_delivery')).toEqual({ ok: true });
    expect(controller.getActivityDeliveryTargets('food_delivery')).toEqual(first);
  });

  it('die deterministische Vorschau VOR dem Einfrieren gleicht dem eingefrorenen Satz', () => {
    const { controller } = deliveryCity();
    const previewBefore = controller.getActivityDeliveryTargets('food_delivery'); // kein Snapshot → deterministisch
    controller.selectActivity('food_delivery');
    expect(controller.getActivityDeliveryTargets('food_delivery')).toEqual(previewBefore);
  });

  it('ein abgerissenes Ziel wird NICHT still ersetzt, sondern als „stale" gemeldet', () => {
    const { controller } = deliveryCity();
    controller.selectActivity('food_delivery');
    const frozen = controller.getActivityDeliveryTargets('food_delivery');
    expect(controller.getActivitySelectionStatus('food_delivery')).toBe('ok');
    expect(controller.demolishBuilding(frozen[0]!)).toEqual({ ok: true });
    expect(controller.getActivitySelectionStatus('food_delivery')).toBe('stale');
    // Kein automatischer Zieltausch: dieselbe (jetzt teils ungültige) Liste, nicht neu gewürfelt.
    expect(controller.getActivityDeliveryTargets('food_delivery')).toEqual(frozen);
  });

  it('Aktualisieren zieht bewusst neue, gültige Ziele (Status wieder „ok")', () => {
    const { controller } = deliveryCity();
    controller.selectActivity('food_delivery');
    const frozen = controller.getActivityDeliveryTargets('food_delivery');
    controller.demolishBuilding(frozen[0]!);
    expect(controller.refreshActivitySelection('food_delivery')).toEqual({ ok: true });
    const refreshed = controller.getActivityDeliveryTargets('food_delivery');
    expect(refreshed).not.toContain(frozen[0]!); // abgerissenes Ziel ist raus
    expect(refreshed.length).toBeGreaterThanOrEqual(3);
    expect(controller.getActivitySelectionStatus('food_delivery')).toBe('ok');
  });

  it('Missionsstart übernimmt die eingefrorenen Ziele und räumt den Snapshot', () => {
    const { controller } = deliveryCity();
    controller.selectActivity('food_delivery');
    const frozen = controller.getActivityDeliveryTargets('food_delivery');
    expect(controller.startActivity('food_delivery', frozen)).toEqual({ ok: true });
    expect(controller.state.activities.selection).toBeUndefined();
    expect(controller.state.activities.active?.targets.map((target) => target.buildingId)).toEqual(frozen);
  });

  it('überlebt Save/Load — der eingefrorene Snapshot bleibt erhalten', () => {
    const { controller } = deliveryCity();
    controller.selectActivity('food_delivery');
    const frozen = controller.getActivityDeliveryTargets('food_delivery');
    const roundtrip = migrateAndValidate(JSON.parse(exportSave(controller.state)));
    expect(roundtrip.schemaVersion).toBe(SCHEMA_VERSION);
    expect(roundtrip.activities.selection?.targetBuildingIds).toEqual(frozen);
  });

  it('lädt Alt-Saves ohne Snapshot (additive Migration v20→v21)', () => {
    const { controller } = deliveryCity();
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, unknown>;
    const activities = raw.activities as Record<string, unknown>;
    delete activities.selection;
    raw.schemaVersion = 20;
    const migrated = migrateAndValidate(raw);
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrated.activities.selection).toBeUndefined();
  });

  it('der Seed ist reproduzierbar und epoch-abhängig (deterministische Vorschau)', () => {
    const pool = ['x', 'y', 'z', 'w', 'v'];
    const seed0 = activitySelectionSeed('food_delivery', 42, 0);
    const a = pickTargetsSeeded(pool, 3, 5, seed0);
    const b = pickTargetsSeeded(pool, 3, 5, seed0);
    expect(a).toEqual(b); // gleicher Seed → identisch
    expect(activitySelectionSeed('food_delivery', 42, 0)).not.toBe(activitySelectionSeed('food_delivery', 42, 1));
    expect(activitySelectionSeed('food_delivery', 42, 0)).not.toBe(activitySelectionSeed('water_delivery', 42, 0));
  });
});
