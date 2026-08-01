import { describe, expect, it } from 'vitest';
import { nearTownHall, newController } from './helpers.ts';
import { connectedRoadTiles, isConnectedToRoad } from '../src/game/buildings/placement.ts';
import type { GameController } from '../src/game/commands/controller.ts';
import type { BuildingDef } from '../src/game/config/types.ts';

// § Core Gameplay G2 ③ — der Anschlusspunkt der Platzierungsvorschau.
//
// Befund, der diesen Test nötig macht: 23 von 34 Gebäuden tragen `requiresRoad`,
// aber `needs_road` blockiert ausschließlich Straßen selbst. Ein
// `requiresRoad`-Gebäude ohne Anschluss ist also **baubar** — und liefert danach
// laut `isInfrastructureOperational` weder Produktion noch Kapazität noch
// Versorgung. Gemessen im Startzustand: von 3.721 geprüften Kacheln rund um das
// Rathaus sind 3.652 gültig UND ohne Anschluss, denn die Startstadt hat genau
// fünf Straßenkacheln. Der Ghost war dort grün und das Gebäude danach still.
//
// Die Vorschau zeigt deshalb jetzt die echten Anschlusskacheln. Damit ein Marker
// niemals auf eine Kachel zeigen kann, die die Prüfung gar nicht zählt, teilen
// sich Anzeige und Prüfung **eine** Aufzählung (`connectedRoadTiles`) — dieselbe
// Disziplin wie D-042.

/** Ein ab Level 1 baubares Gebäude, das eine Straße braucht (heute `house_small`). */
function roadDependentDef(controller: GameController): BuildingDef {
  const def = [...controller.config.buildings.values()].find(
    (candidate) =>
      candidate.requiresRoad === true &&
      candidate.waterfront === undefined &&
      candidate.category !== 'roads' &&
      (candidate.unlockLevel ?? 1) <= 1,
  );
  if (!def) throw new Error('Test: kein ab L1 baubares requiresRoad-Gebäude in der Config');
  return def;
}

/** Irgendeine Kachel des bestehenden Startnetzes — nicht hart kodiert. */
function anyRoadTile(controller: GameController): { x: number; y: number } {
  const first = [...controller.derived.roadNetwork][0];
  if (!first) throw new Error('Test: die Startstadt hat kein Straßennetz');
  const [x, y] = first.split(',').map(Number);
  return { x: x!, y: y! };
}

describe('§ G2 ③ — connectedRoadTiles ist die einzige Aufzählung', () => {
  it('nennt genau die Straßenkacheln, die orthogonal ans Footprint grenzen', () => {
    const { controller } = newController();
    const def = roadDependentDef(controller);
    const road = anyRoadTile(controller);
    // Footprint so legen, dass seine Unterkante genau auf dieser Straße sitzt.
    const spot = { x: road.x, y: road.y - def.size.h };

    const tiles = connectedRoadTiles(controller.derived, def, spot.x, spot.y);
    expect(tiles).toContainEqual(road);
    // Jede genannte Kachel gehört wirklich zum verbundenen Netz — kein Marker
    // auf einer Kachel, die die Prüfung nicht zählt.
    for (const tile of tiles) {
      expect(controller.derived.roadNetwork.has(`${tile.x},${tile.y}`)).toBe(true);
    }
    // Und keine Kachel doppelt: die Ecken dürfen nicht zweimal gezählt werden.
    expect(new Set(tiles.map((tile) => `${tile.x},${tile.y}`)).size).toBe(tiles.length);
  });

  it('liefert eine leere Liste, wo kein Netz angrenzt', () => {
    const { controller } = newController();
    const def = roadDependentDef(controller);
    const far = nearTownHall(24, 24);
    expect(connectedRoadTiles(controller.derived, def, far.x, far.y)).toEqual([]);
  });

  it('isConnectedToRoad stimmt mit der Liste überein — in beide Richtungen', () => {
    const { controller } = newController();
    const def = roadDependentDef(controller);
    let withRoad = 0;
    let without = 0;
    for (let dx = -12; dx <= 12; dx += 2) {
      for (let dy = -12; dy <= 12; dy += 2) {
        const spot = nearTownHall(dx, dy);
        const tiles = connectedRoadTiles(controller.derived, def, spot.x, spot.y);
        expect(isConnectedToRoad(controller.derived, def, spot.x, spot.y)).toBe(tiles.length > 0);
        if (tiles.length > 0) withRoad++;
        else without++;
      }
    }
    // Der Streifen muss beide Fälle enthalten, sonst prüft die Schleife nur einen.
    expect(withRoad).toBeGreaterThan(0);
    expect(without).toBeGreaterThan(0);
  });
});

describe('§ G2 ③ — placementDiagnostics macht den Anschluss sichtbar', () => {
  it('spiegelt roadAccess exakt auf roadTiles', () => {
    const { controller } = newController();
    const def = roadDependentDef(controller);
    for (let dx = -9; dx <= 9; dx += 3) {
      for (let dy = -9; dy <= 9; dy += 3) {
        const spot = nearTownHall(dx, dy);
        const diagnostics = controller.placementDiagnostics(def.id, spot.x, spot.y);
        expect(diagnostics).toBeDefined();
        expect(diagnostics!.roadAccess).toBe(diagnostics!.roadTiles.length > 0);
      }
    }
  });

  it('meldet requiresRoad für ein Gebäude, das ohne Straße nicht arbeitet', () => {
    const { controller } = newController();
    const def = roadDependentDef(controller);
    const spot = nearTownHall(5, 5);
    expect(controller.placementDiagnostics(def.id, spot.x, spot.y)!.requiresRoad).toBe(true);
  });

  it('der kritische Fall: gültig UND ohne Anschluss — genau hier warnt die Vorschau', () => {
    const { controller } = newController();
    const def = roadDependentDef(controller);
    const spot = nearTownHall(12, 12);
    const diagnostics = controller.placementDiagnostics(def.id, spot.x, spot.y)!;
    // Dieser Zustand ist der ganze Grund für G2 ③: die Platzierung ist erlaubt,
    // das Gebäude bliebe aber ohne Wirkung. Verschwindet er einmal (weil
    // `requiresRoad` die Platzierung blockiert), ist die Warnung überflüssig —
    // dann gehört dieser Test angepasst, nicht gelöscht.
    expect(diagnostics.valid).toBe(true);
    expect(diagnostics.requiresRoad).toBe(true);
    expect(diagnostics.roadAccess).toBe(false);
    expect(diagnostics.roadTiles).toEqual([]);
  });

  it('am Netz kehrt sich die Warnung um — Anschluss vorhanden, Kachel benannt', () => {
    const { controller } = newController();
    const def = roadDependentDef(controller);
    const road = anyRoadTile(controller);
    const diagnostics = controller.placementDiagnostics(def.id, road.x, road.y - def.size.h)!;
    expect(diagnostics.roadAccess).toBe(true);
    expect(diagnostics.roadTiles).toContainEqual(road);
  });
});
