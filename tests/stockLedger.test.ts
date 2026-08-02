import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, refreshDerived, setLevel } from './helpers.ts';
import {
  LEDGER_RESOURCES,
  depositStock,
  isCityStorageBuilding,
  isLedgerResource,
  reconcileStock,
  stockAt,
  stockShares,
  stockSources,
  totalStored,
  withdrawStock,
} from '../src/game/economy/stockLedger.ts';
import { DRIVE_FULL_LOAD_SPEED_FACTOR, loadedTileSpeed } from '../src/game/activities/driving.ts';
import { buildingsConfig } from '../src/game/config/buildings.config.ts';
import { SCHEMA_VERSION } from '../src/game/newGame.ts';
import { migrateAndValidate } from '../src/game/storage/migrations.ts';
import { exportSave } from '../src/game/storage/exportImport.ts';

// § Stadtarbeit P4 (§8 „Keine globale magische Ressource. Jedes Lager hat eigene
// Bestände").
//
// Die Suite prüft die EINE Eigenschaft, an der alles hängt:
//
//     state.resources[r] === Σ Bestand aller Stadtlager[r]
//
// Ohne sie wäre die Wahl eines Lagers in der Stadtarbeit eine Attrappe — der
// Spieler führe zu einem Gebäude, das gar keinen eigenen Bestand hat. Mit ihr
// bleibt `state.resources` weiterhin die Bilanzsumme, die die gesamte übrige
// Wirtschaft liest (Baukosten, Verbrauch, Quests, Balancing).
//
// Zweiter Prüfgegenstand: die Trennung zu den LOKALEN Betriebslagern aus Save
// v17. Ein Sägewerk-Vorrat gehört ausdrücklich NICHT zum Pool — würde er
// mitgezählt, entstünde genau das dritte Lagermodell, das §2/§8 verbietet.

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

/** Stadt mit mehreren echten Lagerorten (Rathaus + zwei Lagerhäuser + Markt). */
function storageCity() {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 14);
  flattenTerrain(controller);
  controller.state.resources = { money: 5_000_000, wood: 100_000, stone: 100_000, food: 0, freshwater: 0 };
  // Von der Rathauskante nach außen wachsen — eine isolierte Kachel lehnt
  // `validatePlacement` zu Recht mit `needs_road` ab.
  for (let dx = 0; dx <= 26; dx++) {
    const r = controller.placeBuilding('road', at(dx, 4).x, at(dx, 4).y);
    if (!r.ok && r.error !== 'occupied') throw new Error(`Fixture: Straße +${dx} → ${r.error}`);
  }
  for (let dx = -1; dx >= -8; dx--) {
    const r = controller.placeBuilding('road', at(dx, 4).x, at(dx, 4).y);
    if (!r.ok && r.error !== 'occupied') throw new Error(`Fixture: Straße ${dx} → ${r.error}`);
  }
  for (const [defId, dx] of [
    ['warehouse', 6],
    ['warehouse', 14],
    ['supermarket', 22],
  ] as [string, number][]) {
    const r = controller.placeBuilding(defId, at(dx, 5).x, at(dx, 5).y);
    if (!r.ok) throw new Error(`Fixture: ${defId} → ${r.error}`);
  }
  activateAll(controller);
  refreshDerived(controller);
  // Erst jetzt die Bilanz auf einen Wert unterhalb der Deckel setzen, damit der
  // Abgleich eine reguläre Lage vorfindet (Baukosten sind bezahlt).
  controller.state.resources = { money: 500_000, wood: 300, stone: 300, food: 300, freshwater: 0 };
  reconcileStock(controller.state, controller.config, controller.derived);
  return controller;
}

/** Bauzeit überspringen — die Fixture beschreibt eine fertige Stadt. */
function activateAll(controller: ReturnType<typeof newController>['controller']): void {
  for (const b of Object.values(controller.state.buildings)) b.status = 'active';
}

/**
 * Stellt ein Gebäude an der ersten freien Stelle entlang der Teststraße auf und
 * gibt seine Id zurück. Die Fixture-Geometrie soll nicht Gegenstand der Prüfung
 * sein — geprüft wird das Register, nicht der Bebauungsplan.
 */
function placeSomewhere(controller: ReturnType<typeof newController>['controller'], defId: string): string {
  for (let dx = -8; dx <= 26; dx++) {
    const spot = at(dx, 5);
    const result = controller.placeBuilding(defId, spot.x, spot.y);
    if (!result.ok) continue;
    const placed = Object.values(controller.state.buildings).find(
      (b) => b.defId === defId && b.x === spot.x && b.y === spot.y,
    );
    if (placed) {
      placed.status = 'active';
      refreshDerived(controller);
      return placed.id;
    }
  }
  throw new Error(`Fixture: ${defId} fand keinen Platz`);
}

const sum = (values: number[]): number => values.reduce((a, b) => a + b, 0);

describe('Bestandsregister — Aufteilung der Stadtlager', () => {
  it('Betriebe und Stadtlager überschneiden sich in der Config nicht', () => {
    // Die Grundlage des ganzen Moduls: ein Gebäude ist ENTWEDER Betrieb mit
    // lokalem Lager ODER Stadtlager. Gäbe es beides in einem, hielte dieselbe
    // Map zwei verschiedene Bedeutungen — ein zweites Modell in Tarnung.
    const both = buildingsConfig.filter(
      (def) => def.operation && (def.effects ?? []).some((eff) => eff.type === 'storage'),
    );
    expect(both.map((d) => d.id)).toEqual([]);
  });

  it('nennt genau die Gebäude mit Lagerwirkung als Lagerorte', () => {
    const controller = storageCity();
    const ids = controller.derived.storageSites.map((s) => s.defId).sort();
    expect(ids).toContain('town_hall');
    expect(ids.filter((id) => id === 'warehouse')).toHaveLength(2);
    expect(ids).toContain('supermarket');
    for (const site of controller.derived.storageSites) {
      expect(isCityStorageBuilding(controller.state, controller.config, site.buildingId)).toBe(true);
    }
  });

  it('die Summe der Lagerorte trifft den Deckel exakt', () => {
    // storageCaps und storageSites entstehen in derselben Schleife über denselben
    // `case 'storage'` — dieser Test hält sie zusammen (Lehre D-042/D-049).
    const controller = storageCity();
    for (const resource of LEDGER_RESOURCES) {
      const fromSites = sum(controller.derived.storageSites.map((s) => s.caps[resource] ?? 0));
      expect(fromSites).toBe(controller.derived.storageCaps[resource]);
    }
  });

  it('Geld liegt in keinem Lagerhaus', () => {
    expect(isLedgerResource('money')).toBe(false);
    const controller = storageCity();
    expect(stockAt(controller.state, controller.derived.storageSites[0]!.buildingId, 'money')).toBe(0);
  });
});

describe('Bestandsregister — Invariante Pool === Σ Lager', () => {
  it('hält nach dem Bauen der Stadt', () => {
    const controller = storageCity();
    for (const resource of LEDGER_RESOURCES) {
      expect(totalStored(controller.state, controller.derived, resource)).toBeCloseTo(
        controller.state.resources[resource],
        5,
      );
    }
  });

  it('hält über viele Simulationstakte (Produktion und Verbrauch)', () => {
    const controller = storageCity();
    placeSomewhere(controller, 'house_small');
    placeSomewhere(controller, 'house_small');
    let now = controller.state.meta.lastSimTime;
    for (let i = 0; i < 40; i++) {
      now += 3_000;
      controller.update(now, true);
      for (const resource of LEDGER_RESOURCES) {
        expect(totalStored(controller.state, controller.derived, resource)).toBeCloseTo(
          controller.state.resources[resource],
          4,
        );
      }
    }
  });

  it('hält, wenn ein Lagerhaus abgerissen wird', () => {
    const controller = storageCity();
    const warehouse = controller.derived.storageSites.find((s) => s.defId === 'warehouse');
    expect(warehouse).toBeDefined();
    controller.demolishBuilding(warehouse!.buildingId);
    refreshDerived(controller);
    reconcileStock(controller.state, controller.config, controller.derived);
    // Der tote Registereintrag ist weg — sonst zählte er später doppelt.
    expect(controller.state.operations?.inventories[warehouse!.buildingId]).toBeUndefined();
    for (const resource of LEDGER_RESOURCES) {
      expect(totalStored(controller.state, controller.derived, resource)).toBeCloseTo(
        controller.state.resources[resource],
        4,
      );
    }
  });

  it('ist idempotent — ein zweiter Abgleich verschiebt nichts', () => {
    const controller = storageCity();
    const before = controller.derived.storageSites.map((s) => stockAt(controller.state, s.buildingId, 'food'));
    reconcileStock(controller.state, controller.config, controller.derived);
    const after = controller.derived.storageSites.map((s) => stockAt(controller.state, s.buildingId, 'food'));
    expect(after).toEqual(before);
  });

  it('kein Lager wird über seine Kapazität gefüllt', () => {
    const controller = storageCity();
    controller.state.resources.food = controller.derived.storageCaps.food;
    reconcileStock(controller.state, controller.config, controller.derived);
    for (const share of stockShares(controller.state, controller.derived, 'food')) {
      expect(share.stored).toBeLessThanOrEqual(share.capacity + 1e-6);
    }
    expect(totalStored(controller.state, controller.derived, 'food')).toBeCloseTo(controller.state.resources.food, 4);
  });

  it('meldet nicht verortbare Ware, statt sie still zu verrechnen', () => {
    const controller = storageCity();
    // Mehr Ware als Fassungsvermögen kann regulär nicht entstehen (grantResources
    // deckelt) — tritt sie doch auf, soll sie sichtbar sein, nicht verschwinden.
    controller.state.resources.food = controller.derived.storageCaps.food + 250;
    const result = reconcileStock(controller.state, controller.config, controller.derived);
    expect(result.unassigned.food).toBeCloseTo(250, 4);
    expect(controller.state.resources.food).toBeCloseTo(controller.derived.storageCaps.food + 250, 4);
  });
});

describe('Bestandsregister — ortsgenaues Laden und Entladen', () => {
  it('Entnahme zieht Lager UND Bilanz gemeinsam ab', () => {
    const controller = storageCity();
    const share = stockSources(controller.state, controller.derived, 'food')[0];
    expect(share).toBeDefined();
    const poolBefore = controller.state.resources.food;
    const storedBefore = share!.stored;
    const taken = withdrawStock(controller.state, controller.derived, share!.site.buildingId, 'food', 25);
    expect(taken).toBeCloseTo(25, 5);
    expect(stockAt(controller.state, share!.site.buildingId, 'food')).toBeCloseTo(storedBefore - 25, 5);
    expect(controller.state.resources.food).toBeCloseTo(poolBefore - 25, 5);
  });

  it('entnimmt nie mehr, als an diesem Ort liegt', () => {
    const controller = storageCity();
    const share = stockSources(controller.state, controller.derived, 'food')[0]!;
    const taken = withdrawStock(
      controller.state,
      controller.derived,
      share.site.buildingId,
      'food',
      share.stored + 10_000,
    );
    expect(taken).toBeCloseTo(share.stored, 5);
    expect(stockAt(controller.state, share.site.buildingId, 'food')).toBe(0);
  });

  it('Einlagerung ist durch die Kapazität DIESES Lagers gedeckelt', () => {
    const controller = storageCity();
    const share = stockShares(controller.state, controller.derived, 'food')[0]!;
    const put = depositStock(controller.state, controller.derived, share.site.buildingId, 'food', 1_000_000);
    expect(put).toBeCloseTo(share.free, 4);
    expect(stockAt(controller.state, share.site.buildingId, 'food')).toBeCloseTo(share.capacity, 4);
  });

  it('an einem Gebäude ohne Lagerwirkung geht weder Laden noch Entladen', () => {
    const controller = storageCity();
    const id = placeSomewhere(controller, 'house_small');
    expect(withdrawStock(controller.state, controller.derived, id, 'food', 10)).toBe(0);
    expect(depositStock(controller.state, controller.derived, id, 'food', 10)).toBe(0);
  });

  it('Quellenliste nennt nur Orte mit echtem Bestand, größte zuerst', () => {
    const controller = storageCity();
    const sources = stockSources(controller.state, controller.derived, 'food');
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) expect(source.stored).toBeGreaterThan(0);
    for (let i = 1; i < sources.length; i++) {
      expect(sources[i - 1]!.stored).toBeGreaterThanOrEqual(sources[i]!.stored);
    }
  });
});

describe('Bestandsregister — Abgrenzung zum lokalen Betriebslager', () => {
  it('Sägewerksholz zählt NICHT zum Stadtpool', () => {
    const controller = storageCity();
    const id = placeSomewhere(controller, 'sawmill');
    controller.state.operations ??= { inventories: {}, workers: {}, active: {}, nodeDeltas: {} };
    controller.state.operations.inventories[id] = { capacity: 400, items: { wood: 120 }, reserved: {} };

    const poolBefore = controller.state.resources.wood;
    reconcileStock(controller.state, controller.config, controller.derived);
    // Das lokale Lager bleibt unangetastet …
    expect(controller.state.operations.inventories[id]?.items.wood).toBe(120);
    // … und verändert die Bilanz der Stadt nicht.
    expect(controller.state.resources.wood).toBeCloseTo(poolBefore, 5);
    expect(totalStored(controller.state, controller.derived, 'wood')).toBeCloseTo(poolBefore, 4);
    expect(isCityStorageBuilding(controller.state, controller.config, id)).toBe(false);
  });
});

describe('Bestandsregister — Save', () => {
  it('Schema steht auf v32 und ein neuer Save lädt unverändert', () => {
    expect(SCHEMA_VERSION).toBe(32);
    const controller = storageCity();
    const restored = migrateAndValidate(JSON.parse(exportSave(controller.state)));
    expect(restored.schemaVersion).toBe(32);
    expect(restored.resources.food).toBeCloseTo(controller.state.resources.food, 5);
  });

  it('ein v31-Save behält seine Ressourcen und bekommt sie verortet', () => {
    const controller = storageCity();
    const raw = JSON.parse(exportSave(controller.state)) as Record<string, unknown>;
    raw.schemaVersion = 31;
    // Alt-Save-Zustand nachstellen: Bilanz vorhanden, aber nichts verortet.
    const ops = raw.operations as { inventories: Record<string, unknown> } | undefined;
    if (ops) ops.inventories = {};
    const food = (raw.resources as Record<string, number>).food ?? 0;

    const migrated = migrateAndValidate(raw);
    expect(migrated.schemaVersion).toBe(32);
    expect(migrated.resources.food).toBeCloseTo(food, 5);

    // Der Ladepfad bekommt keine Sonderbehandlung — derselbe Abgleich verortet.
    controller.resetTo(migrated);
    expect(totalStored(controller.state, controller.derived, 'food')).toBeCloseTo(controller.state.resources.food, 4);
    expect(stockSources(controller.state, controller.derived, 'food').length).toBeGreaterThan(0);
  });
});

describe('Stadtarbeit — der Ladeort ist eine Entscheidung (§8)', () => {
  it('nennt die Lagerorte eines Auftrags mit echtem Bestand und Bedarf', () => {
    const controller = storageCity();
    const options = controller.getActivitySupplyOptions('food_delivery', 3);
    // Von den Quellen des Auftrags (farm/market/supermarket) ist nur der Markt
    // ein echtes Stadtlager — Farm und Markt-Bude haben keine Lagerwirkung.
    for (const option of options) {
      expect(controller.derived.storageSites.some((s) => s.buildingId === option.buildingId)).toBe(true);
      expect(option.stored).toBe(stockAt(controller.state, option.buildingId, 'food'));
      expect(option.sufficient).toBe(option.stored >= option.needed);
    }
  });

  it('ausreichend bevorratete Lager stehen vorn — sie sind die Vorauswahl', () => {
    const controller = storageCity();
    const options = controller.getActivitySupplyOptions('wood_transport', 3);
    if (options.length < 2) return; // Fixture hat nur ein Holzlager: nichts zu ordnen
    const firstShort = options.findIndex((option) => !option.sufficient);
    if (firstShort >= 0) {
      expect(options.slice(firstShort).every((option) => !option.sufficient)).toBe(true);
    }
  });

  it('ein nicht wählbares Lager wird abgelehnt, statt still übernommen', () => {
    const controller = storageCity();
    controller.selectActivity('food_delivery');
    const house = placeSomewhere(controller, 'house_small');
    expect(controller.setActivitySource('food_delivery', house)).toEqual({ ok: false, error: 'invalid' });
  });
});

describe('Beladung beeinflusst das Fahrverhalten', () => {
  it('ein volles Fahrzeug fährt langsamer als ein leeres', () => {
    expect(loadedTileSpeed(10, 0)).toBeCloseTo(10, 6);
    expect(loadedTileSpeed(10, 1)).toBeCloseTo(10 * DRIVE_FULL_LOAD_SPEED_FACTOR, 6);
    expect(loadedTileSpeed(10, 0.5)).toBeLessThan(loadedTileSpeed(10, 0));
    expect(loadedTileSpeed(10, 0.5)).toBeGreaterThan(loadedTileSpeed(10, 1));
  });

  it('bleibt monoton und deckelt unsinnige Eingaben', () => {
    let previous = Number.POSITIVE_INFINITY;
    for (let ratio = 0; ratio <= 1.0001; ratio += 0.1) {
      const speed = loadedTileSpeed(8, ratio);
      expect(speed).toBeLessThanOrEqual(previous + 1e-9);
      previous = speed;
    }
    expect(loadedTileSpeed(8, -5)).toBeCloseTo(8, 6);
    expect(loadedTileSpeed(8, 99)).toBeCloseTo(8 * DRIVE_FULL_LOAD_SPEED_FACTOR, 6);
    expect(loadedTileSpeed(8, Number.NaN)).toBeCloseTo(8, 6);
  });

  it('eine volle Ladung bremst spürbar, aber nicht strafend', () => {
    // Fühlbar heißt: mehr als ein Zehntel langsamer, weniger als die Hälfte.
    expect(DRIVE_FULL_LOAD_SPEED_FACTOR).toBeLessThan(0.9);
    expect(DRIVE_FULL_LOAD_SPEED_FACTOR).toBeGreaterThan(0.5);
  });
});
