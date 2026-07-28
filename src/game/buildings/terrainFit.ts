// Geländetoleranz der Bauplatzierung (§ Map Flattening + Buildability Overhaul,
// Phase C — Auftrag 28.07.2026, `docs/agents/MAP_FLATTENING_AND_BUILDABILITY_PLAN.md`).
//
// Bis v1.10 war die Prüfung ein starres „passt / passt nicht": JEDE Kachel des
// Footprints musste das gebackene Bebaubar-Bit tragen und das Höhendelta über
// den GANZEN Footprint durfte 0,85 nicht überschreiten — unabhängig davon, ob
// das Gebäude 1×1 oder 5×5 groß war. Ein 5×5 auf gleichmäßig sanftem Hang war
// damit unbaubar, obwohl derselbe Hang für ein 1×1 problemlos zählte.
//
// Diese Datei ist reine Simulation (CLAUDE.md §1): keine Renderer-, React- oder
// State-Importe. Der Renderer LIEST dieselben Werte, um Sockelhöhe und
// Stützmauer zu dimensionieren — gezeigte Geometrie und geprüfte Regel stammen
// so aus EINER Quelle (§2: erweitern statt zweites System).

/** Höhenbudget eines 1×1-Footprints (der historische Wert). */
export const FOOTPRINT_HEIGHT_BUDGET_BASE = 0.85;
/** Zusätzliches Budget je weiterer Kachel Kantenlänge. Der Bake garantiert auf
 *  bebaubarem Land höchstens ~0,5 Welt-Einheiten Höhenunterschied je Kachel;
 *  0,45 bleibt bewusst leicht darunter, damit wirklich unruhiges Gelände weiter
 *  abgelehnt wird. */
export const FOOTPRINT_HEIGHT_BUDGET_PER_TILE = 0.45;
/** Harte Obergrenze. Darüber wäre der Sockel kein Fundament mehr, sondern ein
 *  Turm — §8 des Auftrags verbietet ausdrücklich „schwebende" oder falsch
 *  wirkende Gebäude. */
export const FOOTPRINT_HEIGHT_BUDGET_MAX = 2.2;

/**
 * Anteil des Footprints, der das gebackene Bebaubar-Bit verfehlen darf.
 *
 * Das Bit ist eine KACHEL-Klassifikation mit erodiertem Rand; eine einzelne
 * Randkachel neben einer sonst ebenen Fläche hat ein Gebäude bisher komplett
 * verhindert. Wasser, Fluss und Gebirge bleiben davon unberührt — die prüft
 * `validatePlacement` weiterhin hart, Kachel für Kachel.
 */
export const TOLERATED_UNBUILDABLE_RATIO = 0.25;

/**
 * Zulässiger Höhenunterschied über den gesamten Footprint. Wächst mit der
 * Kantenlänge: ein gleichmäßig sanfter Hang ist für ein großes Gebäude genauso
 * baubar wie für ein kleines, er braucht nur ein höheres Fundament.
 */
export function footprintHeightBudget(width: number, height: number): number {
  const span = Math.max(1, Math.max(width, height));
  return Math.min(
    FOOTPRINT_HEIGHT_BUDGET_MAX,
    FOOTPRINT_HEIGHT_BUDGET_BASE + FOOTPRINT_HEIGHT_BUDGET_PER_TILE * (span - 1),
  );
}

/** Mindestanteil bebaubarer Kacheln im Footprint (1 = wie bis v1.10). */
export function minimumBuildableRatio(width: number, height: number): number {
  const tiles = Math.max(1, width * height);
  // Bei einer einzelnen Kachel gibt es nichts auszugleichen — sie muss passen.
  if (tiles === 1) return 1;
  return 1 - TOLERATED_UNBUILDABLE_RATIO;
}

/**
 * Maximale Steilheit einer BODENSTRASSE (§ Map Flattening Phase D).
 *
 * Der alte Wert 0,8 lag unter der Schwelle, ab der der Bake Land überhaupt als
 * bebaubar markiert (1,0 im Landesinneren, 1,2 auf flachen Uferkacheln). Es gab
 * dadurch Kacheln, auf denen ein Gebäude stehen durfte, die aber keine Straße
 * erreichen konnte — ein Haus ohne Anschlussweg, und schlimmer: genau an den
 * Uferkacheln, an denen Anleger und Hafenbauten stehen (§5 des Auftrags).
 * Der Wert deckt deshalb auch die Ufer-Toleranz ab. Wasser und Fels bleiben der
 * Höhenstraße (`BuildingDef.road.crossesWater/crossesCliff`) vorbehalten.
 *
 * `tests/mapBuildability.test.ts` hält die Zusage fest: es darf KEINE Kachel
 * geben, die das Bebaubar-Bit trägt, aber eine Straße aus Geländegründen ablehnt.
 */
export const GROUND_ROAD_MAX_SLOPE = 1.25;

/**
 * Sockelhöhe, die der Renderer für dieses Höhendelta bauen muss, damit das
 * Gebäude waagerecht steht und trotzdem sichtbar im Hang verankert ist.
 * `delta` = maxHeight − minHeight des Footprints.
 */
export function plinthDepthFor(delta: number): number {
  return Math.max(0.12, Math.min(FOOTPRINT_HEIGHT_BUDGET_MAX + 0.5, delta + 0.06));
}
