# Handoff-Log

## 2026-08-01 — A6 Steinbruch + A7 Farm abgeschlossen (v1.25, Save v29, D-046)

**Ausgangslage:** Die Simulation für A6/A7 lag bereits **uncommittet** im
Arbeitsbaum (Knoten auf `tree`/`rock`/`crop` verallgemeinert, Steinbruch + Farm
mit `operation`, Stein ohne Nachwachsen, Logistik-Zuschlag auf Tempo statt
Passivrate, 12 Tests) — aber undokumentiert, und die Bedienung war noch reines
Sägewerk. Wer hier weiterarbeitet: **erst den Arbeitsbaum prüfen, dann die
Aufgabenliste** — OPEN_TASKS führte A6 als offen, während der Code schon stand.

**Drei messbare Lücken geschlossen.** (1) `deposit_exhausted` hatte keinen Text —
`t()` hätte den rohen Schlüssel angezeigt. (2) `renewable`/`remainingInArea`
wurden berechnet und von keiner Komponente gelesen: Die Endlichkeit eines
Steinbruchs war unsichtbar. (3) Wortfeld und Symbol waren überall Sägewerk.

**Umbau.** Neues reines UI-Modul `nodeVocabulary.ts` (total über die
Knoten-Union, Compiler erzwingt neue Typen); `OPERATION_IDLE_REASONS` als Liste
neben dem Union-Typ, damit ein Test jeden Zustand durchgehen kann (**D-046**);
Restmenge im Arbeitsgebiet + Umzugshinweis nur bei nicht nachwachsenden
Vorkommen; Symbol je Knotentyp.

**Für den Spieltest wichtig:** Bestehende Steinbrüche/Farmen produzieren **nicht
mehr passiv**, bis einmal „Betrieb starten" geklickt wurde (das Gebäudefenster
weist von selbst darauf hin). Kein Schemabruch, Save bleibt v29.

Verifikation grün: `tsc`, `eslint`, 565 Tests (68 Dateien), `npm run build`.


## 2026-08-01 — Welt lädt vollständig (v1.24, Save v29, D-045)

Nutzerauftrag: die Welt soll trotz gesperrter Biome schon laden, gesperrt anders
markiert als mit Nebel. Rückfrage beantwortet: **entsättigt + Schloss-Marker**,
**freie Kamerasicht auf die ganze Insel**.

**Entfernt:** Wolkenwand/Nebelfront (D-034), `fogSurfaceGeometry.ts` + Test,
`regionContours`, `worldFogTopY`, `CameraExplorationBoundary` und die gesamte
`cameraBoundsDisabled`-Verkabelung (Store, Debug-Panel, MapView, IMapRenderer,
vier i18n-Strings).

**Neu:** Gesperrtes Gelände wird pro Bodenknoten zu 70 % entsättigt und um 16 %
abgedunkelt (`LOCKED_DESATURATION`/`LOCKED_DARKENING`); Schloss-Marker schweben
über dem Regionsschwerpunkt; die Minimap zeigt dasselbe entsättigte Terrain statt
einer prozeduralen Wolkendecke.

**Der Fallstrick.** Sichtbares gesperrtes Land ist bewachsenes gesperrtes Land:
1.422 → 26.851 Instanzen. Der Vegetationsschlüssel enthält die Belegungsmenge,
also hätte **jeder Bauklick** die ganze Insel neu aufgebaut. Deshalb zwei
Gruppen mit eigenen Schlüsseln (`lockedVegKey` = Regionsliste + Qualitätsstufe),
gemeinsame Implementierung in `buildVegetationFor(...)`. Gesperrtes Land: halbe
Dichte, keine Schatten. Wer das zusammenlegt, baut den Ruckler zurück.

Keine Simulations- oder Save-Änderung (v29). Verifikation grün: `tsc`, `eslint`,
560 Tests, `npm run build`, Render-Smoke mit 0 Konsolenfehlern.


## 2026-07-31 — Natur-/Prop-Overhaul 14.0 (v1.23, Save v29, D-044)

Auftrag mit Mockup: die Welt wirkt „zu leer, zu technisch, zu steril und zu
gleichförmig"; Geometrie unangetastet lassen.

**Zwei Messungen erklärten alles.** Weltweit standen **14.038 Props auf 51.057
Landkacheln, davon nur 502 echte Modelle (3,6 %)** — der Rest ein Kegel auf einem
Zylinder. Grund: **jedes Natur-`.glb` wiegt ~29.000 Dreiecke**. Und der Katalog
ist kleiner als seine Dateinamen: `pine_tree`/`forest_cluster_small`/
`forest_cluster_medium` sind bytegleich, alle fünf Steine ebenso — real fünf
Formen, nicht zwölf.

**Umbau.** Verteilung nach acht Naturzonen statt if/else-Kaskade; Waldkern gegen
Waldrand über den Waldanteil im 5×5-Fenster (der Terraintyp kennt keine Kante).
Massengeometrie neu und billig (24–200 Dreiecke). Fünf neue Arten: `sapling`,
`stump`, `shoreRock`, `scree`, `cliffRock`. Regionale Identität über
`REGION_CHARACTER_DENSITY`. `rebuildVegetation` von 605 auf 152 Zeilen.

**Zwei Spieltest-Kalibrierungen.** Das Massiv war budget- statt
landschaftsbegrenzt (jetzt ist keine Region mehr gedeckelt). Und „leere Wiesen"
ließen sich nicht mit Bodendeckung beheben — Gras/Blumen werden nah gecullt und
sind auf Spielzoom unsichtbar; was liest, sind Büsche und Jungwuchs.

**Ergebnis:** 14.038 → **48.838** Props. Keine Geometrie-, Save- oder
Simulationsänderung. Verbindlich: `docs/agents/NATURE_OVERHAUL_14_PLAN.md`.


## 2026-07-31 — Modelltreue 13.1: Meeresspiegel an der Terrassenkante (v1.22, Save v29)

Spieltest-Nachlauf zu v1.21. Das Wasser stand 4 m unter der untersten flachen
Ebene — dazwischen lag nackte Klippenwand, und Häfen waren praktisch nicht
platzierbar. Histogramm der flachen Landkacheln: 0–3 m = 331, **4–5 m = 14.073**.

**Das Wasser steigt um 4 m.** Sweep über 0/3/4/5 m belegt den Punkt:
2×2-Anlegerplätze 20 → **344**, bebaubare Uferkacheln 129 → **759**, Baufläche
praktisch unverändert (37.841 → 37.798). Bei 5 m säuft die Terrasse selbst ab.

**`HEIGHT_SCALE` ist vom Meeresspiegel entkoppelt** (`SCALE_REFERENCE_N`) —
sonst hätte der höhere Wasserstand das Gelände um 8 % gestreckt. Modelltreue
bleibt bei 0 veränderten Landknoten.

Folge: **neun Regionen** (keine vorgelagerte Insel mehr, `requiresHarbor`
nirgends), Startregion **9**, Rathaus **(241,251)**, vier Landnachbarn — dadurch
gilt `START_MIN_NEIGHBOUR_REGIONS = 3` wieder wie ursprünglich. Erste Erweiterung
auf L2 bleibt der **Nordwald**. Save **v29**, Backup `cmb.save.backup.world-v28`.

540 Tests grün, Smoke ohne Konsolenfehler.

## 2026-07-31 — Modelltreue 13.0 (v1.21, Save v28, D-043)

Der Nutzer hat mit einem Viewer-Screenshot der rohen GLB belegt, dass das Modell
in Ordnung ist und die Abweichung im Bake entsteht. Messung: **157.749 von
233.287 Landknoten (67,6 %) verändert**, Ø Landhöhe 8,46 → 6,45 m. Ursache waren
Ufer-Blend, Terraforming, Schlussglättung und die Ersatz-Landschaft aus
Nadelreparatur/Klippen-Plateaus.

**Der Bake übernimmt die Geometrie jetzt unverändert** (`RAW_TERRAIN_FIDELITY`,
Standardpfad; alter Pfad über `TERRAIN_MODE=flatten` messbar). Wasser, Ufer,
Biome, Bebaubarkeit und Regionen werden daraus abgeleitet — keine Stufe schreibt
`HW` mehr. `BAKED_WORLD.modelFidelity` macht das testbar: `changedNodes === 0`.

Folge: **elf Regionen** (Archipel — Region 10 ohne Landnachbarn,
`requiresHarbor`), Startregion **11**, Rathaus **(239,251)**, erste Erweiterung
auf L2 ist der **Nordwald**. Bebaubar 47.806 → 37.891, Steilküste dominiert
(2.244 : 475). Save **v28**, Backup `cmb.save.backup.world-v27`.

Wasser blieb der erlaubte Hebel: Tiefenrampe angehoben und
`shorelineTolerance` 0 → 0,34, weil `river_port` sonst an **null** Stellen
baubar war. 541 Tests grün, Smoke ohne Konsolenfehler.

Offen: Pfahl-/Steglogik für Anleger an Klippen (Häfen sind jetzt selten, in der
Startregion keiner), Bergplattformen als Terrain-Klasse, Mesh-Einebnen unter dem
Footprint, neue Vegetations-/Prop-Assets.

## 2026-07-30 — Welt-Feinschliff 12.3 (v1.20, Save v27)

Korrektur zu v1.19; Save unverändert v27.

- **Befund:** Die „Küstenzacken" sind die prozeduralen Landmarken-Platzhalter,
  nicht das Gelände. `SCENIC_PROP_MODELS` enthielt für `rockArch`, `waterfall`,
  `oldTree`, `lakeIslet` und `desertSpire` ausschließlich Wunschnamen — keine
  dieser Dateien existiert, also griff immer `makeScenicFallback`. Der
  `rockArch`-Ersatz besteht aus zwei aufrecht stehenden grauen Kästen.
- **Methode:** temporärer Handle auf die Three-Szene (`window.__cmbScene`) plus
  Playwright-Auswertung aller Meshes nach Höhe, Schlankheit, Material-Farbe und
  Weltposition; zusätzlich Chunk-Hochpunkte gegen `worldHeight.gen.ts` geprüft.
  Ergebnis: Bodenmesh nirgends über dem Bake, genau 12 hohe schlanke Objekte
  weltweit. Die Probe ist wieder entfernt.
- Modell-Listen enden jetzt mit vorhandenen Dateien; Notgeometrie für `rockArch`
  und `waterfall` neu proportioniert (breiter als hoch).
- Neue Prop-Arten `giantTree` und `boulder` in `vegetationBudget.ts` +
  `ThreeMapRenderer`: je zwei Größenstaffeln aus derselben Auswahl, `jitterScale`
  0,85/0,9. Detailbudget bewusst 0 — sie werden direkt als Modell gesetzt.
- Bake: `CLIFF_ZONE_ALWAYS_RELIEF = 18` (Klippen-Garantie am echten Gebirge),
  `REGION_MIN_TILES` 3.000 → 3.300. Regions-Ids 4/5 haben die Rollen getauscht.

## 2026-07-30 — Welt-Feinschliff 12.2 (v1.19, Save v27)

Zweiter Spieltest-Nachlauf; Save-Schema **v27** (Weltumbau, Backup
`cmb.save.backup.world-v26`).

- Bake: `repairTerrainNeedles` ersetzt den wirkungslosen `repairCoastPeaks`-Riegel
  als verbindliche Zackenabwehr. Trennschärfe kommt aus `needleAxisCount`
  (Hochpunkt in ≥ 3 von 4 Achsen); Reparatur und Messung teilen sich
  `isTerrainNeedle`, damit die Kennzahl nie wieder etwas anderes prüft als der
  Riegel. 208 entfernt, `needleCount === 0` im Test.
- Bake: `computeCliffRelief` + `CLIFF_ZONE_MIN_RELIEF` — Steilküste entsteht nur
  noch, wo das Hinterland wirklich hoch ist. `buildCliffPlateaus` legt den Kopf
  zusammenhängender Abschnitte auf Hinterlandniveau (nur Knoten mit vier trockenen
  Nachbarkacheln, damit die Wand INNERHALB der äußersten Landkachel entsteht).
- Bake: Ableitungsreihenfolge korrigiert — erst alle Höhenänderungen, dann
  `classifyShoreTypes`/`classifyBiomes`/`classifyBuildable` (5d). Vorher war die
  ausgelieferte Bebaubar-Maske gegenüber der Geometrie veraltet.
- Segmentierung: 9 statt 8 Regionen (das Relief-Tor teilt die vorher größte
  Region in Gras + Sand), Startregion jetzt **9**. `REGION_MIN_TILES` bleibt
  bewusst bei 3.000 — niedrigere Werte lassen einen 2.922-Kachel-Rest stehen.
- Sim: `foundCity`/`getFoundingBlocker`/`isCityFounded` im Controller;
  `newGame` platziert nichts mehr. `FOUNDING_PLACEHOLDER_ID` nutzt
  `ignoreBuildingId`, um genau die Identitätsprüfungen zu überspringen
  (`buildable:false`, `unique`), nicht die Terrainprüfung.
- Progression: `FREE_EXPANSION_LEVEL` 3 → 2, `regions.config.ts` komplett neu
  gestaffelt, `de.json` r1–r9 neu benannt.
- Renderer: `starterNatureFrame` 15→32 auf 5→16; Startregion-Zielschwellen wie
  jede andere Region; `REGION_PROP_BUDGET` rund verdoppelt, Deckel 3 → 3,5.
- UI: `FoundingHud` (neu) erklärt die Gründung und bietet den Bake-Vorschlag an.
- Tests: `newController` gründet standardmäßig auf dem Bake-Anker (`found: false`
  zum Opt-out) — ohne diese eine Zeile fallen 87 Tests, die nur „es gibt eine
  Stadt" voraussetzen. Neuer Helfer `townHallOf` statt der festen Id
  `b_townhall`.

## 2026-07-30 — Welt-Feinschliff 12.1 (v1.18, Save v26)

Nachlauf zum Spieltest der neuen Insel; Save-Schema unverändert v26.

- Bake: Uferprofil läuft jetzt ZULETZT (nach `flattenBuildableLand`, danach nur
  Stufenkappung) — das war die Ursache steiler Binnenufer, nicht das Profil.
  Blend 11 → 14 Kacheln, Anstieg 0,20 → 0,16, Steilküstenanteil 8 → 5 %.
- Bake: Regionsparameter für 8 große Regionen (Ziel 7.000, min. 3.000, 10 Seeds).
- Bake: `waterPad2`/`carriesQuay` spiegeln `waterfrontWaterCells` exakt;
  Startregion braucht ≥ 3 echte Hafenflächen (`START_MIN_HARBOUR_PADS`).
- Bake: harte Flachheitsgrenze auch in §8 (Rathauswahl), nicht nur als Score.
- Config: `regions.config.ts` neu (8 Regionen, Rollen, ressourcengekoppelte
  Progression, Preise aus dem Faktormodell), i18n-Namen, 8 Visualprofile.
- Config: Sägewerk-Stufen kalibriert + Radius-Ausbau ergänzt.
- Renderer: `regionPropBudget()` skaliert Props mit der Regionsfläche.
- Tests: 531 → 534 grün. Zwei Altfehler korrigiert — Anleger-Rotationen sind
  Grad (0/90/180/270), nicht 0..3; der Ernte-Test kodierte eine Invariante von
  vor AS-2 („Stadtpool wächst nicht").
- Verworfen (dokumentiert): geländefolgende Startstraßen — brachen ein Dutzend
  Bauplatz-Tests in acht Dateien für einen rein optischen Gewinn.

## 2026-07-30 — World Overhaul 12.0: neue Insel als Weltgrundlage (v1.17, Save v26)

**Die Welt ist ausgetauscht.** `reference/world/new island 3d model.glb` ersetzt
`island 3d new.glb` als einzige Bake-Quelle; kein Parallelbetrieb.

- Bake `tools/bakeWorld.mjs`: **Reihenfolge umgedreht (D-041)** — Terraforming
  (`§6b-flat`) läuft jetzt VOR der Regionssegmentierung. Grund: D-040 wollte nur
  alte Regions-Ids schützen; bei vollständigem Weltaustausch entfällt das, und die
  alte Reihenfolge machte Regionsstatistik und Startregion-Zuschnitt unehrlich
  (3.983 Kacheln für 1.348 „bebaubare").
- Neu im Bake: harte Startregion-Kriterien (Budget 1.200–1.750, ≥ 8 Uferkacheln,
  ebener 7×7-Rathausblock, ≥ 3 Nachbarregionen; Kandidatenschleife mit
  Uferkorridor + Ufer-Vorplatz), `§7c-bis` verwaistes Land einsammeln (3.217
  Kacheln), Regionsparameter für 60k Land (Ziel 4.600, min. 1.600, 14 Seeds),
  Tunnel-Reichweite 28 → 52, zweite Kontrollausgabe `tools/bake-regions.png`.
- Welt: 61.322 Land / 44.170 bebaubar / 13 Regionen; Startregion **13**
  „Gründerland", Rathaus **(237,256)**, ΔH 0,34, vier Landnachbarn.
- `regions.config.ts` neu (Namen, Progression, Kosten aus dem Faktormodell);
  **kein `requiresHarbor`** mehr, weil die Insel eine zusammenhängende Landmasse
  ist. `regionUnlockBlocker` unverändert.
- Renderer: Regionsname nur bei Hover/Freischaltung (§10);
  `regionContour` → `regionContours` (Nebel deckt jeden Regionsteil, Decke und
  Wolkenwand je Kontur) — sonst wären die eingesammelten Nordinseln sichtbar
  geblieben.
- Save **v26**, Migration v25→v26 = Weltumbau mit Backup
  `cmb.save.backup.world-v25`.
- Tests: 519 → 528 grün (68 Dateien); neue Zusicherungen für §6-Wasserhöhe, Footprint-Kapazität,
  Startregion-Kriterien, vollständige Land-Erreichbarkeit, „kein Land ohne Region",
  Bauplatzkapazität + Anleger in der Startregion. Neuer Helfer
  `paintResourceNodes` (Betriebstests hingen am Positions-Hash der Knoten und
  damit unbemerkt an absoluten Weltkoordinaten).
- Verifiziert: `tsc -b --force`, `eslint src tests`, `vitest run`, `npm run build`
  und 3D-Screenshot-Smoke (Playwright, `vite preview`) ohne Konsolenfehler.
- Details: [`WORLD_OVERHAUL_12_PLAN.md`](WORLD_OVERHAUL_12_PLAN.md), D-041.

## 2026-07-28 — Map Flattening + Buildability Overhaul (v1.11, Save v25)

**Gelände + Platzierung, Weltstruktur unverändert.** Die Insel ist außerhalb des
Massivs eingeebnet; Bauplätze für 3×3/4×4 haben sich ungefähr verdoppelt.

- Bake `tools/bakeWorld.mjs`: neuer Nachlauf **§8a-flat** (Uferprofil →
  Terraforming → Ufer/Biome/Bebaubarkeit neu ableiten → glätten). Läuft **nach**
  Regionen/Startwahl, deshalb ist `islandRegions.gen.ts` bitgleich (D-040).
- Bebaubar-Maske 25.161 → 38.126; Streu-Gebirge unter Höhe 4: 1.647 → 0; flaches
  Ufer 1.453 → 2.485 gegen Steilküste 1.937 → 905; Massiv unverändert.
- Neues Sim-Modul `src/game/buildings/terrainFit.ts` (Höhenbudget nach
  Footprint-Größe, Bebaubar-Toleranz, `GROUND_ROAD_MAX_SLOPE`, Sockelhöhe);
  `validatePlacement` bleibt die einzige Instanz.
- Renderer: Fundament ist jetzt eine abgetreppte Stützmauer bis unter das
  **umliegende** Gelände (kein Klaffen an der Talseite).
- `tests/mapBuildability.test.ts` (28 Tests) auf **echtem** Bake-Gelände, ohne
  `flattenTerrain`; gegen die alten Konstanten gegengeprüft.
- Save **v25**, Migration v24→v25 ohne Strukturänderung; kein Neustart nötig
  (0 Landkacheln wurden zu Wasser — gemessen gegen den vorherigen Bake).
- Offen und dokumentiert: echtes Mesh-Einebnen unter dem Footprint, Pfahl-/
  Steglogik für Wassergebäude, 5×5 bleibt der schwierigste Fall (30,9 %).

## 2026-07-23 — Visual Active Operations & Infrastructure UI (v0.82)

**Rein visuell/UI, Save unverändert v19.** Das überladene Referenz-Dashboard wurde
in exklusive Spielzustände übertragen.

- Arbeitsgebietsmodus mit UI-only Node-Entwurf, Radius/Einzel/Ausnahme,
  terrainfolgendem Three-Layer, Cursor-Tooltip und Controller-Bestätigung.
- Gebäudefenster mit Tabs, echten Workern, lokalem Lager,
  Auftrags-/Upgradeansicht; Durchsatz bleibt ehrlich „nicht angebunden“.
- Ressourcen-Netzwerkdrawer aus dem HUD, physische lokale Standorte,
  Transportplanner mit echten Preview-Werten; Handkarren sichtbar gesperrt.
- Stadtarbeit-Cargo-Timeline aus `CargoRouteStop[]`.
- Straßenbau als Preview vor Bestätigung; Wasserbau-GLB-Ghost,
  Fundament/Pfeiler/Wasseranker und spezialisiertes HUD.
- Gemeinsame `GamePanel`-/Metric-/Capacity-/Status-Bausteine,
  `active-operations.css`, Visual-ViewModels/Action-Verträge und getrennte
  Dev-Szenarien.
- Doku: `ACTIVE_OPERATIONS_VISUAL_SYSTEM.md` plus Netzwerk-, Transport-,
  Straßen-, Waterfront-, ViewModel- und Handoff-Dokument.
- Tests: `activeOperationsViewModels.test.ts` und
  `activeOperationsComponents.test.ts`. Offene Bindungen und Reihenfolge:
  `ACTIVE_OPERATIONS_VISUAL_HANDOFF.md`.
- Verifikation: TypeScript und ESLint sauber, 47 Testdateien mit **354/354**
  Tests sowie Produktionsbuild grün; Preview `/` antwortet mit HTTP 200.
  Screenshot-Smoke blockiert, weil die integrierte Browsersteuerung keine Instanz
  bereitstellte. Tauri-Build angestoßen, aber lokale Rust-/Cargo-Toolchain fehlt
  (`cargo metadata: program not found`).

## 2026-07-23 — § Change 9.0: Fog of War & Kamera-Grenzen S3 (v0.81)

**Rein visuell/navigatorisch, keine Save-Änderung (v19).** Der Pro-Region-Nebel
(Ellipsoid-Kapseln, Pro-Region-Höhe) wird zu EINER weichen Front vereinheitlicht,
und ein Kamera-Clamping wird neu eingeführt.

- **S3a Fog:** `worldFogTopY()` (86. Perzentil aller Landhöhen, gecacht) = eine
  globale absolute Nebeloberkante statt Pro-Region-`fogY`. Wolkenballen jetzt mit
  `alphaHash` (dithered/ordnungsunabhängig), geringerer Deckkraft, dichter/kleiner
  (Cap 168→240) → zusammenhängende, fluffige Front ohne Kapsel-Silhouetten; Gipfel
  ragen bewusst heraus. Marker + Aufdeck-Fade unverändert. (`ThreeMapRenderer.ts`)
- **S3b Kamera-Clamping (NEU):** `CameraExplorationBoundary.ts` (three-freies
  Nearest-Feature-Distanzfeld aus `regionIdAt`-Maske) + `CameraController3D`
  (`setExplorationBoundary`, Zurückführung in `clampTarget`, Inertia-Bremse im
  Randband). Renderer `updateCameraBoundary` (Signatur-gecacht, bei Unlock/Cheat).
- **S3c Cheat-Trennung:** `WorldRevealState.cameraBoundsDisabled` (nicht
  persistiert) → Store `toggleCameraBounds`, DebugPanel-Button (`Compass`),
  MapView-Sync, i18n `ui.debug.camera_bounds_*`.
- **S3d Unlock-Retract:** verifiziert — Nebel nur Fade (persistente `fogVolumes`,
  `fogGroup` bleibt), Terrain/Vegetation deterministisch (kein Prop-Sprung); der
  inkrementelle Neuaufbau ist S4.
- **Tests:** `camera.test.ts` +6 (Boundary + Controller-Integration). **346 grün**;
  tsc/eslint/build sauber; 3D-Smoke 1600×900 (msedge) `{boot:true, errors:[]}` —
  Wolkensee weich/geschlossen, Kamera hält über Zentralland. Entscheidung **D-034**.
- **Startregion-Check (Mockup 10):** Zentralland trägt 409 Waldkacheln (nächster
  Wald 5 Kacheln, 194 in einem Sägewerk-Radius) → Sägewerk ab L2 ohne Expansion;
  Unlock-Ring {7,12}. „Ausreichend props/ressourcen/sektoren" bestätigt.
- **Offen:** S4 Vegetations-Performance (inkl. inkrementellem Unlock-Rebuild), S5
  lebendige Welt, S6 Sägewerk-Arbeitsmodus, S7 Steinbruch/Farm, S8 weitere Betriebe.

## 2026-07-23 — § Change 9.0: Zentraler Start & Regionsbalancing S1/S2 (v0.80)

**Weltumbau** (Save **v19**, Backup/Neustart `cmb.save.backup.world-v18`): Der
Offline-Bake (`tools/bakeWorld.mjs`) wählt weiterhin die zentrale Startregion
selbst — nur die Zielvorgabe wurde von 820 auf **1.400** bebaubare Kacheln
umgestellt (`START_REGION_TARGET_BUILDABLE`, Korridor 1.200–1.750). Neu gebacken →
`world/*.gen.ts`, `worldHeight.gen.ts`, `worldMasks.gen.ts`, `bake-report.md`.

- **Ergebnis:** Startregion 13 = 1.400 bebaubar, Rathaus (144,191),
  expansionDirectionScore 1.0, Zentralität 0.79, Ressourcen/Infra 1.0, Score 76.5.
- **Forst-Id-Rotation** (durch den größeren Carve): physischer Nordwald 10→12,
  Südforst 12→11, Ostforst 11→10. `regions.config.ts` + `i18n/de.json` (Namen) +
  Freischaltbaum + `docs/REGIONS.md` nachgezogen. L3-Erstwahl = {7, 12}.
- **Save:** `newGame.ts` SCHEMA_VERSION 19, `migrations.ts` `migrateV18ToV19`
  (WorldRebuildSaveError), `localStorageAdapter.ts` Backup-Key + list-Exclusion.
- **Tests:** regions/world.gen/newIslandBake/regionPreview/regionCost/storage/
  transport neu abgeglichen (Startgröße 1.200–1.600, Nordwald jetzt Id 12,
  v18-Backup, Pre-9.0→Rebuild). **340 grün**; tsc/eslint/build sauber; 3D-Smoke ok.
- **Audits vorab (§2):** `CENTRAL_START_REGION_AUDIT`, `FOG_OF_WAR_AUDIT`,
  `WORLD_RENDERING_PERFORMANCE_AUDIT`, `ACTIVE_RESOURCE_WORK_PLAN`. Entscheidung D-033.
- **Offen:** S3 Fog/Kamera-Clamping, S4 Vegetations-Performance, S5 lebendige Welt,
  S6 Sägewerk-Arbeitsmodus, S7 Steinbruch/Farm, S8 weitere Betriebe.

## 2026-07-23 — Active Operations 2.0: Lagertransport A5 + A5-Reste (v0.79)

**Neues Sim-Modul** `src/game/operations/transport.ts` (rein, kein Renderer/React):
manueller Lagertransport vom lokalen Betriebslager ins Zentrallager (globaler
Pool über ein Lagergebäude als Anlieferpunkt). **Verwendet `routeAnalysis.ts` +
`logistics.ts` wieder — kein zweites Logistiksystem (§8).**

- **Datenmodell** (Save **v18**, additiv): `operations.transfers` (Key =
  transferId), `InventoryTransfer` in `types.ts` (Skalare + `onboard`/`delivered`;
  Polyline wird deterministisch rekonstruiert, nicht persistiert). Migration
  `v17→v18` ergänzt leeres `transfers`; alte Saves ladbar. Zod in `schemas.ts`.
- **Zustandsmaschine** `advanceTransfers` (Live-Tick, zeitfaktor-korrekt):
  `loading → in_transit → unloading → (Rest? returning → loading : delivered)`.
  Reservierung im Quell-Lager; gedeckelte Einlagerung; `stats.produced` NICHT
  doppelt gezählt. **Mehrfachladung** (Fahrzeug pendelt), **Rückruf jederzeit**
  (Ladung kehrt zurück), **Betriebskosten** je Fahrt (`operatingCost`, Geldsenke).
- **Commands:** `createInventoryTransfer`, `cancelInventoryTransfer`.
  **Read-Helper:** `getInventoryTransferTargets`, `getInventoryTransferPreview`,
  `getBuildingTransfers`, `getAllTransfers`, `getInventoryNetworkOverview`
  (global/lokal/reserviert/unterwegs, §7.2), `getTransferRenderStates`.
- **UI:** Transport-Bereich in `FloatingBuildingSheet.tsx` (Ziel/Fahrzeug/Vorschau
  mit Fahrten+Kosten, laufende Transporte, Rückruf) + CSS + i18n. **Renderer:**
  additive gepoolte 3D-Fahrzeuge (`updateVehicles`), Position aus der Sim.
- **Tests:** `tests/transport.test.ts` (12) + `storage.test.ts` v18. Gesamt
  **339 grün**; tsc/eslint/build sauber; 3D-Smoke `{boot,buildOpened,errors:[]}`.
- **Entscheidung:** D-032. **Offen:** A6–A10 (A6 braucht Node-Generalisierung +
  Passiv-Test-Migration), Zwischenlager-Puffer, Kraftstoff.

Einstieg für die Fortsetzung: `ACTIVE_OPERATIONS_PLAN.md` → `OPEN_TASKS.md` (A6–A10).

## 2026-07-23 — Active Operations 2.0: Sägewerk-Referenzschnitt (v0.78)

**Neue Datenmodelle** (persistiert, Save v17, additiv): `OperationsState`
(`inventories`/`workers`/`active`/`nodeDeltas`), `BuildingInventory`,
`BuildingWorkerState`, `ActiveBuildingOperation`, `ResourceNodeDelta` (alle in
`src/game/types.ts`). Config: `BuildingOperationProfile`/`BuildingOperationStage`
(`config/types.ts` + Zod in `config/schemas.ts`).

- **Lokale Lager:** `state.operations.inventories[buildingId]` — Holz landet nur
  hier, volles Lager stoppt die Arbeit. Global unverändert (Zentral-/Übergang).
- **Ressourcenknoten:** `operations/nodes.ts` — Bäume aus Wald+Hash abgeleitet,
  NodeId `"x,y"`, nur Deltas persistiert; `resolveNode`/`deriveNodesInArea`.
- **Arbeiter/Operationen:** `operations/operations.ts` — `advanceOperations` im
  Live-Tick (laufen/fällen/tragen/einlagern), Reservierung, Regeneration,
  Zeitfaktor-korrekt, keine Offline-Produktion.
- **Commands:** `startBuildingOperation`, `startBuildingOperationWithNodes`,
  `cancel/pause/resumeBuildingOperation`.
- **Read-Helper:** `getBuildingOperationInfo`, `getBuildingOperationPreview`,
  `getBuildingInventory`, `getBuildingWorkers`, `getResourceNodesNear`,
  `getBuildingWorkArea`, `getWorkerRenderStates`.
- **Sägewerk:** einziges Gebäude mit `operation`-Profil; passiver `produce`-Pfad
  in Tick+Derived abgeschaltet. **Steinbruch/Farm/Feuerwehr:** noch passiv (A6–A8).
- **Transport:** noch keiner (A5) — Holz bleibt lokal gebunden, ehrlich ausgewiesen.
- **Automatisierung:** offen (A10).
- **Save-Migration:** `v16→v17` additiv, alte Saves ladbar, keine Datenverluste.
- **Offene Codex-UI-Arbeit:** 3D-Einzelbaum-Auswahl/Arbeitsmodus, Fäll-/Trag-
  Animationen. **Benötigte Modelle/Animationen:** optionale `.glb`-Arbeiter +
  Fäll-/Trag-Clips (Drop-in; aktuell gepoolte Prozedurfiguren).
- **Tests:** `tests/operations.test.ts` (9) + Re-baseline von 6 Passiv-Tests auf
  den Steinbruch. Gesamt **327 grün**; tsc/eslint/build sauber.

Einstieg für die Fortsetzung: `ACTIVE_OPERATIONS_PLAN.md` → `OPEN_TASKS.md` (A5–A10).

## 2026-07-23 — Vegetations-Performance & Grafikqualität, Säule B (v0.77)

**Umgesetzt**

- Reine, getestete Schicht: `graphicsQuality.ts` (4 Profile + `vegetationLodTier`),
  `graphicsSettings.ts` (persistiert, kein Save), `perfStats.ts` (Telemetrie).
- Renderer-Anbindung: Dichteskalierung + Schattenbudget in `rebuildVegetation`,
  Nahdetail/Pixel-Ratio/Tierbudget aus dem Profil, Rebuild-nur-Vegetation bei
  Qualitätswechsel. Nebel-Cheat erzwingt keine Maximalqualität.
- UI: Grafikqualität-Auswahl (SettingsPanel, spielerseitig) + Dev-Performance-
  Panel (DebugPanel). `tests/graphicsQuality.test.ts` (8).

**Verifikation**: tsc/eslint sauber, 318 Tests grün, `npm run build` ok,
3D-Screenshot-Smoke über Ultra/Niedrig/Hoch fehlerfrei (Welt + Grafikqualität-
Sektion visuell bestätigt).

**Wichtig für die Weiterarbeit**

- Deep-LOD (HLOD/Impostor/Chunk-Streaming/Shader-Wind/Atlas) ist bewusst
  zurückgestellt — nur auf Zielhardware messbar. `vegetationLodTier` und die
  Profil-Sichtweiten liegen bereit, um es zu speisen (`OPEN_TASKS.md` P0).

## 2026-07-23 — Final World Compaction, Säule A (v0.76)

**Umgesetzt**

- Zweite horizontale Verdichtung (Spannweite 420 → 374, Fläche −20,7 %); Gipfel
  50 → 52; Baueinheiten unskaliert. Voller Rebake (`tools/bakeWorld.mjs`).
- 40 → 13 Regionen (1 Start + 12). Neues Faktor-Kostenmodell `regionCost.ts`,
  Seeadjazenz + Hafenpflicht (`regionUnlockBlocker`), Gratis-Erst-Erweiterung
  ab L3 ohne Belohnung. Regionsdialog um Gratis-/Hafen-/Nachbarschafts-Hinweis
  erweitert; Tutorial-Nachricht `message.free_expansion_hint`.
- Save-Schema **v16** mit Backup-Neustart `v15 → v16`.

**Tests**: 17 alte Welt-/Regionstests auf die 13-Regionen-/v16-Welt umgeschrieben,
neue Fälle (Gratiserweiterung ohne Belohnung, Hafen-Gate). `regionCost.test.ts`.
`docs/REGIONS.md` neu generiert. 310 Tests grün; tsc/eslint sauber.

**Wichtig für die Weiterarbeit**

- `FREE_EXPANSION_LEVEL` liegt jetzt in `progression/levels.ts` (Controller
  re-exportiert). `getFreeRegionExpansionOptions()`/`getRegionUnlockBlocker()`/
  `isRegionHarborDependent()` sind die UI-Lesepfade.
- **Säule B (Vegetations-Performance) ist noch komplett offen** —
  `OPEN_TASKS.md` P0 + `WORLD_PERFORMANCE_AUDIT.md`.
- Zielkonflikt §3.1 vs. §4 zugunsten der Regionsstruktur aufgelöst (D-028).

## 2026-07-22 — Core Gameplay Overhaul 8.0, Phase G1 + Zeitvertrag (v0.75)

**Behobene Bugs**

- Stadtarbeit „4/5 Stopps": `evaluateCargoRoute` hakte ein Ziel beim ERSTEN
  Kontakt ab, auch wenn die Ladung nicht reichte. Der gültige Zweitkontakt nach
  dem Nachfüllen wurde ignoriert; die Route blieb dauerhaft unvollständig.
- „Verkehr: Wird geprüft": Die Kennzahl hing an `analysis`, die es erst bei
  vollständig verbundener Zielkette gibt.
- Abschluss-Popup mit „– %": Kennzahlen existierten nur bei erfolgreicher
  Routenanalyse, wurden aber unbedingt gerendert.
- Props verschwanden beim Region-Unlock: indexbasierte Deckelung über die
  weltweite Kachelliste (`i % ceil(len / cap)`).
- Zeitsteuerung ohne Wirkung: Die HUD-Knöpfe schrieben nur `dayLengthMin`.
- Fünf Bürgeranliegen nannten im deutschen Text pre-×20-Einwohnerzahlen.

**Neue Datenmodelle**

- `ActivityStopStatus`, `ActivityProgress`, `CargoRouteStop.status`
- `RouteTrafficForecast`
- `ActivityRunResult`
- `SimulationSpeed`, `SIMULATION_SPEEDS`
- `PropKind`, `REGION_PROP_BUDGET`

**Neue Commands / Read-Helper**

- `GameController.setSpeed` / `getSpeed` / `advanceByRealTime`
- `GameController.getActivityTrafficForecast`
- `ActivityRoutePreview.traffic` und `.progress`
- rein: `forecastRouteTraffic`, `selectPropTiles`, `propHash`

**Geänderte Balancingwerte**

Keine. Nur fünf deutsche Questtexte an ihre echten Zielwerte angeglichen.

**Neue Regionsstruktur / neue Einwohnerwerte**

Keine — beides gehört zu den Phasen G3 und G4 und ist im Plan beschrieben.

**Stadtarbeit-Änderungen**

Stopplogik, getrennte Fortschrittszählung, Verkehrsprognose und
Abschlussbericht. Bedienung (§4.2), Lagerstopps (§6) und seltenere, tiefere
Aufträge (§5) bleiben offen.

**Lieferketten-Vorbereitung**

Noch nicht begonnen (Phase G6). `ActivityProgress.returnRequired` existiert
bereits als Vertrag, ist aber ehrlich immer `false`, weil das Missionsmodell
keine Pflichtrückkehr kennt.

**Zeitsteuerung**

Realzeit × Geschwindigkeit → ein Tick-Pfad. Pause = keine Simulationszeit.
Renderer: `simDt` für Weltanimation, Echtzeit für Kamera/Eingabe. Bewusst NICHT
im Save; `meta.lastSimTime` ist damit von der Wanduhr entkoppelt.

**Save-Migration**

Keine — Schema bleibt **v15**.

**Offene Codex-UI-Arbeit**

- `criticalSegments` der Verkehrsprognose auf der Planungskarte markieren
  (`ManualRouteMap.tsx`).
- Bedienung der Routenplanung gemäß §4.2 (Klick auf Straße vs. Karte ziehen).

**Offene Assets**

Keine neuen. Der erweiterte Biom-Prop-Katalog bleibt drop-in-fähig.

**Tests**

`tests/simulationSpeed.test.ts` (8), `tests/vegetationBudget.test.ts` (8),
`tests/questText.test.ts` (3) neu; `tests/logistics.test.ts` und
`tests/routeAnalysis.test.ts` erweitert. Gesamt: 296 Tests in 41 Dateien.

**Verifikation**

`npx tsc -b --force` ✅ · `npx eslint src tests` ✅ · `npx vitest run` ✅ (296) ·
`npm run build` ✅. Windows-Tauri-Build und 3D-Screenshot-Smoke **nicht
ausgeführt** — beide stehen in `OPEN_TASKS.md`.

**Nächster Schritt**

Phase G2, zwingend beginnend mit dem Terrain-Picking: `groundPointAt` raycastet
gegen eine flache Ebene bei y = 0 statt gegen das Höhenfeld
(`ThreeMapRenderer.ts:514–520`). Das erklärt den Platzierungsversatz, den
„Ghost aktualisiert sich nicht"-Eindruck und sehr wahrscheinlich auch die
abgelehnten Anlegerplätze. Details: `CORE_GAMEPLAY_OVERHAUL_AUDIT.md` §2.1.

## 2026-07-22 — Waterways, Harbors & Infrastructure 7.0 (v0.74)

- Küstenkegel auf projiziert-degenerierte Wanddreiecke im Bake zurückgeführt;
  173 ungültige Heightfield-Proben werden verworfen, ein isolierter Ausreißer
  konservativ repariert. Finale Diagnose: 0 isolierte Peaks, 12,311 m maximaler
  Nachbarschritt.
- Regionsnebel/Visual-Reveal und echte Gameplay-Freischaltung getrennt. Terrain,
  Vegetation, Props und Landmarken bleiben beim visuellen Audit sichtbar;
  Teaserregionen werden vom echten Dev-Cheat nicht freigeschaltet.
- Quadratische Ozeanplatte durch radiales Fernmesh ersetzt, Ferninseln als
  unregelmäßige Silhouetten in Distanznebel neu aufgebaut.
- Straßenpflicht aus der allgemeinen Platzierungsvalidierung entfernt.
  Anschlussstatus, Produktions-/Versorgungssperre sowie Straßen-, Wasser- und
  Teilnetzmarker laufen über denselben Simulations-/Diagnosepfad.
- `dock_small` und `river_port` mit Config, Land-/Wasser-Footprint,
  Tiefenprüfung, automatischer Ausrichtung, Ghostzellen, Baushop-/Sheetangaben,
  prozeduralem Fallback und Drop-in-Vertrag ergänzt.
- Bake exportiert 569 Wasser-Nodes und 1.775 supercover-geprüfte Kanten. Der
  Controller berechnet eine Dijkstra-Vorschau; das Infrastruktur-Overlay zeichnet
  Netz, Häfen und eine gestrichelte Richtungsroute ohne Renderer-Gameplaylogik.
- Keine persistente Schifffahrt und keine Save-Migration; Schema bleibt v15.
- Verifikation: `npx tsc -b --force`, `npx eslint src tests`, 38
  Vitest-Dateien mit 269/269 Tests und `npm run build` erfolgreich. Die
  Bake-Vorschau wurde visuell geprüft; der Preview-Server lieferte HTTP 200.
- Ein Runtime-WebGL-Screenshot war nicht möglich, weil die integrierte
  Browsersteuerung keine Browserinstanz bereitstellte. `npm run tauri:build`
  erreichte den erfolgreichen Frontend-Build und stoppte erst bei fehlendem
  `cargo`/`rustc` in der lokalen Umgebung.

## 2026-07-22 — Terrain & World Scale 6.1 (v0.73)

- X/Z-Quellspanne auf Faktor 0,8898 verdichtet und alle Weltableitungen neu
  gebacken: 44.757 bebaubare Kacheln, exakt 20,0 % weniger als 6.0.
- Bake-Score wählt Herzland (24) zentral auf der größten Landmasse: Rathaus
  `(125,193)`, 1.290 direkte und 4.418 frühe Baukacheln, zwei Straßenachsen.
- Schiffsankunft bleibt separat bei `(222,206)` mit 115-Kachel-Trasse und
  zukünftiger Hafenposition vorbereitet; kein alter Ostküsten-Stadtstart.
- Wasserlinie moderat angehoben, Ufer geglättet und klassifiziert: 569 direkte
  Wasserbaukacheln, 16 garantierte 5×5-Aprons, 2 Brückenkorridore.
- Neuer World-Space-/Triplanar-Splatshader mit elf aktiven Schichten,
  kameraabhängigen Detailmaps, Regen-Wetness und instanziertem Nahgras; 29 neue
  2048er Farbtexturen plus ausgewählte PBR-Maps sind drop-in-dokumentiert.
- Save v15 sichert inkompatible v14-Weltstände kontrolliert; Gameplaylogik und
  Renderer bleiben getrennt.
- Verifikation: TypeScript, ESLint, 36 Vitest-Dateien mit 262/262 Tests und
  Produktionsbuild erfolgreich. Bake-Vorschau geprüft; WebGL-Screenshot wegen
  fehlender integrierter Browserinstanz und nativer Tauri-Build wegen fehlendem
  `cargo`/`rustc` in dieser Umgebung nicht ausführbar.

## 2026-07-22 — Codex — World Rebuild 6.0 (v0.72)

- Neue 45-MB-Insel sicher nach `reference/world/` kopiert und mit festem
  SHA-256 vollständig auditiert; alle 78 Source-Teile stehen im generierten
  JSON-/Markdownbericht.
- Einzige Bake-Pipeline auf 512² Terrain, 1025² Höhe, 40 Regionen, Oststart,
  Bebaubarkeit, Wasser-/Küstenmasken, Infrastrukturhooks und drei UI-Karten
  umgestellt. Source-GLB wird nie zur Laufzeit geladen.
- Hauptgebirge stammt ausschließlich aus dem Height-Bake; 64 Terrain-Chunks,
  triplanare Profile, Tiefenwasser und instanzierte Vegetation bleiben der
  performante Rendererpfad.
- Simulation besitzt eine zentrale Surface-Abfrage; Platzierung, Vorschau und
  Rendererfundament verwenden denselben Footprintbefund.
- Save v14 nutzt kontrollierten Neustart mit einmaligem Backup für v10–v13,
  weil alte Koordinaten nicht zuverlässig projizierbar sind.
- Dev-Reveal ist rein visuell und Release-gated.
- Einstieg: `NEW_ISLAND_AUDIT.md`, `NEW_ISLAND_REBUILD_PLAN.md`,
  `docs/WORLD_REBUILD.md`, danach `OPEN_TASKS.md`.
- Alte Source nicht löschen/verschieben, bevor ein sauber isolierter
  Git-Sicherungspunkt existiert; der Arbeitsbaum enthält Nutzeränderungen.
- Verifikation: `npx tsc -b --force`, `npx eslint src tests`, 36 Vitest-Dateien
  mit 259/259 Tests und `npm run build` erfolgreich. Preview liefert HTTP 200;
  die Source-GLB ist nicht im Produktionsbundle.
- Visueller Browser-Smoke in dieser Sitzung blockiert: die integrierte
  Browsersteuerung meldete keine verfügbare Browserinstanz. Die technische
  Bake-Vorschau wurde geprüft, aber nicht als Runtime-Screenshot ausgegeben.
- `npm run tauri:build` erreicht das Frontendskript, bricht lokal jedoch vor dem
  nativen Build ab, weil `cargo` und `rustc` nicht installiert/im PATH sind.

## 2026-07-21 — Codex — Regions-Wolkenwand und Sperrmarker (v0.71)

- Das bestehende Regionsnebel-Volumen in `ThreeMapRenderer` zu einer wirklich
  blickdichten Wolkenwand aus Grunddecke, drei Alpha-Lagen und einem
  instanzierten Volumen ausgebaut.
- Wolkendecke liegt oberhalb des höchsten Terrainpunkts und ihre geglättete
  Kontur greift leicht über die technische Regionsgrenze; Terrain, Gipfel und
  Landmarken gesperrter Gebiete scheinen nicht mehr durch.
- Große Canvas-Weltmarker mit Schloss, lokalisiertem Regionsnamen und echtem
  Freischaltlevel ergänzt; Marker-Raycasts öffnen den vorhandenen
  Regionsdialog.
- Minimap verdeckt gesperrte Landschaften mit einer prozeduralen Wolkenmaske und
  zeigt Schloss-/Level-Marker an kanonischen `BAKED_REGIONS`-Zentren.
- Bestehendes `cloud_bank.webp` bleibt optional; Material-/Canvas-Fallbacks
  funktionieren ohne neue Pflichtassets. Keine Simulation, Config oder
  Save-Migration; Schema v13.
- Verifikation: `npx tsc -b --force`, `npx eslint src tests`, 35 Vitest-Dateien
  mit 259/259 Tests und `npm run build` erfolgreich. Produktions-Preview auf
  Basis-URL `/` lieferte HTTP 200. Die Browser-Control-Skill fand in dieser
  Sitzung keine übernehmbare In-App-Browserinstanz, daher blieb der echte
  3D-Screenshot-Smoke offen. `npm run tauri:build` wurde angestoßen und scheitert
  ausschließlich an der lokalen Voraussetzung `cargo` (Programm nicht
  installiert), nicht am Frontend-Build.

## 2026-07-21 — Codex — Map Redesign 5.0 (v0.70)

### Umsetzung

- Bestehende Inselbake, Höhenquelle, Chunks, Regionstopologie, Wasser,
  Vegetation, Assets und Atmosphäre auditiert; kein paralleles Weltsystem
  angelegt.
- `worldVisualProfiles.ts` mit zwölf visuellen Profilen und vollständiger
  Zuordnung aller 32 Regions-IDs ergänzt. Region 9/29 sind ausschließlich
  visuell Wüste/Sumpf; Gameplay bleibt `TODO(CLAUDE_LOGIC)`.
- Terrain auf zwölf Splat-Layer erweitert. Berg/Klippe verwenden
  Weltkoordinaten-Triplanar; Nachbarschaftssamples verhindern harte sichtbare
  Regionskanten.
- Sechs KI-generierte Base-Color-PNGs für Bergfels, Schnee, Wiese, rote Wüste,
  Sumpf und Küstenkies erstellt, visuell geprüft, manifestiert und in den
  Produktionsbuild übernommen. Tatsächliche Auflösung: je 1254×1254.
- Vorhandene KI-/Drop-in-Bäume werden als Nadel-, Laub- und Großkieferfamilie
  differenziert. Fels, Schilf und Totholz besitzen neue Manifestnamen,
  Instancing und prozedurale Fallbacks.
- Ozeanwellen erweitert und eine gebündelte animierte Flussströmungsgeometrie
  ergänzt. Felsbogen, alter Baum, Ruine, Wüstenfelsnadel, Sumpfbaum und Seeinsel
  als deterministische neutrale Landmarken verdrahtet.
- Modellprompts/READMEs neu generiert und die vollständige Audit-, Plan-,
  Regions-, Material-, Asset-, Patchnote-, Projektstand- und Claude-Übergabe auf
  v0.70 aktualisiert.

### Architektur / Save

- Visuelle Profile liegen ausschließlich unter `src/renderer/three/`; keine
  Simulation importiert Three/React/UI-State.
- Inselkontur, Höhenbake, Gameplayregionen, Baufelder und Balancing unverändert.
- Drop-in-Namen bleiben zentral in `modelManifest.ts`; fehlende Assets crashen
  nie. Texturen bleiben zentral in `terrainTextureManifest.ts`.
- Kein neuer persistierter Zustand; Save-Schema bleibt **v13**.

### Prüfung

- `npx tsc -b --force`: grün.
- `npx eslint src tests`: grün.
- `npx vitest run`: grün, **35 Testdateien / 259 Tests**.
- `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`: grün,
  **22 Tests**; generierte Dokumente synchron.
- `npm run build`: grün; nur bekannte Rollup-Warnung zum großen Hauptchunk.
- Vite-Preview unter `http://127.0.0.1:4173/`: HTTP 200, Basis-URL `/` gültig.
- Screenshot-Smoke: **Infrastruktur blockiert**. Die vorgeschriebene integrierte
  Browserlaufzeit wurde verbunden, das Troubleshooting gelesen und die
  Verfügbarkeit einmal geprüft; `agent.browsers.list()` lieferte `[]`. Daher
  keine erfundene Screenshotfreigabe und kein fremder Browser-Fallback.
- Sechs neue Terrainbilder einzeln visuell inspiziert; alle als valide
  1254×1254-PNGs geprüft.
- `npm run tauri:build`: blockiert vor Kompilierung durch fehlendes lokales
  `cargo` (`cargo metadata: program not found`).

### Sichere Fortsetzung

Zuerst `MAP_REDESIGN_AUDIT.md`, `MAP_REDESIGN_PLAN.md`,
`REGION_VISUAL_REDESIGN.md`, `TERRAIN_MATERIAL_MATRIX.md` und
`WORLD_ASSET_MANIFEST.md` lesen. Danach den Screenshot-Smoke auf einem System
mit verfügbarer Browserinstanz nachholen. PBR-Begleitmaps und neue GLBs nur über
die bestehende Registry/Manifeste ergänzen; Wüsten-/Sumpflogik ausschließlich
als validierte Config- und Balancing-Änderung.

## 2026-07-21 — Codex — Stadtarbeit UI/UX Redesign 4.0 (v0.69)

### Umsetzung

- `ActivityRoutePlanner` vollständig neu hierarchisiert: Missionen links,
  dominante Karte mittig, Fahrzeug/Cargo, Live-Tour und Bestätigung rechts.
- Planname, „Letzte Route“, lokales Speichern/Laden, Drag-&-Drop-Zielreihenfolge
  und getrennte Pan-/Zeichenwerkzeuge entfernt.
- Einheitliche Kartensteuerung, automatischer Fit, Zoom 0,55–7,
  Marker-Doppelklick, Leertaste/F/R/Esc und Rechtsklick-Rückbau umgesetzt.
- Canvas visuell aufgewertet: echte Terrain-/Region-/Straßen-/Gebäudedaten,
  Schatten, Verkehr, animierter Glow, Pfeile, Etappenfarben und KI-Marker.
- Neue reine Projektionen: `targetOrderOnPath`, `evaluateCargoRoute`,
  `ActivityPlanningContext`, `ActivityRoutePreview` sowie die geforderten
  Controller-Read-Helper. Keine automatische Wegergänzung.
- Neue Komponenten `TourOverview` und `InfrastructureAdvisor`; Fahrzeug/Cargo
  sowie kompakte Analyse auf v4 umgebaut.
- Acht Fahrmissionen insgesamt; neu per Config: Trinkwasser, Marktnachschub und
  Grünflächenversorgung. `material_delivery`/`log_transport` besitzen explizite
  physische Cargo-Modelle.
- 20 neue transparente KI-PNGs: 8 Marker, 5 Cargo, 2 Berater, 5 Missionen.
  Sieben Stadtarbeit-Assetordner mit Prompts/Fallbacks dokumentiert.
- Deutsche Patch Notes, Architektur, Save-Migration, Projektstand,
  Entscheidungen, UI-Komponentenkarte, Assetmanifest und Claude-Handoff auf
  v0.69/v13 aktualisiert.

### Architektur / Save

- UI liest ausschließlich Controller-Snapshots/Read-Modelle und sendet den
  validierten Plan über bestehende Activity-Commands.
- Neue Missionen erweitern nur `activities.config.ts`; kein neues System.
- Kein neuer persistierter Zustand; Save bleibt **v13**.
- Exakte offene `TODO(CLAUDE_LOGIC)`-Daten: Quellenwahl, freie Plan-Legs
  (Zwischenlager/Depot/Rückwaren/Fahrzeugwechsel), Warnungs-Segmentfokus,
  Lagerbestand/-ladeleistung und echte Straßenzustands-/Ereignisdaten.

### Prüfung

- `npx tsc -b --force`: grün.
- `npx eslint src tests`: grün.
- `npx vitest run`: grün, **34 Testdateien / 255 Tests**.
- `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`: grün,
  **22 Tests**; generierte Modell-Dokumentation synchron.
- `npm run build`: grün; nur die bekannte Rollup-Warnung zum großen
  Haupt-Chunk.
- 20 Stadtarbeit-PNGs erscheinen in der Vite-Assetausgabe; Alpha/Abmessungen
  wurden nach der Generierung geprüft, repräsentative Motive visuell inspiziert.
- Screenshot-Smoke 1280×720 / 1920×1080: **Infrastruktur blockiert**. Die
  vorgeschriebene integrierte Browserlaufzeit wurde verbunden und nach deren
  Troubleshooting einmal abgefragt; `agent.browsers.list()` lieferte `[]`.
  Deshalb keine erfundene Bildfreigabe und kein externer Browser-Fallback.
- `npm run tauri:build`: blockiert vor Kompilierung durch fehlendes lokales
  `cargo` (`cargo metadata: program not found`), kein gemeldeter Frontendfehler.

### Sichere Fortsetzung

Zuerst `docs/HANDOFF_CLAUDE.md`, dann `PROJECT_STATE.md` und `OPEN_TASKS.md`.
Der frühere L4-Hinweis weiter unten, die parallele UI sei nicht typrein, ist mit
diesem gemeinsamen grünen Gate erledigt.

## 2026-07-21 — Claude — Stadtarbeit-Logik 2.0, Phase L4 (Logistik-Bewertung & Leerfahrtanteil)

### Claude — Stadtarbeit-Logik 2.0 (L4)

- **Reine Bewertung** in `activities/logistics.ts`:
  - `evaluateInfrastructure(input)` → `InfrastructureEvaluation`: `emptyTravelRatio`
    (§19, aus den Nachlade-Rückfahrten der Cargo-Etappen), `reloadTrips`,
    `loaded/empty/totalDistanceTiles`, `routeDirectness`, `vehicleSuitability`
    (Kapazität vs. Bedarf × Handling in engen/vollen Straßen),
    `warehousePlacementScore`, `congestionScore`, `estimatedDurationMs` inkl.
    `handlingDurationMs` (Lade-/Entladezeit) + `drivingDurationMs`, `spoilageRisk`
    (§12) und textfreie `warnings[]` (Codes: `oversized_target`, `many_reloads`,
    `high_empty_travel`, `low_vehicle_suitability`, `oversized_vehicle`,
    `perishable_no_cooling`, `incomplete_road`, `narrow_streets`).
  - `evaluateCargoRoute(plan, source, targets, roadPath)` → `CargoRouteEvaluation`:
    Ist-Auswertung eines gezeichneten Pfades (echte Quell-/Nachladestopps,
    gemessene Leerfahrtkacheln). Zuvor ungenutztes Gerüst, jetzt verdrahtet.
- **Neue Config (optional, kein Save):** `ActivityVehicleDef.loadTimeSec`,
  `unloadTimeSecPerTarget`, `narrowStreetPenalty`, `cooling` — Zod-validiert,
  konkrete Werte je Fahrzeug (große Fahrzeuge laden langsamer / enge Straßen
  schwerer; `refrigerated_truck` kühlt).
- **Read-Helper:** `controller.getActivityInfrastructure(defId, targetIds,
  vehicle?, plan?)`, `getActivityInfrastructureWarnings(...)`,
  `getActivityCargoRoute(defId, targetIds, roadPath, vehicle?)`. Reine Prognose/
  Anzeige — **kein Save-Bump, keine Auszahlungskopplung** (D-013/D-017).
- **Tests:** `tests/logistics.test.ts` von 12 auf **22** erweitert (Leerfahrt bei
  einer/zwei Ladungen, Lade-/Entladezeit, Determinismus, `evaluateCargoRoute`
  Nachlade-Erkennung + Leerfahrtmessung, Controller-Helfer mit echter Stadt:
  Van↔LKW-Trade-off, Verderb mit/ohne Kühlung, Wiring).

### ⚠️ Build-Status bei L4-Abschluss (an Codex)
- Die Claude-Logikschicht (`game/`, `config/`, `tests/`) ist typrein; `vitest`
  **34 Dateien / 252 Tests** grün; `eslint src tests` grün.
- `tsc -b`/`npm run build` waren **nicht** grün, weil die Codex-Stadtarbeit-UI
  parallel umgebaut wurde: `components/citywork/ManualRouteMap.tsx` (`resources`
  ist keine `BuildingCategory`), `RouteSummary.tsx` (`tone` exactOptional / fehlender
  Export `reachedTargets`), `panels/ActivityRoutePlanner.tsx` (fehlendes `visitOrder`-
  Prop, `analysis` vs. `preview`). Diese Fehler liegen in **Codex-Dateien**, nicht in
  der L4-Logik. Codex integriert dort gerade `CargoRouteStop`/`getActivityCargoRoute`;
  der gemeinsame Gate wird mit der UI-Landung grün. Claude hat diese UI **nicht**
  angefasst (Ownership).

### Offene Codex-Ansichten (L4)
- Leerfahrtanteil, Fahrzeugeignung, Quellenlage und Hinweiscodes im Planer/
  Route-Summary anzeigen (Zahlen/Codes liegen bereit; Textbausteine in der UI).

## 2026-07-21 — Claude — Stadtarbeit-Logik 2.0, Phase L3 (Reservierung an der Quelle, Save v13)

### Claude — Stadtarbeit-Logik 2.0 (L3)

- **Neue Daten:** `ActiveActivity.reserved?: Partial<Record<ResourceId, number>>`
  — an der Quelle reservierte, physisch bereits aus dem globalen Pool entnommene
  Ladung. Zod-validiert (`schemas.ts`).
- **Ablauf:** `startActivity` entnimmt bei Ladungsmissionen (`costPerTarget`)
  `costPerTarget × Ziele` **upfront** aus dem Pool und hält sie als `reserved`.
  Reicht der Vorrat nicht → Mission startet nicht (`insufficient`, §18).
  `progressActivity` zieht jede Auslieferung aus `reserved` statt aus dem Pool
  (Alt-Save ohne `reserved` → bisheriger Pool-Pfad). `abandonActivity` gibt die
  restliche Reserve zurück (§5), gedeckelt durch die Lagerkapazität.
- **Netto identisch:** Gesamtverbrauch bleibt `costPerTarget × Ziele` wie bisher —
  nur der Zeitpunkt (upfront statt pro Ziel) ändert sich; keine Balancingänderung.
- **Neuer Read-Helper:** `controller.getActivityExecutionSnapshot()` →
  `ActivityExecutionSnapshot` (Zielfortschritt, gehaltene `reserved`,
  rekonstruierter `CargoPlan`). Reine Read-Projektion für 3D-Ausführung/HUD.
- **Save-/Migration:** Schema **v13**, lineare Migration `12→13` (Normaliser —
  laufende v12-Missionen ohne `reserved` bleiben gültig, es wird nichts erfunden).
- **Tests:** `tests/activityReservation.test.ts` (8): Upfront-Entnahme,
  Zug-aus-Reserve, Netto-Gleichheit, Abbruch-Rückgabe, Start-Sperre bei zu wenig
  Vorrat, Snapshot, Save-Roundtrip v13, v12→v13-Migration. Quartett grün: tsc ·
  eslint · vitest **34 Dateien / 242 Tests** · build.

### Offene Codex-Ansichten (L3)
- 3D-Ausführung/HUD kann `getActivityExecutionSnapshot()` anzeigen (Reserve,
  Zielfortschritt, „X Beladungen").
- **Noch nicht** umgesetzt: sichtbarer Halt an der Quelle / Nachlade-Etappen
  während der Fahrt und echte Rückfahrt-Etappen. Die Ladungs-/Etappenplanung
  liegt bereit (`getActivityCargoPlan.legs`); der Renderer-Halt an Quellen ist
  Codex-Arbeit. Bis dahin ist die Reservierung logisch korrekt, aber visuell noch
  eine reine Delivery-Fahrt.

### Offene Balancingpunkte / nächste Claude-Phasen
- L4 Bewertung (Leerfahrtanteil, Lade-/Entladezeit, Fahrzeugeignung).
- L5 adaptive Mengen (§13) + `cargoModel`/Ökonomie vereinheitlichen.
- L6 Zwischenlager, L7 Bahn/Flug-Typgerüst.

## 2026-07-21 — Claude — Stadtarbeit-Logik 2.0, Phase L1+L2 (Ladung & Kapazität)

Auftrag „STADTARBEIT-LOGIK 2.0". Plan verbindlich:
`docs/agents/CITYWORK_LOGIC_2_PLAN.md`.

### Claude — Stadtarbeit-Logik 2.0

- **Neue Daten:** `ActivityDef.cargoModel?` (transportiertes Volumen: `resource`,
  `perTarget`, `scaleByResidents?`, `perishable?`) — getrennt vom Ökonomie-Sink
  `costPerTarget`. Zod-validiert (`schemas.ts`). `food_delivery` erhält
  `{food, perTarget 60, scaleByResidents, perishable}`.
- **Neue Read-Helper:** `controller.getActivityCargoPlan(defId, orderedTargetIds,
  vehicle?)` → `CargoPlan` (Transportbedarf je Ziel, `loadsRequired`,
  `needsReload`, Etappen `legs[]` pickup/delivery, `oversizedTargetIds`). Reine
  Read-Projektion, ändert weder State noch Auszahlung.
- **Ladungsmodell / Etappenmodell:** neues reines Modul
  `src/game/activities/logistics.ts` (`resolveCargoModel`, `cargoRequirements`,
  `planCargoLegs`, `cargoPlanFor`). Greedy-Packer: übersteigt der Restbedarf die
  Restladung → Pickup-Etappe (Nachladen, §2). Übergroßes Einzelziel wird über
  volle Ladungen gesplittet und markiert.
- **Fahrzeugwerte:** `capacity` aus dem bestehenden Katalog wird jetzt real
  ausgewertet (Van 250 < 5×60 → 2 Beladungen; großer LKW 1000 → 1).
- **Reservierungen / reale Entnahme:** noch NICHT im Ausführungspfad — L2 ist
  Planungs-/Prognoseschicht. `progressActivity` bleibt unverändert (Verbrauch über
  `costPerTarget`). Pool-Reservierung + Etappen-Ausführung folgen in L3 zusammen
  mit dem Renderer-Halt an Quellen und dem Save-Bump.
- **Bewertung:** unverändert (Leerfahrtanteil kommt in L4).
- **Save-/Migration:** KEINE. Schema bleibt **v12**; nur optionale Config-Felder,
  nichts Neues persistiert.
- **Tests:** `tests/logistics.test.ts` (12): Überladeschutz, Nachladen,
  Teilentladung, Pickup-vor-Delivery, übergroßes Ziel, Determinismus, Config-Plan
  Van↔LKW. Quartett grün: tsc · eslint · vitest **33 Dateien / 234 Tests** · build.

### Offene Codex-Ansichten
- Planer kann `getActivityCargoPlan` anzeigen: „X Beladungen nötig", Bedarf je
  Ziel, Pickup-Stopps, Warnung bei übergroßem Ziel/zu kleinem Fahrzeug.

### Offene Balancingpunkte / nächste Claude-Phasen
- L3 Etappen-Ausführung (Reservierung, reale Entnahme an Quellen, Rückfahrt) →
  Save **v13** + Migration `12→13`.
- L4 Bewertung (Leerfahrtanteil, Lade-/Entladezeit, Fahrzeugeignung).
- L5 adaptive Mengen (§13) — dann `cargoModel` und Ökonomie vereinheitlichen,
  `activeplay` neu abstimmen.

## 2026-07-20 — Codex — Stadtarbeit 2D / Fahrzeuge / 3D-Ausführung (v0.65)

### Umgesetzt

- Alter Auto-Optimierungsdialog entfernt; neue dreispaltige Planungswerkbank
  nach den drei Stadtarbeit-Mockups.
- Manuelles Straßenzeichnen per Klick/Ziehen, Rechtsklick-Undo, Zoom/Pan/Fokus,
  Esc/R/F, Verkehrs-/Gebäudeebene und Bounding-Box-Fokus.
- Drag-&-Drop-Zielreihenfolge; jede Änderung verwirft die alte Route.
- Kanonische `analyseManualRoute`: keine automatische Lückenfüllung, exakte
  Graph-/Anker-/Reihenfolge-/Endprüfung.
- Fahrzeugkatalog in Config: Kapazität, Tempo, Handling, Kosten, Verbrauch,
  Stärken/Schwächen, Level und Activity-Kompatibilität.
- Auswahl wird mit Route gespeichert und vom Three-Renderer automatisch
  abgefahren. Folge-/Freikamera, Fortschrittswidget, Abbruch, 2D-Rücksprung.
- Ergebnis-Event um Zeit, Strecke, Effizienz, Straßenanteil und Fahrzeug
  erweitert; Auszahlung bleibt am vorhandenen Activity-Pfad.

### Save

- **v12**, lineare Migration `11→12`.
- Neue optionale Felder: `ActiveActivity.vehicle`, `plannedRoadPath`.
- Alte laufende Missionen bleiben unverändert; keine Route wird erfunden.

### KI-Assets

- `medium_truck.png`, `large_truck.png`, `refrigerated_truck.png`,
  `heavy_transporter.png`.
- Eingebautes Bildwerkzeug, flacher `#ff00ff`-Hintergrund, lokale Soft-Matte-/
  Despill-Freistellung; RGBA geprüft.
- Modellnamen zentral in `ACTIVITY_VEHICLE_MODELS`; generierte Fahrzeug-README/
  PROMPTS synchron.

### Bewusst offen

- Keine erfundenen Werte für Steigung, Straßenzustand, Schäden, Kraftstoff,
  dynamische Ereignisse oder Parkplätze.
- Güterzug/Frachtflugzeug nur sichtbare Zukunftsvorschau.
- `rewardMultiplier` bleibt Prognose.

### Prüfung

- `npx tsc -b --force`: grün.
- `npx eslint src tests`: grün.
- `npx vitest run`: **32 Testdateien / 222 Tests** grün.
- Modell-Doku-Test: **22 Tests** grün; README/PROMPTS synchron.
- `npm run build`: grün; nur bekannte Rollup-Warnung zum großen Haupt-Chunk.
- `npm run tauri:build`: vor dem Kompilieren blockiert,
  `cargo metadata: program not found`; lokale Toolchain-Sperre, kein gemeldeter
  TypeScript-/Tauri-Codefehler.
- Browser-Screenshot-Smoke blockiert: keine Browserinstanz verfügbar
  (`agent.browsers.list() = []`). Breakpoints nicht als visuell freigegeben
  markieren.

## 2026-07-20 — Claude Code — C3–C7: Anliegen-Fokus, Platzierung/Upgrade, Regionsvorschau, Straßenplan, Balancing (v0.64)

### Analysiert
- Restliche zwei kanonischen `TODO(CLAUDE_LOGIC)` (Anliegen-Kartenfokus,
  Regionsvorschau) sowie §16 (Upgrade-Werte) und §25/§26 (Balancing/Aktivspiel).

### Logik umgesetzt
- **C3 Anliegen-Kartenfokus:** reine Projektion `questFocus` (Gebäude eines
  gebäudebezogenen Ziels → sonst nächste gesperrte, freischaltbare Region →
  sonst Stadtzentrum). „Auf Karte zeigen" aktiviert (`getMapApi().focusGround`).
- **C4 Platzierung/Verschieben/Upgrade:** Read-Helper `placementDiagnostics`
  (valid/reason/terrain/region/roadAccess/locationBonus/cost); Verschieben-
  Invarianten geprüft (Zustand/Belegung erhalten). **§16-Fix:** das
  Coverage-Overlay nutzte `status==='active'` und zeigte einen Radius im Upgrade
  fälschlich als 0 — jetzt `isContributing` wie die Simulation.
- **C5 Regionsvorschau:** `regionPreview` leitet begünstigte Gebäude aus den
  `productionModifiers` der Region ab (Config-Projektion). Skeleton in
  `RegionDialog.tsx` durch echte Liste ersetzt.
- **C6 Straßenplanung:** `roadPathPreview` validiert einen gezeichneten Pfad
  pfad-bewusst (Anschluss an Netz/frühere Pfadkacheln), liefert pro Kachel
  Status/Grund/Kosten + Summe. Reine Vorschau — kein Sofortbau, keine Abbuchung.
- **C7 Balancing:** Konvergenz-Regressionstest (zufriedene Metropole erreicht
  ~Kapazität, §25) und Aktivspiel-Test (Produktion nur im Live-Tick, §26).

### Bestehende Codex-Arbeit weiterverwendet
- Nur minimale Anbindungen in `CitizenRequestsPanel.tsx` (Button aktiviert) und
  `RegionDialog.tsx` (Liste statt Skeleton); kein Layout-/Style-Umbau.

### Neue Controller-Read-Helper
- `questFocus`, `placementDiagnostics`, `regionPreview`, `roadPathPreview`.
  Keine neuen mutierenden Commands; Command-Grenzen unverändert.

### Config-/Save-Auswirkung
- Keine Config-Änderung. Alle Helfer sind live berechnet — **Save bleibt v11**.

### Codex muss visuell noch ergänzen
- Straßen-Planungs-/Bestätigen-UI kann `roadPathPreview` nutzen (Farbe je
  Kachel-Status, Kosten/Länge), Bau weiterhin über bestehende Platzierung.
- „Auf Karte zeigen" schließt aktuell das Detail; optional Kamerafahrt/Highlight.

### Tests
- Neu: `questFocus` (5), `placementUpgrade` (5), `regionPreview` (5),
  `roadPlanning` (4), `populationBalance` (3). Gesamt grün: `tsc` · `eslint` ·
  `vitest` (32 Dateien / 218 Tests) · `build`. Browser-Smoke steht aus (Interface
  extern blockiert).

## 2026-07-20 — Claude Code — C1/C2: Audit + kanonische Routenanalyse (v0.63)

### Analysiert
- Repo-Stand nach Codex-Visualphase (v0.60–v0.62) gegen „Overhaul 3.0" geprüft;
  `docs/agents/CLAUDE_AUDIT.md` erstellt (was umgesetzt / visuell-aber-logiklos /
  offen / überholt, je Bereich + Zuständigkeit).
- Drei kanonische `TODO(CLAUDE_LOGIC)`-Stellen lokalisiert: Routenlast
  (`ActivityRoutePlanner.tsx`), `CitizenRequest.focusPosition/regionId`,
  `RegionPreview.futureBuildings/unlockProject`.

### Logik umgesetzt (C2 — höchste offene Logikpriorität)
- Neues reines Domain-Modul `src/game/activities/routeAnalysis.ts`: kanonische,
  DETERMINISTISCHE Routenbewertung auf dem ECHTEN Straßengraphen
  (`derived.roadNetwork`) — BFS-Wegfindung, Andocken der Gebäude an die Fahrbahn,
  Anrainerdichte-basierte Verkehrslast, Fahrzeit, Kreuzungen, Effizienz,
  Medaillen-Prognose und gedeckelter `rewardMultiplier`. Kein three/react/zustand.
- Roadless-Fallback (frühe Stadt) auf bestrafte Luftlinie — nie ein Crash.

### Bestehende Codex-Arbeit weiterverwendet
- `ActivityRoutePlanner.tsx` (Codex-UI) NICHT ersetzt, nur minimal angebunden:
  Kennzahlen und Segment-Verkehrsfarben kommen jetzt aus dem Controller-Helper;
  Rendering, Layout und Interaktion bleiben unverändert. Die alte Schätzung
  bleibt ausschließlich als Fallback ohne Straßenverbindung erhalten.

### Neue Controller-Commands / Read-Helper
- `GameController.analyseActivityRoute(defId, orderedTargetIds): RouteAnalysis | undefined`
  (reine Read-Projektion; Quelle = Quellgebäude der Aktivität, sonst Rathaus).
- Command-Grenze `startActivity`/`setActiveActivityRoute` unverändert.

### Config-Änderungen
- Keine.

### Save-/Migrationsauswirkung
- Keine. Analyse wird live berechnet, nichts persistiert. Save-Schema bleibt **v11**.

### Codex muss visuell noch ergänzen
- Optional: geplante Route auf der 2D-Karte am echten Straßenpfad
  (`RouteSegment.path`) statt der synthetischen L-Polyline zeichnen. Daten liegen
  jetzt in `analysis.segments[].path` bereit.

### Tests
- `tests/routeAnalysis.test.ts` (9): Determinismus, echter Straßenpfad vs.
  Luftlinien-Fallback, schlechtere Stoppreihenfolge → geringere Effizienz,
  Verkehrslast/Fahrzeit, gedeckelter `rewardMultiplier`, Controller-Integration.
- Gesamt grün: `tsc` · `eslint` · `vitest` (27 Dateien / 196 Tests) · `build`.
  Browser-Smoke des Planers steht aus (Screenshot-Schnittstelle extern blockiert,
  wie in `PROJECT_STATE.md` vermerkt).

## 2026-07-19 — Codex — Premium-Fidelity-Pass v0.62

### Änderung

- Zwei neue Referenz-Mockups gegen v0.61 vermessen und die größten
  Desktop-Abweichungen behoben.
- Bau-Shop ab 1680×860 als vollhohes rechtes 4-Spalten-Dock umgesetzt; bei
  kleineren Ansichten bleibt das untere Layout.
- Gebäude-Art um `stage` erweitert und Stufenstreifen in Katalogvorschau und
  Gebäude-Sheet ergänzt. Vorschau bleibt UI-only.
- Wetter-/Tageszeit-Sheet mit KI-Panorama sowie klaren Sonne-, Regen- und
  Nebel-Presets eingebaut.
- `SkyEnvironment` um visuelle Wettergradings und einen Ein-Draw-Call-
  Regenvorhang erweitert.
- Fruchtland- und Küsten-Heros generiert; Regionsdialog wählt nun nach Biomgruppe.
- Kompakten Stadtstatus auf fünf stabile Zeilen gebracht; gesperrte Bedarfe
  zeigen echte Level-Gates.
- `waterfall_cliff`/`waterfall_small` zentral registriert und einen auf vier
  Exemplare gedeckelten prozeduralen Fallback gebaut.

### Architektur

- Keine Änderung unter `src/game/**`; Save-Schema bleibt v11.
- Wetter liegt in `cmb.environment` und ist nur Renderer-Präsentation.
- `BuildingArt(stage)` verwendet `buildingModel(id, stage)` und damit dieselbe
  Drop-in-Kette wie die Welt.
- Modell-READMEs/PROMPTS wurden aus `modelManifest.ts` regeneriert.
- Fehlende KI-Bilder/GLBs bleiben vollständig fallbackfähig.

### Live-Abnahme

- Echte Browser-Innenfläche: 1920×1080.
- Top-HUD: 1920×70; Hauptbereich: 1920×1010.
- Wetter-Sheet: 650×990, Hero 622×252; keine Boot-Fehler.
- Interaktion „Sommerregen“ aktualisiert Panel und HUD korrekt auf „Regen“.
- Bau-Shop: 820×990, Inhaltsfläche 796×861, vier Spalten,
  Vorschau 796×270; Anliegen-Dock korrekt ausgeblendet.
- Stadtstatus: 276×398 mit fünf stabilen Zeilen.
- Screenshot-Capture: derselbe externe Timeout wie v0.61; daher keine
  erfundene visuelle Screenshot-Freigabe.

### Finale Prüfung

- `npx tsc -b --force`: grün.
- `npx eslint src tests`: grün.
- Modell-Doku-Synchronisation: 22/22 Tests grün.
- Vitest: 26/26 Testdateien, **187/187 Tests** grün.
- Produktions-Build: grün; nur bekannte Rollup-Warnung zum großen Haupt-Chunk.
- Tauri-Build: vor dem Rust-Schritt blockiert,
  `cargo metadata: program not found`; kein TypeScript-/Tauri-Codefehler
  gemeldet.

### Übergabe

Claude beginnt mit `CODEX_VISUAL_AUDIT.md` und `PROJECT_STATE.md`. Visuelles
Wetter ist fertig; es darf nicht als Gameplay-Wetter interpretiert werden.
Kanonisch offen bleiben ausschließlich die in `OPEN_TASKS.md` markierten
Gameplay-Datenquellen und die optionale Live-Modell-Vorschau.

## 2026-07-19 — Codex — Verbindlicher Mockup-Pass v0.61

### Änderung

- Bau-Shop, Gebäudedetail, Stadtstatus und Bürgeranliegen an den jüngsten
  verbindlichen Mockups ausgerichtet.
- Präsentations-Info-Layer mit sechs Filtern bis in die Three-Renderer-Brücke
  integriert; Marker priorisiert, geclustert und distanzbegrenzt.
- Minimap per Klick/Ziehen bedienbar gemacht und um echte Regionsangaben ergänzt.
- Welt um helle Bergstaffelung, Flachwasser, driftenden Nebel und instanzierte
  Biomdetails erweitert.
- Vier neue Rollenporträts und einen Hochland-Regionshero generiert, verkleinert,
  registriert und mit Fallbacks dokumentiert.
- Neues CSS-System in fünf geordnete Dateien aufgeteilt; bestehendes CSS bleibt
  als kompatible Basis erhalten.

### Architektur

- Keine Änderung unter `src/game/**`; Save-Schema bleibt v11.
- `infoLayerMode` ist lokaler UI-Zustand und wird nur über `MapApi` an den
  Renderer gereicht.
- Empfehlungen, Marker und Standorttexte lesen ausschließlich Config,
  Snapshot, Diagnosen und bestehende Controller-Ableitungen.
- Noch fehlende kanonische Karten-/Regionsdaten sind mit
  `TODO(CLAUDE_LOGIC)` markiert und nicht vorgetäuscht.

### Prüfung

- TypeScript: grün.
- ESLint: grün.
- Browser-DOM-Smoke 1280×720: keine Dokument-Scrollfläche, keine Hauptfläche
  offscreen, Bau-Shop/Inbox/Status vollständig im Viewport.
- Info-Layer-Interaktion: „Bedürfnisse“ setzt `aria-pressed=true`.
- Browser-Konsole: keine Fehler oder Warnungen.
- Screenshot-Capture des eingebauten Browsers: Infrastrukturfehler auch auf
  leerer Seite; deshalb keine erfundene Bildfreigabe.
- Vitest: 26 Testdateien / 185 Tests grün.
- Produktions-Build: grün; nur bekannte Rollup-Warnung zum großen Haupt-Chunk.
- Tauri-Build: Frontend nicht erneut erreicht, weil auf diesem Windows-System
  `cargo` nicht installiert/im PATH ist (`cargo metadata: program not found`).
  Das ist eine lokale Toolchain-Sperre, kein gemeldeter TypeScript-/Tauri-Codefehler.

### Übergabe

Claude liest zuerst `CODEX_VISUAL_AUDIT.md`, danach `OPEN_TASKS.md`. Die beiden
markierten Datenlücken sind die einzigen Stellen, an denen neue Gameplay-Daten
benötigt werden; UI und Renderer sollen nicht nochmals parallel aufgebaut werden.

## 2026-07-19 — Codex — UI-/Welt-Overhaul v0.60

### Änderung

- Vier Mockup-Referenzen in eine gemeinsame UI-Architektur übertragen.
- Top-HUD, linke Navigation, Live-Minimap, Bürgerdetail, Regions-Hero,
  Gebäudefenster und Stadtarbeit-Routenplaner umgesetzt.
- Welt visuell mit Ozean-/Küstenpolish, Wolkennebel, Vegetationsclustern und
  Landmarken aufgewertet.
- KI-/generative Assets integriert und Drop-in-Fallbacks dokumentiert.
- Controller um RNG-neutrale Routenvorschau und validierte Zielreihenfolge
  erweitert; Save-Struktur unverändert.

### Architektur

- Keine UI-/Renderer-Imports in `src/game/**`.
- UI mutiert keinen GameState.
- Save-Schema bleibt v11.
- `TODO(CLAUDE_LOGIC)` markiert die noch geschätzten Verkehrsdaten.

### Prüfung

- TypeScript: grün.
- ESLint: grün.
- Vitest: 26 Testdateien / 185 Tests grün.
- Produktions-Build: grün; erwartete Chunk-Größenwarnung.
- Browser-Smoke 1280×720 und 1920×1080 grün.
- Ein-Sheet-Test: Bürgerdetail schließt beim Öffnen des Gebäudekatalogs.
- Browser-Konsole: keine Fehler oder Warnungen.

### Übergabe

Claude beginnt mit `PROJECT_STATE.md`, `OWNERSHIP.md` und `OPEN_TASKS.md`.
Keine Verkehrs- oder Zeitlogik aus den UI-Schätzwerten ableiten; zuerst eine
reine, getestete Datenquelle hinter dem Controller definieren.
