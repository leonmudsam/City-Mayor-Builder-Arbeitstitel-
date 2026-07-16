# 3D-Welt-Assets — Zielbild, Stilstandard, Konzepte (v0.40 — World Graphics V2)

Diese Datei ist die **verbindliche Bauanleitung** für die 3D-Welt in Richtung des
Referenzbildes: eine hochwertige, stilisierte Küsten-/Insel-City-Builder-Welt mit
Gebirge, Wald, Fluss, See, Küste, Meer, Stadtzentrum, Wohnvierteln, Feldern,
Straßen, Brücken, Ressourcenorten und Landmarken — organisch statt „Kachelbrett".

**Kernprinzip (Drop-in):** Du legst ein korrekt benanntes `.glb` in den passenden
Ordner unter `src/assets/models/…` → das Spiel nutzt es **automatisch** (rekursive
Erkennung, v0.32+). Fehlt ein Modell, greift ein **prozeduraler Platzhalter** — das
Spiel bricht nie. **Kein Code-Change pro Modell.**

> **v0.40-Umbau:** Die früher hier von Hand gepflegten Modell-Einzellisten (§7–§18
> der alten Fassung) sind entfallen. Jedes Modell — aktuell verdrahtet **und**
> geplant — steht jetzt vollständig spezifiziert (Footprint, Höhe, Pivot, Budget,
> Platzierung, Biom, Animationen …) in `src/assets/models/<ordner>/PROMPTS.md`,
> generiert aus `src/assets/modelManifest.ts`. Das verhindert, dass diese Datei und
> der Code auseinanderlaufen. Hier bleibt nur, was sich **nicht** automatisch
> generieren lässt: Zielbild, Stilphilosophie, Ordnerstruktur, Fallback-Regeln und
> die Konzepte für die noch ausstehenden Rendering-/Gameplay-Phasen.

Ergänzt `docs/3D_MODEL_MANIFEST.md` (kurzer Namens-Index, testgeprüft) und
`docs/ISO_ASSETS.md`. Gameplay-Grid und Savegames bleiben unberührt — die Optik
darf organischer wirken als die darunterliegende Logik (siehe §8).

---

## 1. Referenzbild — Analyse & Zonen

Das Referenzbild zeigt eine zusammenhängende Landzunge/Insel mit klaren Zonen:

- **West / Links:** massives Gebirge mit steilen Felswänden, Tälern/Durchgängen,
  **Minen-/Tunneleingängen**, **Wasserfällen**, Flussquelle, dichtem Wald,
  Steinbruch/Ressourcenensemble (Hero-Gebirge).
- **Mitte:** **Stadtzentrum** mit Rathaus/Monument (Uhrturm) als Fokus, dichter
  werdende Wohnviertel (rote Dächer), **Marktbereich** (Markt-Marker), öffentliche
  Gebäude (Museum/Verwaltung), **Straßenraster mit Haupt- und Nebenachsen**,
  Plätze/Grünflächen, **freie Build-Zonen mit grün gestrichelten Rahmen + Werkzeug-
  Marker**.
- **Nord / Oben:** fruchtbare **Felder/Farmregion** (Weizen-Marker), Flusslauf mit
  **Brücke**, Waldübergänge.
- **Ost / Rechts:** felsige **Küste** und **Meer**, **Leuchtturm** auf Klippe,
  **Hafen/Schiff**, Küstenstraße, Strand-/Uferzonen.
- **Süd / Unten:** großer **See/Baggersee** (Wasser-Marker) mit Ufer/Strand, Wald,
  weitere Bauflächen, kleines Dock.
- **Gameplay-Symbole:** grüne Bau-/Werkzeugmarker auf freien Sektoren, blauer
  Wasser-Marker am See, oranger Handels-/Marktmarker, Verwaltungs-Marker.

**Zonenkonzept:** West/Mitte/Nord/Ost/Süd sollen **handdesignt oder halb-
handdesignt** definierbar sein, nicht rein zufällig — die Stadt gründet sich immer
auf der größten zusammenhängenden Ebene, das Gebirge/die Küste/der Wald bilden
außen herum die natürliche Landschaft (§8).

**Sofort nötig (Prio 1):** Terrain-Grundkacheln (Gras/Fels/Sand/Wasser),
Straßensegmente, Häuser (klein/Reihe), Rathaus, Farm, Sägewerk, Steinbruch,
Bäume/Felsen, Basis-Marker. **Später sinnvoll (Prio 2):** Hero-Gebirge, Wasserfall,
Hafen, Leuchtturm, Brücken, Damm, große Plätze, Fahrzeuge, Ambient-Effekte.

**Prozedural vs. eigenes `.glb`:** Terrain-Kacheln, Straßen, einfache Marker,
Bäume/Büsche und Ambient-Effekte kann der Renderer prozedural/als Instanzen
ersetzen (tut er schon). **Als `.glb` lohnen sich** alle markanten Silhouetten:
Gebäude, Landmarken, Hero-Terrain, Brücken, Schiffe, große Props.

---

## 2. Einheitlicher Modellstandard

**Stil:** Low-Poly / stylized City-Builder, cartoonartig, farbenfroh, saubere
Silhouetten, weiche Kanten, warme Lichtwirkung — konsistent mit UI/Gebäudegrafik
und dem Referenzbild. Keine realistische, dunkle Simulation, keine High-Poly-Details.

**Technik (Pflicht):**
- Format **`.glb`**, Texturen **eingebettet**, keine externen Dateien.
- **Keine** Kameras, **keine** Lichter im Modell.
- **+Y = oben**, Vorderseite **+Z**.
- **Pivot mittig an der Unterkante** (X/Z zentriert, Unterkante Y = 0) — der Boden
  ist seit v0.39 ein organisches Höhenfeld, jedes Modell wird automatisch auf die
  Bodenhöhe an seiner Kachel gesetzt. Nichts darf schweben.
- **1 Tile ≈ 4 m**; Modell auf seinen Footprint skalierbar.
- Saubere Bounding-Box, keine großen Offsets, Ursprung korrekt.
- Dateiname **exakt** wie in der generierten `PROMPTS.md` (Kleinbuchstaben, `_`),
  **eindeutig** (der Dateiname ist der Key, auch über Unterordner hinweg).

**Größenklassen (Budget):** siehe `SIZE_CLASS_BUDGETS` in
`src/assets/modelManifest.ts` bzw. die generierte Spec-Zeile jedes Modells in
`PROMPTS.md`. Kurzfassung:

| Größenklasse | Tris | Textur |
|---|---|---|
| Prop (klein) | < 500 | ≤ 256² |
| Prop (groß/Setpiece) | 500–1 500 | ≤ 512² |
| Fahrzeug | 500–1 200 | ≤ 512² |
| Marker/Welt-UI | < 200 | ≤ 128² (oder Canvas) |
| Effekt-Mesh | < 300 | ≤ 128² |
| Terrain-/Straßen-Kachel | 200–800 | ≤ 512² |
| Terrain-Feature | 800–3 000 | ≤ 512² |
| Brücke | 1 500–4 000 | ≤ 512² |
| kleines Gebäude | 500–2 000 | ≤ 512² |
| großes Gebäude | 2 000–6 000 | ≤ 1024² |
| Landmarke | 6 000–12 000 | ≤ 1024² |
| Hero-/Weltform | so niedrig wie möglich, modular | ≤ 1024², geteilt |

**LOD/Instancing:** Für Bäume/Felsen/kleine Props/Terrain-Kacheln nutzt der
Renderer **Instancing** (bereits umgesetzt, siehe `instancing`-Feld je Modell in
`PROMPTS.md`). Große Hero-/Landmarken-Modelle bitte **modular** liefern statt als
ein Monolith; Culling außerhalb der Kamera ist vorbereitet.

---

## 3. Ordnerstruktur (existiert, Drop-in-fähig)

```
src/assets/models/
  buildings/{housing,administration,economy,services,resources,energy,leisure,landmarks}/
  terrain/{tiles,cliffs,mountains,water,coast,biome,hero}/
  roads/
  bridges/
  props/{nature,city,construction,harbor,farm,infrastructure}/
  vehicles/
  markers/
  effects/
  ui/
```

Die Erkennung ist **rekursiv**: eine `.glb` in *irgendeinem* Unterordner der
Kategorie wird gefunden (Key = Dateiname). Unterordner sind zur Ordnung da, nicht
für den Key. → Dateinamen projektweit **eindeutig** halten.

`props/infrastructure/` ist neu (v0.40): Stützmauern/Böschungen, die Straßen bei
Höhenunterschieden am Schweben hindern (§9).

**Straßen-/Brücken-Texturen (v0.44, Straßen als Textur):** `roads/`/`bridges/`
oben nehmen seit v0.44 **kein** `.glb` mehr an — die Texturen liegen stattdessen
unter `src/assets/textures/roads/{surface,markings,crossings}/`, vollständige
Spezifikation + Prompts: **`docs/ROAD_TEXTURES.md`** (§9).

**Terrain-Materialtexturen (v0.42, Terrain System V2):** separat von den `.glb`-
Ordnern oben liegen die Splatmap-Bodentexturen unter
`src/assets/textures/terrain/{grass,earth,stone,sand,snow,water,field,path}/` —
vollständige Spezifikation + Prompts je Textur: **`docs/TERRAIN_TEXTURES.md`**.
Ersetzt künftig viele der kleinteiligen Terrain-`.glb`s (einzelne Grasbüschel,
kleine Felsen) durch eine gemischte Bodenoberfläche; 3D-Modelle bleiben für
große, prägende Elemente (§7 Tabelle).

**Registry-Funktionen (schon vorhanden):** `buildingModel(id, stage)`,
`terrainModel(name)`, `roadModel(name)`, `bridgeModel(name)`, `propModel(name)`,
`vehicleModel(name)`, `markerModel(name)`, `effectModel(name)`, `uiModel(name)`.

---

## 4. Modell-Registry pro Asset (`BuildingDef.visual`)

Jedes Gebäude kann mehrere Visual-Varianten referenzieren (alle optional):

```ts
visual: {
  cardArt?: string;        // Baumenü-Bild (2D)
  sheetArt?: string;       // Detail-Sheet-Bild (2D)
  mapSprite2d?: string;    // 2D-Karten-Sprite
  isoPreview?: string;     // Iso-Sprite
  model3d?: string;        // explizite .glb (überschreibt id-Lookup)
  model3dLod?: string;     // Low-Poly-LOD
  fallbackModel?: string;  // Ersatzmodell, falls Hauptmodell fehlt
  scale?: number;          // Feinskalierung nach Auto-Fit
  rotationOffset?: number; // Y-Rotation (rad), Front-Korrektur
  footprintVisualOffset?: { x: number; y: number; z: number };
  sizeClass?: 'flat'|'low'|'medium'|'high'|'landmark'|'hero';
  heightClass?: number;    // Platzhalter-Höhe (prozedural)
  stages?: BuildingVisual[]; // je Ausbaustufe
}
```

**Auflösungsreihenfolge (Karte, 3D):** `visual.model3d` → `buildings/<id>.glb`
(bzw. `<id>_stage<N>.glb`) → `visual.fallbackModel` → **prozeduraler Block**.
`scale`/`rotationOffset`/`footprintVisualOffset` werden vom Renderer angewandt.

**Für Terrain/Props (geplantes `worldVisual`, dokumentiert):**

```ts
worldVisual: {
  model3d?: string; fallbackModel?: string;
  biome?: string; variant?: string;
  scale?: number; randomRotation?: boolean; randomScale?: boolean;
  clusterType?: 'single' | 'patch' | 'strip' | 'hero';
}
```

Heute erzeugt der Renderer Terrain/Vegetation prozedural mit Instancing +
Zufallsrotation/-skalierung; `worldVisual` ist die dokumentierte Erweiterung, um
diese durch `.glb` zu ersetzen (Folge-Slice, kein Migrationsbedarf).

---

## 5. Fallback-Regeln

| Typ | Fallback, wenn Modell fehlt |
|---|---|
| Gebäude | prozeduraler Block (Wände + Dach, Kategorie-Farbe, Stufenhöhe) |
| Terrain | farbige, leicht reliefierte Kachel (Instancing) auf dem Höhenfeld |
| Wasser | blaue, tiefergelegte Kachel |
| Straße | texturierte Fahrbahn/Randstreifen, nie ein `.glb` (§ Straßen als Textur, `docs/ROAD_TEXTURES.md`) |
| Brücke/Steg | texturiertes Deck über der Wasserkachel, nie ein `.glb` |
| Prop (Baum/Busch/Fels) | Low-Poly-Instanz (Kegel/Zylinder) |
| Fahrzeug | geformtes Auto/Van-Mesh |
| Marker | farbcodiertes Billboard (Canvas-Textur) |
| Effekt (Partikel/Shader) | läuft bereits ohne `.glb` — kein Fallback nötig |
| Hero-/Landmarken-Asset | Cluster kleinerer prozeduraler Teile / mehrere Standardkacheln |

Fallbacks bleiben **spielbar**, wirken aber klar als Platzhalter.

---

## 6. Stil-Prefix für alle Prompts

> `Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean
> shapes, soft bevels, hand-painted feel, optimized for realtime rendering,
> embedded textures, no lights, no cameras, centered object, pivot at bottom
> center, +Y up, front facing +Z —`

Für Text-zu-3D-Tools (Meshy, Rodin, Tripo, Luma, Alpha3D): Prefix + Motiv (siehe
generierte `PROMPTS.md` je Ordner), als `.glb` exportieren, Dateiname exakt wie
dort angegeben, in den Zielordner legen.

---

## 7. Vollständige Modell-Spezifikation je Ordner (generiert)

Statt Handlisten hier: **jedes** Modell — Terrain, Gebirge, Wasser, Küste,
Straßen, Brücken, Props, Fahrzeuge, Marker, Effekte, Welt-UI, Gebäude, Landmarken
— ist mit vollem Feldset (Footprint, Höhe, Pivot, Front, Größenklasse/Budget,
Platzierungsregeln, Biom, Zufallsverhalten, Instancing, Animations-/Effekt-Nodes,
Live-/Geplant-Status) in genau einer Datei erfasst:

| Ordner | Vollständige Spezifikation |
|---|---|
| `buildings/` | `src/assets/models/buildings/PROMPTS.md` (+ `README.md` für die reine Namensliste) |
| `terrain/` (Kacheln, Gebirge, Flüsse, Küste, Hero-Weltformen) | `src/assets/models/terrain/PROMPTS.md` |
| `props/` (Natur, Stadt, Hafen, Farm, Infrastruktur) | `src/assets/models/props/PROMPTS.md` |
| `vehicles/` | `src/assets/models/vehicles/PROMPTS.md` |
| `markers/` (inkl. Sektor-Nebel & Bürgerhinweise) | `src/assets/models/markers/PROMPTS.md` |
| `effects/` (inkl. Ambient-Leben) | `src/assets/models/effects/PROMPTS.md` |
| `ui/` | `src/assets/models/ui/PROMPTS.md` |

Diese Dateien sind **auto-generiert aus `src/assets/modelManifest.ts`** und werden
von `tests/modelReadmes.test.ts` gegen Drift geprüft — sie sind die einzige
Quelle, die nie veraltet sein kann. Neues Modell (auch nur geplant, noch nicht
gebaut) hinzufügen: Eintrag in `modelManifest.ts` ergänzen, dann
`WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`.

**Boden-/Material-Texturen** (kein `.glb`, sondern flächige Splatmap-Texturen fürs
Terrain) sind separat dokumentiert: **`docs/TERRAIN_TEXTURES.md`**, generiert aus
`src/assets/terrainTextureManifest.ts` (`tests/terrainTextures.test.ts` hält sie
synchron) — siehe §3.

**Straßen-/Brücken-Texturen** (§ Straßen als Textur, v0.44): `roads/`/`bridges/`
laden seit v0.44 kein `.glb` mehr, siehe stattdessen **`docs/ROAD_TEXTURES.md`**,
generiert aus `src/assets/roadTextureManifest.ts`
(`tests/roadTextures.test.ts` hält sie synchron) — siehe §9.

**Was dort für jedes Modell steht:**
- **Allgemein:** Dateiname, Zielordner, Kategorie, Motiv-Prompt, Live-/Geplant-Status.
- **Modellierung:** Footprint, empfohlene Höhe, Größenklasse (→ Tri-/Textur-/
  Material-Budget), Pivot, Front, Stilvorgabe (Stil-Prefix).
- **Platzierung:** worauf platzierbar/nie platzierbar, Mindestabstand,
  Zufallsrotation/-skalierung, Instancing-Eignung, Cluster-/Spawn-Regel.
- **Weltlogik:** Biom(e), Animations-Node (`rotor`, …), Effekt-Node/-Anschluss
  (`chimney`, …), ob es sich um ein Partikel/Shader statt `.glb` handelt.

Damit kann jedes Modell unabhängig von anderen von verschiedenen Artists gebaut
werden und passt trotzdem zusammen — die Regeln sind zentral, nicht pro Datei neu
erfunden.

---

## 8. Organische Welt statt Kachelbrett

Die gesamte Karte soll wie eine echte Region wirken, nicht wie ein Spielfeld. Das
Gameplay bleibt **vollständig rasterbasiert** — die Grafik darf das nahezu
vollständig verstecken:

- Terrain soll organisch, natürlich, abwechslungsreich, logisch und physikalisch
  nachvollziehbar wirken. Nirgends soll sichtbar sein, dass darunter nur
  quadratische Tiles liegen.
- **Physikalisch plausibel:** Flüsse entstehen im Gebirge und fließen bergab, Seen
  liegen in Senken, Küsten liegen auf Meereshöhe, Gebirge besitzen Täler, Straßen
  folgen der Landschaft, Brücken entstehen nur über Wasser/Schluchten, Tunnel
  verlaufen durch Berge, Bäume wachsen nicht im Fels, Felder liegen auf
  fruchtbarem Land, Steinbrüche an Felsformationen.
- **Terrain-Daten (dokumentierte Erweiterung, kein Migrationszwang):**
  ```ts
  terrain: { type: TerrainType; biome: BiomeType; height: number;
    slope?: SlopeType; waterDepth?: number; variant?: string; }
  ```
  Das Gameplay-Grid bleibt bestehen; Höhenstufen/Klippen/Flusstiefe/Küsten-
  übergänge/Felsen sind rein optisch, solange Platzierung weiter auf validen
  Tiles passiert.
- **Gesperrte Sektoren** zeigen keine vollständige Sicht: dichter Nebel,
  Silhouetten, gelegentliche Bürgerhinweise wecken Neugier, ohne Informationen
  preiszugeben (Details/Modelle: §11).

> **Umsetzungsstand (v0.46 — MVP3 Phase 1, "Organisches Terrain-Mesh"):** Die
> organische Höhenfeld-Basis (Hügel, geneigtes Gebirge, abgesenktes Wasser) ist
> seit v0.39 live, seit v0.46 mit deutlich mehr Relief
> (`src/renderer/three/terrainHeight.ts`): Gebirge sind terrassiert (5 Absätze
> mit steilen Rissern statt gleichmäßig glatter Rücken), Flüsse/Seen graben ein
> echtes V-förmiges Tal mit Radius-2-Falloff statt eines flachen Einzel-Dips,
> Sandküsten neben Wasser bekommen eine feine Dünen-Welligkeit. Das Boden-Mesh
> (`ThreeMapRenderer.buildGroundMesh`) ist zusätzlich `GROUND_SUBDIV`-fach
> unterteilt (Default 2×), damit diese Formen sichtbar glatt statt facettiert
> wirken — weiterhin ein Draw-Call. Als **Modelle statt reiner Geometrie**
> bleiben aus §7 offen: Gebirgs-Module (`mountain_base/peak/ridge/…`),
> Wald-Patches/Vegetations-Cluster, Küsten-/Hafen-Dekoration — spätere MVP3-
> Phasen. Ebenfalls bewusst **nicht** Teil dieser Phase: lokale
> Terrain-Einebnung unter Gebäuden (Gebäude sitzen weiter an einem
> Höhen-Punkt, kein Footprint-Carving).

---

## 9. Straßen als Textur (v0.44, implementiert)

Straßen/Brücken sind seit v0.44 **komplett texturbasiert** statt `.glb`-Modelle —
siehe `docs/ROAD_TEXTURES.md`/`src/assets/roadTextureManifest.ts` für die
Textur-Spezifikation und `ThreeMapRenderer.buildRoadTile`/`buildBridgeDeck` für
den Code. Straßen dürfen niemals schweben; **aktueller Stand:**

- Die Mask-getriebene Kern+Arme-Geometrie (gerade/Kurve/T/Kreuz/Ende) sitzt flach
  nahe `y≈0` auf `terrainHeightAt()`, gekippt auf den lokalen Höhengradienten +
  kurzer Randschürze (`fitRoadToTerrain`) — kein Rampen-/Terrassen-Modell nötig,
  da es keine erhöhte Platte mehr gibt, die zu überbrücken wäre.
- **Kreisverkehr:** eine 4-Wege-Kreuzung (`mask===15`) bekommt automatisch eine
  runde statt eckige Kern-Geometrie (`road_roundabout`) — keine neue Straßenart.
- **Bergstraße/Pass:** liegt die Kachel auf Gebirgsterrain, wird `road_mountain`
  statt der Asphalt-Textur verwendet — ein Pass ist visuell einfach eine
  Bergstraße am Sattelpunkt, keine eigene Erkennung nötig.
- **Steg vs. Brücke:** die zusammenhängende Wasser-Spannweite entscheidet
  automatisch zwischen einem schmalen, pfeilerlosen Holzsteg (1 Kachel) und
  einer breiteren Brücke mit Geländer/Pfeilern (mehrere Kacheln).
- **Nicht implementiert** (bewusst zurückgestellt, da es echte zusätzliche
  Geometrie bräuchte statt nur Textur): Stützmauern/Böschungen als eigene
  Formen bei sehr großen Höhensprüngen, echte Serpentinen, Tunnel. Die
  Neigungs-Kappung (`MAX_TILT ≈ 20°`) verhindert dafür, dass eine Straße auf
  steilem Gelände sichtbar kippt oder schwebt — sie liest nur flacher, statt
  eine Kehre zu bilden.

---

## 10. Gebäude-Front, Rotation & Platzierungsvorschau (Konzept, noch nicht implementiert)

Jedes Gebäude besitzt konzeptionell eine Vorderseite (**+Z**, siehe §2), eine
Rückseite und Seiten; der Haupteingang zeigt standardmäßig zur Straße. Geplant:

- **Automatischer Straßenanschluss:** zwischen Gebäude und Straße entsteht
  automatisch ein Gehweg/Pflasterweg/Vorplatz — je Gebäudetyp unterschiedlich
  (Wohnhaus → Gehweg, Supermarkt → Parkplatz+Gehweg, Feuerwehr → große Ausfahrt,
  Krankenhaus → Vorfahrt, Industrie → LKW-Zufahrt, Hafen → Hafenstraße).
- **Rotation vor dem Platzieren:** der Spieler soll das Gebäude in 90°-Schritten
  drehen und die Vorderseite/den Eingang bewusst ausrichten können. Betrifft nur
  die Optik — Footprint und Gameplay bleiben identisch.
- **Platzierungsvorschau:** vollständiges 3D-Modell, Schatten, Kollisionsfläche,
  Footprint, Straßenanschluss, Eingang, Geländeanpassung, Steigung,
  Höhenversatz, mögliche Konflikte — ungültige Platzierungen eindeutig markiert.
- **Automatische Geländeanpassung:** Gebäude schweben nie; der Renderer passt
  Fundament/Böschung/Stützmauer/Erdaufschüttung automatisch an.

**Aktueller Code-Stand:** `BuildingInstance` hat heute **kein** Rotationsfeld,
`validatePlacement()` kennt keine Ausrichtung, es gibt keine Straßenanschluss-
Logik. Das ist eine Erweiterung des Platzierungs- und Renderer-Codes (neues
optionales `rotation`-Feld auf der Instanz, kein Schema-Bruch, siehe
`docs/PROJECT_STRATEGY.md` „Saves brechen nie") — eigene, spätere Code-Phase.

---

## 11. Sektor-Nebel, Silhouetten & Bürgerhinweise (Konzept, noch nicht implementiert)

Gesperrte Sektoren sollen den Spieler neugierig machen, ohne Informationen
preiszugeben:

- Dichter Nebel (`locked_sector_fog_veil`) statt einer nur dunkel getönten
  Kachel.
- Schwache Silhouetten großer Landmarken, die im Sektor liegen
  (`landmark_silhouette_hint`) — kein Oberflächendetail, nur Umriss.
- Bürgerhinweise als Sprechblase (`marker_citizen_hint`), z. B. „Dort hinten
  soll es ein großes Gebirge geben.", „Man erzählt sich von fruchtbaren Böden.",
  „Ein Fischer sprach von einer riesigen Bucht.", „Dort könnte Eisen
  vorkommen." — Textinhalt ist Gameplay/i18n, hier nur das Mesh spezifiziert.
- Bei Freischaltung: Highlight/Animation + Kamerafokus.

Alle drei Modelle sind in `src/assets/models/markers/PROMPTS.md` vollständig
spezifiziert. **Aktueller Code-Stand:** `SectorState.status` kennt nur
`locked`/`unlocked`, es gibt keine Hinweistexte, keine Silhouetten-Logik und
keinen Nebel-Mesh — reine Blend-Färbung der Höhenfeld-Vertices. Umsetzung ist
Renderer- + kleine Gameplay-Arbeit (Hinweistext-Pool je Sektor/Biom), eigene
Code-Phase.

---

## 12. Verkehr: Haus → Straße → Ziel (Konzept, noch nicht implementiert)

Heute fährt der Ambient-Verkehr eine zufällige Route über das Straßennetz
(zufälliger Startpunkt, an jeder Kreuzung zufällige Abzweigung). Geplant:

- Fahrzeuge fahren immer Haus → Straße → Ziel, kein Wenden mitten auf
  Kreuzungen, keine Geisterfahrten, keine unnötigen Schleifen.
- Ampeln vorbereiten, später ein Stau-System.

**Wiederverwendbarer Baustein:** Der Missions-Lieferwagen hat bereits echtes
Start→Ziel-Pathing per BFS über den Straßen-Graphen (`roadPath()` in
`ThreeMapRenderer.ts`) — dasselbe Muster lässt sich auf den Ambient-Verkehr
übertragen, statt ein neues System zu bauen (siehe `CLAUDE.md` „Erweitern statt
neu bauen"). Modelle: siehe `vehicles/PROMPTS.md` — unverändert, betrifft nur
Pathing-Logik.

---

## 13. Lebendige Welt & Landmarken

**Lebendige Welt (§10 der ursprünglichen Anfrage):** Vögel, Schmetterlinge, Wind
in Bäumen, Wolkenschatten, Wasserbewegung, Brandung, Rauch, drehende Windräder,
Schiffe, Verkehr — bewusst größtenteils als **Partikel/Shader statt `.glb`**
umgesetzt (siehe `effects/PROMPTS.md`, Gruppe „lebendige Welt"). Bereits live:
Schornsteinrauch, Windrad-Rotor, Verkehr, Missions-Lieferwagen, Tag-/Nacht-Zyklus,
animiertes Wasser.

**Hero-Landmarken:** jede Karte erhält mehrere bewusst platzierte (nicht
zufällige) Landmarken zur Orientierung — Gebirge, Leuchtturm, Wasserfall, Hafen,
Burg, Damm, Schlucht, Monument, große Brücke, Ruinen, Höhlen, Inseln. Vollständig
mit Footprint/Biom/Platzierung in `terrain/PROMPTS.md` (Weltformen) und
`buildings/PROMPTS.md` (Landmarken/Hero-Bauten) spezifiziert.

---

## 14. Visuelle Konsistenz

`cardArt` (Baumenü) · `sheetArt` (Detail) · `model3d` (Karte) · `stages`/
`<id>_stage<N>` (Upgrade-Optik) gehören je Gebäude zusammen: gleiche Form, Farben,
Silhouette — der Spieler erkennt sein Gebäude in UI und Welt wieder, Upgrades
zeigen sichtbare Entwicklung. Dasselbe Prinzip gilt jetzt für **alle** Weltobjekte
(Terrain, Gebirge, Wasser, Küste, Landmarken, Props, Fahrzeuge, Marker, Effekte):
ein einheitlicher stilisierter Cartoon-Low-Poly-Look, dieselbe Farbpalette
(Stil-Prefix, §6), dieselben Proportionsregeln (`SCALE_NOTE` in
`modelManifest.ts`).

---

## 15. Workflow — nur Modelle ablegen

1. Modell als `.glb` erzeugen (Standard aus §2 einhalten, Motiv+Spec aus der
   passenden `PROMPTS.md`).
2. In den dokumentierten Ordner legen, **Dateiname exakt** wie dort angegeben.
3. `npm run build` (oder `npm run dev`).
4. Das Spiel nutzt das Modell automatisch (rekursive Erkennung).
5. Fehlt es, greift der Platzhalter. **Kein Code-Change nötig.**

## 16. Empfohlene Startreihenfolge

1. `house_small`, `house_row`, `town_hall`, `farm`, `sawmill`, `quarry` — die
   häufigsten Gebäude.
2. `grass_tile` (+1–2 Varianten), `road_straight`/`road_cross_intersection`,
   `pine_tree`, `rock_medium` — Grundwelt.
3. Hero: `hero_mountain_range_west`, `waterfall_large`, `lighthouse`,
   `harbor_small`, `bridge_medium_road` — Landmarken/Weltcharakter.
4. Danach schrittweise Rest je Zone (West→Mitte→Nord→Ost→Süd), Reihenfolge je
   Ordner in der jeweiligen `PROMPTS.md` (Gruppe „Aktiv genutzt" vor „Geplant").
