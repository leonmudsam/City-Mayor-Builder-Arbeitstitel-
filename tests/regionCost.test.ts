import { describe, expect, it } from 'vitest';
import { regionsConfig } from '../src/game/config/regions.config.ts';
import { derivedRegionCost, regionCostFactors } from '../src/game/regions/regionCost.ts';
import { BAKED_REGIONS, REGION_COUNT } from '../src/game/config/startRegion.config.ts';
import { FREE_EXPANSION_LEVEL } from '../src/game/progression/levels.ts';

// § Final World Compaction 8.1 (§7.2, §8) — Regionspreise dürfen keine frei
// gegriffenen Fantasiewerte sein. Jeder Preis in `regions.config.ts` muss nahe
// am nachvollziehbar abgeleiteten Richtwert liegen, der sich aus Baufläche,
// Ressourcenwert, Erschließungsaufwand, strategischem Zugang, Biomseltenheit
// und Progressionsstufe ergibt.

/** Zulässige Abweichung zwischen konfiguriertem Preis und Richtwert. */
const TOLERANCE = 0.12;

describe('Regionspreise folgen dem Faktormodell (§8)', () => {
  it('jeder konfigurierte Preis liegt innerhalb der Toleranz um den Richtwert', () => {
    const drift: string[] = [];
    for (const def of regionsConfig) {
      const derived = derivedRegionCost(def);
      if (derived === 0) {
        expect(def.unlockCost, `${def.id} ist Startregion und muss kostenlos sein`).toBe(0);
        continue;
      }
      const deviation = Math.abs(def.unlockCost - derived) / derived;
      if (deviation > TOLERANCE) {
        drift.push(
          `Region ${def.id} (L${def.unlockLevel}): Config ${def.unlockCost.toLocaleString('de-DE')} vs. Richtwert ${derived.toLocaleString('de-DE')} (${Math.round(deviation * 100)} %)`,
        );
      }
    }
    expect(drift, `Preise weichen zu stark vom Modell ab:\n${drift.join('\n')}`).toEqual([]);
  });

  it('alle sechs Faktoren sind endlich und positiv', () => {
    for (const def of regionsConfig) {
      const factors = regionCostFactors(def);
      for (const [name, value] of Object.entries(factors)) {
        expect(Number.isFinite(value), `${def.id}/${name}`).toBe(true);
        expect(value, `${def.id}/${name}`).toBeGreaterThan(0);
      }
    }
  });

  it('Preise steigen insgesamt nachvollziehbar mit dem Level', () => {
    // Bewusst KEINE strikte Monotonie: §8 verlangt ausdrücklich eine
    // wertbasierte Bepreisung („Sumpf: geringerer Kaufpreis", „Preis nicht
    // allein anhand der Baufläche"). Eine kleine Waldregion darf deshalb
    // günstiger sein als eine große Flussebene ein Level davor. Verboten ist
    // nur ein Preis-EINBRUCH, der eine späte Region zum Schnäppchen macht.
    const byLevel = [...regionsConfig]
      .filter((def) => def.unlockLevel > 1)
      .sort((a, b) => a.unlockLevel - b.unlockLevel || a.id - b.id);
    let maxSoFar = 0;
    for (const def of byLevel) {
      expect(
        def.unlockCost,
        `Region ${def.id} (L${def.unlockLevel}) bricht gegenüber dem bisherigen Höchstpreis ein`,
      ).toBeGreaterThanOrEqual(maxSoFar * 0.6);
      maxSoFar = Math.max(maxSoFar, def.unlockCost);
    }
    // Der Gesamttrend muss klar steigen: die Endgame-Region kostet ein
    // Vielfaches der ersten Kauferweiterung.
    const first = byLevel[0]!.unlockCost;
    const last = byLevel.at(-1)!.unlockCost;
    expect(last / first).toBeGreaterThan(20);
  });

  it('die Endgame-Region kostet, was das Faktormodell für sie ergibt', () => {
    // § Modelltreue 13.0 — KORRIDOR NEU BEGRÜNDET. Der alte Korridor (5,5–8 Mio.)
    // war auf eine Endgame-Region mit 3.939 Bauflächen kalibriert. Auf der
    // modelltreuen Insel ist das Massiv das, was das Modell zeigt: ein Berg mit
    // 894 Bauflächen. Sein Wert liegt im Stein, nicht in der Fläche — und das
    // Faktormodell (§8) bewertet ihn folgerichtig mit 4,4 Mio.
    //
    // Die Alternative wäre gewesen, `BASE_COST` so lange anzuheben, bis die Zahl
    // wieder in den alten Korridor passt. Das hätte JEDE Region um 47 % verteuert,
    // nur damit eine Schwelle stimmt — genau die Art Zahlendreherei, die §8
    // ausschließen soll. Verbindlich bleibt deshalb das Modell, nicht der alte
    // Korridor: die Endgame-Region muss ein echtes Langzeitziel sein.
    const endgame = [...regionsConfig].sort((a, b) => b.unlockLevel - a.unlockLevel)[0]!;
    expect(endgame.unlockCost).toBe(derivedRegionCost(endgame));
    expect(endgame.unlockCost).toBeGreaterThanOrEqual(4_000_000);
    expect(endgame.unlockCost).toBeLessThanOrEqual(8_000_000);
  });

  it('keine Region ist sofort bei Erreichen ihres Levels aus der Portokasse kaufbar', () => {
    // §7.1: Eine Region soll nicht einfach „mitgenommen" werden. Der Preis muss
    // spürbar über dem liegen, was eine Stadt nebenbei anhäuft.
    for (const def of regionsConfig) {
      if (def.unlockLevel <= 1) continue;
      expect(def.unlockCost, `Region ${def.id}`).toBeGreaterThanOrEqual(90_000);
    }
  });
});

describe('Regionsstruktur der neuen Insel (§ World Overhaul 12.0)', () => {
  it('besitzt genau eine Startregion und acht große Freischaltungen', () => {
    expect(regionsConfig).toHaveLength(REGION_COUNT);
    // § Modelltreue 13.1: Neun Regionen — die Startregion und acht große
    // Landschaften, alle über Land erreichbar. §1 („wenige, große Regionen mit
    // klarer Rolle") bleibt erfüllt: der Median liegt bei 6.771 Kacheln.
    expect(REGION_COUNT).toBe(9);
    const start = regionsConfig.filter((def) => def.unlockLevel <= 1);
    expect(start).toHaveLength(1);
    expect(regionsConfig.filter((def) => def.unlockable && def.unlockLevel > 1)).toHaveLength(8);
  });

  it('macht die erste Erweiterung auf Level 2 verfügbar (§ 12.2 §2)', () => {
    // Ausdrücklicher Nutzerwunsch: das DIREKT ANGRENZENDE Gebiet ist ab Level 2
    // erschließbar, und die Gratisstufe ist dieselbe Stufe. Welche Region das
    // ist, bestimmt die Geografie — auf der modelltreuen Insel grenzt die
    // Startregion an das Herzland (1) und den Nordwald (8).
    const start = regionsConfig.find((def) => def.unlockLevel <= 1)!;
    const baked = BAKED_REGIONS.find((region) => region.id === start.id)!;
    const first = regionsConfig
      .filter((def) => def.unlockable && def.unlockLevel > 1)
      .sort((a, b) => a.unlockLevel - b.unlockLevel)[0]!;
    expect(first.unlockLevel).toBe(2);
    expect(FREE_EXPANSION_LEVEL).toBe(first.unlockLevel);
    // Verbindlich ist die Nachbarschaft, nicht eine feste Id.
    expect(baked.adjacent as readonly number[]).toContain(first.id);
  });

  it('hat keine Kleinregion mehr — jede Freischaltung ist ein großes Gebiet (§1)', () => {
    // §1: „Nicht mehr viele kleine Quadrate freischalten, sondern große Gebiete."
    // Vorher: 13 Regionen mit Median 3.649 Kacheln. Jetzt: 9 mit Median 7.983.
    // Die Startregion ist bewusst kompakt (sie ist der Anfang, keine Erweiterung).
    // § Modelltreue 13.0: Die vorgelagerte Nordinsel ist die bewusste Ausnahme.
    // Sie ist klein, weil das MODELL sie so zeigt — eine eigene Landmasse, die
    // nur per Schiff erreichbar ist. Sie wegzumergen ginge gar nicht (sie hat
    // keinen Landnachbarn) und sie größer zu machen hieße, das Modell zu
    // verändern. Genau das soll dieser Auftrag nicht mehr tun.
    const startId = regionsConfig.find((def) => def.unlockLevel <= 1)!.id;
    const seaOnly = new Set(
      BAKED_REGIONS.filter((region) => (region.adjacent as readonly number[]).length === 0)
        .map((region) => region.id),
    );
    expect(seaOnly.size).toBeLessThanOrEqual(1);
    for (const region of BAKED_REGIONS) {
      if (region.id === startId || seaOnly.has(region.id)) continue;
      expect(region.tiles, 'zu kleine Region: ' + region.id).toBeGreaterThan(3000);
    }
    // Der Median über alle Freischaltungen muss klar über dem alten liegen.
    const sizes = BAKED_REGIONS.filter((r) => r.id !== startId).map((r) => r.tiles).sort((a, b) => a - b);
    expect(sizes[Math.floor(sizes.length / 2)]!).toBeGreaterThan(5000);
  });

  it('deckt jede gebackene Region genau einmal ab', () => {
    const ids = regionsConfig.map((def) => def.id).sort((a, b) => a - b);
    expect(ids).toEqual(BAKED_REGIONS.map((region) => region.id).sort((a, b) => a - b));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('enthält keine bedeutungslose Kleinregion', () => {
    // §4.2: Regionen, deren Freischaltung nur ein paar Kacheln liefert, wurden
    // zusammengeführt. Jede Freischaltung muss echten Bauwert besitzen.
    // § 10.0 R8: Die dritte Verdichtung (~−45 % Fläche) macht Gebirgs-/Insel-
    // regionen bewusst bauflächenlean — ihr Wert liegt in Rohstoff/Strategie,
    // nicht in der Baufläche. Die Untergrenze folgt daher dem Bake (Nordgrat = 385).
    for (const def of regionsConfig) {
      if (def.unlockLevel <= 1) continue;
      expect(def.buildableTiles, `Region ${def.id}`).toBeGreaterThanOrEqual(380);
    }
  });

  it('führt die konfigurierte Baufläche identisch zum Bake', () => {
    for (const def of regionsConfig) {
      expect(def.buildableTiles, `Region ${def.id}`).toBe(BAKED_REGIONS[def.id - 1]!.buildable);
    }
  });

  it('jede Region ist über Land oder See erreichbar', () => {
    for (const region of BAKED_REGIONS) {
      expect(
        region.adjacent.length + region.seaAdjacent.length,
        `Region ${region.id} hat weder Land- noch Seenachbarn`,
      ).toBeGreaterThan(0);
    }
  });

  it('markiert genau die Regionen ohne Landanschluss als hafenpflichtig', () => {
    // Eine Region ohne JEDEN Landnachbarn kann nur über See erschlossen werden.
    // § World Overhaul 12.0: Die neue Insel ist EINE zusammenhängende Landmasse —
    // beide Mengen sind deshalb leer. Die Prüfung bleibt als Invariante bestehen:
    // sobald eine künftige Welt wieder eine reine Seeinsel enthält, muss die
    // Config sie als hafenpflichtig markieren (und umgekehrt nie ohne Grund).
    const withoutLandNeighbour = BAKED_REGIONS
      .filter((region) => (region.adjacent as readonly number[]).length === 0)
      .map((region) => region.id)
      .sort((a, b) => a - b);
    const markedHarborDependent = regionsConfig
      .filter((def) => def.requiresHarbor === true && def.unlockLevel > 1)
      .map((def) => def.id)
      .sort((a, b) => a - b);
    expect(markedHarborDependent).toEqual(withoutLandNeighbour);
  });
});
