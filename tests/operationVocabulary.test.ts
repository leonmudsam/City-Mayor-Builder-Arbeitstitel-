import { describe, it, expect } from 'vitest';
import { nodeVocabulary } from '../src/components/operations/nodeVocabulary.ts';
import { OPERATION_IDLE_REASONS } from '../src/game/operations/operations.ts';
import { RESOURCE_NODE_PROFILES } from '../src/game/operations/nodes.ts';
import { buildingsConfig } from '../src/game/config/buildings.config.ts';
import type { ResourceNodeType } from '../src/game/types.ts';
import { t } from '../src/i18n/index.ts';

/**
 * `t()` gibt bei fehlendem Eintrag den Schlüssel zurück — dann steht im Spiel
 * wörtlich `ui.operation.idle.deposit_exhausted` auf dem Bildschirm. Genau so ist
 * der Fehler entstanden, den diese Datei absichert.
 */
const resolves = (key: string): boolean => t(key) !== key && t(key).length > 0;

describe('§A6/A7 — jede Betriebsmeldung hat einen Text', () => {
  // Die Liste kommt aus der Simulation, nicht aus diesem Test (D-042): ein neuer
  // Leerlaufgrund fällt dadurch hier auf und nicht erst im Spiel.
  it.each(OPERATION_IDLE_REASONS)('Leerlaufgrund "%s" ist übersetzt', (reason) => {
    expect(resolves(`ui.operation.idle.${reason}`)).toBe(true);
  });

  it('unterscheidet erschöpftes Vorkommen sprachlich vom Nachwachsen', () => {
    // Beide Zustände sehen im Betrieb gleich aus (nichts passiert), bedeuten aber
    // das Gegenteil: einmal warten, einmal umziehen.
    expect(t('ui.operation.idle.deposit_exhausted')).not.toBe(t('ui.operation.idle.waiting_for_regrowth'));
  });

  it('jeder Knotentyp mit Profil hat ein vollständiges Wortfeld', () => {
    const types = Object.keys(RESOURCE_NODE_PROFILES) as ResourceNodeType[];
    expect(types.length).toBeGreaterThan(0);
    for (const type of types) {
      const vocabulary = nodeVocabulary(type);
      for (const [field, text] of Object.entries(vocabulary)) {
        expect(text, `${type}.${field}`).not.toMatch(/^ui\./);
        expect(text.length, `${type}.${field}`).toBeGreaterThan(0);
      }
    }
  });

  it('nennt Baum, Fels und Feld verschieden — sonst redet jeder Betrieb vom Sägewerk', () => {
    const tree = nodeVocabulary('tree');
    const rock = nodeVocabulary('rock');
    const crop = nodeVocabulary('crop');
    expect(new Set([tree.plural, rock.plural, crop.plural]).size).toBe(3);
    expect(new Set([tree.emptyArea, rock.emptyArea, crop.emptyArea]).size).toBe(3);
    expect(tree.inRange).toContain(tree.plural);
    expect(rock.inRange).toContain(rock.plural);
  });

  it('deckt auch noch unbelegte Knotentypen ab, ohne etwas zu erfinden', () => {
    // `livestock` hat kein Profil — der Typ existiert, der Betrieb nicht. Das
    // Wortfeld muss trotzdem auflösen (neutral), damit nie ein roher Schlüssel
    // erscheint, sobald ein solcher Betrieb dazukommt.
    const generic = nodeVocabulary('livestock');
    expect(generic.plural).not.toMatch(/^ui\./);
    expect(generic.plural).not.toBe(nodeVocabulary('tree').plural);
  });

  it('jeder aktive Betrieb im Katalog ist benannt (kein Betrieb ohne Wortfeld)', () => {
    const operations = buildingsConfig.filter((def) => def.operation);
    expect(operations.length).toBeGreaterThanOrEqual(3); // Sägewerk, Steinbruch, Farm
    for (const def of operations) {
      const vocabulary = nodeVocabulary(def.operation!.nodeType);
      expect(vocabulary.plural, def.id).not.toMatch(/^ui\./);
      expect(vocabulary.emptyArea, def.id).not.toMatch(/^ui\./);
    }
  });
});
