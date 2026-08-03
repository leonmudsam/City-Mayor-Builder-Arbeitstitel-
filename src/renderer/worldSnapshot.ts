// § Stadtarbeit-Overhaul P4 — DIE STADTARBEITSKARTE IST DIE GERENDERTE WELT.
//
// Der Auftrag (§2): „Die Karte soll aus der echten 3D-Welt abgeleitet sein …
// echte Gebäude, echte Straßen, echte Küsten … nicht: generische Rechtecke,
// Dummy-Häuser, billige 2D-Platzhalter."
//
// Seit D-051 kommen die *Daten* der Draufsicht vollständig aus der echten Welt.
// Was fehlte, war die *Darstellung*: die Karte hat Terrainfarben, Bäume und
// Gebäude selbst gezeichnet — und ein selbst gezeichnetes Haus ist ein Rechteck
// mit Dach, egal wie gut die Daten sind. Hier liegt die Brücke: der
// 3D-Renderer nimmt seine eigene Szene von oben auf, die 2D-Karte legt ihre
// Ebenen darüber.
//
// DIESES MODUL KENNT `three` NICHT. Es hält nur die Anmeldung („wer kann
// aufnehmen?") und die Rechnung „welcher Ausschnitt in welcher Auflösung" —
// letztere als reine Funktionen, damit sie ohne WebGL prüfbar sind. Die
// Aufnahme selbst liegt in `three/worldTopDown.ts`.
//
// § WARUM STRENG VON OBEN UND NICHT GEKIPPT
// Der Auftrag nennt „leicht orthografisch/isometrisch". Umgesetzt ist die
// orthografische Draufsicht ohne Neigung, und das ist eine Entscheidung, keine
// Bequemlichkeit: Erst ohne Neigung fällt die Weltkachel exakt auf ihr Pixel.
// Sobald die Kamera kippt, verschiebt sich jedes Objekt um seine HÖHE gegen
// den Boden — bei 0–48 m Geländehöhe sind das mehrere Kacheln. Marker, Route,
// Fahrzeug, Klickziele und Straßen kämen von der ebenen Rechnung, das Bild von
// der gekippten; beide lägen sichtbar auseinander. Eine Karte, auf der das
// Haus nicht dort liegt, wo sein Name steht, ist unbrauchbar — und man
// bemerkte es erst beim Zielen.

/** Ein Weltausschnitt in Kacheln (linke obere Ecke + Größe). */
export interface WorldSnapshotArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WorldSnapshot {
  /** Fertiges Bild des Ausschnitts, 1 Kachel = `pixelsPerTile` Pixel. */
  canvas: HTMLCanvasElement;
  area: WorldSnapshotArea;
  pixelsPerTile: number;
}

export type WorldSnapshotSource = (
  area: WorldSnapshotArea,
  pixelsPerTile: number,
) => WorldSnapshot | undefined;

/**
 * Kantenlänge der Aufnahme in Pixeln. Der Rückweg vom Grafikspeicher
 * (`readRenderTargetPixels`) kostet linear mit der Pixelzahl — 2048² sind
 * 16 MB und liegen im einstelligen Millisekundenbereich; darüber wird es
 * spürbar, ohne dass die Karte besser aussähe.
 */
export const MAX_SNAPSHOT_SIDE = 2048;
/** Feiner als das braucht keine Karte — darüber zeichnet die 2D-Ebene ohnehin. */
export const MAX_PIXELS_PER_TILE = 40;
/**
 * Rand um den sichtbaren Ausschnitt. Ohne ihn löste jedes Verschieben um ein
 * Pixel eine neue Aufnahme aus; mit ihm überlebt eine Aufnahme das Fahren
 * durch ein halbes Stadtviertel.
 */
export const SNAPSHOT_PADDING = 0.4;

let source: WorldSnapshotSource | undefined;

/**
 * Der 3D-Renderer meldet sich beim Start an und beim Abbau wieder ab. Ist
 * niemand angemeldet (Tests, kein WebGL, Karte ohne laufende Welt), liefert
 * `captureWorldSnapshot` `undefined` — und die Karte zeichnet ihre eigenen
 * Ebenen wie bisher. Ein fehlendes Bild ist deshalb nie ein Fehler, sondern
 * der Rückfallpfad.
 */
export function setWorldSnapshotSource(next: WorldSnapshotSource | undefined): void {
  source = next;
}

export function captureWorldSnapshot(
  area: WorldSnapshotArea,
  pixelsPerTile: number,
): WorldSnapshot | undefined {
  return source?.(area, pixelsPerTile);
}

export function hasWorldSnapshotSource(): boolean {
  return source !== undefined;
}

/**
 * Welcher Ausschnitt in welcher Auflösung für einen sichtbaren Bereich?
 *
 * `scale` ist die Kachelgröße in Bildschirmpixeln, mit der die Karte gerade
 * zeichnet. Die Aufnahme bekommt denselben Maßstab (gedeckelt) — sie ist dann
 * pixelgenau und muss nicht hochskaliert werden.
 */
export function planWorldSnapshot(
  visible: { minX: number; minY: number; maxX: number; maxY: number },
  scale: number,
  worldTiles: number,
): { area: WorldSnapshotArea; pixelsPerTile: number } {
  const width = Math.max(1, visible.maxX - visible.minX);
  const height = Math.max(1, visible.maxY - visible.minY);
  const padX = Math.max(4, width * SNAPSHOT_PADDING);
  const padY = Math.max(4, height * SNAPSHOT_PADDING);
  const x = Math.max(0, Math.floor(visible.minX - padX));
  const y = Math.max(0, Math.floor(visible.minY - padY));
  const area: WorldSnapshotArea = {
    x,
    y,
    w: Math.min(worldTiles - x, Math.ceil(width + padX * 2)),
    h: Math.min(worldTiles - y, Math.ceil(height + padY * 2)),
  };
  const wanted = Math.min(MAX_PIXELS_PER_TILE, Math.max(1, scale));
  // Der Deckel wirkt auf die LÄNGERE Kante — sonst wäre ein breiter Ausschnitt
  // scharf und ein hoher unscharf, obwohl beide gleich viel Speicher kosten.
  const longest = Math.max(area.w, area.h);
  const pixelsPerTile = Math.max(0.5, Math.min(wanted, MAX_SNAPSHOT_SIDE / Math.max(1, longest)));
  return { area, pixelsPerTile };
}

/**
 * Taugt eine vorhandene Aufnahme noch für diesen Blick?
 *
 * Zwei Gründe für ein Nein, und nur zwei: der Blick liegt (teilweise) außerhalb,
 * oder die Aufnahme ist für den jetzigen Zoom zu grob. Eine zu FEINE Aufnahme
 * ist ausdrücklich kein Grund — beim Herauszoomen soll nicht neu aufgenommen
 * werden, das Bild wird einfach kleiner gezeichnet.
 */
export function snapshotCovers(
  snapshot: { area: WorldSnapshotArea; pixelsPerTile: number },
  visible: { minX: number; minY: number; maxX: number; maxY: number },
  scale: number,
): boolean {
  const { area } = snapshot;
  if (visible.minX < area.x || visible.minY < area.y) return false;
  if (visible.maxX > area.x + area.w || visible.maxY > area.y + area.h) return false;
  // 0,55 ist der Punkt, ab dem die Unschärfe auffällt, ohne bei jedem
  // Zoomschritt neu aufzunehmen.
  return snapshot.pixelsPerTile >= Math.min(MAX_PIXELS_PER_TILE, scale) * 0.55;
}
