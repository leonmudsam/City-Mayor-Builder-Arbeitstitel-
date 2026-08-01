// § A6/A7 — DAS WORTFELD EINES BETRIEBS AN EINER STELLE.
//
// Der Referenzschnitt war das Sägewerk, deshalb redete die gesamte Bedienung von
// „Bäumen": „Bäume in Reichweite", „Keine Bäume im Arbeitsgebiet", Knotenbeschriftung
// „Baum 12,44". Seit Steinbruch und Farm dieselbe Betriebsschleife nutzen, ist das
// schlicht falsch — ein Steinbruch hat keine Bäume.
//
// Statt die Wörter über die Komponenten zu verteilen, liefert dieses Modul das
// vollständige Wortfeld je Knotentyp. Neuer Knotentyp = ein Eintrag hier, und der
// Compiler erzwingt ihn (der Record ist über die geschlossene Union total).
//
// Reine Projektion auf i18n-Schlüssel: kein State, kein Controller, kein Renderer.

import type { ResourceNodeType } from '../../game/types.ts';
import { t } from '../../i18n/index.ts';

export interface NodeVocabulary {
  /** Ein Knoten: „Baum", „Felsvorkommen", „Feld". */
  singular: string;
  /** Mehrere Knoten: „Bäume", „Felsvorkommen", „Felder". */
  plural: string;
  /** „Bäume in Reichweite" — Beschriftung der Kennzahl im Gebäudefenster. */
  inRange: string;
  /** Fehlermeldung, wenn im Arbeitsgebiet nichts Bearbeitbares liegt. */
  emptyArea: string;
}

/**
 * Schlüsselpräfix je Knotentyp. `livestock`/`water_source`/`wild_plant` sind im
 * Typ vorgesehen, aber von keinem Betrieb belegt (kein Profil in
 * `RESOURCE_NODE_PROFILES`) — sie bekommen bewusst das neutrale Wortfeld, damit
 * nichts Nichtexistierendes benannt wird, und einen echten Eintrag erst mit ihrem
 * Betrieb.
 */
const VOCABULARY_KEY: Record<ResourceNodeType, string> = {
  tree: 'tree',
  rock: 'rock',
  crop: 'crop',
  livestock: 'generic',
  water_source: 'generic',
  wild_plant: 'generic',
};

export function nodeVocabulary(nodeType: ResourceNodeType): NodeVocabulary {
  const key = VOCABULARY_KEY[nodeType];
  const plural = t(`ui.operation.node.${key}.many`);
  return {
    singular: t(`ui.operation.node.${key}.one`),
    plural,
    inRange: t('ui.operation.in_range', { nodes: plural }),
    emptyArea: t(`ui.operation.node.${key}.empty_area`),
  };
}
