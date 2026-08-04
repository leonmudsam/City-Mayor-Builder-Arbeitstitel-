import { describe, expect, it } from 'vitest';
import { newController, nearTownHall } from './helpers.ts';

// § C6/§18: reine Straßenplan-Vorschau (Validierung + Kosten, kein Sofortbau).
describe('roadPathPreview — Straßenplanung ohne Sofortbau (§ C6)', () => {
  const at = (dx: number, dy: number) => nearTownHall(dx, dy);

  it('validiert einen an das Netz anschließenden Pfad und summiert Kosten', () => {
    const { controller } = newController();
    controller.state.resources = { money: 500_000, wood: 500, stone: 200, food: 40, freshwater: 0, planks: 0, cut_stone: 0 };
    // Start-Straßen liegen bei y+5 (dx 0..4). Pfad nach Osten verlängert sie.
    const preview = controller.roadPathPreview([at(5, 5), at(6, 5), at(7, 5)]);
    expect(preview.valid).toBe(true);
    expect(preview.buildTiles).toBe(3);
    expect(preview.blocked).toBe(0);
    expect(preview.totalCost.money).toBeGreaterThan(0);
    expect(preview.tiles.every((t) => t.status === 'ok' || t.status === 'bridge')).toBe(true);
  });

  it('erkennt bereits vorhandene Straßen als kostenlos', () => {
    const { controller } = newController();
    const preview = controller.roadPathPreview([at(4, 5), at(5, 5)]);
    expect(preview.tiles[0]!.status).toBe('exists');
    expect(preview.tiles[0]!.cost).toEqual({});
    // Nur die neue Kachel zählt als Baukachel.
    expect(preview.buildTiles).toBe(1);
  });

  it('blockiert Kacheln ohne Anschluss an das Straßennetz', () => {
    const { controller } = newController();
    controller.state.resources = { money: 500_000, wood: 500, stone: 200, food: 40, freshwater: 0, planks: 0, cut_stone: 0 };
    const preview = controller.roadPathPreview([at(20, 20)]);
    expect(preview.valid).toBe(false);
    expect(preview.blocked).toBe(1);
    expect(preview.tiles[0]!.status).toBe('blocked');
    expect(preview.tiles[0]!.reason).toBe('needs_road');
  });

  it('verändert den Zustand nicht (reine Vorschau)', () => {
    const { controller } = newController();
    const before = Object.keys(controller.state.buildings).length;
    const moneyBefore = controller.state.resources.money;
    controller.roadPathPreview([at(5, 5), at(6, 5), at(7, 5)]);
    expect(Object.keys(controller.state.buildings).length).toBe(before);
    expect(controller.state.resources.money).toBe(moneyBefore);
  });
});
