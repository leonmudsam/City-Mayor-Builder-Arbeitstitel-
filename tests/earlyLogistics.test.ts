import { describe, expect, it } from 'vitest';
import { flattenTerrain, nearTownHall, newController, paintTerrain, setLevel, T0 } from './helpers.ts';

// § Spielbarkeit 9.1 / P-C — Frühlogistik. Das Sägewerk ist ab Level 2 baubar, der
// erste Lieferwagen aber erst ab Level 4. Ohne Fahrzeug ließ sich in L2–3 kein Holz
// vom Sägewerk ins Rathauslager bringen — der frühe Baufortschritt blockierte. Der
// Handkarren (unlockLevel 2) schließt genau diese Lücke. Belegt §17 „Frühlogistik".

const MIN = 60_000;
const at = (dx: number, dy: number) => nearTownHall(dx, dy);

function paintForest(controller: ReturnType<typeof newController>['controller'], x0: number, y0: number, w: number, h: number): void {
  const coords: [number, number][] = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) coords.push([x0 + dx, y0 + dy]);
  paintTerrain(controller, coords, 'forest');
}

/** Level-2-Stadt mit Sägewerk (L2 baubar) und lokal geerntetem Holz. */
function level2Sawmill(harvestMin = 6) {
  const bundle = newController();
  const { controller } = bundle;
  setLevel(controller, 2);
  flattenTerrain(controller);
  paintForest(controller, at(6, 6).x, at(6, 6).y, 5, 6);
  expect(controller.placeBuilding('sawmill', at(1, 6).x, at(1, 6).y)).toEqual({ ok: true });
  controller.update(T0 + 31_000, true); // Bau fertig
  const sawmill = Object.values(controller.state.buildings).find((b) => b.defId === 'sawmill')!;
  const townHall = Object.values(controller.state.buildings).find((b) => b.defId === 'town_hall')!;
  controller.startBuildingOperation(sawmill.id);
  controller.update(T0 + 31_000 + harvestMin * MIN, true);
  controller.cancelBuildingOperation(sawmill.id); // Lager einfrieren
  return { controller, sawmillId: sawmill.id, townHallId: townHall.id };
}

describe('§ P-C Frühlogistik — Handkarren ab Level 2', () => {
  it('stellt ab Level 2 den Handkarren bereit, den Lieferwagen erst ab Level 4', () => {
    const { controller } = level2Sawmill(0);
    const unlockedAt2 = controller.config.activities.vehicles
      .filter((v) => !v.future && v.unlockLevel <= 2)
      .map((v) => v.id);
    expect(unlockedAt2).toContain('handcart');
    expect(unlockedAt2).not.toContain('van');
  });

  it('bringt Sägewerk-Holz mit dem Handkarren ins Rathauslager (der frühere Blocker)', () => {
    const { controller, sawmillId, townHallId } = level2Sawmill();
    const wood = controller.getBuildingInventory(sawmillId)!.items.wood ?? 0;
    expect(wood).toBeGreaterThan(0);
    const targets = controller.getInventoryTransferTargets(sawmillId, 'wood');
    expect(targets.map((t) => t.buildingId)).toContain(townHallId);
    const res = controller.createInventoryTransfer({
      sourceBuildingId: sawmillId,
      targetBuildingId: townHallId,
      resource: 'wood',
      amount: wood,
      vehicleId: 'handcart',
    });
    expect(res).toEqual({ ok: true });
    expect(controller.getAvailableForTransfer(sawmillId, 'wood')).toBe(0);
  });

  it('der Handkarren ist klein und kostenlos (kein Motor)', () => {
    const { controller } = level2Sawmill(0);
    const cart = controller.config.activities.vehicles.find((v) => v.id === 'handcart')!;
    expect(cart.unlockLevel).toBe(2);
    expect(cart.operatingCost).toBe(0);
    expect(cart.capacity).toBeLessThan(250); // deutlich kleiner als der Lieferwagen
  });

  it('liefert den vollen Loop: Holz landet nach Ankunft im Zentrallager (Rathaus)', () => {
    const { controller, sawmillId, townHallId } = level2Sawmill();
    const wood = controller.getBuildingInventory(sawmillId)!.items.wood ?? 0;
    const globalBefore = controller.state.resources.wood;
    controller.createInventoryTransfer({
      sourceBuildingId: sawmillId,
      targetBuildingId: townHallId,
      resource: 'wood',
      amount: wood,
      vehicleId: 'handcart',
    });
    // Genug Zeit für Laden → Fahrt → Entladen (Handkarren ist langsam).
    controller.update(T0 + 31_000 + 6 * MIN + 60 * MIN, true);
    expect(controller.state.resources.wood).toBeGreaterThan(globalBefore);
  });
});
