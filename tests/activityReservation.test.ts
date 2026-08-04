import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, setLevel, flattenTerrain, T0 } from './helpers.ts';
import { migrateAndValidate, WorldRebuildSaveError } from '../src/game/storage/migrations.ts';
import { exportSave } from '../src/game/storage/exportImport.ts';
import { SCHEMA_VERSION } from '../src/game/newGame.ts';

// Stadtarbeit-Logik 2.0 — Phase L3: Ladung wird upfront an der Quelle reserviert,
// physisch aus dem Pool entnommen, bei Auslieferung aus der Reserve gezogen und
// bei Abbruch zurückgegeben (§4/§5/§18/§26). Save-Schema v13, lineare Migration.

const at = (dx: number, dy: number) => nearTownHall(dx, dy);
const FOOD_PER_TARGET = 40; // food_delivery.costPerTarget

/** Level-6-Stadt mit Häusern UND einer Farm (Nahrungsquelle für Lieferungen). */
function deliveryCity() {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 6);
  flattenTerrain(controller);
  controller.state.resources = { money: 100_000, wood: 500, stone: 500, food: 1_000, freshwater: 0, planks: 0, cut_stone: 0 };
  for (let dx = 5; dx <= 23; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
  for (const dx of [3, 6, 9, 12, 15]) controller.placeBuilding('house_small', at(dx, 6).x, at(dx, 6).y);
  controller.placeBuilding('farm', at(18, 6).x, at(18, 6).y);
  controller.update(T0 + 90_000, false);
  return bundle;
}

describe('Stadtarbeit-Logik 2.0 L3 — Reservierung an der Quelle', () => {
  it('entnimmt die volle Ladung upfront aus dem Pool und hält sie als Reserve', () => {
    const { controller } = deliveryCity();
    const food0 = controller.state.resources.food;
    expect(controller.startActivity('food_delivery')).toEqual({ ok: true });
    const active = controller.state.activities.active!;
    const n = active.targets.length;
    expect(active.reserved?.food).toBe(FOOD_PER_TARGET * n);
    expect(controller.state.resources.food).toBe(food0 - FOOD_PER_TARGET * n);
  });

  it('zieht jede Auslieferung aus der Reserve, nicht aus dem Pool', () => {
    const { controller } = deliveryCity();
    controller.startActivity('food_delivery');
    const active = controller.state.activities.active!;
    const poolAfterStart = controller.state.resources.food;
    const reservedAfterStart = active.reserved!.food!;
    const first = controller.getActivityTargets()[0]!;
    expect(controller.progressActivity(first.buildingId)).toEqual({ ok: true });
    // Pool unverändert, Reserve um genau eine Lieferung gesunken.
    expect(controller.state.resources.food).toBe(poolAfterStart);
    expect(controller.state.activities.active!.reserved!.food).toBe(reservedAfterStart - FOOD_PER_TARGET);
  });

  it('bleibt netto identisch zum Alt-Verhalten (Gesamtverbrauch = costPerTarget × Ziele)', () => {
    const { controller } = deliveryCity();
    const food0 = controller.state.resources.food;
    controller.startActivity('food_delivery');
    const n = controller.state.activities.active!.targets.length;
    for (const tg of controller.getActivityTargets()) controller.progressActivity(tg.buildingId);
    expect(controller.state.activities.active).toBeUndefined();
    expect(controller.state.resources.food).toBe(food0 - FOOD_PER_TARGET * n);
  });

  it('gibt bei Abbruch die noch nicht ausgelieferte Reserve zurück (§5)', () => {
    const { controller } = deliveryCity();
    // Im Lagerlimit bleiben: die Rückgabe (grantResources) deckelt auf die
    // Lagerkapazität — im echten Spiel liegt der Pool ohnehin nie darüber.
    controller.state.resources.food = controller.derived.storageCaps.food;
    const food0 = controller.state.resources.food;
    controller.startActivity('food_delivery');
    const first = controller.getActivityTargets()[0]!;
    controller.progressActivity(first.buildingId); // genau eine Lieferung verbraucht
    expect(controller.abandonActivity()).toEqual({ ok: true });
    // Nur die eine ausgelieferte Ladung ist weg; der Rest ist zurück im Pool.
    expect(controller.state.resources.food).toBe(food0 - FOOD_PER_TARGET);
    expect(controller.state.activities.active).toBeUndefined();
  });

  it('startet nicht, wenn der Vorrat die reservierte Ladung nicht deckt (§18)', () => {
    const { controller } = deliveryCity();
    controller.state.resources.food = FOOD_PER_TARGET; // reicht höchstens für 1 Ziel, Auftrag braucht ≥3
    expect(controller.startActivity('food_delivery')).toEqual({ ok: false, error: 'insufficient' });
    expect(controller.state.activities.active).toBeUndefined();
    expect(controller.state.resources.food).toBe(FOOD_PER_TARGET); // nichts entnommen
  });

  it('liefert eine Ausführungs-Momentaufnahme inkl. Reserve und Beladungsplan', () => {
    const { controller } = deliveryCity();
    controller.startActivity('food_delivery');
    const snap = controller.getActivityExecutionSnapshot()!;
    expect(snap.defId).toBe('food_delivery');
    expect(snap.targetsDone).toBe(0);
    expect(snap.targetsTotal).toBeGreaterThanOrEqual(3);
    expect(snap.reserved?.food).toBeGreaterThan(0);
    expect(snap.cargo?.resource).toBe('food');
  });
});

describe('Stadtarbeit-Logik 2.0 L3 — Save v13', () => {
  it('persistiert die Reserve über einen Save-Roundtrip', () => {
    const { controller } = deliveryCity();
    controller.startActivity('food_delivery');
    const reserved = controller.state.activities.active!.reserved!.food!;
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, unknown>;
    const loaded = migrateAndValidate(raw);
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
    expect(loaded.activities.active?.reserved?.food).toBe(reserved);
  });

  it('weist einen v12-Weltstand dem kontrollierten Welt-Backup zu', () => {
    const { controller } = deliveryCity();
    controller.startActivity('food_delivery');
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, unknown>;
    // Alten v12-Stand nachbilden: Version zurück, Reserve-Feld entfernen.
    raw.schemaVersion = 12;
    const activities = raw.activities as { active?: Record<string, unknown> };
    delete activities.active!.reserved;
    expect(() => migrateAndValidate(raw)).toThrow(WorldRebuildSaveError);
    // Die Mission bleibt gültig — es wird keine Reserve erfunden.
  });
});
