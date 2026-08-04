import { describe, expect, it } from 'vitest';
import {
  analyseRoute,
  analyseManualRoute,
  analyseActivityRouteFrom,
  computeRoadBusyness,
  forecastRouteTraffic,
  targetOrderOnPath,
  type RouteAnalysisInput,
} from '../src/game/activities/routeAnalysis.ts';
import { newController, nearTownHall, setLevel } from './helpers.ts';

// Baut eine gerade Straßenlinie als Kachel-Set (Spalte x=cx, y in [y0,y1]).
function roadColumn(cx: number, y0: number, y1: number): Set<string> {
  const s = new Set<string>();
  for (let y = y0; y <= y1; y++) s.add(`${cx},${y}`);
  return s;
}

describe('routeAnalysis — reine Domain-Funktion (§ C2)', () => {
  const roads = roadColumn(0, 0, 10);
  const base: RouteAnalysisInput = {
    source: { id: 'source', x: 0, y: 0 },
    targets: [
      { id: 'a', x: 0, y: 5 },
      { id: 'b', x: 0, y: 10 },
    ],
    roadNetwork: roads,
    busyness: new Map(),
  };

  it('ist deterministisch (gleiche Eingabe → identisches Ergebnis)', () => {
    expect(analyseRoute(base)).toEqual(analyseRoute(base));
  });

  it('findet echte Straßenpfade und misst die Kachelstrecke', () => {
    const r = analyseRoute(base);
    expect(r.segments).toHaveLength(2);
    expect(r.segments.every((s) => s.onRoad)).toBe(true);
    expect(r.roadCoverage).toBe(1);
    // 0→5 und 5→10 entlang der Spalte = 5 + 5 Kacheln.
    expect(r.distanceTiles).toBeCloseTo(10, 5);
    expect(r.estimatedDurationMs).toBeGreaterThan(0);
    // Gerade Linie ⇒ keine Kreuzungen.
    expect(r.intersections).toBe(0);
  });

  it('bewertet eine schlechtere Stoppreihenfolge mit geringerer Effizienz', () => {
    const good = analyseRoute(base); // 0 → 5 → 10 (aufsteigend)
    const bad = analyseRoute({
      ...base,
      targets: [
        { id: 'b', x: 0, y: 10 },
        { id: 'a', x: 0, y: 5 },
      ],
    }); // 0 → 10 → 5 (Umweg)
    expect(good.efficiencyScore).toBeGreaterThan(bad.efficiencyScore);
    expect(good.distanceTiles).toBeLessThan(bad.distanceTiles);
  });

  it('fällt ohne Straßennetz sauber auf bestrafte Luftlinie zurück (kein Crash)', () => {
    const r = analyseRoute({ ...base, roadNetwork: new Set() });
    expect(r.segments.every((s) => !s.onRoad)).toBe(true);
    expect(r.roadCoverage).toBe(0);
    expect(Number.isFinite(r.estimatedDurationMs)).toBe(true);
    expect(r.estimatedDurationMs).toBeGreaterThan(0);
  });

  it('erhöht Verkehrslast und Fahrzeit bei dichter Anrainerbebauung', () => {
    const busy = new Map<string, number>();
    for (let y = 0; y <= 10; y++) busy.set(`0,${y}`, 8); // alle Kacheln „voll"
    const calm = analyseRoute(base);
    const jam = analyseRoute({ ...base, busyness: busy });
    expect(jam.segments[0]!.load).toBeGreaterThan(calm.segments[0]!.load);
    expect(jam.estimatedDurationMs).toBeGreaterThan(calm.estimatedDurationMs);
    expect(jam.congestionRisk).toBe('high');
  });

  it('deckelt den Belohnungs-Prognosefaktor auf [0.85, 1.2]', () => {
    for (const r of [analyseRoute(base), analyseRoute({ ...base, roadNetwork: new Set() })]) {
      expect(r.rewardMultiplier).toBeGreaterThanOrEqual(0.85);
      expect(r.rewardMultiplier).toBeLessThanOrEqual(1.2);
    }
  });

  it('akzeptiert nur eine lückenlose, manuell gezeichnete Quelle→Ziele-Kette', () => {
    const manualPath = Array.from({ length: 11 }, (_, y) => ({ x: 0, y }));
    const result = analyseManualRoute(base, manualPath);
    expect(result).toBeDefined();
    expect(result!.segments).toHaveLength(2);
    expect(result!.segments.flatMap((segment) => segment.path).some((point) => point.y === 7)).toBe(true);
    expect(result!.distanceTiles).toBeCloseTo(10, 5);

    // Sprung über eine Kachel: kein stilles Auto-Routing.
    expect(analyseManualRoute(base, [{ x: 0, y: 0 }, { x: 0, y: 2 }, { x: 0, y: 5 }, { x: 0, y: 10 }])).toBeUndefined();
    // Falsche Zielreihenfolge und ein Nachspiel nach dem letzten Ziel sind ungültig.
    expect(analyseManualRoute(base, [...manualPath].reverse())).toBeUndefined();
    expect(analyseManualRoute(base, [...manualPath, { x: 0, y: 9 }])).toBeUndefined();
  });

  it('leitet die Zielreihenfolge ausschließlich aus dem gezeichneten Weg ab', () => {
    const anchors = {
      source: { x: 0, y: 0 },
      targets: [
        { id: 'spät', x: 0, y: 6 },
        { id: 'zuerst', x: 0, y: 2 },
        { id: 'danach', x: 0, y: 4 },
      ],
    };
    const path = Array.from({ length: 7 }, (_, y) => ({ x: 0, y }));
    expect(targetOrderOnPath(anchors, ['spät', 'zuerst', 'danach'], path)).toEqual(['zuerst', 'danach', 'spät']);
    expect(targetOrderOnPath(anchors, ['spät', 'zuerst', 'danach'], path.slice(0, 4))).toEqual(['zuerst']);
  });
});

describe('routeAnalysis — Controller-Integration (§ C2)', () => {
  const at = (dx: number, dy: number) => nearTownHall(dx, dy);

  function cityWithRoute() {
    const { controller } = newController();
    setLevel(controller, 12);
    controller.state.resources = { money: 5_000_000, wood: 5_000, stone: 5_000, food: 5_000, freshwater: 0, planks: 0, cut_stone: 0 };
    // Start-Straßenzeile (y+5) nach Osten verlängern.
    for (let dx = 5; dx <= 12; dx++) controller.placeBuilding('road', at(dx, 5).x, at(dx, 5).y);
    // Zwei Wohnhäuser an die Straße legen.
    controller.placeBuilding('house_small', at(6, 6).x, at(6, 6).y);
    controller.placeBuilding('house_small', at(10, 6).x, at(10, 6).y);
    const houses = Object.values(controller.state.buildings).filter((b) => b.defId === 'house_small');
    return { controller, houseIds: houses.map((h) => h.id) };
  }

  it('liefert eine Straßen-basierte Analyse und ist deterministisch', () => {
    const { controller, houseIds } = cityWithRoute();
    expect(houseIds.length).toBeGreaterThanOrEqual(2);
    const source = { id: 'source', x: at(0, 5).x, y: at(0, 5).y };
    const a = analyseActivityRouteFrom(controller.state, controller.config, controller.derived, source, houseIds);
    const b = analyseActivityRouteFrom(controller.state, controller.config, controller.derived, source, houseIds);
    expect(a).toBeDefined();
    expect(a).toEqual(b);
    expect(a!.roadCoverage).toBeGreaterThan(0); // echte Straßenverbindung genutzt
  });

  it('busyness zählt nur Anrainer der echten Straßenkacheln', () => {
    const { controller } = cityWithRoute();
    const busy = computeRoadBusyness(controller.state, controller.config, controller.derived.roadNetwork);
    // Mindestens eine Straßenkachel hat ein anliegendes Wohnhaus.
    expect([...busy.values()].some((n) => n > 0)).toBe(true);
    // Keine Nicht-Straßen-Kachel taucht als Schlüssel auf.
    for (const k of busy.keys()) expect(controller.derived.roadNetwork.has(k)).toBe(true);
  });

  it('gibt undefined für unbekannte Aktivitäten zurück', () => {
    const { controller } = cityWithRoute();
    expect(controller.analyseActivityRoute('does_not_exist', [])).toBeUndefined();
  });
});

// § Overhaul 8.0 / §9 — Die Verkehrslast darf während der Planung nicht
// dauerhaft „Wird geprüft" anzeigen. Sie hing früher an `analysis`, die es erst
// bei vollständig verbundener Zielkette gab. Die Prognose bewertet jetzt exakt
// den bereits gezeichneten Weg.
describe('forecastRouteTraffic — Prognose ab der ersten Kachel (§9)', () => {
  const roads = roadColumn(0, 0, 10);
  const path = [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
  ];

  it('liefert auch für einen Teilweg ein vollständiges Ergebnis', () => {
    const forecast = forecastRouteTraffic(path, roads, new Map());
    expect(forecast.level).toBe('low');
    expect(forecast.averageSpeedFactor).toBe(1);
    expect(forecast.expectedDelaySeconds).toBe(0);
    expect(forecast.criticalSegments).toEqual([]);
  });

  it('ist deterministisch', () => {
    const busy = new Map([['0,1', 6]]);
    expect(forecastRouteTraffic(path, roads, busy)).toEqual(forecastRouteTraffic(path, roads, busy));
  });

  it('erkennt stark belastete Kacheln als Problemabschnitte', () => {
    const busy = new Map([
      ['0,0', 6],
      ['0,1', 6],
      ['0,2', 6],
    ]);
    const forecast = forecastRouteTraffic(path, roads, busy);
    expect(forecast.totalLoad).toBe(1);
    expect(forecast.criticalSegments).toEqual(['0,0', '0,1', '0,2']);
    expect(forecast.level).toBe('critical');
    expect(forecast.averageSpeedFactor).toBeLessThan(1);
    expect(forecast.expectedDelaySeconds).toBeGreaterThan(0);
  });

  it('bestraft ein schwerfälliges, breites Fahrzeug in vollen Straßen stärker', () => {
    const busy = new Map([
      ['0,0', 4],
      ['0,1', 4],
      ['0,2', 4],
    ]);
    const nimble = forecastRouteTraffic(path, roads, busy, { handling: 5, narrowStreetPenalty: 0 });
    const heavy = forecastRouteTraffic(path, roads, busy, { handling: 1, narrowStreetPenalty: 0.6 });
    expect(heavy.averageSpeedFactor).toBeLessThan(nimble.averageSpeedFactor);
    expect(heavy.expectedDelaySeconds).toBeGreaterThan(nimble.expectedDelaySeconds);
  });

  it('bleibt bei leerem Weg neutral', () => {
    const forecast = forecastRouteTraffic([], roads, new Map());
    expect(forecast.level).toBe('low');
    expect(forecast.totalLoad).toBe(0);
  });
});
