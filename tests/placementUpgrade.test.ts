import { describe, expect, it } from 'vitest';
import { newController, nearTownHall, setLevel, T0 } from './helpers.ts';
import { isContributing } from '../src/game/buildings/effects.ts';

const at = (dx: number, dy: number) => nearTownHall(dx, dy);
const HOUR = 3_600_000;

describe('placementDiagnostics — Read-Projektion für die Ghost-Vorschau (§ C4)', () => {
  it('meldet gültige Platzierung mit Straßenanschluss und Terrain', () => {
    const { controller } = newController();
    controller.state.resources = { money: 500_000, wood: 500, stone: 200, food: 40, freshwater: 0 };
    for (let dx = 3; dx <= 7; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    const diag = controller.placementDiagnostics('house_small', at(4, 6).x, at(4, 6).y);
    expect(diag).toBeDefined();
    expect(diag!.valid).toBe(true);
    expect(diag!.roadAccess).toBe(true);
    expect(diag!.terrain).toBe('grass');
    expect(diag!.buildCost.money).toBeGreaterThan(0);
  });

  it('meldet ungültige Platzierung mit Grund auf belegter Fläche', () => {
    const { controller } = newController();
    controller.state.resources = { money: 500_000, wood: 500, stone: 200, food: 40, freshwater: 0 };
    for (let dx = 3; dx <= 7; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    controller.placeBuilding('house_small', at(4, 6).x, at(4, 6).y);
    const diag = controller.placementDiagnostics('house_small', at(4, 6).x, at(4, 6).y);
    expect(diag!.valid).toBe(false);
    expect(diag!.reason).toBeDefined();
  });

  it('gibt undefined für unbekannte Gebäude', () => {
    const { controller } = newController();
    expect(controller.placementDiagnostics('nope', at(0, 0).x, at(0, 0).y)).toBeUndefined();
  });
});

describe('Gebäude verschieben erhält den Zustand (§ C4/15)', () => {
  it('behält Upgradestufe und gibt alte Kacheln frei', () => {
    const { controller } = newController();
    controller.config.features.moveBuildings = true; // Dev-Flag: alles verschiebbar
    setLevel(controller, 6);
    controller.state.resources = { money: 2_000_000, wood: 2_000, stone: 1_000, food: 500, freshwater: 0 };
    for (let dx = 3; dx <= 10; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    controller.placeBuilding('house_small', at(4, 6).x, at(4, 6).y);
    controller.update(T0 + HOUR); // fertig bauen
    const house = Object.values(controller.state.buildings).find((b) => b.defId === 'house_small')!;
    // Upgrade starten + abschließen → upgradeLevel 1.
    expect(controller.upgradeBuilding(house.id).ok).toBe(true);
    controller.update(T0 + 2 * HOUR);
    expect(house.upgradeLevel).toBe(1);

    const from = { x: house.x, y: house.y };
    const to = at(8, 6);
    expect(controller.moveBuilding(house.id, to.x, to.y).ok).toBe(true);
    // Zustand erhalten …
    expect(house.upgradeLevel).toBe(1);
    expect(house.status).toBe('active');
    expect({ x: house.x, y: house.y }).toEqual({ x: to.x, y: to.y });
    // … alte Fläche frei (dort wäre neu bauen wieder gültig) …
    expect(controller.placementDiagnostics('house_small', from.x, from.y)!.valid).toBe(true);
    // … neue Fläche belegt.
    expect(controller.placementDiagnostics('house_small', to.x, to.y)!.valid).toBe(false);
  });
});

describe('Upgrade lässt Werte NICHT auf null fallen (§ C4/16)', () => {
  it('ein Versorgungsgebäude versorgt während des Upgrades weiter', () => {
    const { controller } = newController();
    setLevel(controller, 6); // well-Upgrade (Tiefbrunnen) ist ab L6 verfügbar
    controller.state.resources = { money: 2_000_000, wood: 2_000, stone: 1_000, food: 500, freshwater: 0 };
    for (let dx = 3; dx <= 8; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    controller.placeBuilding('well', at(3, 6).x, at(3, 6).y);
    controller.placeBuilding('house_small', at(5, 6).x, at(5, 6).y);
    controller.update(T0 + HOUR); // beide aktiv
    const well = Object.values(controller.state.buildings).find((b) => b.defId === 'well')!;

    const before = controller.getCoverageOverlay(well.id);
    expect(before).toBeDefined();
    expect(before!.sources.some((s) => s.selected)).toBe(true);
    const waterBefore = controller.derived.capacity.freshwater;

    // Upgrade starten → Status 'constructing' mit Zielstufe.
    expect(controller.upgradeBuilding(well.id).ok).toBe(true);
    expect(well.status).toBe('constructing');
    expect(isContributing(well)).toBe(true);

    // Während des Upgrades bleibt die Versorgung aktiv (kein Radius/Kapazität auf null).
    const during = controller.getCoverageOverlay(well.id);
    expect(during).toBeDefined();
    expect(during!.sources.some((s) => s.selected)).toBe(true);
    expect(controller.derived.capacity.freshwater).toBe(waterBefore);
  });
});
