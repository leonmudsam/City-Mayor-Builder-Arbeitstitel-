import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/game/config/index.ts';
import { moveInPerMin } from '../src/game/simulation/tick.ts';
import { newController, nearTownHall, setLevel, T0 } from './helpers.ts';

const at = (dx: number, dy: number) => nearTownHall(dx, dy);
const HOUR = 3_600_000;

// § C7/§25: Eine zufriedene Stadt muss ihre Wohnkapazität nahezu ausschöpfen —
// nicht dauerhaft bei einem Bruchteil hängen bleiben. Testet die GETEILTE
// Zuzugsfunktion (dieselbe, die der Tick nutzt) auf Konvergenz.
describe('Bevölkerungs-Konvergenz (§ C7/§25)', () => {
  it('füllt eine große, zufriedene Stadt über die Zeit fast bis zur Kapazität', () => {
    const bal = loadConfig().balancing;
    const cap = 45_000;
    const happiness = 95;
    let pop = 0;
    // 2000 Ingame-Minuten simulieren (dt = 1 min je Schritt).
    for (let minute = 0; minute < 2000; minute++) {
      const free = cap - pop;
      if (free <= 0) break;
      pop = Math.min(cap, pop + moveInPerMin(bal, free, happiness));
    }
    // Eine glückliche Metropole erreicht praktisch ihre Kapazität, nicht nur einen Bruchteil.
    expect(pop).toBeGreaterThanOrEqual(cap * 0.95);
  });

  it('stagniert unterhalb der Zufriedenheitsschwelle (kein Zuzug erzwungen)', () => {
    const bal = loadConfig().balancing;
    // Unter der Schwelle liefert die Funktion nur den flachen Boden, kein Füllterm.
    const belowFloor = moveInPerMin(bal, 40_000, bal.growthHappinessThreshold - 5);
    expect(belowFloor).toBeLessThan(moveInPerMin(bal, 40_000, 99));
  });
});

// § C7/§26: Aktives Spiel — Wirtschaft läuft NUR im sichtbaren Live-Tick.
// Offline/versteckt dürfen nur Bauzeiten laufen, keine Produktion.
describe('Aktives Spiel: keine Offline-Produktion (§ C7/§26)', () => {
  it('produziert nur im Live-Tick, nicht im Offline-Catch-up', () => {
    const { controller } = newController();
    setLevel(controller, 4);
    setLevel(controller, 9);
    controller.state.resources = { money: 500_000, wood: 400, stone: 400, food: 0, freshwater: 0 };
    for (let dx = 1; dx <= 5; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    // § Active Operations 2.0 / A6+A7: Sägewerk, Steinbruch und Farm gewinnen ihre
    // Ware nur noch aktiv über Arbeiter (siehe operations.test.ts /
    // activeOperations.test.ts). Passive Produktion wird an der Bäckerei geprüft.
    expect(controller.placeBuilding('bakery', at(1, 6).x, at(1, 6).y).ok).toBe(true);
    // Bauzeit läuft auch offline ab (non-live) → Bäckerei wird aktiv.
    controller.update(T0 + HOUR, false);
    const bakery = Object.values(controller.state.buildings).find((b) => b.defId === 'bakery')!;
    expect(bakery.status).toBe('active');

    // Offline-Tick: KEINE Nahrungsproduktion.
    const foodBefore = controller.state.resources.food;
    controller.update(T0 + HOUR + 60_000, false);
    expect(controller.state.resources.food).toBe(foodBefore);

    // Live-Tick: Nahrung steigt.
    controller.update(T0 + HOUR + 120_000, true);
    expect(controller.state.resources.food).toBeGreaterThan(foodBefore);
  });
});
