# Map Flattening + Buildability Overhaul (UMGESETZT — v1.11, Save v25)

> **Stand 28.07.2026: Phasen A–E erledigt.** Ergebnis in einer Zeile:
> **Bauplätze für 3×3- und 4×4-Gebäude haben sich ungefähr verdoppelt**, das
> zentrale Massiv ist unangetastet, Regionen/Startregion/Rathaus sind
> **bitgleich** — bestehende Spielstände bleiben gültig.
>
> | Footprint | vorher bebaubar | nachher | |
> | --- | ---: | ---: | ---: |
> | 1×1 | 24.936 (57,9 %) | 37.788 (80,8 %) | +52 % |
> | 2×2 | 19.985 (46,4 %) | 35.197 (75,3 %) | +76 % |
> | 3×3 | 13.874 (32,2 %) | 28.392 (60,7 %) | **+105 %** |
> | 4×4 | 11.184 (26,0 %) | 23.522 (50,3 %) | **+110 %** |
> | 5×5 | 9.419 (21,9 %) | 14.460 (30,9 %) | +54 % |
>
> Weitere Kennzahlen: Bebaubar-Maske 25.161 → **38.126** Kacheln · flaches Ufer
> 1.453 → **2.485** gegen Steilküste 1.937 → **905** (Mehrheit gekippt) ·
> wassernahe bebaubare Uferkacheln 1.210 → **2.242** · Uferplattformen 16 → 44 ·
> Streu-Gebirge unter Höhe 4: 1.647 → **0** · Massiv (≥ 13) und Hochgebirge
> (≥ 25) **unverändert**.



> **Herkunft:** Nutzer-Auftrag „CITY MAYOR BUILDER – MAP FLATTENING + BUILDABILITY
> OVERHAUL", erteilt am 28. Juli 2026. **Leitsatz des Auftrags:**
> „Die Insel soll weiterhin spektakulär aussehen, aber sich endlich wie eine
> wirklich gut spielbare City-Builder-Map anfühlen."
>
> Der Auftrag löst die frühere Notiz [[shore-transition-request]] / R9 („flachere
> Strand-/Wasserübergänge") ab und erweitert sie auf die **ganze** Insel.
> Die Active-Simplicity-Phasen **AS-3…AS-9** sind damit **zurückgestellt** (nicht
> gestrichen) — siehe [`ACTIVE_SIMPLICITY_PLAN.md`](ACTIVE_SIMPLICITY_PLAN.md).

## Leitplanken (verbindlich, aus CLAUDE.md)

- **§2 Erweitern statt neu bauen.** `validatePlacement` bleibt die **einzige**
  Platzierungsinstanz, `analyseRoadPath` die einzige Straßenwahrheit. Sockel,
  Terrassen und Uferplattformen erweitern denselben Pfad (wie es `road?` und
  `buildsOnRock?` schon tun) — **kein zweites Placement-System**.
- **§3 Saves brechen nie.** Ein neuer Bake ⇒ `SCHEMA_VERSION` + lineare Migration.
- **§1 Simulation ≠ Rendering.** Die Sockel-/Pad-Logik lebt in `src/game/**`;
  der Renderer **liest** sie. Kein `three`-Import unter `src/game/**`.
- **§8 Nicht tun (aus dem Auftrag):** Insel nicht komplett einebnen · das zentrale
  Gebirge nicht klein/irrelevant machen · nichts steril-künstlich machen · keine
  schwebenden Gebäude · keine Terrain-Clipping-Fehler · Küsten nicht zerstören.

---

# PHASE A — Audit (erledigt)

## A.1 Wer besitzt was?

| Zuständigkeit | Instanz | Datei |
| --- | --- | --- |
| **Terrain-Geometrie (offline)** | `tools/bakeWorld.mjs` | Höhen-Grid `HW` (1025²), Biom-Klassifikation, Bebaubar-Maske, Uferprofil, Regionen, Infrastruktur-Hooks |
| Sim-Oberfläche je Kachel | `bakedSurfaceAt(x,y)` | [`src/game/config/startRegion.config.ts`](../../src/game/config/startRegion.config.ts) ← `islandBuildability.gen.ts` (512²: `height`, `slope`, Flags, `shoreType`, `waterDepth`) |
| Sim-Terraintyp je Kachel | `terrainAt(x,y)` | dieselbe Datei ← `islandTerrain.gen.ts` |
| Region-Zugehörigkeit | `regionIdAt(x,y)` | dieselbe Datei ← `islandRegions.gen.ts` |
| **Footprint-Abfrage** | `samplePlacementSurface()` | [`src/game/map/world.ts:141`](../../src/game/map/world.ts) |
| **Platzierungs-Wahrheit** | `validatePlacement()` | [`src/game/buildings/placement.ts:44`](../../src/game/buildings/placement.ts) |
| Wasser-/Kai-Footprint | `validateWaterfrontFootprint()` | dieselbe Datei, `:164` |
| Straßen-Passierbarkeit | `tileWeight()` → **ruft `validatePlacement`** | [`src/game/roads/roadRouting.ts:61`](../../src/game/roads/roadRouting.ts) |
| Straßen-Bewertung | `analyseRoadPath()` | [`src/game/roads/roadPlanning.ts`](../../src/game/roads/roadPlanning.ts) |
| **Renderer-Bodenhöhe** | `terrainHeightAt()` | [`src/renderer/three/terrainHeight.ts:69`](../../src/renderer/three/terrainHeight.ts) ← `worldHeight.gen.ts` (1025² Uint16) |
| **Gebäude-Erdung / Sockel** | `buildNode()` | [`ThreeMapRenderer.ts:3588`](../../src/renderer/three/ThreeMapRenderer.ts) |

**Zwei Höhenquellen, eine Bake-Wahrheit:** die Sim liest ein 512²-Kachelraster
(`surfaceHeightGrid`), der Renderer ein 1025²-Knotenraster (`heightGrid`). Beide
werden vom **selben** `HW`-Feld in `bakeWorld.mjs` erzeugt und stimmen deshalb
überein. Jede Terrain-Änderung muss beide Grids neu backen — es gibt keinen Weg,
nur eines zu ändern.

**Gute Nachricht für Phase D:** der Straßen-Router besitzt **keine** eigene
Terrainprüfung. `tileWeight()` delegiert vollständig an `validatePlacement`.
Jede Lockerung in Phase C wirkt automatisch im Router — ohne zweites System (§2).

## A.2 Wo genau die zu strengen Grenzen sitzen

### (1) Der strukturelle Kernfehler: die Glättung kann keine Baufläche *erzeugen*

`bakeWorld.mjs` klassifiziert **zuerst** die Bebaubar-Maske aus dem **rohen**
Hang (`:548-576`) und glättet **danach** ausschließlich Knoten, die schon in der
Maske liegen:

```js
// bakeWorld.mjs:635
if (!nodeBuildable[o]) continue;   // <- Henne-Ei
```

Folge: eine Kachel mit Hang 0,90 fällt aus der Maske → wird nie geglättet →
bleibt für immer bei 0,90. Die 20 Glättungsdurchgänge **vertiefen** nur die
bereits vorhandene Baufläche, sie **verbreitern** sie nie. Das ist die einzige
wichtigste Ursache des Auftrags.

### (2) Harte Schwellen im Bake

| Konstante | Wert | Zeile | Wirkung |
| --- | --- | --- | --- |
| `MAX_BUILDABLE_TILE_SLOPE` | **0.86** | `:105` | Land steiler als 0,86/Kachel ist nie Baufläche |
| 1-Kachel-Erosion | alle **4** orthogonalen Nachbarn müssen bebaubar sein | `:566` | frisst zusätzlich den ganzen Maskenrand |
| `MOUNTAIN_SLOPE` | **1.8** | `:77`, `:524` | Hang **allein** macht eine Kachel zu `mountain` — **unabhängig von der Höhe** |
| Ufer-Zugänglichkeit | `tileH < 3.2 && tileSlope <= 0.9` | `:509` | sonst `shoreType = 4` (Steilküste) |
| `shoreHash(tx,ty) >= 0.24` | | `:405` | **24 % aller 18×18-Küstenzonen** werden absichtlich *nicht* abgeflacht |
| Uferplattformen | max. **16**, Mindestabstand 28 | `:587`, `:614` | zu wenige garantierte 5×5-Hafenflächen |

### (3) Harte Schwellen in der Simulation

[`placement.ts:87-93`](../../src/game/buildings/placement.ts) — der Normalfall:

```ts
} else if (
  surface.buildableRatio < 1 ||   // JEDE Kachel muss das Bebaubar-Bit tragen
  surface.waterOverlap > 0 ||     // ein einziger Wasser-Pixel blockt
  surface.cliffOverlap > 0 ||     // ein einziger Steil-/Gebirgspixel blockt
  heightDelta > 0.85              // ~3,4 m Unterschied über den ganzen Footprint
) return 'terrain';
```

`placement.ts:73`: Bodenstraßen `maxSlope ?? 0.8`, Wasser **und** Klippe hart
gesperrt.

## A.3 Messung des Ist-Zustands (Probe über das gebackene 512²-Grid)

```
Land (ohne Wasser/Fluss):        55.649 Kacheln
davon mit Bebaubar-Bit:          25.161  (45,2 %)

Hangverteilung des NICHT-Gebirgs-Lands:
  0,00–0,25   14.834      <- eben
  0,25–0,50    6.517
  0,50–0,86    9.374      <- gerade noch bebaubar
  0,86–1,20    7.476   ]  12.309 Kacheln sehen grün/sandig aus,
  1,20–1,80    4.655   ]  sind aber per Bake-Schwelle unbebaubar
  1,80+          178

Anker-Kacheln, auf denen ein Gebäude wirklich steht (heutige Regeln):
  1×1  57,9 %   3×3  32,2 %   4×4  26,0 %   5×5  21,9 %
  Hauptursache durchgehend: buildableRatio < 1 (Maske), NICHT Wasser/Klippe.

„Nur knapp gescheiterte" 3×3-Anker
(kein Wasser, kein Gebirge, Hang ≤ 1,5, trotzdem abgelehnt):   13.095
  ⇒ knapp eine VERDOPPELUNG der heute nutzbaren 13.874 Plätze liegt brach.
```

**Das Gebirge ist gar nicht das Problem — die Streu-Steilheit ist es:**

```
Gebirgskacheln gesamt: 12.615
  Höhe  < 4  (Tiefland!)   1.647   <- reine Hang-Artefakte, blocken Bauen + Straßen
  Höhe 4–8                 1.736
  Höhe 8–13                2.251
  Höhe 13–25               5.745   <- echtes Massiv
  Höhe ≥ 25                1.236   <- Hochgebirge / Highlight
```

**5.634 der 12.615 „Gebirgs"-Kacheln liegen unter Höhe 13** und sind nur wegen
`tileSlope > 1.8` Gebirge. Sie sind über das Tiefland und die Küste verstreut,
blocken jedes normale Gebäude (`cliffOverlap > 0`) und jede Bodenstraße — und
haben mit dem zentralen Massiv nichts zu tun.

**Die Küste ist mehrheitlich Steilküste:**

```
coast      897 Kacheln (84 % bebaubar)
riverbank  542 Kacheln (84 % bebaubar)
lakeshore   14 Kacheln (43 % bebaubar)
cliff    1.937 Kacheln ( 1 % bebaubar)   <- mehr als alle flachen Ufer zusammen
```

## A.4 Was bereits da ist und wiederverwendet wird

- **Sockel/Fundament existiert schon.** `ThreeMapRenderer.ts:3603-3626`: Gebäude
  stehen auf `surface.maxHeight + 0.04` und bekommen eine Fundamentbox bis
  `surface.minHeight`. Ein größeres zugelassenes `heightDelta` erzeugt damit
  **automatisch** einen sichtbaren Sockel statt eines schwebenden Gebäudes —
  die Grundlage für §4.1/§4.3 ist vorhanden und muss nur ausgebaut werden.
- **`BuildingDef.buildsOnRock?`** (Steinbruch) ist der Präzedenzfall für additive
  Untergrund-Regeln — dasselbe Muster trägt Terrassen-/Uferbau.
- **`shoreType` + `waterDepthGrid`** liefern bereits pro Kachel den Ufercharakter;
  Kai-/Anlegerprüfung nutzt sie. Für §3.3/§4.4 muss nur **mehr flaches Ufer**
  entstehen, kein neues Datenfeld.
- **`waterfrontAprons`** (garantierte 5×5-Uferplattformen) existieren — nur zu
  wenige (16).

---

# PHASE B — Terrain (Re-Bake)

Ziel: **die Insel außerhalb des Massivs deutlich flacher und großflächig
zusammenhängend bebaubar** machen, ohne sie steril zu machen.

- **B1 — Iterative Maske ⇄ Glättung (behebt den Kernfehler A.2 (1)).**
  Statt „einmal klassifizieren, dann glätten" mehrere Runden:
  klassifizieren → glätten/kappen → **neu** klassifizieren → … (3–4 Runden).
  Erst dadurch wandert das Band 0,86–1,80 (12.309 Kacheln) schrittweise in die
  Baufläche, weil die Glättung den Hang tatsächlich senkt.
  **Gebirge (`h > MOUNTAIN_HEIGHT`) bleibt in jeder Runde ausgeschlossen.**
- **B2 — Schwellen und Erosion.** `MAX_BUILDABLE_TILE_SLOPE` moderat anheben;
  die Rand-Erosion von „alle 4 Nachbarn" auf „mindestens 3 von 4" lockern, damit
  Plateauränder und Talkanten nicht pauschal wegfallen.
- **B3 — Gebirge höhenabhängig definieren.** `MOUNTAIN_SLOPE` nur noch **oberhalb
  einer Basishöhe** anwenden. Streu-Steilheit im Tiefland wird dadurch normales
  (geglättetes, terrassiertes) Land statt „Gebirge". Das zentrale Massiv über
  `MOUNTAIN_HEIGHT` bleibt **unangetastet** — Gipfelhöhe 52 bleibt.
- **B4 — Terrassen statt Rampen.** Sanfte Höhenquantisierung **nur** dort, wo der
  Hang ohnehin gering ist: es entstehen natürliche Stufen und größere ebene
  Flächen, keine gefräste Modelltreppe. Gegen „steril" wird die Quantisierung
  mit dem vorhandenen `fbm`-Rauschen aufgebrochen.
- **B5 — Küste, Strand, Fluss- und Seeufer.** `shoreHash`-Schwelle deutlich senken
  (mehr Zonen bekommen das flache Profil), Zugänglichkeitsschwelle
  (`tileH`/`tileSlope`) anheben, Blend-Band verbreitern, Anstiegsrate senken;
  mehr garantierte 5×5-Uferplattformen bei kleinerem Mindestabstand.
  Ziel: die 1.937 Steilküsten-Kacheln werden zur **Minderheit**, nicht zur Regel.
- **B6 — Das Massiv bleibt Highlight.** `PEAK_WORLD_HEIGHT = 52`,
  `MOUNTAIN_HEIGHT = 13` und der Ausschluss der Gebirgsknoten aus der Glättung
  bleiben. Neu entsteht ausdrücklich ein **bebaubarer Gebirgsfuß**: Kacheln
  unterhalb der Massivgrenze, die an Gebirge grenzen, werden terrassiert und
  freigegeben (§3.2/§4.3).

**Save-Wirkung:** neuer Bake ⇒ `worldHeight.gen.ts`, `islandBuildability.gen.ts`,
`islandTerrain.gen.ts`, `islandRegions.gen.ts`, `islandInfrastructure.gen.ts`
ändern sich ⇒ **`SCHEMA_VERSION`-Bump + lineare Migration** (§3).
Die Änderung ist **monoton erlaubend** (flacher, mehr bebaubar, weniger Gebirge,
Wasserlinie unverändert), deshalb bleiben bestehende Platzierungen gültig.
**Zu prüfen und ehrlich zu berichten:** ob sich Regions-Ids/-Grenzen verschieben.
Falls ja, wird wie beim v19-Weltumbau ein einmaliges Backup + Neustart gefahren
statt still falsche Regionszuordnungen zu erben.

# PHASE C — Placement

- **C1 — `buildableRatio` mit Toleranz.** Ein einzelner Nicht-Maske-Pixel darf
  einen sonst passenden Footprint nicht mehr kippen, solange die Kachel Land,
  nicht Wasser und nicht Gebirge ist und das Höhenbudget hält.
- **C2 — Höhenbudget statt Fixgrenze.** `heightDelta > 0.85` wird zu einem
  gestaffelten Budget (größere Footprints dürfen etwas mehr), gedeckelt auf das,
  was der Sockel **sauber** kaschieren kann.
- **C3 — Sockel/Terrasse ausbauen** (Renderer, §4.1/§4.3): aus der heutigen
  einfachen Fundamentbox wird eine gestufte Sockelschürze, die bis unter den
  tiefsten Footprint-Punkt reicht und am Rand leicht übersteht — kein Spalt,
  kein Schweben, kein Clipping. Ohne Terrain-Mutation.
- **C4 — Ufer-/Bankfundament** (§4.4): flache Uferkacheln (`shoreType`
  coast/riverbank/lakeshore) bekommen eine eigene, tolerantere Regel, damit
  Kai-, Hafen- und Wassergebäude bis ans Wasser reichen.
- **C5 — Gebirgsfuß/Hang** (§4.3): Bauen am Massivrand über das gelockerte
  Höhenbudget + Sockel; das Massiv selbst bleibt Sondergelände.

# PHASE D — Straßen / Anbindung

- Bodenstraßen-`maxSlope` an das neue Gelände angleichen (Straßen dürfen
  moderate Hänge nehmen); Wasser/Klippe bleiben der Höhenstraße vorbehalten.
- Router-Gewichte so, dass Straßen flaches Land **bevorzugen**, Hänge aber
  **können** — kein zweiter Verkehrsgraph (§2/§8).
- Anbindung an Ufer-/Wassergebäude prüfen (Landanker-Regel `roadWouldConnect`
  existiert bereits).

# PHASE E — Verifikation

Testfälle aus dem Auftrag §7, als Vitest-Fixtures auf **echtem, ungeglättetem**
Bake-Gelände (nicht über `flattenTerrain`), damit sie die reale Karte prüfen:

*Gebäude:* kleines Haus am leichten Hang · Sägewerk am Waldrand mit Neigung ·
Gebäude am Gebirgsrand · Markt in Küstennähe · Wassergebäude/Anleger am Flussufer ·
Gebäude auf Plateau · Gebäude am Strand · Gebäude in Küstenebene · Gebäude in
einer früher schwer bebaubaren Region.
*Straßen:* Straße am Hang · Straße zur Küste · Straße am Fluss entlang · Straße
zu einem Wassergebäude · Straße zu einem Gebäude auf leicht erhöhter Terrasse.

Zusätzlich eine **Kennzahl-Regression**: die Probe aus A.3 wird zum Test, damit
eine spätere Änderung die gewonnene Baufläche nicht unbemerkt wieder verliert.

Abschluss: `npx tsc -b --force` · `npx eslint src tests` · `npx vitest run` ·
`npm run build` + 3D-Screenshot-Smoke (Renderer-Änderung).

---

---

# UMSETZUNG — was tatsächlich gebaut wurde

## Die entscheidende Reihenfolge im Bake

`tools/bakeWorld.mjs` läuft jetzt in zwei Abschnitten:

1. **Ur-Durchlauf (unverändert):** Höhen, Ufer, Biome, Bebaubar-Maske,
   **Regionen (§7), Startregion-Carve, Rathauswahl (§8)**.
2. **§8a-flat (neu):** Uferprofil → Terraforming → Ufer/Biome/Bebaubarkeit neu
   ableiten → glätten → erneut ableiten. Infrastruktur-Hooks (§8b) und alle
   Ausgaben (§9) sehen nur noch dieses Gelände.

**Warum so:** Die Regionssegmentierung wächst kostenbasiert über Höhendeltas und
Biome. Lässt man sie auf dem eingeebneten Gelände laufen, entstehen **andere
Regionen** — der erste Versuch ergab 11 statt 13 Regionen und ein Rathaus an
(156,205) statt (127,250). Das hätte `regions.config.ts` (13 handgeschriebene
Regionen mit Progression, Kosten, Hafenabhängigkeit), das Balancing und **jeden
bestehenden Spielstand** zerstört — für einen Auftrag, der von Weltstruktur gar
nicht spricht. Durch die Reihenfolge ist `islandRegions.gen.ts` jetzt
**bitgleich** zum vorherigen Bake (per `git diff` verifiziert).

## Phase B — Terrain

- **B1 Terraforming** (`terraformNonMassifLand`): 4 Runden × 8 Iterationen.
  Jede Runde klassifiziert aus den AKTUELLEN Höhen neu, welches Land eingeebnet
  wird (Nicht-Wasser, Höhe ≤ 13, Hang ≤ 1,5), glättet und kappt es. Das behebt
  den Kernfehler A.2 (1) — vorher konnte die Glättung Baufläche nur vertiefen.
- **`onlyRough`:** Geglättet wird **nur**, wo die Stufe die erlaubte Grenze
  überschreitet. Eine reine Laplace-Glättung kippte ebene Plateaus in sanfte
  Rampen (gemessen: Kacheln mit Hang < 0,25 fielen von 14.834 auf 11.307) —
  genau das Gegenteil von „größere zusammenhängende Bauflächen".
- **Übergangsband:** Die eingeebnete Fläche wird um eine Kachel dilatiert, sonst
  sammelt sich das entfernte Gefälle an der Grenze zu einer Wand.
- **B2:** Bebaubar-Hang 0,86 → 1,0; Rand-Erosion „alle vier orthogonalen
  Nachbarn" → „mindestens drei von vier".
- **B3:** Hang allein macht nur noch **oberhalb Höhe 6** Gebirge. Die 1.647
  Streu-„Gebirgs"-Kacheln unter Höhe 4 sind verschwunden. `CLIFF_BIT` folgt
  derselben Regel — sonst hätte die Änderung `validatePlacement` nicht erreicht.
- **B5 Ufer:** Blendband 9 → 11 Kacheln, Anstieg 0,28 → 0,20, Klippenschwelle
  9 → 12, bewusste Steilküstenzonen 24 % → 8 %, Zugänglichkeit (Höhe/Hang)
  3,2/0,9 → 4,6/1,35, Uferplattformen 16 → 44 bei Mindestabstand 28 → 17. Das
  Uferprofil läuft **zweimal**: vor und nach dem Terraforming (das Einebnen des
  Hinterlands macht die Uferkante sonst wieder relativ steiler).
- **B6:** Massiv unangetastet — Gipfelhöhe 52, `MOUNTAIN_HEIGHT = 13` und der
  Ausschluss der Gebirgsknoten gelten in jeder Runde.
- **Konsistenzriegel:** Eine Kachel darf nicht gleichzeitig „bebaubar" und
  „Steilwand" sein, und ihr Hang darf `GROUND_ROAD_MAX_SLOPE` nicht
  überschreiten. Ohne diesen Riegel entstanden **Bauplätze ohne mögliche
  Straßenanbindung** (57 Stück) — eine Falle für den Spieler (§5).

### B4 Terrassen — bewusst NICHT umgesetzt

Eine Höhenquantisierung („Stufen statt Rampen") wurde gebaut und gemessen, pro
Knoten **und** pro Kachel, mit fbm-gestreuter Stufenlage. Beide Male **sank** die
Zahl praktisch ebener Footprints (3×3 mit ΔH ≤ 0,85: 11.370 ohne → 10.563 mit),
weil das Schnappen an Plateaurändern neue Kanten erzeugt. Zusammen mit §8
(„nichts steril/künstlich") ist das ein klares Nein. Die gewünschte
Terrassenwirkung entsteht stattdessen sichtbar am Gebäude (C3).

## Phase C — Placement (`src/game/buildings/terrainFit.ts`, neu)

Reines Sim-Modul; der Renderer liest dieselben Werte (§1/§2).

- **C1 `minimumBuildableRatio`:** Ein 3×3 darf bis zu zwei seiner neun Kacheln
  ohne Bebaubar-Bit haben. Eine Einzelkachel muss weiterhin voll passen.
  Wasser, Fluss und Fels bleiben **hart** gesperrt, Kachel für Kachel.
- **C2 `footprintHeightBudget`:** 0,85 + 0,45 je weiterer Kachel Kantenlänge,
  gedeckelt auf 2,2. Vorher galt 0,85 für **jede** Gebäudegröße — ein 5×5 auf
  gleichmäßig sanftem Hang war unbaubar, obwohl derselbe Hang für ein 1×1 zählte.
- **C3 Sockel als Stützmauer** (`ThreeMapRenderer.buildNode`): Das Fundament
  reicht bis unter den tiefsten Punkt eines **Rings um** das Gebäude (nicht nur
  des Footprints), sonst klafft es an der Talseite. Ab sichtbarer Höhe wird es
  2- bzw. 3-stufig mit leicht vorstehendem Mauerfuß gebaut.

## Phase D — Straßen

- `GROUND_ROAD_MAX_SLOPE = 1.25` (vorher 0,8). Der alte Wert lag **unter** der
  Bebaubar-Schwelle: es gab Kacheln, auf denen ein Haus stehen durfte, das keine
  Straße erreichen konnte — besonders an genau den Uferkacheln, an denen Anleger
  und Hafenbauten stehen. `tests/mapBuildability.test.ts` hält die Zusage fest:
  **keine** Kachel trägt das Bebaubar-Bit und lehnt gleichzeitig eine Straße aus
  Geländegründen ab.
- Router (`roadRouting.ts`): Steigung kostet extra (`WEIGHT_SLOPE = 2`), damit
  Trassen von selbst ins flache Land gehen und nur klettern, wenn der Umweg
  teurer wäre. Passierbarkeit bleibt allein `validatePlacement` (§2/§8).

## Phase E — Tests

`tests/mapBuildability.test.ts` (28 Tests) läuft auf **echtem** Bake-Gelände ohne
`flattenTerrain` und sucht das jeweilige Gelände im Bake, statt Koordinaten
hartzukodieren. Enthält alle Fälle aus §7 plus Kennzahl-Regressionen (gewonnene
Baufläche, Massiv unangetastet, Ufer flacher, Relief erhalten) und
Gegenproben (Wasser/Fluss/Fels/gesperrte Region werden weiter abgelehnt).
Die Tests wurden gegen die **alten** Konstanten gegengeprüft: sie schlagen dort
fehl, sind also echte Wächter.

## Saves

**Save v25** (Migration v24→v25, keine Strukturänderung). Gegen den vorherigen
Bake gemessen: **0** Landkacheln wurden zu Wasser; Regionsraster/Startregion/
Rathaus bitgleich; ~2.000 Kacheln (3,5 % des Landes) verlieren das Bebaubar-Bit
oder werden am Rand eingeebneter Flächen steiler. Ein dort bereits stehendes
Gebäude bleibt gültig — `validatePlacement` läuft nur beim Bauen/Versetzen.
Straßen stammen aus `state.buildings`, Baumknoten sind abgeleitet und
`resolveNode` liefert für eine verschwundene Kachel regulär `undefined`
(Dauerbetrieb pausiert statt zu brechen). **Kein Neustart nötig.**

## Offen / bewusst nicht gemacht

- **Echtes Einebnen des Terrain-Meshes unter dem Footprint** (§4.1 „Footprint-
  Zonen lokal einebnen"). Umgesetzt ist die Sockel-/Stützmauer-Variante, die §4.1
  ebenfalls nennt („am Hang mit Stützstruktur arbeiten"). Eine echte
  Geländemutation bräuchte eine Pad-Überlagerung, die Sim **und** Renderer-
  Höhenfeld gemeinsam lesen, plus Chunk-Neuaufbau bei jeder Platzierung.
- **Pfahl-/Steg-Logik für Gebäude, die ins Wasser ragen** (§4.4). Die
  Waterfront-Gebäude (`dock_small`, `river_port`) nutzen weiter den vorhandenen
  Waterfront-Footprint mit Tiefenprüfung; echte Pfähle sind Renderer-Arbeit.
- 5×5-Footprints bleiben mit 30,9 % der Ankerkacheln der schwierigste Fall.

## Akzeptanzkriterien (aus dem Auftrag §9)

1. Mehrheit der Karte spürbar leichter bebaubar
2. Hauptgebirge bleibt visuelles Highlight
3. Küsten/Ufer weniger steil, besser nutzbar
4. Gebäude besser platzierbar an Hängen, Küsten, Stränden, Flussufern
5. Placement-Logik blockiert nicht unnötig
6. Kleine Geländeprobleme werden intelligent ausgeglichen
7. Keine schiefen, schwebenden oder fehlerhaften Gebäude
8. Straßen/Infrastruktur funktionieren sauber mit den neuen Flächen
9. Früher/mittlerer Stadtaufbau fühlt sich deutlich angenehmer an
10. Build / Lint / Tests bleiben grün
