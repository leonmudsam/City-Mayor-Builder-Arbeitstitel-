import { describe, expect, it } from 'vitest';
import { regionIdAt } from '../src/game/config/startRegion.config.ts';
import { newController, nearTownHall } from './helpers.ts';

// § C3: reine Kartenprojektion eines Bürgeranliegens (controller.questFocus).
describe('questFocus — reine Anliegen-Kartenprojektion (§ C3)', () => {
  const at = (dx: number, dy: number) => nearTownHall(dx, dy);

  it('gibt undefined für eine unbekannte Quest', () => {
    const { controller } = newController();
    expect(controller.questFocus('does_not_exist')).toBeUndefined();
  });

  it('fokussiert ein echtes Gebäude eines gebäudebezogenen Ziels', () => {
    const { controller } = newController();
    controller.state.resources = { money: 500_000, wood: 500, stone: 200, food: 40, freshwater: 0, planks: 0, cut_stone: 0 };
    // Start-Straße verlängern + ein Wohnhaus setzen (q02_houses: build house_small).
    for (let dx = 3; dx <= 6; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    expect(controller.placeBuilding('house_small', at(3, 6).x, at(3, 6).y)).toEqual({ ok: true });
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    const focus = controller.questFocus('q02_houses');
    expect(focus).toBeDefined();
    // house_small ist 3×3 → Mittelpunkt = Ecke + 1,5.
    expect(focus!.x).toBeCloseTo(house.x + 1.5, 5);
    expect(focus!.y).toBeCloseTo(house.y + 1.5, 5);
    expect(focus!.regionId).toBe(regionIdAt(Math.floor(focus!.x), Math.floor(focus!.y)));
  });

  it('fokussiert bei Regions-Zielen eine gesperrte, freischaltbare Region', () => {
    const { controller } = newController();
    const focus = controller.questFocus('q09_expand'); // Ziel: regions ×2
    expect(focus).toBeDefined();
    const region = controller.state.world.regions[focus!.regionId];
    expect(region?.status).toBe('locked');
    expect(controller.config.regions.get(focus!.regionId)?.unlockable).toBe(true);
  });

  it('fällt ohne passendes Gebäude auf das Stadtzentrum zurück (Startregion)', () => {
    const { controller } = newController();
    // Kein house_small gebaut → Fallback auf Stadtzentrum (nur Rathaus vorhanden).
    const focus = controller.questFocus('q02_houses');
    expect(focus).toBeDefined();
    expect(focus!.regionId).toBe(regionIdAt(Math.floor(focus!.x), Math.floor(focus!.y)));
  });

  it('ist deterministisch', () => {
    const { controller } = newController();
    expect(controller.questFocus('q09_expand')).toEqual(controller.questFocus('q09_expand'));
  });
});
