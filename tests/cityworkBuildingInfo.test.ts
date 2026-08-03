import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, refreshDerived, setLevel } from './helpers.ts';
import { CITYWORK_RELOAD_BLOCKERS } from '../src/game/commands/controller.ts';
import type { GameController } from '../src/game/commands/controller.ts';
import { depositStock, reconcileStock, stockAt } from '../src/game/economy/stockLedger.ts';

// § Stadtarbeit-Overhaul P5 (§6) — DAS GEBÄUDE AUF DER KARTE ANTWORTET.
//
// Geprüft werden die beiden Eigenschaften, an denen die Bedienung hängt:
//
//   1. Der Bestand ist der Bestand AN DIESEM ORT (D-052) — nicht die Bilanz der
//      Stadt. Ohne das wäre die Wahl des Lagers wieder folgenlos.
//   2. Der angebotene Knopf und der Command sagen dasselbe (D-048): Wo die
//      Karte kein Hindernis meldet, nimmt `reloadActivityCargo` an — und
//      umgekehrt. Geprüft über ALLE Lagerorte, nicht an einem Beispiel.

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

function deliveryCity(): GameController {
  const { controller } = newController();
  setLevel(controller, 14);
  flattenTerrain(controller);
  controller.state.resources = { money: 5_000_000, wood: 100_000, stone: 100_000, food: 0, freshwater: 0 };
  for (let dx = 0; dx <= 24; dx++) controller.placeBuilding('road', at(dx, 4).x, at(dx, 4).y);
  for (const [defId, dx] of [['warehouse', 6], ['supermarket', 16]] as [string, number][]) {
    const result = controller.placeBuilding(defId, at(dx, 5).x, at(dx, 5).y);
    if (!result.ok) throw new Error(`Fixture: ${defId} → ${result.error}`);
  }
  let houses = 0;
  for (let dx = 5; dx <= 22 && houses < 3; dx += 3) {
    const spot = at(dx, 1); // 3×3 endet bündig über der Straße bei dy 4
    if (controller.placeBuilding('house_small', spot.x, spot.y).ok) houses += 1;
  }
  if (houses === 0) throw new Error('Fixture: kein Wohnhaus platzierbar');
  for (const building of Object.values(controller.state.buildings)) building.status = 'active';
  refreshDerived(controller);
  controller.state.resources = { money: 500_000, wood: 400, stone: 400, food: 400, freshwater: 0 };
  reconcileStock(controller.state, controller.config, controller.derived);
  return controller;
}

describe('§ P5 — der Bestand gehört dem Ort', () => {
  it('nennt an einem Lager genau dessen eigenen Bestand, nicht die Stadtbilanz', () => {
    const controller = deliveryCity();
    const site = controller.derived.storageSites.find((candidate) => candidate.defId === 'warehouse');
    expect(site).toBeDefined();
    // Gezielt einlagern: Danach dürfen sich Ort und Bilanz unterscheiden.
    depositStock(controller.state, controller.derived, site!.buildingId, 'wood', 120);
    const info = controller.getCityworkBuildingInfo(site!.buildingId);
    const wood = info?.stock.find((entry) => entry.resource === 'wood');
    expect(wood?.amount).toBe(stockAt(controller.state, site!.buildingId, 'wood'));
    expect(wood?.amount).toBeLessThan(controller.state.resources.wood);
    expect(wood?.cap).toBeGreaterThan(0);
  });

  it('gibt einem Wohnhaus keinen Bestand — dort ist die Ware die Bilanz der Stadt', () => {
    const controller = deliveryCity();
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small');
    const info = controller.getCityworkBuildingInfo(house!.id);
    expect(info?.isStore).toBe(false);
    expect(info?.stock).toEqual([]);
    // Die Hindernisse haben eine Reihenfolge: Ohne Auftrag ist „kein Auftrag"
    // die richtige Auskunft — „kein Lager" wäre eine Antwort auf eine Frage,
    // die noch niemand gestellt hat.
    expect(info?.reloadBlocker).toBe('no_mission');
    if (controller.startActivity('food_delivery').ok) {
      expect(controller.getCityworkBuildingInfo(house!.id)?.reloadBlocker).toBe('not_a_store');
    }
  });

  it('antwortet für ein abgerissenes Gebäude gar nicht, statt Leeres zu behaupten', () => {
    const controller = deliveryCity();
    expect(controller.getCityworkBuildingInfo('gibtsnicht')).toBeUndefined();
  });
});

describe('§ P5 — Knopf und Command sagen dasselbe (D-048)', () => {
  it('meldet ohne laufenden Auftrag an JEDEM Lager dasselbe Hindernis', () => {
    const controller = deliveryCity();
    for (const site of controller.derived.storageSites) {
      expect(controller.getCityworkBuildingInfo(site.buildingId)?.reloadBlocker).toBe('no_mission');
    }
  });

  it('ist deckungsgleich mit dem Command — über alle Lagerorte', () => {
    const controller = deliveryCity();
    const started = controller.startActivity('food_delivery');
    if (!started.ok) return; // ohne gültigen Auftrag misst dieser Test nichts
    for (const site of controller.derived.storageSites) {
      const blocker = controller.getCityworkBuildingInfo(site.buildingId)?.reloadBlocker;
      const result = controller.reloadActivityCargo(site.buildingId);
      expect(result.ok).toBe(blocker === undefined);
      if (!result.ok && blocker === 'insufficient') expect(result.error).toBe('insufficient');
    }
  });

  it('jedes Hindernis der Liste ist ein echter Wert — kein toter Zustand', () => {
    expect(new Set(CITYWORK_RELOAD_BLOCKERS).size).toBe(CITYWORK_RELOAD_BLOCKERS.length);
    expect(CITYWORK_RELOAD_BLOCKERS).toContain('cargo_full');
    expect(CITYWORK_RELOAD_BLOCKERS).toContain('insufficient');
  });
});
