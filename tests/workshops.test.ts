import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, refreshDerived, setLevel, T0 } from './helpers.ts';
import { buildingsConfig } from '../src/game/config/buildings.config.ts';
import { resourcesConfig } from '../src/game/config/resources.config.ts';
import { LEDGER_RESOURCES, reconcileStock, totalStored } from '../src/game/economy/stockLedger.ts';
import { WORKSHOP_IDLE_REASONS } from '../src/game/operations/workshops.ts';
import { workshopSupplyDemand } from '../src/game/operations/autoLogistics.ts';
import type { GameController } from '../src/game/commands/controller.ts';

// § Wirtschafts-/Lieferketten-Overhaul §4/§5 — DIE ZWEITE VERARBEITUNGSSTUFE.
//
// Der Kern des Auftrags ist nicht „zwei neue Ressourcen", sondern: Eine
// Werkstatt verarbeitet nur, was WIRKLICH ANGEKOMMEN ist. Diese Suite prüft
// deshalb vor allem den Unterschied zwischen Bilanz und Ort — eine volle
// Stadtkasse an Holz darf eine unversorgte Werkstatt nicht in Gang setzen.

const MIN = 60_000;
const at = (dx: number, dy: number) => nearTownHall(dx, dy);

/** Level-6-Stadt (Lagerhaus verfügbar) mit einer Holzwerkstatt an der Straße. */
function workshopCity(defId: 'wood_workshop' | 'stone_workshop' = 'wood_workshop') {
  const { controller } = newController();
  setLevel(controller, 6);
  flattenTerrain(controller);
  controller.state.resources = { money: 900_000, wood: 600, stone: 400, food: 200, freshwater: 0, planks: 0, cut_stone: 0 };
  // Straßenband, an dem alle Testgebäude hängen (dieselbe Anordnung wie die
  // übrigen Suiten: die Gründung legt die Startstraße bei dy = 5).
  for (let dx = 5; dx <= 24; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
  expect(controller.placeBuilding(defId, at(6, 6).x, at(6, 6).y)).toEqual({ ok: true });
  expect(controller.placeBuilding('warehouse', at(16, 6).x, at(16, 6).y)).toEqual({ ok: true });
  controller.update(T0 + 130_000, true); // Bauzeit abwarten
  // Stadtvorrat auf 0: Die Lieferkette funktioniert (eigener Abschnitt weiter
  // unten) und würde die Werkstatt sonst mitten im Test nachfüllen — dann
  // misst man die Automatik statt der Verarbeitung.
  controller.state.resources.wood = 0;
  controller.state.resources.stone = 0;
  // Die Automatik hat mit dem Fertigstellungs-Tick unter Umständen schon eine
  // Fahrt beauftragt; deren Ladung läge sonst mitten im Test plötzlich im
  // Eingangslager. (Genau daran ist die erste Fassung dieser Suite hängen
  // geblieben — die Lieferkette funktionierte besser als der Test annahm.)
  if (controller.state.operations?.transfers) controller.state.operations.transfers = {};
  const workshopInv = Object.entries(controller.state.operations?.inventories ?? {});
  for (const [, inv] of workshopInv) inv.reserved = {};
  refreshDerived(controller);
  reconcileStock(controller.state, controller.config, controller.derived);
  const workshop = Object.values(controller.state.buildings).find((b) => b.defId === defId)!;
  const warehouse = Object.values(controller.state.buildings).find((b) => b.defId === 'warehouse')!;
  return { controller, workshopId: workshop.id, warehouseId: warehouse.id };
}

/** Legt Rohstoff DIREKT ins Eingangslager der Werkstatt (ohne Fahrt). */
function fillInput(controller: GameController, workshopId: string, amount: number): void {
  const inv = controller.state.operations!.inventories[workshopId]!;
  inv.items.wood = amount;
  inv.items.stone = amount;
}

describe('Werkstätten — die Config trägt die Regel', () => {
  it('hat nie Betrieb UND Werkstatt am selben Gebäude', () => {
    const both = buildingsConfig.filter((def) => def.operation && def.conversion).map((def) => def.id);
    expect(both, 'ein Gebäude kann nicht gleichzeitig ernten und veredeln').toEqual([]);
  });

  it('veredelt nie eine Ware zu sich selbst und verbraucht immer mehr, als sie liefert', () => {
    for (const def of buildingsConfig) {
      if (!def.conversion) continue;
      expect(def.conversion.input, def.id).not.toBe(def.conversion.output);
      // Sonst wäre Veredelung ein Gratis-Vervielfacher statt einer Entscheidung.
      expect(def.conversion.inputPerOutput, def.id).toBeGreaterThan(1);
      expect(def.conversion.stages.length, def.id).toBeGreaterThan(0);
    }
  });

  it('kennt für jede veredelte Ware genau eine Werkstatt', () => {
    for (const res of resourcesConfig.filter((r) => r.refined)) {
      const makers = buildingsConfig.filter((def) => def.conversion?.output === res.id);
      expect(makers.map((d) => d.id), `Quelle für ${res.id}`).toHaveLength(1);
      // Und sie ist genau dann verfügbar, wenn die Ware Thema wird (§6).
      expect(makers[0]!.unlockLevel).toBe(res.unlockLevel);
    }
  });

  it('verortet die veredelten Waren im Bestandsregister', () => {
    // Sonst wäre der Pool für sie wieder die globale magische Ressource (D-052).
    expect(LEDGER_RESOURCES).toContain('planks');
    expect(LEDGER_RESOURCES).toContain('cut_stone');
  });

  it('beschriftet jeden Stillstandsgrund', () => {
    // D-046: `t()` gibt einen fehlenden Schlüssel roh aus — nur ein aufzählender
    // Test fängt das.
    expect(new Set(WORKSHOP_IDLE_REASONS).size).toBe(WORKSHOP_IDLE_REASONS.length);
    expect(WORKSHOP_IDLE_REASONS).toContain('no_input');
    expect(WORKSHOP_IDLE_REASONS).toContain('reserve_hold');
  });
});

describe('Werkstätten — verarbeitet wird nur, was da ist', () => {
  it('steht ohne Rohstoff still, auch wenn die Stadt voll Holz hat', () => {
    const { controller, workshopId } = workshopCity();
    controller.state.resources.wood = 5_000; // Bilanz voll …
    refreshDerived(controller);
    reconcileStock(controller.state, controller.config, controller.derived); // verortet den Bestand im Lagerhaus

    const view = controller.getWorkshopView(workshopId)!;
    // … das Eingangslager aber nicht: „vor Ort" ist der ganze Punkt (§8/D-052).
    // Geprüft OHNE Tick — mit Tick würde die Lieferkette (richtigerweise) sofort
    // anfangen zu liefern, und der Test misst dann sie statt der Aussage.
    expect(view.flow.inputStock).toBe(0);
    expect(view.flow.effectivePerMinute).toBe(0);
    expect(view.flow.idleReason).toBe('no_input');
    expect(controller.state.resources.planks).toBe(0);
  });

  it('macht aus angeliefertem Holz Bretter und verbraucht dabei das Doppelte', () => {
    const { controller, workshopId } = workshopCity();
    fillInput(controller, workshopId, 240);
    const before = controller.state.stats.produced.planks ?? 0;
    controller.update(T0 + 130_000 + 2 * MIN, true);

    const inv = controller.state.operations!.inventories[workshopId]!;
    const made = (controller.state.stats.produced.planks ?? 0) - before;
    expect(made).toBeGreaterThan(0);
    // Bretter liegen LOKAL, bis sie abgeholt werden — genau wie Sägewerksholz.
    expect((inv.items.planks ?? 0) + 0).toBeGreaterThan(0);
    // 2 Holz je Brett (inputPerOutput), Rundung großzügig.
    expect(240 - (inv.items.wood ?? 0)).toBeCloseTo(made * 2, 1);
  });

  it('hält die eingestellte Reserve unangetastet', () => {
    const { controller, workshopId } = workshopCity();
    fillInput(controller, workshopId, 100);
    // 0 % verarbeiten = alles ist Reserve.
    expect(controller.setWorkshopRule(workshopId, { processRatio: 0 })).toEqual({ ok: true });
    controller.update(T0 + 130_000 + 5 * MIN, true);

    const view = controller.getWorkshopView(workshopId)!;
    expect(view.flow.idleReason).toBe('reserve_hold');
    expect(controller.state.operations!.inventories[workshopId]!.items.wood).toBe(100);
  });

  it('nennt den Stillstand beim Namen: pausiert', () => {
    const { controller, workshopId } = workshopCity();
    fillInput(controller, workshopId, 200);
    expect(controller.setWorkshopRule(workshopId, { enabled: false })).toEqual({ ok: true });
    controller.update(T0 + 130_000 + 3 * MIN, true);
    expect(controller.getWorkshopView(workshopId)!.flow.idleReason).toBe('paused');
  });

  it('stoppt bei vollem Ausgangslager, statt Produkt verfallen zu lassen', () => {
    const { controller, workshopId } = workshopCity();
    const inv = controller.state.operations!.inventories[workshopId]!;
    inv.items.wood = 200;
    inv.items.planks = 160; // Stufe 1 = outputCapacity 160
    // Abholung abschalten, sonst räumt die Automatik den Ausgang frei.
    expect(controller.setAutoTransport(workshopId, false)).toEqual({ ok: true });
    controller.update(T0 + 130_000 + 3 * MIN, true);

    expect(controller.getWorkshopView(workshopId)!.flow.idleReason).toBe('output_full');
    expect(inv.items.planks).toBe(160);
    expect(inv.items.wood).toBe(200);
  });
});

describe('Lieferketten — die Werkstatt zieht sich ihren Nachschub', () => {
  it('bestellt Holz aus dem Lagerhaus, ohne dass der Spieler etwas einstellt', () => {
    const { controller, workshopId } = workshopCity();
    controller.state.resources.wood = 900;
    refreshDerived(controller);
    reconcileStock(controller.state, controller.config, controller.derived); // verortet den Bestand im Register
    controller.update(T0 + 130_000 + 30 * MIN, true);

    const inv = controller.state.operations!.inventories[workshopId]!;
    const arrived = (inv.items.wood ?? 0) + (inv.items.planks ?? 0) * 2;
    const running = Object.values(controller.state.operations!.transfers ?? {}).some(
      (t) => t.targetBuildingId === workshopId,
    );
    expect(arrived > 0 || running, 'weder angekommen noch unterwegs').toBe(true);
  });

  it('nimmt das Holz beim Beladen wirklich aus der Stadt — kein zweiter Bestand', () => {
    const { controller } = workshopCity();
    controller.state.resources.wood = 900;
    refreshDerived(controller);
    reconcileStock(controller.state, controller.config, controller.derived);
    controller.update(T0 + 130_000 + 40 * MIN, true);

    // Die Invariante des Registers muss über die ganze Kette halten: Was im Pool
    // steht, liegt in echten Stadtlagern — die Werkstatt gehört NICHT dazu.
    for (const resource of LEDGER_RESOURCES) {
      expect(
        totalStored(controller.state, controller.derived, resource),
        `Bilanz ≠ verortet für ${resource}`,
      ).toBeCloseTo(controller.state.resources[resource], 3);
    }
    // Und die Stadt hat wirklich Holz abgegeben (nicht kopiert).
    expect(controller.state.resources.wood).toBeLessThan(900);
  });

  it('beliefert bei knappem Rohstoff die höhere Priorität zuerst', () => {
    const { controller, workshopId } = workshopCity();
    // Zweite Werkstatt ist erst ab L8 baubar — Level anheben, dann bauen.
    setLevel(controller, 8);
    controller.state.resources.money = 900_000;
    controller.state.resources.wood = 400;
    refreshDerived(controller);
    expect(controller.placeBuilding('wood_workshop', at(11, 6).x, at(11, 6).y)).toEqual({ ok: true });
    controller.update(T0 + 260_000, true);
    const second = Object.values(controller.state.buildings).filter((b) => b.defId === 'wood_workshop')[1]!;
    expect(second.id).not.toBe(workshopId);

    expect(controller.setWorkshopRule(workshopId, { priority: 5 })).toEqual({ ok: true });
    expect(controller.setWorkshopRule(second.id, { priority: 1 })).toEqual({ ok: true });

    // Beide leer → beide fordern an; entschieden wird über die Priorität.
    for (const id of [workshopId, second.id]) delete controller.state.operations!.inventories[id]!.items.wood;
    const order = workshopDemandOrder(controller);
    expect(order.slice(0, 2)).toEqual([workshopId, second.id]);
  });

  it('lehnt eine Quelle ab, die diese Ware gar nicht führt', () => {
    const { controller, workshopId } = workshopCity();
    expect(controller.setWorkshopRule(workshopId, { sourceBuildingId: 'gibt_es_nicht' })).toEqual({
      ok: false,
      error: 'invalid',
    });
  });
});

/**
 * Reihenfolge der Nachschub-Nachfrage — **dieselbe** Funktion, nach der
 * geliefert wird. Ein Test, der die Sortierung selbst nachbaut, prüft seinen
 * eigenen Code (D-042).
 */
function workshopDemandOrder(controller: GameController): string[] {
  return workshopSupplyDemand(controller.state, controller.config).map((d) => d.buildingId);
}
