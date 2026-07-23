import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/game/config/index.ts';
import { objectiveTarget } from '../src/game/simulation/quests.ts';
import de from '../src/i18n/de.json' with { type: 'json' };

// § Overhaul 8.0 / §22 — Aufgabentext, Fortschrittsbalken und Abschlussprüfung
// MÜSSEN denselben Wert nutzen. Der gemeldete Fehler war ein Anliegen mit dem
// Text „Lass deine Stadt auf 80 Einwohner wachsen" und einem Fortschritt von
// 1.600/1.600 — ein ×20-Rest aus der Bevölkerungsskalierung, der nur im
// deutschen Text stehen geblieben war.
//
// Der Test ist bewusst hart: JEDE Zahl in einer Quest-Beschreibung muss einem
// echten Zielwert derselben Quest entsprechen. Neue Anliegen können deshalb
// nicht mehr mit erfundenen Zahlen einchecken.

const texts = de as Record<string, string>;

/** Alle Zahlen eines Textes, deutsche Tausenderpunkte eingerechnet. */
function numbersIn(text: string): number[] {
  return [...text.matchAll(/\d+(?:\.\d{3})*/g)].map((match) => Number(match[0].replace(/\./g, '')));
}

describe('Questtexte und Zielwerte (§22)', () => {
  const config = loadConfig();

  it('jede Zahl im Aufgabentext ist ein echter Zielwert derselben Quest', () => {
    const drifted: string[] = [];
    for (const quest of config.questList) {
      const description = texts[quest.descriptionKey];
      expect(description, `Beschreibung fehlt: ${quest.descriptionKey}`).toBeTypeOf('string');
      const targets = new Set(quest.objectives.map(objectiveTarget));
      for (const number of numbersIn(description!)) {
        if (!targets.has(number)) {
          drifted.push(`${quest.id}: „${description}" nennt ${number}, Ziele sind ${[...targets].join(', ')}`);
        }
      }
    }
    expect(drifted, `Text und Zielwert weichen ab:\n${drifted.join('\n')}`).toEqual([]);
  });

  it('jede Quest besitzt Titel und Beschreibung', () => {
    for (const quest of config.questList) {
      expect(texts[quest.titleKey], quest.titleKey).toBeTruthy();
      expect(texts[quest.descriptionKey], quest.descriptionKey).toBeTruthy();
    }
  });

  it('objectiveTarget liefert für jedes Ziel einen positiven Wert', () => {
    for (const quest of config.questList) {
      for (const objective of quest.objectives) {
        expect(objectiveTarget(objective), `${quest.id}/${objective.type}`).toBeGreaterThan(0);
      }
    }
  });
});
