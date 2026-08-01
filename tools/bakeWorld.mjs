#!/usr/bin/env node
// bakeWorld.mjs — Offline-Bake der verbindlichen Welt-GLB (§ World Overhaul 12.0).
//
// Liest `reference/world/new island 3d model.glb` (117 Meshes, reine Geometrie)
// und erzeugt daraus deterministisch die committeten Laufzeit-Daten:
//
//   src/game/config/world/islandTerrain.gen.ts   — 512×512 Terrain-Typ-Grid (Sim)
//   src/game/config/world/islandRegions.gen.ts   — 512×512 Region-Id-Grid + Statistik (Sim)
//   src/renderer/three/worldHeight.gen.ts        — 1025×1025 Höhen-Grid (Renderer)
//   tools/bake-report.md                         — Statistik + gewählter Start
//   tools/bake-preview.png                       — visuelle Kontrolle (Hypsometrie + Regionsgrenzen)
//
// Die GLB wird NIE zur Laufzeit geladen (45 MB); dieses Skript ist der einzige
// Konsument. Alle Regeln (Wasserlinie, Biome, Glättung) sind hier zentral und in
// docs/WORLD_REBUILD.md dokumentiert. Aufruf: `node tools/bakeWorld.mjs`.
//
// Pipeline: GLB parsen → Dreiecke top-down in ein Höhen-Grid rastern (Max-Y,
// baryzentrisch interpoliert) → Wasser klassifizieren (Flood-Fill: offener Ozean
// vs. eingeschlossene Seen; Breiten-Heuristik: schmale Rinnen = Fluss) → Biome
// regelbasiert (Höhe/Hang/Wassernähe/Noise) → bebaubares Land glätten (die Sim
// kennt keine Hangprüfung — Bauflächen MÜSSEN sanft sein) → ORGANISCHE REGIONEN
// segmentieren (§ Welt 2.0: Seeds auf Biom-Clustern, kostenbasiertes Wachstum
// entlang natürlicher Grenzen, kleine Regionen mergen) → Startregion wählen und
// validieren (≥ MIN_START_BUILDABLE bebaubare Kacheln) → Ausgaben schreiben.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import zlib from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// § World Overhaul 12.0 (Auftrag 29.07.2026): verbindliche Quelle ist die NEUE
// Insel. Die alte `island 3d new.glb` bleibt nur noch als historische Referenz
// im Ordner liegen und wird von nichts mehr gelesen. `WORLD_GLB` erlaubt
// Vergleichsbakes ohne Codeänderung (Diagnose, nie Laufzeit).
const WORLD_GLB_RELATIVE = process.env.WORLD_GLB ?? 'reference/world/new island 3d model.glb';
const GLB_PATH = join(ROOT, WORLD_GLB_RELATIVE);

// ---------------------------------------------------------------------------
// § MODELLTREUE 13.0 (Auftrag 31.07.2026) — DIE GLB IST DIE WELT
// ---------------------------------------------------------------------------
// Nutzerbefund mit Beleg (Viewer-Screenshot der rohen GLB): das Modell ist NICHT
// das Problem. Es hat bereits klare Klippen, ebene Plateaus, saubere Fluss- und
// Küstenkanten. Was im Spiel ankam, war eine andere Landschaft — der Bake hat
// sie erzeugt, nicht die GLB:
//
//   * `applyFlatShoreProfile()` zog JEDE Uferkante auf 0,24 m Plattform herunter
//     (drei Durchläufe) — genau die Klippen, die im Modell die Insel definieren.
//   * `terraformNonMassifLand()` glättete alles unterhalb des Massivs in vier
//     Runden à acht Durchgängen ein.
//   * `flattenBuildableLand()` relaxierte anschließend 6.000 Sweeps lang.
//   * `buildCliffPlateaus()`/`repairTerrainNeedles()`/`repairCoastPeaks()`
//     bauten Ersatz-Landschaft dort wieder auf, wo die Glättung sie entfernt
//     hatte.
//
// Gemessen bleibt davon 1 von 3 Höhenmetern übrig (siehe Bericht `fidelity`).
// Ab jetzt gilt die umgekehrte Reihenfolge des Auftrags: erst die Geometrie
// exakt übernehmen, DANN Wasser, Ufer, Biome und Texturen darauf ableiten.
// Ableitungen lesen das Gelände; sie verändern es nicht mehr.
//
// Der alte Pfad bleibt zu Vergleichszwecken über `TERRAIN_MODE=flatten`
// erreichbar, ist aber nicht mehr die ausgelieferte Welt.
const RAW_TERRAIN_FIDELITY = (process.env.TERRAIN_MODE ?? 'raw') !== 'flatten';
/** Quellenangabe für generierte Dateien und den Report (immer POSIX-Pfad). */
const SOURCE_LABEL = WORLD_GLB_RELATIVE.split('\\').join('/');
const round = (value, digits = 3) => Number(value.toFixed(digits));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// ---------------------------------------------------------------------------
// Verbindliche Maßstabs-Konstanten (siehe docs/WORLD_SCALE.md)
// ---------------------------------------------------------------------------
const WORLD_TILES = 512;          // Weltbreite/-tiefe in Kacheln (1 Kachel ≈ 4 m)
const SAMPLES_PER_TILE = 2;       // Höhen-Samples je Kachelkante
const GRID = WORLD_TILES * SAMPLES_PER_TILE + 1; // 1025 — Höhen-Grid-Knoten je Achse
// § Active Resource Loops 10.0 §22 — DRITTE Verkleinerung. Historie der Spannweite
// je Achse: 6.1 = 420 Kacheln (Rand 46) → 8.1 = 374 (Rand 69, X/Z 0,89) → 10.0 =
// 314 (Rand 99). 314 / 374 = 0,84 je Achse ZUSÄTZLICH zum 8.1-Stand (Auftrag:
// „X/Z ≈ 0,84"); gegenüber der 6.1-Ur-Insel ist das 314 / 420 = 0,7476, also
// 0,7476² ≈ 0,559 ⇒ ca. −44 % Gesamtfläche (Auftrag „~30 % zusätzlich"). Bewusst
// aggressivste Variante; das Bauflächenbudget wird über mehr Glättung gehalten,
// nicht über flachere Gebirge.
const PREVIOUS_OCEAN_MARGIN_TILES = 46; // Referenz bleibt die 6.1-Ur-Insel (horizontalScaleFromV60)
const OCEAN_MARGIN_TILES = 99;    // 314 statt 420 Kacheln Spannweite => X/Z 0,7476 ggü. 6.1 (0,84 ggü. 8.1), Fläche ca. -44 %
// Y wird ausdrücklich GETRENNT abgestimmt (Auftrag §1.3): Bei kompakterem X/Z
// würde eine proportionale Höhenreduktion die Gebirge flachdrücken. 52 bleibt (kein
// proportionales Herunterskalieren) — Faktor 1,04 ggü. der 6.1-Höhe 50, innerhalb
// des zulässigen Korridors 0,98–1,08 — und hält Gipfel/Täler/Plateaus relativ zur
// nun kleineren Grundfläche noch monumentaler.
const PEAK_WORLD_HEIGHT = 52;
const PREVIOUS_WATERLINE_N = 0.0065;
// § 10.0 (Nutzerwunsch flacher Uferübergang): Wasserlinie leicht angehoben, damit
// die niedrigste Küstenfranse überflutet und der Strand als flache Rampe statt
// Klippenstufe ausläuft — besser für Hafen-/Wassergebäude-Platzierung.
const SCALE_REFERENCE_N = 0.0075;
/**
 * § Modelltreue 13.1 (Auftrag 31.07.2026) — DER MEERESSPIEGEL STEIGT AUF DIE
 * UNTERKANTE DER TERRASSEN.
 *
 * Nutzerwunsch: „Das Wasser so anpassen, dass es exakt mit der unteren Kante der
 * flacheren Ebenen abschließt, sodass man dort perfekt Hafen etc. platzieren
 * kann." Gemessen am modelltreuen Gelände (Histogramm flacher Landkacheln über
 * der alten Wasserlinie):
 *
 *   0–3 m:   331 Kacheln   ⇒ praktisch nichts — das ist die Klippenwand
 *   4–5 m: 14.073 Kacheln  ⇒ die unterste Terrasse, die gesuchte Ebene
 *   8–10 m: 15.275 Kacheln ⇒ die zweite Terrasse
 *
 * Die Unterkante der untersten Ebene liegt also bei rund 4 m. Genau um diesen
 * Betrag steigt das Wasser, damit die Terrassenkante zur Uferkante wird.
 *
 * WICHTIG — WARUM DIE HÖHENSKALA DAVON ENTKOPPELT IST: Bis 13.0 leitete sich
 * `HEIGHT_SCALE` aus der Wasserlinie ab (Gipfel bleibt exakt
 * `PEAK_WORLD_HEIGHT`). Ein höherer Wasserstand hätte damit das ganze Gelände um
 * 8 % vertikal GESTRECKT — eine Geländeänderung durch die Hintertür, genau das,
 * was D-043 ausschließt. Die Skala hängt jetzt an `SCALE_REFERENCE_N` und ist
 * fix; der Meeresspiegel ist ein reiner Wasserparameter. Das Gelände steht still,
 * das Wasser steigt. Der Gipfel liegt dadurch ehrlich niedriger über dem Wasser
 * (52 → ~48 m), weil ein höherer Meeresspiegel genau das bedeutet.
 */
const WATERLINE_RISE_WORLD = Number(process.env.WATERLINE_RISE ?? 4);
const WATERLINE_N = SCALE_REFERENCE_N
  + WATERLINE_RISE_WORLD / (PEAK_WORLD_HEIGHT / (0.258 - SCALE_REFERENCE_N));
const BASELINE_BUILDABLE_TILES = 44_755; // verbindlicher 6.1-Report vor diesem Rebake

// Uferprofil § 10.0: deutlich sanfterer, breiterer Strandsaum. Nach der dritten
// Verdichtung sind Küsten steiler geworden; ein breiterer Blend (9 statt 6 Kacheln),
// eine flachere Anstiegsrate und eine höhere Klippenschwelle (nur wirklich hohe
// Originalkanten bleiben Steilküste) erzeugen an vielen Uferteilen einen flachen,
// bebaubaren Übergang zum Wasser (Hafen-/Wassergebäude-tauglich, R9-Fundament).
const SHORE_BLEND_TILES = 9;
const SHORE_PLATFORM_HEIGHT = 0.30;
const SHORE_RISE_PER_TILE = 0.28;
const SHORE_CLIFF_HEIGHT = 9.0;
/** Anteil der Küstenzonen, die bewusst Steilküste bleiben. */
const SHORE_CLIFF_ZONE_RATIO = 0.24;
/** Ab wann eine direkte Uferkachel als „flach begehbar" gilt (Höhe / Hang). */
const SHORE_ACCESSIBLE_MAX_HEIGHT = 3.2;
const SHORE_ACCESSIBLE_MAX_SLOPE = 0.9;
/** Garantierte 5×5-Uferplattformen für Hafen-/Wassergebäude. */
const SHORE_APRON_TARGET = 16;
const SHORE_APRON_MIN_DISTANCE = 28;

// Klassifikations-Schwellen (Welt-Einheiten / Kacheln)
const MOUNTAIN_HEIGHT = 13;       // ab dieser Höhe: Gebirge (Massiv — bleibt Highlight)
const MOUNTAIN_SLOPE = 1.8;       // ODER ab diesem Höhendelta je Kachelschritt
/** Höhe, ab der Hang ALLEIN eine Kachel zum Gebirge macht. `-Infinity` = wie
 *  bis v1.10 (überall, auch unter der Wasserlinie liegendes Land). Der
 *  Map-Flattening-Nachlauf setzt hier eine echte Basishöhe. Der Ur-Wert MUSS
 *  neutral bleiben, sonst verschiebt sich die Regionssegmentierung. */
const MOUNTAIN_SLOPE_MIN_HEIGHT = -Infinity;

// ---------------------------------------------------------------------------
// § MAP FLATTENING + BUILDABILITY OVERHAUL (Auftrag 28.07.2026) — Nachlauf
// ---------------------------------------------------------------------------
// WICHTIG — Reihenfolge ist Absicht: Regionen (§7), Startregion-Carve (§7d-bis)
// und Rathauswahl (§8) laufen WEITERHIN auf dem unveränderten Ur-Gelände. Nur so
// bleiben Regions-Ids, Regionsgrenzen, Startregion und Rathausposition
// bitgleich zum vorherigen Bake — `regions.config.ts` (13 handgeschriebene
// Regionen mit Progression/Kosten/Hafenabhängigkeit), das Balancing und ALLE
// bestehenden Spielstände hängen daran. Der Auftrag verlangt eine bespielbarere
// KARTE, nicht eine neue Weltstruktur.
//
// Erst DANACH (§8a-flat) wird das Gelände eingeebnet und Ufer, Biome und
// Bebaubarkeit werden neu abgeleitet. Infrastruktur-Hooks (§8b) und alle
// Ausgaben (§9) sehen ausschließlich dieses neue Gelände.
// § Welt-Feinschliff 12.1 (Spieltest): breiteres, flacheres Uferband und weniger
// bewusste Steilküste. §5 verlangt „die meisten Küsten müssen nutzbar sein" —
// gemessen waren nur 67 % der Uferkacheln bebaubar, und Binnengewässer lagen in
// einer Schlucht. Der Blend reicht jetzt weiter ins Land (14 statt 11 Kacheln)
// und steigt flacher an (0,16 statt 0,20 je Kachel).
const FLAT_SHORE_BLEND_TILES = 14;
const FLAT_SHORE_PLATFORM_HEIGHT = 0.24;
const FLAT_SHORE_RISE_PER_TILE = 0.16;
const FLAT_SHORE_CLIFF_HEIGHT = 12.0;
/** Der Ist-Stand war mehrheitlich Steilküste: 1.937 Steilküsten-Kacheln (davon
 *  1 % bebaubar) gegen 897 flache Küsten + 542 Flussufer. Größter Einzelgrund
 *  war `shoreHash >= 0.24` — jede vierte 18×18-Küstenzone war absichtlich VOM
 *  flachen Profil ausgeschlossen. Jetzt bleiben ~8 % bewusste Steilküste. */
// § 12.1: §5 will „nur wenige Bereiche" mit extremen Höhenunterschieden. 8 % der
// 18×18-Küstenzonen waren nach dem Spieltest immer noch zu viel Steilküste an
// Stellen, wo der Spieler bauen will. 5 % bleiben als bewusstes Landschaftsbild.
const FLAT_SHORE_CLIFF_ZONE_RATIO = 0.05;
const FLAT_SHORE_ACCESSIBLE_MAX_HEIGHT = 4.6;
const FLAT_SHORE_ACCESSIBLE_MAX_SLOPE = 1.35;
const FLAT_SHORE_APRON_TARGET = 44;
const FLAT_SHORE_APRON_MIN_DISTANCE = 17;
/** § Map Flattening B3: Hang allein macht unterhalb dieser Höhe kein Gebirge
 *  mehr. Vorher lagen 5.634 der 12.615 „Gebirgs"-Kacheln unter Höhe 13, davon
 *  1.647 unter Höhe 4 — verstreute Steilheits-Artefakte im Tiefland und an der
 *  Küste, die jedes normale Gebäude (`cliffOverlap > 0`) und jede Bodenstraße
 *  blockierten und mit dem zentralen Massiv nichts zu tun haben. */
const FLAT_MOUNTAIN_SLOPE_MIN_HEIGHT = 6;
/** § Map Flattening B2 (vorher 0,86). */
const FLAT_MAX_BUILDABLE_TILE_SLOPE = 1.0;
/** § Map Flattening B2: Die Erosion verlangte bisher ALLE VIER orthogonalen
 *  Nachbarn. Damit fiel jeder Plateaurand und jede Talkante pauschal weg,
 *  obwohl das Gelände dort nach dem Terraforming eben ist. */
const FLAT_MIN_ORTHOGONAL_BUILDABLE = 3;
/** MUSS mit `GROUND_ROAD_MAX_SLOPE` in `src/game/buildings/terrainFit.ts`
 *  übereinstimmen: kein Bauplatz ohne mögliche Straßenanbindung (§5). */
const FLAT_MAX_ROAD_SLOPE = 1.25;
const SAND_MAX_HEIGHT = 2.2;      // § 10.0: breiteres Strandband (flacher Uferübergang) …
const SAND_WATER_DIST = 4;        // … und ≤ 4 Kacheln vom Wasser (mehr sichtbare Strandtextur)
const FERTILE_MAX_HEIGHT = 4.5;   // fruchtbares Land: tief, flach, gewässernah
const FERTILE_MAX_SLOPE = 0.65;
const FERTILE_WATER_DIST = 9;
const FOREST_MIN_HEIGHT = 0.7;    // Wald-Patches: mittleres Band, per Noise
const FOREST_MAX_HEIGHT = 13;
const FOREST_MAX_SLOPE = 1.35;
const RIVER_WIDTH_WINDOW = 2;     // 5×5-Fenster für die Fluss-Breiten-Heuristik
const RIVER_MAX_NEIGHBORS = 14;   // < 14 Wasser-Nachbarn im Fenster ⇒ schmale Rinne ⇒ Fluss
const LAKE_MIN_TILES = 36;        // eingeschlossene Wasserflächen ab dieser Größe = See

// Glättung bebaubaren Landes (grass/fertile/sand/forest)
// § Final World Compaction 8.1: Die zweite horizontale Verdichtung macht dieselbe
// Geografie automatisch steiler (gleiche Höhe auf weniger Kacheln), zusätzlich
// steigt die Gipfelhöhe auf 52. Ohne Nachjustierung fällt die BEBAUBARE Fläche
// deutlich stärker als die Landfläche. Mehr Glättungsdurchgänge und eine leicht
// tolerantere Hangschwelle halten den Bauflächenverlust nahe der Zielmarke von
// ~20 %, ohne die Gebirge anzutasten (die bleiben über MOUNTAIN_HEIGHT hart).
// § 10.0: Die DRITTE horizontale Verdichtung (0,84 je Achse ggü. 8.1) staucht das
// gleiche Höhenprofil auf noch weniger Kacheln ⇒ Hänge werden nochmals ~1,19× so
// steil. Ohne Nachjustierung stürzt die BEBAUBARE Fläche stärker als die Landfläche.
// Mehr Glättungsdurchgänge und eine leicht tolerantere Vor-Hangschwelle halten das
// Bauflächenbudget nahe der Zielmarke, ohne die Gebirge (> MOUNTAIN_HEIGHT) anzutasten.
const SMOOTH_ITERATIONS = 20;
const SMOOTH_BLEND = 0.6;         // Anteil 4-Nachbar-Mittel je Iteration
const MAX_BUILDABLE_STEP = 0.25;  // max. Höhendelta je Halbkachel (≈ 2 m pro Kachel)
const MAX_BUILDABLE_TILE_SLOPE = 0.86; // 10.0: kompakterer X/Z-Maßstab; Bake glättet anschließend hart auf 0,25/Sample
const MIN_ORTHOGONAL_BUILDABLE = 4;    // Rand-Erosion: alle vier orthogonalen Nachbarn

// § Map Flattening — Phase B1: TERRAFORMING (der eigentliche Hebel).
// Bis v1.10 wurde die Bebaubar-Maske EINMAL aus dem ROHEN Hang bestimmt und
// danach ausschließlich INNERHALB dieser Maske geglättet. Eine Kachel mit Hang
// 0,90 fiel damit heraus, wurde nie geglättet und blieb für immer unbebaubar:
// die Glättung konnte vorhandene Baufläche vertiefen, aber niemals neue
// erzeugen (Audit `MAP_FLATTENING_AND_BUILDABILITY_PLAN.md` A.2 (1)).
//
// Jetzt wechseln Klassifikation und Glättung einander ab: jede Runde bestimmt
// aus den AKTUELLEN Höhen neu, welches Land eingeebnet wird, glättet es und
// kappt die Stufen. So wandert steiles, aber nicht gebirgiges Land Runde für
// Runde in die Baufläche. Das zentrale Massiv (h > MOUNTAIN_HEIGHT) ist in
// JEDER Runde ausgenommen und bleibt vollständig unangetastet (§3.2/§8).
const TERRAFORM_ROUNDS = 4;
const TERRAFORM_ITERATIONS = 8;   // Glättungsdurchgänge je Runde
/** Hänge bis hierher werden eingeebnet; steileres Land bleibt natürliches Relief
 *  (Klippen, Grate, Bruchkanten) — sonst würde die Insel steril (§8). */
const TERRAFORM_SLOPE_GATE = 1.5;
/** Maximale Stufe auf terraformtem/bebaubarem Land (Halbkachel) = 0,5 je
 *  Kachel. Ein 4×4-Footprint hat damit höchstens ≈1,5 Welt-Einheiten
 *  Höhenunterschied — das kaschiert der Gebäudesockel als Stützmauer sauber
 *  (§4.1/§4.3). Strengere Werte (0,18) sind geometrisch erreichbar, brauchen
 *  aber Zehntausende Relaxationsdurchläufe und konvergieren im Bake nicht. */
const FLAT_MAX_BUILDABLE_STEP = 0.25;

// ---------------------------------------------------------------------------
// § Welt-Feinschliff 12.2 (Spieltest 30.07.2026) — KÜSTEN-ZACKEN + ECHTE KLIPPEN
// ---------------------------------------------------------------------------
// Befund aus dem Spieltest: an mehreren Ufern stehen dünne, hohe Grat-Splitter
// („Zacken") im Wasser und an der Wasserkante. Sie stammen aus der Quell-GLB
// (Tripo erzeugt schmale Felsnadeln), die der Max-Y-Rasterizer zu 1–2 Knoten
// breiten Nadeln im Höhenfeld verdichtet.
//
// WARUM DER ALTE RIEGEL NICHT GEGRIFFEN HAT: `repairCoastPeaks()` verlangte
// „mehr als 6 m über dem Nachbar-Median UND höchstens EIN stützender Nachbar".
// Gemessen im ausgelieferten Bake erfüllte genau 1 Knoten diese Bedingung —
// tatsächlich sind es 487 Knoten mit ≥ 1,5 m Überhöhung, davon 321 direkt auf
// der Land/Wasser-Grenze. Die Kennzahl `isolatedPeakCount` stand also auf „fast
// 0", während der Spieler ein Ufer voller Splitter sah: die Metrik hat das
// falsche gemessen.
//
// Die neue Erkennung nutzt eine ZWEITE, trennscharfe Bedingung: ein Knoten ist
// nur dann eine Nadel, wenn er in mindestens drei der vier Achsen (W-O, N-S und
// beide Diagonalen) BEIDSEITIG deutlich höher liegt. Eine echte Klippenkante
// oder ein Bergkamm ist in der Achse ENTLANG der Kante kein Hochpunkt und bleibt
// damit unangetastet — der Weltgipfel hat 8 stützende Nachbarn und 0,26 m
// Überhöhung, ist also nie betroffen.
const NEEDLE_MIN_RISE = 1.5;          // Überhöhung über dem Median der 8 Nachbarn
const NEEDLE_SUPPORT_TOLERANCE = 2.5; // ein Nachbar „stützt", wenn er so nah liegt
const NEEDLE_MAX_SUPPORT = 3;         // mehr Stützen ⇒ zusammenhängender Grat, kein Splitter
const NEEDLE_AXIS_MARGIN = 0.6;       // Mindestabstand zu BEIDEN Achsennachbarn
const NEEDLE_MIN_AXES = 3;            // Hochpunkt in ≥ 3 von 4 Achsen ⇒ Nadel
const NEEDLE_SHORE_BAND = 3;          // Uferband in Kacheln (alle Gewässer)
const NEEDLE_LOWLAND_HEIGHT = 8;      // darunter kann keine Nadel zum Massiv gehören
const NEEDLE_PASSES = 6;              // eine entfernte Nadel legt die nächste frei

// § 12.2 — ECHTE KLIPPEN MIT PLATEAU (Nutzerskizze: „gerade Fläche oben").
// Die bewusste Steilküste (shoreType 4) war bisher eine reine Rampe mit
// Splittern obendrauf: gemessen 13 Steilküsten-Kacheln über 4 m, davon 0 mit
// flachem Kopf. Gewünscht ist das Gegenteil — eine klare Wand zum Wasser und
// darüber eine ebene, ans Hinterland angeschlossene Fläche.
//
// ABGRENZUNG zu B4 (unten): B4 hat eine GLOBALE Höhenquantisierung verworfen,
// weil sie überall neue Kanten erzeugte. Hier wird nichts quantisiert — es wird
// ausschließlich der Kopf zusammenhängender Steilküsten-Abschnitte auf das
// vorhandene Hinterlandniveau gelegt. Lokal, gemessen, und nur dort, wo §5 des
// Auftrags ohnehin „klare Klippe mit großer flacher Fläche oben" verlangt.
const CLIFF_ZONE_RELIEF_RADIUS = 7;    // Umkreis, in dem das Hinterland hoch sein muss
/** Mindesthöhe des Hinterlands, damit eine ausgewürfelte Zone Klippe bleibt. */
const CLIFF_ZONE_MIN_RELIEF = 5;
/**
 * § 12.2 (zweiter Spieltest) — KLIPPEN-GARANTIE.
 *
 * Nutzerwunsch zu einer konkreten Uferstelle: „Ich will genau da aber eine
 * Klippe, kein flaches Ufer. Überall anders passt." Ab dieser Hinterlandhöhe
 * bleibt die Uferkante deshalb IMMER stehen — unabhängig von der Zonen-Lotterie.
 * Wo sich echtes Gebirge bis ans Wasser schiebt, gibt es keinen Strand.
 *
 * WARUM NICHT GANZ OHNE LOTTERIE: Gemessen (Schwelle 5 bzw. 11, Hash entfernt)
 * wurde praktisch die gesamte Küste steil — der Bake fand danach KEINE
 * Startregion mehr, die Budget, Wasserzugang, Hafenfläche und drei
 * Nachbarregionen gleichzeitig erfüllt (67 bzw. 51 Kandidaten scheiterten am
 * Wasserzugang). Die Kombination hält beides: garantierte Felsküste am echten
 * Gebirge, flaches bebaubares Ufer überall sonst.
 */
const CLIFF_ZONE_ALWAYS_RELIEF = 18;
const CLIFF_PLATEAU_MIN_COMPONENT = 5; // kürzere Abschnitte sind Einzelfelsen, keine Klippe
const CLIFF_PLATEAU_DEPTH = 5;         // Tiefe des ebenen Kopfes in Kacheln
const CLIFF_PLATEAU_MIN_HEIGHT = 3;    // darunter ist es Strand, keine Klippe
const CLIFF_PLATEAU_BLEND_TILES = 3;   // Übergang Plateau → Hinterland

// § Map Flattening B4 — TERRASSEN: BEWUSST NICHT UMGESETZT.
// Eine zusätzliche Höhenquantisierung („Stufen statt Rampen") wurde gebaut und
// gemessen — pro Knoten UND pro Kachel, mit fbm-gestreuter Stufenlage. Ergebnis
// beide Male: die Zahl praktisch ebener Footprints SANK leicht (3×3 mit ΔH≤0,85:
// 11.370 ohne → 10.563 mit), weil das Schnappen an Plateaurändern neue Kanten
// erzeugt. Zusammen mit §8 („nichts steril/künstlich") ist das ein klares Nein.
// Die vom Auftrag gewünschte Terrassenwirkung entsteht stattdessen dort, wo sie
// wirklich sichtbar ist: am Gebäude, über den gestuften Sockel (Phase C3).

// Organische Regionen (§ Welt 2.0 / § Final World Compaction 8.1 §4).
// Ziel ist NICHT mehr eine feingliedrige Landschaftskarte, sondern genau eine
// zentrale Startregion + ungefähr zwölf bedeutende Freischaltungen. Jede Region
// muss eigene Identität und spürbaren Nutzen haben; Kleinstregionen, deren
// Freischaltung nur ein paar Kacheln liefert, werden konsequent gemerged.
// § World Overhaul 12.0: Die NEUE Insel hat ~60k Landkacheln (statt ~79k) und
// eine deutlich stärker gegliederte Küste. Bei unverändertem Ziel von 6.200
// Kacheln je Region fiel eine Region unter `REGION_MIN_TILES` und wurde
// wegge-merged (12 statt 13 Regionen). Ziel/Untergrenze folgen jetzt der neuen
// Landfläche: 60k / 13 ≈ 4.600.
// § Welt-Feinschliff 12.1 (Spieltest, §1): „Zu viele kleine freischaltbare
// Regionen." 13 Regionen mit Median 3.649 Kacheln lasen sich wie ein Raster zum
// Abhaken statt wie große Gebiete mit eigener Identität. Ziel jetzt: EINE
// zentrale Startregion + SECHS große Landschaften mit klarer strategischer Rolle
// (Wald, Farm, Stein, Mischland). 61.322 Landkacheln / 7 ≈ 8.760.
const REGION_TARGET_TILES = 7000; // ~61k Landkacheln / 8 Regionen
const REGION_MIN_COMPONENT = 400; // Biom-Cluster kleiner als das bekommen keinen eigenen Seed
// § 12.2: Das relief-gesteuerte Uferprofil verschiebt die Biom-Cluster leicht;
// die vorher größte Region (11.856 bebaubar) zerfällt dadurch in eine Gras- und
// eine Sandregion von 7.658 und 4.461 bebaubaren Kacheln. Ergebnis: 9 statt 8
// Regionen bei UNVERÄNDERTEM Median (7.983 Kacheln) — §1 („wenige, große
// Regionen mit klarer Rolle") bleibt erfüllt. Die Schwelle bleibt bei 3.000;
// niedrigere Werte lassen zusätzlich einen 2.922-Kachel-Rest stehen.
const REGION_MIN_TILES = 3300;    // alles darunter wandert in den Nachbarn mit längster Grenze
// 12 Seeds ergaben auf der neuen Insel nach dem Merge nur 10 Regionen (+ Start
// = 11). Der Auftrag verlangt 1 Startregion + ca. 12 Freischaltungen, deshalb
// werden mehr Seeds gesetzt; der Merge in §7d dünnt sie wieder aus.
const REGION_MAX_SEEDS = 10;      // + 1 ausgeschnittene Startregion (Merge dünnt aus)
/** Bauflächen-Budget der ausgeschnittenen zentralen Startregion.
 * § Change 9.0 §3.3: 1.200–1.600 direkt gut bebaubare Kacheln. Das REVERSIERT
 * bewusst die 8.1-Entscheidung „kleine 820er-Pocket" — der neue Auftrag verlangt
 * ein echtes, langfristig tragfähiges Stadtzentrum (20–35 frühe Gebäude, echtes
 * Straßennetz, Wohnblöcke, Sägewerk, Farm, Gewerbe, Grün). Die Startregion soll
 * trotzdem nicht bis weit ins Midgame reichen (§3.3), Zielmitte ~1.400. */
const START_REGION_TARGET_BUILDABLE = 1400;
// Zusammenhängende, vollständig bebaubare Gründungsreserve um das Rathaus.
const RESERVE_X0 = -5, RESERVE_Y0 = -3, RESERVE_W = 20, RESERVE_H = 16;
const COST_FOREIGN_BIOME = 4;     // Wachstums-Mehrkosten beim Betreten eines fremden Bioms
const COST_CROSS_RIVER = 6;       // Zusatzkosten, einen Fluss zu queren (Flüsse = natürliche Grenzen)
const COST_HEIGHT_FACTOR = 4;     // Zusatzkosten je Höhendelta (Gebirgskämme = natürliche Grenzen)

// Zentraler Start 9.0 (Auftrag §3.1/§3.3): Die Startregion ist das langfristige
// urbane Zentrum und muss Level 1 bis ungefähr Level 4–6 tragen — groß genug für
// eine echte Anfangsstadt (20–35 Gebäude), aber nicht bis weit ins Midgame. Der
// zulässige Bauflächenkorridor umschließt das 1.200–1.600-Ziel mit etwas Toleranz
// nach oben, damit das kostenbasierte Carve-Wachstum es zuverlässig trifft.
const MIN_START_BUILDABLE = 1200;
const MAX_START_BUILDABLE = 1750;
// § World Overhaul 12.0 §4 („Startressourcen: Wasser"): Die Startregion MUSS
// echten Wasserzugang haben — Küste, See oder Fluss. Der erste Bake der neuen
// Insel lieferte eine vollständig binnenländische Startregion (0 Küstenkanten,
// 0 fruchtbare Kacheln), weil das Carve-Wachstum abbricht, sobald das
// Bauflächenbudget erreicht ist. Deshalb: Kernkacheln nur in Wassernähe
// zulassen und den Ausschnitt danach gezielt bis an die Wasserkante ziehen.
/** Höchstabstand einer Kandidaten-Kernkachel zu irgendeinem Wasser (Kacheln). */
const START_CORE_MAX_WATER_DISTANCE = 26;
/** Zusatzkacheln, die der Ausschnitt über das Budget hinaus bis ans Wasser darf. */
const START_CARVE_WATER_EXTENSION = 900;
/** Radius des Ufer-Vorplatzes am Ende des Zugangskorridors. Ein einzelner
 *  Uferpunkt wäre kein „guter Zugang" (§4) und trägt keinen Hafen — dieser
 *  Vorplatz macht daraus eine echte kleine Bucht.
 *  § 12.1: von 6 auf 9 erhöht, siehe START_MIN_HARBOUR_PADS. */
const START_SHORE_APRON_RADIUS = 9;
/** Mindestzahl direkter Uferkacheln in der Startregion. */
/**
 * § Modelltreue 13.0/13.1 — auf der ungeglätteten Insel ist die Küste eine
 * Klippe. „Uferkacheln" sind dort selten bebaubar, und die Forderung nach 20
 * Stück zwang den Ausschnitt an den Inselrand: der erste gültige Kandidat lag 94
 * Kacheln vom Inselschwerpunkt (Ziel < 65, § 3.1 „zentraler Start"). Acht
 * Uferkacheln bleiben ein ehrlicher Wasserzugang und lassen die Wahl zentral
 * ausfallen.
 */
const START_MIN_WATERFRONT = RAW_TERRAIN_FIDELITY ? 8 : 20;
/**
 * § 12.1 §6 — HAFENTAUGLICHKEIT FUNKTIONAL PRÜFEN, nicht zählen.
 *
 * Die erste Fassung verlangte nur „≥ 8 Uferkacheln". Das Ergebnis bestand die
 * Prüfung und war trotzdem unbrauchbar: die Bucht war ein schmaler Streifen, in
 * den KEIN einziger 2×2-Anleger passte (0 gültige `dock_small`-Plätze in der
 * Startregion bei 346 weltweit). Geprüft wird deshalb jetzt genau das, was der
 * Spieler tun will — passt ein 2×2-Wassergebäude ans Ufer?
 */
const START_MIN_HARBOUR_PADS = RAW_TERRAIN_FIDELITY ? 0 : 3;
/** So viele Kernkandidaten werden der Reihe nach probiert, bis einer trägt. */
const START_CORE_CANDIDATES = 400;
/** § 12.0 §4 „einfache Topografie": Höhenspanne über dem 7×7-Rathausblock. MUSS
 *  zur Schwelle der Flachheitsbewertung in §8 passen (`flatnessScore`), sonst
 *  schneidet der Bake eine Startregion aus, in der §8 gar keinen flachen
 *  Rathausplatz mehr findet (Flachheit 0,000). */
const START_CORE_MAX_FLAT_DELTA = 0.85;
/** § 12.0 §4 „mehrere Expansionsrichtungen": So viele Nachbarregionen muss der
 *  Ausschnitt berühren. Mit nur einer Nachbarregion ist die erste
 *  Freischaltungsentscheidung des Spielers keine Entscheidung (§8). */
const START_MIN_NEIGHBOUR_REGIONS = 3;
// Startregion + die ersten beiden Erweiterungen zusammen. Mit dem größeren Start
// (~1.400) und ~2.400–4.000 je Nachbarregion liegt die Frühfläche höher; der
// Korridor bleibt weit, priorisiert wird weiterhin die REGIONSSTRUKTUR (§4).
const MIN_EARLY_BUILDABLE = 2600;
const MAX_EARLY_BUILDABLE = 11000;
/** Angestrebte Bauflächensumme aus Start + früher Erweiterung (Feinauswahl). */
const EARLY_BUILDABLE_SWEET_SPOT = 7200;

// Terrain-IDs (Encoding im Gen-Grid; Reihenfolge = TERRAIN_IDS im Gen-File)
const T = { water: 0, river: 1, sand: 2, fertile: 3, grass: 4, forest: 5, mountain: 6 };
const T_NAMES = ['water', 'river', 'sand', 'fertile', 'grass', 'forest', 'mountain'];
const BUILDABLE = new Set([T.sand, T.fertile, T.grass, T.forest]);

// ---------------------------------------------------------------------------
// 1. GLB parsen (roh, ohne Dependencies)
// ---------------------------------------------------------------------------
console.log('— GLB lesen:', GLB_PATH);
const glb = readFileSync(GLB_PATH);
const SOURCE_SHA256 = createHash('sha256').update(glb).digest('hex');
if (glb.readUInt32LE(0) !== 0x46546c67) throw new Error('kein GLB');
const jsonLen = glb.readUInt32LE(12);
const gltf = JSON.parse(glb.slice(20, 20 + jsonLen).toString('utf8'));
const binStart = 20 + jsonLen + 8;
const A = gltf.accessors;
const BV = gltf.bufferViews;

function accessorInfo(idx) {
  const acc = A[idx];
  const bv = BV[acc.bufferView];
  return { acc, base: binStart + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0), stride: bv.byteStride };
}

// Gesamt-Bounds aus den POSITION-Accessoren
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, minYn = Infinity, maxYn = -Infinity;
for (const m of gltf.meshes) for (const p of m.primitives) {
  const acc = A[p.attributes.POSITION];
  minX = Math.min(minX, acc.min[0]); maxX = Math.max(maxX, acc.max[0]);
  minZ = Math.min(minZ, acc.min[2]); maxZ = Math.max(maxZ, acc.max[2]);
  minYn = Math.min(minYn, acc.min[1]); maxYn = Math.max(maxYn, acc.max[1]);
}
console.log(`  Bounds X[${minX.toFixed(3)},${maxX.toFixed(3)}] Z[${minZ.toFixed(3)},${maxZ.toFixed(3)}] Y[${minYn.toFixed(3)},${maxYn.toFixed(3)}]`);

// ---------------------------------------------------------------------------
// 2. Dreiecke top-down rastern → Höhen-Grid (Max-Y je Knoten)
// ---------------------------------------------------------------------------
// Insel einbeschrieben mit Ozean-Rand: GLB-XZ → Grid-Knoten [margin*S, (TILES-margin)*S]
const gMin = OCEAN_MARGIN_TILES * SAMPLES_PER_TILE;
const gMax = (WORLD_TILES - OCEAN_MARGIN_TILES) * SAMPLES_PER_TILE;
const gSpan = gMax - gMin;
const H = new Float32Array(GRID * GRID).fill(NaN); // normalisierte GLB-Höhe; NaN = keine Geometrie

const toGx = (x) => gMin + ((x - minX) / (maxX - minX)) * gSpan;
const toGz = (z) => gMin + ((z - minZ) / (maxZ - minZ)) * gSpan;

let triCount = 0;
let projectedDegenerateTrianglesSkipped = 0;
console.log('— Dreiecke rastern …');
for (const m of gltf.meshes) for (const p of m.primitives) {
  const pos = accessorInfo(p.attributes.POSITION);
  const posStride = pos.stride ?? 12;
  const idx = accessorInfo(p.indices);
  const idxComp = idx.acc.componentType; // 5123 u16 | 5125 u32
  const readIdx = idxComp === 5125
    ? (i) => glb.readUInt32LE(idx.base + i * 4)
    : (i) => glb.readUInt16LE(idx.base + i * 2);
  const P = (i) => {
    const o = pos.base + i * posStride;
    return [glb.readFloatLE(o), glb.readFloatLE(o + 4), glb.readFloatLE(o + 8)];
  };
  const n = idx.acc.count;
  for (let t = 0; t < n; t += 3) {
    const [ax, ay, az] = P(readIdx(t));
    const [bx, by, bz] = P(readIdx(t + 1));
    const [cx, cy, cz] = P(readIdx(t + 2));
    const gax = toGx(ax), gaz = toGz(az);
    const gbx = toGx(bx), gbz = toGz(bz);
    const gcx = toGx(cx), gcz = toGz(cz);
    const x0 = Math.max(0, Math.floor(Math.min(gax, gbx, gcx)));
    const x1 = Math.min(GRID - 1, Math.ceil(Math.max(gax, gbx, gcx)));
    const z0 = Math.max(0, Math.floor(Math.min(gaz, gbz, gcz)));
    const z1 = Math.min(GRID - 1, Math.ceil(Math.max(gaz, gbz, gcz)));
    const d = (gbx - gax) * (gcz - gaz) - (gcx - gax) * (gbz - gaz);
    if (Math.abs(d) < 1e-12) {
      // Senkrechte Fels-/Uferwände besitzen in der Draufsicht keine Fläche und
      // dürfen deshalb keine Heightfield-Probe schreiben. Der frühere
      // Eckknoten-Fallback setzte jeweils nur den oberen Wandpunkt. Das
      // regelmäßige Renderer-Grid verband diesen isolierten Hochpunkt mit vier
      // niedrigen Nachbarn und erzeugte dadurch die riesigen Küstenkegel.
      projectedDegenerateTrianglesSkipped++;
      triCount++;
      continue;
    }
    for (let zi = z0; zi <= z1; zi++) {
      for (let xi = x0; xi <= x1; xi++) {
        const w0 = ((gbx - xi) * (gcz - zi) - (gcx - xi) * (gbz - zi)) / d;
        const w1 = ((gcx - xi) * (gaz - zi) - (gax - xi) * (gcz - zi)) / d;
        const w2 = 1 - w0 - w1;
        if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
        const y = w0 * ay + w1 * by + w2 * cy;
        const o = zi * GRID + xi;
        if (Number.isNaN(H[o]) || y > H[o]) H[o] = y;
      }
    }
    triCount++;
  }
}
let covered = 0;
for (let i = 0; i < H.length; i++) if (!Number.isNaN(H[i])) covered++;
console.log(`  ${triCount.toLocaleString('de-DE')} Dreiecke, Abdeckung ${(100 * covered / H.length).toFixed(1)} % der Knoten`);
console.log(`  ${projectedDegenerateTrianglesSkipped.toLocaleString('de-DE')} senkrechte/degenerierte Dreiecke ohne Heightfield-Probe`);

// ---------------------------------------------------------------------------
// 3. Wasser auf Kachel-Ebene klassifizieren
// ---------------------------------------------------------------------------
// Je Kachel: Abdeckung + mittlere Höhe der 2×2 inneren Knoten. Wasser-Kandidat =
// unbedeckt (Ozean/See — die GLB modelliert keinen Meeresboden) oder unter der
// Wasserlinie (gecarvte Fluss-/Uferrinnen).
const tileMeanN = new Float32Array(WORLD_TILES * WORLD_TILES).fill(NaN);
const isWaterCand = new Uint8Array(WORLD_TILES * WORLD_TILES);
for (let ty = 0; ty < WORLD_TILES; ty++) {
  for (let tx = 0; tx < WORLD_TILES; tx++) {
    let sum = 0, cnt = 0, miss = 0;
    for (let dz = 0; dz <= SAMPLES_PER_TILE; dz++) for (let dx = 0; dx <= SAMPLES_PER_TILE; dx++) {
      const v = H[(ty * SAMPLES_PER_TILE + dz) * GRID + tx * SAMPLES_PER_TILE + dx];
      if (Number.isNaN(v)) miss++; else { sum += v; cnt++; }
    }
    const o = ty * WORLD_TILES + tx;
    if (cnt > 0) tileMeanN[o] = sum / cnt;
    if (miss > cnt || (cnt > 0 && sum / cnt < WATERLINE_N)) isWaterCand[o] = 1;
  }
}

// Flood-Fill vom Rand: offener Ozean. Übrige Wasser-Kandidaten = eingeschlossen.
const oceanMask = new Uint8Array(WORLD_TILES * WORLD_TILES);
{
  const q = [];
  for (let i = 0; i < WORLD_TILES; i++) {
    for (const o of [i, (WORLD_TILES - 1) * WORLD_TILES + i, i * WORLD_TILES, i * WORLD_TILES + WORLD_TILES - 1]) {
      if (isWaterCand[o] && !oceanMask[o]) { oceanMask[o] = 1; q.push(o); }
    }
  }
  while (q.length) {
    const o = q.pop();
    const tx = o % WORLD_TILES, ty = (o / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const no = ny * WORLD_TILES + nx;
      if (isWaterCand[no] && !oceanMask[no]) { oceanMask[no] = 1; q.push(no); }
    }
  }
}

// Entfernung jeder Kachel zum offenen Ozean. Sie ist Bake-Metadatum für
// Ufer-/Hafenmasken und den separaten Küstenankunftspunkt; der Stadtstart
// selbst wird weiter unten aus der realen Hauptlandmasse zentral bewertet.
const distToOcean = new Int32Array(WORLD_TILES * WORLD_TILES).fill(-1);
{
  const q = [];
  for (let o = 0; o < oceanMask.length; o++) {
    if (oceanMask[o]) { distToOcean[o] = 0; q.push(o); }
  }
  let head = 0;
  while (head < q.length) {
    const c = q[head++];
    const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const no = ny * WORLD_TILES + nx;
      if (distToOcean[no] < 0) { distToOcean[no] = distToOcean[c] + 1; q.push(no); }
    }
  }
}

// Eingeschlossene Wasser-Blobs: groß = See, klein = Rinne (→ Fluss).
const enclosedLabel = new Int32Array(WORLD_TILES * WORLD_TILES).fill(-1);
const enclosedSizes = [];
for (let o = 0; o < isWaterCand.length; o++) {
  if (!isWaterCand[o] || oceanMask[o] || enclosedLabel[o] >= 0) continue;
  const label = enclosedSizes.length;
  const q = [o];
  enclosedLabel[o] = label;
  let size = 0;
  while (q.length) {
    const c = q.pop();
    size++;
    const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const no = ny * WORLD_TILES + nx;
      if (isWaterCand[no] && !oceanMask[no] && enclosedLabel[no] < 0) { enclosedLabel[no] = label; q.push(no); }
    }
  }
  enclosedSizes.push(size);
}

// ---------------------------------------------------------------------------
// 4. Höhen in Welt-Einheiten + Ozean-Tiefenrampe
// ---------------------------------------------------------------------------
// § Modelltreue 13.1: Skala aus der REFERENZ-Wasserlinie, nicht aus der
// aktuellen — sonst streckt jeder Meeresspiegel-Wechsel das Gelände.
const HEIGHT_SCALE = PEAK_WORLD_HEIGHT / (maxYn - SCALE_REFERENCE_N);
// Distanz jeder Wasser-Kachel zum Land (BFS) für die Tiefenrampe.
const distToLand = new Int32Array(WORLD_TILES * WORLD_TILES).fill(-1);
{
  const q = [];
  for (let o = 0; o < isWaterCand.length; o++) {
    if (!isWaterCand[o]) { distToLand[o] = 0; q.push(o); }
  }
  let head = 0;
  while (head < q.length) {
    const c = q[head++];
    const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const no = ny * WORLD_TILES + nx;
      if (distToLand[no] < 0) { distToLand[no] = distToLand[c] + 1; q.push(no); }
    }
  }
}

// Entfernung jeder Landkachel zu irgendeinem Wasser (Meer, See oder Fluss).
// Anders als distToOcean steuert dieses Feld auch Binnen-Ufer und wird später
// unverändert als Küsten-/Wasserbau-Metadatum ausgegeben.
const distToWaterRaw = new Int32Array(WORLD_TILES * WORLD_TILES).fill(-1);
{
  const q = [];
  for (let o = 0; o < isWaterCand.length; o++) {
    if (isWaterCand[o]) { distToWaterRaw[o] = 0; q.push(o); }
  }
  let head = 0;
  while (head < q.length) {
    const c = q[head++];
    const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const no = ny * WORLD_TILES + nx;
      if (distToWaterRaw[no] < 0) { distToWaterRaw[no] = distToWaterRaw[c] + 1; q.push(no); }
    }
  }
}

// Grobkörniger, deterministischer Küstencharakter. Er entscheidet nicht pro
// Kachel zufällig, sondern in zusammenhängenden 18×18-Zonen: niedrige Bereiche
// werden Uferplattform, hohe Originalformen bleiben markante Steilküste.
function shoreHash(tx, ty) {
  const ix = Math.floor(tx / 18), iy = Math.floor(ty / 18);
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263)) ^ 0x71ab92d5;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}
const accessibleShoreZone = new Uint8Array(WORLD_TILES * WORLD_TILES);

/**
 * § 12.2 — Höchste Landhöhe im Umkreis (Relief des Hinterlands).
 *
 * WARUM: `shoreHash` allein wählte die bewusste Steilküste rein zufällig. Im
 * ausgelieferten Bake lagen dadurch 223 „Steilküsten"-Kacheln überwiegend bei
 * 0,2–1,3 m Höhe — also flaches Ufer, das nur vom flachen Profil AUSGESCHLOSSEN
 * war, statt einer sichtbaren Klippe. Genau daraus wurde im Spiel das gemeldete
 * Bild: kein Strand, keine Klippe, dafür Splitter. Eine Klippe darf nur dort
 * entstehen, wo das Land dahinter wirklich hoch ist.
 */
const cliffReliefCache = new Float32Array(WORLD_TILES * WORLD_TILES);
function computeCliffRelief() {
  const radius = CLIFF_ZONE_RELIEF_RADIUS;
  // Separierbares Maximum-Filter: erst je Zeile, dann je Spalte (O(N·2r)).
  const rowMax = new Float32Array(WORLD_TILES * WORLD_TILES);
  for (let ty = 0; ty < WORLD_TILES; ty++) {
    for (let tx = 0; tx < WORLD_TILES; tx++) {
      let m = -Infinity;
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = tx + dx;
        if (nx < 0 || nx >= WORLD_TILES) continue;
        if (isWaterCand[ty * WORLD_TILES + nx]) continue;
        m = Math.max(m, tileH(nx, ty));
      }
      rowMax[ty * WORLD_TILES + tx] = m;
    }
  }
  for (let tx = 0; tx < WORLD_TILES; tx++) {
    for (let ty = 0; ty < WORLD_TILES; ty++) {
      let m = -Infinity;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = ty + dy;
        if (ny < 0 || ny >= WORLD_TILES) continue;
        m = Math.max(m, rowMax[ny * WORLD_TILES + tx]);
      }
      cliffReliefCache[ty * WORLD_TILES + tx] = Number.isFinite(m) ? m : 0;
    }
  }
}

/** Uferrampe: blendet eine Höhe zur flachen Plattform hin aus, je näher am
 *  Wasser desto stärker. Eine Quelle für den Ur-Bake und den Flachlauf. */
function shoreBlendHeight(height, waterDistance, blendTiles, platformHeight, risePerTile) {
  const target = platformHeight + Math.max(0, waterDistance - 1) * risePerTile;
  const blend = Math.pow((blendTiles - waterDistance + 1) / blendTiles, 1.25);
  return height + (target - height) * blend;
}

// Welt-Höhen-Grid: bedeckt = (h - Wasserlinie) · Faktor; unbedeckt = Tiefenrampe.
const HW = new Float32Array(GRID * GRID);
for (let gz = 0; gz < GRID; gz++) {
  for (let gx = 0; gx < GRID; gx++) {
    const o = gz * GRID + gx;
    const tx = Math.min(WORLD_TILES - 1, (gx / SAMPLES_PER_TILE) | 0);
    const ty = Math.min(WORLD_TILES - 1, (gz / SAMPLES_PER_TILE) | 0);
    const to = ty * WORLD_TILES + tx;
    if (!Number.isNaN(H[o])) {
      const rawHeight = (H[o] - WATERLINE_N) * HEIGHT_SCALE;
      const waterDistance = distToWaterRaw[to];
      const enclosedWaterNear = enclosedLabel[to] >= 0;
      // § Modelltreue 13.0: Im Treue-Modus bleibt die Landhöhe exakt die des
      // Modells. Der Ufer-Blend war die erste von drei Stellen, an denen die
      // Klippen der GLB verschwanden.
      const accessible = !RAW_TERRAIN_FIDELITY
        && waterDistance > 0 && waterDistance <= SHORE_BLEND_TILES
        && rawHeight < SHORE_CLIFF_HEIGHT
        && (enclosedWaterNear || shoreHash(tx, ty) >= SHORE_CLIFF_ZONE_RATIO);
      if (accessible) {
        accessibleShoreZone[to] = 1;
        HW[o] = shoreBlendHeight(rawHeight, waterDistance, SHORE_BLEND_TILES, SHORE_PLATFORM_HEIGHT, SHORE_RISE_PER_TILE);
      } else {
        HW[o] = rawHeight;
      }
    } else {
      const d = Math.max(1, distToLand[to]);
      const enclosed = enclosedLabel[to] >= 0;
      // § Modelltreue 13.0 — WASSER KOMMT NACH DEM MODELL, ALSO IST SEINE TIEFE
      // UNSERE WAHL. Die GLB modelliert keinen Gewässergrund; die Tiefenrampe
      // ist reine Bake-Entscheidung und damit der richtige Hebel, wenn eine
      // Anforderung an ihr scheitert.
      //
      // Gemessen auf der modelltreuen Insel: `river_port` (braucht 0,7 Tiefe auf
      // 4×3 Wasser) war an NULL Stellen baubar, `dock_small` (0,55) an 43. Grund
      // war nicht das Gelände, sondern die frühere Rampe: Binnengewässer lagen
      // pauschal bei 0,42 und der Ozean am Ufer bei 0,46 — beides unter den
      // Mindesttiefen der Wassergebäude. Die Rampe steigt jetzt am Ufer schneller
      // an und bleibt zur Mitte hin gedeckelt.
      HW[o] = enclosed
        ? -Math.min(1.6, 0.5 + d * 0.3)
        : -Math.min(2.6, 0.58 + d * 0.24);
    }
  }
}

// § Modelltreue 13.0 — Referenzkopie der reinen Modellhöhe. Sie wird nie
// verändert und dient am Ende ausschließlich als Beweis, wie weit die
// ausgelieferte Welt vom Modell abweicht (Bericht `fidelity`).
const HW_MODEL = Float32Array.from(HW);

// ---------------------------------------------------------------------------
// 5. Biome klassifizieren (Kachel-Ebene)
// ---------------------------------------------------------------------------
// Deterministische Noise (identisches Muster wie startRegion.tileHash/valueNoise).
function hash2(ix, iy) {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263)) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}
const smooth01 = (t) => t * t * (3 - 2 * t);
function valueNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smooth01(x - ix), fy = smooth01(y - iy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}
const fbm = (x, y) => valueNoise(x, y) * 0.65 + valueNoise(x * 2.1 + 5.2, y * 2.1 + 1.7) * 0.35;

const tileH = (tx, ty) => HW[(ty * SAMPLES_PER_TILE + 1) * GRID + tx * SAMPLES_PER_TILE + 1]; // Kachel-Mitte
function tileSlope(tx, ty) {
  const c = tileH(tx, ty);
  let m = 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = Math.min(WORLD_TILES - 1, Math.max(0, tx + dx));
    const ny = Math.min(WORLD_TILES - 1, Math.max(0, ty + dy));
    m = Math.max(m, Math.abs(tileH(nx, ny) - c));
  }
  return m;
}

// Distanz zu Fluss/See (für fertile) und zu beliebigem Wasser (für sand) — BFS folgt unten nach der Wasser-Typisierung.
const terrain = new Uint8Array(WORLD_TILES * WORLD_TILES);

// 5a. Wasser-Typen: Ozean/See = water, schmale Rinnen = river.
for (let ty = 0; ty < WORLD_TILES; ty++) {
  for (let tx = 0; tx < WORLD_TILES; tx++) {
    const o = ty * WORLD_TILES + tx;
    if (!isWaterCand[o]) continue;
    const enclosed = enclosedLabel[o] >= 0;
    if (enclosed && enclosedSizes[enclosedLabel[o]] < LAKE_MIN_TILES) { terrain[o] = T.river; continue; }
    // Breiten-Heuristik: wenige Wasser-Nachbarn im 5×5-Fenster ⇒ schmale Rinne ⇒ Fluss.
    let waterNear = 0;
    for (let dy = -RIVER_WIDTH_WINDOW; dy <= RIVER_WIDTH_WINDOW; dy++) {
      for (let dx = -RIVER_WIDTH_WINDOW; dx <= RIVER_WIDTH_WINDOW; dx++) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) { waterNear++; continue; }
        if (isWaterCand[ny * WORLD_TILES + nx]) waterNear++;
      }
    }
    terrain[o] = waterNear < RIVER_MAX_NEIGHBORS ? T.river : T.water;
  }
}

// 5b. Distanz zu Wasser (beliebig) und zu Süßwasser (river|see=eingeschlossenes water) per BFS.
function bfsDistance(isSource) {
  const dist = new Int32Array(WORLD_TILES * WORLD_TILES).fill(-1);
  const q = [];
  for (let o = 0; o < dist.length; o++) if (isSource(o)) { dist[o] = 0; q.push(o); }
  let head = 0;
  while (head < q.length) {
    const c = q[head++];
    const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const no = ny * WORLD_TILES + nx;
      if (dist[no] < 0) { dist[no] = dist[c] + 1; q.push(no); }
    }
  }
  return dist;
}
const distWater = bfsDistance((o) => isWaterCand[o] === 1);
const distFresh = bfsDistance((o) => terrain[o] === T.river || (terrain[o] === T.water && enclosedLabel[o] >= 0));

// ---------------------------------------------------------------------------
// 5b². Terraforming: Land AUSSERHALB des Massivs iterativ einebnen (Phase B1)
// ---------------------------------------------------------------------------
// Siehe die ausführliche Begründung bei TERRAFORM_ROUNDS. Kurz: Klassifikation
// und Glättung wechseln sich ab, damit die Glättung Baufläche ERZEUGEN kann.
// Beide Helfer werden anschließend von §6 unverändert wiederverwendet — es gibt
// nur EINEN Glättungs-/Kappungs-Code im Bake.

/** Erzwingt |ΔHW| ≤ maxStep zwischen benachbarten Knoten der Maske. Gibt die
 *  Zahl der korrigierten Kanten zurück (0 = konvergiert). */
function clampSweep(nodeMask, maxStep) {
  let violations = 0;
  for (let gz = 0; gz < GRID; gz++) {
    for (let gx = 0; gx < GRID - 1; gx++) {
      const a = gz * GRID + gx, b = a + 1;
      if (!nodeMask[a] || !nodeMask[b]) continue;
      const d = HW[b] - HW[a];
      if (Math.abs(d) > maxStep + 1e-5) {
        const ex = (Math.abs(d) - maxStep) / 2 * Math.sign(d);
        HW[a] += ex; HW[b] -= ex; violations++;
      }
    }
  }
  for (let gx = 0; gx < GRID; gx++) {
    for (let gz = 0; gz < GRID - 1; gz++) {
      const a = gz * GRID + gx, b = a + GRID;
      if (!nodeMask[a] || !nodeMask[b]) continue;
      const d = HW[b] - HW[a];
      if (Math.abs(d) > maxStep + 1e-5) {
        const ex = (Math.abs(d) - maxStep) / 2 * Math.sign(d);
        HW[a] += ex; HW[b] -= ex; violations++;
      }
    }
  }
  return violations;
}

/**
 * Laplace-Glättung + Hangkappung auf den Knoten der Maske. Mutiert HW.
 *
 * `onlyRough` ist der Unterschied zwischen „einebnen" und „verschmieren":
 * eine reine Laplace-Glättung zieht auch bereits EBENE Flächen in Richtung
 * ihrer Nachbarn und kippt dadurch Plateaus in sanfte Rampen — genau das
 * Gegenteil von „größere zusammenhängende Bauflächen" (§3.1). Mit `onlyRough`
 * werden ausschließlich Knoten angefasst, deren größter Nachbarschritt die
 * erlaubte Stufe überschreitet; alles, was schon eben ist, bleibt exakt eben.
 */
function smoothAndClamp(nodeMask, iterations, { onlyRough = false, maxStep = MAX_BUILDABLE_STEP } = {}) {
  for (let it = 0; it < iterations; it++) {
    const src = HW.slice();
    for (let gz = 1; gz < GRID - 1; gz++) {
      for (let gx = 1; gx < GRID - 1; gx++) {
        const o = gz * GRID + gx;
        if (!nodeMask[o]) continue;
        if (onlyRough) {
          const step = Math.max(
            Math.abs(src[o] - src[o - 1]), Math.abs(src[o] - src[o + 1]),
            Math.abs(src[o] - src[o - GRID]), Math.abs(src[o] - src[o + GRID]),
          );
          if (step <= maxStep) continue;
        }
        const avg = (src[o - 1] + src[o + 1] + src[o - GRID] + src[o + GRID]) / 4;
        HW[o] = src[o] + (avg - src[o]) * SMOOTH_BLEND;
      }
    }
    clampSweep(nodeMask, maxStep);
  }
}

/** Hebt eine Kachelmaske auf das Knotenraster (ein Knoten gehört zur Maske,
 *  sobald seine Kachel dazugehört). */
function nodeMaskFromTiles(tileMask, out) {
  out.fill(0);
  for (let gz = 0; gz < GRID; gz++) {
    for (let gx = 0; gx < GRID; gx++) {
      const tx = Math.min(WORLD_TILES - 1, (gx / SAMPLES_PER_TILE) | 0);
      const ty = Math.min(WORLD_TILES - 1, (gz / SAMPLES_PER_TILE) | 0);
      if (tileMask[ty * WORLD_TILES + tx]) out[gz * GRID + gx] = 1;
    }
  }
  return out;
}

/**
 * § Map Flattening Phase B1 — Terraforming. Ebnet Land AUSSERHALB des Massivs
 * iterativ ein. Läuft seit § World Overhaul 12.0 (D-041) VOR der
 * Regionssegmentierung, damit Regionen, Startregion und Statistik das fertige,
 * bespielbare Gelände beschreiben (§6b-flat).
 */
function terraformNonMassifLand() {
  const terraformTiles = new Uint8Array(WORLD_TILES * WORLD_TILES);
  const terraformNodes = new Uint8Array(GRID * GRID);
  for (let round = 0; round < TERRAFORM_ROUNDS; round++) {
    terraformTiles.fill(0);
    let selected = 0;
    for (let ty = 0; ty < WORLD_TILES; ty++) {
      for (let tx = 0; tx < WORLD_TILES; tx++) {
        const o = ty * WORLD_TILES + tx;
        if (isWaterCand[o]) continue;
        // Das Massiv ist in JEDER Runde tabu — es bleibt das visuelle Highlight.
        if (tileH(tx, ty) > MOUNTAIN_HEIGHT) continue;
        if (tileSlope(tx, ty) > TERRAFORM_SLOPE_GATE) continue;
        terraformTiles[o] = 1;
        selected++;
      }
    }
    // Übergangsband: Ohne die Randkacheln endet die eingeebnete Fläche an einer
    // WAND — das Gefälle, das im Inneren verschwindet, sammelt sich an der
    // Grenze zum unangetasteten Gelände. Genau dort entstanden neue steile
    // Kacheln (und damit neues „Gebirge"), was §3.1 („weniger abrupte
    // Höhenwechsel", „weichere Übergänge") widerspricht. Eine Kachel Dilatation
    // verteilt den Übergang, ohne das Massiv anzufassen.
    const withBand = terraformTiles.slice();
    for (let ty = 1; ty < WORLD_TILES - 1; ty++) {
      for (let tx = 1; tx < WORLD_TILES - 1; tx++) {
        const o = ty * WORLD_TILES + tx;
        if (terraformTiles[o] || isWaterCand[o]) continue;
        if (tileH(tx, ty) > MOUNTAIN_HEIGHT) continue;
        const touchesFlattened = terraformTiles[o - 1] || terraformTiles[o + 1]
          || terraformTiles[o - WORLD_TILES] || terraformTiles[o + WORLD_TILES];
        if (touchesFlattened) withBand[o] = 1;
      }
    }
    nodeMaskFromTiles(withBand, terraformNodes);
    smoothAndClamp(terraformNodes, TERRAFORM_ITERATIONS, { onlyRough: true, maxStep: FLAT_MAX_BUILDABLE_STEP });
    // Terraformtes Land darf nicht unter die Wasserlinie sacken.
    for (let o = 0; o < HW.length; o++) if (terraformNodes[o] && HW[o] < 0.05) HW[o] = 0.05;
    console.log(`  Terraforming Runde ${round + 1}/${TERRAFORM_ROUNDS}: ${selected} Kacheln eingeebnet`);
  }
}

// 0 = kein Ufer, 1 = flache Meeresküste, 2 = Flussufer, 3 = Seeufer,
// 4 = bewusste Steilküste. Die Typisierung ist Bake-Wahrheit für Renderer,
// Brückenkandidaten und künftige wasserbezogene Gebäude.
const shoreTypeGrid = new Uint8Array(WORLD_TILES * WORLD_TILES);
function classifyShoreTypes(maxHeight, maxSlope) {
  shoreTypeGrid.fill(0);
  for (let ty = 1; ty < WORLD_TILES - 1; ty++) {
    for (let tx = 1; tx < WORLD_TILES - 1; tx++) {
      const o = ty * WORLD_TILES + tx;
      if (isWaterCand[o] || distWater[o] !== 1) continue;
      const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .map(([dx, dy]) => (ty + dy) * WORLD_TILES + tx + dx)
        .filter((no) => isWaterCand[no]);
      const isAccessible = accessibleShoreZone[o]
        && tileH(tx, ty) < maxHeight
        && tileSlope(tx, ty) <= maxSlope;
      if (!isAccessible) { shoreTypeGrid[o] = 4; continue; }
      if (neighbors.some((no) => terrain[no] === T.river)) shoreTypeGrid[o] = 2;
      else if (neighbors.some((no) => enclosedLabel[no] >= 0)) shoreTypeGrid[o] = 3;
      else shoreTypeGrid[o] = 1;
    }
  }
}
classifyShoreTypes(SHORE_ACCESSIBLE_MAX_HEIGHT, SHORE_ACCESSIBLE_MAX_SLOPE);

// 5c. Land-Biome. `mountainSlopeMinHeight` = Höhe, ab der Hang ALLEIN Gebirge
// macht (0 = überall, wie bis v1.10; § Map Flattening B3 setzt eine Basishöhe).
function classifyBiomes(mountainSlopeMinHeight) {
  for (let ty = 0; ty < WORLD_TILES; ty++) {
    for (let tx = 0; tx < WORLD_TILES; tx++) {
      const o = ty * WORLD_TILES + tx;
      if (isWaterCand[o]) continue;
      const h = tileH(tx, ty);
      const s = tileSlope(tx, ty);
      if (h > MOUNTAIN_HEIGHT || (s > MOUNTAIN_SLOPE && h > mountainSlopeMinHeight)) {
        terrain[o] = T.mountain;
        continue;
      }
      if (h < SAND_MAX_HEIGHT && distWater[o] <= SAND_WATER_DIST) { terrain[o] = T.sand; continue; }
      if (h < FERTILE_MAX_HEIGHT && s < FERTILE_MAX_SLOPE && distFresh[o] <= FERTILE_WATER_DIST && fbm(tx * 0.11 + 40, ty * 0.11 + 8) > 0.42) {
        terrain[o] = T.fertile;
        continue;
      }
      const forestNoise = fbm(tx * 0.055 + 17, ty * 0.055 + 71);
      if (h > FOREST_MIN_HEIGHT && h < FOREST_MAX_HEIGHT && s < FOREST_MAX_SLOPE && forestNoise > 0.58) {
        terrain[o] = T.forest;
        continue;
      }
      terrain[o] = T.grass;
    }
  }
}
classifyBiomes(MOUNTAIN_SLOPE_MIN_HEIGHT);

// ---------------------------------------------------------------------------
// 6. Bebaubares Land glätten (Sim hat keine Hangprüfung)
// ---------------------------------------------------------------------------
// Nicht jedes optisch grüne Hangstück ist eine Baufläche. Erst flache
// Terrainkacheln markieren, dann den Maskenrand um eine Kachel erodieren, damit
// kein Footprint über eine Plateaukante ragt. Diese Maske wird später direkt an
// die Simulation ausgegeben und ist damit dieselbe Wahrheit wie der Bake.
const prelimBuildable = new Uint8Array(WORLD_TILES * WORLD_TILES);
const buildableMask = new Uint8Array(WORLD_TILES * WORLD_TILES);
const waterfrontBuildableMask = new Uint8Array(WORLD_TILES * WORLD_TILES);
let waterfrontAprons = [];

/** Steilwand-Kachel: Hang über MOUNTAIN_SLOPE UND oberhalb der Basishöhe. */
function isCliffTile(tx, ty, minHeight) {
  return tileSlope(tx, ty) >= MOUNTAIN_SLOPE && tileH(tx, ty) > minHeight;
}

function classifyBuildable(maxTileSlope, minOrthogonal, apronTarget, apronMinDistance, blendTiles, cliffMinHeight) {
  prelimBuildable.fill(0);
  buildableMask.fill(0);
  waterfrontBuildableMask.fill(0);
  waterfrontAprons = [];
  for (let ty = 0; ty < WORLD_TILES; ty++) {
    for (let tx = 0; tx < WORLD_TILES; tx++) {
      const o = ty * WORLD_TILES + tx;
      const slope = tileSlope(tx, ty);
      const gentleWaterfront = shoreTypeGrid[o] >= 1 && shoreTypeGrid[o] <= 3 && slope <= 1.2;
      if (BUILDABLE.has(terrain[o]) && (slope <= maxTileSlope || gentleWaterfront)) prelimBuildable[o] = 1;
    }
  }
  for (let ty = 1; ty < WORLD_TILES - 1; ty++) {
    for (let tx = 1; tx < WORLD_TILES - 1; tx++) {
      const o = ty * WORLD_TILES + tx;
      if (!prelimBuildable[o]) continue;
      let orthogonalBuildable = 0, buildableNeighbors = 0, landNeighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const no = (ty + dy) * WORLD_TILES + tx + dx;
          if (!isWaterCand[no]) landNeighbors++;
          if (prelimBuildable[no]) buildableNeighbors++;
          if ((dx === 0) !== (dy === 0) && prelimBuildable[no]) orthogonalBuildable++;
        }
      }
      const safe = orthogonalBuildable >= minOrthogonal ? 1 : 0;
      // Direkte flache Uferkacheln dürfen die sonst richtige Erosion bewusst
      // durchbrechen. So kann ein 3×3/5×5-Footprint bis ans Wasser reichen, ohne
      // dass Steilküsten oder unsichere Einzelkacheln freigegeben werden.
      const waterfrontSafe = shoreTypeGrid[o] >= 1 && shoreTypeGrid[o] <= 3
        && buildableNeighbors >= 4 && landNeighbors >= 4 && tileSlope(tx, ty) <= 1.2;
      buildableMask[o] = safe || waterfrontSafe ? 1 : 0;
    }
  }

  // Echte 5×5-Uferplattformen garantieren ausreichend Tiefe für Hafen-, Pumpen-
  // und spätere Wassergebäude. Sie werden aus bereits als flach klassifizierten
  // Uferzonen gewählt, bleiben auseinander und erweitern ausschließlich
  // bestehendes Land — niemals Wasser oder Gebirge.
  for (let ty = 4; ty < WORLD_TILES - 5; ty++) {
    for (let tx = 4; tx < WORLD_TILES - 5; tx++) {
      const o = ty * WORLD_TILES + tx;
      if (shoreTypeGrid[o] < 1 || shoreTypeGrid[o] > 3) continue;
      if (waterfrontAprons.some((apron) => Math.hypot(apron.center.x - tx, apron.center.y - ty) < apronMinDistance)) continue;
      const waterDirection = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .find(([dx, dy]) => isWaterCand[(ty + dy) * WORLD_TILES + tx + dx]);
      if (!waterDirection) continue;
      const [wx, wy] = waterDirection;
      const lx = -wx, ly = -wy;
      const px = -ly, py = lx;
      const cells = [];
      let valid = true;
      for (let depth = 0; depth < 5 && valid; depth++) {
        for (let side = -2; side <= 2; side++) {
          const x = tx + lx * depth + px * side;
          const y = ty + ly * depth + py * side;
          const co = y * WORLD_TILES + x;
          if (isWaterCand[co] || !BUILDABLE.has(terrain[co]) || distWater[co] > blendTiles || tileH(x, y) >= 5.5) {
            valid = false;
            break;
          }
          cells.push(co);
        }
      }
      if (!valid) continue;
      for (const co of cells) {
        prelimBuildable[co] = 1;
        buildableMask[co] = 1;
      }
      waterfrontAprons.push({ center: { x: tx, y: ty }, cells });
      if (waterfrontAprons.length >= apronTarget) break;
    }
    if (waterfrontAprons.length >= apronTarget) break;
  }
  // Konsistenzgarantie (§ Map Flattening): eine Kachel darf nicht gleichzeitig
  // „bebaubar" und „Steilwand" sein. Die Uferplattformen (aprons) setzen das
  // Bebaubar-Bit bewusst unabhängig vom Hang — ohne diesen Riegel entstanden
  // Kacheln, die `validatePlacement` über `cliffOverlap` trotzdem ablehnt, und
  // auf denen weder Gebäude noch Straße möglich waren. `undefined` = kein
  // Riegel (Ur-Durchlauf, muss bitgleich bleiben).
  //
  // Derselbe Riegel deckelt den Hang auf das, was eine BODENSTRASSE noch
  // schafft (`GROUND_ROAD_MAX_SLOPE` in `src/game/buildings/terrainFit.ts`).
  // Sonst entstünden Bauplätze, die niemals ans Straßennetz kommen — eine
  // Falle für den Spieler und ein Verstoß gegen §5 des Auftrags
  // („Infrastruktur muss dort anschließbar sein"). `tests/mapBuildability.test.ts`
  // hält beide Werte über die Orphan-Prüfung zusammen.
  if (cliffMinHeight !== undefined) {
    for (let ty = 0; ty < WORLD_TILES; ty++) {
      for (let tx = 0; tx < WORLD_TILES; tx++) {
        const o = ty * WORLD_TILES + tx;
        if (!buildableMask[o]) continue;
        if (isCliffTile(tx, ty, cliffMinHeight) || tileSlope(tx, ty) > FLAT_MAX_ROAD_SLOPE) buildableMask[o] = 0;
      }
    }
  }
  for (let o = 0; o < waterfrontBuildableMask.length; o++) {
    if (buildableMask[o] && shoreTypeGrid[o] >= 1 && shoreTypeGrid[o] <= 3) waterfrontBuildableMask[o] = 1;
  }
}
classifyBuildable(
  MAX_BUILDABLE_TILE_SLOPE, MIN_ORTHOGONAL_BUILDABLE,
  SHORE_APRON_TARGET, SHORE_APRON_MIN_DISTANCE, SHORE_BLEND_TILES,
);
const nodeBuildable = new Uint8Array(GRID * GRID);
/** Glättet + kappt das aktuell bebaubare Land und hält es über der Wasserlinie. */
function flattenBuildableLand(sweeps = 800, options = {}) {
  const maxStep = options.maxStep ?? MAX_BUILDABLE_STEP;
  nodeMaskFromTiles(buildableMask, nodeBuildable);
  smoothAndClamp(nodeBuildable, SMOOTH_ITERATIONS, { ...options, maxStep });
  // Abschließende Kappungs-Sweeps bis zur Konvergenz: ein einzelner Gauss-Seidel-
  // Durchlauf je Iteration lässt an Klippenrändern Rest-Verletzungen stehen —
  // hier wird die Bebaubar-Garantie (max. Schritt) hart erzwungen.
  let violations = -1;
  for (let sweep = 0; sweep < sweeps; sweep++) {
    violations = clampSweep(nodeBuildable, maxStep);
    if (violations === 0) break;
  }
  // Die Kappung ist eine Glättungshilfe, KEINE Garantie: seit dem Map-Flattening
  // umfasst die Maske auch echtes Hügelland, dessen vollständige Relaxation
  // Zehntausende Gauss-Seidel-Durchläufe bräuchte. Die verbindliche Zusage für
  // Gebäude ist die Höhendelta-Prüfung in `validatePlacement` (Phase C), die den
  // TATSÄCHLICHEN Footprint misst. Deshalb hier eine ehrliche Kennzahl statt
  // einer Warnung, die nach Fehler aussieht.
  if (violations > 0) {
    const edges = nodeBuildable.reduce((sum, v) => sum + v, 0) * 2;
    console.log(`  Restgefälle über ${maxStep}/Sample: ${violations} Kanten (${(100 * violations / Math.max(1, edges)).toFixed(2)} % der bebaubaren Kanten)`);
  }
  // Bebaubares Land darf nach der Glättung nicht unter die Wasserlinie rutschen.
  for (let o = 0; o < HW.length; o++) if (nodeBuildable[o] && HW[o] < 0.05) HW[o] = 0.05;
  return violations;
}
// § Modelltreue 13.0: auch dieser Ur-Glättungslauf ist eine Geländeänderung.
if (!RAW_TERRAIN_FIDELITY) flattenBuildableLand();

// Konservativer Sicherheitsgurt für sehr schmale, nicht exakt senkrechte
// Quellpolygone: ausschließlich im direkten Küstenband und ausschließlich,
// wenn ein Hochpunkt von höchstens einem seiner acht Nachbarn gestützt wird.
// Zusammenhängende Klippen und Berggrate bleiben damit unangetastet.
/** Acht Nachbarhöhen eines Knotens (nur im direkten Küstenband relevant). */
function coastNeighborhood(source, o) {
  const neighbors = [
    source[o - GRID - 1], source[o - GRID], source[o - GRID + 1],
    source[o - 1], source[o + 1],
    source[o + GRID - 1], source[o + GRID], source[o + GRID + 1],
  ];
  const ordered = neighbors.slice().sort((a, b) => a - b);
  return { neighbors, median: (ordered[3] + ordered[4]) / 2 };
}

function repairCoastPeaks() {
  let repaired = 0;
  const source = HW.slice();
  for (let gz = 1; gz < GRID - 1; gz++) {
    for (let gx = 1; gx < GRID - 1; gx++) {
      const o = gz * GRID + gx;
      const tx = Math.min(WORLD_TILES - 1, (gx / SAMPLES_PER_TILE) | 0);
      const ty = Math.min(WORLD_TILES - 1, (gz / SAMPLES_PER_TILE) | 0);
      if (distToWaterRaw[ty * WORLD_TILES + tx] > 2) continue;
      const { neighbors, median } = coastNeighborhood(source, o);
      const supportingNeighbors = neighbors.filter((height) => height >= source[o] - 2.5).length;
      if (source[o] <= median + 6 || supportingNeighbors > 1) continue;
      HW[o] = median;
      repaired++;
    }
  }
  return repaired;
}

/**
 * § 12.2 — Zahl der Achsen, in denen der Knoten BEIDSEITIG deutlich höher liegt.
 *
 * Das ist der Unterschied zwischen Splitter und Klippenkante: eine Nadel ist in
 * allen vier Achsen ein Hochpunkt, eine Kante oder ein Grat höchstens in zwei
 * (entlang der Kante liegen gleich hohe Nachbarn).
 */
function needleAxisCount(source, o, margin) {
  let axes = 0;
  for (const [a, b] of [
    [o - 1, o + 1],
    [o - GRID, o + GRID],
    [o - GRID - 1, o + GRID + 1],
    [o - GRID + 1, o + GRID - 1],
  ]) {
    if (source[o] > source[a] + margin && source[o] > source[b] + margin) axes++;
  }
  return axes;
}

/** Trifft die Nadelbedingung? Wird von Reparatur UND Messung geteilt, damit die
 *  Kennzahl nie wieder etwas anderes prüft als der Riegel (§12.2). */
function isTerrainNeedle(source, o, gx, gz) {
  const tx = Math.min(WORLD_TILES - 1, (gx / SAMPLES_PER_TILE) | 0);
  const ty = Math.min(WORLD_TILES - 1, (gz / SAMPLES_PER_TILE) | 0);
  const inShoreBand = distToWaterRaw[ty * WORLD_TILES + tx] <= NEEDLE_SHORE_BAND;
  // Das Massiv bleibt Highlight (§3.2): außerhalb des Uferbands nur Tiefland.
  if (!inShoreBand && source[o] >= NEEDLE_LOWLAND_HEIGHT) return null;
  const { neighbors, median } = coastNeighborhood(source, o);
  if (source[o] - median < NEEDLE_MIN_RISE) return null;
  const supporting = neighbors.filter((height) => height >= source[o] - NEEDLE_SUPPORT_TOLERANCE).length;
  if (supporting > NEEDLE_MAX_SUPPORT) return null;
  if (needleAxisCount(source, o, NEEDLE_AXIS_MARGIN) < NEEDLE_MIN_AXES) return null;
  return median;
}

/**
 * § 12.2 — entfernt Geländenadeln (die im Spieltest gemeldeten „Klippen-Zacken").
 *
 * Mehrere Durchgänge, weil eine abgesenkte Nadel ihren direkten Nachbarn zur
 * neuen Nadel machen kann (Splitter treten in Gruppen auf). Jeder Durchgang
 * arbeitet auf einer Kopie, damit das Ergebnis reihenfolgeunabhängig bleibt.
 */
function repairTerrainNeedles() {
  let repaired = 0;
  for (let pass = 0; pass < NEEDLE_PASSES; pass++) {
    const source = HW.slice();
    let hits = 0;
    for (let gz = 1; gz < GRID - 1; gz++) {
      for (let gx = 1; gx < GRID - 1; gx++) {
        const o = gz * GRID + gx;
        const median = isTerrainNeedle(source, o, gx, gz);
        if (median === null) continue;
        HW[o] = median;
        hits++;
      }
    }
    repaired += hits;
    if (hits === 0) break;
  }
  return repaired;
}

/** Verbleibende Nadeln — Regressionskennzahl, hart in den Tests geprüft. */
function countTerrainNeedles() {
  let count = 0;
  for (let gz = 1; gz < GRID - 1; gz++) {
    for (let gx = 1; gx < GRID - 1; gx++) {
      if (isTerrainNeedle(HW, gz * GRID + gx, gx, gz) !== null) count++;
    }
  }
  return count;
}

/**
 * § 12.2 — ECHTE KLIPPEN: ebener Kopf auf zusammenhängender Steilküste.
 *
 * Läuft NACH `classifyShoreTypes`, damit `shoreTypeGrid === 4` (bewusste
 * Steilküste) die Auswahl trifft, und VOR der letzten Bebaubar-Ableitung, damit
 * die neue ebene Fläche auch als Baufläche ankommt.
 *
 * Nur Knoten, deren VIER angrenzende Kacheln Land sind, werden angehoben. Die
 * Wasserkante behält damit ihren Knoten — die Wand entsteht innerhalb der
 * äußersten Landkachel und nicht als angehobene Wasserfläche.
 */
function buildCliffPlateaus() {
  const visited = new Uint8Array(WORLD_TILES * WORLD_TILES);
  const nodeIsInland = new Uint8Array(GRID * GRID);
  for (let gz = 0; gz < GRID; gz++) {
    for (let gx = 0; gx < GRID; gx++) {
      let dry = 0, seen = 0;
      for (const [dx, dz] of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) {
        const tx = ((gx / SAMPLES_PER_TILE) | 0) + dx;
        const ty = ((gz / SAMPLES_PER_TILE) | 0) + dz;
        if (tx < 0 || ty < 0 || tx >= WORLD_TILES || ty >= WORLD_TILES) continue;
        seen++;
        if (!isWaterCand[ty * WORLD_TILES + tx]) dry++;
      }
      nodeIsInland[gz * GRID + gx] = seen > 0 && dry === seen ? 1 : 0;
    }
  }

  let plateaus = 0, plateauTiles = 0;
  for (let sy = 1; sy < WORLD_TILES - 1; sy++) {
    for (let sx = 1; sx < WORLD_TILES - 1; sx++) {
      const start = sy * WORLD_TILES + sx;
      if (visited[start] || shoreTypeGrid[start] !== 4) continue;
      // (1) Zusammenhängender Steilküsten-Abschnitt (8-Nachbarschaft).
      const component = [];
      const queue = [start];
      visited[start] = 1;
      while (queue.length) {
        const o = queue.pop();
        component.push(o);
        const tx = o % WORLD_TILES, ty = (o / WORLD_TILES) | 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = tx + dx, ny = ty + dy;
            if (nx < 1 || ny < 1 || nx >= WORLD_TILES - 1 || ny >= WORLD_TILES - 1) continue;
            const no = ny * WORLD_TILES + nx;
            if (visited[no] || shoreTypeGrid[no] !== 4) continue;
            visited[no] = 1;
            queue.push(no);
          }
        }
      }
      if (component.length < CLIFF_PLATEAU_MIN_COMPONENT) continue;
      const faceHeights = component.map((o) => tileH(o % WORLD_TILES, (o / WORLD_TILES) | 0)).sort((a, b) => a - b);
      if (faceHeights[faceHeights.length >> 1] < CLIFF_PLATEAU_MIN_HEIGHT) continue;

      // (2) Kopf des Abschnitts: BFS landeinwärts bis CLIFF_PLATEAU_DEPTH.
      const depth = new Map();
      const bfs = [];
      for (const o of component) { depth.set(o, 0); bfs.push(o); }
      for (let head = 0; head < bfs.length; head++) {
        const o = bfs[head];
        const d = depth.get(o);
        if (d >= CLIFF_PLATEAU_DEPTH) continue;
        const tx = o % WORLD_TILES, ty = (o / WORLD_TILES) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = tx + dx, ny = ty + dy;
          if (nx < 1 || ny < 1 || nx >= WORLD_TILES - 1 || ny >= WORLD_TILES - 1) continue;
          const no = ny * WORLD_TILES + nx;
          if (depth.has(no) || isWaterCand[no]) continue;
          // Das Massiv bleibt unangetastet (§3.2).
          if (tileH(nx, ny) > MOUNTAIN_HEIGHT) continue;
          depth.set(no, d + 1);
          bfs.push(no);
        }
      }
      // (3) Plateauhöhe = Hinterlandniveau am inneren Rand. Genau dadurch
      //     entsteht der vom Auftrag verlangte „Verbund zum Land": das Plateau
      //     schließt bündig an, statt eine zweite Kante zu erzeugen.
      const ring = [...depth.entries()]
        .filter(([, d]) => d >= CLIFF_PLATEAU_DEPTH - 1)
        .map(([o]) => tileH(o % WORLD_TILES, (o / WORLD_TILES) | 0))
        .sort((a, b) => a - b);
      const inner = ring.length ? ring : faceHeights;
      const plateauHeight = Math.max(CLIFF_PLATEAU_MIN_HEIGHT, inner[inner.length >> 1]);

      // (4) Kopf einebnen, in den letzten Kacheln weich ans Hinterland führen.
      const flatUntil = Math.max(0, CLIFF_PLATEAU_DEPTH - CLIFF_PLATEAU_BLEND_TILES);
      for (const [o, d] of depth) {
        const tx = o % WORLD_TILES, ty = (o / WORLD_TILES) | 0;
        const t = d <= flatUntil
          ? 1
          : 1 - (d - flatUntil) / Math.max(1, CLIFF_PLATEAU_DEPTH - flatUntil);
        if (t <= 0) continue;
        for (let sz = 0; sz <= SAMPLES_PER_TILE; sz++) {
          for (let sxx = 0; sxx <= SAMPLES_PER_TILE; sxx++) {
            const gx = tx * SAMPLES_PER_TILE + sxx;
            const gz = ty * SAMPLES_PER_TILE + sz;
            const no = gz * GRID + gx;
            if (!nodeIsInland[no]) continue;
            HW[no] += (plateauHeight - HW[no]) * t;
          }
        }
        plateauTiles++;
      }
      plateaus++;
    }
  }
  return { plateaus, plateauTiles };
}

// Regression-Diagnose für den ursprünglichen Küstenkegel-Fehler. Ein echter
// Grat/Kliff wird von mehreren hohen Nachbarn getragen; ein einzelner Peak mehr
// als 6 Weltmeter über dem Median seiner acht Nachbarn ist im regelmäßigen
// Heightfield dagegen geometrisch unplausibel. Dieser Wert wird mitgebacken und
// in tests/newIslandBake.test.ts hart auf 0 geprüft.
function measureCoastGeometry() {
  let isolatedPeaks = 0;
  let maxNeighborStep = 0;
  for (let gz = 1; gz < GRID - 1; gz++) {
    for (let gx = 1; gx < GRID - 1; gx++) {
      const o = gz * GRID + gx;
      const tx = Math.min(WORLD_TILES - 1, (gx / SAMPLES_PER_TILE) | 0);
      const ty = Math.min(WORLD_TILES - 1, (gz / SAMPLES_PER_TILE) | 0);
      if (distToWaterRaw[ty * WORLD_TILES + tx] > 2) continue;
      const { neighbors, median } = coastNeighborhood(HW, o);
      const supportingNeighbors = neighbors.filter((height) => height >= HW[o] - 2.5).length;
      if (HW[o] > median + 6 && supportingNeighbors <= 1) isolatedPeaks++;
      for (const height of neighbors) maxNeighborStep = Math.max(maxNeighborStep, Math.abs(HW[o] - height));
    }
  }
  return { isolatedPeaks, maxNeighborStep };
}

let coastIsolatedPeaksRepaired = RAW_TERRAIN_FIDELITY ? 0 : repairCoastPeaks();
let { isolatedPeaks: coastIsolatedPeakCount, maxNeighborStep: coastMaxNeighborStep } = measureCoastGeometry();
console.log(`  Küstengeometrie: ${coastIsolatedPeakCount} isolierte Peaks, max. Nachbarschritt ${coastMaxNeighborStep.toFixed(2)} m`);
// ---------------------------------------------------------------------------
// 6b-flat. § MAP FLATTENING + BUILDABILITY — Gelände bespielbar machen
// ---------------------------------------------------------------------------
// § World Overhaul 12.0 / D-041 — REIHENFOLGE UMGEDREHT (bewusst, siehe unten).
//
// Bis v1.11 lief dieser Block als „§8a-flat" ERST NACH Regionen, Startregion und
// Rathauswahl. Grund war ausschließlich Rückwärtskompatibilität: D-040 wollte
// Regions-Ids, Startregion und Rathaus bitgleich halten, damit alte Spielstände
// und `regions.config.ts` gültig blieben. Dieser Auftrag ersetzt die Welt
// vollständig (neue GLB, neue Regionen, Save-Neustart) — damit fällt der Grund
// weg, und die alte Reihenfolge wird zum echten Fehler:
//
//   * Die Segmentierung sah Biome des ROHEN, ungeglätteten Geländes.
//   * Der Startregion-Ausschnitt zählte die Bauflächen der ROHEN Maske und
//     wuchs deshalb weit über sein Ziel hinaus (3.983 Kacheln für 1.348
//     „bebaubare" — nach dem Einebnen waren es faktisch viel mehr).
//   * `BAKED_REGIONS[].buildable` (und damit die Regionskosten) beschrieben eine
//     Welt, die es nach dem Einebnen nicht mehr gab.
//
// Deshalb gilt jetzt: einebnen, DANN segmentieren. Regionen, Startregion,
// Rathaus, Statistik und alle Ausgaben sehen ausschließlich das FERTIGE,
// bespielbare Gelände. Wer diese Reihenfolge wieder umdreht, macht die
// Regionsstatistik erneut unehrlich.
console.log(RAW_TERRAIN_FIDELITY
  ? '— Modelltreue: Gelände unverändert übernehmen, nur ableiten …'
  : '— Map Flattening: Gelände einebnen …');
const flattenBefore = buildableMask.reduce((sum, v) => sum + v, 0);

// (1) Ufer: breiteres, flacheres Strandprofil und deutlich weniger bewusste
//     Steilküste (§3.3/B5). Quelle ist die AKTUELLE Höhe, nicht die Rohhöhe —
//     der Ur-Blend bleibt dadurch erhalten und wird nur weiter abgeflacht.
function applyFlatShoreProfile() {
  let widened = 0;
  accessibleShoreZone.fill(0);
  computeCliffRelief();
  for (let gz = 0; gz < GRID; gz++) {
    for (let gx = 0; gx < GRID; gx++) {
      const o = gz * GRID + gx;
      if (Number.isNaN(H[o])) continue; // Wasserflächen behalten ihre Tiefenrampe
      const tx = Math.min(WORLD_TILES - 1, (gx / SAMPLES_PER_TILE) | 0);
      const ty = Math.min(WORLD_TILES - 1, (gz / SAMPLES_PER_TILE) | 0);
      const to = ty * WORLD_TILES + tx;
      const waterDistance = distToWaterRaw[to];
      // § 12.2: Steilküste entsteht auf zwei Wegen. (1) Die bewusste Zonenwahl
      // („nur wenige Bereiche") — dort muss zusätzlich echtes Relief dahinter
      // liegen, sonst entstünde die früher gemessene Pseudo-Steilküste mit
      // Höhenmedian 0,2–1,3 m. (2) GARANTIERT überall dort, wo sich echtes
      // Gebirge bis ans Wasser schiebt: dort gibt es nie Strand, egal was die
      // Zonen-Lotterie sagt. Weg (2) ist die Antwort auf „ich will genau da
      // eine Klippe".
      const relief = cliffReliefCache[to];
      const deliberateCliffZone = enclosedLabel[to] < 0
        && (relief >= CLIFF_ZONE_ALWAYS_RELIEF
          || (shoreHash(tx, ty) < FLAT_SHORE_CLIFF_ZONE_RATIO && relief >= CLIFF_ZONE_MIN_RELIEF));
      const accessible = waterDistance > 0 && waterDistance <= FLAT_SHORE_BLEND_TILES
        && HW[o] < FLAT_SHORE_CLIFF_HEIGHT
        && !deliberateCliffZone;
      if (!accessible) continue;
      if (!accessibleShoreZone[to]) widened++;
      accessibleShoreZone[to] = 1;
      HW[o] = shoreBlendHeight(
        HW[o], waterDistance,
        FLAT_SHORE_BLEND_TILES, FLAT_SHORE_PLATFORM_HEIGHT, FLAT_SHORE_RISE_PER_TILE,
      );
    }
  }
  return widened;
}
if (!RAW_TERRAIN_FIDELITY) {
  console.log(`  Uferprofil verbreitert: ${applyFlatShoreProfile()} Uferkacheln im flachen Band`);

  // (2) Terraforming außerhalb des Massivs (B1).
  terraformNonMassifLand();
  // Das Terraforming zieht das Hinterland herunter und macht dadurch genau die
  // Uferkante wieder relativ steiler. Ein zweiter Durchlauf legt das flache
  // Strandprofil auf das FERTIGE Gelände — sonst gewinnt das Einebnen gegen §3.3.
  applyFlatShoreProfile();
} else {
  // § Modelltreue 13.0: `accessibleShoreZone` steuert weiter unten nur noch
  // Ufer-/Hafen-METADATEN. Sie wird deshalb aus der vorhandenen Geometrie
  // abgeleitet, statt Geometrie zu erzeugen: flach genug am Wasser = begehbar.
  computeCliffRelief();
  accessibleShoreZone.fill(0);
  for (let ty = 0; ty < WORLD_TILES; ty++) {
    for (let tx = 0; tx < WORLD_TILES; tx++) {
      const to = ty * WORLD_TILES + tx;
      if (isWaterCand[to]) continue;
      const waterDistance = distToWaterRaw[to];
      if (waterDistance <= 0 || waterDistance > FLAT_SHORE_BLEND_TILES) continue;
      if (tileH(tx, ty) >= FLAT_SHORE_CLIFF_HEIGHT) continue;
      if (tileSlope(tx, ty) > FLAT_SHORE_ACCESSIBLE_MAX_SLOPE) continue;
      accessibleShoreZone[to] = 1;
    }
  }
}

// (3) Ufer, Biome und Bebaubarkeit aus dem neuen Gelände neu ableiten (B2/B3/B5).
classifyShoreTypes(FLAT_SHORE_ACCESSIBLE_MAX_HEIGHT, FLAT_SHORE_ACCESSIBLE_MAX_SLOPE);
classifyBiomes(FLAT_MOUNTAIN_SLOPE_MIN_HEIGHT);
classifyBuildable(
  FLAT_MAX_BUILDABLE_TILE_SLOPE, FLAT_MIN_ORTHOGONAL_BUILDABLE,
  FLAT_SHORE_APRON_TARGET, FLAT_SHORE_APRON_MIN_DISTANCE, FLAT_SHORE_BLEND_TILES,
  FLAT_MOUNTAIN_SLOPE_MIN_HEIGHT,
);

// (4) Die neue, deutlich größere Baufläche final glätten und kappen. Die Maske
//     ist jetzt großflächig zusammenhängend, deshalb braucht die Gauss-Seidel-
//     Relaxation spürbar mehr Sweeps bis zur Konvergenz als früher.
let needlesRepaired = 0;
let cliffPlateaus = { plateaus: 0, plateauTiles: 0 };
if (!RAW_TERRAIN_FIDELITY) {
flattenBuildableLand(6000, { onlyRough: true, maxStep: FLAT_MAX_BUILDABLE_STEP });

// (4b) § Welt-Feinschliff 12.1 — DAS UFER ZULETZT.
//
// Befund aus dem Spieltest: Ozeanufer lagen im Median 0,26 über der Wasserlinie
// (gut), Seeufer aber bei 0,81 und Flussufer bei 1,14 — mit p90 um 2,6. Sichtbar
// wurde daraus genau das, was §5 verbietet: Binnengewässer in einer Schlucht mit
// steiler Kante statt begehbarem Ufer.
//
// Ursache war die REIHENFOLGE, nicht das Profil: `applyFlatShoreProfile()` lief
// zuletzt VOR `flattenBuildableLand()`. Die Schlussglättung zieht jeden Knoten
// zum Mittel seiner Nachbarn — am Ufer heißt das: zum höheren Hinterland. Das
// frisch gelegte Strandprofil wurde also direkt wieder hochgezogen.
//
// Deshalb läuft das Uferprofil jetzt ein drittes Mal, NACH der Glättung, und
// danach wird nur noch die Stufigkeit gekappt (kein Mitteln mehr), damit das
// Ufer flach bleibt und trotzdem keine neuen Kanten entstehen.
applyFlatShoreProfile();
nodeMaskFromTiles(buildableMask, nodeBuildable);
for (let sweep = 0; sweep < 400; sweep++) {
  if (clampSweep(nodeBuildable, FLAT_MAX_BUILDABLE_STEP) === 0) break;
}

// (4c) § 12.2 — GELÄNDENADELN ENTFERNEN. Muss NACH dem Uferprofil laufen: das
//      Profil senkt das Ufer ab und macht dadurch jeden stehengebliebenen
//      Splitter erst zur Nadel. Vor der Bebaubar-Ableitung, damit die Maske das
//      gesäuberte Gelände sieht.
needlesRepaired = repairTerrainNeedles();
console.log(`  Geländenadeln entfernt: ${needlesRepaired} Knoten`);

// (5) Zwischen-Klassifikation: `buildCliffPlateaus` braucht eine frische
//     Steilküsten-Typisierung, und das anschließende Kappen braucht eine
//     Bebaubar-Maske. Beides ist VORLÄUFIG — verbindlich ist (5d).
classifyShoreTypes(FLAT_SHORE_ACCESSIBLE_MAX_HEIGHT, FLAT_SHORE_ACCESSIBLE_MAX_SLOPE);

// (5b) § 12.2 — echte Klippen mit ebenem Kopf auf zusammenhängender Steilküste.
cliffPlateaus = buildCliffPlateaus();
console.log(`  Klippen-Plateaus: ${cliffPlateaus.plateaus} Abschnitte, ${cliffPlateaus.plateauTiles} Kacheln eingeebnet`);
classifyShoreTypes(FLAT_SHORE_ACCESSIBLE_MAX_HEIGHT, FLAT_SHORE_ACCESSIBLE_MAX_SLOPE);
classifyBiomes(FLAT_MOUNTAIN_SLOPE_MIN_HEIGHT);
classifyBuildable(
  FLAT_MAX_BUILDABLE_TILE_SLOPE, FLAT_MIN_ORTHOGONAL_BUILDABLE,
  FLAT_SHORE_APRON_TARGET, FLAT_SHORE_APRON_MIN_DISTANCE, FLAT_SHORE_BLEND_TILES,
  FLAT_MOUNTAIN_SLOPE_MIN_HEIGHT,
);

// (5c) LETZTE HÖHENÄNDERUNGEN. Danach darf HW nicht mehr angefasst werden.
//
// § 12.2 — hier lag ein echter Fehler: Kappung und Nadelreparatur liefen
// ursprünglich NACH der letzten `classifyBuildable`. Beide verändern Höhen,
// also beschrieb die ausgelieferte Bebaubar-Maske ein Gelände, das es nicht
// mehr gab. `tests/mapBuildability.test.ts` hat genau das gefunden: eine als
// bebaubar markierte Kachel mit Hang 1,35 — über `GROUND_ROAD_MAX_SLOPE`
// (1,25) und damit ein Bauplatz ohne mögliche Straßenanbindung.
nodeMaskFromTiles(buildableMask, nodeBuildable);
for (let sweep = 0; sweep < 400; sweep++) {
  if (clampSweep(nodeBuildable, FLAT_MAX_BUILDABLE_STEP) === 0) break;
}
coastIsolatedPeaksRepaired += repairCoastPeaks();
coastIsolatedPeaksRepaired += repairTerrainNeedles();
} // Ende des Nicht-Treue-Pfads: ab hier wird HW nie mehr geschrieben.

// (5d) VERBINDLICHE Ableitung auf dem endgültigen Gelände.
classifyShoreTypes(FLAT_SHORE_ACCESSIBLE_MAX_HEIGHT, FLAT_SHORE_ACCESSIBLE_MAX_SLOPE);
classifyBiomes(FLAT_MOUNTAIN_SLOPE_MIN_HEIGHT);
classifyBuildable(
  FLAT_MAX_BUILDABLE_TILE_SLOPE, FLAT_MIN_ORTHOGONAL_BUILDABLE,
  FLAT_SHORE_APRON_TARGET, FLAT_SHORE_APRON_MIN_DISTANCE, FLAT_SHORE_BLEND_TILES,
  FLAT_MOUNTAIN_SLOPE_MIN_HEIGHT,
);
nodeMaskFromTiles(buildableMask, nodeBuildable);

// (6) Reine Diagnose auf dem FINALEN Gelände — mutiert nichts mehr.
({ isolatedPeaks: coastIsolatedPeakCount, maxNeighborStep: coastMaxNeighborStep } = measureCoastGeometry());
const terrainNeedleCount = countTerrainNeedles();
console.log(`  Küstengeometrie (final): ${coastIsolatedPeakCount} isolierte Peaks, ${terrainNeedleCount} Nadeln, max. Nachbarschritt ${coastMaxNeighborStep.toFixed(2)} m`);

const flattenAfter = buildableMask.reduce((sum, v) => sum + v, 0);
console.log(`  Bebaubare Kacheln: ${flattenBefore} → ${flattenAfter} (${(100 * (flattenAfter / flattenBefore - 1)).toFixed(1)} %)`);

// § Modelltreue 13.0 — DER BEWEIS. Wie weit weicht das ausgelieferte Höhenfeld
// vom Modell ab? Nur Landknoten; Wasser hat im Modell keine Geometrie.
const modelFidelity = (() => {
  let nodes = 0, changed = 0, sumAbs = 0, maxAbs = 0, sumModel = 0, sumWorld = 0;
  for (let o = 0; o < HW.length; o++) {
    if (Number.isNaN(H[o])) continue;
    const d = HW[o] - HW_MODEL[o];
    const a = Math.abs(d);
    nodes++;
    sumModel += HW_MODEL[o];
    sumWorld += HW[o];
    sumAbs += a;
    if (a > maxAbs) maxAbs = a;
    if (a > 0.05) changed++;
  }
  return {
    landNodes: nodes,
    changedNodes: changed,
    changedShare: round(nodes ? changed / nodes : 0, 4),
    meanAbsDelta: round(nodes ? sumAbs / nodes : 0),
    maxAbsDelta: round(maxAbs),
    meanModelHeight: round(nodes ? sumModel / nodes : 0),
    meanWorldHeight: round(nodes ? sumWorld / nodes : 0),
  };
})();
console.log(`  Modelltreue: ${modelFidelity.changedNodes.toLocaleString('de-DE')} von ${modelFidelity.landNodes.toLocaleString('de-DE')} Landknoten verändert (${(100 * modelFidelity.changedShare).toFixed(1)} %), Ø |Δ| ${modelFidelity.meanAbsDelta} m, max ${modelFidelity.maxAbsDelta} m, Ø Höhe Modell ${modelFidelity.meanModelHeight} → Welt ${modelFidelity.meanWorldHeight}`);


// ---------------------------------------------------------------------------
// 7. Organische Regionen segmentieren (§ Welt 2.0)
// ---------------------------------------------------------------------------
// Land (inkl. Seen/Flüsse — die gehören zur Landschaft, z. B. „Seenlandschaft")
// wird in ~24–32 zusammenhängende Regionen zerlegt: Seeds auf den größten
// Biom-Clustern, dann kostenbasiertes Multi-Source-Wachstum (Dijkstra); fremde
// Biome, Fluss-Querungen und Höhendeltas verteuern den Schritt, sodass Grenzen
// an Biomkanten, Flüssen und Kämmen entlanglaufen. Kleine Regionen werden in
// den Nachbarn mit der längsten gemeinsamen Grenze gemerged. Ozean = Region 0.
const SIZE = WORLD_TILES * WORLD_TILES;
const isLand = (o) => !oceanMask[o];

console.log('— Regionen segmentieren …');
// 7a. Biom-Cluster (zusammenhängende Komponenten gleichen Terrains auf Land).
const compOf = new Int32Array(SIZE).fill(-1);
const comps = [];
for (let o = 0; o < SIZE; o++) {
  if (!isLand(o) || compOf[o] >= 0) continue;
  const cls = terrain[o];
  const tiles = [o];
  compOf[o] = comps.length;
  for (let head = 0; head < tiles.length; head++) {
    const c = tiles[head];
    const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const no = ny * WORLD_TILES + nx;
      if (isLand(no) && compOf[no] < 0 && terrain[no] === cls) { compOf[no] = comps.length; tiles.push(no); }
    }
  }
  comps.push({ cls, tiles });
}

// 7b. Seeds: je Cluster ≥ REGION_MIN_COMPONENT, Anzahl ∝ Größe; Verteilung im
// Cluster per Farthest-Point-Sampling (BFS-Distanz innerhalb des Clusters).
const seeds = []; // { tile, cls }
const compsBySize = comps.map((c, i) => ({ ...c, i })).sort((a, b) => b.tiles.length - a.tiles.length || a.i - b.i);
for (const comp of compsBySize) {
  if (seeds.length >= REGION_MAX_SEEDS) break;
  if (comp.tiles.length < REGION_MIN_COMPONENT) continue;
  const want = Math.max(1, Math.min(8, Math.round(comp.tiles.length / REGION_TARGET_TILES), REGION_MAX_SEEDS - seeds.length));
  // Centroid-nächste Kachel als erster Seed.
  let cx = 0, cy = 0;
  for (const o of comp.tiles) { cx += o % WORLD_TILES; cy += (o / WORLD_TILES) | 0; }
  cx /= comp.tiles.length; cy /= comp.tiles.length;
  let first = comp.tiles[0], bestD = Infinity;
  for (const o of comp.tiles) {
    const d = Math.hypot((o % WORLD_TILES) - cx, ((o / WORLD_TILES) | 0) - cy);
    if (d < bestD - 1e-9 || (Math.abs(d - bestD) < 1e-9 && o < first)) { bestD = d; first = o; }
  }
  const local = [first];
  while (local.length < want) {
    // BFS-Distanz von allen bisherigen lokalen Seeds, nur innerhalb des Clusters.
    const dist = new Int32Array(SIZE).fill(-1);
    const q = local.slice();
    for (const s of q) dist[s] = 0;
    let head = 0;
    while (head < q.length) {
      const c = q[head++];
      const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
        const no = ny * WORLD_TILES + nx;
        if (compOf[no] === comp.i && dist[no] < 0) { dist[no] = dist[c] + 1; q.push(no); }
      }
    }
    let far = -1, farD = -1;
    for (const o of comp.tiles) if (dist[o] > farD || (dist[o] === farD && o < far)) { farD = dist[o]; far = o; }
    if (far < 0 || farD <= 4) break; // Cluster zu kompakt für weitere Seeds
    local.push(far);
  }
  for (const t of local) seeds.push({ tile: t, cls: comp.cls });
}
console.log(`  ${comps.length} Biom-Cluster → ${seeds.length} Region-Seeds`);

// § 12.1 §6 — OFFENES WASSER FÜR WASSERGEBÄUDE.
//
// `dock_small` & Co. verlangen laut `BuildingDef.waterfront` ein 2×2-WASSER-
// rechteck vor dem Kai (`waterWidth`/`waterDepth` 2, `shorelineTolerance` 0).
// Der erste Anlauf zählte nur bebaubare Landkacheln am Wasser — dabei kam eine
// Startbucht heraus, die ein EIN Kachel breiter Kanal war: 23 „Hafenflächen"
// laut Bake, 0 baubare Anleger im Spiel. Diese Maske spiegelt deshalb genau die
// Laufzeitregel: Wo liegt wirklich offenes Wasser?
const waterPad2 = new Uint8Array(SIZE); // Anker eines vollständig nassen 2×2-Blocks
for (let ty = 0; ty < WORLD_TILES - 1; ty++) {
  for (let tx = 0; tx < WORLD_TILES - 1; tx++) {
    const o = ty * WORLD_TILES + tx;
    if (isWaterCand[o] && isWaterCand[o + 1] && isWaterCand[o + WORLD_TILES] && isWaterCand[o + WORLD_TILES + 1]) {
      waterPad2[o] = 1;
    }
  }
}
/**
 * Trägt ein 2×2-Wassergebäude mit Anker (tx,ty) einen Kai?
 *
 * Spiegelt `waterfrontWaterCells()` aus `src/game/buildings/placement.ts` EXAKT
 * für das Profil `waterWidth: 2, waterDepth: 2` (dock_small): Das 2×2-Wasser-
 * rechteck muss bündig an einer der vier Seiten liegen — Norden (Rotation 0),
 * Süden (180), Westen (90) oder Osten (270). Eine bloße Nachbarschaftsprüfung
 * genügt nicht: sie akzeptiert schräg liegendes Wasser, an dem die Laufzeit
 * `needs_water` meldet.
 */
const carriesQuay = (tx, ty) => {
  const anchors = [
    [tx, ty - 2],           // Rotation 0   — Wasser nördlich
    [tx, ty + 2],           // Rotation 180 — Wasser südlich
    [tx - 2, ty],           // Rotation 90  — Wasser westlich
    [tx + 2, ty],           // Rotation 270 — Wasser östlich
  ];
  for (const [ax, ay] of anchors) {
    if (ax < 0 || ay < 0 || ax >= WORLD_TILES - 1 || ay >= WORLD_TILES - 1) continue;
    if (waterPad2[ay * WORLD_TILES + ax]) return true;
  }
  return false;
};

// 7c. Kostenbasiertes Multi-Source-Wachstum (deterministischer Binär-Heap).
const regionOf = new Int32Array(SIZE).fill(-1); // Seed-Index je Kachel
{
  const heap = []; // Einträge [cost, order, tile, seedIdx]; order = stabiler Tiebreak
  let order = 0;
  const push = (e) => {
    heap.push(e);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] < heap[i][0] || (heap[p][0] === heap[i][0] && heap[p][1] < heap[i][1])) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < heap.length && (heap[l][0] < heap[m][0] || (heap[l][0] === heap[m][0] && heap[l][1] < heap[m][1]))) m = l;
        if (r < heap.length && (heap[r][0] < heap[m][0] || (heap[r][0] === heap[m][0] && heap[r][1] < heap[m][1]))) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  const bestCost = new Float64Array(SIZE).fill(Infinity);
  seeds.forEach((s, i) => { bestCost[s.tile] = 0; push([0, order++, s.tile, i]); });
  while (heap.length) {
    const [cost, , tile, seedIdx] = pop();
    if (regionOf[tile] >= 0) continue;
    regionOf[tile] = seedIdx;
    const tx = tile % WORLD_TILES, ty = (tile / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const no = ny * WORLD_TILES + nx;
      if (!isLand(no) || regionOf[no] >= 0) continue;
      let step = 1;
      if (terrain[no] !== seeds[seedIdx].cls) step += COST_FOREIGN_BIOME;
      if (terrain[no] === T.river && seeds[seedIdx].cls !== T.river) step += COST_CROSS_RIVER;
      step += Math.min(6, Math.abs(tileH(nx, ny) - tileH(tx, ty)) * COST_HEIGHT_FACTOR);
      const nc = cost + step;
      if (nc < bestCost[no]) { bestCost[no] = nc; push([nc, order++, no, seedIdx]); }
    }
  }
}

// 7c-bis. § World Overhaul 12.0 — VERWAISTES LAND EINSAMMELN.
//
// Das kostenbasierte Wachstum läuft nur über Land. Kleine Inseln, die keinen
// eigenen Seed bekommen (Biom-Cluster < REGION_MIN_COMPONENT) und über Land mit
// keinem Seed verbunden sind, blieben deshalb bei Region 0 — also „Ozean".
// Auf der neuen Insel waren das 3.217 Kacheln in zwei Nordinseln: sichtbares
// Land, das der Spieler nie hätte betreten können, weil `regionIdAt` dort 0
// liefert und keine Region es freischaltet.
//
// Jede verwaiste Landkomponente wandert deshalb komplett zur Region mit dem
// KÜRZESTEN Wasserabstand — dieselbe Logik, die §7f-bis für die Seenachbarschaft
// ausmisst. Keine neue Region, keine erfundene Landbrücke; die Insel gehört
// einfach zur nächstgelegenen Landschaft.
{
  const seen = new Uint8Array(SIZE);
  let orphanTiles = 0;
  let orphanComponents = 0;
  for (let start = 0; start < SIZE; start++) {
    if (seen[start] || !isLand(start) || regionOf[start] >= 0) continue;
    const component = [start];
    seen[start] = 1;
    for (let head = 0; head < component.length; head++) {
      const c = component[head];
      const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
        const no = ny * WORLD_TILES + nx;
        if (seen[no] || !isLand(no) || regionOf[no] >= 0) continue;
        seen[no] = 1;
        component.push(no);
      }
    }
    // BFS über ALLES (auch Wasser) bis zur ersten zugeordneten Landkachel.
    const depth = new Int32Array(SIZE).fill(-1);
    const queue = component.slice();
    for (const o of queue) depth[o] = 0;
    let nearest = -1;
    for (let head = 0; head < queue.length && nearest < 0; head++) {
      const c = queue[head];
      const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
        const no = ny * WORLD_TILES + nx;
        if (depth[no] >= 0) continue;
        depth[no] = depth[c] + 1;
        if (regionOf[no] >= 0) { nearest = regionOf[no]; break; }
        queue.push(no);
      }
    }
    if (nearest < 0) continue; // theoretisch unmöglich (es gibt immer Seeds)
    for (const o of component) regionOf[o] = nearest;
    orphanTiles += component.length;
    orphanComponents++;
  }
  if (orphanTiles > 0) {
    console.log(`  ${orphanTiles.toLocaleString('de-DE')} verwaiste Landkacheln in ${orphanComponents} Komponenten der nächstgelegenen Region zugeordnet`);
  }
}

// 7d. Kleine Regionen in den Nachbarn mit der längsten gemeinsamen Grenze mergen.
for (;;) {
  const count = new Map();
  for (let o = 0; o < SIZE; o++) if (regionOf[o] >= 0) count.set(regionOf[o], (count.get(regionOf[o]) ?? 0) + 1);
  let smallest = null;
  for (const [r, n] of count) if (n < REGION_MIN_TILES && (!smallest || n < smallest.n)) smallest = { r, n };
  if (!smallest) break;
  const border = new Map();
  for (let o = 0; o < SIZE; o++) {
    if (regionOf[o] !== smallest.r) continue;
    const tx = o % WORLD_TILES, ty = (o / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const rn = regionOf[ny * WORLD_TILES + nx];
      if (rn >= 0 && rn !== smallest.r) border.set(rn, (border.get(rn) ?? 0) + 1);
    }
  }
  let target = null;
  for (const [r, n] of border) if (!target || n > target.n || (n === target.n && r < target.r)) target = { r, n };
  if (!target) break; // isolierte Mini-Insel: bleibt eigene Region
  for (let o = 0; o < SIZE; o++) if (regionOf[o] === smallest.r) regionOf[o] = target.r;
}

// 7d-bis. § Final World Compaction 8.1 (§3.1, §12) — KOMPAKTE ZENTRALE STARTREGION.
//
// Die kostenbasierte Segmentierung erzeugt bewusst gleichwertig große
// Landschaften (~6.200 Kacheln). § Change 9.0 §3.3: Die Startregion soll das
// langfristige urbane Zentrum sein — groß genug für eine echte Anfangsstadt
// (~1.400 bebaubare Kacheln), aber nicht bis weit ins Midgame reichend. Deshalb
// wird nach der Segmentierung aus der zentralen Region ein kompakter,
// zusammenhängender Kern mit rund START_REGION_TARGET_BUILDABLE bebaubaren
// Kacheln herausgelöst und zur eigenen Region gemacht. Der Rest bleibt bei der
// Wirtsregion — sie wird dadurch die erste natürliche Erweiterungsrichtung; der
// größere Kern reicht bis an mehrere Nachbarregionen (Expansionsrichtungen).
// § Modelltreue 13.0 — INSELWEITE HAFENTAUGLICHKEIT, bevor die Startregion
// gesucht wird. Ohne diese Zahl ist ein Fehlschlag der Startsuche nicht
// deutbar: „0 Hafenflächen im Ausschnitt" kann heißen, dass der Ausschnitt
// schlecht liegt — oder dass die ganze Insel keinen einzigen Anlegerplatz hat.
const islandHarbourPads = (() => {
  let pads = 0, buildableShore = 0;
  for (let ty = 0; ty < WORLD_TILES - 1; ty++) {
    for (let tx = 0; tx < WORLD_TILES - 1; tx++) {
      const o = ty * WORLD_TILES + tx;
      if (buildableMask[o] && distWater[o] === 1) buildableShore++;
      let pad = true, touchesWater = false;
      for (let dy = 0; dy < 2 && pad; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const no = (ty + dy) * WORLD_TILES + tx + dx;
          if (!buildableMask[no]) { pad = false; break; }
          if (distWater[no] === 1 && carriesQuay(tx, ty)) touchesWater = true;
        }
      }
      if (pad && touchesWater) pads++;
    }
  }
  console.log(`  Hafentauglichkeit inselweit: ${pads.toLocaleString('de-DE')} 2×2-Anlegerplätze, ${buildableShore.toLocaleString('de-DE')} bebaubare Uferkacheln`);
  return pads;
})();

const startCarve = (() => {
  // Größte zusammenhängende Landmasse und ihr Flächenschwerpunkt.
  const seen = new Uint8Array(SIZE);
  let mainland = [];
  for (let o = 0; o < SIZE; o++) {
    if (seen[o] || isWaterCand[o]) continue;
    const component = [o];
    seen[o] = 1;
    for (let head = 0; head < component.length; head++) {
      const c = component[head];
      const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
        const no = ny * WORLD_TILES + nx;
        if (!seen[no] && !isWaterCand[no]) { seen[no] = 1; component.push(no); }
      }
    }
    if (component.length > mainland.length) mainland = component;
  }
  let cx = 0, cy = 0;
  for (const o of mainland) { cx += o % WORLD_TILES; cy += (o / WORLD_TILES) | 0; }
  cx /= mainland.length; cy /= mainland.length;
  const onMainland = new Uint8Array(SIZE);
  for (const o of mainland) onMainland[o] = 1;

  // Kernkachel: Die Startregion wird bewusst UM eine gültige Gründungsreserve
  // herum ausgeschnitten. Sonst kann die spätere Startsuche (§8) in der kleinen,
  // organisch geformten Startregion kein zusammenhängendes 20×16-Baufeld mehr
  // finden. Es werden deshalb genau dieselben zwei Bedingungen geprüft, die dort
  // gelten: eine vollständig bebaubare Reserve und ein 7×7-Grasblock fürs Rathaus.
  const prefixOf = (predicate) => {
    const stride = WORLD_TILES + 1;
    const prefix = new Int32Array(stride * stride);
    for (let y = 0; y < WORLD_TILES; y++) {
      let row = 0;
      for (let x = 0; x < WORLD_TILES; x++) {
        row += predicate(y * WORLD_TILES + x) ? 1 : 0;
        prefix[(y + 1) * stride + x + 1] = prefix[y * stride + x + 1] + row;
      }
    }
    return prefix;
  };
  const sumOf = (prefix, x0, y0, x1, y1) => {
    const stride = WORLD_TILES + 1;
    return prefix[y1 * stride + x1] - prefix[y0 * stride + x1] - prefix[y1 * stride + x0] + prefix[y0 * stride + x0];
  };
  const buildPrefix = prefixOf((o) => buildableMask[o]);
  const grassPrefix = prefixOf((o) => buildableMask[o] && terrain[o] === T.grass);

  const candidates = [];
  for (let ty = 11; ty < WORLD_TILES - 16; ty++) {
    for (let tx = 11; tx < WORLD_TILES - 27; tx++) {
      const centerX = tx + 2, centerY = ty + 2;
      const centerOffset = centerY * WORLD_TILES + centerX;
      if (!onMainland[centerOffset] || !buildableMask[centerOffset]) continue;
      // § 12.0 §4 „Wasser": ohne erreichbares Wasser ist die Kachel als Zentrum
      // einer Startregion ungeeignet, egal wie flach und zentral sie liegt.
      if (distWater[centerOffset] > START_CORE_MAX_WATER_DISTANCE) continue;
      const reserveX = tx + RESERVE_X0, reserveY = ty + RESERVE_Y0;
      if (sumOf(buildPrefix, reserveX, reserveY, reserveX + RESERVE_W, reserveY + RESERVE_H) !== RESERVE_W * RESERVE_H) continue;
      if (sumOf(grassPrefix, tx - 1, ty - 1, tx + 6, ty + 6) !== 49) continue;
      // Die Reserve muss vollständig in EINER Segmentierungsregion liegen, sonst
      // zerschneidet der Ausschnitt sie und die Startsuche scheitert erneut.
      const hostSeed = regionOf[centerOffset];
      let uniform = true;
      for (let y = reserveY; y < reserveY + RESERVE_H && uniform; y++) {
        for (let x = reserveX; x < reserveX + RESERVE_W; x++) {
          if (regionOf[y * WORLD_TILES + x] !== hostSeed) { uniform = false; break; }
        }
      }
      if (!uniform) continue;
      // § 12.0 §4: Der Rathausblock muss WIRKLICH eben sein. Genau dieselbe
      // 7×7-Spanne bewertet §8 später als `flatnessScore`.
      let hMin = Infinity, hMax = -Infinity;
      for (let y = ty - 1; y <= ty + 5; y++) {
        for (let x = tx - 1; x <= tx + 5; x++) {
          const h = tileH(x, y);
          if (h < hMin) hMin = h;
          if (h > hMax) hMax = h;
        }
      }
      const flatDelta = hMax - hMin;
      if (flatDelta > START_CORE_MAX_FLAT_DELTA) continue;
      const centrality = 1 - Math.min(1, Math.hypot(centerX - cx, centerY - cy) / 150);
      // Umliegendes Bauland als Reserve für die spätere Verdichtung.
      const around = sumOf(buildPrefix, centerX - 14, centerY - 14, centerX + 15, centerY + 15) / (29 * 29);
      // Wassernähe zählt positiv, aber schwächer als Zentralität — die Stadt soll
      // im Landesinneren mit Uferzugang liegen, nicht auf einer Landzunge.
      const waterAccess = 1 - Math.min(1, distWater[centerOffset] / START_CORE_MAX_WATER_DISTANCE);
      const flatness = 1 - flatDelta / START_CORE_MAX_FLAT_DELTA;
      const score = centrality * 3 + around + waterAccess * 0.8 + flatness * 0.9
        - tileSlope(centerX, centerY) * 0.5;
      candidates.push([score, centerOffset]);
    }
  }
  if (candidates.length === 0) { console.warn('  ! keine zentrale Startkachel mit Gründungsreserve und Wasserzugang gefunden — Startregion wird nicht ausgeschnitten'); return null; }
  candidates.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  {
    const d = (o) => Math.hypot((o % WORLD_TILES) - cx, ((o / WORLD_TILES) | 0) - cy);
    const top = candidates.slice(0, 5).map(([, o]) => `(${o % WORLD_TILES},${(o / WORLD_TILES) | 0})@${d(o).toFixed(0)}`);
    let nearest = Infinity;
    for (const [, o] of candidates) nearest = Math.min(nearest, d(o));
    console.log(`  Startkandidaten: ${candidates.length}, bestbewertete ${top.join(' ')}, zentralster Abstand ${nearest.toFixed(0)}`);
  }

  /**
   * Kompaktes Wachstum NUR innerhalb der Wirtsregion und auf der Hauptinsel:
   * billigste Kachel zuerst (Distanz + Strafaufschlag für nicht bebaubares
   * Gelände), bis das Bauflächen-Budget erreicht ist. Ergebnis ist rund und
   * zusammenhängend, folgt aber weiterhin dem echten Gelände.
   *
   * § 12.0: Danach wächst derselbe Ausschnitt mit derselben Kostenfunktion
   * weiter, bis er eine Kachel direkt am Wasser enthält (§4 „Wasser"). Das ist
   * keine zweite Wachstumslogik, nur ein zweites Abbruchkriterium.
   */
  const growCarve = (core, { seekWater }) => {
    const host = regionOf[core];
    const carved = [];
    const inCarve = new Uint8Array(SIZE);
    const dist = new Float64Array(SIZE).fill(Infinity);
    const queue = [[0, core]];
    dist[core] = 0;
    let buildableCount = 0;
    let waterfrontTiles = 0;
    const canGrow = (o) => regionOf[o] === host && onMainland[o];
    while (queue.length > 0 && buildableCount < START_REGION_TARGET_BUILDABLE) {
      queue.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const [cost, tile] = queue.shift();
      if (inCarve[tile]) continue;
      inCarve[tile] = 1;
      carved.push(tile);
      if (buildableMask[tile]) buildableCount++;
      if (distWater[tile] === 1) waterfrontTiles++;
      const tx = tile % WORLD_TILES, ty = (tile / WORLD_TILES) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
        const no = ny * WORLD_TILES + nx;
        if (inCarve[no] || !canGrow(no)) continue;
        // Bauland wächst billig, Gebirge/Wasserkanten teuer ⇒ die Startregion
        // greift zuerst die zusammenhängende Bauebene ab.
        const nc = cost + (buildableMask[no] ? 1 : 5);
        if (nc < dist[no]) { dist[no] = nc; queue.push([nc, no]); }
      }
    }
    // Nachlauf NUR wenn nötig: ein SCHMALER Korridor (kürzester Weg innerhalb der
    // Wirtsregion) von der bestehenden Fläche zur nächsten Uferkachel. Kein
    // flächiges Weiterwachsen — die Startregion soll kompakt bleiben und nur
    // einen ehrlichen Zugang zum Wasser bekommen (§4).
    // § Modelltreue 13.0: Bedingung von „gar kein Ufer" auf „zu wenig Ufer"
    // erweitert. Auf dem ungeglätteten Modell endet das Budget-Wachstum oft
    // MIT ein paar Uferkacheln, aber unter der Mindestzahl — der Korridor lief
    // dann nie an, und ALLE 96 Kandidaten fielen am Wasserzugang durch.
    if (seekWater && waterfrontTiles < START_MIN_WATERFRONT) {
      const from = new Int32Array(SIZE).fill(-2); // -2 unbesucht, -1 Startfläche
      const q = [];
      for (const o of carved) { from[o] = -1; q.push(o); }
      let target = -1;
      for (let head = 0; head < q.length && target < 0; head++) {
        const c = q[head];
        const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = tx + dx, ny = ty + dy;
          if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
          const no = ny * WORLD_TILES + nx;
          if (from[no] !== -2 || !canGrow(no)) continue;
          from[no] = c;
          // § 12.1: Ziel ist eine Kachel an OFFENEM Wasser (2×2), nicht an einem
          // beliebigen Rinnsal — sonst entsteht eine Bucht ohne Hafenplatz.
          if (distWater[no] === 1 && carriesQuay(nx, ny)) { target = no; break; }
          q.push(no);
        }
      }
      if (target >= 0) {
        const corridor = [];
        for (let o = target; o >= 0 && from[o] !== -1; o = from[o]) corridor.push(o);
        // Am Ende des Korridors ein echter Ufer-Vorplatz statt eines einzelnen
        // Punktes: alle Kacheln der Wirtsregion im Umkreis. Damit trägt die
        // Startregion einen Hafen und liest sich als kleine Bucht (§4).
        const apronX = target % WORLD_TILES, apronY = (target / WORLD_TILES) | 0;
        for (let dy = -START_SHORE_APRON_RADIUS; dy <= START_SHORE_APRON_RADIUS; dy++) {
          for (let dx = -START_SHORE_APRON_RADIUS; dx <= START_SHORE_APRON_RADIUS; dx++) {
            const nx = apronX + dx, ny = apronY + dy;
            if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
            const no = ny * WORLD_TILES + nx;
            if (canGrow(no)) corridor.push(no);
          }
        }
        if (corridor.length <= START_CARVE_WATER_EXTENSION) {
          for (const o of corridor) {
            if (inCarve[o]) continue;
            inCarve[o] = 1;
            carved.push(o);
            if (buildableMask[o]) buildableCount++;
            if (distWater[o] === 1) waterfrontTiles++;
          }
        }
      }
    }
    // § 12.0 §4: Wie viele ANDERE Segmentierungsregionen berührt der Ausschnitt?
    // Die Wirtsregion zählt mit — sie bleibt nach dem Ausschneiden Nachbar und ist
    // die natürliche erste Erweiterungsrichtung.
    const neighbourSeeds = new Set();
    for (const tile of carved) {
      const tx = tile % WORLD_TILES, ty = (tile / WORLD_TILES) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
        const no = ny * WORLD_TILES + nx;
        if (inCarve[no]) continue;
        if (regionOf[no] >= 0) neighbourSeeds.add(regionOf[no]);
      }
    }
    // § 12.1 §6: Wie viele 2×2-Blöcke im Ausschnitt sind vollständig bebaubar UND
    // grenzen direkt ans Wasser? Genau das braucht ein Anleger/Hafen.
    let harbourPads = 0;
    for (const tile of carved) {
      const tx = tile % WORLD_TILES, ty = (tile / WORLD_TILES) | 0;
      if (tx + 1 >= WORLD_TILES || ty + 1 >= WORLD_TILES) continue;
      let pad = true;
      let touchesWater = false;
      for (let dy = 0; dy < 2 && pad; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const no = (ty + dy) * WORLD_TILES + tx + dx;
          if (!inCarve[no] || !buildableMask[no]) { pad = false; break; }
          if (distWater[no] === 1 && carriesQuay(tx, ty)) touchesWater = true;
        }
      }
      if (pad && touchesWater) harbourPads++;
    }
    return { host, carved, buildableCount, waterfrontTiles, harbourPads, neighbourRegions: neighbourSeeds.size };
  };

  // Zwei Durchgänge: Zuerst wird ein Kern gesucht, dessen natürlicher, kompakter
  // Ausschnitt das Wasser VON SELBST erreicht (bestes Ergebnis — Stadt am Ufer).
  // Erst wenn kein einziger Kandidat das schafft, wird der schmale Uferkorridor
  // zugelassen. Ohne beides gibt es keine Startregion (harter Fehler unten).
  let chosen;
  const rejected = { budget: 0, water: 0, harbour: 0, neighbours: 0 };
  // § Modelltreue 13.0: Der Korridor-Durchlauf zaehlte seine Ablehnungen nicht.
  // Bei einem Fehlschlag war deshalb nicht erkennbar, WORAN der zweite Versuch
  // scheiterte — die Meldung beschrieb nur den ersten. Jetzt beide.
  const rejectedSeek = { budget: 0, water: 0, harbour: 0, neighbours: 0 };
  const best = { buildableCount: 0, waterfrontTiles: 0, harbourPads: 0, neighbourRegions: 0 };
  for (const seekWater of [false, true]) {
    const bucket = seekWater ? rejectedSeek : rejected;
    for (const [, candidate] of candidates.slice(0, START_CORE_CANDIDATES)) {
      const grown = growCarve(candidate, { seekWater });
      if (seekWater) {
        for (const key of Object.keys(best)) best[key] = Math.max(best[key], grown[key]);
      }
      if (grown.buildableCount < MIN_START_BUILDABLE) { bucket.budget++; continue; }
      if (grown.waterfrontTiles < START_MIN_WATERFRONT) { bucket.water++; continue; }
      if (grown.harbourPads < START_MIN_HARBOUR_PADS) { bucket.harbour++; continue; }
      if (grown.neighbourRegions < START_MIN_NEIGHBOUR_REGIONS) { bucket.neighbours++; continue; }
      chosen = { core: candidate, seekWater, ...grown };
      break;
    }
    if (chosen) break;
  }
  if (!chosen) {
    console.warn(`  ! kein zentraler Kern erfüllt Budget + Wasserzugang + ${START_MIN_NEIGHBOUR_REGIONS} Nachbarregionen — Startregion wird nicht ausgeschnitten`);
    console.warn(`    ohne Korridor: ${rejected.budget} Budget, ${rejected.water} Wasser, ${rejected.harbour} Hafenfläche, ${rejected.neighbours} Nachbarn`);
    console.warn(`    mit Korridor:  ${rejectedSeek.budget} Budget, ${rejectedSeek.water} Wasser, ${rejectedSeek.harbour} Hafenfläche, ${rejectedSeek.neighbours} Nachbarn`);
    console.warn(`    bester Kandidat: ${best.buildableCount} bebaubar (min ${MIN_START_BUILDABLE}), ${best.waterfrontTiles} Ufer (min ${START_MIN_WATERFRONT}), ${best.harbourPads} Hafenflächen (min ${START_MIN_HARBOUR_PADS}), ${best.neighbourRegions} Nachbarn (min ${START_MIN_NEIGHBOUR_REGIONS})`);
    return null;
  }
  const startSeedIdx = seeds.length;
  seeds.push({ tile: chosen.core, cls: terrain[chosen.core] });
  for (const o of chosen.carved) regionOf[o] = startSeedIdx;
  console.log(`  Startregion ausgeschnitten: ${chosen.carved.length} Kacheln, ${chosen.buildableCount} bebaubar, ${chosen.waterfrontTiles} Kacheln direkt am Wasser, ${chosen.harbourPads} Hafenflächen, ${chosen.neighbourRegions} Nachbarregionen${chosen.seekWater ? ' (über Uferkorridor)' : ''} (Wirt: Seed ${chosen.host})`);
  return { seedIdx: startSeedIdx, core: chosen.core, tiles: chosen.carved.length, buildable: chosen.buildableCount };
})();

// 7e. Finale Ids 1..N (0 = Ozean), Reihenfolge deterministisch nach Größe.
const finalIds = new Map(); // seedIdx → finale Id
{
  const count = new Map();
  const firstTile = new Map();
  for (let o = 0; o < SIZE; o++) {
    const r = regionOf[o];
    if (r < 0) continue;
    count.set(r, (count.get(r) ?? 0) + 1);
    if (!firstTile.has(r)) firstTile.set(r, o);
  }
  const ordered = [...count.keys()].sort((a, b) => count.get(b) - count.get(a) || firstTile.get(a) - firstTile.get(b));
  ordered.forEach((r, i) => finalIds.set(r, i + 1));
  if (ordered.length > 254) { console.error('FEHLER: zu viele Regionen für Uint8.'); process.exit(1); }
}
const regionGrid = new Uint8Array(SIZE);
for (let o = 0; o < SIZE; o++) regionGrid[o] = regionOf[o] >= 0 ? finalIds.get(regionOf[o]) : 0;

// 7f. Regions-Statistik + Adjazenzgraph.
const regionStats = new Map(); // id → stats
for (let ty = 0; ty < WORLD_TILES; ty++) {
  for (let tx = 0; tx < WORLD_TILES; tx++) {
    const o = ty * WORLD_TILES + tx;
    const id = regionGrid[o];
    if (id === 0) continue;
    let s = regionStats.get(id);
    if (!s) {
      s = { id, tiles: 0, buildable: 0, coastTiles: 0, terrain: Object.fromEntries(T_NAMES.map((n) => [n, 0])), cx: 0, cy: 0, adjacent: new Set() };
      regionStats.set(id, s);
    }
    s.tiles++;
    s.cx += tx; s.cy += ty;
    const t = terrain[o];
    s.terrain[T_NAMES[t]]++;
    if (buildableMask[o]) s.buildable++;
    if (!oceanMask[o] && distToOcean[o] === 1) s.coastTiles++;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const nx = tx + dx, ny = ty + dy;
      if (nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
      const nid = regionGrid[ny * WORLD_TILES + nx];
      if (nid !== 0 && nid !== id) s.adjacent.add(nid);
    }
  }
}
// Adjazenz symmetrisch machen (oben nur Vorwärts-Kanten gesammelt).
for (const s of regionStats.values()) for (const a of s.adjacent) regionStats.get(a).adjacent.add(s.id);

// 7f-bis. § Final World Compaction 8.1 — SEEADJAZENZ.
//
// Die Quellinsel ist ein Archipel: Nach der Konsolidierung auf 13 große Regionen
// zerfällt die Landadjazenz in mehrere Komponenten, und ein Teil der Regionen
// wäre über Land NIE erreichbar. Statt künstlich Landbrücken zu erfinden, wird
// hier ausgemessen, welche Regionen nur durch eine SCHMALE WASSERSTRASSE
// getrennt sind. Das Gameplay verlangt dafür später einen echten Hafen in einer
// bereits erschlossenen Region — es entsteht keine zweite Regionslogik.
const MAX_SEA_GAP_TILES = 26; // ~104 m offene See zwischen zwei Landkanten
for (const s of regionStats.values()) s.seaAdjacent = new Set();
{
  for (const source of regionStats.values()) {
    // BFS ausschließlich über Wasser, ausgehend von den Küstenkacheln.
    const depth = new Int32Array(SIZE).fill(-1);
    let frontier = [];
    for (let o = 0; o < SIZE; o++) {
      if (regionGrid[o] !== source.id) continue;
      const tx = o % WORLD_TILES, ty = (o / WORLD_TILES) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
        const no = ny * WORLD_TILES + nx;
        if (isWaterCand[no] && depth[no] < 0) { depth[no] = 1; frontier.push(no); }
      }
    }
    for (let step = 1; step <= MAX_SEA_GAP_TILES && frontier.length > 0; step++) {
      const next = [];
      for (const c of frontier) {
        const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = tx + dx, ny = ty + dy;
          if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
          const no = ny * WORLD_TILES + nx;
          const target = regionGrid[no];
          if (target !== 0 && target !== source.id) {
            source.seaAdjacent.add(target);
            continue; // Land beendet den Strahl
          }
          if (!isWaterCand[no] || depth[no] >= 0) continue;
          depth[no] = step + 1;
          next.push(no);
        }
      }
      frontier = next;
    }
  }
  // Symmetrisch machen und echte Landnachbarn nicht doppelt führen.
  for (const s of regionStats.values()) for (const a of s.seaAdjacent) regionStats.get(a).seaAdjacent.add(s.id);
  for (const s of regionStats.values()) for (const a of s.adjacent) s.seaAdjacent.delete(a);
}
const regions = [...regionStats.values()].sort((a, b) => a.id - b.id).map((s) => ({
  id: s.id,
  tiles: s.tiles,
  buildable: s.buildable,
  coastTiles: s.coastTiles,
  terrain: s.terrain,
  dominant: T_NAMES.reduce((best, n) => (s.terrain[n] > s.terrain[best] ? n : best), 'water'),
  centroid: { x: Math.round(s.cx / s.tiles), y: Math.round(s.cy / s.tiles) },
  adjacent: [...s.adjacent].sort((a, b) => a - b),
  seaAdjacent: [...s.seaAdjacent].sort((a, b) => a - b),
}));
console.log(`  ${regions.length} Regionen (${regions.map((r) => r.tiles).reduce((a, b) => a + b, 0).toLocaleString('de-DE')} Landkacheln)`);

// ---------------------------------------------------------------------------
// 8. Zentralen Gründungsort per nachvollziehbarem Flächen-Score wählen
// ---------------------------------------------------------------------------
// Der mathematische Mittelpunkt der Bounding Box wäre häufig Wasser oder ein
// Berg. Deshalb wird zuerst die größte zusammenhängende Landmasse bestimmt und
// deren Flächenschwerpunkt als geografisches Inselzentrum verwendet.
const mainlandMask = new Uint8Array(SIZE);
let mainlandTiles = [];
{
  const seen = new Uint8Array(SIZE);
  for (let o = 0; o < SIZE; o++) {
    if (seen[o] || isWaterCand[o]) continue;
    const component = [o];
    seen[o] = 1;
    for (let head = 0; head < component.length; head++) {
      const c = component[head];
      const tx = c % WORLD_TILES, ty = (c / WORLD_TILES) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
        const no = ny * WORLD_TILES + nx;
        if (!seen[no] && !isWaterCand[no]) { seen[no] = 1; component.push(no); }
      }
    }
    if (component.length > mainlandTiles.length) mainlandTiles = component;
  }
  for (const o of mainlandTiles) mainlandMask[o] = 1;
}
const islandCenter = mainlandTiles.reduce(
  (sum, o) => ({ x: sum.x + o % WORLD_TILES, y: sum.y + ((o / WORLD_TILES) | 0) }),
  { x: 0, y: 0 },
);
islandCenter.x /= mainlandTiles.length;
islandCenter.y /= mainlandTiles.length;

function prefixGrid(predicate) {
  const stride = WORLD_TILES + 1;
  const prefix = new Int32Array(stride * stride);
  for (let y = 0; y < WORLD_TILES; y++) {
    let row = 0;
    for (let x = 0; x < WORLD_TILES; x++) {
      row += predicate(y * WORLD_TILES + x) ? 1 : 0;
      prefix[(y + 1) * stride + x + 1] = prefix[y * stride + x + 1] + row;
    }
  }
  return prefix;
}
function rectSum(prefix, x0, y0, x1, y1) {
  const stride = WORLD_TILES + 1;
  return prefix[y1 * stride + x1] - prefix[y0 * stride + x1] - prefix[y1 * stride + x0] + prefix[y0 * stride + x0];
}
const buildablePrefix = prefixGrid((o) => buildableMask[o]);
const grassBuildablePrefix = prefixGrid((o) => buildableMask[o] && terrain[o] === T.grass);
const waterPrefix = prefixGrid((o) => isWaterCand[o]);
const mountainPrefix = prefixGrid((o) => terrain[o] === T.mountain);

function expansionDirectionScore(cx, cy) {
  const occupied = [0, 0, 0, 0];
  for (let y = Math.max(1, cy - 56); y <= Math.min(WORLD_TILES - 2, cy + 56); y += 3) {
    for (let x = Math.max(1, cx - 56); x <= Math.min(WORLD_TILES - 2, cx + 56); x += 3) {
      const dx = x - cx, dy = y - cy;
      if (Math.abs(dx) < 10 || Math.abs(dy) < 10 || dx * dx + dy * dy > 56 * 56) continue;
      if (!buildableMask[y * WORLD_TILES + x]) continue;
      occupied[(dy >= 0 ? 2 : 0) + (dx >= 0 ? 1 : 0)]++;
    }
  }
  return occupied.filter((count) => count >= 18).length / 4;
}

function resourceAccessScore(cx, cy) {
  const found = new Set();
  for (let y = Math.max(1, cy - 64); y <= Math.min(WORLD_TILES - 2, cy + 64); y += 4) {
    for (let x = Math.max(1, cx - 64); x <= Math.min(WORLD_TILES - 2, cx + 64); x += 4) {
      if (Math.hypot(x - cx, y - cy) > 64) continue;
      const o = y * WORLD_TILES + x;
      if (terrain[o] === T.forest) found.add('wood');
      if (terrain[o] === T.fertile) found.add('food');
      if (terrain[o] === T.mountain) found.add('stone');
      if (distWater[o] <= 2) found.add('water');
    }
  }
  return found.size / 4;
}

function infrastructureScore(cx, cy) {
  let open = 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    for (let step = 1; step <= 24; step++) {
      const x = cx + dx * step, y = cy + dy * step;
      if (!buildableMask[y * WORLD_TILES + x]) break;
      open++;
    }
  }
  return open / 96;
}

const eligibleStartRegionIds = new Set(
  regions
    .filter((r) => r.buildable >= MIN_START_BUILDABLE && r.buildable <= MAX_START_BUILDABLE)
    .map((r) => r.id),
);
if (eligibleStartRegionIds.size === 0) {
  console.error(`FEHLER: keine Region liegt im Startziel ${MIN_START_BUILDABLE}–${MAX_START_BUILDABLE} bebaubare Kacheln.`);
  process.exit(1);
}

const startAreaCandidates = [];
const startSearchStats = { eligibleCenters: 0, reserveFits: 0, grassFits: 0, sameRegionFits: 0 };
for (let ty = 11; ty < WORLD_TILES - 16; ty++) {
  for (let tx = 11; tx < WORLD_TILES - 27; tx++) {
    const centerX = tx + 2, centerY = ty + 2;
    const centerOffset = centerY * WORLD_TILES + centerX;
    const regionId = regionGrid[centerOffset];
    if (!eligibleStartRegionIds.has(regionId) || !mainlandMask[centerOffset]) continue;
    startSearchStats.eligibleCenters++;
    const reserveX = tx + RESERVE_X0, reserveY = ty + RESERVE_Y0;
    if (rectSum(buildablePrefix, reserveX, reserveY, reserveX + RESERVE_W, reserveY + RESERVE_H) !== RESERVE_W * RESERVE_H) continue;
    startSearchStats.reserveFits++;
    if (rectSum(grassBuildablePrefix, tx - 1, ty - 1, tx + 6, ty + 6) !== 49) continue;
    startSearchStats.grassFits++;
    let sameRegion = true;
    for (let y = reserveY; y < reserveY + RESERVE_H && sameRegion; y++) {
      for (let x = reserveX; x < reserveX + RESERVE_W; x++) {
        if (regionGrid[y * WORLD_TILES + x] !== regionId) { sameRegion = false; break; }
      }
    }
    if (!sameRegion) continue;
    startSearchStats.sameRegionFits++;

    let hMin = Infinity, hMax = -Infinity, slopeSum = 0;
    for (let y = ty - 1; y <= ty + 5; y++) {
      for (let x = tx - 1; x <= tx + 5; x++) {
        hMin = Math.min(hMin, tileH(x, y));
        hMax = Math.max(hMax, tileH(x, y));
        slopeSum += tileSlope(x, y);
      }
    }
    const flatDelta = hMax - hMin;
    // § 12.1: HARTE Flachheitsgrenze, nicht nur eine Bewertung. Vorher war
    // `flatnessScore` bloß ein Summand — sobald flachere Kandidaten an einer
    // anderen Bedingung scheiterten, wählte §8 einen Platz mit ΔH 3,48 und einer
    // Flachheit von 0,000. Das Rathaus MUSS laut §4 auf einfacher Topografie
    // stehen; dieselbe Schwelle gilt schon für den Startregion-Kern.
    if (flatDelta > START_CORE_MAX_FLAT_DELTA) continue;
    const flatnessScore = clamp(1 - flatDelta / 0.85, 0, 1);
    const centralityScore = clamp(1 - Math.hypot(centerX - islandCenter.x, centerY - islandCenter.y) / 190, 0, 1);
    const expansionScore = expansionDirectionScore(centerX, centerY);
    const resourceScore = resourceAccessScore(centerX, centerY);
    const infraScore = infrastructureScore(centerX, centerY);
    const waterRisk = rectSum(waterPrefix, centerX - 8, centerY - 8, centerX + 9, centerY + 9) / (17 * 17);
    const cliffRisk = rectSum(mountainPrefix, centerX - 12, centerY - 12, centerX + 13, centerY + 13) / (25 * 25);
    const region = regions[regionId - 1];
    const neighboring = region.adjacent
      .map((id) => regions[id - 1])
      .sort((a, b) => Math.hypot(a.centroid.x - centerX, a.centroid.y - centerY) - Math.hypot(b.centroid.x - centerX, b.centroid.y - centerY));
    let earlyBuildable = region.buildable;
    let earlyRegionIds = [];
    let earlyFitness = Infinity;
    const subsetCount = 1 << neighboring.length;
    for (let mask = 1; mask < subsetCount; mask++) {
      let sum = region.buildable;
      const ids = [];
      let distancePenalty = 0;
      for (let index = 0; index < neighboring.length; index++) {
        if ((mask & (1 << index)) === 0) continue;
        const neighbor = neighboring[index];
        sum += neighbor.buildable;
        ids.push(neighbor.id);
        distancePenalty += Math.hypot(neighbor.centroid.x - centerX, neighbor.centroid.y - centerY) * 0.02;
      }
      const rangePenalty = sum < MIN_EARLY_BUILDABLE ? MIN_EARLY_BUILDABLE - sum
        : sum > MAX_EARLY_BUILDABLE ? sum - MAX_EARLY_BUILDABLE : Math.abs(sum - EARLY_BUILDABLE_SWEET_SPOT) * 0.08;
      const fitness = rangePenalty + distancePenalty + ids.length * 4;
      if (fitness < earlyFitness) { earlyFitness = fitness; earlyBuildable = sum; earlyRegionIds = ids; }
    }
    const earlyPenalty = earlyBuildable > MAX_EARLY_BUILDABLE ? (earlyBuildable - MAX_EARLY_BUILDABLE) / MAX_EARLY_BUILDABLE : 0;
    const totalScore = centralityScore * 34 + flatnessScore * 22 + expansionScore * 20
      + resourceScore * 12 + infraScore * 12 - waterRisk * 18 - cliffRisk * 18 - earlyPenalty * 14;
    startAreaCandidates.push({
      x: tx, y: ty, center: { x: centerX, y: centerY }, regionId,
      buildableTiles: region.buildable,
      flatnessScore, centralityScore, expansionDirectionScore: expansionScore,
      resourceAccessScore: resourceScore, infrastructureScore: infraScore,
      waterRisk, cliffRisk, totalScore, flatDelta, averageSlope: slopeSum / 49,
      earlyBuildable, earlyRegionIds,
    });
  }
}
startAreaCandidates.sort((a, b) => b.totalScore - a.totalScore || a.y - b.y || a.x - b.x);
const townHall = startAreaCandidates.find(
  (candidate) => candidate.earlyBuildable >= MIN_EARLY_BUILDABLE && candidate.earlyBuildable <= MAX_EARLY_BUILDABLE,
);
if (!townHall) {
  console.error('Startsuche:', startSearchStats, 'geeignete Regionsgrößen:', regions.filter((r) => eligibleStartRegionIds.has(r.id)).map((r) => ({ id: r.id, buildable: r.buildable, center: r.centroid })));
  console.error(`FEHLER: keine zentrale ${RESERVE_W}×${RESERVE_H}-Gründungsreserve in einer ${MIN_START_BUILDABLE}–${MAX_START_BUILDABLE}-Kachel-Region gefunden.`);
  process.exit(1);
}
const startRegion = regions[townHall.regionId - 1];

// Zwei von Beginn an verlängerbare Hauptachsen: eine Ost-West-Tangente südlich
// des Rathauses und ein Nord-Süd-Ast. Keine Sackgasse direkt am Stadtzentrum.
// Zwei vorplatzierte, verlängerbare Hauptachsen an der Rathaus-Südwestkante.
//
// § 12.1 — WARUM DIE OFFSETS FEST BLEIBEN: Ein Versuch, die Achsen dem Gelände
// folgen zu lassen (nur Graskacheln), war technisch erfolgreich, hat aber die
// Startbelegung verschoben und damit ein Dutzend Tests in acht Dateien gebrochen,
// die Bauplätze relativ zum Rathaus beschreiben — für einen rein optischen
// Gewinn. Die Achsen bleiben deshalb fest; garantiert (und geprüft) ist, dass sie
// auf BEBAUBAREM Land der Startregion liegen. Dass sie gelegentlich zwei
// Waldkacheln queren, ist folgenlos: Wald ist bebaubar und befahrbar.
const startRoads = [];
for (let x = townHall.x - 5; x <= townHall.x + 4; x++) startRoads.push({ x, y: townHall.y + 5 });
for (let y = townHall.y + 6; y <= townHall.y + 11; y++) startRoads.push({ x: townHall.x - 5, y });
for (const road of startRoads) {
  const o = road.y * WORLD_TILES + road.x;
  if (!buildableMask[o] || regionGrid[o] !== startRegion.id) {
    console.error('FEHLER: zentrale Startstraße liegt außerhalb der validierten Gründungsreserve.');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 8b. Reine Infrastruktur-Kandidaten (noch kein zweites Gameplay-System)
// ---------------------------------------------------------------------------
const inWorld = (x, y) => x >= 0 && y >= 0 && x < WORLD_TILES && y < WORLD_TILES;
const tileOffset = (x, y) => y * WORLD_TILES + x;
const roadSurface = (x, y) => {
  if (!inWorld(x, y)) return false;
  const o = tileOffset(x, y);
  return !isWaterCand[o] && terrain[o] !== T.mountain
    && (tileSlope(x, y) <= 0.8 || (waterfrontBuildableMask[o] && tileSlope(x, y) <= 1.2))
    && (buildableMask[o] || waterfrontBuildableMask[o]);
};
const tunnelApproachSurface = (x, y) => {
  if (!inWorld(x, y)) return false;
  const o = tileOffset(x, y);
  return !isWaterCand[o] && terrain[o] !== T.mountain && tileSlope(x, y) <= 1.25;
};
const spacedPush = (list, candidate, minimumDistance, limit) => {
  if (list.length >= limit) return;
  if (list.every((other) => Math.hypot(other.midX - candidate.midX, other.midY - candidate.midY) >= minimumDistance)) {
    list.push(candidate);
  }
};

const bridgePool = [];
for (let y = 2; y < WORLD_TILES - 2; y += 2) {
  for (let x = 2; x < WORLD_TILES - 2; x += 2) {
    if (!roadSurface(x, y)) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const crossed = [];
      for (let step = 1; step <= 14; step++) {
        const nx = x + dx * step, ny = y + dy * step;
        if (!inWorld(nx, ny)) break;
        const no = tileOffset(nx, ny);
        if (isWaterCand[no]) { crossed.push(no); continue; }
        if (crossed.length < 2 || !roadSurface(nx, ny)) break;
        const elevationDelta = Math.abs(tileH(nx, ny) - tileH(x, y));
        if (elevationDelta > 2.5) break;
        const allRiver = crossed.every((offset) => terrain[offset] === T.river);
        const anyOcean = crossed.some((offset) => oceanMask[offset]);
        const waterType = allRiver ? 'river' : anyOcean ? 'coast' : 'lake';
        bridgePool.push({
          start: { x, y }, end: { x: nx, y: ny }, span: crossed.length,
          elevationDelta, waterType,
          startShoreType: shoreTypeGrid[tileOffset(x, y)],
          endShoreType: shoreTypeGrid[tileOffset(nx, ny)],
          rampGrade: round(elevationDelta / Math.max(2, crossed.length), 3),
          clearanceRequired: waterType === 'coast' || crossed.length >= 6,
          supportedRoadClasses: crossed.length <= 8 ? ['local', 'collector', 'arterial'] : ['collector', 'arterial'],
          midX: (x + nx) / 2, midY: (y + ny) / 2,
          score: crossed.length * 4 + elevationDelta * 10
            - (shoreTypeGrid[tileOffset(x, y)] >= 1 && shoreTypeGrid[tileOffset(x, y)] <= 3 ? 8 : 0)
            - (shoreTypeGrid[tileOffset(nx, ny)] >= 1 && shoreTypeGrid[tileOffset(nx, ny)] <= 3 ? 8 : 0),
        });
        break;
      }
    }
  }
}
bridgePool.sort((a, b) => a.score - b.score || a.midY - b.midY || a.midX - b.midX);
const bridgeCandidates = [];
for (const candidate of bridgePool) spacedPush(bridgeCandidates, candidate, 10, 48);

// § World Overhaul 12.0: Das Massiv der neuen Insel ist deutlich breiter als das
// der alten. Mit der bisherigen Reichweite von 28 Kacheln fand die Suche KEINEN
// einzigen Tunnel mehr — nicht weil es keine gäbe, sondern weil kein gerader
// Durchstich innerhalb von 28 Kacheln wieder auf befahrbares Gelände trifft.
const TUNNEL_MAX_LENGTH_TILES = 52;

const tunnelPool = [];
for (let y = 4; y < WORLD_TILES - 4; y += 2) {
  for (let x = 4; x < WORLD_TILES - 4; x += 2) {
    if (!tunnelApproachSurface(x, y)) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      let maxMountain = -Infinity;
      let mountainTiles = 0;
      for (let step = 1; step <= TUNNEL_MAX_LENGTH_TILES; step++) {
        const nx = x + dx * step, ny = y + dy * step;
        if (!inWorld(nx, ny)) break;
        const no = tileOffset(nx, ny);
        if (terrain[no] === T.mountain) {
          mountainTiles++;
          maxMountain = Math.max(maxMountain, tileH(nx, ny));
          continue;
        }
        if (mountainTiles < 5 || !tunnelApproachSurface(nx, ny)) break;
        const entranceHeight = Math.max(tileH(x, y), tileH(nx, ny));
        const mountainDepth = maxMountain - entranceHeight;
        if (mountainDepth < 3) break;
        tunnelPool.push({
          entranceA: { x, y, height: round(tileH(x, y), 3) },
          entranceB: { x: nx, y: ny, height: round(tileH(nx, ny), 3) },
          length: step,
          mountainDepth,
          minimumUnlockLevel: clamp(Math.round(8 + mountainDepth / 3), 10, 18),
          midX: (x + nx) / 2, midY: (y + ny) / 2,
          score: step - mountainDepth * 0.25,
        });
        break;
      }
    }
  }
}
tunnelPool.sort((a, b) => a.score - b.score || a.midY - b.midY || a.midX - b.midX);
const tunnelCandidates = [];
for (const candidate of tunnelPool) spacedPush(tunnelCandidates, candidate, 18, 24);

const elevatedPool = [];
for (let y = 6; y < WORLD_TILES - 6; y += 4) {
  for (let x = 6; x < WORLD_TILES - 6; x += 4) {
    if (!buildableMask[tileOffset(x, y)]) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      for (let span = 10; span <= 24; span += 2) {
        const ex = x + dx * span, ey = y + dy * span;
        if (!inWorld(ex, ey) || !buildableMask[tileOffset(ex, ey)]) continue;
        const startHeight = tileH(x, y), endHeight = tileH(ex, ey);
        let maxPillarHeight = 0, valid = true;
        for (let step = 1; step < span; step++) {
          const no = tileOffset(x + dx * step, y + dy * step);
          if (isWaterCand[no]) { valid = false; break; }
          const deckHeight = startHeight + (endHeight - startHeight) * (step / span);
          maxPillarHeight = Math.max(maxPillarHeight, deckHeight - tileH(x + dx * step, y + dy * step));
        }
        if (!valid || maxPillarHeight < 2.5) continue;
        elevatedPool.push({
          start: { x, y }, end: { x: ex, y: ey },
          startHeight, endHeight, maxPillarHeight, span,
          terrainClearance: Math.max(1.5, maxPillarHeight * 0.4),
          midX: (x + ex) / 2, midY: (y + ey) / 2,
          score: span - maxPillarHeight,
        });
        break;
      }
    }
  }
}
elevatedPool.sort((a, b) => a.score - b.score || a.midY - b.midY || a.midX - b.midX);
const elevatedRoadCandidates = [];
for (const candidate of elevatedPool) spacedPush(elevatedRoadCandidates, candidate, 20, 24);

const harborPool = [];
for (let y = 2; y < WORLD_TILES - 2; y += 2) {
  for (let x = 2; x < WORLD_TILES - 2; x += 2) {
    const o = tileOffset(x, y);
    if (!roadSurface(x, y) || !waterfrontBuildableMask[o] || distToOcean[o] !== 1 || regionGrid[o] === 0) continue;
    const oceanNeighbor = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
      .find((point) => oceanMask[tileOffset(point.x, point.y)]);
    if (!oceanNeighbor) continue;
    harborPool.push({
      position: { x, y }, waterAccess: oceanNeighbor,
      regionId: regionGrid[o], depth: round(Math.min(3, 0.45 + Math.max(1, distToLand[tileOffset(oceanNeighbor.x, oceanNeighbor.y)]) * 0.28), 2),
      shoreType: shoreTypeGrid[o],
      buildableApron: true,
      midX: x, midY: y,
      score: tileSlope(x, y),
    });
  }
}
harborPool.sort((a, b) => a.score - b.score || a.midY - b.midY || a.midX - b.midX);
const harborCandidates = [];
for (const candidate of harborPool) spacedPush(harborCandidates, candidate, 24, 16);

// Der historische Anleger bleibt getrennt vom Stadtzentrum. Eine deterministische
// Land-BFS wählt den nächstgelegenen erreichbaren Hafenkandidaten und bereitet
// die spätere Tutorial-/Versorgungstrasse vor, ohne Story-State einzuführen.
const centralFoundingPoint = { x: townHall.x + 2, y: townHall.y + 2 };
const routeGoal = { x: townHall.x + 2, y: townHall.y + 5 };
const routePrev = new Int32Array(SIZE).fill(-2);
const routeDistance = new Float64Array(SIZE).fill(Infinity);
{
  const start = tileOffset(routeGoal.x, routeGoal.y);
  const heap = [[0, start]];
  const push = (entry) => {
    heap.push(entry);
    let index = heap.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (heap[parent][0] <= heap[index][0]) break;
      [heap[parent], heap[index]] = [heap[index], heap[parent]];
      index = parent;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let index = 0;
      for (;;) {
        const left = index * 2 + 1, right = left + 1;
        let smallest = index;
        if (left < heap.length && heap[left][0] < heap[smallest][0]) smallest = left;
        if (right < heap.length && heap[right][0] < heap[smallest][0]) smallest = right;
        if (smallest === index) break;
        [heap[index], heap[smallest]] = [heap[smallest], heap[index]];
        index = smallest;
      }
    }
    return top;
  };
  routePrev[start] = -1;
  routeDistance[start] = 0;
  while (heap.length) {
    const [cost, c] = pop();
    if (cost !== routeDistance[c]) continue;
    const x = c % WORLD_TILES, y = (c / WORLD_TILES) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!inWorld(nx, ny)) continue;
      const no = tileOffset(nx, ny);
      if (isWaterCand[no]) continue;
      const slope = tileSlope(nx, ny);
      const step = 1 + slope * 5 + (terrain[no] === T.mountain ? 18 : 0) + (buildableMask[no] ? 0 : 2.5);
      const next = cost + step;
      if (next >= routeDistance[no]) continue;
      routePrev[no] = c;
      routeDistance[no] = next;
      push([next, no]);
    }
  }
}
const futureHarborCandidate = harborCandidates
  .filter((harbor) => Number.isFinite(routeDistance[tileOffset(harbor.position.x, harbor.position.y)]))
  .sort((a, b) => routeDistance[tileOffset(a.position.x, a.position.y)] - routeDistance[tileOffset(b.position.x, b.position.y)] || a.score - b.score)[0];
if (!futureHarborCandidate) {
  console.error('FEHLER: kein erreichbarer Küstenanleger für die zentrale Gründung gefunden.', {
    harborPool: harborPool.length,
    harborCandidates: harborCandidates.length,
    waterfrontTiles: waterfrontBuildableMask.reduce((sum, value) => sum + value, 0),
    flatCoastTiles: shoreTypeGrid.reduce((sum, value) => sum + Number(value === 1), 0),
    oceanFrontBuildable: waterfrontBuildableMask.reduce((sum, value, o) => sum + Number(value && distToOcean[o] === 1), 0),
    startRegion: startRegion.id,
    center: centralFoundingPoint,
  });
  process.exit(1);
}
const coastalArrivalPoint = { ...futureHarborCandidate.position };
const initialSupplyRoute = [];
for (let o = tileOffset(coastalArrivalPoint.x, coastalArrivalPoint.y); o >= 0; o = routePrev[o]) {
  initialSupplyRoute.push({ x: o % WORLD_TILES, y: (o / WORLD_TILES) | 0 });
  if (routePrev[o] === -1) break;
}
if (initialSupplyRoute.at(-1)?.x !== routeGoal.x || initialSupplyRoute.at(-1)?.y !== routeGoal.y) {
  console.error('FEHLER: vorbereitete Versorgungstrasse erreicht den zentralen Start nicht.');
  process.exit(1);
}

const waterRouteNodes = [];
for (let y = 8; y < WORLD_TILES - 8; y += 16) {
  for (let x = 8; x < WORLD_TILES - 8; x += 16) {
    const o = tileOffset(x, y);
    if (!isWaterCand[o]) continue;
    const type = oceanMask[o] ? 'sea' : terrain[o] === T.river ? 'river' : 'lake';
    waterRouteNodes.push({
      id: `water_${x}_${y}`,
      position: { x, y }, type,
      clearance: type === 'river' ? 3 : 8,
      depth: round(oceanMask[o] ? Math.min(3, 0.45 + Math.max(1, distToLand[o]) * 0.28) : 0.8, 2),
      width: Math.max(2, Math.min(32, distToLand[o] * 2)),
      regionId: regionGrid[o],
    });
  }
}
for (let i = 0; i < harborCandidates.length; i++) {
  const harbor = harborCandidates[i];
  waterRouteNodes.push({
    id: `harbor_${String(i + 1).padStart(2, '0')}`,
    position: harbor.waterAccess,
    type: 'harbor',
    clearance: 8,
    depth: harbor.depth,
    width: 5,
    regionId: harbor.regionId,
  });
}

// Navigationskanten werden beim Bake ausschließlich über nachweislich
// durchgängige Wassersegmente verbunden. Der Renderer darf diese Kanten für
// Vorschauen benutzen; eine direkte Hafen-zu-Hafen-Linie durch Land existiert
// dadurch gar nicht erst im Datenmodell.
const waterRouteEdges = [];
const waterEdgeKeys = new Set();
const waterLineIsClear = (a, b) => {
  const length = Math.hypot(b.position.x - a.position.x, b.position.y - a.position.y);
  // Vier Subsamples pro Kachel plus Supercover-Nachbarschaft. Eine einfache
  // Rundung übersieht bei diagonalen Linien sonst schmale Landzungen zwischen
  // zwei Samples und erzeugt optisch eine Route über Land.
  const samples = Math.max(2, Math.ceil(length * 4));
  for (let i = 1; i < samples; i++) {
    const px = a.position.x + (b.position.x - a.position.x) * (i / samples);
    const py = a.position.y + (b.position.y - a.position.y) * (i / samples);
    const xs = new Set([Math.floor(px), Math.ceil(px), Math.round(px)]);
    const ys = new Set([Math.floor(py), Math.ceil(py), Math.round(py)]);
    for (const x of xs) {
      for (const y of ys) {
        if (!inWorld(x, y) || !isWaterCand[tileOffset(x, y)]) return false;
      }
    }
  }
  return true;
};
for (let i = 0; i < waterRouteNodes.length; i++) {
  const a = waterRouteNodes[i];
  const candidates = [];
  for (let j = i + 1; j < waterRouteNodes.length; j++) {
    const b = waterRouteNodes[j];
    const length = Math.hypot(b.position.x - a.position.x, b.position.y - a.position.y);
    const limit = a.type === 'harbor' || b.type === 'harbor' ? 34 : 23;
    if (length > limit) continue;
    candidates.push({ j, length });
  }
  candidates.sort((aCandidate, bCandidate) => aCandidate.length - bCandidate.length || aCandidate.j - bCandidate.j);
  let connected = 0;
  for (const candidate of candidates) {
    if (connected >= 8) break;
    const b = waterRouteNodes[candidate.j];
    if (!waterLineIsClear(a, b)) continue;
    const key = `${a.id}|${b.id}`;
    if (waterEdgeKeys.has(key)) continue;
    waterEdgeKeys.add(key);
    waterRouteEdges.push({
      id: `water_edge_${String(waterRouteEdges.length + 1).padStart(4, '0')}`,
      from: a.id,
      to: b.id,
      length: round(candidate.length, 2),
      minDepth: Math.min(a.depth, b.depth),
      minClearance: Math.min(a.clearance, b.clearance),
      kind: a.type === 'harbor' || b.type === 'harbor' ? 'harbor_link' : 'waterway',
    });
    connected++;
  }
}

// ---------------------------------------------------------------------------
// 9. Ausgaben schreiben
// ---------------------------------------------------------------------------
// Flaches Array + join('') statt tiefer `+`-Ketten: tausende Konkatenationen
// erzeugen einen so tiefen AST, dass Parser (ESLint) per Stack-Overflow scheitern.
function toBase64Lines(bytes) {
  const b64 = Buffer.from(bytes).toString('base64');
  const lines = [];
  for (let i = 0; i < b64.length; i += 120) lines.push(`'${b64.slice(i, i + 120)}',`);
  return `[\n  ${lines.join('\n  ')}\n].join('')`;
}

// 8a. Terrain-Grid (Sim).
const terrainTs = `// AUTO-GENERIERT von tools/bakeWorld.mjs — NICHT von Hand editieren.
// Quelle: ${SOURCE_LABEL} (§ World Overhaul 12.0 — neue Insel, Terraforming vor Segmentierung).
// Regeln/Schwellen: tools/bakeWorld.mjs + docs/WORLD_REBUILD.md; Statistik:
// tools/bake-report.md. Neu erzeugen: \`node tools/bakeWorld.mjs\`.
/* eslint-disable */

/** Weltbreite/-tiefe in Kacheln. */
export const WORLD_TILES = ${WORLD_TILES};
export const WORLD_SOURCE_SHA256 = '${SOURCE_SHA256}';
export const BAKED_WORLD = {
  horizontalScaleFromV60: ${round((WORLD_TILES - OCEAN_MARGIN_TILES * 2) / (WORLD_TILES - PREVIOUS_OCEAN_MARGIN_TILES * 2), 4)},
  previousWaterlineNormalized: ${PREVIOUS_WATERLINE_N},
  waterlineNormalized: ${WATERLINE_N},
  peakWorldHeight: ${PEAK_WORLD_HEIGHT},
  islandCenter: { x: ${round(islandCenter.x, 2)}, y: ${round(islandCenter.y, 2)} },
  coastGeometry: {
    projectedDegenerateTrianglesSkipped: ${projectedDegenerateTrianglesSkipped},
    isolatedPeaksRepaired: ${coastIsolatedPeaksRepaired},
    isolatedPeakCount: ${coastIsolatedPeakCount},
    maxNeighborStep: ${round(coastMaxNeighborStep)},
    /** § 12.2: die verbindliche Zackenkennzahl. \`isolatedPeakCount\` benutzt die
     *  alte, viel zu lockere Bedingung (> 6 m Überhöhung UND ≤ 1 Stütze) und
     *  stand deshalb auf ~0, während der Spieler ein Ufer voller Splitter sah. */
    needlesRepaired: ${needlesRepaired},
    needleCount: ${terrainNeedleCount},
    cliffPlateaus: ${cliffPlateaus.plateaus},
    cliffPlateauTiles: ${cliffPlateaus.plateauTiles},
  },
  /**
   * § Modelltreue 13.0 — die verbindliche Kennzahl dieses Auftrags: Wie stark
   * weicht das ausgelieferte Höhenfeld von der Quell-GLB ab? Gemessen wird
   * jeder Landknoten des Rasters gegen seine reine Modellhöhe; \`changedNodes\`
   * zählt Abweichungen über 5 cm. Im Treue-Modus MUSS das 0 sein.
   */
  modelFidelity: {
    terrainMode: '${RAW_TERRAIN_FIDELITY ? 'raw' : 'flatten'}',
    landNodes: ${modelFidelity.landNodes},
    changedNodes: ${modelFidelity.changedNodes},
    changedShare: ${modelFidelity.changedShare},
    meanAbsDelta: ${modelFidelity.meanAbsDelta},
    maxAbsDelta: ${modelFidelity.maxAbsDelta},
    meanModelHeight: ${modelFidelity.meanModelHeight},
    meanWorldHeight: ${modelFidelity.meanWorldHeight},
  },
  /** Inselweit mögliche 2×2-Anlegerplätze (Klippenküste ⇒ bewusst selten). */
  harbourPads: ${islandHarbourPads},
} as const;

/** Terrain-Typ je ID im Grid (Index = gespeicherter Byte-Wert). */
export const TERRAIN_IDS = ${JSON.stringify(T_NAMES)} as const;

/** Zentraler Start, historische Küstenankunft und vorbereitete Versorgungstrasse. */
export const BAKED_START = {
  regionId: ${startRegion.id},
  townHall: { x: ${townHall.x}, y: ${townHall.y} },
  centralFoundingPoint: ${JSON.stringify(centralFoundingPoint)},
  coastalArrivalPoint: ${JSON.stringify(coastalArrivalPoint)},
  futureHarborCandidate: ${JSON.stringify({ position: futureHarborCandidate.position, waterAccess: futureHarborCandidate.waterAccess, regionId: futureHarborCandidate.regionId })},
  initialSupplyRoute: ${JSON.stringify(initialSupplyRoute)},
  startRoads: ${JSON.stringify(startRoads)},
  score: ${JSON.stringify({
    buildableTiles: townHall.buildableTiles,
    earlyBuildableTiles: townHall.earlyBuildable,
    flatnessScore: round(townHall.flatnessScore),
    centralityScore: round(townHall.centralityScore),
    expansionDirectionScore: round(townHall.expansionDirectionScore),
    resourceAccessScore: round(townHall.resourceAccessScore),
    infrastructureScore: round(townHall.infrastructureScore),
    waterRisk: round(townHall.waterRisk),
    cliffRisk: round(townHall.cliffRisk),
    totalScore: round(townHall.totalScore),
  })},
} as const;

const DATA =
  ${toBase64Lines(terrain)};

function decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Row-major ${WORLD_TILES}×${WORLD_TILES} Terrain-IDs (siehe TERRAIN_IDS). */
export const terrainGrid: Uint8Array = decode(DATA);
`;
writeFileSync(join(ROOT, 'src', 'game', 'config', 'world', 'islandTerrain.gen.ts'), terrainTs);
console.log('— geschrieben: src/game/config/world/islandTerrain.gen.ts');

// 8a2. Region-Grid + Statistik (Sim; § Welt 2.0 organische Regionen).
const regionsTs = `// AUTO-GENERIERT von tools/bakeWorld.mjs — NICHT von Hand editieren.
// Organische Regionen (§ Welt 2.0): Segmentierung der Insel entlang natürlicher
// Grenzen (Biome, Flüsse, Kämme). Region-Id 0 = Ozean (nie freischaltbar);
// 1..REGION_COUNT = Landschaften. regions.config.ts gibt ihnen Namen/Gameplay.
// Neu erzeugen: \`node tools/bakeWorld.mjs\`.
/* eslint-disable */

export const REGION_COUNT = ${regions.length};

/** Vom Bake ermittelte Statistik je Region (Index = Id − 1). */
export const BAKED_REGIONS = ${JSON.stringify(
  regions.map((r) => ({ id: r.id, tiles: r.tiles, buildable: r.buildable, coastTiles: r.coastTiles, dominant: r.dominant, centroid: r.centroid, adjacent: r.adjacent, seaAdjacent: r.seaAdjacent, terrain: r.terrain })),
  null,
  2,
)} as const;

const DATA =
  ${toBase64Lines(regionGrid)};

function decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Row-major ${WORLD_TILES}×${WORLD_TILES} Region-Ids (0 = Ozean). */
export const regionGrid: Uint8Array = decode(DATA);
`;
writeFileSync(join(ROOT, 'src', 'game', 'config', 'world', 'islandRegions.gen.ts'), regionsTs);
console.log('— geschrieben: src/game/config/world/islandRegions.gen.ts');

// 8a3. Synchron ladbare Oberflächen-/Bebaubarkeitsdaten für die Simulation.
// Dadurch benötigt die Simulation weder Three.js noch Runtime-Raycasts auf der GLB.
const surfaceHeight = new Int16Array(SIZE);
const surfaceSlope = new Uint16Array(SIZE);
const buildabilityFlags = new Uint8Array(SIZE);
const waterDepth = new Uint8Array(SIZE);
for (let y = 0; y < WORLD_TILES; y++) {
  for (let x = 0; x < WORLD_TILES; x++) {
    const o = y * WORLD_TILES + x;
    const terrainId = terrain[o];
    surfaceHeight[o] = Math.round(tileH(x, y) * 100);
    surfaceSlope[o] = Math.min(65535, Math.round(tileSlope(x, y) * 1000));
    if (buildableMask[o]) buildabilityFlags[o] |= 1;
    if (terrainId === T.water || terrainId === T.river) buildabilityFlags[o] |= 2;
    // CLIFF_BIT folgt derselben höhenabhängigen Regel wie die Gebirgs-
    // Klassifikation (§ Map Flattening B3). Sonst hätte die neue Regel keine
    // Wirkung auf `validatePlacement`: dort blockt `surface.cliff` unabhängig
    // vom Terraintyp, und eine steile Tiefland-Kachel wäre weiterhin gesperrt.
    if (terrainId === T.mountain || isCliffTile(x, y, FLAT_MOUNTAIN_SLOPE_MIN_HEIGHT)) {
      buildabilityFlags[o] |= 4;
    }
    if (distToOcean[o] > 0 && distToOcean[o] <= 2) buildabilityFlags[o] |= 8;
    if (waterfrontBuildableMask[o]) buildabilityFlags[o] |= 16;
    if (isWaterCand[o]) {
      const depth = oceanMask[o]
        ? Math.min(3, 0.45 + Math.max(1, distToLand[o]) * 0.28)
        : 0.8;
      waterDepth[o] = Math.min(255, Math.round(depth * 20));
    }
  }
}
const buildabilityTs = `// AUTO-GENERIERT von tools/bakeWorld.mjs — NICHT von Hand editieren.
// Deterministische Simulationsoberfläche der neuen Insel; keine Three.js-Abhängigkeit.
/* eslint-disable */

export const BUILDABILITY_WORLD_TILES = ${WORLD_TILES};
export const SURFACE_HEIGHT_SCALE = 100;
export const SURFACE_SLOPE_SCALE = 1000;
export const BUILDABLE_BIT = 1;
export const WATER_BIT = 2;
export const CLIFF_BIT = 4;
export const COAST_BIT = 8;
export const WATERFRONT_BIT = 16;
export const WATER_DEPTH_SCALE = 20;
/** 0 kein Ufer, 1 flache Küste, 2 Flussufer, 3 Seeufer, 4 Steilküste. */
export const SHORE_TYPES = ['none', 'coast', 'riverbank', 'lakeshore', 'cliff'] as const;

const HEIGHT_DATA = ${toBase64Lines(new Uint8Array(surfaceHeight.buffer))};
const SLOPE_DATA = ${toBase64Lines(new Uint8Array(surfaceSlope.buffer))};
const FLAG_DATA = ${toBase64Lines(buildabilityFlags)};
const SHORE_DATA = ${toBase64Lines(shoreTypeGrid)};
const WATER_DEPTH_DATA = ${toBase64Lines(waterDepth)};

function bytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const surfaceHeightGrid = new Int16Array(bytes(HEIGHT_DATA).buffer);
export const surfaceSlopeGrid = new Uint16Array(bytes(SLOPE_DATA).buffer);
export const buildabilityGrid = bytes(FLAG_DATA);
export const shoreTypeGrid = bytes(SHORE_DATA);
/** Wassertiefe in Weltmetern = Byte / WATER_DEPTH_SCALE; Land = 0. */
export const waterDepthGrid = bytes(WATER_DEPTH_DATA);
`;
writeFileSync(join(ROOT, 'src', 'game', 'config', 'world', 'islandBuildability.gen.ts'), buildabilityTs);
console.log('— geschrieben: src/game/config/world/islandBuildability.gen.ts');

const infrastructureTs = `// AUTO-GENERIERT von tools/bakeWorld.mjs — NICHT von Hand editieren.
// Geografische Kandidaten/Hooks; noch keine Brücken-, Tunnel- oder Schifffahrtssimulation.
/* eslint-disable */

export type BakedRoadClass = 'local' | 'collector' | 'arterial';
export interface BakedTilePoint { x: number; y: number }
export interface BakedWorldPoint { x: number; y: number; z: number }
export interface BridgeCandidate {
  id: string;
  start: BakedTilePoint;
  end: BakedTilePoint;
  span: number;
  elevationDelta: number;
  waterType: 'river' | 'lake' | 'coast';
  startShoreType: number;
  endShoreType: number;
  rampGrade: number;
  clearanceRequired: boolean;
  supportedRoadClasses: BakedRoadClass[];
}
export interface ElevatedRoadCandidate {
  id: string;
  start: BakedTilePoint;
  end: BakedTilePoint;
  startHeight: number;
  endHeight: number;
  maxPillarHeight: number;
  span: number;
  terrainClearance: number;
}
export interface TunnelCandidate {
  id: string;
  entranceA: BakedWorldPoint;
  entranceB: BakedWorldPoint;
  length: number;
  mountainDepth: number;
  minimumUnlockLevel: number;
}
export interface HarborCandidate {
  id: string;
  position: BakedTilePoint;
  waterAccess: BakedTilePoint;
  regionId: number;
  depth: number;
  shoreType: number;
  buildableApron: boolean;
}
export interface WaterRouteNode {
  id: string;
  position: BakedWorldPoint;
  type: 'sea' | 'river' | 'lake' | 'harbor' | 'dock';
  clearance: number;
  depth: number;
  width: number;
  regionId: number;
}
export interface WaterRouteEdge {
  id: string;
  from: string;
  to: string;
  length: number;
  minDepth: number;
  minClearance: number;
  kind: 'waterway' | 'harbor_link';
}

export const bridgeCandidates: readonly BridgeCandidate[] = ${JSON.stringify(bridgeCandidates.map((candidate, i) => ({
  id: `bridge_${String(i + 1).padStart(2, '0')}`,
  start: candidate.start,
  end: candidate.end,
  span: candidate.span,
  elevationDelta: round(candidate.elevationDelta),
  waterType: candidate.waterType,
  startShoreType: candidate.startShoreType,
  endShoreType: candidate.endShoreType,
  rampGrade: candidate.rampGrade,
  clearanceRequired: candidate.clearanceRequired,
  supportedRoadClasses: candidate.supportedRoadClasses,
})), null, 2)};

export const elevatedRoadCandidates: readonly ElevatedRoadCandidate[] = ${JSON.stringify(elevatedRoadCandidates.map((candidate, i) => ({
  id: `viaduct_${String(i + 1).padStart(2, '0')}`,
  start: candidate.start,
  end: candidate.end,
  startHeight: round(candidate.startHeight),
  endHeight: round(candidate.endHeight),
  maxPillarHeight: round(candidate.maxPillarHeight),
  span: candidate.span,
  terrainClearance: round(candidate.terrainClearance),
})), null, 2)};

export const tunnelCandidates: readonly TunnelCandidate[] = ${JSON.stringify(tunnelCandidates.map((candidate, i) => ({
  id: `tunnel_${String(i + 1).padStart(2, '0')}`,
  entranceA: { x: candidate.entranceA.x, y: candidate.entranceA.height, z: candidate.entranceA.y },
  entranceB: { x: candidate.entranceB.x, y: candidate.entranceB.height, z: candidate.entranceB.y },
  length: candidate.length,
  mountainDepth: round(candidate.mountainDepth),
  minimumUnlockLevel: candidate.minimumUnlockLevel,
})), null, 2)};

export const harborCandidates: readonly HarborCandidate[] = ${JSON.stringify(harborCandidates.map((candidate, i) => ({
  id: `harbor_${String(i + 1).padStart(2, '0')}`,
  position: candidate.position,
  waterAccess: candidate.waterAccess,
  regionId: candidate.regionId,
  depth: candidate.depth,
  shoreType: candidate.shoreType,
  buildableApron: candidate.buildableApron,
})), null, 2)};

export const centralFoundingPoint: BakedTilePoint = ${JSON.stringify(centralFoundingPoint)};
export const coastalArrivalPoint: BakedTilePoint = ${JSON.stringify(coastalArrivalPoint)};
export const futureHarborCandidateId = '${`harbor_${String(harborCandidates.indexOf(futureHarborCandidate) + 1).padStart(2, '0')}`}';
export const initialSupplyRoute: readonly BakedTilePoint[] = ${JSON.stringify(initialSupplyRoute)};

export const waterRouteNodes: readonly WaterRouteNode[] = ${JSON.stringify(waterRouteNodes.map((node) => ({
  ...node,
  position: { x: node.position.x, y: 0, z: node.position.y },
})), null, 2)};

export const waterRouteEdges: readonly WaterRouteEdge[] = ${JSON.stringify(waterRouteEdges, null, 2)};
`;
writeFileSync(join(ROOT, 'src', 'game', 'config', 'world', 'islandInfrastructure.gen.ts'), infrastructureTs);
console.log('— geschrieben: src/game/config/world/islandInfrastructure.gen.ts');

// 8b. Höhen-Grid (Renderer), Uint16-quantisiert.
let hMin = Infinity, hMax = -Infinity;
for (const v of HW) { if (v < hMin) hMin = v; if (v > hMax) hMax = v; }
const hRange = hMax - hMin;
const HQ = new Uint16Array(GRID * GRID);
for (let i = 0; i < HW.length; i++) HQ[i] = Math.round(((HW[i] - hMin) / hRange) * 65535);
const heightTs = `// AUTO-GENERIERT von tools/bakeWorld.mjs — NICHT von Hand editieren.
// Quelle: ${SOURCE_LABEL} (§ World Overhaul 12.0 — neue Insel, Terraforming vor Segmentierung).
// ${GRID}×${GRID} Höhen-Samples (${SAMPLES_PER_TILE}/Kachel + 1), Uint16-quantisiert.
// Neu erzeugen: \`node tools/bakeWorld.mjs\`.
/* eslint-disable */

export const HEIGHT_GRID = ${GRID};
export const HEIGHT_SAMPLES_PER_TILE = ${SAMPLES_PER_TILE};
export const HEIGHT_MIN = ${hMin.toFixed(5)};
export const HEIGHT_RANGE = ${hRange.toFixed(5)};

const DATA =
  ${toBase64Lines(new Uint8Array(HQ.buffer))};

function decode(b64: string): Uint16Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Uint16Array(bytes.buffer);
}

/** Row-major Höhen-Samples; Welt-Höhe = HEIGHT_MIN + (v/65535) · HEIGHT_RANGE. */
export const heightGrid: Uint16Array = decode(DATA);
`;
writeFileSync(join(ROOT, 'src', 'renderer', 'three', 'worldHeight.gen.ts'), heightTs);
console.log('— geschrieben: src/renderer/three/worldHeight.gen.ts');

// 8b2. Renderer-Masken derselben Bake-Quelle (Wasserklasse + Ozeandistanz).
const waterMask = new Uint8Array(SIZE);
const coastDistance = new Uint8Array(SIZE);
const oceanDepth = new Uint8Array(SIZE);
for (let o = 0; o < SIZE; o++) {
  if (oceanMask[o]) waterMask[o] = 1;
  else if (terrain[o] === T.river) waterMask[o] = 3;
  else if (isWaterCand[o]) waterMask[o] = 2;
  coastDistance[o] = Math.min(255, distToOcean[o]);
  oceanDepth[o] = Math.min(255, Math.max(0, distToLand[o]));
}
const masksTs = `// AUTO-GENERIERT von tools/bakeWorld.mjs — NICHT von Hand editieren.
// Wasser: 0 Land, 1 Ozean, 2 See, 3 Fluss. Ufer: siehe shoreTypeGrid.
/* eslint-disable */

export const WORLD_MASK_TILES = ${WORLD_TILES};
const WATER_DATA = ${toBase64Lines(waterMask)};
const COAST_DATA = ${toBase64Lines(coastDistance)};
const DEPTH_DATA = ${toBase64Lines(oceanDepth)};
const SHORE_DATA = ${toBase64Lines(shoreTypeGrid)};
const WATERFRONT_DATA = ${toBase64Lines(waterfrontBuildableMask)};

function decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const waterMaskGrid = decode(WATER_DATA);
export const coastDistanceGrid = decode(COAST_DATA);
export const oceanDepthGrid = decode(DEPTH_DATA);
export const shoreTypeGrid = decode(SHORE_DATA);
export const waterfrontBuildableGrid = decode(WATERFRONT_DATA);
`;
writeFileSync(join(ROOT, 'src', 'renderer', 'three', 'worldMasks.gen.ts'), masksTs);
console.log('— geschrieben: src/renderer/three/worldMasks.gen.ts');

// 8c. Vorschau-PNG (Hypsometrie + Biomfarben).
{
  const S = WORLD_TILES;
  const px = Buffer.alloc(S * S * 3);
  const COLORS = {
    [T.water]: [26, 62, 110], [T.river]: [58, 118, 170], [T.sand]: [214, 202, 150],
    [T.fertile]: [116, 154, 62], [T.grass]: [96, 152, 76], [T.forest]: [44, 98, 52], [T.mountain]: [138, 132, 126],
  };
  for (let ty = 0; ty < S; ty++) {
    for (let tx = 0; tx < S; tx++) {
      const t = terrain[ty * S + tx];
      let [r, g, b] = COLORS[t];
      const shoreType = shoreTypeGrid[ty * S + tx];
      if (shoreType === 1) [r, g, b] = [214, 189, 119];
      else if (shoreType === 2) [r, g, b] = [102, 158, 103];
      else if (shoreType === 3) [r, g, b] = [122, 169, 125];
      else if (shoreType === 4) [r, g, b] = [104, 101, 97];
      const h = tileH(tx, ty);
      if (t === T.mountain && h > 36) { r = 235; g = 238; b = 244; } // nur höchste Schneegipfel
      const shade = Math.max(-0.18, Math.min(0.18, (tileH(tx, ty) - tileH(Math.max(0, tx - 1), Math.max(0, ty - 1))) * 0.35));
      // Regionsgrenzen sichtbar machen (dunkle Linie), zur Kontrolle der Segmentierung.
      let borderMul = 1;
      const rid = regionGrid[ty * S + tx];
      if (rid !== 0) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const nx2 = tx + dx, ny2 = ty + dy;
          if (nx2 >= S || ny2 >= S) continue;
          const nrid = regionGrid[ny2 * S + nx2];
          if (nrid !== 0 && nrid !== rid) { borderMul = 0.45; break; }
        }
      }
      px[(ty * S + tx) * 3] = Math.max(0, Math.min(255, r * (1 + shade) * borderMul));
      px[(ty * S + tx) * 3 + 1] = Math.max(0, Math.min(255, g * (1 + shade) * borderMul));
      px[(ty * S + tx) * 3 + 2] = Math.max(0, Math.min(255, b * (1 + shade) * borderMul));
    }
  }
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return c ^ 0xffffffff; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const raw = Buffer.alloc((S * 3 + 1) * S);
  for (let y = 0; y < S; y++) { raw[y * (S * 3 + 1)] = 0; px.copy(raw, y * (S * 3 + 1) + 1, y * S * 3, (y + 1) * S * 3); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 2;
  const mapPng = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(join(ROOT, 'tools', 'bake-preview.png'), mapPng);
  for (const relativePath of [
    ['src', 'assets', 'ui', 'map', 'new_island_overview.png'],
    ['src', 'assets', 'ui', 'minimap', 'new_island_minimap.png'],
    ['src', 'assets', 'ui', 'citywork', 'map', 'new_island_planning.png'],
  ]) {
    const output = join(ROOT, ...relativePath);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, mapPng);
  }
  console.log('— geschrieben: tools/bake-preview.png');

  // 8c-bis. § World Overhaul 12.0 — REGIONSKARTE als zweite Kontrollausgabe.
  // Die Hypsometrie zeigt die Landschaft, nicht die Regionsstruktur. Für
  // `regions.config.ts` (Namen, Progression, Nachbarschaft) und die Region-Doku
  // braucht es eine Karte, auf der die Regionen unterscheidbar und beschriftet
  // sind. Reine Diagnose-/Doku-Ausgabe; nichts davon wird zur Laufzeit geladen.
  const REGION_COLORS = [
    [206, 92, 92], [92, 154, 206], [214, 176, 84], [126, 186, 108], [176, 118, 196],
    [96, 190, 178], [222, 138, 92], [140, 150, 214], [186, 200, 96], [206, 118, 164],
    [110, 168, 132], [178, 132, 96], [128, 196, 214], [162, 162, 162],
  ];
  // 3×5-Pixelfont, nur Ziffern — genug für die Region-Ids im Bild.
  const DIGITS = [
    '111101101101111', '010010010010010', '111001111100111', '111001111001111', '101101111001001',
    '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111',
  ];
  const rpx = Buffer.alloc(S * S * 3);
  for (let ty = 0; ty < S; ty++) {
    for (let tx = 0; tx < S; tx++) {
      const o = ty * S + tx;
      const rid = regionGrid[o];
      let color;
      if (rid === 0) color = isWaterCand[o] ? [22, 52, 96] : [60, 66, 72];
      else {
        const base = REGION_COLORS[(rid - 1) % REGION_COLORS.length];
        // Bebaubares Land satt, unbebaubares Land derselben Region blass —
        // dadurch ist auf einen Blick sichtbar, was eine Region wirklich hergibt.
        const mul = buildableMask[o] ? 1 : 0.52;
        color = [base[0] * mul, base[1] * mul, base[2] * mul];
        if (isWaterCand[o]) color = [base[0] * 0.32 + 22, base[1] * 0.32 + 52, base[2] * 0.32 + 96];
      }
      rpx[o * 3] = color[0]; rpx[o * 3 + 1] = color[1]; rpx[o * 3 + 2] = color[2];
    }
  }
  const stamp = (text, atX, atY, color) => {
    let cursor = atX;
    for (const char of text) {
      const glyph = DIGITS[Number(char)];
      if (glyph) {
        for (let gy = 0; gy < 5; gy++) {
          for (let gx = 0; gx < 3; gx++) {
            if (glyph[gy * 3 + gx] !== '1') continue;
            for (let sy = 0; sy < 2; sy++) {
              for (let sx = 0; sx < 2; sx++) {
                const px2 = cursor + gx * 2 + sx, py2 = atY + gy * 2 + sy;
                if (px2 < 0 || py2 < 0 || px2 >= S || py2 >= S) continue;
                const o = py2 * S + px2;
                rpx[o * 3] = color[0]; rpx[o * 3 + 1] = color[1]; rpx[o * 3 + 2] = color[2];
              }
            }
          }
        }
      }
      cursor += 8;
    }
  };
  for (const region of regions) stamp(String(region.id), region.centroid.x - 4, region.centroid.y - 5, [16, 16, 16]);
  // Rathaus als weißes 5×5-Quadrat mit schwarzem Rand.
  for (let dy = -1; dy <= 5; dy++) {
    for (let dx = -1; dx <= 5; dx++) {
      const px2 = townHall.x + dx, py2 = townHall.y + dy;
      if (px2 < 0 || py2 < 0 || px2 >= S || py2 >= S) continue;
      const edge = dx < 0 || dy < 0 || dx > 4 || dy > 4;
      const o = py2 * S + px2;
      rpx[o * 3] = edge ? 0 : 255; rpx[o * 3 + 1] = edge ? 0 : 255; rpx[o * 3 + 2] = edge ? 0 : 255;
    }
  }
  const rraw = Buffer.alloc((S * 3 + 1) * S);
  for (let y = 0; y < S; y++) { rraw[y * (S * 3 + 1)] = 0; rpx.copy(rraw, y * (S * 3 + 1) + 1, y * S * 3, (y + 1) * S * 3); }
  writeFileSync(join(ROOT, 'tools', 'bake-regions.png'), Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(rraw)), chunk('IEND', Buffer.alloc(0)),
  ]));
  console.log('— geschrieben: tools/bake-regions.png');
}

// 8d. Report.
{
  const counts = new Array(T_NAMES.length).fill(0);
  for (const t of terrain) counts[t]++;
  const total = terrain.length;
  const totalBuildable = regions.reduce((sum, region) => sum + region.buildable, 0);
  const buildableRatio = totalBuildable / BASELINE_BUILDABLE_TILES;
  const shoreCounts = [0, 0, 0, 0, 0];
  for (const value of shoreTypeGrid) shoreCounts[value]++;
  const waterfrontBuildable = waterfrontBuildableMask.reduce((sum, value) => sum + value, 0);
  const rows = regions
    .map((r) => `| ${r.id} | ${r.dominant} | ${r.tiles} | ${r.buildable} | ${r.coastTiles} | (${r.centroid.x},${r.centroid.y}) | ${r.adjacent.join(', ')} |`)
    .join('\n');
  const candidateRows = startAreaCandidates.slice(0, 10)
    .map((candidate, index) => `| ${index + 1} | ${candidate.regionId} | (${candidate.center.x},${candidate.center.y}) | ${candidate.buildableTiles} | ${candidate.earlyBuildable} | ${candidate.centralityScore.toFixed(3)} | ${candidate.flatnessScore.toFixed(3)} | ${candidate.expansionDirectionScore.toFixed(3)} | ${candidate.resourceAccessScore.toFixed(3)} | ${candidate.infrastructureScore.toFixed(3)} | ${candidate.waterRisk.toFixed(3)} | ${candidate.cliffRisk.toFixed(3)} | ${candidate.totalScore.toFixed(2)} |`)
    .join('\n');
  const report = `# Bake-Report — § World Overhaul 12.0 (neue Insel)

> **Auto-generiert** von \`tools/bakeWorld.mjs\`. Nicht von Hand editieren.

## Eckdaten

- Quelle: \`${SOURCE_LABEL}\` (${triCount.toLocaleString('de-DE')} Dreiecke gerastert)
- Source-SHA-256: \`${SOURCE_SHA256}\`
- Welt: ${WORLD_TILES}×${WORLD_TILES} Kacheln, ${regions.length} organische Regionen (+ Ozean)
- Horizontale Quellspannweite: ${WORLD_TILES - OCEAN_MARGIN_TILES * 2} statt ${WORLD_TILES - PREVIOUS_OCEAN_MARGIN_TILES * 2} Kacheln; Faktor ${((WORLD_TILES - OCEAN_MARGIN_TILES * 2) / (WORLD_TILES - PREVIOUS_OCEAN_MARGIN_TILES * 2)).toFixed(4)} (Fläche ≈ ${Math.pow((WORLD_TILES - OCEAN_MARGIN_TILES * 2) / (WORLD_TILES - PREVIOUS_OCEAN_MARGIN_TILES * 2), 2).toFixed(4)})
- Ozeanrand: ${OCEAN_MARGIN_TILES} Kacheln; separate Y-Skalierung: Gipfel ≈ ${PEAK_WORLD_HEIGHT} Welt-Einheiten
- Wasserlinie (normalisiert): ${PREVIOUS_WATERLINE_N} → ${WATERLINE_N}; Höhenbereich Welt: [${hMin.toFixed(2)}, ${hMax.toFixed(2)}]
- Bebaubare Kacheln: ${BASELINE_BUILDABLE_TILES.toLocaleString('de-DE')} → ${totalBuildable.toLocaleString('de-DE')} (${(buildableRatio * 100).toFixed(1)} %, Änderung ${((buildableRatio - 1) * 100).toFixed(1)} %)
- Geländebearbeitung: ${RAW_TERRAIN_FIDELITY
  ? `**keine** (§ Modelltreue 13.0 — die GLB IST das Gelände)`
  : `Terraforming ${TERRAFORM_ROUNDS} Runden × ${TERRAFORM_ITERATIONS} Iterationen, Hang-Tor ${TERRAFORM_SLOPE_GATE}, Massiv > ${MOUNTAIN_HEIGHT} ausgenommen; Glättung ${SMOOTH_ITERATIONS} Iterationen, max. Schritt ${MAX_BUILDABLE_STEP}/Sample`}
- **Modelltreue: ${modelFidelity.changedNodes.toLocaleString('de-DE')} von ${modelFidelity.landNodes.toLocaleString('de-DE')} Landknoten verändert** (${(100 * modelFidelity.changedShare).toFixed(1)} %), Ø |Δ| ${modelFidelity.meanAbsDelta} m, max ${modelFidelity.maxAbsDelta} m; Ø Landhöhe Modell ${modelFidelity.meanModelHeight} m → Welt ${modelFidelity.meanWorldHeight} m
- Bebaubar-Hang ≤ ${FLAT_MAX_BUILDABLE_TILE_SLOPE}, mindestens ${FLAT_MIN_ORTHOGONAL_BUILDABLE} orthogonale Nachbarn
- Gebirge: ab Höhe ${MOUNTAIN_HEIGHT}, ODER Hang ≥ ${MOUNTAIN_SLOPE} oberhalb Höhe ${MOUNTAIN_SLOPE_MIN_HEIGHT}
- Regions-Parameter: Ziel ~${REGION_TARGET_TILES} Kacheln, min. ${REGION_MIN_TILES} (sonst Merge), Kosten fremdes Biom +${COST_FOREIGN_BIOME} / Fluss +${COST_CROSS_RIVER} / Höhe ×${COST_HEIGHT_FACTOR}
- Infrastruktur-Hooks: ${bridgeCandidates.length} Brücken, ${elevatedRoadCandidates.length} Viadukte, ${tunnelCandidates.length} Tunnel, ${harborCandidates.length} Häfen, ${waterRouteNodes.length} Wasserwegknoten

## Biomverteilung

${T_NAMES.map((n, i) => `- ${n}: ${counts[i].toLocaleString('de-DE')} (${(100 * counts[i] / total).toFixed(1)} %)`).join('\n')}

## Wasser und Ufer

- Flache Meeresküste: ${shoreCounts[1].toLocaleString('de-DE')} Kacheln
- Sanftes Flussufer: ${shoreCounts[2].toLocaleString('de-DE')} Kacheln
- Sanftes Seeufer: ${shoreCounts[3].toLocaleString('de-DE')} Kacheln
- Bewusste Steilküste: ${shoreCounts[4].toLocaleString('de-DE')} Kacheln
- Inselweit mögliche 2×2-Anlegerplätze: ${islandHarbourPads.toLocaleString('de-DE')}
- Direkt wassernahe und bebaubare Uferkacheln: ${waterfrontBuildable.toLocaleString('de-DE')}
- Garantierte 5×5-Uferplattformen: ${waterfrontAprons.length}
- § 12.2 Geländenadeln („Klippen-Zacken") entfernt: ${needlesRepaired}; verbleibend: **${terrainNeedleCount}**
- § 12.2 Klippen-Plateaus: ${cliffPlateaus.plateaus} Abschnitte, ${cliffPlateaus.plateauTiles} Kacheln eingeebnet
- § 12.2 Steilküste nur mit echtem Relief: Hinterland ≥ ${CLIFF_ZONE_MIN_RELIEF} m im Umkreis ${CLIFF_ZONE_RELIEF_RADIUS}

## Zentraler Start (vom Bake gewählt und validiert)

- Mathematischer Bounding-Box-Mittelpunkt: (${WORLD_TILES / 2},${WORLD_TILES / 2})
- Flächenschwerpunkt der größten zusammenhängenden Landmasse: (${islandCenter.x.toFixed(2)},${islandCenter.y.toFixed(2)})
- **Startregion: ${startRegion.id}** (${startRegion.dominant}) — ${startRegion.buildable.toLocaleString('de-DE')} bebaubare Kacheln (Ziel ${MIN_START_BUILDABLE}–${MAX_START_BUILDABLE})
- **Rathaus: (${townHall.x},${townHall.y})**, Gründungsmittelpunkt (${centralFoundingPoint.x},${centralFoundingPoint.y}), ΔH=${townHall.flatDelta.toFixed(2)}
- Frühe Fläche mit den nächsten Nachbarn: ${townHall.earlyBuildable.toLocaleString('de-DE')} Kacheln (Ziel ${MIN_EARLY_BUILDABLE.toLocaleString('de-DE')}–${MAX_EARLY_BUILDABLE.toLocaleString('de-DE')})
- Score: Gesamt ${townHall.totalScore.toFixed(2)} · Zentralität ${townHall.centralityScore.toFixed(3)} · Flachheit ${townHall.flatnessScore.toFixed(3)} · Expansion ${townHall.expansionDirectionScore.toFixed(3)} · Ressourcen ${townHall.resourceAccessScore.toFixed(3)} · Infrastruktur ${townHall.infrastructureScore.toFixed(3)} · Wasser-/Klippenrisiko ${townHall.waterRisk.toFixed(3)}/${townHall.cliffRisk.toFixed(3)}
- Küstenankunft: (${coastalArrivalPoint.x},${coastalArrivalPoint.y}); vorbereitete Versorgungstrasse ${initialSupplyRoute.length - 1} Kacheln bis zur südlichen Rathausachse
- Startstraßen: ${startRoads.length} Kacheln auf zwei verlängerbaren Hauptachsen
- TODO(CLAUDE_LOGIC): Arrival tutorial and founding journey

### Top-10-Startflächen

| Rang | Region | Mittelpunkt | Direkt bebaubar | Früh gesamt | Zentral | Flach | Richtungen | Ressourcen | Infrastruktur | Wasser-Risiko | Klippen-Risiko | Gesamt |
| ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${candidateRows}

## Regionen (Grundlage für regions.config.ts)

| Id | Dominant | Kacheln | Bebaubar | Küstenkante | Zentrum | Nachbarn |
| --- | --- | --- | --- | --- | --- | --- |
${rows}
`;
  writeFileSync(join(ROOT, 'tools', 'bake-report.md'), report);
  console.log('— geschrieben: tools/bake-report.md');
}

console.log('\nFERTIG. %d Regionen, Startregion %d, Rathaus (%d,%d), %s bebaubar in der Startregion.',
  regions.length, startRegion.id, townHall.x, townHall.y, startRegion.buildable.toLocaleString('de-DE'));
