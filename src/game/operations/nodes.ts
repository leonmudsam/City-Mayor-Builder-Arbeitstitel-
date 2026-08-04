// Ressourcenknoten (§ Active Operations 2.0, Phase A3; generalisiert in A6/A7). Wie
// das Terrain sind verfügbare Naturressourcen NICHT persistiert, sondern
// deterministisch aus der Welt + einem Positions-Hash abgeleitet; persistiert werden
// in `state.operations.nodeDeltas` nur Abweichungen (angearbeitet/reserviert/
// erschöpft/nachwachsend). Das gibt jedem Knoten eine stabile Id (`"x,y"`), hält den
// Save winzig und garantiert, dass Regeneration nur auf gültigem Terrain passiert
// (§26.14/15). Rein — kein Renderer/React (CLAUDE.md §1).
//
// § A6/A7: Der Referenzschnitt kannte nur `tree`/Holz. Jetzt beschreibt EIN
// Profil je Knotentyp, was die Kachel trägt — Baum (Wald, wächst nach),
// Felsvorkommen (Gebirge, **wächst nicht nach**) und Feld (fruchtbar, wächst schnell
// nach). Kein zweites Knotensystem: dieselbe Id, dasselbe Delta, derselbe Tick (§2).

import type { GameState, ResourceId, ResourceNodeType } from '../types.ts';
import { tileAt, worldTerrainAt } from '../map/world.ts';
import { terrainAt } from '../config/startRegion.config.ts';

/**
 * Weltseitige Eigenschaften eines Knotentyps. Bewusst **hier** und nicht am Gebäude:
 * ein Felsvorkommen ist eine Eigenschaft der Kachel, nicht des Betriebs, der es
 * abbaut — zwei Steinbrüche dürfen sich nie über die Ergiebigkeit derselben Kachel
 * uneinig sein.
 */
export interface ResourceNodeProfile {
  /** Ware, die der Knoten liefert. */
  resource: ResourceId;
  /** Terrain, das den Knoten trägt. */
  terrain: string;
  /** Anteil geeigneter Kacheln, die einen Knoten tragen (0..1, Positions-Hash). */
  density: number;
  /** Grundmenge je Knoten. Muss ≥ der größten Traglast sein, sonst laufen Arbeiter halb voll heim. */
  maxAmount: number;
  /**
   * Nachwachsdauer in ms Simulationszeit — `undefined` heißt **wächst nie nach**
   * (Stein). Ein erschöpftes Vorkommen bleibt erschöpft; der Betrieb muss umziehen.
   * Das ist eine Entscheidung des Spielers (wo abbauen) und deshalb ausdrücklich
   * keine Automatik (D-039).
   */
  regenerationMs?: number;
  /**
   * § D-058 — KANN DER SPIELER DIESE KNOTEN SELBST ANLEGEN?
   *
   * Nur hierauf darf ein leerer Betriebsstart gestützt werden, und die
   * Unterscheidung ist schärfer als „wächst nach":
   *
   * * `tree` — **nein.** Wald wächst zwar nach, aber nur auf Waldkacheln. Steht
   *   in Reichweite jetzt kein Baum, entsteht dort auch keiner; „0 Knoten"
   *   heißt beim Sägewerk wirklich „falsch gebaut".
   * * `rock` — **nein.** Stein wächst nie nach (D-046).
   * * `crop` — **ja.** Ein Feld ist eine bezahlte Geländeänderung des Spielers;
   *   „0 Knoten" heißt hier „noch keine Felder angelegt", nicht „nie".
   *
   * PFLICHTFELD: Wer einen Knotentyp ergänzt, muss die Frage beantworten, sonst
   * compiliert das Profil nicht. Der frühere Riegel stand als
   * `if (nodeIds.length === 0) return fail('invalid')` in einer Command-Zeile —
   * an einer Stelle, an der niemand weiß, ob das Gebiet noch etwas werden kann.
   */
  playerCreatable: boolean;
}

/**
 * Ein Profil je Knotentyp. `livestock`/`water_source`/`wild_plant` sind im Typ
 * vorgesehen, aber noch von keinem Betrieb belegt — sie stehen bewusst NICHT hier
 * drin, damit nichts Nichtexistierendes vorgetäuscht wird (A8+).
 */
export const RESOURCE_NODE_PROFILES: Partial<Record<ResourceNodeType, ResourceNodeProfile>> = {
  // Baum: Dichte und Terrain unverändert (der Hash entscheidet je Kachel — eine
  // andere Dichte verschöbe die Knotenverteilung bestehender Spielstände).
  // Die Menge je Baum steigt von 32 auf 100, weil die Traglast eines Holzfällers
  // sonst nicht über 32 wachsen kann: ein Arbeiter kehrt IMMER heim, sobald der
  // Knoten leer ist, die Traglast wäre also nur auf dem Papier größer. Das ist die
  // Voraussetzung der Sägewerk-Kalibrierung (§A6/A7) und save-sicher — angearbeitete
  // Bäume behalten ihre persistierte Restmenge.
  tree: {
    resource: 'wood',
    terrain: 'forest',
    density: 0.5,
    maxAmount: 100,
    regenerationMs: 8 * 60 * 1000,
    playerCreatable: false,
  },
  // Felsvorkommen: ergiebig, aber endlich. ~180 Einheiten je Kachel ergeben pro
  // Steinbruch-Standort mehrere Stunden Abbau, danach ist der Bruch leer (§A6).
  rock: { resource: 'stone', terrain: 'mountain', density: 0.4, maxAmount: 180, playerCreatable: false },
  // Feld: hohe Menge je Kachel, schneller Zyklus — Aussaat/Wachstum/Ernte fallen
  // mit der vorhandenen Regeneration zusammen, es braucht keinen zweiten
  // Lebenszyklus (§2).
  // Feld: Dichte **1,0**, und das ist keine Balancing-Laune. Feldkacheln sind
  // bezahlte Fläche (`FIELD_COST_PER_TILE`); bei 0,6 hätte jede fünfte bis
  // zweite gekaufte Kachel dauerhaft nichts getragen, ohne dass der Spieler
  // erkennen kann, warum. Wer bezahlt, bekommt die Fläche.
  crop: {
    resource: 'food',
    terrain: 'fertile',
    density: 1,
    maxAmount: 130,
    regenerationMs: 10 * 60 * 1000,
    playerCreatable: true,
  },
};

/** Profil eines Knotentyps (undefined = von keinem Betrieb belegt). */
export function nodeProfile(type: ResourceNodeType): ResourceNodeProfile | undefined {
  return RESOURCE_NODE_PROFILES[type];
}

/**
 * § Lieferketten-Overhaul §2 — BODENQUALITÄT.
 *
 * Der Auftrag verlangt „Effizienz abhängig von Entfernung UND Bodenqualität"
 * und zugleich „fruchtbares Land ist ein Bonus, keine Bedingung". Beides
 * zusammen heißt: Ein Feld auf natürlich fruchtbarem Grund trägt mehr als
 * dasselbe Feld auf der Wiese — mehr, nicht ausschließlich.
 *
 * ENTSCHEIDEND ist, WORAUS die Qualität gelesen wird: aus dem **Bake**
 * (`baseTerrainAt`), nicht aus `worldTerrainAt`. Ein angelegtes Feld SETZT
 * `fertile` als Override — über den Override gelesen wäre jede Feldkachel
 * automatisch beste Qualität, der Bonus also geschenkt und die Landschaft
 * bedeutungslos. Der Bake weiß, wo wirklich fruchtbarer Boden liegt.
 *
 * Wirkt über die Ergiebigkeit der Kachel, nicht über eine zweite
 * Effizienzformel: Es gibt weiterhin genau eine Distanzrechnung (D-059).
 */
export const SOIL_BONUS_NATURAL_FERTILE = 1.3;

export function nodeSoilFactor(type: ResourceNodeType, x: number, y: number): number {
  if (type !== 'crop') return 1; // Bäume und Fels kennen keine Bodengüte
  return terrainAt(x, y) === 'fertile' ? SOIL_BONUS_NATURAL_FERTILE : 1;
}

/** Grundmenge Holz je Baumknoten (Referenzschnitt, für Bestandscode/Tests). */
export const TREE_MAX_AMOUNT = RESOURCE_NODE_PROFILES.tree!.maxAmount;
/** Nachwachsdauer eines gefällten Baums (ms Simulationszeit). */
export const TREE_REGEN_MS = RESOURCE_NODE_PROFILES.tree!.regenerationMs!;

export type ResourceNodeRuntimeState = 'available' | 'reserved' | 'being_worked' | 'depleted' | 'regrowing';

/**
 * Laufzeit-Sicht eines Ressourcenknotens: Grundzustand (aus Welt + Hash)
 * überlagert mit dem persistierten Delta. Wird nie gespeichert.
 */
export interface ResourceNode {
  /** Stabile Id = `"x,y"`. */
  id: string;
  type: ResourceNodeType;
  x: number;
  y: number;
  resource: ResourceId;
  state: ResourceNodeRuntimeState;
  remainingAmount: number;
  maxAmount: number;
  /** Betrieb (buildingId), der den Knoten reserviert hat. */
  reservedBy?: string;
  /** Zeitpunkt, ab dem ein erschöpfter Knoten wieder verfügbar ist. */
  regenerationAt?: number;
}

export function nodeIdOf(x: number, y: number): string {
  return `${x},${y}`;
}

export function parseNodeId(id: string): { x: number; y: number } | undefined {
  const comma = id.indexOf(',');
  if (comma < 0) return undefined;
  const x = Number.parseInt(id.slice(0, comma), 10);
  const y = Number.parseInt(id.slice(comma + 1), 10);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return undefined;
  return { x, y };
}

/** Deterministischer 0..1-Hash einer Kachel (stabil, plattformunabhängig). */
function hash01(x: number, y: number): number {
  let h = Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663);
  h ^= h >>> 13;
  h = Math.imul(h, 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Trägt die Kachel grundsätzlich einen Knoten dieses Typs? Passendes Terrain (mit
 * sparse Overrides), unbebaut und vom Dichte-Hash ausgewählt. Rein deterministisch.
 *
 * Der Knotentyp wird über das Terrain bestimmt, deshalb bleibt die Id `"x,y"`
 * eindeutig: eine Kachel ist entweder Wald **oder** Gebirge **oder** fruchtbar.
 */
export function isNodeTile(state: GameState, type: ResourceNodeType, x: number, y: number): boolean {
  const profile = RESOURCE_NODE_PROFILES[type];
  if (!profile) return false;
  if (worldTerrainAt(state, x, y) !== profile.terrain) return false;
  if (tileAt(state, x, y)?.buildingId) return false; // nicht unter Gebäuden (§26.15)
  return hash01(x, y) < profile.density;
}

/**
 * Löst einen Knoten aus seiner Id auf: `undefined`, wenn die Kachel (mehr) keinen
 * Knoten trägt (Terrain geändert, überbaut). Sonst Laufzeitzustand aus Delta.
 */
export function resolveNode(state: GameState, type: ResourceNodeType, id: string, now: number): ResourceNode | undefined {
  const profile = RESOURCE_NODE_PROFILES[type];
  if (!profile) return undefined;
  const pos = parseNodeId(id);
  if (!pos) return undefined;
  if (!isNodeTile(state, type, pos.x, pos.y)) return undefined;
  const delta = state.operations?.nodeDeltas[id];
  // Bodengüte skaliert die Ergiebigkeit der KACHEL (§2). Persistierte
  // Restmengen sind absolute Zahlen und bleiben dadurch gültig.
  const maxAmount = profile.maxAmount * nodeSoilFactor(type, pos.x, pos.y);
  const base: ResourceNode = {
    id,
    type,
    x: pos.x,
    y: pos.y,
    resource: profile.resource,
    state: 'available',
    remainingAmount: maxAmount,
    maxAmount,
  };
  if (!delta) return base;
  // Erschöpft & noch nicht nachgewachsen → regrowing.
  if (delta.regenerationAt !== undefined) {
    if (now < delta.regenerationAt) {
      return { ...base, state: 'regrowing', remainingAmount: 0, regenerationAt: delta.regenerationAt };
    }
    return base; // nachgewachsen → wieder voll verfügbar
  }
  const remaining = delta.remaining ?? maxAmount;
  if (remaining <= 0) return { ...base, state: 'depleted', remainingAmount: 0 };
  return {
    ...base,
    remainingAmount: remaining,
    state: delta.reservedBy ? 'reserved' : 'available',
    ...(delta.reservedBy ? { reservedBy: delta.reservedBy } : {}),
  };
}

/**
 * Alle Knoten in einem Rechteck (inklusive Grenzen), aufgelöst zu ihrem
 * Laufzeitzustand. Nur auf Anforderung aufgerufen (Vorschau/Auswahl), nie pro
 * Tick — der Tick arbeitet ausschließlich mit bereits gewählten Knoten-Ids.
 */
export function deriveNodesInArea(
  state: GameState,
  type: ResourceNodeType,
  area: { minX: number; minY: number; maxX: number; maxY: number },
  now: number,
): ResourceNode[] {
  const nodes: ResourceNode[] = [];
  for (let y = area.minY; y <= area.maxY; y++) {
    for (let x = area.minX; x <= area.maxX; x++) {
      if (!isNodeTile(state, type, x, y)) continue;
      const node = resolveNode(state, type, nodeIdOf(x, y), now);
      if (node) nodes.push(node);
    }
  }
  return nodes;
}

/** Terrain der Kachel ohne State-Zugriff (für Kandidaten-Checks außerhalb). */
export function baseTerrainAt(x: number, y: number): string {
  return terrainAt(x, y);
}
