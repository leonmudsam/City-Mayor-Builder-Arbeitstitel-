import { describe, expect, it } from 'vitest';
import { regionsConfig } from '../src/game/config/regions.config.ts';
import { derivedRegionCost, regionCostFactors } from '../src/game/regions/regionCost.ts';
import { BAKED_REGIONS, REGION_COUNT } from '../src/game/config/startRegion.config.ts';

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

  it('die Endgame-Region liegt im Auftragskorridor §7.3 (5,5–8 Mio.)', () => {
    const endgame = [...regionsConfig].sort((a, b) => b.unlockLevel - a.unlockLevel)[0]!;
    expect(endgame.unlockCost).toBeGreaterThanOrEqual(5_500_000);
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

describe('Regionsstruktur der final verdichteten Insel', () => {
  it('besitzt genau eine Startregion und zwölf Freischaltungen', () => {
    expect(regionsConfig).toHaveLength(REGION_COUNT);
    expect(REGION_COUNT).toBe(13);
    const start = regionsConfig.filter((def) => def.unlockLevel <= 1);
    expect(start).toHaveLength(1);
    expect(regionsConfig.filter((def) => def.unlockable && def.unlockLevel > 1)).toHaveLength(12);
  });

  it('deckt jede gebackene Region genau einmal ab', () => {
    const ids = regionsConfig.map((def) => def.id).sort((a, b) => a - b);
    expect(ids).toEqual(BAKED_REGIONS.map((region) => region.id).sort((a, b) => a - b));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('enthält keine bedeutungslose Kleinregion', () => {
    // §4.2: Regionen, deren Freischaltung nur ein paar Kacheln liefert, wurden
    // zusammengeführt. Jede Freischaltung muss echten Bauwert besitzen.
    for (const def of regionsConfig) {
      if (def.unlockLevel <= 1) continue;
      expect(def.buildableTiles, `Region ${def.id}`).toBeGreaterThanOrEqual(700);
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
    for (const def of regionsConfig) {
      const baked = BAKED_REGIONS[def.id - 1]!;
      if (baked.adjacent.length === 0 && def.unlockLevel > 1) {
        expect(def.requiresHarbor, `Region ${def.id} hat keinen Landnachbarn`).toBe(true);
      }
    }
  });
});
