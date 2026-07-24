import { describe, expect, it } from 'vitest';
import { newController, refreshDerived, setLevel } from './helpers.ts';
import { WORLD_TILES, terrainAt, regionIdAt, bakedSurfaceAt } from '../src/game/config/startRegion.config.ts';
import { validatePlacement } from '../src/game/buildings/placement.ts';
import { overrideTerrain } from '../src/game/map/world.ts';

// § Steinbruch auf Fels (Nutzerwunsch): der Steinbruch (`buildsOnRock`) darf auf
// sonst gesperrtem Gebirge stehen, solange es ein flaches Felsschelf ist —
// senkrechte Wände und Wasser bleiben gesperrt, normale Gebäude bleiben auf Fels
// gesperrt. Der Test nutzt echtes gebackenes Gebirge (kein Override-Flachland),
// weil genau die Bake-Steilheit die Trennlinie bildet.
describe('Steinbruch auf Fels (buildsOnRock)', () => {
  /** Erstes flaches, komplett gebirgiges 5×5-Feld in einer echten Region. */
  function findFlatMountain(): { x: number; y: number; region: number } | undefined {
    for (let y = 0; y + 5 <= WORLD_TILES; y++) {
      for (let x = 0; x + 5 <= WORLD_TILES; x++) {
        const region = regionIdAt(x, y);
        if (region === 0) continue;
        let ok = true;
        let maxSlope = 0;
        let minH = Infinity;
        let maxH = -Infinity;
        for (let dy = 0; dy < 5 && ok; dy++) {
          for (let dx = 0; dx < 5; dx++) {
            if (terrainAt(x + dx, y + dy) !== 'mountain' || regionIdAt(x + dx, y + dy) !== region) {
              ok = false;
              break;
            }
            const s = bakedSurfaceAt(x + dx, y + dy);
            maxSlope = Math.max(maxSlope, s.slope);
            minH = Math.min(minH, s.height);
            maxH = Math.max(maxH, s.height);
          }
        }
        if (ok && maxSlope <= 1.5 && maxH - minH <= 1.5) return { x, y, region };
      }
    }
    return undefined;
  }

  it('Die Insel hat flache Felsschelfe (sonst wäre das Feature unbaubar)', () => {
    expect(findFlatMountain()).toBeDefined();
  });

  it('Steinbruch baubar auf flachem Fels, Sägewerk nicht', () => {
    const spot = findFlatMountain();
    expect(spot).toBeDefined();
    const { controller, config } = newController(undefined, { flatten: false });
    setLevel(controller, 8);
    const region = controller.state.world.regions[String(spot!.region)];
    if (region) region.status = 'unlocked';
    refreshDerived(controller);

    const quarry = config.buildings.get('quarry')!;
    const sawmill = config.buildings.get('sawmill')!;
    // Steinbruch: erlaubter Fels-Untergrund → baubar.
    expect(validatePlacement(controller.state, config, controller.derived, quarry, spot!.x, spot!.y)).toBeUndefined();
    // Normales Produktionsgebäude ohne `buildsOnRock` → Gebirge bleibt gesperrt.
    expect(validatePlacement(controller.state, config, controller.derived, sawmill, spot!.x, spot!.y)).toBe('terrain');
  });

  it('Steinbruch bleibt auf Wasser gesperrt (kein Bau ins Meer)', () => {
    const spot = findFlatMountain();
    expect(spot).toBeDefined();
    const { controller, config } = newController(undefined, { flatten: false });
    setLevel(controller, 8);
    const region = controller.state.world.regions[String(spot!.region)];
    if (region) region.status = 'unlocked';
    // Eine Kachel des Felsschelfs zu Wasser machen → Steinbruch muss sperren.
    overrideTerrain(controller.state, spot!.x, spot!.y, 'water');
    refreshDerived(controller);

    const quarry = config.buildings.get('quarry')!;
    expect(validatePlacement(controller.state, config, controller.derived, quarry, spot!.x, spot!.y)).toBe('terrain');
  });
});
