import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, setLevel, T0 } from './helpers.ts';
import {
  buildTransportOrder,
  DEFAULT_TRANSPORT_MODE,
  modeRewardFactor,
  STOP_ACTION_BY_CARGO_TYPE,
  TRANSPORT_MODES,
  TRANSPORT_PRIORITIES,
  TRANSPORT_STOP_ACTIONS,
  type TransportMode,
} from '../src/game/activities/transportOrder.ts';
import { activitiesConfig } from '../src/game/config/activities.config.ts';
import { SCHEMA_VERSION } from '../src/game/newGame.ts';
import { migrateAndValidate } from '../src/game/storage/migrations.ts';
import { exportSave } from '../src/game/storage/exportImport.ts';

// § Stadtarbeit-Overhaul, Phase P2 (D-050) — EIN Auftragsmodell, und die
// Ausführungsart wird zur WAHL.
//
// Der Kern der Entscheidung: D-039 (Active Simplicity) bleibt gültig, weil nicht
// die Ausführung zur Pflicht wird, sondern die Wahl zwischen zwei Ausführungen
// beim Spieler liegt. Diese Suite prüft deshalb dreierlei:
//   1. der Auftrag ist eine PROJEKTION der bestehenden Logistik (keine zweite
//      Mengen-/Wegrechnung),
//   2. genau ein Modus ist wirksam — und der gewählte ist der bezahlte,
//   3. Alt-Saves verhalten sich unverändert (`auto`).

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

/** Level-6-Stadt mit Straße, Häusern und Farm — die Standard-Lieferstadt. */
function deliveryCity() {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 6);
  flattenTerrain(controller);
  controller.state.resources = { money: 100_000, wood: 500, stone: 500, food: 5_000, freshwater: 0 };
  for (let dx = 5; dx <= 23; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
  for (const dx of [3, 6, 9, 12, 15]) controller.placeBuilding('house_small', at(dx, 6).x, at(dx, 6).y);
  controller.placeBuilding('farm', at(18, 6).x, at(18, 6).y);
  controller.update(T0 + 90_000, false);
  return bundle;
}

describe('das Auftragsmodell ist aufzählbar und vollständig beschriftet (D-046)', () => {
  it('kennt genau die Modi, Dringlichkeiten und Stopp-Aktionen des Auftrags', () => {
    expect([...TRANSPORT_MODES]).toEqual(['auto', 'manual']);
    expect([...TRANSPORT_PRIORITIES]).toEqual(['low', 'normal', 'high']);
    expect([...TRANSPORT_STOP_ACTIONS]).toEqual(['load', 'unload', 'reload', 'wait']);
  });

  it('übersetzt jeden bestehenden Stopp-Typ in genau eine Auftrags-Aktion', () => {
    // Total über die Union: ein neuer Stopp-Typ in `logistics.ts` fällt im
    // Compiler auf, nicht erst im Spiel als leere Beschriftung.
    expect(STOP_ACTION_BY_CARGO_TYPE).toEqual({ source: 'load', delivery: 'unload', resupply: 'reload' });
    for (const action of Object.values(STOP_ACTION_BY_CARGO_TYPE)) {
      expect(TRANSPORT_STOP_ACTIONS).toContain(action);
    }
  });
});

describe('der Auftrag ist eine Projektion, keine zweite Rechnung (§2/§8)', () => {
  it('übernimmt Stopps, Mengen und Reihenfolge unverändert aus der Wegprojektion', () => {
    const { controller } = deliveryCity();
    expect(controller.selectActivity('food_delivery')).toEqual({ ok: true });
    const plan = controller.getActivityRoutePlan('food_delivery')!;
    const targetIds = plan.targetBuildingIds;
    const suggestion = controller.getActivityRouteAnchors('food_delivery', targetIds);
    expect(suggestion).toBeDefined();

    // Ein echter, durchgehender Weg über die gebaute Straße.
    const roadPath: { x: number; y: number }[] = [];
    for (let dx = 5; dx <= 23; dx++) roadPath.push(at(dx, 5));

    const preview = controller.getActivityRoutePreview('food_delivery', targetIds, roadPath)!;
    const order = controller.getTransportOrder('food_delivery', targetIds, roadPath)!;

    // Der Vergleich ist nur etwas wert, wenn es überhaupt Stopps gibt —
    // sonst prüfte er zwei leere Listen gegeneinander (Lehre aus D-042).
    expect(preview.cargoRoute!.stops.length).toBeGreaterThan(1);
    expect(preview.cargoPlan!.totalRequired).toBeGreaterThan(0);

    // Jede Zahl des Auftrags muss sich in der Vorschau wiederfinden — sonst
    // rechnet das Auftragsmodell selbst und es gibt zwei Wahrheiten.
    expect(order.stops.length).toBe(preview.cargoRoute!.stops.length);
    order.stops.forEach((stop, index) => {
      const source = preview.cargoRoute!.stops[index]!;
      expect(stop.buildingId).toBe(source.buildingId);
      expect(stop.amount).toBe(source.amount);
      expect(stop.action).toBe(STOP_ACTION_BY_CARGO_TYPE[source.type]);
      expect(stop.status).toBe(source.status);
    });
    expect(order.targets).toEqual(preview.cargoRoute!.orderedTargetIds);
    expect(order.cargo[0]?.amount).toBe(preview.cargoPlan!.totalRequired);
    expect(order.cargo[0]?.resource).toBe(preview.cargoPlan!.resource);
  });

  it('erfindet ohne gezeichneten Weg keine Stopps', () => {
    const order = buildTransportOrder({ defId: 'food_delivery', targets: ['a', 'b'] });
    expect(order.stops).toEqual([]);
    expect(order.cargo).toEqual([]);
    // Ohne Weg bleibt die übergebene Planungsreihenfolge stehen.
    expect(order.targets).toEqual(['a', 'b']);
    expect(order.mode).toBe(DEFAULT_TRANSPORT_MODE);
    expect(order.priority).toBe('normal');
  });
});

describe('genau ein Modus ist wirksam — und der gewählte ist der bezahlte', () => {
  it('schreibt die Wahl beim Start fest', () => {
    const { controller } = deliveryCity();
    expect(controller.startActivity('food_delivery', undefined, { mode: 'manual' })).toEqual({ ok: true });
    expect(controller.state.activities.active!.mode).toBe('manual');
    expect(controller.getActiveTransportMode()).toBe('manual');
  });

  it('lässt die Ausführungsart unterwegs NICHT umschalten', () => {
    const { controller } = deliveryCity();
    controller.startActivity('food_delivery', undefined, { mode: 'auto' });
    const targetIds = controller.state.activities.active!.targets.map((target) => target.buildingId);
    // Route/Fahrzeug darf der Spieler ändern — die Ausführungsart nicht, sonst
    // wäre der Aufschlag nachträglich zuschaltbar.
    controller.setActiveActivityRoute(targetIds, { mode: 'manual' });
    expect(controller.getActiveTransportMode()).toBe('auto');
  });

  it('zahlt für dieselbe Tour genau den konfigurierten Aufschlag mehr', () => {
    const factor = activitiesConfig.manualDriveBonusFactor;
    expect(factor).toBeGreaterThan(1);

    const run = (mode: TransportMode): number => {
      const { controller } = deliveryCity();
      const money0 = controller.state.resources.money;
      controller.startActivity('food_delivery', undefined, { mode });
      for (const target of controller.getActivityTargets()) controller.progressActivity(target.buildingId);
      expect(controller.state.activities.active).toBeUndefined();
      return controller.state.resources.money - money0;
    };

    const auto = run('auto');
    const manual = run('manual');
    expect(auto).toBeGreaterThan(0);
    // Beide Läufe sind identisch schnell (dieselbe Simulationszeit) — der
    // einzige Unterschied ist die Ausführungsart.
    expect(manual).toBeGreaterThan(auto);
    expect(manual / auto).toBeCloseTo(factor, 1);
  });

  it('gibt einer nicht fahrbaren Aufgabe niemals den Aufschlag', () => {
    // `manual` ohne `def.drive` wäre ein Bonus für etwas, das gar nicht gefahren
    // werden kann — der Start setzt die Wahl deshalb auf `auto` zurück.
    const { controller } = deliveryCity();
    const inspection = activitiesConfig.activities.find((activity) => activity.type === 'inspection' && !activity.drive);
    expect(inspection).toBeDefined();
    setLevel(controller, 20);
    const started = controller.startActivity(inspection!.id, undefined, { mode: 'manual' });
    if (started.ok) expect(controller.getActiveTransportMode()).toBe('auto');
  });

  it('fällt bei fehlerhafter Config still auf die reguläre Prämie zurück', () => {
    // Eine Fehlkonfiguration darf niemals Geld verschenken oder bestrafen.
    expect(modeRewardFactor('manual', undefined)).toBe(1);
    expect(modeRewardFactor('manual', 0.5)).toBe(1);
    expect(modeRewardFactor('manual', Number.NaN)).toBe(1);
    expect(modeRewardFactor('auto', 5)).toBe(1);
    expect(modeRewardFactor('manual', 1.2)).toBe(1.2);
  });
});

describe('Save v30 ist additiv — Alt-Stände verhalten sich unverändert', () => {
  it('trägt die Ausführungsart durch Export und Import', () => {
    const { controller } = deliveryCity();
    controller.startActivity('food_delivery', undefined, { mode: 'manual' });
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, unknown>;
    expect(raw.schemaVersion).toBe(SCHEMA_VERSION);
    const restored = migrateAndValidate(raw);
    expect(restored.activities.active?.mode).toBe('manual');
  });

  it('liest einen v29-Stand ohne Modus als `auto` (bisheriges Verhalten)', () => {
    const { controller } = deliveryCity();
    controller.startActivity('food_delivery');
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, unknown>;
    // Ein echter v29-Stand: Feld existiert nicht, Version eins darunter.
    const activities = raw.activities as { active: Record<string, unknown> };
    delete activities.active.mode;
    raw.schemaVersion = 29;

    const restored = migrateAndValidate(raw);
    expect(restored.schemaVersion).toBe(SCHEMA_VERSION);
    expect(restored.activities.active?.mode).toBeUndefined();

    // Und die laufende Mission bleibt automatisch — sie wird nicht umgestellt.
    delete controller.state.activities.active!.mode;
    expect(controller.getActiveTransportMode()).toBe('auto');
  });
});
