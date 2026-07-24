import { describe, expect, it } from 'vitest';
import { nearTownHall, newController, refreshDerived } from './helpers.ts';
import { occupyTiles } from '../src/game/map/world.ts';

// § Spielbarkeit 9.1 / P-D (§11.2) — Straßenstart am isolierten Anleger-Landanker.
// Bisher brauchte eine neue Straße Anschluss an bestehende Straße/Distriktzentrum;
// hinter einer Wasserverbindung kam man deshalb nicht weiter. Jetzt sät ein Anleger/
// Hafen (waterfront) den Straßenstart wie ein Distriktzentrum — ein lokales Netz
// entsteht, auch ohne Anschluss ans Hauptnetz.

const at = (dx: number, dy: number) => nearTownHall(dx, dy);

/** Setzt einen aktiven Anleger direkt in den State (Platzierungslogik umgangen —
 *  getestet wird nur die Straßen-Start-Regel, nicht die Waterfront-Platzierung). */
function injectDock(controller: ReturnType<typeof newController>['controller'], x: number, y: number): string {
  const id = 'test_dock';
  controller.state.buildings[id] = { id, defId: 'dock_small', x, y, upgradeLevel: 0, status: 'active' };
  occupyTiles(controller.state, x, y, 2, 2, id);
  refreshDerived(controller);
  return id;
}

describe('§ P-D Anlegernetz — Straßenstart am isolierten Anleger (§11.2)', () => {
  it('erlaubt eine Straße an der Landkante eines isolierten Anlegers', () => {
    const { controller } = newController(); // flach + Startregion
    const dock = at(16, 16);
    injectDock(controller, dock.x, dock.y);
    // Kachel direkt über der Anleger-Oberkante — isoliert vom Hauptnetz, aber am
    // Anleger-Landanker → gültig.
    const res = controller.placeBuilding('road', dock.x, dock.y - 1);
    expect(res).toEqual({ ok: true });
  });

  it('lehnt eine Straße ohne jeden Anschluss weiterhin ab (needs_road)', () => {
    const { controller } = newController();
    // Weit entfernt von Startstraßen, Distriktzentrum und jedem Anleger.
    const far = at(20, 20);
    const res = controller.placeBuilding('road', far.x, far.y);
    expect(res).toEqual({ ok: false, error: 'needs_road' });
  });

  it('von der Anleger-Straße lässt sich das lokale Netz weiterbauen', () => {
    const { controller } = newController();
    const dock = at(16, 16);
    injectDock(controller, dock.x, dock.y);
    expect(controller.placeBuilding('road', dock.x, dock.y - 1)).toEqual({ ok: true });
    // Anschluss an die eben gebaute (jetzt vernetzte) Straße.
    expect(controller.placeBuilding('road', dock.x + 1, dock.y - 1)).toEqual({ ok: true });
    expect(controller.placeBuilding('road', dock.x, dock.y - 2)).toEqual({ ok: true });
  });
});
