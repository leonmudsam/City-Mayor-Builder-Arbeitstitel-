# Patch Notes

## v0.60 — Overhaul 3.0: Mockup-HUD, Inselkarte, Weltatmosphäre & KI-Assets

**Was.** Die drei beigefügten ChatGPT-Mockups wurden als visuelle Leitlinie in
die bestehende 3D-Anwendung übertragen:

- **Maritime Civic Glass.** Das HUD nutzt nun dunkles blaugrünes Glas, feine
  Rahmen, warme Goldakzente und eine klarere Typohierarchie. Der Levelblock trägt
  ein eigenes Bürgermeisterwappen; Ressourcen, Änderungsrate, Zufriedenheit und
  Zeitsteuerung sind kompakter und lassen der Welt mehr Raum.
- **Neue Navigation.** Die Hauptziele Stadt, Bauen, Stadtarbeit, Regionen,
  Statistiken und Rathaus sitzen nach dem zuletzt gelieferten Master-Mockup als
  kompakte vertikale Leiste links. Overlay-, Ausblend-, Handels- und
  Menüfunktionen bilden eine kleinere Hilfsgruppe; die Kamera-Presets bleiben
  unten mittig. Jede Schaltfläche verwendet bestehende Panels,
  Kamera-Presets und Commands.
- **Bürger-Kompakt- und Detailansicht.** Anliegen bleiben als kleine Inbox rechts
  sichtbar. Ein Klick öffnet ein großes Sheet mit Portrait, vollständiger
  Beschreibung, Teilzielen, Fortschritt und Belohnungen. Andere Kontexte
  schließen dieses Detail automatisch.
- **Bildstarke Regionsfreischaltung.** Der Regionsdialog besitzt nun ein breites
  KI-generiertes Inselpanorama und ordnet Region, Biom, Boni, Nachteile, Kosten
  und Bestätigung in derselben Fensterhierarchie wie das Master-Mockup an.
- **Stadtarbeit-Routenplanung.** Fahrmissionen öffnen vor dem Start einen
  vollflächigen Top-down-Planer nach dem Stadtarbeit-Mockup: Quelle,
  nummerierte Ziele, farbige Belastungssegmente, Routenlänge, Zeit,
  Kreuzungen, Staurisiko, Effizienz-/Medaillenprognose, Zielreihenfolge,
  Zurücksetzen, Speichern/Laden und automatische Nächster-Nachbar-Optimierung.
  Die geplante Reihenfolge wird beim Start validiert an den bestehenden
  `GameController` übergeben und im manuellen Fahrmodus verbindlich abgefahren.
- **Kollisionsfreies HUD.** Hauptnavigation, Stadtstatus und Inselkarte belegen
  getrennte linke Zonen; rechts bleibt ausschließlich die Bürger-Inbox.
  Stadtarbeit ist über die Hauptnavigation erreichbar. Responsive Regeln
  für 1420/1120 px und geringe Höhe halten die Navigation erreichbar. Der
  UI-Store erzwingt zusätzlich eine Ein-Sheet-Regel zwischen Panel,
  Gebäudeauswahl und Regionsdialog.
- **Live-Inselkarte.** `WorldMiniMap` zeichnet Terrain, organische
  Regionsgrenzen, Freischaltstatus, Gebäude, Straßen, Probleme, Missionsziele
  und Rathausposition aus echten Config-/Snapshot-Daten. Ein Live-Rahmen zeigt
  Ziel, Orientierung und Zoom der 3D-Kamera; ein Klick fokussiert die
  entsprechende Weltposition. Es existiert kein zweiter Kartenrenderer.
- **Weltpolish.** Der Ozean verdeckt die endliche Heightfield-Fläche und geht in
  der Fernansicht atmosphärisch weiter. Eine gebatchte Schaumlinie markiert
  Land-Wasser-Kanten. Gesperrte Regionen bleiben im Überblick lesbar.
  Vegetation steht in deterministischen Clustern mit Größenvariation statt im
  Schachbrett. Die frühere senkrechte Glaswand wurde durch horizontale,
  mehrschichtige Wolkenbänke mit Bodensilhouetten ersetzt.
- **Landmarken und Atmosphäre.** Ein festes Budget von zehn Himmelswolken sorgt
  für Tiefe. Wenige deterministisch gesetzte Boote, Windmühlen und Leuchttürme
  geben Küsten und fruchtbaren Regionen markante Silhouetten. Die
  Inselübersicht zentriert nun die gesamte 384×384-Welt.

**Warum.** Das bisherige UI war funktional, aber visuell fragmentiert und nahm
der Welt durch große, konkurrierende Flächen die Bühne. Die Fernansicht zeigte
eine endliche rechteckige Bodenfläche, Wälder wirkten gerastert und der
Regionsnebel wie eine Wand. v0.60 schafft die gemeinsame visuelle Sprache der
Mockups und beseitigt diese Brüche, ohne vorzeitig neue Gameplay- oder
Save-Systeme einzuführen.

**Architektur.** Simulation und Darstellung bleiben getrennt. `src/game/**`
wurde nicht um UI-/Three-Abhängigkeiten erweitert. `WorldMiniMap` liest nur
Snapshots und statische Weltfunktionen; `getCameraView()`/`focusGround()`
erweitern die kleine `MapApi`, ohne Renderer-Interna in die UI zu tragen.
Navigation mutiert ausschließlich den UI-Store bzw. ruft diese Brücke auf.
`SCENIC_PROP_MODELS` ist die
zentrale Modell-Namensquelle, `registry.ts` die Drop-in-Quelle für Wappen und
Umgebungstextur. Jedes neue Bild/Modell besitzt einen prozeduralen oder
Icon-Fallback. Die Wolken-, Landmarken-, Schaum- und Vegetationsmengen sind
begrenzt; wiederholte Naturmodelle bleiben instanziert. **Save-Schema bleibt
v11**, keine Migration.

Der Routenplaner ist eine UI-Projektion des bestehenden Aktivitätssystems:
`getActivityRoutePlan()` erzeugt eine RNG-neutrale Vorschau,
`startActivity(defId, plannedTargetIds)` validiert und übernimmt die Reihenfolge.
Die aktive Aktivität verwendet weiterhin dieselbe Save-Struktur und denselben
Belohnungs-/Fortschrittsweg. Belastungsfarben und Prognose sind in v0.60 bewusst
eine deterministische Planungsschätzung; ein echtes Verkehrsmodell bleibt O9.

**KI-Assets.**

- `src/assets/ui/brand/mayor_crest.png` — generiertes goldenes
  Bürgermeister-/Kompasswappen, transparent optimiert auf 256×256.
- `src/assets/environment/cloud_bank.webp` — generierte Graustufen-Wolkenmaske
  für Himmel und Regionsnebel, 1024×1024 WebP.
- `src/assets/ui/events/region_unlock_hero.webp` — KI-generiertes, auf
  1280×720 und ca. 171 kB optimiertes Inselpanorama für den Regionsdialog.
- `boat_small.glb`, `windmill_small.glb`, `lighthouse.glb` — lokal
  KI-generierte, prozedural modellierte Low-Poly-GLBs mit kleinen Dateibudgets
  (ca. 14/26/24 kB), über die bestehende Prop-Registry geladen.

**Auswirkung.** Der aktive Spielablauf, Ökonomie, Balancing und gespeicherte
Fortschritt bleiben unverändert. UI und Welt sind auf 1280×720 ohne
Konsolenfehler geprüft; Hauptansicht, Bürgerdetail und Gebäudekatalog bleiben
lesbar und kollisionsfrei. Alle überarbeiteten UI-Schriften sind mindestens
12 px groß. Die drei GLBs sowie Wappen, Wolkenmaske und Regions-Hero werden im
Produktions-Build korrekt gebündelt.

**Bewusst offen / Zukunft.** Der Routenplaner ist vollständig bedienbar, nutzt
aber noch keine reale Verkehrssimulation: Belastungssegmente sind eine
deterministische Schätzung, und die tatsächliche Bronze-/Silber-/Gold-Auszahlung
bleibt wie bisher zeitbasiert. Ein echter Straßengraph mit Verkehrsdaten,
Stauprognose und Routenbewertung folgt zusammen mit O9/O10. Ebenfalls offen
bleiben Ausbauflächen (O4), bestätigungspflichtige Straßenplanung (O6),
spielerisches Wetter (O11) sowie der O2-Rest aus Platzierungs-Ghost,
Wirkungsradien und Größen-Audit. Exakter Stand:
`docs/OVERHAUL_3_PLAN.md`; Einstieg für die Weiterarbeit:
`docs/agents/README.md`.

**Verifikation.** `npx tsc -b --force` grün · `npx eslint src tests` grün ·
`npx vitest run` grün (**26 Dateien / 185 Tests**) · `npm run build` grün.
Screenshot-Smoke 1280×720: keine Konsolenfehler, Level-/Ressourcenleiste,
linke Navigation, Stadtstatus, Bürger-Kompakt-/Detailansicht, Live-Inselkarte
und Kameraaktionen sichtbar und kollisionsfrei. 1920×1080 ist ebenfalls
kollisionsfrei; der Ein-Sheet-Smoke bestätigt, dass der Gebäudekatalog das
Bürgerdetail schließt. Der Build meldet weiterhin nur die bereits bekannte
Rollup-Warnung zum großen Haupt-Chunk.

**Dateien.** UI: `src/App.tsx`, `src/styles.css`, `src/state/store.ts`,
`src/components/hud/{GameHud,QuickActionBar,CameraControls,WorldMiniMap}.tsx`,
`src/components/panels/{ActivityRoutePlanner,ActivityPanel,CityWorkPanel,
CitizenRequestsPanel,RegionDialog}.tsx`, `src/i18n/de.json`. Commands/Welt:
`src/game/commands/controller.ts`, `src/components/MapView.tsx`,
`src/renderer/IMapRenderer.ts`,
`src/renderer/three/{ThreeMapRenderer,SkyEnvironment,environment,CameraConfig,
CameraController3D}.ts`, `tests/{camera,missions}.test.ts`. Assets:
`src/assets/registry.ts`, `src/assets/modelManifest.ts`,
`src/assets/ui/{brand,events}/`, `src/assets/environment/`,
`src/assets/models/props/nature/` plus generierte Props-README/PROMPTS.
Dokumentation: `README.md`, `CLAUDE.md`, `docs/{PATCHNOTES,ARCHITECTURE,
3D_CAMERA_CONTROLS,3D_WORLD_ASSETS,ASSETS,UI_ASSETS,OVERHAUL_3_PLAN,
UI_DESIGN_SYSTEM,UI_AUDIT,HANDOFF_CLAUDE}.md` sowie `docs/agents/*.md`.

## v0.59 — Ausbaustufe 2.0, Phase A10: Balancing, Bereinigung & Abschluss

**Was.** Der Abschluss des Programms **Ausbaustufe 2.0** (Gebäudesystem 2.0 +
Welt 2.0, A1–A10): Balancing verifiziert, Alt-Lasten bereinigt, Abschlussliste.

- **Balancing-Pass (verifiziert, nicht gewürfelt).** Die in A1 neu gesetzte
  Ökonomie über 20 Level × 32 Regionen ist strukturell abgesichert: neue
  Invarianten-Tests in `balancing.test.ts` erzwingen, dass jede Ausbaustufe
  **streng teurer** und **streng höher gegatet** ist als die vorige, dass keine
  Region **vor ihren Voraussetzungen** freischaltbar ist und alle Regions-Gates
  in **L1–L18** liegen (Meilenstein-Gefühl §5, „Expansion ist eine
  Entscheidung"). Zahlen bleiben config-getrieben — die Tests prüfen die Regel,
  nicht das Literal.
- **Bereinigung.** `pixi.js` als Abhängigkeit entfernt (der 2D-/Iso-Renderer war
  schon in A1 raus, jetzt auch das tote Paket); die entfallenen Gebäude-Assets
  `house_row.png`/`apartment.png` und die Iso-Doku
  (`ISO_ASSETS.md`/`ISO_RENDERING.md`) nach `archive/legacy-2d/` verschoben;
  drei liegengebliebene `adjustment_report*.json` gelöscht; ein veralteter
  „Pixi renderer"-Kommentar in `App.tsx` korrigiert. CLAUDE.md-Statusnotiz
  ergänzt.

**§28 — Abschlussliste (Entfernt / Ersetzt / Migriert / Archiviert / Behalten).**

- **Entfernt:** 2D-/Iso-Pixi-Renderer (A1) · `pixi.js`-Abhängigkeit (A10) ·
  Gebäude `house_row`, `apartment` (A1, Migration erstattet) · 36 Quadrat-Sektoren
  (`sectors.config.ts`, A1) · `adjustment_report*.json`-Reste (A10).
- **Ersetzt:** Sektoren → **32 organische Regionen** (`regions.config.ts` +
  Bake-Segmentierung) · Kategorie-Höhen → **Größenklassen XS–XXL** ·
  Klick-Stadtarbeit → **Fahrmodus** (A6) · hand­gepflegte Gebäude-Doku →
  **generiert** (`docs/BUILDINGS.md`, A9).
- **Migriert:** Save **v10 → v11** (eine Migration, 100 % Erstattung, Rathaus 5×5,
  Sektor→Region, Level-Rederivierung, A2).
- **Archiviert:** `archive/legacy-2d/` (2D-Gebäude-Artwork der entfallenen
  Gebäude + Iso-Doku) — historisch, nicht reaktivieren.
- **Behalten:** three-Renderer (`src/renderer/three/`) als einziger Renderer ·
  Drop-in-Asset-Registry (§5) · alle bestehenden `.glb`/`.png`-Assets aktiver
  Gebäude · Quest-/Bürger-/Aktivitäts-System (für Fahrmissionen erweitert).

**Bewusst offen (drop-in-fähig).** Der erweiterte Biom-Prop-**Katalog**
(Wasserfälle, Windmühlen, Heuballen, Boote, dedizierte Landmarken) bleibt
Polish: die prozeduralen Fallbacks (A3/A7) decken den Kern, und die vollständigen
Text-zu-3D-Prompts existieren bereits generiert (A9) — echte `.glb` einfach in
den passenden Ordner legen, der Renderer nutzt sie automatisch (§5). Ein
GPU-Profiling der Groß-Stadt braucht echte Hardware; die Budgets (Instancing,
Distanz-Culling, Deko-/Tier-/Verkehrs-Caps) stehen aus A3/A7 und wurden im
Boot-Smoke ohne Konsolenfehler bestätigt.

**Verifikation.** `tsc`/`eslint`/`vitest` (185, davon 4 neue Balancing-Invarianten)/
`build` grün. Boot-Smoke (1280×720, Beispielstadt) ohne Konsolenfehler nach
Paket-/Asset-Bereinigung — Welt, Gebäude und Panels rendern korrekt. Reine
Bereinigungs-/Test-/Doku-Phase ohne Renderer-Änderung.

**Dateien.** Entfernt: `pixi.js` (package.json/-lock),
`src/assets/models/**/adjustment_report*.json`. Archiviert nach
`archive/legacy-2d/`: `house_row.png`, `apartment.png`, `ISO_ASSETS.md`,
`ISO_RENDERING.md` (+ `archive/legacy-2d/README.md`). Geändert:
`tests/balancing.test.ts` (Invarianten), `src/App.tsx` (Kommentar), `CLAUDE.md`
(Statusnotiz).

## v0.58 — Ausbaustufe 2.0, Phase A9: Doku & Prompts — generierte Gebäude-/Regionstabellen, ein Prompt je Stufe

**Was.** Die verbindliche Asset- und Gameplay-Doku wird vollständig aus der
Config generiert und testgeprüft synchron gehalten (§ Auftrag A §10–§11, §13
„Gameplay ↔ Doku ↔ Assets konsistent"):

- **`docs/BUILDINGS.md` (neu, generiert).** Die verbindliche Gebäudetabelle:
  Größenklassen-Legende (XS–XXL mit Tri-/Textur-/Material-Budgets), eine
  Übersicht aller Gebäude und pro Gebäude ein Detailblock mit Footprint,
  Asset-Budget, benötigten GLBs (`<id>.glb` / `<id>_stageN.glb` /
  `<id>_construction.glb`), Modell-Nodes (`chimney`/`rotor`), Besonderheiten
  (Standortbonus, Baugrenze, Adjazenz …) und einer **Stufentabelle** (Name,
  Level-Gate, Kosten, Kern-Wirkung je Stufe). Dazu die 20-Level-XP-Kurve.
- **`docs/REGIONS.md` (neu, generiert).** Alle 32 organischen Regionen mit
  Biom, Freischaltung (Level/Kosten), Voraussetzungen, bebaubaren Kacheln,
  Produktions-Modifikatoren und Nachteilen; Startregion und Teaser-Insel
  hervorgehoben.
- **Ein 3D-Prompt JE AUSBAUSTUFE.** `src/assets/models/buildings/PROMPTS.md`
  emittiert jetzt nicht mehr einen Block je Gebäude, sondern **einen
  copy-paste-fertigen Tripo-Prompt je Stufen-Datei** (Basis + `_stage2`…
  `_stageN`) mit eigenem Motiv — vom Kleinen Haus über sechs Stufen bis zum
  Wohnblock, jeder mit voller Spec-Zeile (Größenklasse-Budget, fixer Footprint,
  Pivot, Front, Nodes).
- **Neue Prompt-Kataloge.** Ordner `animals/` für die A7-Weidetiere
  (Kuh/Schaf/Huhn/Pferd/Schwein/Ziege), Farm-Props (Feldreihen, Holzzaun, Tor,
  Vogelscheuche, Windmühle) und die A6-Stadtarbeit-Fahrzeuge (`logging_truck`,
  `flatbed`) im Fahrzeug-Katalog.

**Warum & Architektur.** §2 gewahrt — kein neues Doku-System, sondern der
bestehende Generator-Pfad erweitert: neuer reiner Builder
`src/assets/buildingSpecDocs.ts` (`buildBuildingsSpec`/`buildRegionsDoc`, leitet
aus `buildings.config`/`levels.config`/`regions.config` + i18n ab, importiert
nie Renderer/State — §1 gewahrt) und in `modelManifest.ts` neu
`BUILDING_STAGE_PROMPTS` (Motiv je Stufe), `BUILDING_SIZE_BUDGETS` (XS–XXL) und
`BUILDING_NODES`. Zwei Sync-Tests halten alles an der Config: neuer
`tests/buildingDocs.test.ts` (`WRITE_BUILDING_DOCS=1`) für BUILDINGS/REGIONS.md,
erweiterter `tests/modelReadmes.test.ts` erzwingt **Prompt-Anzahl ≡ Stufenzahl**
je Mehrstufen-Gebäude und verbietet verwaiste Stufen-Prompts. Nebenbei
bereinigt: die entfallenen `house_row`/`apartment` aus den Prompt-Daten
entfernt, die (hand­gepflegte, veraltete) Gebäude-Tabelle in
`3D_MODEL_MANIFEST.md` auf die aktuellen Größen/Stufen korrigiert und auf die
generierten Dokumente verwiesen.

**Auswirkung.** Artists bekommen pro Stufe genau einen fertigen Prompt und eine
verbindliche Tabelle, was das Modell leisten muss; die Doku kann nicht mehr von
der Config abweichen, ohne dass ein Test bricht.

**Verifikation.** `tsc`/`eslint`/`vitest` (181, davon 6 neu)/`build` grün. Alle
`WRITE_*`-Regens laufen sauber durch (Doku-Sync bewiesen). Reine Doku/Daten-
Phase ohne Renderer-Änderung — kein Screenshot-Smoke nötig.

**Dateien.** Neu: `src/assets/buildingSpecDocs.ts`, `tests/buildingDocs.test.ts`,
`docs/BUILDINGS.md`, `docs/REGIONS.md`, `src/assets/models/animals/PROMPTS.md`.
Geändert: `src/assets/modelManifest.ts` (`BUILDING_STAGE_PROMPTS`,
`BUILDING_SIZE_BUDGETS`, `BUILDING_NODES`, `buildBuildingsPrompts` je Stufe,
Weidetiere/Farm/Fahrzeug-Prompts), `tests/modelReadmes.test.ts`,
`docs/3D_MODEL_MANIFEST.md`, `docs/WORLD_REBUILD.md`, die generierten
`src/assets/models/**/PROMPTS.md`.

## v0.57 — Ausbaustufe 2.0, Phase A8: UI-Audit — Panels über der unteren Leiste

**Was.** Ein systematisches Layout-Audit aller Panels bei zwei Auflösungen
(1280×720 und 1920×1080) mit gefüllter Beispielstadt (§14 Auftrag B):

- **Bürgeranliegen ↔ untere Leiste behoben.** Auf niedrigen Auflösungen reichte
  das rechte „Stadt-Status"-/Bürgeranliegen-Widget bis zum Fensterboden und wurde
  von der unteren rechten Schnellleiste („Bauen"-Knopf + Quick-Bar) verdeckt bzw.
  angeschnitten. Rechts angedockte Info-Blätter (`.side-panel`: Stadtarbeit,
  Bürgermeister, Statistiken/Wirtschaft) hatten dasselbe Problem.
- **Reservierter Freiraum.** Neue CSS-Variable `--bottom-bar-clear` (120px)
  reserviert den vertikalen Platz der unteren Leiste. Rechte Panels enden jetzt
  garantiert darüber; ihr Inhalt scrollt intern (die Anliegen-Liste behält ihren
  „Alle Aufträge ansehen"-Fußknopf sichtbar).

**Warum & Architektur.** Reines Layout/CSS — keine Komponenten- oder
Simulationsänderung. Der Freiraum ist zentral als Variable gesetzt, statt an
mehreren Panels einzeln, damit künftige Panels denselben Wert erben. `.side-panel`
endet bei `calc(var(--hud-gap) + var(--bottom-bar-clear))`; die Anliegen-Liste
kappt ihre `max-height` um denselben Betrag.

**Auswirkung.** Auf 720p-Fenstern (und schmalen Desktop-Fenstern) bleiben alle
rechten Panels vollständig bedien- und lesbar, ohne die untere Leiste zu
überlappen. Auf 1080p+ unverändert (dort war ohnehin genug Höhe).

**Verifikation.** `tsc`/`eslint`/`vitest` (175)/`build` grün. Playwright-Smokes
je Auflösung mit Beispielstadt: Standardansicht, Bauen, Stadtarbeit,
Bürgermeister, Statistiken geöffnet — bei 1280×720 enden alle rechten Panels
sauber über der Leiste (vorher/nachher verglichen), bei 1920×1080 unverändert
korrekt, keine Konsolenfehler.

**Dateien.** `src/styles.css` (`--bottom-bar-clear`, `.side-panel` bottom,
`.citizen-requests` max-height).

## v0.56 — Ausbaustufe 2.0, Phase A7: Lebendige Welt — Farmen, Weidetiere, Biom-Deko

**Was.** Die Welt bekommt Leben zwischen den Gebäuden (§ Auftrag B, absorbiert
MVP4 P6):

- **Bauernhof als wachsendes Areal.** Fehlt ein `farm.glb`, baut der Renderer die
  Farm nicht mehr als Würfel, sondern als Hof-Ensemble, das mit der Stufe wächst
  (Bauernhof → Großfarm → Agrarkomplex): Ackerboden mit Feld-Furchen, Scheune mit
  Satteldach, **Silos** (Anzahl + Höhe je Stufe) und ein umlaufender Holzzaun mit
  Pfosten. (Liegt ein `farm.glb` vor — wie aktuell —, hat es weiter Vorrang; dies
  ist der garantierte Fallback.)
- **Weidetiere (animiert).** Jeder aktive Bauernhof bekommt Tiere (Kühe/Schafe/
  Hühner, mehr je Stufe), die auf einer **Weide neben** dem Hof grasen —
  gemächliches Wandern im Weide-Radius mit gelegentlichem Richtungswechsel und
  leichtem Wippen. Sie stehen auf freien Kacheln rund um das Grundstück (nie
  unter dem Gebäudemodell), gedeckelt bei 48 Tieren fürs Draw-Call-Budget.
- **Biom-Deko (instanziert, terrainabhängig).** Findlinge im Gebirge und Schilf
  an Wasserkanten (Seen/Flüsse) ergänzen die bestehenden Wald-/Busch-Instanzen —
  über denselben `InstancedMesh`-Pfad, mit Kappungen (je 400) und Distanz-Culling
  durch das Region-Rebuild.
- **Ferne Platzhalter-Inseln.** Ein Ring niedriger, bewaldeter Silhouetten (teils
  mit grauem Gipfel) weit außerhalb der Weltränder gibt dem Ozean einen Horizont
  statt ins Leere zu laufen. Einmalig mit dem Meer gebaut, rein kosmetisch.

**Warum & Architektur.** §2 gewahrt — erweitert wird der bestehende
Vegetations-/Live-Layer (`rebuildVegetation`, `liveGroup`, Animations-Loop),
kein neues System. Tiere laufen wie der Ambient-Verkehr über den Frame-Loop
(`seedAnimals` reseeded nur bei Farm-Änderung via `animalKey`; `animateAnimals`
bewegt sie). Farm-Ensemble/Tier-Meshes sind prozedurale Fallbacks — Drop-in-GLBs
(`farm.glb`, später `cow.glb` …) haben immer Vorrang (§5). Alles `three`-seitig,
die Simulation bleibt unberührt.

**Auswirkung.** Farmen fühlen sich als Höfe an statt als Klötze; die Landschaft
wirkt bewohnt. Grundlage für die spätere Landmarken-/Deko-Erweiterung.

**Umfang/Offen (ehrlich).** Der Kern steht (Farm-Ausbau, Tiere, Findlinge/Schilf,
Platzhalter-Inseln). Der vollständige Biom-Prop-Katalog (Wasserfälle, Heuballen,
Obsthaine, Windmühle, Pilze, Sandbänke, Boote) und dedizierte Landmarken bleiben
einer leichteren Folgepass (A10-Politur) überlassen — bewusst gesetzt, um A7
sauber und verifiziert zu landen.

**Verifikation.** `tsc`/`eslint`/`vitest` (175)/`build` grün. Playwright-Smokes:
Farm-Nahaufnahme (drei Farmen Stufe 0/1/2, Kühe/Schafe/Hühner grasen sichtbar in
den Weiden), Insel-Übersicht (alle Regionen frei: Gebirge/Wald/Seen korrekt,
Biom-Deko platziert, ferne Inseln am Horizont), keine Konsolenfehler.

**Dateien.** `ThreeMapRenderer.ts` (`farmProc`, `makeAnimalMesh`, `seedAnimals`/
`animateAnimals` + `animals`/`animalKey`, `ANIMAL_CAP`, Findling-/Schilf-Instanzen
in `rebuildVegetation`, `buildDistantIslands`, Farm-Zweig in `proceduralBuilding`).

## v0.55 — Ausbaustufe 2.0, Phase A6: Stadtarbeit selbst fahren — Fahrmodus + 5 Fahrmissionen

**Was.** Die Stadtarbeit wird zum echten Fahr-Minispiel (§9 Auftrag B): statt
Lieferziele nur anzuklicken, steigt der Spieler ins Missionsfahrzeug und fährt
selbst über das Straßennetz.

- **Fahrmodus (WASD / Pfeile, Verfolgerkamera).** Ein „Selbst fahren"-Knopf in
  der laufenden Stadtarbeit setzt den Spieler ans Steuer: Arcade-Fahrphysik
  (Gas/Bremse/Lenken) mit sanfter Führung auf die Fahrbahn — verlässt das
  Fahrzeug die Straße, wird es abgebremst und zur nächsten Straßenkachel
  gezogen. Die Kamera zieht als Verfolger hinter dem Fahrzeug her; ein
  schwebender Zielpfeil zeigt zum nächsten offenen Ziel. Erreicht man ein Ziel,
  schließt es sich automatisch ab (über denselben `progressActivity`-Command wie
  die Klick-Lieferung); ist die Mission fertig oder man drückt Q/Esc, endet die
  Fahrt und die normale Kamera kehrt zurück.
- **Fahr-HUD.** Unten mittig: Missionsname, Restzeit, verbleibende Ziele,
  Steuerungshinweis und „Fahrt beenden".
- **Fünf Missionstypen** (in der geforderten Reihenfolge), jede mit eigenem,
  deutlich unterscheidbarem Fahrzeug: **Lieferwagen** (Essen verteilen),
  **Feuerwehr** (Löschfahrzeug zu Bränden – Wohn/Gewerbe-Ziele, kein
  Materialverbrauch, Zufriedenheits-Bonus), **Holztransport** (Stämme vom
  Sägewerk NUR zu Lagern – Def-Id-Zielauswahl), **Polizei** (Streife zu breiten
  Einsatzorten), **Material** (Pritschenwagen zu Baustellen).

**Warum & Architektur.** CLAUDE.md §2 („erweitern statt neu bauen") ist bindend:
das bestehende Aktivitäts-System liefert bereits Angebote, Ziele, Zeitwertung
(Bronze/Silber/Gold) und Belohnungs-Bänder. Statt ein paralleles
`missions.config.ts` samt zweiter Save-Migration zu bauen, wurde `ActivityDef`
minimal erweitert (`drive`, `vehicle`, `targetCategories`, `targetDefIds`) und
die Zielauswahl im Controller um explizite Kategorien/Def-Ids ergänzt. **Kein
neues persistiertes State-Feld → keine zweite Migration.** Die Simulation bleibt
`three`/`react`-frei; der komplette Fahrmodus (Input, Verfolgerkamera,
Fahrzeug, Zielpfeil) lebt im Renderer und meldet erreichte Ziele über
`RendererCallbacks` zurück — die UI ruft den Command auf, nie der Renderer die
Simulation. Die Verfolgerkamera ist eine neue, reine Methode
`CameraController3D.setChase()` (unit-getestet).

**Auswirkung.** Aktive Stadtarbeit fühlt sich hands-on an; die Straßen (A5) und
der spätere Verkehr (A7) bekommen einen zweiten Zweck. Balancing der fünf
Missionen (Zeit, Belohnung, Level-Gates) ist gesetzt, wird in A10 feinjustiert.

**Zukunft.** A7 belebt Biome/Landwirtschaft; die Fahrzeuge bekommen in A9
eigene Tripo-Prompts/GLB-Slots (Drop-in bereits verdrahtet: `van`→`VAN_MODELS`,
übrige → `VEHICLE_CAR_MODELS`, sonst prozedurales Fallback).

**Verifikation.** `tsc`/`eslint`/`vitest` (175, davon neu: `missions.test.ts` 6
für Zielauswahl/Belohnung/Gating der 5 Fahrmissionen + 2 Chase-Kamera-Tests in
`camera.test.ts`)/`build` grün. Playwright-Fahr-Smoke (Save mit laufender
Mission → „Selbst fahren" → WASD): Fahrzeug + Verfolgerkamera + Zielpfeil + HUD
sichtbar, keine Konsolenfehler.

**Dateien.** Sim: `config/types.ts` + `config/schemas.ts` (Drive-Felder),
`config/activities.config.ts` (5 Fahrmissionen), `commands/controller.ts`
(`activityCandidates` mit Kategorie/Def-Id-Auswahl). Renderer/UI:
`CameraController3D.ts` (`setChase`), `ThreeMapRenderer.ts` (Fahrmodus:
`enterDrive`/`exitDrive`/`updateDrive`/`makeMissionVehicle`/`makeDriveArrow`),
`IMapRenderer.ts` + `state/store.ts` (`driveActive`, MapApi-Fahrmethoden,
Callbacks), `MapView.tsx`, `panels/CityWorkPanel.tsx` (Fahren-Knopf),
`hud/DriveHud.tsx` (neu), `App.tsx`, `styles.css`, `i18n/de.json`.
Tests: `tests/missions.test.ts` (neu), `tests/camera.test.ts`.

## v0.54 — Ausbaustufe 2.0, Phase A5: Straßen-Redesign — heller, Gehwege, Laternen

**Was.** Die Straßen wirkten „zu schwarz" und zu nackt (§11 Auftrag B) — jetzt
lesen sie sich als echte Stadtstraßen:

- **Hellere Fahrbahn.** Der Asphalt ist von 0x474d57 auf ein mittleres Grau
  aufgehellt. Weil die Drop-in-Textur `road_asphalt` die Materialfarbe nur
  MULTIPLIZIERT (also nie aufhellen kann), hebt ein dezenter Emissiv-Term die
  Schwärze — die Fahrbahn bleibt bei Tag UND Nacht gut lesbar, mit leichter,
  erwünschter Eigenhelligkeit. Gebirgsstraßen entsprechend.
- **Gehwege.** Offene Straßenkanten (ohne Anschluss) tragen jetzt einen hellen
  Beton-Bürgersteig mit dünnem Bordstein davor statt einer nackten Erdkante —
  die Straßenzüge bekommen Struktur und wirken bewohnt.
- **Straßenlaternen.** Sparsam und deterministisch (~jede vierte Randkachel)
  steht eine Laterne an der offenen Kante: Mast, Ausleger, emissiver Kopf, der
  nachts leuchtet. Belebt die Straßen ohne die Draw-Calls zu sprengen.
- **Ambient-Verkehr** (bereits vorhanden) fährt weiter auf dem Straßennetz
  (Haus → Ziel), jetzt auf den überarbeiteten Straßen.

**Warum.** §11 Auftrag B nennt die Straßen als konkreten Prototyp-Tell („zu
schwarz, zu gerade"). Helligkeit, Gehwege und Laternen sind die drei Hebel, die
aus grauen Balken lebendige Straßenzüge machen — Grundlage für den Fahrmodus
(A6) und die belebte Welt (A7).

**Verifikation.** `tsc`/`eslint`/`vitest` (167)/`build` grün.
Playwright-Screenshots (Straßennetz-Save, Tag + Nacht): Fahrbahn hell und
lesbar, Gehweg-Ränder, leuchtende Laternen bei Nacht, Verkehr auf den Straßen,
keine Konsolenfehler.

**Dateien.** `ThreeMapRenderer.ts` (`getRoadMats` heller + `sidewalk`/`lampPost`/
`lampHead`, `buildRoadTile` Gehwege + Laternen, Tile-Koordinaten durchgereicht).

## v0.53 — Ausbaustufe 2.0, Phase A4: Regionen mit Charakter — Boni, Vorschau, Bürger-Hinweise

**Was.** Die organischen Landschaften bekommen spürbaren Charakter und werden
zur echten strategischen Entscheidung (absorbiert MVP4 P5):

- **Produktions-Boni & -Mali wirken.** `productionModifiers` einer Region
  fließen jetzt in die Produktion jedes Betriebs auf ihrem Boden — Wälder
  +40–50 % Holz, Fruchtdelta +35 % Nahrung, Gebirge +50 % Stein bei −30 %
  Nahrung. Der Faktor läuft über denselben Bonus-Pfad wie der Standort-Bonus
  (auch NEGATIVE Werte werden gespeichert, sonst produziert der Tick voll,
  während das Derived-Total reduziert ist — der Fix hält beide konsistent, bei
  −100 % gekappt). Die **Startregion „Lichtungsland" ist bewusst neutral** — der
  Bezugspunkt, an dem sich die Vor-/Nachteile der Expansion messen.
- **Teurere Straßen im Gebirge.** `roadCostFactor` verteuert Straßen beim Bau in
  rauen Regionen (Gebirge bis ×2). `getBuildCost` bezieht die Zielkachel ein —
  der Ghost/das Menü zeigt den ortsgenauen Preis, gezahlt wird genau das.
- **Charakter-Vorschau VOR der Freischaltung (§5 Auftrag B).** Der RegionDialog
  zeigt für jede Landschaft — auch gesperrt — Baufläche und alle Vor-/Nachteile
  mit Pfeil-Icons und Prozenten (grün = Vorteil, rot = Nachteil, Straßenkosten
  als Nachteil markiert). Der Spieler weiß, was er kauft, bevor er zahlt.
- **Bürger weisen den Weg (§4 Auftrag B).** Wird mit einem Level-Up eine
  angrenzende Landschaft neu erschließbar, posten Kundschafter einen Hinweis in
  die Bürgermeister-Nachrichten — mit Himmelsrichtung („Im Norden …") und
  Kurzcharakter („reich an Wäldern"). Führung über die Bürger, nicht übers Menü.
- **Regions-Vokabular durchgezogen.** Quest- und Distrikt-Texte sprechen von
  „Landschaften" statt „Sektoren".

**Warum.** §3/§4/§5 Auftrag B verlangen Landschaften mit echten Vorteilen und
Nachteilen, die vor dem Kauf sichtbar sind und über die Bürger nahegelegt
werden — nicht 36 austauschbare Quadrate. Erst dadurch wird Erschließung eine
Abwägung (billiges Bauland vs. teures Gebirge mit viel Stein).

**Verifikation.** `tsc`/`eslint`/`vitest` (167: neue Tests für
Produktions-/Straßen-Faktoren pro Region, neutrale Startregion, ortsabhängige
Straßenkosten, Bürger-Hinweis beim Level-Up)/`build` grün.
Playwright-Screenshot: RegionDialog „Westanger" mit Baufläche 3225,
Nahrungs-/Holzertrag +10 %, Kosten, Freischalten.

**Dateien.** `map/world.ts` (`regionProductionFactorAt`/
`regionRoadCostFactorAt`), `simulation/derived.ts` (Regions-Bonus, negativer
Bonus gespeichert), `commands/controller.ts` (`getBuildCost` ortsabhängig),
`progression/levels.ts` (Bürger-Hinweise), `config/regions.config.ts`
(Startregion neutral), `panels/RegionDialog.tsx` + `styles.css` (Vorschau),
`i18n/de.json`, `tests/regions.test.ts`.

## v0.52 — Ausbaustufe 2.0, Phase A3: Größenklassen, organischer Nebel, Biom-Splat

**Was.** Der Renderer setzt das Gebäudesystem-2.0-Datenmodell und die
organischen Regionen jetzt sichtbar um (Renderer-Basis, absorbiert MVP4 P4):

- **Bauhöhe nach Größenklasse.** `SIZE_CLASS_HEIGHT` (XS 0,3 · S 1 · M 1,4 ·
  L 2,2 · XL 3 · XXL 4) ersetzt die alte Kategorie-Höhe — die Silhouette folgt
  der Bedeutung des Gebäudes, nicht seiner Sparte. Stufen erhöhen zusätzlich,
  auf ×3 gedeckelt (`visual.heightClass` bleibt Override). Straßen (XS) wirken
  endlich flach neben Häusern, Kraftwerk/Klinik ragen.
- **Ensemble-Fallbacks für große Grundstücke.** Prozedurale Gebäude der
  Klassen L/XL/XXL (Spannweite ≥ 4) füllen ihr Grundstück als Ensemble —
  Hofplatte + Hauptbau + Nebenflügel (XXL: dritter Baukörper) — statt als ein
  Riesen-Würfel. Der Windpark (7×7) verteilt mehrere Turbinen übers Areal
  (erste animiert). Kleine Klassen behalten den kompakten Block. Bis neue
  Stufen-GLBs eingelegt sind (A9-Prompts), lesen sich große Bauten so als
  glaubwürdige Anlagen statt als Klötze.
- **Organischer Regions-Nebel.** Jede gesperrte Landschaft trägt ein
  Nebel-Volumen entlang ihrer ECHTEN organischen Grenze: die Randkontur wird
  aus dem Region-Grid extrahiert (gerichtete Randkanten → Loop-Verkettung =
  Marching Squares auf Binärmasken), zweifach Chaikin-geglättet und zu einer
  bodennahen Dunstdecke extrudiert (≤ 7 Einheiten hoch, oben ausdünnend).
  Silhouetten des dominanten Bioms (Gebirgsgipfel, Baumwipfel, Hügel) ragen
  als Teaser aus dem Dunst (§6 Auftrag B: man ahnt, was dort wartet). Ein
  Region-Unlock startet die weiche Aufdeck-Animation (aufsteigender,
  ausdünnender Nebel). Kein Rechteck mehr — der alte Sektor-Nebel ist Geschichte.
- **Biom-gewichteter Splat.** Der Boden-Shader liest ein neues
  Biom-Vertex-Attribut (aus dem gebackenen Terrain-Grid interpoliert):
  Waldboden, Ackerland und Küstensand erscheinen ORTSGENAU dort, wo Wald/
  fruchtbar/Sand liegen — nicht nur höhenweise. Fels/Klippe/Gebirge/Schnee
  kommen weiter aus Höhe & Hang. Acht Splat-Ebenen (grass, forest_floor,
  farmland, sand_coast, rock, cliff, mountain, snow), jede Drop-in — fehlt die
  Textur, blendet die Ebene sauber auf die stilisierte Vertex-Farbe zurück
  (nie kaputt). De-Tiling bleibt.

**Warum.** Beide Aufträge verlangen, dass die Welt kein technischer Prototyp
mehr ist (§15 Auftrag B): glaubwürdige Größenverhältnisse (§3 Auftrag A) und
Landschaften mit Charakter, die man schon vernebelt ahnt (§6 Auftrag B). Das
ist die Renderer-Grundlage, auf der A4 (Boni-Vorschau) und A7 (Biom-Deko)
aufsetzen.

**Verifikation.** `tsc`/`eslint`/`vitest` (164)/`build` grün.
Playwright-Screenshots (vite preview, WebGL): Insel-Overview mit
organischem Nebel entlang der Regionsgrenzen (Gipfel ragen heraus,
Startregion klar), Größenvergleich Straße ≪ Wohnhaus 3×3 < Feuerwache 5×5 <
Windpark 7×7 < Rathaus 5×5, keine Konsolenfehler.

**Dateien.** `ThreeMapRenderer.ts` (`SIZE_CLASS_HEIGHT`/`buildingHeight`,
Ensemble-Fallbacks, Region-Nebel `regionContour`/`chaikin`/`buildRegionFog`/
`animateFog`, Biom-Vertex-Attribut + erweiterter Splat-Shader).

## v0.51 — Ausbaustufe 2.0, Phase A2: Save-v11-Migration mit 100 %-Erstattung

**Was.** Die in v0.50 angekündigte echte Migration v10→v11 ist da — CLAUDE.md
§3 („Saves brechen nie") gilt für Insel-Saves wieder uneingeschränkt. Eine
**einzige gebündelte Migration** (vom Nutzer so entschieden) übernimmt beide
Datenmodell-Umbauten:

- **Rathaus-Umzug:** deterministisch auf den neuen 5×5-Bake-Start (183,189);
  die 5 gebackenen Startstraßen werden gratis ergänzt, wenn die Kacheln frei
  sind.
- **Sektoren → Regionen per Mehrheits-Überlappung:** Eine organische Region
  gilt als freigeschaltet, wenn die Mehrheit ihrer Kacheln in zuvor
  freigeschalteten 64er-Quadrat-Sektoren lag; die Startregion immer, Teaser-
  Regionen (Nebelinsel) nie. Distrikt-Zentren binden ihre Region an ihren
  Distrikt; Distrikte ohne überlebendes Zentrum lösen sich auf.
- **Gebäude-Prüfung mit 100 %-Erstattung zu ALTEN Preisen:** In
  deterministischer Reihenfolge (Rathaus → Zentren → Rest nach Id) wird jedes
  Gebäude gegen die neue Welt geprüft (inkrementelle Belegung, Terrain,
  Regions-Status — Straßenanschluss bewusst nicht, das bleibt ein
  Diagnose-Hinweis). Entfallene Defs (`house_row`, `apartment`) und Gebäude,
  deren gewachsener Footprint kollidiert, werden abgerissen und vollständig
  erstattet. Die alten v10-Preise dafür liegen eingefroren in der neuen
  `src/game/storage/legacyCosts.ts` — der Spieler bekommt zurück, was er
  wirklich bezahlt hat. Überzählige Ausbaustufen (Sägewerk 3, Steinbruch 3,
  Farm 3, Wasserpumpe 2) werden geclampt und die alten Spätstufen erstattet;
  laufende Upgrades auf entfallene Stufen ebenso.
- **Level-Rederivierung** aus den unveränderten XP mit der neuen
  20-Level-Kurve; `stats.sectorsUnlocked` → `stats.regionsUnlocked`;
  Brände/Aktivitäts-Ziele/Quests auf entfernte Gebäude werden bereinigt.
- **Einmaliger Hinweis:** Die Migration meldet eine Zusammenfassung
  (`consumeMigrationNotice()` → Adapter-Feld `migrationNotice`, Muster
  `legacyBackupCreated`); die App zeigt einmalig einen Toast — mit Anzahl und
  Erstattungssumme, falls Gebäude weichen mussten.

**Warum.** Die fixierte Nutzer-Entscheidung: kein Reset, sondern Migration mit
voller Erstattung. Ein v10-Spieler landet ohne Verlust in der neuen Welt —
schlimmstenfalls mit einem prallen Konto und ein paar Bauplätzen zum
Neuverteilen.

**Verifikation.** `tsc`/`eslint`/`vitest` (164 Tests: 5 neue
Migrations-Tests mit v10-Fixtures — Rathaus-Umzug/Regions-Stubs, Erstattung
entfallener Defs, Footprint-Kollision 2×2→3×3, Stufen-Clamp,
Sektor-Mehrheit + Teaser-Sperre)/`build` grün. Browser-Migrations-Smoke
(Playwright, echter v10-Save in localStorage): Toast „Ausbaustufe 2.0 …
erstattet" erscheint, Re-Save trägt v11, 32 Regionen, Sektoren entfernt,
Erstattung exakt (Geld/Holz/Stein), Rathaus samt Startstraßen am neuen
Standort, keine Konsolenfehler.

**Dateien.** `migrations.ts` (Migration 10→11 + `MigrationNotice`),
`legacyCosts.ts` (neu, eingefrorene v10-Preise), `localStorageAdapter.ts`,
`App.tsx`, `de.json` (`ui.migration.v11_*`), `tests/storage.test.ts`,
`docs/SAVE_MIGRATION.md`.

## v0.50 — Ausbaustufe 2.0, Phase A1: Gebäudesystem-2.0-Datenmodell + organische Regionen

**Was.** Erste Phase des kombinierten Programms „Ausbaustufe 2.0"
(Gebäudesystem 2.0 + Welt 2.0, Plan siehe Programm-Briefing; ersetzt die
offenen MVP4-Phasen P4–P8). A1 baut das komplette Sim-Fundament um — Schema
v11 (Migration folgt in A2, bis dahin gilt ein frischer Start):

- **Gebäudesystem 2.0 — neue Footprints & Größenklassen.** Alle 31 Gebäude
  haben ein neues Pflichtfeld `sizeClass` (XS 1×1 · S 2×2 · M 3×3 · L 4×4–5×5 ·
  XL 6×6–7×7 · XXL 8×8) und realistische, **fixe quadratische** Footprints:
  Rathaus 5×5, Feuerwache 5×5 (Vorplatz/Garagen/Hof), Krankenhaus 6×6,
  Kraftwerk 8×8, Windpark 7×7, Farm 6×6, Wohnhaus 3×3, Sägewerk 4×4,
  Steinbruch 5×5 u. v. m. Straßen (1×1) wirken damit endlich schmaler als
  Häuser — die prototypischen Größenverhältnisse sind Geschichte. Der
  Zod-Cap für Footprints stieg von 4 auf 12.
- **Weniger, markantere Ausbaustufen.** Stufenregeln pro Kategorie (Deko 1 ·
  Geschäfte 2 · Versorgung 2–3 · Industrie 3 · Verwaltung 3–4 · Wohnen eigene
  Ketten · Landmarken 1), per Test erzwungen. **Hybrid-Wohnkette:**
  `house_small` mit 6 Stufen (Kleines Haus → … → Wohnblock, Gates L3/6/9/12/15),
  `residential_tower` als eigenes Spätgebäude ab L15 (Wohnturm → Hochhaus →
  Wolkenkratzer L20); **`house_row` und `apartment` entfallen** (A2 erstattet).
  Level 15 ist das bewusste „Metropol-Band" (Wohnblock + Wohnturm zusammen).
- **20 Level statt 14.** XP-Kurve fortgeschrieben (~×1,3/Level, L20 = 100.000);
  L15–L20 gaten die Top-Stufen (Büroturm L18, Universitätsklinikum L19,
  Wolkenkratzer L20, Monumentalrathaus/Großkraftwerk/Einsatzzentrum L16 …).
- **Welt 2.0 — organische Regionen ersetzen die 36 Quadrat-Sektoren.** Der
  Bake (`tools/bakeWorld.mjs`) segmentiert die Insel deterministisch in **32
  organische Landschaften**: Seeds auf Biom-Clustern, kostenbasiertes
  Dijkstra-Wachstum (Biomgrenzen +4, Flussquerung +6, Höhendelta ×4),
  Mini-Regionen werden gemerged. Output: `islandRegions.gen.ts`
  (Region-Id-Grid + Statistik/Adjazenzgraph), Vorschau-PNG mit
  Regionsgrenzen, Report-Tabelle. Ozean = Region 0, nie freischaltbar;
  Region 32 „Nebelinsel" ist ein bewusst unerreichbarer Teaser.
- **`regions.config.ts` ersetzt `sectors.config.ts`:** 32 deutsche
  Landschaftsnamen (Lichtungsland, Fruchtdelta, Hochgebirgskern, …), pro
  Region Charakter mit Vor- UND Nachteilen (`productionModifiers`,
  `roadCostFactor` bis 2× im Hochgebirge — wirksam ab A4), explizite
  Freischaltkosten (320k–1,8 M), Level-Gates bis L18, Voraussetzungs-Regionen
  (⊆ gebackene Adjazenz, per Config-Check erzwungen). Freischaltung nur
  angrenzend an bereits freigeschaltetes Gebiet.
- **Startlage neu:** Startregion „Lichtungsland" (Region 2, 5.993 bebaubare
  Kacheln), Rathaus 5×5 auf validiertem 7×7-Grasblock (183,189), 5
  Startstraßen an der Südkante.
- **2D-Pixi-Renderer entfernt** (aus A10 vorgezogen, statt toten Code auf
  Regionen zu portieren): `MapRenderer.ts`/`projection.ts` gelöscht, Moduswahl
  raus — das Spiel ist 3D-only. Gesperrte Regionen erscheinen interim als
  organisch gedimmter Boden (kein Rechteck-Nebel mehr); der hochwertige
  Silhouetten-Nebel kommt in A3.

**Warum.** Beide Nutzer-Aufträge verlangen dasselbe Fundament: Footprints und
Stufenketten sind die Basis für Doku/Prompts/Assets (Auftrag A §13), das
Region-Grid die Basis für Nebel, Boni-Vorschau und Bürger-Hinweise (Auftrag B).
Ein gemeinsamer Datenmodell-Schnitt (ein Schema-Sprung v11) vermeidet zwei
Migrationen hintereinander.

**Auswirkung.** Neustart nötig bis A2 die v10→v11-Migration liefert (mit
100 % Erstattung entfallener Gebäude). Saves bleiben schlank (Region-Stubs,
nie Terrain). Bestehende GLBs werden auf die größeren Footprints skaliert —
bis neue Stufen-Modelle eingelegt sind, wirken einige grob (A9 liefert die
Prompts je Stufe).

**Verifikation.** `tsc`/`eslint`/`vitest` (159 Tests, 24 Dateien)/`build`
grün; Playwright-Screenshot-Smoke (vite preview, WebGL): organische
Startregion sichtbar, gesperrte Regionen gedimmt, keine Konsolenfehler.

**Dateien.** `tools/bakeWorld.mjs` (Segmentierung), `islandRegions.gen.ts`
(neu), `islandTerrain.gen.ts` (Re-Bake), `regions.config.ts` (neu,
`sectors.config.ts` gelöscht), `buildings.config.ts` (Neutabelle),
`levels.config.ts` (20 Level), `quests.config.ts`, `types.ts`/`schemas.ts`,
`newGame.ts` (v11), `map/world.ts`, `controller.ts` (`unlockRegion`),
`placement.ts`, `startRegion.config.ts`, `de.json` (Regions-/Stufen-Keys),
`RegionDialog.tsx` (neu, `SectorDialog.tsx` gelöscht), `MapView.tsx`,
`IMapRenderer.ts`, `ThreeMapRenderer.ts`, `CameraConfig.ts`,
`MapRenderer.ts`/`projection.ts` (gelöscht), Tests umfassend
(`regions.test.ts` neu, `sectors.test.ts` gelöscht).

## v0.49 — Die Insel wird sichtbar: Renderer-Terrain (MVP4 P3)

**Was.** Phase 3 des Welt-Neuaufbaus (`docs/WORLD_REBUILD.md`): Der Renderer
zeichnet jetzt die GEBACKENE Insel statt der prozeduralen Typ-Höhen.
- **Höhen aus dem Bake:** `terrainHeightAt` sampelt `worldHeight.gen.ts`
  (769×769 Uint16, smoothstep-bilinear, C1-stetig) — Inselform, Gebirge (~20
  Einheiten), Seebecken, Flussrinnen und Ozean-Tiefenrampe sind exakt die
  Referenz-Geografie. Die alte BASE-/Noise-Logik ist ersetzt; `SPLAT_BANDS`
  exportiert die Shader-Höhenbänder aus derselben Quelle (Duplikation tot).
- **Chunk-Boden:** Das 384²-Mesh ist in 8×8 Chunks à 48 Kacheln (~9,4k Verts)
  zerlegt — Frustum-Culling pro Chunk, ein Sektor-Unlock baut nur die ~4
  betroffenen Chunks neu statt 600k Vertices. Farb-/Dimm-Logik unverändert.
- **Ein Ozean:** Eine 4096²-Wellen-Ebene auf `WATER_LEVEL` umgibt die Insel bis
  zum Horizont und füllt zugleich Seen/Flüsse (Becken liegen unter der
  Wasserlinie). Das Kachel-Wasser-Instancing ist komplett entfernt.
- **Kamera & Licht auf Inselmaß:** `maxDist` 200→480, Overview-Preset 420
  (ganze Insel), Distanz-Fog 180–520 → 520–1600 (Überblick bleibt klar, Horizont
  verläuft atmosphärisch), Sonnen-/Schatten-Frustum folgt dem Kamera-Fokus
  (vorher fix am Ursprung — die Stadt läge außerhalb des ±140-Fensters).
- **Bake-Härtung:** Bebaubar-Glättung deutlich strenger (max. ΔH ≈ 0,14/Kachel,
  Kappungs-Sweeps bis Konvergenz) — Gebäude sitzen sauber, ohne lokale Einebnung.

**Verifikation.** tsc/eslint/vitest (155)/build grün; Screenshots: Insel-Overview
(Form = Referenz, klar statt milchig), Startsektor-Nahsicht (Rathaus, Wald, de-
tiled Gras), keine Konsolenfehler. **Dateien.** `terrainHeight.ts` (neu),
`ThreeMapRenderer.ts` (Chunks/Ozean/Bänder), `SkyEnvironment.ts` (Schatten-Follow,
Fog), `CameraConfig.ts`, `tools/bakeWorld.mjs`, Gen-Dateien, `tests/terrainHeight.test.ts`.

## v0.48 — Die Insel: Welt-Neuaufbau P1+P2 (MVP4, Schema v10)

**Was.** Beginn des verbindlichen Welt-Neuaufbaus (Auftrag „Kompletter
Map-Neuaufbau"): Die handdesignte 128×80-Testkarte ist vollständig ersetzt durch
eine **384×384-Insel**, deren Form 1:1 aus der Referenz-GLB
`reference/stylized island map 3d model.glb` gebacken wird. Phasen 1+2 von 8
(`docs/WORLD_REBUILD.md`):
- **P1 — Bake-Pipeline:** `tools/bakeWorld.mjs` rastert alle 1,87 M Dreiecke der
  GLB top-down (baryzentrisch, Max-Y), klassifiziert Wasser per Flood-Fill
  (Ozean/See/Fluss-Rinnen), leitet Biome regelbasiert ab (Höhe/Hang/Wassernähe/
  Noise), glättet bebaubares Land (die Sim kennt keine Hangprüfung) und wählt/
  validiert den Start (Sektor (2,3), 3.933 bebaubare Kacheln, Rathaus (157,221)
  auf einem 5×6-Gras-Block). Committete Outputs: `islandTerrain.gen.ts` (Sim,
  ~200 KB), `worldHeight.gen.ts` (Renderer, ~1,6 MB), `tools/bake-report.md`,
  `tools/bake-preview.png`. Die GLB (45 MB) shippt NIE im Bundle.
- **P2 — Sim-Welt-Tausch:** `SECTOR_SIZE` 16→64 → **6×6 = 36 strategische
  Groß-Sektoren** à 4.096 Kacheln, jeder mit datengetriebener Identität in der
  neuen `sectors.config.ts` (Zod-validiert): deutscher Name, Biom (zentrum/ebene/
  wald/gebirge/huegel/see/kueste/fruchtbar/ozean), explizite Freischaltkosten
  (250k–1,8 M statt Formel), Level-Gates, Voraussetzungs-Sektoren (Gebirgskern
  braucht beide Randsektoren), Produktions-Modifikatoren (ab P5 wirksam),
  nie freischaltbare Ozean-Sektoren. `terrainAt()` liest das Gen-Grid.

**Savegames (Schema v10, § docs/SAVE_MIGRATION.md).** Zwei Änderungen:
1. **Slim-Save:** Sektoren persistieren nur noch `{id,sx,sy,districtId,status}` —
   Terrain wird NIE mehr gespeichert (deterministisch ableitbar), Belegung kommt
   aus einem Laufzeit-Index über die Gebäude (`rebuildOccupancyIndex`,
   `occupyTiles`/`clearTiles`). Saves: ~500 KB → wenige KB.
2. **Vor-Insel-Saves (≤ v9):** NICHT migrierbar (andere Geografie — Gebäude lägen
   im Ozean). Sie werden einmalig unter `cmb.save.backup.v9` gesichert, der Slot
   geräumt, das Spiel startet frisch mit freundlicher Meldung. **Bewusst
   sanktionierte, einmalige Ausnahme von CLAUDE.md §3** (Nutzer-Entscheidung
   „Harter Neustart + Backup", Auftrag §22). Ab v10 gilt der Vertrag wieder.

**Architektur.** Sim bleibt UI-/Rendering-frei (CLAUDE.md §1): die Gen-Dateien
sind pure base64-Daten, synchron dekodiert, node-/vitest-tauglich. API-Formen
(`terrainAt`, `startRegionConfig`, `tileAt`) blieben stabil — Kamera und Renderer
liefen ohne Anpassung weiter; nur die `.tiles`-Lesestellen der Renderer wurden
auf das Grid umgestellt. `unlockSector` konsultiert jetzt die SectorDefinition.
Kachel-Sichten (`tileAt`) sind ABGELEITET — Belegungs-Mutationen laufen
ausschließlich über die Occupancy-Helfer.

**Auswirkung.** Neue Spiele starten auf der Insel (Startsektor „Inselmitte");
14× mehr Welt, 36 Sektor-Entscheidungen mit Biom-Identität; NewGame ohne
147k-Kachel-Materialisierung; Screenshot-Smoke bestätigt: Insel-Geografie
(Südsee, Wälder, Gebirgs-Outcrops, Buchten) im Spiel sichtbar, Quests/HUD/
Platzierung funktionieren, keine Konsolenfehler.

**Zukunft (P3–P8).** Renderer-Terrain aus dem Höhen-Bake (Chunks, echter Ozean,
Kamera 480, Schatten-Follow), Splat-Ausbau mit allen 31 Texturen, Sektor-Boni in
der Wirtschaft, Wald-Cluster/Landmarken/Placeholder-Inseln, Balancing, Bereinigung
(2D-Renderer-Ausbau, Legacy-Dateien) + Performance-Pass.

**Verifikation.** `npx tsc -b --force` · `npx eslint src tests` · `npx vitest
run` (**155 Tests, 24 Dateien**) · `npm run build` · Playwright-Screenshot-Smoke.
Tests umfassend angepasst: Koordinaten mechanisch +134/+198 (altes Rathaus-
Relativ-Muster blieb erhalten), `flattenTerrain` jetzt Override-basiert,
neue `world.gen.test.ts` (Bake-Integrität, Startgarantien, Config-Sync),
Storage-Tests auf v10/Legacy-Backup umgestellt.

**Dateien.** Neu: `tools/bakeWorld.mjs`, `tools/bake-report.md`,
`tools/bake-preview.png`, `reference/` (beide GLBs + README),
`src/game/config/world/islandTerrain.gen.ts`, `src/renderer/three/worldHeight.gen.ts`,
`src/game/config/sectors.config.ts`, `tests/world.gen.test.ts`,
`docs/WORLD_REBUILD.md`, `docs/WORLD_SCALE.md`, `docs/SAVE_MIGRATION.md`.
Geändert: `startRegion.config.ts` (Gen-Grid), `map/world.ts` (Slim/Occupancy),
`types.ts`, `schemas.ts`, `config/index.ts`+`config/types.ts` (SectorDef),
`newGame.ts` (v10), `storage/migrations.ts` (Legacy-Fehler),
`storage/localStorageAdapter.ts` (Backup), `commands/controller.ts`,
`ThreeMapRenderer.ts`+`MapRenderer.ts` (Grid-Reads), `App.tsx`, `i18n/de.json`
(36 Sektornamen, Biome, Legacy-Meldung), `eslint.config.js` (\*.gen.ts ignoriert),
Tests breit.

## v0.47 — Atmosphäre & Licht (MVP3 Phase 2)

**Was.** Zweite Phase der MVP3-Weltneugestaltung (Reihenfolge vom Nutzer gewählt:
Atmosphäre & Licht → Kanten/Gitter → Vegetation → Wasser). Ziel: die Szene vom
harten „Test-Render"-Look zum warmen, hochwertigen Manor-Lords-/Foundation-Gefühl
bringen — ohne Gameplay/Straßen/Wirtschaft/Savegames anzufassen.
- **Filmisches Tone Mapping:** Der Renderer nutzt jetzt `ACESFilmicToneMapping`
  (Exposure `1.2`) statt der harten linearen Ausgabe. Helle Himmel-/Sonnen-Spitzen
  rollen weich aus, statt flach auf Weiß zu clippen — Mitten und Farben wirken
  organischer und weniger „digital".
- **Weiche Schatten:** `shadowMap.type = PCFSoftShadowMap` plus am Sonnenlicht
  `shadow.radius = 3.5` — die harten, gezackten Schattenkanten (die das neue
  terrassierte Gelände sonst betont hätte) werden zu sanften Kontaktschatten.
- **Kein Schatten-Flimmern auf Terrassen:** `shadow.normalBias = 0.6` und
  `shadow.bias = -0.0004` unterdrücken die Selbst-Schatten-Artefakte (Shadow Acne)
  an den neuen steilen Gebirgs-Absätzen, ohne sichtbares „Peter-Panning".
- **Sanftes Füll-/Bounce-Licht:** Die Tag-Keyframes der Grade-Kurve
  (`environment.ts`) heben `ambient` leicht an und wärmen `hemiGround` — weil ACES
  Schatten tiefer zieht, hält dieses weiche Fülllicht Gelände- und Gebirgsflächen
  im Schatten lesbar und warm. Nacht-Keys bleiben unangetastet (Tag/Nacht-Kontrast
  und Sterne unverändert).

**Warum.** Beleuchtung/Tonwert ist der visuell höchste Hebel pro Aufwand: Er
verändert die *ganze* Welt sofort, ohne neue Assets, und legt die Basis, auf der
die nächsten Phasen (entschärfte Kanten, Vegetation, Wasser) erst richtig wirken.

**Architektur.** Rein präsentationsseitig (CLAUDE.md §1): nur Renderer- und
Grade-Werte, keine Sim-Berührung, **keine `SCHEMA_VERSION`-Änderung**, keine
Migration. Die Grade-Kurve ist weiterhin die pure, in Node testbare Mathematik aus
`environment.ts`; die vorhandenen `environment.test.ts`-Invarianten (Mittag heller
als Mitternacht, Ambient nachts > 0.05, Sterne nur nachts, sauberer Mitternachts-
Wrap) bleiben erfüllt. **Ein** Draw-Call/Direkt-Render bleibt erhalten — kein
Post-Processing-Pipeline-Overhead.

**Bloom bewusst verworfen.** Ein subtiler UnrealBloom (EffectComposer → RenderPass
→ UnrealBloomPass → OutputPass, multisampled HalfFloat-Target für erhaltenes MSAA)
wurde implementiert und im Screenshot-Smoke getestet, aber wieder entfernt: Die
Szene ist SDR-authored — nach Summe aus Sonne + Hemisphäre + Ambient liegt schon
das Gras bei Luminanz ~1.0, es gibt keine saubere HDR-Highlight-Trennung. Jede
Schwelle, die die Sonne zum Glühen bringt, wäscht auch die Wiese aus; jede
Schwelle, die die Wiese verschont, lässt nichts glühen. Ein sinnvoller Bloom
braucht zuerst echte HDR-Emissives (Nacht-Fenster, Sonne, Marker heller als 1.0) —
das ist ein eigener Folge-Schritt, kein Beiwerk dieser Licht-Phase.

**Auswirkung.** Deutlich weichere, wärmere Tageslicht-Szene; sanfte Schatten auf
Terrain/Gebäuden; keine Konsolen-/Render-Fehler; Performance unverändert (kein
zusätzlicher Pass). Golden-Hour liest jetzt als stimmungsvolle Dämmerung
(tieferes Bodenlicht bei tiefstehender Sonne) — bewusst akzeptiert, da Default-Zeit
Vormittag/Tag ist.

**Zukunft.** Nächste MVP3-Phasen: Kachel-Gitterlinien entschärfen/organische
Terrain-Ränder, Vegetation/Wald-Patches, Wasser-/Küsten-Shader. Danach optional:
HDR-Emissives + Bloom, Fog-of-War-Atmosphäre pro Sektor.

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest run`
(152 Tests), `npm run build`; 3D-Screenshot-Smoke (Playwright, `vite preview`,
Basis `/`) bei Mittag, Golden-Hour, Nacht und Default-Vormittag.

**Dateien.** Geändert: `src/renderer/three/ThreeMapRenderer.ts`,
`src/renderer/three/SkyEnvironment.ts`, `src/renderer/three/environment.ts`,
`docs/3D_WORLD_ASSETS.md`, `docs/PATCHNOTES.md`.

## v0.46 — Organisches Terrain-Mesh (MVP3 Phase 1)

**Was.** Der Nutzer hat ein großes Vision-Dokument/Mockup für eine
Weltneugestaltung ("MVP3", Referenzen: Manor Lords, Foundation, Fabledom,
Kingdoms Reborn) geteilt und als erste, fundamentale Phase das **organische
Terrain-Mesh** gewählt. Statt eines Neubaus (die Welt hat seit v0.39 bereits
ein echtes Höhenfeld) wird das bestehende System ausgebaut — genau der
nächste Schritt, den `docs/3D_WORLD_ASSETS.md` §8 schon als "nächste
Code-Phase" angekündigt hatte:
- **Terrassierte Gebirge:** ein neuer `terrace()`-Helper snapt das
  Ridged-Fractal-Rauschen in 5 flache Absätze mit steilen Rissern
  (`tileTarget`s Mountain-Zweig, 65% terrassiert/35% Rest-Rauschen für
  Fels-Detail) — liest jetzt wie echte Gesteinsschichten/Plateaus statt
  gleichmäßig glatter Hügel. Bleibt garantiert im bisherigen Höhenbereich
  `[2.6, 6.0]`, keine Neukalibrierung der Splat-Textur-Bänder nötig.
- **Tiefere, geformte Flusstäler:** `riverBankDip` scannt jetzt Radius 2 statt
  nur die 4 direkten Nachbarn und carved ein V-Profil (`-0.22` an der Sohle,
  smoother Falloff zum Rand) statt eines flachen Einzel-Dips von `-0.06`.
- **Küsten-Dünen:** Sandkacheln direkt neben Wasser/Fluss bekommen ein feines,
  niedrigamplitudiges Rauschen (`+0.04`) statt einer toten Ebene — bewusst
  klein genug, um bebaubar zu bleiben.
- **Sichtbar glattere Kurven:** `ThreeMapRenderer.buildGroundMesh` unterteilt
  jede Kachel jetzt `GROUND_SUBDIV`-fach (Default 2×2) statt einem Vertex pro
  Kachelecke — Positionen kommen weiter direkt aus `terrainHeightAt` (bereits
  kontinuierlich), Vertexfarben werden bilinear aus dem unveränderten
  Eckpunkt-Farbraster interpoliert, keine zusätzlichen Terrain-Lookups.
  Weiterhin **ein** Draw-Call.

**Warum.** Phase 1 von mehreren geplanten MVP3-Phasen — Fundament, auf dem
Gebirgs-Module, Wald-Patches/Vegetation, Küsten-Deko usw. später aufbauen.
Ohne dramatischeres Relief hätten erweiterte Texturen/Vegetation weiterhin
"aufgesetzt" statt gewachsen gewirkt.

**Architektur.** Weiterhin eine **reine, deterministische Renderer-Funktion**
(`terrainHeightAt` liest nur `terrainAt` aus der Sim + Rauschen, mutiert
nichts, wird nie persistiert) — keine `SCHEMA_VERSION`-Änderung, keine
Migration. `tileTarget` bekommt zusätzlich einen modul-internen Memo-Cache,
weil die Mesh-Subdivision dieselben Kachel-Eckwerte jetzt mehrfach abfragt.
Bebaubares Land (grass/fertile/sand) bleibt bei den bisherigen, bewusst
niedrigen Amplituden — Gebäude/Autos positionieren sich weiterhin an einem
Höhen-Punkt ohne lokale Einebnung, dramatischeres Relief dort hätte das
sichtbar verschlechtert.

**Auswirkung.** Gebirge, Flusstäler und Küsten wirken deutlich plastischer;
Straßen (`fitRoadToTerrain`, Tilt-Kappung bei `MAX_TILT≈20°`) und Gebäude
sitzen weiter korrekt auf. Maximale Kartengröße wächst von ~10.400 auf
~41.400 Vertices (4×, ein Draw-Call, einmaliger Kostenpunkt nur bei
Sektor-Aufdeckung, nicht pro Frame).

**Zukunft.** Bewusst nicht Teil dieser Phase (spätere MVP3-Schritte): lokale
Terrain-Einebnung unter Gebäude-Footprints, Gebirgs-Modul-Assets
(`mountain_base/peak/ridge/cliff/…`), Wald-Patches/Vegetations-Cluster,
Küsten-/Hafen-Dekoration, Verkehrs-Graph, Atmosphäre-Erweiterungen.

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest
run`, `npm run build`; 3D-Screenshot-Smoke (Playwright) für Gebirge,
Flusslauf, Küste und eine Bergstraße.

**Dateien.** Geändert: `src/renderer/three/terrainHeight.ts`,
`src/renderer/three/ThreeMapRenderer.ts`, `docs/3D_WORLD_ASSETS.md`,
`docs/PATCHNOTES.md`.

## v0.45 — Straßen-Texturen: Ordner-lokale PROMPTS.md + Doku-Fix

**Was.** `src/assets/textures/roads/PROMPTS.md` (neu, generiert): Schritt-für-
Schritt-Anweisung je der 6 Straßen-/Brücken-Texturen (Prompt, Format/Auflösung,
exakter Speicherpfad, was danach passiert) — direkt im Zielordner statt nur in
`docs/`, damit man beim Ablegen der generierten Bilder nicht zwischen `docs/`
und dem Textur-Ordner wechseln muss. Außerdem zwei stale Referenzen auf das in
v0.44 entfernte `roadSegment(mask)` in `roadTextureManifest.ts`/
`docs/ROAD_TEXTURES.md` korrigiert (Form kommt jetzt korrekt beschrieben direkt
aus den Nachbar-Mask-Bits in `buildRoadTile`, Kreisverkehr aus `mask === 15`).

**Architektur.** `renderRoadPromptsFile()` (neue Funktion in
`roadTextureManifest.ts`) nutzt dieselben `ROAD_TEXTURES`-Daten wie
`renderRoadTexturesDoc()` — keine Zweitquelle. `tests/roadTextures.test.ts`
prüft jetzt beide generierten Dateien gegen Drift (Liste statt Einzeltest, wie
bei `modelReadmes.test.ts`).

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest run`
(152 Tests, 1 neu), `npm run build` — alle grün.

**Dateien.** Neu: `src/assets/textures/roads/PROMPTS.md` (generiert). Geändert:
`src/assets/roadTextureManifest.ts`, `tests/roadTextures.test.ts`,
`docs/ROAD_TEXTURES.md` (generiert), `docs/PATCHNOTES.md`.

## v0.44 — „Straßen als Textur statt 3D-Modell" + Wald-Kachel-Aufräumung

**Was.**
- **Waldkacheln aufgeräumt:** `forest.glb`/`forest_ground_tile.glb` entfernt —
  das waren die hässlichen, sich wiederholenden hellen Klumpen im Screenshot
  (dieselbe Modell-Instanz auf jeder Waldkachel). Waldflächen fallen jetzt auf
  das gesplattete Höhenfeld (v0.43) zurück, bis neue Baummodelle entstehen.
- **Straßen/Brücken laden nie wieder ein `.glb`.** Der komplette Drop-in-Pfad
  (`roadModel`/`bridgeModel`/`BRIDGE_MODELS`, `roadSegment()`-Rotationslogik)
  ist entfernt. Stattdessen ist die bestehende Mask-getriebene Geometrie
  (Kern + Arme + Randstreifen aus `buildRoadTile`) jetzt **texturiert statt
  einfarbig** und sitzt flach nahe `y≈0` im Gelände statt als erhöhte Platte.
- **Neu, ohne neue Sim-Konzepte, rein aus vorhandenen Renderer-Daten
  abgeleitet:**
  - **Kreisverkehr:** eine 4-Wege-Kreuzung bekommt automatisch eine runde statt
    eckige Kern-Geometrie.
  - **Gestrichelte Mittellinie:** texturiert statt Flächenfarbe, für die
    Straßenklassen mit `centerline: true`.
  - **Bergstraße/Pass:** liegt die Kachel auf Gebirgsterrain, wird eine
    rauere Textur statt Asphalt verwendet — ein Pass ist einfach eine
    Bergstraße am Sattelpunkt, kein eigener Typ.
  - **Steg vs. Brücke:** die gemessene, zusammenhängende Wasser-Spannweite
    entscheidet zwischen einem schmalen, pfeilerlosen Holzsteg (1 Kachel) und
    einer breiteren Brücke mit Geländer/Pfeilern (mehrere Kacheln).
  - **Randübergang** zu Gras/Erde nutzt die bereits dokumentierte
    `terrain_road_edge.png` wieder — keine Dopplung.
- **`src/assets/roadTextureManifest.ts`** (neu, mirror von
  `terrainTextureManifest.ts`): 6 neue Straßen-/Brücken-Texturen
  (`road_asphalt`, `road_mountain`, `road_marking_dash`, `road_roundabout`,
  `road_bridge_deck`, `road_boardwalk`), generiert `docs/ROAD_TEXTURES.md`,
  drift-geprüft von `tests/roadTextures.test.ts`. Drop-in-Ordner:
  `src/assets/textures/roads/{surface,markings,crossings}/`.
- **Aufgeräumt:** `src/assets/models/roads/`/`.../bridges/` sind jetzt nur noch
  eine historische Doku-Hülle (README/PROMPTS neu generiert mit Hinweis auf
  `docs/ROAD_TEXTURES.md`), `docs/3D_MODEL_MANIFEST.md`/`docs/3D_WORLD_ASSETS.md`
  entsprechend gekürzt und verlinkt. Tote Renderer-Funktionen entfernt
  (`roadSegment`, `roadSegmentNames`, `rotMask`, `rotSteps`).

**Warum.** Der Nutzer wollte nach den Wald-Kachel-Problemen wieder klare
Struktur in den Asset-Ordnern und ein klares Vorhaben, bevor weitergebaut wird
— das Nebeneinander aus "3D-Straßenmodelle (nie befüllt)" und dem neuen
Textursystem sollte aufgeräumt statt nur ergänzt werden. Die Recherche zeigte:
es gibt heute nur EINE Straßen-Building-Def (`id:'road'`) und keine Sim-Konzepte
für Brücke/Kreisverkehr/Steg/Bergpass — alles reine Renderer-Optik. Kreuzung,
Linie, Kreisverkehr, Bergstraße, Pass, Steg und Brücke lassen sich deshalb
komplett aus vorhandenen Renderer-Daten (Nachbarmaske, Terrain-Typ,
Wasser-Spannweite) ableiten, ohne `SCHEMA_VERSION`-Bump oder neue
`buildings.config.ts`-Kategorie — CLAUDE.md §2 "Erweitern statt neu bauen".

**Architektur.** Texturen laden lazy über den in v0.43 gebauten
`TextureLoader`/`textureCache` (jetzt als `loadTextureByUrl` verallgemeinert,
mit `loadSplatTexture`/`loadRoadTexture` als dünnen Wrappern). Jedes
Straßen-Oberflächen-Material ist EINE geteilte `MeshStandardMaterial`-Instanz
pro Rolle (`getRoadMats()`) statt pro Kachel — ein Drop-in leuchtet für alle
Straßen gleichzeitig auf (`material.map` + `needsUpdate`), ohne Custom-Shader
(anders als der Ground-Splat: Straßen sind flach lackiert, keine
Höhen-/Neigungs-Gewichtsmischung nötig). Ohne jede Textur bleibt exakt die
bisherige Flächenfarbe — kein Regressionsrisiko.

**Auswirkung/Zukunft.** Echte Stützmauern/Böschungen/Serpentinen/Tunnel bei
sehr großen Höhensprüngen bleiben bewusst zurückgestellt (bräuchten echte
zusätzliche Geometrie, keine reine Textur) — die Neigungs-Kappung verhindert
inzwischen zumindest, dass eine Straße sichtbar kippt oder schwebt. Sobald der
Nutzer echte Straßen-Texturen ablegt, greifen sie automatisch — kein weiterer
Code nötig.

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest run`
(151 Tests, davon 3 neu in `tests/roadTextures.test.ts`), `npm run build` —
alle grün. 3D-Screenshot-Smoke via Playwright (`vite preview`): keine
Konsolen-/Shader-Fehler, Straßen-Netz (gerade/Kurve/Kreuzung) und eine Brücke
über Wasser weiterhin korrekt im Gelände, Regressionscheck nach dem Umbau von
`buildRoadTile`/`buildBridgeDeck`.

**Dateien.** Neu: `src/assets/roadTextureManifest.ts`,
`tests/roadTextures.test.ts`, `docs/ROAD_TEXTURES.md` (generiert),
`src/assets/textures/roads/*/.gitkeep`. Geändert:
`src/renderer/three/ThreeMapRenderer.ts` (Straßen-/Brücken-Umbau,
Texturloader-Refactor), `src/assets/registry.ts` (`roadTextureUrl`,
`roadModel`/`bridgeModel`/`hasAnyRoadModel` entfernt),
`src/assets/modelManifest.ts` (`BRIDGE_MODELS` entfernt, roads/bridges-Einträge
deprecated), `docs/3D_MODEL_MANIFEST.md`, `docs/3D_WORLD_ASSETS.md`,
`docs/PATCHNOTES.md`. Gelöscht:
`src/assets/models/terrain/forest.glb`,
`src/assets/models/terrain/forest_ground_tile.glb`.

## v0.43 — „Terrain System V2, Phase 2: Splatmap-Ground-Shader + Drop-in-Ordner"

**Was.** Der in v0.42 dokumentierte, aber bewusst zurückgestellte Splatmap-Shader
ist jetzt implementiert — der Nutzer hatte bereits reale Texturen (Gras, Erde,
Stein, Sand) mit ChatGPT erzeugt und in `src/assets/textures/terrain/…` abgelegt,
aber der Ordner existierte physisch noch gar nicht auf der Platte (nur von
`registry.ts`/der Doku referenziert) und es gab noch keinen Renderer-Code, der die
Dateien tatsächlich konsumiert — der Boden blieb daher weiterhin das flache,
vertex-gefärbte Höhenfeld.
- **Drop-in-Ordner angelegt:** `src/assets/textures/terrain/
  {grass,earth,stone,sand,snow,water,field,path}/` mit `.gitkeep`, exakt wie bei
  den 3D-Modell-Ordnern.
- **`ThreeMapRenderer.buildGroundMesh()`** blendet jetzt bis zu vier
  Repräsentativ-Texturen (`terrain_grass_01`, `terrain_earth_light`,
  `terrain_rock`, `terrain_sand`) direkt auf das bestehende vertex-gefärbte
  Höhenfeld — nicht als Ersatz, sondern als `onBeforeCompile`-Erweiterung
  desselben `MeshStandardMaterial`s (gleiches Muster wie der Wasser-/
  Sektor-Nebel-Shader). Die Mischgewichte pro Vertex kommen aus Höhe und
  Hangneigung (Splatmap-Konzept aus `docs/TERRAIN_TEXTURES.md`), kalibriert auf
  die tatsächlichen Zahlen aus `terrainHeight.ts` (Bauland ~0–0.25, Gebirge erst
  ab 2.6 — die Meterangaben in der Doku waren aspirational und nicht 1:1
  übertragbar).
- **Nie kaputt:** Fehlt eine Kategorie-Textur, fällt ihr Gewicht auf 0 und die
  Deckung (`coverage`) sinkt dort automatisch Richtung reine Vertexfarbe zurück
  — kein falsches Material, kein Schwarz/Fehlbild. Ohne jede abgelegte Textur
  bleibt der Boden exakt wie zuvor (v0.39).

**Warum.** Reine Dokumentation half nicht mehr weiter, sobald echte Texturdateien
vorlagen — das eigentliche "sieht man was?"-Ziel des Nutzers brauchte den
Verbraucher-Code, nicht nur die Spezifikation.

**Architektur.** Texturen werden lazy über einen modulweiten `TextureLoader` +
Cache geladen (`loadSplatTexture`, mirror von `loadModel`/`modelCache`). Das
Laden ist async; solange es läuft, zeigt der Boden die normale Vertexfarbe, dann
wird das Material per `needsUpdate` + neuem `customProgramCacheKey` live
nachkompiliert (kein Rebuild der Geometrie nötig). Ein `terrainKey`-Staleness-
Check verhindert, dass eine inzwischen ersetzte Terrain-Geometrie noch nachträglich
texturiert wird.

**Auswirkung/Zukunft.** Stein/Sand blenden bereits automatisch mit ein, weil der
Nutzer sie schon abgelegt hat; Schnee/Wasser/Feld/Weg folgen genauso automatisch,
sobald Dateien für diese Kategorien existieren — dafür ist keine weitere
Code-Änderung nötig. Bei der aktuellen Standard-Kamerahöhe liest sich die
Textur eher als satter, photografischer Farbton (die Einzel-Grashalme sind bei
dieser Zoomstufe sub-Pixel) statt als scharfe Nahaufnahme — das ist erwartetes
Mipmapping-Verhalten, keine fehlerhafte Anwendung (per Pixel-Stichprobe
verifiziert: gerendertes Grün ist spürbar wärmer/gelbstichiger als die alte
flache Kachelfarbe). Feintuning von Kachelgröße/Kontrast ist ein einfacher,
eigenständiger Folgeschritt, sobald der Nutzer den Look live beurteilt hat.

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest run`
(148 Tests, unverändert), `npm run build` — alle grün. 3D-Screenshot-Smoke via
Playwright (`vite preview`): keine Konsolen-/Shader-Fehler, `onBeforeCompile`
feuert nachweislich, Pixel-Stichprobe bestätigt reale Texturfarben statt der
alten Flächenfarbe.

**Dateien.** Neu: `src/assets/textures/terrain/*/.gitkeep` (8 Ordner). Geändert:
`src/renderer/three/ThreeMapRenderer.ts` (Splat-Ladepfad + Ground-Shader),
`docs/PATCHNOTES.md`.

## v0.42 — „Terrain System V2: Splatmap-Materialdoku & Textur-Drop-in vorbereitet"

**Was.** Neue Dokumentation + Drop-in-Infrastruktur für ein Terrain-
Materialsystem — noch **keine** Renderer-Änderung:
- **`docs/TERRAIN_TEXTURES.md`** (neu, generiert): vollständige Spezifikation für
  35 Boden-/Material-Texturen in 8 Kategorien (Gras, Erde, Stein, Sand, Schnee,
  Wasser, Felder, Wege) — je Textur Ordner, Auflösung, Stil, Palette, Einsatz,
  Materialeigenschaften, Mischverhalten, benötigte Normal-/Roughness-/AO-/
  Height-Maps, Detailstufe, Priorität und ein copy-paste-fertiger
  ChatGPT-/Bildgenerator-Prompt.
- **Splatmap-Konzept dokumentiert:** Regeln, wie Höhe, Hangneigung und
  Wassernähe die Materialgewichte pro Fläche bestimmen (z. B. 70 % Gras/20 %
  Erde/10 % Stein statt eines harten Terrain-Typs), plus Biome-Materialsets
  (welche Texturen pro Biom zur Auswahl stehen).
- **Drop-in vorbereitet:** neuer Ordner `src/assets/textures/terrain/
  {grass,earth,stone,sand,snow,water,field,path}/` + `terrainTextureUrl()` in
  `src/assets/registry.ts` (Discovery per `import.meta.glob`, wie bei allen
  anderen Assets). Eine abgelegte Textur wird gefunden, aber aktuell noch nicht
  gerendert — der Ground-Shader, der sie tatsächlich mischt, ist bewusst
  **nicht** Teil dieser Phase.

**Warum.** Der Nutzer will die Bodenoberfläche künftig aus weich gemischten
Splatmap-Texturen bestehen lassen statt aus vertex-gefärbtem Höhenfeld plus
einzelnen kleinen Terrain-Modellen (Gras-/Felsbüschel) — "kein Aneinanderreihen
von Modellen, sondern ein lebendiges Ganzes". Bevor eine einzige Textur
existiert (der Nutzer erstellt sie extern mit ChatGPT), muss feststehen: welche
Textur, in welcher Auflösung, mit welchem Motiv, wie sie sich mit ihren
Nachbarn mischt. Das liefert diese Phase — die eigentliche Shader-
Implementierung folgt, sobald reale Texturen zum Verifizieren vorliegen (siehe
v0.40/v0.41: derselbe Doku-zuerst-Ansatz wie bei den 3D-Modellen).

**Architektur.** `src/assets/terrainTextureManifest.ts` ist die einzige Quelle
(mirror von `modelManifest.ts`): `docs/TERRAIN_TEXTURES.md` wird daraus
generiert und von `tests/terrainTextures.test.ts` gegen Drift geprüft — exakt
dasselbe Muster wie die 3D-Modell-Docs (CLAUDE.md §2 „Erweitern statt neu
bauen"). Technische Angaben (Auflösung, Maps, Detailstufe) sind pro
Material-Kategorie EINMAL hinterlegt (`CATEGORY_DEFAULTS`) statt 35-mal
wiederholt — dieselbe Lösung wie `SIZE_CLASS_BUDGETS` bei den 3D-Modellen.
`ThreeMapRenderer.buildGroundMesh()` ist unverändert (weiterhin vertex-gefärbtes
Höhenfeld, v0.39) — reine Datendeklaration + Registry-Erweiterung, kein
Rendering-Risiko in dieser Phase.

**Auswirkung/Zukunft.** Sobald der Nutzer erste Texturen ablegt, sind Name,
Ordner und Blend-Absicht bereits eindeutig festgelegt. Nächster Schritt (eigene
Phase): ein Splatmap-Ground-Shader in `ThreeMapRenderer`, der die
Materialgewichte aus Höhe/Neigung/Feuchtigkeit berechnet und die abgelegten
Texturen weich mischt — mit Fallback auf das aktuelle vertex-gefärbte Höhenfeld,
solange keine Texturen vorhanden sind (bricht nie, wie überall im Projekt).

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest run`
(148 Tests, davon 3 neu in `tests/terrainTextures.test.ts`), `npm run build` —
alle grün. Kein 3D-Screenshot-Smoke nötig (keine Renderer-Code-Änderung).

**Dateien.** Neu: `src/assets/terrainTextureManifest.ts`,
`tests/terrainTextures.test.ts`, `docs/TERRAIN_TEXTURES.md` (generiert).
Geändert: `src/assets/registry.ts` (`terrainTextureUrl`/`hasAnyTerrainTexture`),
`docs/3D_WORLD_ASSETS.md` (Querverweis in §3/§7), `docs/PATCHNOTES.md`.

## v0.41 — „World Graphics V2, Phase 2: Gebirge/Flüsse, Straßen-Gelände, Gebäude-Rotation, Sektor-Nebel, Verkehrs-Pathing"

**Was.** Die zweite World-Graphics-V2-Phase liefert die Rendering-/Gameplay-Seite
zu der in v0.40 dokumentierten Konzept-Liste:
- **Gebirge & Flüsse organischer.** `terrainHeight.ts` nutzt für Gebirge jetzt
  **Ridged-Fractal-Noise** (drei Oktaven) statt glatter Rolling-Hill-Noise —
  scharfe Gratlinien und Felsplatten statt runder Blobs. Wasser/Fluss-Betten
  bekommen etwas Unebenheit (statt einer perfekt flachen Wanne), und Land direkt
  neben Fluss/See senkt sich leicht zum Ufer ab ("gräbt sich ein").
- **Straßen folgen dem Gelände.** Jedes Straßensegment kippt jetzt nach dem
  lokalen Höhengradienten (Finite-Differenzen von `terrainHeightAt`, auf ~20°
  begrenzt) und bekommt eine erdfarbene Schürze an der Unterkante — auf sanft
  geneigtem Grasland/Wald zeigt sich nie mehr eine schwebende Kante oder Stufe
  zwischen Nachbarsegmenten.
- **Gebäude-Rotation.** Vor dem Platzieren lässt sich jedes Gebäude in
  90°-Schritten drehen (Taste **R** oder der Dreh-Button im Platzierungs-Banner);
  die Geister-Vorschau zeigt einen kleinen Pfeil an der gewählten Vorderseite.
  Rein kosmetisch — Grundfläche, Validierung und Kosten bleiben exakt wie vorher,
  nur die Modell-/Node-Ausrichtung dreht sich. Neues optionales Feld
  `BuildingInstance.rotation` (0/90/180/270) wird beim Platzieren gespeichert.
- **Sektor-Nebel.** Gesperrte Sektoren zeigen jetzt zusätzlich zur gedimmten
  Bodenfarbe einen dichten, sanft wogenden Nebelschleier (eine Ebene je Sektor,
  animiert über denselben Zeit-Uniform wie die Wasseroberfläche) — hohe
  Landmarken/Berge können weiter als Silhouette durchscheinen ("keine komplette
  Sicht", kein Blackout).
- **Verkehrs-Pathing.** Der Ambient-Verkehr fährt jetzt **Haus → Straße → Ziel**
  über dieselbe BFS-Straßensuche wie der Missions-Lieferwagen, statt an jeder
  Kreuzung zufällig abzubiegen. Ohne Wohnhaus/Ziel-Gebäude (frühes Spiel) fällt
  eine Route auf einen kurzen, richtungstreuen Zufallslauf zurück, damit auf der
  Karte nie schlagartig aller Verkehr verschwindet.

**Warum.** v0.40 hat die komplette Modell-Dokumentation für World Graphics V2
vorbereitet, aber bewusst keine Rendering-/Gameplay-Änderung vorgenommen. Dieser
Durchgang setzt die fünf dort als "Konzept, noch nicht implementiert" markierten
Abschnitte um — mit vorhandenen prozeduralen Mitteln (keine neuen `.glb` nötig,
alles bleibt Drop-in-fähig für später).

**Architektur.** Alles erweitert bestehende Systeme statt neue zu bauen
(CLAUDE.md §2): `terrainHeight.ts` bleibt die eine reine Höhenquelle (nur die
Rauschfunktion für Gebirge/Wasser geändert); Straßen-Tilt/-Schürze ist ein
zusätzlicher Schritt in `ThreeMapRenderer.buildRoad`; Rotation ist ein optionales
Feld auf `BuildingInstance` (kein Migrationszwang, siehe unten) plus ein
optionales `IMapRenderer.setPlacingRotation` (2D/Iso-Renderer ignorieren es
ungerührt); Sektor-Nebel ist ein zusätzlicher InstancedMesh-Pass neben
`buildGroundMesh`/`buildWater`; Verkehr nutzt die bereits vorhandene
`roadPath()`-BFS (bisher nur vom Missions-Lieferwagen genutzt) auch für den
Ambient-Verkehr, statt eine zweite Pathing-Logik zu bauen. Simulation bleibt
unberührt — Terrain-Höhe, Straßen-Optik und Nebel sind rein visuell, Rotation
ändert nur die Darstellung, Verkehr ist reine Ambient-Deko ohne Gameplay-Wirkung.

**Saves.** `BuildingInstance.rotation` ist ein neues **optionales** Feld
(`z.union([...]).optional()` in `schemas.ts`) — alte Spielstände parsen unverändert
(Feld bleibt `undefined` ≙ 0°), keine `SCHEMA_VERSION`-Erhöhung und keine
Migration nötig (wie zuvor bei `targetUpgradeLevel`/`constructionEndsAt`).

**Auswirkung/Zukunft.** Die Bausteine aus v0.40 §7–§12 sind jetzt aktiv:
schärfere Gebirge/Flüsse, geländetreue Straßen, drehbare Gebäude, Sektor-Nebel,
zielgerichteter Verkehr. Offen für spätere Phasen: echte Gebirgs-/Fluss-Terrain-
Features (Pässe, Wasserfälle, Schluchten als eigene platzierte Formen statt nur
Höhenfeld-Rauschen), automatischer Straßenanschluss/Gehweg zwischen Gebäude und
Straße, Bürgerhinweis-Sprechblasen im Nebel, Serpentinen/Tunnel für große
Höhenunterschiede.

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest run`
(145 Tests inkl. `terrainHeight.test.ts` mit den bestehenden Invarianten —
Gebirge hoch, Wasser unter Wasserlinie, Bauland gleichmäßig, stetig), `npm run
build` — alle grün. 3D-Screenshot-Smoke (Playwright, `vite preview`, `/`):
Karte lädt ohne Konsolenfehler, Gebirge zeigt sichtbar zerklüftete Textur,
Platzierungs-Banner zeigt den Dreh-Button und wechselt bei Taste R sichtbar
von 0° auf 90°, Nebel-Ebene über dem gesperrten Sektor sichtbar.

**Dateien.** Geändert: `src/renderer/three/terrainHeight.ts` (Ridged-Noise
Gebirge, Fluss-/See-Bett-Unebenheit, Uferabsenkung), `src/renderer/three/
ThreeMapRenderer.ts` (Straßen-Gelände-Fit + Schürze, Gebäude-Rotation anwenden +
Ghost-Pfeil + `setPlacingRotation`, Sektor-Nebel-Pass, Verkehrs-Pathing via
`roadPath`), `src/game/types.ts` + `src/game/config/schemas.ts`
(`BuildingInstance.rotation`), `src/game/commands/controller.ts`
(`placeBuilding` nimmt optionale Rotation entgegen), `src/state/store.ts`
(`placingRotation` + `rotatePlacing`), `src/renderer/IMapRenderer.ts` +
`src/renderer/MapRenderer.ts` (Rotation optional durchgereicht),
`src/components/MapView.tsx` (Taste R, Dreh-Button im Banner), `src/styles.css`,
`src/i18n/de.json`, `docs/PATCHNOTES.md`.

## v0.40 — „World Graphics V2, Phase 1: 3D-Asset-Doku konsolidiert & vollständig"

**Was.** Reine Dokumentations-/Datenüberarbeitung, kein Rendering- oder
Gameplay-Code geändert:
- **Eine Quelle statt drei widersprüchlicher Docs.** `docs/3D_MODELS.md` (v0.29,
  veraltet — nutzte noch alte Namen wie `grass.glb`/`water.glb`) ist entfallen;
  seine noch gültigen Inhalte (Node-Namen `rotor`/`chimney`, Kartenmodi,
  Integrationsschritte) sind in `docs/3D_MODEL_MANIFEST.md` aufgegangen.
  `docs/3D_MODEL_MANIFEST.md` ist jetzt der kurze, testgeprüfte Namens-Index;
  `docs/3D_WORLD_ASSETS.md` das entschlackte Zielbild/Stilhandbuch. Beide
  duplizieren keine Modell-Einzellisten mehr, sondern verweisen auf die
  generierten `src/assets/models/<ordner>/PROMPTS.md`.
- **Jedes Modell — aktuell verdrahtet *und* geplant — vollständig spezifiziert.**
  `src/assets/modelManifest.ts` bekam ein erweitertes Datenmodell (`SizeClass` +
  `SIZE_CLASS_BUDGETS`, sowie Footprint/Höhe/Pivot/Front/Platzierung/Biom/
  Instancing/Animations- & Effekt-Nodes/Spawn-Regel/Live-Status je Eintrag). Jede
  generierte `PROMPTS.md` trägt jetzt pro Modell einen vollständigen Spec-Block
  statt nur Name+Motiv.
- **Alle in der „World Graphics V2"-Anfrage genannten künftigen Modelle ergänzt:**
  schroffes Gebirge (Wand/Ecke/Tal-Pass/Tunnel/Spitze), Gebirgsflüsse (Quelle →
  Kurve/Gabelung → Mündung, kleine/große Wasserfälle), Küste & Klippen (Sand/Fels,
  Kliffkante/-ecke, Hero-Küstenklippe), Straßen-Geländeanpassung (`road_slope`,
  `road_bridge_entry`, neue `props/infrastructure/`-Kategorie für Stützmauer/
  Böschung), Sektor-Nebel & Bürgerhinweise (`locked_sector_fog_veil`,
  `landmark_silhouette_hint`, `marker_citizen_hint`), fehlende Hero-Landmarken
  (Mine, Damm, Marktviertel, Waterfront) sowie neue Kategorien für Wegkreuze,
  Wanderwege, Naturdenkmäler, ländliche Streusiedlungen, saisonale Deko und zwei
  Endgame-Landmarken-Platzhalter. Lebendige-Welt-Effekte (Vögel, Schmetterlinge,
  Wind-Sway, Wasserbewegung, Brandung, Wolkenschatten) sind bewusst als
  „Partikel/Shader, kein `.glb`" dokumentiert statt als Modell-Kategorie.
- **Konzept-Kapitel für die noch ausstehenden Code-Phasen** in
  `docs/3D_WORLD_ASSETS.md` ergänzt (explizit als *noch nicht implementiert*
  markiert): Straßen-Geländeanpassung, Gebäude-Rotation/Platzierungsvorschau/
  automatischer Straßenanschluss, Sektor-Nebel/Silhouetten/Bürgerhinweise,
  Verkehrs-Pathing Haus→Straße→Ziel.

**Warum.** Der Nutzer forderte eine grafische Weltüberarbeitung („World Graphics
V2") mit ~14 Rendering-/Gameplay-Systemen — realistisch mehrere Code-Phasen. Ein
Teil der Anfrage war explizit als **verpflichtend** markiert: die vollständige
Überarbeitung der 3D-Asset-Dokumentation, damit jedes künftige Modell (auch
Landmarken, Terrain-Stücke, Küsten-/Fluss-/Gebirgsobjekte, Dekorationen) schon
jetzt einen eindeutigen, vollständig spezifizierten Platz hat, bevor überhaupt
eine `.glb`-Datei existiert. Diese Phase liefert genau das — die Blaupause, auf
der jede folgende Rendering-Code-Phase (organisches Gebirge, Flusstäler, Straßen-
Gelände-Logik, Gebäude-Rotation, Sektor-Nebel, Verkehrs-Pathing) aufbaut.

**Architektur.** `src/assets/modelManifest.ts` bleibt die **einzige** Quelle für
Modellnamen UND jetzt auch für deren volle Spezifikation; die drei `docs/*.md`
tragen nur noch das, was sich nicht automatisch generieren lässt (Zielbild,
Stilphilosophie, Konzepte). Kein neues System — konsequente Erweiterung des
bestehenden Drop-in-/Fallback-Mechanismus (CLAUDE.md §1/§2/§5). Keine Änderung an
`ThreeMapRenderer.ts`s Lade-/Fallback-Logik, an `registry.ts`, an
`GameController`/State oder an Savegames — reine Datendeklaration plus generierte
Dokumentation.

**Auswirkung/Zukunft.** Jedes künftig abgelegte `.glb` (auch für noch nicht
gebaute Features) hat bereits Dateiname, Footprint, Budget, Platzierungs- und
Biom-Regeln — kein Rätselraten mehr für Artists. Die als „Konzept, noch nicht
implementiert" markierten Abschnitte in `docs/3D_WORLD_ASSETS.md` sind die
Roadmap für die nächsten Code-Phasen (Terrain-/Gebirgs-Rendering, Straßen-
Gelände-Logik, Gebäude-Rotation & Platzierungsvorschau, Sektor-Nebel/Hinweise,
Verkehrs-Pathing) — bewusst nicht Teil dieser Phase.

**Verifikation.** `npx tsc -b --force`, `npx eslint src tests`, `npx vitest run`
(inkl. `tests/modelReadmes.test.ts` und `tests/manifest.test.ts`), `npm run
build` — alle grün. Kein 3D-Screenshot-Smoke nötig (keine Renderer-Code-Änderung).

**Dateien.** Geändert: `src/assets/modelManifest.ts` (SizeClass-Budgets, erweitertes
`PromptEntry`-Schema, alle neuen World-Graphics-V2-Modelleinträge), `docs/
3D_WORLD_ASSETS.md`, `docs/3D_MODEL_MANIFEST.md` (beide v0.40, entschlackt),
`src/renderer/three/ThreeMapRenderer.ts`/`src/assets/registry.ts`/`src/i18n/
de.json` (Doku-Verweise auf das entfallene `docs/3D_MODELS.md` umgebogen).
Gelöscht: `docs/3D_MODELS.md` (Inhalt in `3D_MODEL_MANIFEST.md` aufgegangen).
**Assets:** alle `src/assets/models/<ordner>/README.md` + `PROMPTS.md` neu
generiert (`WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`).

## v0.39 — „Organische Welt: Höhenfeld-Boden, Gebirge, saubere Platzierung & Proportionen"

**Was.** Die Karte ist nicht mehr flach:
- **Organischer Boden statt Kachel-Boxen.** Der Grund ist jetzt ein durchgehendes,
  vertex-gefärbtes, beleuchtetes **Höhenfeld**: klare Hügel, geneigte organische
  Formen, **riesige, smooth verlaufende Gebirge** im Westen/Norden, abgesenkte
  Seen/Flüsse/Meer. Ein Klick-Boden bleibt für die Kachelauswahl.
- **Alles sitzt sauber auf dem Boden.** Gebäude, Straßen, Baustellen, Auswahl-Ringe,
  Geister-Vorschau, Bäume/Sträucher, Autos, Lieferwagen, Marker und Rauch lesen
  **dieselbe** Höhenfunktion (`terrainHeightAt`) — nichts schwebt oder versinkt.
  Bebaubares Land ist bewusst **flach/ruhig** gehalten, damit Gebäude sauber stehen;
  Wasser bekommt eine flache Wasseroberfläche über dem abgesenkten Bett.
- **Proportionen korrigiert.** Kleine Deko-/Natur-Props behalten ihre **reale Höhe**
  (1 Kachel ≈ 4 m): eine **Parkbank ist nicht mehr so groß wie ein Baum**. Zentrale
  Tabelle `DECO_TARGET_HEIGHT`; prozedurale Deko zeichnet jetzt pro id die richtige
  Form (Bank, Brunnen, Blumenbeet, Baum) in passender Größe.
- **Prompts & Anweisungen erweitert.** `terrain/PROMPTS.md` und `props/PROMPTS.md`
  bekommen eine klare **Maßstabs-/Höhen-/Pivot-Regel** (1 Kachel ≈ 4 m, Pivot
  unten-mittig, nichts schwebt, Höhen-Richtwerte je Objekttyp) plus neue Einträge
  für Gebirge/Felsen/Klippen/Hügel, Bäume/Sträucher/Hecke/Schilf.

**Warum.** Eine flache Kachelfläche wirkt leblos; klare Hügel und große Gebirge geben
der Welt Charakter und Tiefe (3D-Welt als visueller Kern). Gleichzeitig müssen
Bauflächen sauber bleiben und Modelle in stimmigen Größen zueinander stehen — genau
die genannten Fehler (schwebende/gleich große Objekte) sind damit behoben.

**Architektur.** Neue **eine Höhenquelle** `src/renderer/three/terrainHeight.ts`
(rein, testbar): leitet die Höhe aus dem Terraintyp (`terrainAt`, Sim) + kohärentem
Value-Noise ab — biome-abhängig (Land sanft, Gebirge groß, Wasser abgesenkt), bilinear
geglättet. Der `ThreeMapRenderer` baut den Boden als **ein** `BufferGeometry`-Heightfield
(Vertexfarben aus den angrenzenden Kacheln, `computeVertexNormals`, ein Draw-Call) und
setzt jede Platzierung auf `terrainHeightAt`. Rein visuell — Simulation, Saves und
Kachel-Koordinaten bleiben unberührt (CLAUDE.md §1/§3); Bebaubarkeit/Picking laufen
weiter über die logischen Kacheln.

**Performance.** Der Boden ist ein einzelner Mesh (statt tausender Instanz-Boxen);
`terrainHeightAt` ist billig (2-Oktaven-Noise) und wird nur beim Terrain-Rebuild bzw.
pro Objekt-Platzierung ausgewertet, nicht pro Frame.

**Auswirkung/Zukunft.** Drop-in-Fels-/Gipfel-/Hügel-Modelle sitzen automatisch auf der
geneigten Oberfläche (Prompts liegen bereit). Später möglich: Footprints unter Gebäuden
exakt einebnen, Klippen/Terrassen, Uferlinien, Gebirgs-Hero-Modelle, oder die Höhe an
Gameplay koppeln.

**Verifikation.** `tsc -b --force`, ESLint, **145 Tests** (5 neue Höhenfeld-Tests:
Gebirge hoch, Wasser unter Wasserlinie, Bauland sanft, stetig), Build — alles grün.
3D-Screenshot-Smoke: organische Gebirge & Hügel, Stadt sauber auf flacher Fläche,
Bäume in korrekter Baumgröße, keine Konsolenfehler.

**Dateien.** Neu: `src/renderer/three/terrainHeight.ts`, `tests/terrainHeight.test.ts`.
Geändert: `src/renderer/three/ThreeMapRenderer.ts` (Heightfield-Boden, Höhen-Platzierung
überall, `DECO_TARGET_HEIGHT` + `decorationProc`, Wasser auf `WATER_LEVEL`),
`src/assets/modelManifest.ts` (`SCALE_NOTE` + erweiterte terrain/props-Prompts),
`src/assets/models/terrain/PROMPTS.md`, `src/assets/models/props/PROMPTS.md` (generiert),
`docs/PATCHNOTES.md`.

## v0.38 — „Gebäude-Vorschau direkt aus dem 3D-Modell (keine PNGs mehr nötig)"

**Was.** Die Vorschau eines Gebäudes (Baumenü, Gebäude-Sheet, Level-up-Karten,
Event-Popup) wird jetzt **automatisch aus seiner `.glb` gerendert**. Wer ein Modell
in `src/assets/models/buildings/` ablegt, braucht **keine `<id>.png`-Vorschau mehr**.
Reihenfolge der Quellen: **`.glb`-Thumbnail → `<id>.png` (falls vorhanden) → eingebaute
SVG-Grafik**. Solange das Thumbnail noch rendert, zeigt die Karte die SVG/PNG, blinkt
also nie leer.

**Warum.** Es gibt inzwischen viele Gebäude-Modelle. Bisher brauchte jede Karte
zusätzlich ein handgezeichnetes PNG — doppelte Pflege. Jetzt genügt die `.glb`: ein
Asset für Welt **und** Vorschau, konsistenter Look, weniger Dateien.

**Architektur.** Neuer Offscreen-Renderer `src/renderer/three/modelThumbnail.ts`:
**ein** geteilter WebGL-Kontext zeichnet jedes Modell **einmal** in ein transparentes
256²-Canvas (3/4-Ansicht, Welt-Beleuchtung) und liefert eine PNG-Data-URL, **gecacht
pro Modell-URL**. `BuildingArt` (in `BuildingArtwork.tsx`) nutzt einen kleinen
`useModelThumbnail`-Hook und wählt die Quelle in obiger Reihenfolge. Rein
präsentationsseitig — keine Simulation/Save/Koordinaten berührt (CLAUDE.md §1). Ist
WebGL nicht verfügbar (z. B. Tests), fällt es sauber auf PNG/SVG zurück.

**Performance.** Genau ein zusätzlicher WebGL-Kontext (Singleton, nicht pro Gebäude),
jedes Modell wird nur einmal gerendert und das Ergebnis gecacht; die Karten zeigen
danach ein statisches `<img>`.

**Auswirkung/Zukunft.** Neue Gebäude brauchen nur noch die `.glb`. Später ließe sich
das Thumbnail leicht auf die aktuelle Upgrade-Stufe (`<id>_stage<N>.glb`) oder eine
kleine Rotations-Vorschau erweitern.

**Verifikation.** `tsc -b --force`, ESLint, **140 Tests**, Build — grün. Sicht-Check
mit temporären Test-`.glb`: „Kleines Haus" zeigt das aus dem Modell gerenderte
Thumbnail, Nachbarn ohne Modell weiter ihr SVG; keine Konsolenfehler. (Die Test-`.glb`
wurden nach der Prüfung wieder entfernt.)

**Dateien.** Neu: `src/renderer/three/modelThumbnail.ts`. Geändert:
`src/components/art/BuildingArtwork.tsx` (GLB-zuerst + Hook), `src/styles.css`
(`.bld-art-model`), `docs/ASSETS.md`, `docs/ARCHITECTURE.md`, `docs/PATCHNOTES.md`.

## v0.37 — „Lebendige Welt: Tag/Nacht-Zyklus + dynamischer Himmel + Wasser"

**Was.** Die 3D-Welt bekommt eine **lebendige Atmosphäre**. Neu:
- **Tag/Nacht-Zyklus** mit dynamischem Himmel: ein Farbverlaufs-Himmel (Gradient-Dome)
  von Zenit zu Horizont, eine **wandernde Sonne** (Aufgang im Osten → Zenit → Untergang
  im Westen), nachts ein **kühler Mond** aus der Gegenrichtung, **Sterne**, die nur
  nachts aufscheinen, sowie Sonnen-/Mondscheibe am Himmel.
- **Atmosphärische Beleuchtung + Fog**, die sich stufenlos mit der Tageszeit umfärben
  (goldene Morgen-/Abenddämmerung, heller Mittag, tiefblaue Nacht — nie ganz schwarz,
  damit die Stadt lesbar bleibt).
- **Lebendiges Wasser:** Wasser-/Fluss-Kacheln bekommen eine **animierte, sanft
  wellende Oberfläche** (GPU-Vertex-Shader), die die Himmelsstimmung aufnimmt und
  nachts von selbst dunkler wird.
- **HUD-Regler** (nur 3D): ein Chip zum **An-/Ausschalten des Zyklus** (Sonne/Mond-
  Icon + Uhrzeit) und ein **Tageszeit-Schieber** zum manuellen Einstellen. Standard:
  Zyklus **aus** bei angenehmem Vormittag — es ändert sich nichts, bis man ihn
  aktiviert.

**Warum.** Die 3D-Welt ist der visuelle Kern des Spiels (Strategie). Ein statischer
Himmel mit fester Sonne wirkt leblos; ein Tag/Nacht-Rhythmus und bewegtes Wasser geben
der Stadt sofort Tiefe und Stimmung — ohne ein einziges neues 3D-Modell.

**Architektur.** Rein **präsentationsseitig** — kein Eingriff in Simulation, Saves
oder Koordinaten (CLAUDE.md §1/§3). Die *Mathematik* der Atmosphäre liegt in einem
reinen, WebGL-freien Modul `src/renderer/three/environment.ts` (Sonnenstand + alle
Farben/Intensitäten je Tageszeit, in `tests/environment.test.ts` geprüft). Die
three.js-Umsetzung kapselt `src/renderer/three/SkyEnvironment.ts` (Dome, Sonne/Mond,
Sterne, die drei Szenen-Lichter + Fog); der `ThreeMapRenderer` ersetzt seinen alten
statischen Licht-/Himmel-Block dadurch und ruft `env.update(dt)` pro Frame. Die
Tageszeit-Einstellungen liegen in einem eigenen, persistenten Store
`src/renderer/three/environmentSettings.ts` (localStorage `cmb.environment`, **nicht**
im Savegame → keine Schema-Änderung, alte Spielstände laden unverändert) — nach dem
Muster von `cameraSettings.ts`, sodass HUD und Renderer dieselben Werte live teilen.

**Performance.** Der Himmel ist ein einzelner vertex-gefärbter Dome (Neufärbung pro
Frame nur über einen vorbereiteten Buffer), Sterne sind ein `Points`-Objekt, das
Wasser eine **einzelne InstancedMesh** mit GPU-Wellen (ein `uTime`-Uniform, keine
CPU-Matrix-Updates). Gedimmte gesperrte Sektoren bekommen bewusst **keine**
Wasser-Oberfläche (Nebel-des-Krieges bleibt erhalten).

**Auswirkung/Zukunft.** Fundament für stimmungsvolle Screenshots und spätere Effekte
(Fenster-Leuchten bei Nacht, Wetter, Jahreszeiten) — alle können auf dem
`EnvGrade`-Modell aufbauen. Ein späteres Drop-in-Skybox-Modell ließe sich analog
ergänzen. Optional könnte der Zyklus künftig an die Spielzeit gekoppelt werden.

**Verifikation.** `tsc -b --force`, ESLint, **140 Tests** (9 neue Env-Tests), Build —
alles grün. 3D-Screenshot-Smoke (Playwright, Basis `/`) für **Morgen/Nacht/
Sonnenuntergang** ohne Konsolenfehler; Wasser-Shader mit real gerenderten Instanzen
gegengeprüft (keine Shader-Fehler).

**Dateien.** Neu: `src/renderer/three/environment.ts`,
`src/renderer/three/environmentSettings.ts`, `src/renderer/three/SkyEnvironment.ts`,
`tests/environment.test.ts`. Geändert: `src/renderer/three/ThreeMapRenderer.ts`
(SkyEnvironment integriert, statischer Licht-/Himmel-Block entfernt, animierte
Wasseroberfläche, Frame-/Dispose-Anbindung), `src/components/hud/CameraControls.tsx`
(Tag/Nacht-Regler), `src/i18n/de.json`, `src/styles.css`. **Keine** neuen Assets/
Ordner nötig (prozedural).

## v0.36 — „Generierungs-Prompts pro Ordner (PROMPTS.md), auto-synchron"

**Was.** Jeder Modellordner hat jetzt neben der `README.md` (Namensliste) eine
**`PROMPTS.md`** mit **copy-paste-fertigen Text-zu-3D-Prompts** für jedes Modell —
aktuelle *und* geplante. Für Gebäude wird **ein Prompt pro Config-Gebäude** erzeugt
(alle aus `buildings.config.ts`, inkl. Footprint, Stufen-Dateinamen und
Baustellen-Modell), plus ein Block für geplante Landmarken/Hero-Bauten. Die übrigen
Ordner (terrain/roads/bridges/props/vehicles/markers/effects/ui) listen je Modell
einen Prompt, gruppiert in „Aktiv genutzt" und „Geplant".

**Warum.** Damit man für **alle** Modelle — die es gibt und die noch kommen — direkt
einen fertigen Prompt zur Hand hat, genau im richtigen Ordner, ohne Stil-/Technik-
Regeln jedes Mal neu zusammenzusuchen.

**Architektur.** Gleiche Single-Source wie die READMEs: alles kommt aus
`src/assets/modelManifest.ts` (neu: `STYLE_PREFIX`, `BUILDING_PROMPTS`,
`BUILDING_LANDMARK_PROMPTS`, `FOLDER_PROMPTS`, `renderFolderPrompts`,
`buildBuildingsPrompts`). Jeder Block enthält den gemeinsamen Stil-/Technik-Prefix
(identisch zu `docs/3D_WORLD_ASSETS.md` §6) + ein englisches Motiv (Text-zu-3D-Tools
arbeiten damit am besten). Der Renderer nutzt weiterhin dieselben Namensarrays →
Code, README und Prompts können nicht auseinanderlaufen.

**Auto-synchron.** `tests/modelReadmes.test.ts` generiert/prüft jetzt **README *und*
PROMPTS** je Ordner und erzwingt zusätzlich, dass **jede** Gebäude-ID einen Prompt in
`BUILDING_PROMPTS` hat. Neues Gebäude ohne Prompt/Motiv → Test schlägt fehl.
Regenerieren: `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`.

**Auswirkung/Zukunft.** Ein neues Gebäude in der Config zieht automatisch einen
Prompt-Slot nach sich; neue Modellnamen ergänzt man an einer Stelle. Damit lässt sich
die 3D-Welt Modell für Modell füllen, ohne Doku-Drift.

**Dateien.** Geändert: `src/assets/modelManifest.ts`, `tests/modelReadmes.test.ts`,
`docs/3D_MODEL_MANIFEST.md`, `docs/PATCHNOTES.md`. Neu (generiert):
`src/assets/models/<ordner>/PROMPTS.md` (9 Dateien inkl. `buildings/`).

## v0.35 — „Plattform-Pivot: natives PC-Spiel (Tauri), eine Codebasis"

**Was wurde geändert.** City Mayor Builder wird ab sofort als **natives PC-Spiel**
entwickelt (Windows zuerst, später Steam/macOS/Linux, danach Mobile) — aus **einer**
Codebasis. Der Browser bleibt reine Dev-/Test-Umgebung; **GitHub Pages ist kein
Zielplattform mehr**. Konkret:
- **Tauri 2** als Desktop-Wrapper eingerichtet: neues `src-tauri/` (Rust-Crate +
  `tauri.conf.json` mit fester `devUrl`, Fenster 1280×800, strikter CSP,
  Windows-Bundle nsis/msi), Deps `@tauri-apps/api`/`@tauri-apps/cli`, Skripte
  `tauri:dev`/`tauri:build`.
- **Vite Dual-Mode:** `base` von `/City-Mayor-Builder-Arbeitstitel-/` auf `'/'`
  (Root-Origin für Dev, Preview und Tauri gleichermaßen), fester Dev-Port 5173
  (`strictPort`), Build-Target für WebView2/WKWebView.
- **CI ohne Pages:** `deploy.yml` → `ci.yml` (nur Lint/Typecheck/Test/Build, kein
  Deploy). GitHub = nur Versionsverwaltung/Backup/Zusammenarbeit.
- **Verbindliche Doku:** neu `CLAUDE.md` (Arbeitsregeln), `docs/PROJECT_STRATEGY.md`
  (kanonische Strategie), `docs/ARCHITECTURE.md` (Seam/Modi/Assets/Migration),
  gefülltes `README.md`; `docs/CONCEPT.md` verweist auf den Pivot.

**Warum.** Die Zielplattform ist ein vollwertiges Spiel, kein Browser-Tab. Die
Grundlage (Desktop-Wrapper + verbindliche Regeln) sollte **einmal sauber** stehen,
bevor 3D-Welt und Gameplay weiter ausgebaut werden — statt später ein Komplettumbau.

**Welche Architektur wurde gewählt.** Bewusst **minimal-invasiv**: Die Simulation
(`src/game/`) ist bereits vollständig vom Rendering getrennt (verifiziert: keine
`three`/`pixi`/`react`/`zustand`/Renderer/UI-Imports unter `src/game/**`; Seam =
`GameController` + `IMapRenderer` + Zustand-Bridge, config-getrieben mit Zod, lineare
Save-Migrationen bis `SCHEMA_VERSION 9`). Deshalb war für Tauri **kein** Umbau der
Spiellogik nötig — nur Infrastruktur. Tauri 2 wurde gewählt, weil dieselbe Basis
später Android/iOS trägt (gleiche Simulation, nur UI/Kamera/Touch angepasst). Der
Rust-Wrapper ist bewusst dünn (nur Fenster + Frontend laden).

**Auswirkungen.**
- `npm run dev` läuft jetzt auf `http://localhost:5173/` (statt Unterpfad); Assets
  werden unter `/assets/…` ausgeliefert. Da alle Asset-URLs aus
  `import.meta.glob('?url')` stammen und `base` automatisch erben, war **ein** Wert
  ausreichend — kein Pfad-Refactor, kein Code an Registry/Renderer.
- Savegames: unverändert `localStorage` (`cmb.save.*`) — funktioniert in der
  Tauri-WebView. Der Origin unterscheidet sich von der alten Pages-URL, daher wandern
  bestehende Browser-Saves nicht automatisch mit; Übertragung via Export/Import im
  Einstellungen-Panel.
- Kein GitHub-Pages-Deploy mehr; die öffentliche Pages-URL wird nicht weiter bespielt.

**Was wird dadurch später einfacher.** Native Datei-Saves (Tauri-`fs`), Auto-Updater,
Installer/Steam und die **Mobile-Version** (Tauri 2 Android/iOS) docken jetzt an eine
bestehende native Struktur an, ohne die Spiellogik anzufassen.

**Geänderte/neue Dateien.**
- Neu: `src-tauri/{Cargo.toml,build.rs,tauri.conf.json,src/main.rs,src/lib.rs,
  capabilities/default.json,icons/README.md}`, `CLAUDE.md`,
  `docs/PROJECT_STRATEGY.md`, `docs/ARCHITECTURE.md`, `.github/workflows/ci.yml`.
- Geändert: `vite.config.ts`, `package.json`, `package-lock.json`, `.gitignore`,
  `README.md`, `docs/CONCEPT.md`, `docs/PATCHNOTES.md`.
- Entfernt: `.github/workflows/deploy.yml`.

**Neue Ordner/Assets nötig.** `src-tauri/icons/` muss vor dem ersten Desktop-Build
lokal mit `npx tauri icon <quelle-1024.png>` befüllt werden (Icon-Binaries sind
gitignored; siehe `src-tauri/icons/README.md`). `src-tauri/target` und
`src-tauri/gen` sind generiert und gitignored.

**Hinweis zur Verifikation.** Der Windows-Build (`npm run tauri:build`) läuft nur auf
einem Windows-Host mit Rust + WebView2 — nicht in der Linux-Cloud-Umgebung. Verifiziert
wurde der Browser-Pfad (tsc/eslint/Tests/Build/3D-Screenshot) sowie die Gültigkeit der
Tauri-Konfiguration; die Desktop-Build-Schritte stehen im `README.md`.

## v0.34 — „Pro-Ordner-Modellisten, Upgrade-Stufen, Baustellen- & Welt-UI-Modelle"

Baut auf v0.33 auf und macht das Entwickeln eigener Modelle noch geführter.

**Modellliste pro Ordner (auto-synchron).** Jeder Modellordner hat jetzt eine
`README.md` direkt daneben (`src/assets/models/<ordner>/README.md`) mit exakt den
Modellnamen, die *dieser* Ordner anbindet — inkl. Aliassen, Ausrichtung und
Hinweisen. Quelle ist das neue `src/assets/modelManifest.ts` (die **einzige**
Namensquelle, die auch der Renderer nutzt) plus `buildings.config.ts` für die
Gebäudeliste. Ein Test (`tests/modelReadmes.test.ts`) hält alle READMEs synchron —
neues Gebäude/Modellname → Test schlägt fehl, bis regeneriert
(`WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`). Der Renderer
importiert seine Namensarrays jetzt aus `modelManifest.ts`, sodass Code und Doku
nicht mehr auseinanderlaufen können.

**Upgrade-Stufen pro Gebäude.** `<id>.glb` deckt weiterhin alle Stufen ab; optional
liefert `<id>_stage2.glb … _stage<N>.glb` je Ausbaustufe ein eigenes Modell (Stufe
N ≙ Upgrade-Level N−1) — automatisch nach `upgradeLevel` gewählt.

**Baustellen-Modell pro Gebäude — jetzt auch bei Upgrades.** Während Bau *und*
Upgrade zeigt der Renderer eine Baustelle: pro Gebäude `<id>_construction.glb`,
sonst ein generisches Baustellen-Prop (`construction_site` …), sonst ein
prozedurales Gerüst. Beim Upgrade bleibt die aktuelle Stufe darunter sichtbar.

**Welt-UI mit 3D-Modellen (neuer Ordner `models/ui/`, Loader `uiModel()`).** Der
Auswahlring unter dem gewählten Gebäude ist per `ui_selection_ring.glb` ersetzbar
(sonst prozedural). Über dem gewählten Gebäude schwebt ein Aktions-/Upgrade-Button
(`ui_upgrade_button` wenn Upgrade bereit, sonst `ui_build_button`) — nur, wenn das
Modell vorhanden ist. `ui_level_badge` ist als Slot reserviert.

Exakte Namen: die jeweilige Ordner-`README.md` bzw. `docs/3D_MODEL_MANIFEST.md` §0.

## v0.33 — „Drop-in 3D-Modelle für die ganze Welt (Renderer-Anbindung)"

Bisher las der 3D-Renderer nur **Gebäude**-Modelle ein; alles andere war rein
prozedural und ignorierte eingelegte `.glb`. Jetzt konsumiert der Renderer die
**gesamte** Drop-in-Pipeline — du kannst für **Gebirge/Terrain, Straßen, Brücken,
Props/Vegetation, Fahrzeuge, Marker und Effekte** eigene Modelle entwickeln, in den
passenden Ordner legen und siehst sie sofort. Fehlt ein Modell, bleibt der
prozedurale Fallback — das Spiel bricht nie. Gameplay/Savegames unberührt.

**Neu automatisch geladen (Dateiname = Schlüssel, rekursiv):**
- **Terrain/Gebirge** (`models/terrain/…`): Kachelmodell je Terraintyp ersetzt die
  farbige Basis-Kachel (`grass_tile`/`grass`, `forest_ground_tile`/`forest`,
  `ocean_tile`/`water`, `river_straight`/`river`, `mountain_ground_tile`/`mountain`,
  `sand_tile`/`sand`, `fertile_ground_tile`/`fertile`). Auf Gebirgs-Kacheln werden
  zusätzlich Gipfel/Felsen gestreut (`mountain_peak_medium`/`_large`/`rock_large`).
- **Straßen** (`models/roads/…`): Segment nach Nachbar-Maske gewählt und gedreht —
  `road_straight`, `road_curve`, `road_t_intersection`, `road_cross_intersection`,
  `road_end` (Kanonik: gerade = N–S, Kurve = N+E; Klassenvarianten
  `road_main_*` bevorzugt). **Brücken** (`models/bridges/…`) über Wasser/Fluss:
  `bridge_medium_road`, `bridge_small_stone`, … (sonst prozeduraler Deck-Fallback).
- **Props/Vegetation** (`models/props/nature/…`): Bäume/Büsche gecullt (nie auf
  Stadt/Straße) — `pine_tree`/`tree`, `bush_small`/`bush`.
- **Fahrzeuge** (`models/vehicles/…`): Verkehr `car`/`car_small`, Missions-Van
  `service_van`/`car_van` (Ausrichtung: Front +z).
- **Marker** (`models/markers/…`): schwebendes 3D-Modell statt Billboard —
  `marker_task`/`marker_problem`/`marker_construction`/`marker_upgrade` (+ Aliasse).
- **Effekte** (`models/effects/…`): Schornstein-Rauch `smoke_chimney` (sonst
  prozeduraler Sprite-Puff).

**Robustheit:** Modelle werden gecacht und pro Nutzung geklont; viele gleiche
Modelle (Terrain/Props) laufen als eine `InstancedMesh` (ein Draw-Call, gedeckelt).
Geteilte Cache-Ressourcen werden beim Neuaufbau **nicht** disposed — behebt einen
latenten Bug, der auch Gebäudemodelle nach dem ersten Rebuild leer gerendert hätte.

Exakte Namen, Aliasse und Ausrichtungs-Konventionen: **`docs/3D_MODEL_MANIFEST.md`
§0**.

## v0.32 — „3D-Welt-Asset-Struktur nach Referenzbild (Drop-in-Pipeline)"

Struktur- und Doku-Slice: die komplette 3D-Welt (wie im Referenzbild — Küstenwelt
mit Gebirge, Wald, Fluss, See, Meer, Stadtzentrum, Landmarken) lässt sich künftig
Modell für Modell als `.glb` einlegen, ohne Code-Änderung. Gameplay/Savegames
unberührt.

**Referenzbild analysiert** in Zonen (West Gebirge/Minen/Wasserfälle · Mitte
Stadtzentrum/Wohnviertel/Markt/Build-Zonen · Nord Felder/Fluss/Brücke · Ost Küste/
Leuchtturm/Hafen/Schiff · Süd See/Wald) → daraus eine vollständige Modellstruktur
für Terrain, Gebirge, Wasser, Küste, Gebäude, Landmarken, **Hero-Modelle**, Props,
Fahrzeuge, Marker und Effekte abgeleitet.

**Rekursive Drop-in-Pipeline** — Modelle werden jetzt **rekursiv** aus den
Unterordnern jeder Kategorie erkannt (`models/<kat>/**/*.glb`, Key = Dateiname).
Damit funktioniert die verschachtelte Ordnerstruktur als reines Drop-in.

**Neue Ordnerstruktur** angelegt:
`buildings/{housing,administration,economy,services,resources,energy,leisure,landmarks}`,
`terrain/{tiles,cliffs,mountains,water,coast,biome,hero}`, `roads`, `bridges`,
`props/{nature,city,construction,harbor,farm}`, `vehicles`, `markers`, `effects`.
Neuer Loader `bridgeModel()`; `roadModel/propModel/markerModel/effectModel/
vehicleModel/terrainModel/buildingModel` decken den Rest ab.

**BuildingDef.visual erweitert** (alle optional, honoriert vom 3D-Renderer):
`model3d` (explizite Datei), `model3dLod`, `fallbackModel`, `scale`,
`rotationOffset`, `footprintVisualOffset`, `sizeClass`. Auflösung: `model3d` →
`<id>[_stage<N>]` → `fallbackModel` → prozeduraler Platzhalter.

**Doku `docs/3D_WORLD_ASSETS.md` (neu)** — verbindliche Bauanleitung: Zonen-Analyse,
Modellstandard (Stil, Format, Pivot, 1 Tile = 1 Einheit, Größenrichtwerte),
Poly-/Textur-Budget + LOD/Instancing, komplette Modelllisten mit Dateinamen je
Kategorie inkl. **Hero-Modellen**, Fallback-Regeln, Marker-Arten (3D/Billboard/UI),
Effekte (Partikel vs. `.glb`), „Welt nicht statisch"-Leitlinien + Terrain-Daten-
Konzept, Prompt-Vorlagen und empfohlene Startreihenfolge. `docs/3D_MODELS.md`
verweist darauf.

**Fallbacks** für jeden Typ definiert (Gebäude/Terrain/Wasser/Straße/Brücke/Prop/
Fahrzeug/Marker/Hero) — immer spielbar, klar als Platzhalter erkennbar.

**Master-Manifest `docs/3D_MODEL_MANIFEST.md` (neu)** — die eine, verbindliche
Namensliste **aller** 3D-Modelle mit exakten Dateinamen (Gebäude aus der Config
abgeleitet: ID, Datei, Footprint, Level, Stufen; dazu Terrain/Straßen/Brücken/
Props/Fahrzeuge/Marker/Effekte). Ein Test (`tests/manifest.test.ts`) hält die Liste
synchron: kommt ein Gebäude in `buildings.config.ts` dazu, schlägt der Test fehl,
bis es im Manifest steht.

## v0.31 — „3D-Quality-Pass: Straßen, Verkehr, Marker, Vegetation, aktive Missionen"

Gezielter Politur-Durchgang für die 3D-Stadt — lesbarer, glaubwürdiger, lebendiger.
Kein Gameplay-Umbau, Savegames unberührt, alles additiv mit Platzhalter-Fallbacks.

**Straßen (§3)** — statt „dunkler Platten mit Punkten" jetzt ein echtes, auto-getiltes
Straßennetz: dunkle Fahrbahn + heller **Bordstein/Gehweg** an offenen Kanten +
**Mittelmarkierung** (nur größere Klassen), mit sauberen Kreuzungen, T-Stücken,
Kurven und Enden aus dem Nachbar-Muster. **Straßentyp-Hierarchie** vorbereitet
(residential/main/wide/industrial/boulevard) — künftige Straßen-IDs greifen ohne
Renderer-Änderung. Neuer Ordner `models/roads/` + `roadModel()`-Fallback.

**Verkehr (§4)** — Autos fahren nicht mehr kreuz und quer: **Momentum** (fahren
geradeaus durch, biegen nur an Kreuzungen ab, kein U-Turn außer an Sackgassen),
**Rechts-Spur-Versatz**, geformte Auto-Meshes (Karosserie + Kabine) und ein
**moderater Cap** (glaubwürdig statt massenhaft). Verschwinden sauber, wenn ihre
Straße abgerissen wird.

**Marker (§5)** — die diffusen transparenten Kästen sind weg. Jetzt **ein
farbcodierter Prioritäts-Pin pro Gebäude** (Aktiv-Mission > Baustelle > Problem >
Upgrade bereit), als kamera-zugewandtes Billboard mit Symbol, Umriss und Puls
(nur Missionsziele). Nie gestapelt.

**Vegetation-Culling (§7)** — Bäume/Büsche stehen **nie mehr auf Gebäuden oder
Straßen**: eigene, aus der Belegung gecullte Vegetations-Ebene (Instancing, gecappt),
mit Größen-/Rotationsvariation; nach Abriss wächst Natur auf freien Feldern nach.
Dazu leichte Gras-Farbvariation gegen die flache Sheet-Optik.

**Aktive Stadtarbeit in 3D (§6)** — „Essen verteilen" nutzt jetzt die Welt: bei
Missionsstart **fokussiert die Kamera** das erste Ziel, ein **Lieferwagen** startet
an Farm/Markt/Lager und **fährt per Wegfindung (BFS über das Straßennetz) zu den
Zielhäusern**, Ziele tragen deutliche Aktiv-Marker. Abschluss weiter per Klick.

**Platzierung & Auswahl (§10/§11)** — schönerer Bau-Ghost (klare grüne/rote
Footprint-Fläche + leuchtender Umriss + Volumen-Andeutung statt weißem Kasten);
kräftigerer, leicht leuchtender Auswahl-Ring.

**Pipeline (§14)** — neue Modellordner `models/{roads,props,markers,effects}/` mit
`roadModel()`/`propModel()`/`markerModel()`/`effectModel()` — Drop-in wie gehabt,
Fallback prozedural. Umfassende Welt-Asset-Doku folgt in v0.32.

## v0.30.1 — „3D-Fixes: sichtbare Straßen, Pan-Richtung, 2D für Prototyp"

- **Straßen waren im 3D-Modus unsichtbar**, weil sie unter den erhöhten
  Terrain-Kacheln lagen. Sie sitzen jetzt bündig **auf** dem Boden (mit feiner
  Mittelmarkierung) und bilden ein klar lesbares Straßennetz.
- **Schwenken vertikal invertiert:** Ziehen nach oben/unten war getauscht (links/
  rechts war korrekt). „Karte greifen und schieben" funktioniert jetzt in beide
  Richtungen konsistent.
- **2D/Isometrie im Prototyp wieder wählbar:** In den Einstellungen gibt es einen
  Kartenansicht-Schalter (3D / Isometrisch / 2D-Raster). **3D bleibt Standard**
  (und langfristig der einzige Modus); 2D/Iso sind fürs Testen und zum leichteren
  Unterscheiden von Gebäudetypen gedacht. Rein optisch — Spielstand identisch.
  (Der doppelte Debug-Schalter im Debug-Panel entfällt.)

## v0.30 — „3D-Kamera & Navigation: hochwertige Steuerung, nur noch 3D"

Kompletter Umbau der 3D-Navigation zu einer Steuerung, die sich wie in modernen
Aufbauspielen anfühlt — und die Karte läuft für Spieler jetzt **ausschließlich in
3D**. Gameplay, Wirtschaft, Gebäude, Missionen und Spielstände sind unverändert.

**Probleme der alten Kamera**
- Steuerung inline & verstreut im Renderer, kein zentraler Controller.
- Linksklick-Ziehen pannte immer (auch heikel im Baumodus), Rotation lag auf
  Shift, Rechtsklick-Ziehen pannte (kollidierte mit „Abbrechen").
- Kein Smoothing/Inertia, keine Pan-Weltgrenzen (man flog aus der Welt), nur grobe
  Zoom/Pitch-Limits. Keine Tastatur, keine Presets, keine Touch-Gesten, kein
  Cursor-Feedback, keine Einstellungen.

**Neue Kamera-Architektur**
- Zentraler, three-freier **`CameraController3D`** (Zielpunkt + Distanz/Yaw/Pitch,
  Clamping, Smoothing, Inertia, Presets, Fokus) — **unit-getestet** (9 Tests).
- **`CameraInputController`** bündelt Maus/Rad/Tastatur/Touch, gated den Baumodus
  und gibt Cursor-Feedback. **`cameraSettings`** speichert die Feineinstellungen.

**Maussteuerung**
- Linksklick-Ziehen = **schwenken** ("Karte greifen"). STRG+Links oder
  **Mittelklick** = **drehen + neigen**. Mausrad = **Zoom zum Cursor**.
- Rechtsklick bleibt **Abbrechen** und pannt nie. Klick (ohne Ziehen) wählt aus.

**Tastatur:** WASD/Pfeile bewegen, Q/E drehen, Bild↑/↓ neigen, +/- zoomen,
Leertaste = Zentrum, F = Auswahl fokussieren, Shift = schneller, ESC = abbrechen.

**Touch (vorbereitet):** 1 Finger schwenken, Pinch zoomen, 2-Finger-Twist drehen,
2 Finger vertikal neigen, Tippen auswählen.

**Grenzen & Bediengefühl**
- Zoom 10–200, Pitch 28°–84° (nie überkopf), Schwenk an die endliche Welt
  geklemmt — man kann nicht mehr aus der Karte fliegen.
- Weiche Übergänge + leichte Pan-Inertia; direkte Eingabe bleibt erhalten.
  Abschaltbar über „Weiche Kamera".

**Nur noch ein Kartenmodus — 3D als Standard**
- Kein sichtbarer 2D/Iso/3D-Umschalter mehr. 3D ist der einzige Spielermodus;
  `flat2d`/`isometric2d` überleben nur als **Debug-Fallback** (Einstellungen →
  Debug → Render-Engine). Kein Savegame-Risiko (Einstellung in localStorage).

**Kamera-Presets statt Moduswechsel** (unten mittig auf der Karte)
- **Stadtansicht** (schräg), **Bauansicht** (fast top-down für Straßen/
  Platzierung), **Übersicht** (weit raus), **Zentrum** (aufs Rathaus).
- Im Baumodus zusätzlich ein prominenter **„Bauansicht"**-Knopf. Dazu **Kompass**
  (Ausrichtung zurücksetzen) und **Zoom +/−**.

**Einstellungen (gespeichert):** Bewegungs-/Zoom-/Drehtempo, Drehen/Zoom umkehren,
weiche Kamera, Randscrollen, Reset — ersetzen den alten Kartenmodus-Schalter.

**Konflikte vermieden:** Kamera-Eingaben hängen nur am Canvas → UI-Klicks/-Scrolls
bewegen die Kamera nicht. Baumodus: Linksklick platziert/malt, Kamera bewegt sich
per Mittelklick/Tastatur; Rotation nur bewusst (STRG/Mittelklick).

**Marker in 3D:** Stadtarbeit-Ziele sind **Billboard-Sprites** — immer zur Kamera
gerichtet, bleiben bei Drehung/Neigung korrekt und lesbar.

**Technik & Doku**
- 2D/Iso-Renderer unangetastet und weiter lauffähig (Debug). `IMapRenderer` um
  optionale Kamera-Methoden erweitert; MapView swappt die Engine weiterhin sauber.
- Neu: **`docs/3D_CAMERA_CONTROLS.md`** (Maus/Tastatur/Touch/Presets/Einstellungen/
  Konfliktregeln/Struktur/Grenzen). `tsc -b --force`, ESLint, **110 Tests** und
  `vite build` grün; 3D-Standard + Stadt-/Bauansicht per Screenshot verifiziert.

## v0.29 — „Echte 3D-Karte (three.js) mit Live-Effekten"

Die Karte kann jetzt **wirklich in 3D** gerendert werden — ein neuer, echter
three.js-Renderer neben 2D-Raster und Isometrie. Einstellungen → Kartenansicht →
**3D**. Spiellogik, Platzierung, Ressourcen, Bedürfnisse, Stadtarbeit, Sektoren
und Spielstände bleiben unangetastet; 3D ist reine Darstellung (in localStorage,
nicht im Save).

**Neuer 3D-Rendermodus (`true3d`)**
- Vollständige three.js-Szene: perspektivische Kamera, Sonnenlicht + weiche
  **Schatten**, Hemisphären-Licht, Himmel/Nebel.
- **Kamera:** Ziehen/Rechtsklick = schwenken, Mausrad = zoomen, Umschalt+Ziehen =
  drehen/neigen. „Karte zentrieren" und Fokus-auf-Auswahl funktionieren wie in 2D.
- **Terrain** als instanziierte Kacheln mit leichtem Relief (Berge höher, Wasser
  tiefer, Wald mit Low-Poly-Bäumen); gesperrte Sektoren abgedunkelt.
- **Gebäude** als echte 3D-Körper: Modell aus `.glb`, falls vorhanden, sonst
  prozeduraler Block (Wände + Sattel-/Flachdach, Kanten, Kategorie-Farbe mit
  leichter Variation). **Ausbaustufen** wachsen in Höhe/Größe.
- **Auswahl** per Raycast-Klick + Boden-Ring; **Bauen** per Boden-Raycast mit
  grün/rotem Ghost (nutzt dieselbe Platzierungs-Prüfung wie 2D).

**Live-Effekte in 3D**
- **Fahrender Straßenverkehr:** Autos fahren automatisch über zusammenhängende
  Straßen (gedeckelt, prozedural; echte Fahrzeug-Modelle über `vehicles/*.glb`).
- **Bauarbeiten:** Gebäude im Bau transparent + gelber Gerüst-Käfig.
- **Schornsteinrauch** über aktiven Produktions-/Energiegebäuden, **Windrad-Rotor**
  dreht sich (auch über einen `rotor`-Node in echten Modellen).

**Drop-in-3D-Assets (keine Migration, kein Pflicht-Asset)**
- Neue Registry-Loader `buildingModel(id, stage)`, `terrainModel(name)`,
  `vehicleModel(name)` binden jede `.glb` unter `src/assets/models/{buildings,
  terrain,vehicles}/` automatisch ein. Fehlt ein Modell → Platzhalter, nie ein
  Absturz.
- **Ausbaustufen** brauchen standardmäßig 0 Extra-Dateien (Auto-Skalierung);
  optionale Varianten je Stufe über `<id>_stage<N>.glb`.
- **Benannte Nodes** `rotor`/`chimney` treiben Live-Effekte in echten Modellen.

**Doku `docs/3D_MODELS.md` komplett neu**
- Genaue **Ordnerstruktur** (wo welche Datei hinkommt), **Modell-Aufbau** (Format,
  Pivot, Maßstab 1 Tile = 1 Einheit, Achsen, Poly-/Material-Vorgaben), Umgang mit
  **Versionen/Upgrades**, **Live-Ansichten** (Bau/Verkehr) und die „wenige
  Dateien"-Strategie (~40 Dateien für den vollen Look, UI teilt sich Assets).
- Vollständige **Prompt-Liste** für Text-zu-3D-Tools (Gebäude, Terrain, Fahrzeuge)
  inkl. Stil-Prefix und Checkliste vor dem Export.

**Technik**
- Neuer Renderer `src/renderer/three/ThreeMapRenderer.ts`, gemeinsames Interface
  `IMapRenderer`; `MapView` wechselt die Engine (Pixi ↔ three.js) automatisch beim
  Umschalten zwischen 2D/Iso und 3D. `RenderMode` um `true3d` erweitert.
- Abhängigkeit `three` (+ Typen) ergänzt. `tsc -b --force`, ESLint, 101 Tests und
  `vite build` grün; 3D-Ansicht per Screenshot einer ausgebauten Stadt verifiziert.

## v0.28 — „Iso-Ausbau: Dächer, Bäume, Straßen, Schornsteinrauch + 3D-Modell-Doku"

Grafischer Ausbau der isometrischen Karte und Vorbereitung echter 3D-Modelle.

**Karte hübscher (§ „grafisch ansprechender")**
- Gebäude bekommen **Satteldächer** in Kategorie-Tönung (rot=Wohnen, weiß=Dienste,
  gold=Wirtschaft, grau=Produktion, …), **Fensterreihen** an den besonnten Wänden
  und eine **leichte Farb-Variation pro Gebäude**, damit eine Straße gleicher
  Häuser nicht monoton wirkt. Die klobigen 2-Buchstaben-Labels sind im Iso-Modus
  weg — die Stadt liest sich über Form/Farbe/Dach.
- **Ausbaustufen sichtbar (§ verschiedene Stufen):** höhere `upgradeLevel`
  wachsen in Höhe **und** bekommen zusätzliche Dach-Etagen — Haus → Doppelhaus →
  … liest sich als echtes Wachstum.
- **Dekorationen** sind jetzt echte kleine Props (Baum mit Krone, Blumenbeet,
  Brunnen, Bank) statt flacher beschrifteter Kacheln.
- **Straßen** haben Bordstein-Rand + helleren Belag + Mittelpunkt → lesen sich als
  Straßen, nicht als dunkle Tiles.

**Erste Live-Effekte (§ Live-Effekte)**
- **Schornsteinrauch** steigt über aktiven Produktions-/Energiegebäuden auf —
  gepoolte, gecappte Partikel im neuen `liveLayer`, nur im Iso-Modus, performant
  auch bei 250+ Gebäuden. Zusammen mit Bau-/Upgrade-Balken und Aktivitäts-Ringen
  wirkt die Stadt lebendig.
- Struktur für **fahrende Fahrzeuge/Routen** (Liefermissionen, Einsätze) ist über
  `liveLayer` + `vehicles/`-Ordner + `vehicleImage()` vorbereitet (nächster Slice).

**Echte 3D-Modelle — neue Doku `docs/3D_MODELS.md`**
- **Wo:** Iso-Sprites nach `src/assets/buildings/iso/<id>_iso.png` (sofort nutzbar),
  echte Modelle nach `src/assets/models/{buildings,terrain,vehicles}/<id>.glb`.
- **Wie:** Stufe A = 3D-Modell einmalig als transparentes Iso-PNG rendern (nutzt
  die bestehende Drop-in-Pipeline, kein Browser-3D nötig); Stufe B = späterer
  `true3d`-RenderMode mit three.js/Babylon lädt `.glb` (Projektion/Anker sind schon
  vorbereitet). Verknüpfung je Gebäude über `BuildingDef.visual`
  (`isoSprite`/`model3dRef`/`heightClass`/`anchor`), mit Fallback-Kette ohne Crash.
- **Prompts:** vollständige Modell-/Sprite-Liste (alle Gebäude) plus Iso-Kamera-/
  Licht-/Format-Vorgaben und Prompt-Präfix für Text-zu-3D-Tools (Meshy/Rodin/Tripo/…)
  bzw. gerenderte Iso-Frames.

**Verifikation:** tsc/eslint/vitest (101) grün, vite build ok, Iso-Screenshot einer
ausgebauten 267-Gebäude-Stadt geprüft (Dächer, Bäume, Straßen, Depth-Sorting).

## v0.27 — „Isometrie Slice 1: RenderMode, Iso-Projektion, extrudierte Gebäude"

Erster sauberer Schritt vom 2D-Raster zur isometrischen 2.5D-Karte (Iso-Mockup als
Zielrichtung). Bewusst **kein** Rewrite: Spiellogik, Gebäudeplatzierung, Ressourcen,
Bedürfnisse, Stadtarbeit, Sektoren und Savegames bleiben unverändert; nur die
Kartendarstellung ist erweitert. `flat2d` bleibt vollwertiger Fallback.

**Mockup-Analyse — was für MVP2 realistisch war:** isometrische Projektion,
Diamant-Terrain, extrudierte Gebäude-Platzhalter mit Höhe/Tiefe/Schattierung,
Depth-Sorting, Kamera/Zoom/Pan, Iso-Ghost/Auswahl/Overlays, Asset-Pipeline für
Iso-Sprites. **Später:** echte Iso-/3D-Gebäudesprites, Fluss/Ufer/Brücke, Gebirge-
Props, Fahrzeuge/Routen, feinere Straßen-Autotiles, Iso-Culling.

**RenderMode-System (§3)**
- `RenderMode = 'flat2d' | 'isometric2d'` in `useUiStore`, in **localStorage**
  persistiert (`cmb.renderMode`) — nicht im Savegame, also kein Speicherstand-Risiko.
- Umschalter in **Einstellungen → „Kartenansicht"** (2D-Raster / Isometrisch).
- `MapView` schiebt den Modus in den Renderer; `MapRenderer.setRenderMode` baut
  Terrain neu, erzwingt einen Gebäude-Redraw und zentriert die Kamera.

**Iso-Projektion (§4)** — neues `src/renderer/projection.ts` als einzige Quelle der
Wahrheit: `tileCenterWorld`, `footprintCenterWorld`, `isoTileDiamond`,
`isoFootprintDiamond`, `pickTile` (inverse), `isoDepth`. 2:1-Diamanten
(`isoW=64/isoH=32`, konfigurierbar). Kamera/Zoom/Pan laufen über die Container-
Transform → modus-unabhängig; Klick/Platzierung über `pickTile`. Logik bleibt in
Tile-Koordinaten.

**Depth Sorting (§5)** — `buildingLayer.sortableChildren`, `zIndex = (x+y)*8+(w+h)`:
hinten→vorne, große/vordere Gebäude überdecken korrekt. Terrain immer darunter,
Marker/Overlays darüber, UI (React) ganz oben. Flat-Modus unverändert.

**Gebäude im Iso-Modus (§7/§12/§17)** — Fallback-Kette: Straße = flacher Asphalt-
Diamant → `isoSprite` (async geladen, unten-mittig verankert, auf Footprint
skaliert) → **extrudierter Diamant-Block** (Deckfläche + zwei schattierte Wände,
Höhe aus `visual.heightClass`/Kategorie/Upgrade, 2-Buchstaben-Code + Upgrade-Pips).
Fehlt ein Asset, bleibt der Platzhalter — nie ein Crash.

**Terrain/Marker/Overlays iso** — Diamant-Terrain mit Relief-Hinweisen (Wald/
Gebirge/Wasser), gesperrte Sektoren als getönter Diamant + „+"; Coverage-Overlay,
Effekt-Radien, Ghost, Auswahl, Aktivitäts-Zielmarker und Bau-Vorschau alle in
Iso-Projektion an Weltkoordinaten gekoppelt.

**Asset-Pipeline (§7/§8/§11)** — `registry.ts` erkennt jetzt
`src/assets/buildings/iso/<id>_iso.png` (`buildingIsoImage`) und
`src/assets/terrain/<name>_iso.png` (`terrainIsoImage`). Neue Ordner:
`buildings/iso`, `terrain`, `props`, `models/{buildings,terrain,vehicles}`.

**3D-Vorbereitung (§9/§26)** — `BuildingDef.visual` trägt bereits
`cardArt/sheetArt/mapSprite2d/isoPreview/model3dRef/heightClass` (v0.26) für eine
konsistente Asset-Familie; `models/`-Ordner (bevorzugt `.glb`) angelegt. Die Iso-
Sprites sind Übergang **oder** finaler 2.5D-Stil **oder** aus 3D gerenderte Frames.

**Dokumentation (§25)** — neu: `docs/ISO_RENDERING.md` (Modi, Projektion, Layer,
Depth Sorting, Kamera, Fallbacks, Marker-Anker, 3D-Ausblick) und `docs/ISO_ASSETS.md`
(Ordner, Dateinamen, Größen, Stil-Prefix, Prompts für alle Gebäude/Terrain/Props/
Fahrzeuge/3D-Modelle).

**Akzeptanz (§24) erfüllt:** RenderMode flat2d/isometric2d ✓, flat2d unverändert ✓,
iso aktivierbar ✓, Tiles iso projiziert ✓, Gebäude korrekt positioniert ✓, Straßen
sichtbar ✓, Depth Sorting ✓, Kamera/Zoom/Pan ✓, `isoSprite`-Pipeline ✓, Fallback ✓,
Doku ✓, UI unverändert über der Karte ✓, keine Savegames betroffen ✓.

**Nächste Schritte:** reale Iso-Gebäudesprites ablegen (Slice 2); Iso-Terrain-
Sprites + Fluss/Ufer/Brücke + Gebirge-Props (Slice 3); Fahrzeuge/Routen (Slice 5).

## v0.26 — „UI-/UX-Überarbeitung: mockup-getreuer, größer, grafischer"

Gezielte Überarbeitung der Spieloberfläche anhand der aktuellen Screenshots, mit
dem Mockup als verbindlicher Zielreferenz. Karte bleibt 2D; bestehende Systeme,
Asset-Pipeline und die Trennung Logik/UI/Registry wurden weiterverwendet — keine
Parallelsysteme.

**Erkannte Probleme (aus den Screenshots)**
- Baushop: Gebäudebild und Werte/Badges wirkten überlappt, Karten klein; bei
  wenigen Gebäuden ein breites, halb-leeres schwarzes Bottom-Sheet.
- Wichtige Funktionen (Bürgermeister, Handel, Stadtarbeit, Wirtschaft) im
  Hamburger-Menü versteckt; „Karte" unnötig prominent als erster Quick-Button.
- Overlay-Button konnte das UI nicht ausblenden.
- Panels (Stadt-Status, Bürgeranliegen, Stadtarbeit) klein, textlastig, grafikarm;
  „Details ansehen" öffnete kein großes rechtes Sheet.

**Baushop komplett neu (§3)**
- Zonen-Karten: fester **Bildbereich** oben (großes Thumbnail, Footprint- und
  „Neu"/„Großprojekt"-Badges nur in den Ecken), darunter getrennt **Titel**,
  **Kernwerte** (Kosten · Bauzeit · Kapazität/Produktion · Unterhalt), **Status**
  (Freigeschaltet / Ab Level X / gebaut X/Y / Großprojekt) und ein eigener
  **Bauen-Button**. Keine Text-/Bild-Überlappung mehr, in keiner Kategorie.
- Größere Karten, zentriertes Raster; bei wenigen Gebäuden füllen dezente
  „Weitere Gebäude folgen"-Kacheln die Reihe — kein leeres schwarzes Loch mehr.
- Bautabs zeigen jetzt **Kategorie-Grafiken** (`CategoryArt`) statt reiner Icons.

**Quick-Actions & Menü neu priorisiert (§6/§7/§20)**
- Immer sichtbar unten rechts: **Bauen**, **Bürgermeister**, **Stadtarbeit**
  (ab L4), **Handel** (mit Handelskontor), **Overlay**, **Statistiken**,
  **UI ausblenden**, **Menü** — grafische Buttons (Drop-in-PNGs möglich).
- „Karte zentrieren" ist nicht mehr prominent, sondern liegt (mit Einstellungen)
  im Hamburger-Menü, das jetzt nur noch Sekundäres enthält.

**UI-ausblenden-Toggle mit Restore (§8)**
- „UI ausblenden" blendet das gesamte Overlay aus; die 2D-Karte bleibt voll
  spielbar. Ein deutlicher **„UI einblenden"**-Button bleibt unten rechts sichtbar.

**Rechtes Side-Sheet-System (§5)**
- Große Detailansichten docken rechts als vollhohe Sheets an (Stadt-Status-Details,
  Stadtarbeit, Handel, Bürgermeister, Wirtschaft). „Details ansehen" im linken
  Status-Panel öffnet dieses große rechte Sheet; kompakte Übersichten bleiben
  links. Solange ein rechtes Sheet offen ist, tritt das kompakte Bürgeranliegen-
  Widget zur Seite.

**Größer & grafischer (§16-§19)**
- Bürgeranliegen: größerer Porträt-Avatar, Belohnungen als Grafik-Chips
  (`RewardArt`: Geld/Gold/XP).
- Stadtarbeit-Board: große Aktivitäts-Illustration (`ActivityArt`) je Karte plus
  kleines Absender-Porträt; Featured-Charakter vergrößert.
- Stadt-Status: größere Icons/Balken. HUD- und Panelabstände erhöht.

**Asset-Pipeline auf UI ausgeweitet (§10-§13)**
- `src/assets/registry.ts` erkennt jetzt zusätzlich Drop-in-Bilder aus
  `ui/buttons`, `ui/categories`, `ui/markers`, `ui/activities`, `ui/events`,
  `ui/rewards`, `vehicles`, `overlays` (alle mit Fallback, nie ein Crash).
- Neue Art-Komponenten `CategoryArt`, `ActivityArt`, `RewardArt`, `MarkerArt`,
  `EventArt` (Bild wenn vorhanden, sonst Vektor/Glyph-Fallback).
- **`docs/UI_ASSETS.md`**: vollständige Liste aller UI-Bildgruppen mit exaktem
  Dateinamen, Zielordner, Größe (512×512, transparent), Stilhinweis, Verwendungs-
  ort und je einem Generierungs-Prompt.

**3D-/Isometrie-Konsistenz vorbereitet (§14)**
- `BuildingDef.visual` um `cardArt`, `sheetArt`, `mapSprite2d`, `isoPreview`,
  `model3dRef` erweitert, damit Baushop-Vorschau, Detail-Sheet, späteres
  Kartensprite und die spätere Iso-/3D-Variante dieselbe Asset-Familie teilen.
  Optional, vom 2D-Renderer ignoriert, ohne Datenmigration (`passthrough`).
  Dokumentiert in `docs/CONCEPT.md` §21 und `docs/UI_ASSETS.md`.

**Noch offen / Nächste Schritte**
- Kartengebäude, Karten-Marker und Fahrzeug-/Route-Animation (§4) sind noch nicht
  asset-gebunden — Ordner, Registry und Doku dafür stehen bereits bereit.
- Optionale Button-/Kategorie-/Aktivitäts-PNGs sind noch nicht beigelegt; bis
  dahin rendern die eingebauten Fallbacks.

## v0.25 — „Stadtarbeit wird aktiv: mehrere Aufträge, keine starren Cooldowns, Bronze/Silber/Gold"

Erste Ausbaustufe der Stadtarbeit-Überarbeitung (MVP2-Spec §2/§6/§7/§10/§12/§16).
Ziel: weg von „Aufgabe klicken → Sofortbelohnung → Cooldown", hin zu einem echten
Auftragsbrett, das aus der realen Stadt gespeist wird und aktives Spielen belohnt.
Das bestehende generische Aktivitäts-System wurde **erweitert** (keine Parallel-
Logik), Sim/UI/Rendering bleiben getrennt, die Karte bleibt 2D.

**Neu / geändert**
- **Mehrere Aufträge gleichzeitig (§16.1):** Neues `getActivityBoard()` liefert das
  komplette Missionsbrett — jede freigeschaltete Aktivität mit Belohnungsvorschau
  und einer **echten Verfügbarkeitsprüfung** aus der Stadt heraus (Freischalt-
  Level, benötigtes Quellgebäude, genügend Kartenziele, freier Auftragsslot).
- **Keine starren Cooldowns mehr (§2):** Lieferungen und Inspektionen haben **keinen**
  festen Cooldown — eine Lieferung ist verfügbar, solange Lebensmittelquelle und
  Wohngebiete existieren, und kann sofort erneut gestartet werden. Nur Bürger-
  meister-Entscheidungen behalten einen kurzen Cooldown, damit eine einzelne
  Politik nicht spam-gefarmt wird.
- **Qualitätsstufen Bronze/Silber/Gold (§6):** Lieferungen werden nach Tempo gegen
  ihr Zeitlimit bewertet (Gold ≤ 60 % der Zeit, Silber innerhalb, Bronze danach —
  ein verpasstes Limit lässt den Auftrag nie scheitern, senkt nur die Wertung).
  Die Belohnung skaliert mit der Wertung (Bronze ×0,6 / Silber ×1,0 / Gold ×1,35),
  zusätzlich zur Level-Belohnungsstufe. Das Abschluss-Popup zeigt die Medaille.
- **Aufträge aus der echten Stadt (§10):** `requiresAnyBuilding` an Aktivitäten und
  Entscheidungs-Optionen — z. B. „Essen verteilen" braucht Hof/Markt/Supermarkt,
  „Baumaterial liefern" ein Sägewerk/Steinbruch/Lager. Fehlt die Quelle, zeigt die
  Karte klar den Grund („Passendes Gebäude fehlt") statt eines toten Buttons.
- **Reichere Entscheidungen (§12):** Optionen tragen jetzt **mehrere gleichzeitige
  Effekte** (`buffs[]`) mit echten Trade-offs. Die drei Entscheidungen bieten
  3–4 Optionen (voll/maßvoll fördern, Liefervertrag übers Kontor, ablehnen; großes/
  kleines/gesponsertes Fest; volle/teilweise/keine Überstunden). Gebäude-gebundene
  Optionen sind ohne das nötige Gebäude sichtbar, aber gesperrt.
- **Kategorien & Schwierigkeit:** Jede Aktivität hat `category` (Versorgung/Inspektion/
  Politik/Event/…) und `difficulty` (Leicht/Mittel/Schwer). Die Auftragskarten zeigen
  Kategorie-, Schwierigkeits- und Zeitlimit-Badges.
- **Kein AFK-Verdienst:** Unverändert laufen alle Belohnungen ausschließlich über
  Commands beim aktiven Abschluss — offline entsteht kein Einkommen.

**UI**
- Auftragsbrett (`ActivityPanel`) und das Featured-Widget (`CityWorkPanel`) lesen
  jetzt das Board: Badges, Belohnungsvorschau, Restzeit-Timer bei laufender Mission,
  klare Blockier-Gründe. Abschluss-Popup mit Bronze/Silber/Gold-Medaille.

**Nächste Phasen (bewusst noch offen, spec-vermerkt)**
- §4/§16.2: sichtbares Lieferfahrzeug/animierte Route auf der Karte (renderer-lastig)
  — kommt als eigener Schritt; aktuell werden Ziele weiter als pulsierende Marker
  angeklickt.
- Inspektions-Ursachen-Minispiel (Problemursache wählen) als Folgeausbau.

## v0.24 — „Grafik-Asset-Pipeline: echte Bilder per Drop-in"

Damit das UI **exakt wie das Mockup** werden kann, braucht es echte gerenderte
Bild-Assets (gemalte/isometrische Grafiken). Diese kann die Umgebung nicht selbst
erzeugen — deshalb wurde stattdessen die **Einbaustelle** dafür gebaut: eine
Drop-in-Pipeline. Sobald Bilder abgelegt werden, zeigt die UI sie automatisch;
fehlt ein Bild, rendert weiter die eingebaute SVG-Grafik.

**Neu**
- `src/assets/registry.ts` — erkennt via `import.meta.glob` automatisch alle
  Bilder in `src/assets/resources|buildings|portraits/`, gekeyt nach Dateiname.
  Kein Wiring pro Datei, kein manuelles Manifest.
- `ResourceArt`, `BuildingArt`, `CitizenPortrait` rendern jetzt **Bild zuerst**
  (wenn vorhanden), sonst den SVG-Platzhalter. Bürgerporträts rotieren über
  `citizen_1..N` per Seed; Rollen (Bürgermeister/Händler/Feuerwehr/Bauamt) nutzen
  eigene Dateien.
- **`docs/ASSETS.md`** — vollständige Asset-Liste (alle Ressourcen, alle 34
  Gebäude, Bürger/Berater) mit exakten Dateinamen, Größen, technischen Vorgaben
  und je einem **fertigen Bild-Generierungs-Prompt** plus einheitlichem Stil-
  Prefix, sodass ein KI-Bildgenerator konsistente Grafiken im Mockup-Look liefert.

**Wichtig / ehrlich**
- Es liegen noch **keine** finalen Bilder bei — bis welche abgelegt werden, sieht
  das Spiel aus wie v0.23 (SVG-Cartoons). Die Pipeline ist getestet: ein Testbild
  in `src/assets/resources/money.png` ersetzte sofort und ohne Codeänderung die
  Geld-Grafik im HUD.
- Noch **nicht** an die Pipeline gebunden (bewusst, als möglicher Folgeschritt):
  die Kartengebäude im 2D-Renderer, Karten-Marker/Service-Symbole und große
  Aktivitäts-/Event-Bildkarten.

## v0.23 — „Cartoon-Artwork: illustrierte UI statt SVG-Icons"

Umsetzung der ausdrücklichen Vorgabe „generierte/cartoonartige Bilder statt
einfacher SVG-Icons". Die sichtbaren UI-Flächen zeigen jetzt kleine illustrierte
Spielgrafiken — Ressourcenobjekte, Gebäudebilder und Bürgerporträts — statt
Line-Icons. Alles ist cel-schattiertes SVG (keine externen Assets), aber bewusst
bildhaft gebaut (Dächer, Fenster, Gesichter, Kleidung, Schattierung) und sitzt in
austauschbaren Komponenten, sodass später echte Sprites an denselben Aufrufstellen
eingesetzt werden können. Karte bleibt 2D-Prototyp; Spiellogik unverändert.

**Neues Artwork-System (`src/components/art/`)**
- `ResourceArt` — bildhafte Ressourcen: Münzstapel (Geld), Goldbarren (Gold),
  Holzstapel mit Jahresringen (Holz), facettierter Felsblock (Stein), Obst-/
  Brotkiste (Nahrung), glänzender Wassertropfen (Wasser), Bürgergruppe
  (Einwohner), freundliches Medaillen-Emblem (Zufriedenheit).
- `BuildingArt` — pro Gebäude-ID eine eigene Cartoon-Illustration auf einem
  begrünten Grundstück: Häuschen mit Satteldach & Schornstein, Reihenhaus,
  Apartmentblock, Wohnturm, Rathaus/Verwaltung mit Säulen & Fahne, Farm mit Silo
  & Feld, Sägewerk mit Sägeblatt, Steinbruch, Brunnen, Wasserturm, Lagerhalle,
  Läden mit Markise & Emblem (Markt/Bäckerei/Büro/Handelskontor), Notdienste mit
  Wappen (Feuerwehr/Polizei/Krankenhaus), Kraftwerk mit Kühltürmen, Windrad,
  Park, Baum, Blumenbeet, Brunnen, Bank, Straße. Fallback pro Kategorie.
- `CitizenPortrait` / `AdvisorPortrait` — Cartoon-Figuren mit Gesicht, Frisur,
  Kleidung und Rollen-Kopfbedeckung (Bauhelm, Feuerwehrhelm, Händlerkappe,
  Bürgermeister-Krone) auf rollengefärbtem Hintergrund. Deterministisch aus einem
  Seed: gleiches Anliegen → gleiche Person, verschiedene Anliegen → sichtbar
  unterschiedliche Bürger (Haut-, Haar-, Kleidungsvarianten).

**Wo das Artwork eingebunden ist**
- HUD-Ressourcenkarten (`GameHud`) zeigen `ResourceArt` statt Lucide-Icons.
- Baumenü-Karten (`BuildMenu`) und Gebäude-Info-Sheet (`FloatingBuildingSheet`,
  neuer Bild-Hero oben links) zeigen `BuildingArt`.
- Bürgeranliegen (`CitizenRequestsPanel`), Stadtarbeit (`CityWorkPanel`),
  Aktivitätsboard (`ActivityPanel`) und Entscheidungs-Popup (`DecisionModal`)
  zeigen Porträts statt Avatar-Icons.
- **Level-Up-Popup** (`EventModal`) zeigt jetzt für jede neu freigeschaltete
  Gebäudeart eine Artwork-Karte plus die Levelbelohnung (Geld/Gold mit
  Ressourcen-Artwork) und einen „Zum Baumenü"-Button — statt einer reinen
  Textzeile (Mockup §8).

**Was noch Platzhalter/2D bleibt**
- Alle Grafiken sind stilisierte SVG-Platzhalter im einheitlichen Cartoon-Stil,
  keine gerenderten Raster-Assets — die Komponenten sind aber so gebaut, dass
  finale Sprites 1:1 an denselben Stellen eingesetzt werden können.
- Die Karte selbst bleibt der 2D-Prototyp; nur die UI-Grafiken wurden ersetzt.

**Verifikation:** `tsc -b --force`, `eslint`, `vite build` und `vitest run`
(97 Tests) grün; Playwright-Smoke bestätigt fehlerfreies Rendern von HUD,
Baumenü und Wohn-Thumbnails.

## v0.22 — „UI-Überarbeitung: hochwertiges City-Builder-Interface nach Mockup"

Komplette Neugestaltung von HUD, Panels, Baumenü, Gebäude-Sheet und Overlays
entlang des vorgegebenen UI-Mockups. Die 2D-Prototyp-Karte bleibt unverändert —
nur die Oberfläche wurde überarbeitet. Es wurde bewusst kein paralleles System
gebaut: alle Panels lesen die vorhandenen echten Spielwerte über den bestehenden
Controller/Store, das Rendering bleibt sauber von der Simulation getrennt.

**Wie wurde das UI dem Mockup angepasst?**
Aus der alten Top-Bar-/Bottom-Bar-Struktur wurde ein permanentes HUD-Rahmen­
layout wie im Mockup: oben die Ressourcen-HUD-Leiste, links oben der Stadtstatus,
links unten die Stadtarbeiten, rechts die Bürgeranliegen, unten das Baumenü,
unten rechts die Schnellaktionen, mittig das Gebäude-Info-Sheet und ein
Versorgungs-Banner oben.

**Neue Komponenten**
- `GameHud` + `ResourceCard` — obere Ressourcenleiste mit rundem Level-Badge,
  XP-Balken und je einer Karte pro Ressource (Icon-Chip · großer Wert ·
  Zuwachs/min). Menü-Button rechts (`MenuPanel`).
- `CityStatusPanel` — permanentes Stadtstatus-Widget (Zufriedenheit, Wasser,
  Essen, Arbeit, Umwelt, Sicherheit) mit Icon, Balken und konkreter
  Statuszeile; „Details ansehen" öffnet die volle Kontrollraum-Ansicht
  (`CityStatusDetail`, vormals das ausführliche Panel).
- `CityWorkPanel` — permanentes Stadtarbeiten-Widget mit Absender-Avatar,
  Timer, Beschreibung, Fortschrittsbalken und Belohnung; „Alle Aufträge"
  öffnet das vollständige Board (`ActivityPanel`).
- `CitizenRequestsPanel` — Bürgeranliegen rechts als lebendige Karten mit
  Porträt, Sprechblase, Aufgabe, Fortschrittsbalken und Belohnung
  (ersetzt/erweitert das frühere `QuestPanel`).
- `QuickActionBar` — Schnellaktionen unten rechts: Bauen, Karte (Kamera
  zentrieren), Overlay, Statistiken, Einstellungen — erweiterbar angelegt.
- `ServiceOverlayBanner` — Versorgungs-Banner oben mittig („Wasser-Versorgung —
  92 % abgedeckt"), gespeist aus den Coverage-Zählwerten der Simulation.

**Neue HUD-Leiste (§2)** — Level-Badge + XP-Balken, dann Geld (mit stabilem
Einkommen/min), Holz, Stein, Nahrung, Wasser (Frischwasser oder Abdeckung),
Einwohner (mit Zuzugsrate) und Zufriedenheit (Prozent + Laune). Kompakte
Zahlen (`61,5 Mio.`, `1,2 Mio.`, `12.500`).

**Gebäude-Info-Sheet (§6)** — breiteres Sheet mit Kopf (Icon, Name,
Level-Pips, Status-Badge, Schließen), Kategorie-/Status-Zeile, einer klaren
Werte-Grid (Bewohner/Wohnungen/Radius/Produktion/Einnahmen/Unterhalt statt
Fließtext), Problem-/Vorteil-Diagnosen und großen, beschrifteten Aktions-
Buttons (Ausbau · Verschieben · Radius · Abreißen) mit Kosten/Wirkung.

**Service-Overlay & Marker (§7/§8)** — Beim Auswählen eines Radius-Gebäudes
erscheint das Versorgungs-Banner oben; die Karte färbt versorgte/teilweise/
unversorgte Gebäude wie bisher (Coverage-Overlay), plus Overlay-Modus über den
Schnellbutton (Rahmen-Hervorhebung). Marker/Overlays leiten sich aus
Simulationsdaten und Weltkoordinaten ab, nicht aus Bildschirmpixeln.

**Baumenü (§9)** — Gebäudekarten jetzt vertikal mit Bild-/Miniatur-Fläche oben,
Name, Kosten, Bauzeit, Größe, Limit und „Neu"-Badge; Kategorie-Tabs mit
Neu-/Problem-Punkten. Das Menü sitzt eingerückt zwischen Stadtarbeiten und
Schnellaktionen, sodass nichts verdeckt wird.

**Angebundene echte Spielwerte** — Ressourcen/Produktion/Einkommen,
Zufriedenheit & Bedürfnisse, Bevölkerung/Zuzug, Quests & Fortschritt,
Gebäude-Effekte/Upgrades, Bau-/Upgrade-Kosten, Serviceabdeckung, Aktivitäten
und Handelsaufträge. Kein Wert ist hartkodiert; Näherungen (z. B. „N Gebäude
ohne Wasser", Umwelt-Score) sind klar aus der Simulation abgeleitet.

**Design-Tokens (§16)** — zentrale Tokens erweitert: transluzente Panel-Flächen
über der hellen Karte, größere Radien/Schatten, Ressourcen-/Status-/Marker-
Farben, Badge- und Button-Stile — konsistent und leicht anpassbar.

**Was bleibt bewusst 2D / 3D-Vorbereitung (§14)** — Die Karte bleibt 2D-
Prototyp; kein Rendering-Umbau. Das UI ist rendering-unabhängig gehalten:
Marker/Sheet koppeln an Gebäude-/Weltkoordinaten (nicht an Pixel-Hacks), die
Kamera wird über eine schmale `MapApi`-Brücke angesteuert, Overlays kommen aus
Simulationsdaten — damit ist der Wechsel auf eine 2.5D/Iso-Ansicht später ohne
UI-Neubau möglich.

**Verifikation** — `tsc`, ESLint und `vite build` sauber; 97/97 Vitest-Tests
grün; Browser-Smoke-Test bestätigt fehlerfreien Start und das vollständige neue
HUD (Ressourcenkarten, Stadtstatus, Bürgeranliegen, Schnellaktionen, Baumenü,
Gebäude-Sheet).

## v0.21 — „Aktive Stadt: kein AFK-Farmen mehr, echtes Stadtmanagement"

Die große Richtungsänderung weg vom Idle-/AFK-Spiel hin zum aktiven
Bürgermeister-Städtebau. Verdient wird nur noch beim Spielen; dazu ein neues
Stadtarbeit-System, realistische Einwohnerzahlen, ein straffes Nahrungs-/
Wasser-Balancing und eine Reihe Bugfixes. Savegame-kompatibel über eine
Migration (Schema **v8 → v9**); alte Spielstände laden unverändert.

**Kein passives AFK-Farmen mehr (§1/§16)**
- Bei geschlossenem oder im Hintergrund liegendem Spiel läuft **nur noch**:
  Bau- und Upgrade-Timer (inkl. deren XP bei Abschluss), Ablauf von Buffs/
  Ereignissen und Cooldowns. **Nichts** wird offline produziert, verkauft,
  verdient, verbraucht oder bevölkert.
- Technisch: Die gesamte Wirtschaft (Produktion, Verbrauch, Bedürfnisse,
  Zufriedenheit, Einkommen, Bevölkerungsfluss, Feuer) läuft in `advanceLiveEconomy`
  und wird nur bei `live`-Ticks ausgeführt. `App.tsx` tickt live nur, wenn der
  Tab sichtbar ist (`document.visibilityState === 'visible'`).
- Der passive Überlauf-Export ist **komplett entfernt**. Ersatz: deutlich
  höhere aktive Verkaufspreise (Holz 2 → **10**, Stein 4 → **20**, Nahrung 1 →
  **5**, Frischwasser 1 → **3** pro Einheit), nur über das Handelskontor.

**Neues aktives Stadtarbeit-System (§2/§15/§3)**
- Ein generisches, config-getriebenes Aktivitäten-System (`activities.config.ts`)
  mit vier MVP2-Typen:
  - **Lieferung** (Essen/Baumaterial verteilen): 3–5 Zielgebäude leuchten auf
    der Karte, per Klick beliefern; schnelle Erledigung gibt einen Zeitbonus.
  - **Stadtinspektion**: Problemgebäude finden und begutachten.
  - **Bürgermeister-Entscheidung**: Popup mit Berater/Bürger und 2–3 Optionen
    samt klaren Vor-/Nachteilen (Kosten ↔ Produktions-/Zufriedenheits-Buff).
  - **Handelsaufträge**: rotierende Angebote am Handelskontor, deterministisch
    pro Zeitfenster; seltene Großaufträge bis ~1 Mio.
- Belohnungen skalieren nach Level-Band (früh Tausender, ab L6 Zehntausender,
  ab L10 Hunderttausender) und laufen ausschließlich über Controller-Commands →
  inhärent aktiv, nie offline. Eigenes **Stadtarbeit-Panel**, Kartenmarker mit
  Zielringen, Abschluss-Popup, Sound-Hook (`services/feedback.ts`) vorbereitet.
- **Manuelle Essens-Verteilung (§3)**: die `food_delivery`-Aktivität gewährt
  einen zeitlich begrenzten Verteil-Buff, der Häuser ohne Marktabdeckung
  vorübergehend voll versorgt — echter Unterschied „produzieren vs. verteilen"
  ohne neue Simulation.

**Realistische Einwohnerzahlen (§9)**
- Neuer Config-Wert `populationScale = 20`: Jedes Haus fasst das 20-fache seiner
  angegebenen Haushalte, sodass eine ausgebaute L11-Stadt ~80–120k Einwohner
  erreicht (statt ~5,5k). Alle Pro-Kopf-Größen (Steuer 40 → 2, Nahrung/Wasser/
  Arbeit) werden durch 20 geteilt, Wachstums- und Service-Kapazitäten mal 20 —
  die Ökonomie bleibt größenordnungsgleich, nur die Zahlen sind glaubwürdig.

**Nahrung & Wasser als echte Engpässe (§8)**
- Nahrungsbedarf pro Kopf ~40 % straffer als eine neutrale Neuskalierung.
- Brunnen 200 → **120**, Wasserpumpe 3000 → **1800/3000/4600**, kleine Häuser
  brauchen mehr Wasser (4 → 6, ausgebaut 8 → 12) — Wasser wächst mit der Stadt
  und macht Pumpen/Upgrades nötig.

**Sektor-Aufgaben korrekt gezählt (§5)**
- `stats.sectorsUnlocked` zählt jetzt nur **zusätzliche** Sektoren; der
  Startsektor zählt nicht mehr mit. „Erste Erweiterung" verlangt damit wirklich
  einen ersten Kauf. Neue Folge-Aufgaben `qe_expand3`/`qe_expand4`.

**Handel dauerhaft per UI erreichbar (§6)**
- Sobald ein Handelskontor gebaut wurde, erscheint ein permanenter
  **Handel-Button** in der Fußleiste — kein Gebäude-Suchen mehr. Ein Kontor
  reicht fürs ganze Spiel, Upgrades verbessern die Kurse.

**Aktive Aufgaben & entzerrte Progression (§10–§14)**
- Neue Aufgaben-Zieltypen `upgrade`, `activity`, `tradeEarnings`.
- Viele neue aktive Aufgaben für L6–L8 (Reihenhäuser, Sägewerk/Steinbruch
  ausbauen, Büro, Essen verteilen, Inspektion, Handelsaufträge, große
  Handelsziele).
- **Wohn-Freischaltungen entzerrt (§13)**: Apartment L9 → **L10**, Reihenhaus-
  Ausbau L8 → **L9**, Mehrfamilienhaus L10 → **L11**, Stadthaus L12 → **L13** —
  kein Wohn-Upgrade mehr im selben Level wie ein neues Wohngebäude (per Test
  abgesichert).

**Bugfix: Energie-Gebäude sichtbar (§18/§19)**
- Das Baumenü hatte keinen **Infrastruktur/Energie-Tab** — Kohlekraftwerk und
  Windpark konnten nie erscheinen. Neue Kategorie **Energie**; Windpark schon ab
  **L11** (erneuerbare Alternative zur Kohle). Bautabs vollständig überarbeitet,
  leere Tabs werden ausgeblendet.

**Karte nach Westen erweitert (§17)**
- Zwei neue Sektor-Spalten (`worldBounds.minSx -2`) mit einem Gebirge und zwei
  Tal-Korridoren; hinter der Felswand liegt Land für ein späteres Biom. Der
  Steinbruch-Fels-Bonus wird dadurch wertvoller.

**Stabiles Einkommen für Großprojekte (§20)**
- Die Großprojekt-Empfehlung und das Wirtschafts-Panel zeigen jetzt das
  **stabile** Einkommen (ohne temporäre Boosts); aktive Boosts werden separat
  ausgewiesen. Einmalige Handels-/Auftragsgelder fließen nicht in /min-Werte.

**Bessere Service-Overlays (§21)**
- Versorgungs-Overlays füllen betroffene Gebäude-Grundflächen jetzt farbig
  (versorgt/teilweise/ohne) und zeigen eine Zusammenfassung mit Zählwerten.

**3D-/Visual-Vorbereitung**
- Optionales, ungenutztes `visual`-Feld auf Gebäuden (Höhenklasse, 2D/Iso/3D-
  Asset-Referenzen, Overlay-Anker) — vorbereitet für spätere hochwertige
  Darstellung, ohne die Spiellogik zu berühren. Marker/Overlays rechnen bereits
  in Welt-Koordinaten.

**Balancing-Feinschliff (§1/§22)**
- XP-Kurve unverändert (L1–5 bleiben schnell), aber Level-Up-Geldgeschenke
  L2–L5 um ~15 % gesenkt — die neuen aktiven Aufgaben tragen den frühen
  Geldfluss.

**Tests & Verifikation**
- **97/97 Vitest-Tests grün**, `tsc`, ESLint und `vite build` sauber. Neue
  Tests: Offline-Gating, das Aktivitäten-System (Lieferung/Entscheidung/
  Handelsauftrag), die v8→v9-Migration und die Wohn-Progressions-Invariante.
  Browser-Smoke-Test: sauberer Start ohne Fehler, Energie-Tab vorhanden.

**Empfohlene nächste Balancing-Schritte**
- Ein Zeit-Skip-Durchlauf L1–14 über die Debug-Tools, um Nahrungs-/Wasser-
  Korridore und die ×20-Einwohnerkurve im echten Verlauf zu prüfen.
- Das schwergewichtige Service-Overlay (Karten-Abdunkelung, Legende als
  Vollpanel) und tiefere Ausbaupfade für Reihenhaus/Apartment/Wohnturm sind
  bewusst als Folge-Schritt offen gelassen.

---

## v0.20 — „Langzeit-Ausbau, aktiver Handel & Steuer-Regler bis 500 %"

Großer Balancing- und Mechanik-Pass für das Mid-/Late-Game. Der kritische
Upgrade-Bug ist behoben, Wohn- und Produktionsgebäude bekommen lange, teure
Ausbaupfade, überschüssige Rohstoffe werden für aktive Spieler zu Geld, und der
Steuer-Regler wird zu einem echten Entscheidungswerkzeug. Alles bleibt
config-getrieben und savegame-kompatibel (Schema v8 unverändert; das neue
`targetUpgradeLevel`-Feld ist optional, alte Spielstände laden unverändert).

**Kritischer Upgrade-Fix (§2) — Gebäude behalten ihre Wirkung während des Ausbaus**
- Bisher verlor ein Gebäude beim Upgrade *sofort* seine Funktion: Bewohner
  raus, Produktion/Radius/Versorgung/Lager auf 0, bis der Ausbau fertig war.
- Neu: Ein Ausbau merkt sich nur ein **Ziel** (`targetUpgradeLevel`) und lässt
  `upgradeLevel` (die *abgeschlossene* Stufe) unangetastet. Solange gebaut wird,
  bleiben **alle Eigenschaften der aktuellen Stufe voll aktiv** — Wohnkapazität,
  Bewohner, Produktionsrate, Radius, Service-Coverage, Lager, Jobs, Einnahmen,
  Unterhalt. Erst bei Abschluss schaltet der Tick sauber auf die Zielstufe um.
- Kein Doppel-Effekt, kein Produktions-Blackout, kein Wegzug mehr. Geprüft durch
  neue Tests (Rathaus behält seinen Lagerausbau, Sägewerk produziert
  ununterbrochen weiter) — greift für Live-Tick *und* Offline-Catch-up.
- UI: „Ausbau läuft — aktuelle Stufe bleibt voll aktiv" inkl. Zielstufen-Name.

**Langsamere Levelprogression (§1)**
- XP-Kurve ab L4 um ~15–30 % gestreckt (L5 620 statt 480, L10 ~5 700 statt
  4 400, L14 ~21 400 statt 16 800). L1–3 bleiben bewusst schnell, damit der gute
  Early-Flow erhalten bleibt — Level-Ups fühlen sich jetzt wertvoller an.

**Wohngebäude-Ausbaupfade (§3/§4/§5) — Zentrum bleibt langfristig wichtig**
- Kleines Haus hat jetzt einen 6-stufigen Pfad auf gleicher 2×2-Fläche:
  Kleines Haus → Ausgebautes Haus (L3) → **Doppelhaus (ab L8)** →
  Mehrfamilienhaus (L10) → Stadthaus (L12) → Wohnblock (L14, 16 Haushalte).
- Das Doppelhaus ist wie gefordert **erst ab Level 8** verfügbar. Höhere Stufen
  sind teuer (bis 1,4 Mio. €) und anspruchsvoller (mehr Wasser/Unterhalt), dafür
  wird das Gründerhaus dauerhaft wertvoll — ein voll ausgebautes Kleines Haus
  ersetzt eine ganze Straße Starterhäuser. Reihenhaus/Apartment/Wohnturm haben
  bereits mehrstufige Pfade und bleiben.

**Produktionsgebäude-Upgrades (§14)**
- Sägewerk ab **L7** (ab 200.000 €): Verbesserte Sägen → Automatisiertes
  Sägewerk → Industrie-Sägewerk (45 → 300 Holz/min).
- Steinbruch ab **L8** (ab 300.000 €): Bessere Fördertechnik → Schweres Gerät →
  Industrieller Steinbruch (38 → 240 Stein/min).
- Farm ab **L8** (ab 300.000 €): Bewässerung → Moderne Landwirtschaft →
  Automatisierte Farm (220 → 1 250 Nahrung/min). Höhere Farmstufen brauchen
  jetzt **Wasser** — mehr Nahrung heißt auch mehr Wasserwerk (echtes Trade-off).
- Spätere Stufen kosten Millionen und ziehen mehr Arbeitskräfte/Energie/Unterhalt.

**Aktiver Rohstoff-Überlauf (§6)**
- Läuft ein Lager voll, wird überschüssige Produktion **nur im aktiven Spiel** zu
  Geld (Holz 2 €, Stein 4 €, Nahrung/Trinkwasser 1 € je Einheit). Offline/
  Catch-up gibt es **kein** Export-Geld — kein AFK-Gelddrucker. Anzeige in der
  Stadtkasse: „Überschuss-Export: +X €/min".

**Neues Gebäude: Handelskontor (§7)**
- Ab L5 baubar. Schaltet **aktiven Handel** frei: Rohstoffe manuell verkaufen
  (Hälfte/alles) oder — teuer, mit 4× Aufschlag — kaufen. Upgrades (Rohstoffbörse
  +25 %, Exportzentrum +50 % Verkaufskurs) verbessern den Kurs. Kaufen liegt weit
  über jedem Verkaufskurs, also kein Arbitrage-Exploit — Produktion bleibt die
  Hauptquelle. Eigenes Handels-Panel, geöffnet über das Gebäude-Sheet.

**Verschiebbare Produktionsgebäude (§8)**
- Sägewerk, Steinbruch und Farm sind jetzt über das Gebäude-Sheet **verschiebbar**
  (kleine Umzugsgebühr). Zielort wird neu geprüft (Terrain, Straße), Standortbonus
  neu berechnet — frühe Fehlplatzierung ist keine dauerhafte Strafe mehr.

**Steuer-Regler bis 500 % (§9)**
- Band von ±50 % auf **50–500 %** erweitert. Hohe Sätze bringen mehr Geld pro
  Kopf, kosten aber massiv Zufriedenheit (Wohnsteuer bei 300–500 %: −48 … −96),
  wodurch Zuzug einbricht und Bürger wegziehen — ein Werkzeug, kein Gratisgeld.
  UI: Warnfarben ab 150 %/250 % und eine Effekt-Vorschau der Zufriedenheitskosten.

**Prototyp-Cheats (§10)**
- Neuer, klar als Test markierter **Debug-Bereich** (Feature-Flag `debugTools`,
  über Einstellungen): +100.000 € / +1.000.000 €, alle Lager auffüllen, alle
  Bauten abschließen, alle Upgrades abschließen. Läuft über GameController-Commands
  (mit Reason geloggt), nie am normalen Datenfluss vorbei.

**Farm & Ressourcenwert (§11/§12/§13)**
- Nahrungsverbrauch pro Kopf angehoben (0,03 → 0,05) — Nahrung ist jetzt ein
  echter, aber fairer Engpass; eine wachsende Stadt braucht mehr/aufgewertete
  Farmen und einen guten fruchtbaren Standort.
- Standortboni verstärkt und sichtbarer: Steinbruch an Fels bis **+70 %**, Farm
  auf fruchtbarem Boden bis **+50 %** — die frühe Entscheidung Gebirge vs.
  fruchtbares Land hat jetzt spürbar unterschiedliche Stärken.
- Volle Lager sind sinnvoller (aktiver Export + Handelskontor), teure
  Material-Upgrades verbrauchen Überschüsse — Rohstoffe fühlen sich wertvoller an.

**Level-7-Aufgabe (§16)**
- Neue Bauamt-Aufgabe „Mehr Wohnraum": 10 Kleine Häuser + 6 Reihenhäuser (passt
  genau zu den Wohnlimits bei L7). Belohnung: Geld, XP **und Material** (Holz/
  Stein — neu unterstützt). Zählt Lebenszeit-Bauten, erfüllt sich also automatisch,
  wenn schon genug gebaut wurde.

**Geänderte Dateien**
- Logik: `types.ts` (targetUpgradeLevel), `buildings/effects.ts` (isContributing),
  `simulation/derived.ts`, `simulation/tick.ts` (live-Flag, Überlauf-Export,
  Upgrade-Abschluss), `commands/controller.ts` (Upgrade-Fix, Handel, Cheats,
  Überlauf-Anzeige).
- Config: `types.ts`, `schemas.ts`, `balancing.config.ts`, `levels.config.ts`,
  `buildings.config.ts`, `needs.config.ts`, `quests.config.ts`.
- UI: `TradePanel.tsx` (neu), `DebugPanel.tsx` (neu), `App.tsx`, `store.ts`,
  `FloatingBuildingSheet.tsx`, `EconomyPanel.tsx`, `SettingsPanel.tsx`,
  `i18n/de.json`, `styles.css`.
- Tests: `tests/upgrade.test.ts` (neu, 7 Tests), `tests/systems.test.ts`
  (Steuerband). **92/92 Tests grün, Lint + Build sauber.**

**Empfohlene nächste Balancing-Tests**
- Simulierter Durchlauf L1–14 mit Zeit-Skip (Debug): Wie lange bis zur ersten
  Doppelhaus-/Sägewerk-Stufe? Fühlen sich die 200k/300k-Schwellen fair an?
- Voll-Lager-Szenario: Reicht der aktive Export, um Warten zu überbrücken, ohne
  Produktion zu entwerten? Sind die Export-/Handelskurse (2/4/1) stimmig?
- Nahrungs-Engpass: Ab welcher Einwohnerzahl reicht 1 Farm nicht mehr? Passt der
  neue Verbrauch (0,05) zu den Farmstufen und dem Wasserbedarf?
- Steuer-Stresstest: Bei welchem Satz kippt die Stadt in den Wegzug? Ist 500 %
  ein sinnvoller „Notgroschen" oder zu hart/zu weich?
- Upgrade-während-Betrieb: Große Stadt, mehrere gleichzeitige Upgrades — bleibt
  Zufriedenheit/Versorgung durchgehend stabil?

## v0.19.1 — „Neu anfangen repariert"

**Bugfix:** Der „Neu anfangen"-Button funktionierte nicht zuverlässig. Ursache:
Der Reset löschte den Spielstand und lud die Seite neu — beim Neuladen schrieb
der `beforeunload`-Autosave aber sofort den **alten** Zustand zurück, sodass die
alte Stadt wieder auftauchte.

**Fix:** Reset läuft jetzt **in-place, ganz ohne Reload**
(`GameController.resetTo`): ein frischer Spielstand wird direkt in den laufenden
Controller getauscht, sofort gespeichert und die Ansicht neu aufgebaut (frischer
Pixi-Renderer per Remount-Key). Kein Reload → kein Zurückschreiben. Der Import
eines Spielstands nutzt jetzt denselben sicheren Pfad.

- Bestätigungsdialog „Spielstand wirklich löschen und neu anfangen?", danach eine
  Erfolgsmeldung.
- Zusätzlicher Button **„Neustart mit Startbonus"** (Test-Start mit extra Geld +
  Gold) für schnelles Balancing-Testen (§10).
- Verifiziert: neuer Unit-Test (`resetTo` ersetzt den Zustand vollständig und
  reaktiviert die Tutorial-Aufgabe) **und** ein echter Browser-Test (Reset ohne
  Reload, frischer Spielstand bleibt bestehen). 85/85 Tests grün, Lint + Build ok.

## v0.19 — „Spieltypische UI: Marker, Bürgeranliegen & klare Gebäude-Popups"

Reiner UI/UX-Pass (§ Vorgabe: keine neue Gameplay-Logik). Die 2D-Prototyp-Karte
bleibt, aber die Oberfläche wird deutlich spieltypischer und lesbarer — mit
Problem-/Vorteil-Markern direkt auf der Karte, einem klar strukturierten
Gebäude-Popup, Bürgeranliegen statt Checklisten-Aufgaben und „Neu"-Ankündigungen.
Alle Anzeigen lesen bestehende Simulationsdaten; nichts am Spielverlauf geändert,
Savegame bleibt v8-kompatibel.

### 1. Problem- & Vorteil-Marker auf der Karte (Items 4/12)

Neues geteiltes **Diagnose-Modul** (`buildings/diagnostics.ts`) benennt für jedes
Gebäude, was gut läuft und was fehlt — die *eine* Quelle für Karte **und** Popup:

- **Problem-Blase (rot, „!")** über einem Gebäude bei: kein Straßenzugang, Lager
  voll (Produktion gestoppt), Betrieb pausiert (Brand), „hier will keiner
  einziehen".
- **Ausbau-Blase (bernstein, Pfeil nach oben)** wenn ein bezahlbares, freigeschaltetes
  Upgrade bereitsteht — wie die Bau-Blasen der Referenzbilder.
- Immer nur **ein** Marker pro Gebäude (Problem schlägt Ausbau), damit die Karte
  nicht zur Icon-Wand wird. Der bestehende Standortbonus-Stern bleibt separat.

### 2. Gebäude-Popup komplett überarbeitet (Items 2/12)

- **Kopf** mit Kategorie-Zeile und **farbigem Status-Badge**: Aktiv · Im Bau ·
  **Upgrade läuft** · Pausiert · Braucht Aufmerksamkeit · Ausbau bereit.
- Neuer **„Was läuft gut / Was fehlt"-Block**: grüne Vorteile (Standortbonus mit
  %, Ausbau bezahlbar, an Straße angeschlossen) und rote Probleme in klaren
  Zeilen, aus demselben Diagnose-Modul — keine widersprüchlichen Hinweise mehr.
- Bau-Status unterscheidet jetzt sichtbar **„Im Bau"** vs. **„Upgrade läuft"**.
- Wohngebäude behalten die Zuzugs-Erklärung aus v0.18 („Zuzug +X/min" bzw. Grund).

### 3. Aufgaben werden zu Bürgeranliegen (Items 6/13/14)

Jede Aufgabe hat jetzt einen **Absender** (`sender` in der Quest-Config, rein
präsentativ) und liest sich als lebendige Bitte statt Checkliste:

- **Bürger · Bauamt · Feuerwehr · Händler · Bürgermeister-Team** — jeweils mit
  **farbigem Avatar** (Platzhalter-Icon) und Absender-Label auf der Quest-Karte.
- Panel-Titel „Aufgaben" → **„Bürgeranliegen"**, Belohnung klar mit Icon separat,
  Claim-Button rechts. Der Fokus: „du hast jemandem geholfen" — die Belohnung
  kommt weiter vom Spielsystem.

### 4. Neue Gebäude werden angekündigt (Item 7)

- **Level-Up-Popup** listet jetzt konkret die neu freigeschalteten Gebäude
  (`event.level_up.body_unlocks`) mit Verweis aufs Baumenü.
- **„Neu"-Badge** auf frisch freigeschalteten Baukarten und ein **grüner Punkt**
  auf der Kategorie-Kachel. Verschwindet automatisch, sobald gebaut oder das
  Level steigt — kein persistenter „gesehen"-Zustand nötig.
- **Roter Empfehlungs-Punkt** auf einer Kategorie-Kachel, wenn ein dort baubares
  Bedürfnis unter 60 % liegt (z. B. Wasser knapp → Kachel „Versorgung").

### Neue/erweiterte UI-Komponenten & Vorbereitung echter Assets

- Neu: geteiltes `buildingDiagnostics`/`primaryMarker`-Modul, Marker-Renderer,
  Bürgeranliegen-Quest-Karten mit Avataren, Status-Badge & Diagnose-Block im
  Sheet, „Neu"/Empfehlungs-Badges im Baumenü, Level-Up-Ankündigung.
- Alle Grafiken weiterhin **programmatisch** (Pixi) bzw. als CSS/Lucide-Platzhalter,
  bewusst so gekapselt (Marker, Avatare, Badges als eigene Zeichen-/Style-Bausteine),
  dass echte Sprites/Avatare später ohne Aufruferänderung eingesetzt werden können.

### Geänderte Dateien

- Neu `game/buildings/diagnostics.ts`; `buildings/placement.ts` (`isConnectedToRoad` exportiert)
- `commands/controller.ts` — `getBuildingDiagnostics`/`getBuildingMarker`/`isNewBuilding`/`unlocksAtLevel`
- `config/types.ts` + `schemas.ts` — `QuestSender`/`sender`
- `config/quests.config.ts` — Absender an allen Quests
- `renderer/MapRenderer.ts` — Marker-Blasen; `App.tsx` — Level-Up-Ankündigung
- UI: `FloatingBuildingSheet` (Status/Diagnosen), `QuestPanel` (Bürgeranliegen),
  `BuildMenu` (Neu-/Empfehlungs-Badges), `de.json`, `styles.css`
- Tests: neu `diagnostics.test.ts` (3 Tests)

**Verifikation:** 84/84 Tests grün, Lint sauber, Build erfolgreich.

### Bewusst als nächste UI-Iterationen gestaffelt

Aus dem großen UI-Wunschzettel noch offen (jeweils eigene, testbare Schritte):
Service-Overlay-Modus mit oberer Kapazitäts-/Bedarfsleiste + Berater-Box (§3/§15),
HappinessBreakdown mit „betroffene Gebäude anzeigen"-Klick (§5), aus Gebäude-Problemen
automatisch generierte Bürgeranliegen (§13), HUD-Neuordnung mit Ressourcenbildern
(§9), sowie echte Bild-Assets für Gebäudekarten/Avatare (§11).

## v0.18 — „Aktiver Anfang & echtes Wachstum: die Stadt füllt sich wieder"

Dieser Patch behebt die im Durchspielen gefundenen Kernprobleme: die **kaputte
Bevölkerungs-Kurve** (große Stadt blieb weit unter Kapazität, obwohl zufrieden),
**Wohngebäude-Spam**, und der **zähe, passive Early-Game-Loop**. Alles über die
bestehenden Systeme (Wachstumsformel, `buildLimit`, Kostenpfad, Quest-Engine) —
keine Parallel-Logik, alle Werte in Configs. Savegame bleibt kompatibel
(Schema v8, keine Migration nötig — nur Config-Änderungen).

### 1. Kritischer Zuzugs-Fix: 8.909/45.677 trotz 99 % ist Geschichte (Item 15)

**Ursache:** Der Zuzug war ein **flacher Wert** (`growthPerMin`, ~10 Bürger/min)
— völlig unabhängig von der Stadtgröße. Eine 45.000-Kapazität-Stadt füllte sich
im selben Tempo wie ein Dorf. Von 0 auf 45.677 hätte bei 10/min **rund 62
Stunden reiner Simulationszeit** gebraucht — daher blieb die große, zufriedene
Stadt dauerhaft halbleer.

**Fix:** Zuzug skaliert jetzt mit dem **freien Wohnraum** und der Zufriedenheit
(`moveInPerMin` in `tick.ts`, neuer Config-Wert `growthFillRatePerMin`). Ein
Anteil des leeren Wohnraums zieht pro Minute ein — je zufriedener, desto mehr;
ein flacher Sockel (`growthPerMin`) hält kleine Dörfer am Füllen. Dieselbe Formel
speist die UI-Anzeige, also stimmt „angezeigte" und „tatsächliche" Rate überein.

**Simulierte Füllkurve** (45.000 Kapazität, voll versorgt, `growthFillRatePerMin`
= 0,06):

| Zufriedenheit | nach 1 min | 10 min | 30 min | 60 min | voll |
|---|---|---|---|---|---|
| **99 %** | ~2.700 | ~20.600 | ~37.900 | ~44.000 | ~90 min |
| **75 %** | ~1.600 | ~13.800 | ~30.100 | ~40.200 | ~2 h |
| **65 %** | ~1.200 | ~10.500 | ~24.800 | ~36.000 | >90 min |

(Offline-Catch-up rechnet dieselbe Formel in 60-s-Chunks, füllt also gleich
schnell nach. Ein Dorf mit 5 Plätzen ist weiter in Minuten voll.)

**Zuzug wird jetzt erklärt:** Der Controller liefert `getGrowthStatus()` (wächst
/ voll / unzufrieden / kein Wohnraum + Rate). Angezeigt im **Stadtstatus**
(Einwohner/Kapazität + „Zuzug: +X/min" oder Grund) **und direkt am Wohngebäude**
im Info-Sheet („Hier will aktuell niemand einziehen: …").

### 2. Wohngebäude-Limits pro Level — Verdichtung statt Spam (Items 1, 2)

Wohngebäude sind nicht mehr endlos spammbar. Neue `buildLimit`-Tabellen pro Typ,
config-basiert und skalierbar, abgestimmt auf Kapazität/Jobs/Versorgung:

| Level | Kleines Haus | Reihenhaus | Apartment | Wohnturm |
|---|---|---|---|---|
| 1–5 | 8 | — | — | — |
| 6–8 | 10 | 6 | — | — |
| 9–11 | 12 | 8 | 8 | — |
| 12–13 | 12 | 8 | 8 | 6 |
| 14–15 | 12 | 12 | 12 | 12 |
| 16+ | 14→16 | 14 | 14 | 16 |

Das Limit erzwingt genau das gewünschte Verhalten: **mehr Bedeutung pro Gebäude**
und **Upgrades/dichtere Typen statt Wiederholung**. Das Build-Menü zeigt weiterhin
Bestand/Limit und „mehr ab Level X".

### 3. First-Build-Discount: das erste Kerngebäude gratis/günstig (Items 3, 9)

Neues generisches Config-Feld `firstBuildDiscount` (0..1): das **allererste**
Exemplar eines Kernwirtschaftsgebäudes ist gratis oder billiger, danach normaler
Preis. Gekoppelt an die **Lebenszeit-Bauzahl** (`stats.built`), nicht die aktuelle
— Abreißen & Neubauen kann den Rabatt nicht farmen.

- **Gratis:** erstes Sägewerk, erster Brunnen, erste Farm
- **50 %:** erster Steinbruch, erster Markt, erstes Lager

Der Wirtschafts-Loop startet damit sofort beim Freischalten — kein Geld-Warten,
besonders an der berüchtigten **Level-5-Wand**. Das Build-Menü zeigt „1. gratis".

### 4. Aktiver Early-Game-Loop: parallele Aufgaben (Items 6, 8, 9)

Sechs neue **parallele Nebenaufgaben** laufen zusätzlich zur Hauptkette (kein
Vorgänger, aktivieren sich sofort bei ihrem Level) und belohnen aktives Spielen
mit Geld/XP/Gold — der Spieler hat immer ein konkretes Ziel statt auf Einnahmen zu
warten:

- L2 „Erste Holzlieferung" (120 Holz) · L3 „Erste Nachbarschaft" (30 Bürger)
- L4 „Volle Speisekammer" (150 Nahrung) · L4 „Steinbruch läuft" (120 Stein)
- L5 „Erste Erweiterung" (1. Sektor) · L5 „Zufriedene Bürger" (80 %)

Reine Config in `quests.config.ts` über bestehende Objective-Typen — keine neue
Quest-Logik.

### Geänderte Dateien

- `config/types.ts`, `config/schemas.ts` — `firstBuildDiscount`, `growthFillRatePerMin`
- `config/balancing.config.ts` — `growthPerMin` 10→12, `growthFillRatePerMin` 0,06
- `config/buildings.config.ts` — Wohn-`buildLimit`s, `firstBuildDiscount` (6 Gebäude)
- `config/quests.config.ts` — 6 parallele Early-Quests
- `buildings/effects.ts` — Rabatt im `effectiveBuildCost`-Pfad (+ `isFirstBuildDiscounted`)
- `simulation/tick.ts` — `moveInPerMin`, freihausbasierter Zuzug
- `commands/controller.ts` — `getGrowthStatus`, `isFirstBuildDiscount`, Lebenszeit-Kosten
- UI: `CityStatusPanel` (Zuzugsanzeige), `FloatingBuildingSheet` (Zuzugs-Diagnose),
  `BuildMenu` (Gratis-Badge), `de.json`, `styles.css`
- Tests: `balancing.test.ts` (+4 v0.18-Tests), Anpassungen in `simulation.test.ts`

**Verifikation:** 81/81 Tests grün, Lint sauber, Build erfolgreich.

### Bewusst als nächste Schritte gestaffelt (aus dem großen Wunschzettel)

Um den funktionierenden Stand nicht zu gefährden, sind diese größeren Systeme als
eigene, jeweils testbare Iterationen vorgesehen (Reihenfolge = Empfehlung):

1. **Gebäude-Rotation** (Item 13) — Footprint drehen + Rotation im Savegame.
2. **Marktplatz 4×4 als Zentrum** (Item 5) + **Gründerhaus/Altstadt-Prestige** (Item 4)
   — eigenes „Zentrum"-Feature mit sichtbarem Anker.
3. **Handelsposten / aktiver Ressourcenverkauf** (Items 7, 8) — Verkaufen/Kaufen
   über `EconomyService`, config-basierte Angebote mit Cooldown.
4. **Upgrade-Bug „alte Werte während Upgrade aktiv"** + Fake-Shop + Gold-Speedup +
   robuster Neustart-Button (aus dem vorherigen Wunschzettel).
5. **Level 15 Energie-Meilenstein-Ausbau**, **pro-Typ-Wohnbedürfnisse** (Item 14),
   **Biom-Standortboni-Ausbau** (Item 12).

### Empfohlene nächste Balancing-Tests

- 45k-Stadt bei 60–70 % Zufriedenheit: füllt sie sich noch angenehm, oder zu langsam?
- L6–L9 mit den neuen Limits: reichen 10 Häuser + 6 Reihenhäuser für flüssiges
  Wachstum bis zum Apartment-Unlock?
- First-Build-Discount: startet der Loop bei L2–L5 jetzt ohne Wartephase (Sitzung
  ohne >30 s Leerlauf)?
- Aktiv vs. AFK: 30 min aktives Quest-Spiel vs. 30 min AFK — ist der aktive
  Vorsprung deutlich spürbar?

## v0.17 — „Ausbaupfade & begrenzte Welt: das Zentrum wächst in die Höhe"

Wachstum passiert ab jetzt nicht mehr nur durch Ausbreitung, sondern durch
**Verdichtung**: Gebäude lassen sich über viele Stufen ausbauen, das Zentrum
entwickelt sich sichtbar in die Höhe, und die Welt ist von Anfang an als
**große, begrenzte Karte mit allen Biomen** sichtbar. Alles über die bestehenden
generischen Systeme (Effekte, Level-Gate, Coverage) — keine Parallel-Logik.

### Viele neue Ausbaustufen — Verdichten schlägt Zubauen (Items 1–4, 6, 7)

- **Wohngebäude** bekommen echte Ausbaupfade auf demselben Grundstück:
  - **Kleines Haus** → Haus → Doppelhaus → **Stadthaus** (1 → 4 Haushalte)
  - **Reihenhaus** → erweitert → **Wohnzeile** (12 → 26 Haushalte)
  - **Apartmenthaus** → groß → **Wohnkomplex** (90 → 200 Haushalte)
  - **Wohnturm** → **Hochhaus** → **Wolkenkratzer** (360 → 720 Haushalte,
    ~3.600 Einwohner auf einem Turm)
- Ausbauen ist **pro Fläche wertvoller als neu bauen**: ein aufgestockter Turm
  bringt mehr Einwohner pro Tile als ein zweiter Turm auf neuer Fläche — der
  eigentliche Langzeit-Motor, wenn der Platz knapp wird.
- **Generische Ausbaustufen auch für Dienste & Wirtschaft** (alles über die
  vorhandenen Effekte — Reichweite, Kapazität, Jobs, Lager): Brunnen, Wasserwerk,
  Markt, Park, Bürogebäude, Lagerhaus, Feuerwehr, Polizei, Krankenhaus.
- **Kostenkurven fürs Late-Game**: höhere Stufen kosten Millionen und bleiben
  echte Sparziele; alle Werte in der Config.

### Ausbau ist an das Level gekoppelt (Item 3)

- Jede Ausbaustufe kann ein **`unlockLevel`** haben (neues, optionales
  Config-Feld). Ein Gebäude steigt nur so hoch, wie es die Stadt „verdient" hat —
  die Verdichtung bleibt über die gesamte Progression ein Ziel statt sofort
  ausgereizt. Gleiches Level-Gate wie bei Gebäude-Freischaltungen, kein neues
  System. Das Bau-Panel zeigt gesperrte Stufen als **„Ausbau ab Level X"** an.

### Sichtbare Zentrums-Entwicklung & Prestige (Items 1, 8, 12)

- Ausgebaute Gebäude **sehen entwickelter aus**: mit jeder Stufe wachsen ein
  längerer Schlagschatten (Höhe von oben), ein zurückgesetzter „Turmkern" und
  die Stufen-Pips — das Zentrum verdichtet sich sichtbar zur Skyline.
- Das **Rathaus** ist jetzt selbst ausbaubar (Rathaus → Großes Rathaus →
  **Prachtrathaus**): mehr Verwaltungs-Jobs, größerer Zentral-Speicher und eine
  breitere Ansehens-Aura — ein Prestige-Meilenstein für die Gründungsstadt.
- Ausgebaute Gebäude tragen im Info-Panel ihren **Stufen-Namen**
  („Wolkenkratzer" statt „Wohnturm").

### Konzeptwechsel: große, aber begrenzte Welt (Items 9–11)

- Die Karte ist keine unendliche Open-End-Fläche mehr, sondern ein **großes,
  endliches Spielbrett** (`worldBounds` in der Config). **Alle Biome sind ab der
  ersten Minute sichtbar** (gesperrt/abgedunkelt) — Wald, Gebirge, Fluss,
  **Meeresküste** im fernen Osten und Ebenen sind von Anfang an als Ziele da.
- Sektoren bleiben **freischaltbar** wie bisher; nur jenseits der Weltgrenze
  existiert nichts mehr und lässt sich nichts freischalten (harte Kante statt
  endlosem Nachwachsen).
- **Speicherstand-Migration v7 → v8**: alte (Open-End-)Spielstände werden auf
  das begrenzte Brett gehoben — fehlende Sektoren im Weltrahmen werden ergänzt,
  bereits freigeschaltete/bebaute Sektoren bleiben unangetastet.

### Technik

- `BuildingUpgradeDef` um `unlockLevel` + `nameKey` erweitert (Typen + Zod).
- `controller.upgradeBuilding` prüft das Level; neuer `getUpgradeInfo`-Helfer als
  einzige Quelle für die Ausbau-UI (nächste Stufe, Level-Sperre, Bezahlbarkeit).
- `world.ts`: `isSectorInBounds`/`allWorldSectors`; Grenzen in
  `materializeSector`/`-Neighbors`, `unlockSector`, `foundDistrict`.
- Neue Tests: Level-Gate & Kapazitätswachstum beim Ausbau, Rathaus-Prestige,
  harte Weltkante, v7→v8-Migration. **77 Tests grün**, Lint + Build sauber.

## v0.16 — „Großstadt-Skalierung: Reichweiten, Kapazität & echte Bevölkerung"

Die Stadt wächst — jetzt skalieren die Systeme mit. Servicegebäude bekommen
realistische Einzugsgebiete, Wohngebäude glaubwürdige Einwohnerzahlen, und ein
neues, generisches **Radius-vs-Kapazität**-Modell sorgt dafür, dass große Städte
nicht mit Mini-Radien geflutet werden — Planung bleibt trotzdem wichtig. Alles
in den Configs, kein neues Parallelsystem.

### Radius vs. Kapazität — neues generisches Modell (Items 1, 2)

- Der bestehende `coverage`-Effekt hat jetzt ein optionales Feld **`capacity`**
  (versorgbare Einwohner). Ein Servicegebäude deckt einen **Radius** ab *und*
  versorgt nur bis zu einer **Kapazität** gut. Wächst die Stadt über die
  Kapazität hinaus, sinkt die Deckung auch im Radius — man braucht ein paar
  starke Stationen, nicht eine pro Block. Ohne `capacity` (Parks) bleibt es
  reine Radius-Deckung. Ein Feld, kein Sonderfall — gilt automatisch für alle
  Coverage-Bedürfnisse.
- Umgesetzt im `derived`-Layer (`coverageCapacity` pro Bedürfnis) und im Tick
  (Deckung = Radius-Anteil × min(1, Kapazität/versorgte Einwohner)).

### Realistischere Reichweiten & Kapazitäten (Items 1, 7)

- **Feuerwehr** Radius 12 → **18**; **Polizei** 11 → **16** (+ Kapazität 8.000
  Einw.); **Krankenhaus** 11 → **18** (+ Kapazität 15.000 Einw.).
- **Markt** Radius 9 → **14**, **Supermarkt** 10 → **16**.
- **Brunnen** Radius 7 → **9**, Kapazität 60 → **200**; **Wasserpumpe** Radius
  12 → **18**, Kapazität 240 → **3.000**.
- **Kraftwerk** 250 → **3.500**, **Windpark** 120 → **1.500** Energie.
- **Wasseraufbereitung** 40 → **400** Trinkwasser/min, Puffer 800 → 6.000.
- **Park** Radius 8 → 11, **Spielplatz** 5 → 7.
- Höhere Bau-Limits im Late-Game (Farm, Pumpe, Feuerwehr, Büro, Laden u. a.),
  damit eine Großstadt genug Kernservices bauen kann.

### Realistische Einwohner-/Wohnkapazitäten (Items 3, 4)

- Wohngebäude tragen jetzt echte Stadt-Bevölkerung, über **Haushalte pro
  Gebäude** (nicht absurd große Haushalte):
  - Reihenhaus 24 → **48** Einw. (12 Haushalte)
  - Apartment 96 → **360** Einw. (90 Haushalte)
  - Wohnturm 300 → **1.800** Einw. (360 Haushalte)
  - Kleines Haus bleibt bewusst klein (Vorstadt, ~5).
- Damit erreicht eine ausgebaute Stadt glaubwürdig **~10× so viele** Bürger
  (Größenordnung 30.000+ statt ~3.000).
- **Versorgung zieht mit:** Wasser-/Energiebedarf der Wohngebäude, Farm-Output
  (42 → **220**/min), Bäckerei (14 → **90**), Trinkwasser, Lager-Puffer für
  Konsumgüter (Essen/Trinkwasser 600 → **3.000**) und **Arbeitsplätze**
  (Büro 400 → **2.000**, Laden 8 → 40, Markt/Supermarkt hoch) skalieren
  gemeinsam, damit das Verhältnis stimmt. Essensbedarf pro Kopf 0,05 → **0,03**.

### Verschiebbare Servicegebäude (Item 5)

- Zentrale Versorgungs-/Servicegebäude sind jetzt **verschiebbar** (über das
  bestehende Relocate-System im Gebäude-Sheet, mit Platzierungs-Neuprüfung und
  Umzugsgebühr): **Brunnen, Wasserpumpe, Wasseraufbereitung, Markt, Supermarkt,
  Feuerwehr, Polizei, Krankenhaus**. Normale Wohn-/Produktionsgebäude bleiben
  bewusst nicht verschiebbar (Abriss & Neubau).
- Gebühren pro Typ konfigurierbar (`relocationCost`), z. B. Krankenhaus 120.000.

### Bessere Reichweiten-/Kapazitäts-Darstellung (Item 6)

- Die Coverage-Legende zeigt bei kapazitätsbegrenzten Diensten jetzt die
  **Auslastung „X/Y Einwohner"** und färbt sie rot bei Überlastung — man sieht
  sofort, ob **Reichweite oder Kapazität** das Problem ist. In-Range-Häuser
  erscheinen bei Überlastung als „unterversorgt".

### Configs & Dateien

- `buildings.config.ts` (Radien, Kapazitäten, Wohn-/Bedarfs-/Job-/Produktions-
  werte, Relocate-Flags), `needs.config.ts` (Essensbedarf), `config/types.ts` +
  `schemas.ts` (`coverage.capacity`), `simulation/derived.ts` + `tick.ts`
  (Kapazitätsmodell), `buildings/coverage.ts` + `renderer/MapRenderer.ts` +
  `components/MapView.tsx` + i18n + CSS (Auslastungs-Anzeige). Keine
  Save-Migration nötig — Werte liegen in Configs, Bestände rechnen robust neu.

### Empfohlene weitere Skalierungs-Tests

- Reife Großstadt (30.000+): Happiness-Landung 70–90 %, Wasser/Energie/Essen im
  Gleichgewicht mit wenigen Kern-Services; Auslastungs-Overlay bei Polizei/
  Krankenhaus prüfen; Einkommen vs. Unterhalt bei großer Bevölkerung
  gegenrechnen (ggf. `taxPerCapitaPerMin` später nachjustieren).

## v0.15 — „Langzeit-Balancing: echte Investitionen & langsamere Progression"

Ein zusammenhängender Balancing-Pass (keine isolierten Zahlenänderungen): Preise,
XP-Kurve, Belohnungen und Limits wurden **gemeinsam** neu abgestimmt. Ziel: Level
1–3 bleiben schnell und verständlich, ab Level 4 wird die Stadtentwicklung zu
einer echten Langzeitplanung mit glaubwürdigen Kosten. Alles bleibt in den
Configs — kein neuer Balancing-Code, bestehende Systeme wurden weiterverwendet.

### Realistischere Gebäudepreise nach Level & Typ (Items 1, 2, 9)

- **Level 1–3 bleiben günstig** (Straße 300, Kleines Haus 9.000, Sägewerk 11.000,
  Brunnen 6.500) — der Einstieg bleibt flüssig.
- **Ab Level 4 steigen die Kosten spürbar:** Farm 14k→28k, Steinbruch 22k→45k,
  Markt 30k→55k, Reihenhaus 34k→60k, Laden 46k→85k, Wasserpumpe 60k→130k,
  Logistikzentrum 105k→190k.
- **Große öffentliche Gebäude sind jetzt echte Stadtinvestitionen:** Feuerwehr
  90k→240k, Polizeiwache 95k→**520k**, Supermarkt 80k→340k, Kraftwerk 160k→480k,
  Windpark 120k→360k, Wasseraufbereitung 90k→260k, Bürokomplex 400k→**850k**,
  Wohnturm 420k→**900k**, **Krankenhaus 140k→2,2 Mio.**
- Große Gebäude haben zusätzlich **längere Bauzeiten** (Krankenhaus/Wohnturm 10
  min, Büro 9 min, Kraftwerk 8 min) — Investitionscharakter statt Impulskauf.
- Materialkosten (Holz/Stein) ziehen mit, damit Produktion & Fläche mitzählen.

### Level-Fortschritt deutlich verlangsamt (Item 3)

- Neue XP-Kurve: **L10 jetzt ~4.400 XP** (vorher 2.500), **L14 ~16.800**. L1–3
  gehen weiter schnell, danach kostet jedes Level deutlich mehr — Level-Ups
  fühlen sich wie Meilensteine an und späte Level spannen über mehrere Sessions.

### Anti-Spam für Bürgergebäude (Item 4)

- **Wohngebäude geben viel weniger XP:** Kleines Haus 10→5, Reihenhaus 20→8,
  Apartment 45→22, Wohnturm 70→35. Eine Häuserwand levelt **nicht** mehr hoch.
- Dafür geben **Meilensteine, Versorgung und Großprojekte deutlich mehr XP:**
  Markt 20→45, Supermarkt 34→80, Feuerwehr 40→85, Polizei 42→95, Krankenhaus
  52→**140**, Büro 90→**200**, Kraftwerk 55→120, Wasserpumpe 28→50.
- **Quest-XP stark erhöht** (die „Qualitäts"-Progression): Meilenstein-Quests
  geben jetzt bis zu 560 XP statt 150 — aktives Spiel treibt das Leveln, nicht
  Masse. XP ist jetzt Qualität, nicht Quantität.

### Lagerhaus-Spam verhindert (Item 7) — neuer generischer Mechanismus

- Lagerhaus-Basispreis 40k→85k **und** neues generisches `costScaling`: **jedes
  weitere Lagerhaus kostet 40 % mehr** als das vorige (85k → 119k → 167k …).
  Lagerkapazität ist damit eine bewusste Investition statt billiger Massenbau.
  Der Mechanismus ist config-only und später auf jedes Gebäude anwendbar.
- Das Baukarten-UI zeigt den **tatsächlich nächsten Preis** und „Jedes weitere
  kostet mehr".

### Einnahmen & Progression verbunden (Items 5, 10)

- Level-Up- und Quest-Geldbelohnungen steigen mit (L10-Reward 250k→500k, L14
  1,8 Mio.), damit die höheren Preise nicht frustrieren — Großprojekte bleiben
  ein Sparziel, aber erreichbar über Steuern, Gewerbe und Quests.

### UI für große Zahlen, Limits & Großprojekte (Item 11)

- Große Werte werden weiterhin kompakt formatiert (15.000, 1,2 Mio.).
- **Großprojekt-Kennzeichnung:** teure Gebäude tragen ein „Großprojekt"-Label.
  Kann man sie sich (noch) nicht leisten, erklärt die Karte **hilfreich** statt
  bloß „zu wenig Geld": „Mehr Einnahmen nötig. Aktuell X/min, empfohlen ~Y/min.
  Baue mehr Firmen-/Bürogebäude oder erhöhe deine Steuern."
- Bau-Limits zeigen weiterhin klar „x/max gebaut · mehr ab Level N".

### Balancing-Tests (Item 12)

- Neue Test-Suite `balancing.test.ts` sichert die Kernaussagen ab: früher
  Einstieg bezahlbar, Wohn-Spam levelt nicht, Lagerhaus wird teurer,
  Großprojekt-Erkennung + Einkommens-Empfehlung, XP-Qualität > Quantität.
- Kompatibilität: Kosten/XP liegen in Configs (nicht im Save) — **keine
  Save-Migration nötig**; bestehende Spielstände behalten ihr Level (Level wird
  nie gesenkt).

### Empfohlene nächste Balancing-Tests

- L4–6-Spielgefühl live prüfen (planen ohne Frust), Einkommens-Kurve gegen die
  neuen Preise messen, Krankenhaus-Sparzeit bei gut gebauter Wirtschaft prüfen.

## v0.14 — „MVP 2: Die erste echte Lieferkette (Trinkwasser)"

Die erste durchgehende **Produktions- und Versorgungskette**: aus Flusswasser
wird ein echtes, gelagertes **Trinkwasser-Produkt**, das transportiert, gelagert
und im Supermarkt an die Bürger verteilt wird (Items 2–4).

### Neue Ressource & Bedürfnis: Trinkwasser

- **Trinkwasser** ist eine echte, lagerbare Ressource (kein Hintergrund-Wert) —
  klar getrennt von der Wasser-*Infrastruktur* (Brunnen/Wasserwerk).
- **Neues Bedürfnis „Trinkwasser"** (ab L12): ein Konsum-Bedürfnis wie Essen,
  das aus dem verteilten Produkt gedeckt wird. Läuft über denselben generischen
  Konsum-Pfad — der Tick wurde dafür auf beliebige Ressourcen verallgemeinert
  (`consumesResource`), kein Sonderfall.

### Die Kette: Fluss → Werk → Lager/Supermarkt → Bürger

- **Wasseraufbereitung** (3×2, ab L11): muss **direkt an einem Fluss** stehen
  (neue generische `adjacentTerrain`-Regel). Produziert 40 Trinkwasser/min in
  einen eigenen Puffer, mit Jobs, Unterhalt und Strombedarf; profitiert wie jeder
  Produzent vom Logistikzentrum.
- **Lagerhaus** puffert jetzt auch Trinkwasser (die „Lager"-Stufe der Kette).
- **Supermarkt** (3×2, ab L12): der stärkere Nachfolger des Markts — verteilt
  **Essen UND Trinkwasser** an Wohnhäuser im Radius, lagert Trinkwasser und zeigt
  seinen belieferten Bereich über das generische Deckungs-Overlay.

### Sichtbarkeit

- Klick auf ein Verteilgebäude zeigt (über das bestehende Deckungs-Overlay)
  **welche Wohnhäuser versorgt sind und welche nicht**.
- **Trinkwasser-Anzeige im HUD**, sobald die Kette existiert (Lager vorhanden).
- Straßenanbindung bleibt Voraussetzung — ohne Anschluss keine Lieferung.

### Technik & generische Vorbereitung

- Reine Wiederverwendung: `produce`/`storage`/`distribution`/Konsum-Bedürfnis
  bilden die Kette; das Effekt-System hat den `inputsPerMinute`-Hook für spätere
  mehrstufige Ketten bereits. Save-Migration v6 → v7 ergänzt Ressource/Bedürfnis/
  Statistik. **Ausblick:** animierte Transport-Linien auf der Karte und
  Problem-Marker folgen im nächsten Schritt.

## v0.13 — „MVP 2: Balance & Rollen"

Ein Balancing-Pass, der Gebäude glaubwürdigere Größen und Rollen gibt und Sprawl
teurer macht.

### Wasserwerk-Ausbau (Item 1)

- **Wasserwerk-Limit 3 → 5** (gestaffelt: L7 max 2, L9 max 3, L11 max 5). Der
  Wert „3" war das Bau-Limit — größere Städte dürfen jetzt mehr Wasserwerke
  bauen. Wasser bleibt bedarfsgesteuert, wird also nicht überstark.

### Bürogebäude = echter Großarbeitgeber (Item 5)

- **Büro: 60 → 400 Arbeitsplätze** in kompakten 4×2. Ein Innenstadt-Turm, der
  ganze Distrikte beschäftigt. Da die Gewerbe-Einnahmen mit den **besetzten**
  Jobs skalieren, ist ein Büro ohne Einwohner zum Besetzen wenig wert — das
  balanciert die riesige Jobzahl von selbst. Kosten/Unterhalt/Strombedarf/
  Einnahmen entsprechend hoch, Limit knapp (max 1 → 4 mit Level).

### Wohnen neu austariert (Item 6)

- **Reihenhaus 20 → 24**, **Apartment 48 → 96** Bewohner — dichter und
  glaubwürdiger.
- **Neuer Wohnturm** (3×3, ab L12): bis **300 Bewohner**, damit eine Stadt ihre
  Bürotürme überhaupt bemannen kann. Hoher Wasser-/Strom-/Unterhaltsbedarf, und
  seine Bewohner reagieren stark auf ihr Umfeld — ein Turm ohne Parks drumherum
  ist ein trister Ort.
- **Schnelleres Wachstum** (Zuzug 4 → 10/min), damit die großen Kapazitäten in
  glaubwürdiger Zeit gefüllt werden.

### Sprawl kostet mehr (Item 7)

- **Sektor-Erweiterung deutlich teurer**: Basis 80k → **120k**, Distanz- und
  Mengenfaktor angehoben. Jeder Sektor kostet mehr, und je mehr man besitzt,
  desto teurer der nächste — in die Breite zu wuchern ist eine bewusste, teure
  Entscheidung. Gute, dichte Planung wird belohnt; Geld bleibt wertvoll.

## v0.12 — „MVP 2 Teil 4: Fluss-Distrikt"

Die erste **Fern-Expansion**: Am Fluss lässt sich ein eigener **Distrikt**
gründen — eine zweite Ausbaufläche mit eigenem Zentrum und eigenem Straßennetz,
fernab der Innenstadt (§8).

### Distrikt gründen

- Klick auf einen gesperrten **Fluss-Sektor** (ab Level 12) bietet die Option
  **„Fluss-Distrikt gründen"** an. Das große Einmalprojekt schaltet den Sektor
  als **eigenen Distrikt** frei und pflanzt ein **Distrikt-Zentrum** ans Wasser.
- Das Zentrum funktioniert wie ein kleines Rathaus: es lagert Waren, schafft ein
  paar Jobs, hebt die lokale Stimmung — und vor allem **setzt es ein eigenes
  Straßennetz**. So baut man am Fluss „quasi eine neue Stadt", ohne eine
  40-Felder-Straße aus der Innenstadt ziehen zu müssen.
- Angrenzende Sektoren werden anschließend Teil des Fluss-Distrikts (die
  Distrikt-Zugehörigkeit vererbt sich beim Freischalten).

### Technik

- Reine Wiederverwendung: das Straßennetz wurde schon immer aus **jedem**
  Distrikt-Zentrum geseedet (`computeRoadNetwork`), die Karte ist eine
  Sparse-Sektoren-Welt (§8). Neu sind nur ein `district_center`-Gebäude, ein
  `foundDistrict`-Command und die Option im Sektor-Dialog. Kein Save-Umbau nötig
  (Distrikte sind bereits im Schema).

### Damit ist der MVP-2-Gameplay-Kern beisammen

Energienetz, Notdienste, Steuer-Regler und die erste Fern-Expansion stehen. Was
noch offen ist (Cloud-Save/Login, Mobile-Layout, Besichtigungsmodus), hängt an
Infrastruktur-Entscheidungen und kommt später.

## v0.11 — „MVP 2 Teil 3: Steuer-Regler"

Der Bürgermeister bekommt echte fiskalische Kontrolle: zwei **Steuersätze**, die
sich direkt auf Einnahmen und Zufriedenheit auswirken. Der klassische SimCity-
Zielkonflikt — mehr Geld gegen weniger Laune.

### Steuersätze als Regler

- **Wohnsteuer** und **Gewerbesteuer** lassen sich in der Wirtschaftsübersicht
  zwischen **50 % und 150 %** einstellen (Regler ab Level 6).
- Höher = mehr Geld sofort, aber **weniger Zufriedenheit** (und damit weniger
  Zuzug und ein schlechterer Steuer-Faktor). Niedriger = Goodwill statt Geld.
- Die **Wohnsteuer** spüren die Bürger stark (bis −12 Zufriedenheit bei 150 %),
  die **Gewerbesteuer** wirkt sanfter (Geschäftsklima, bis −5). So ist die
  Gewerbesteuer der schonendere Hebel, wenn die Kasse klemmt.

### Technik

- Neues `policy`-Feld im Spielstand (Save-Migration v5 → v6, startet neutral),
  ein zentraler `setTaxRate`-Command; Einnahmen laufen weiter durch die eine
  `computeIncome`-Quelle, der Zufriedenheits-Malus wird im Tick verrechnet.

### Nächster MVP-2-Baustein

Die erste **Fern-Expansion ins Fluss-Biom** (Fernstraße + Distrikt).

## v0.10 — „MVP 2 Teil 2: Notdienste" (Polizei & Krankenhaus)

Die Stadt bekommt ein Sicherheitsnetz. Nach dem bewährten **Feuerwehr-Muster**
(radiusbasierte Deckung) kommen zwei neue Bedürfnisse dazu — ohne Sonderpfade,
dieselbe Coverage-Mechanik wie bei Freizeit und Feuerwehr.

### Zwei neue Bedürfnisse: Sicherheit & Gesundheit

- **Sicherheit** (ab L13) und **Gesundheit** (ab L14) sind radiusbasierte
  Deckungs-Bedürfnisse: Wohnhäuser im Einzugsradius sind versorgt, der Rest
  nicht — unversorgte Viertel drücken die Zufriedenheit.

### Zwei neue Gebäude

- **Polizeiwache** (ab L13, 2×2): Sicherheitsdeckung im Radius 11, Jobs,
  Unterhalt, Strombedarf. Limit bis max 4.
- **Krankenhaus** (ab L14, 3×2): Gesundheitsdeckung im Radius 11 — größerer
  Bau, höhere Betriebs- und Stromkosten als die Wache. Limit bis max 3.

### Progression

- **Level 13 & 14** neu (XP 5.800 / 7.200) mit **Quests „Für Ordnung sorgen"
  und „Gesunde Stadt"**. Save-Migration v4 → v5 ergänzt die neuen Bedürfnisse
  in alten Spielständen.

### Nächste MVP-2-Bausteine (geplant)

Steuer-/Mieten-Regler und die erste Fern-Expansion ins Fluss-Biom.

## v0.9 — „MVP 2 startet: Das Stromnetz" (Teil 1)

Erster Baustein von **MVP 2**: die Stadt bekommt ein **Energienetz**. Ab **Level 11**
verlangen Industrie, Gewerbe und dichte Wohnhäuser Strom — plötzlich ist Energie
ein neues Bedürfnis, und ohne Kraftwerk sinkt die Zufriedenheit. Genau der
„Level-up erzeugt das nächste Problem"-Motor (§4).

### Neues Bedürfnis: Energie

- **Energie** ist ein stadtweites Kapazitäts-Bedürfnis (wie Wasser, aber ohne
  Radius — ein Kraftwerk speist das ganze Netz). Der Bedarf kommt aus den
  Gebäuden selbst: Sägewerk, Steinbruch, Farm, Bäckerei, Wasserwerk, Markt,
  Laden, **Bürogebäude (30)**, Feuerwehr, Logistikzentrum, Reihenhaus und
  **Apartment (20)** ziehen Strom. Schaltet auf Level 11 frei.

### Zwei Kraftwerke mit echtem Trade-off

- **Kohlekraftwerk** (ab L11, 3×3): dichte, verlässliche Leistung (+250 Energie),
  aber es **verpestet** einen weiten Radius (Ambiente −3) und **frisst Geld als
  Brennstoff** (2.500/min Unterhalt). Die Standardantwort auf den L11-Engpass —
  bezahlt in Luftqualität und Cash. Limit gestaffelt bis max 4.
- **Windpark** (ab L12, 3×3): **sauber** (Ambiente +1), viel günstiger im
  Betrieb (800/min), liefert aber weniger (+120 Energie) und braucht Platz. Der
  grüne, flächenhungrige Weg: lieber mehrere statt eines dreckigen Kraftwerks.

### Progression

- **Level 11 & 12** neu (XP-Kurve 3.400 / 4.500), plus **Quests „Licht an" und
  „Sauberes Netz"**. Alte Spielstände werden migriert (Schema v3 → v4, Energie-
  Bedürfnis wird ergänzt).

### Nächste MVP-2-Bausteine (geplant)

Notdienste (Polizei/Krankenhaus nach dem Feuerwehr-Muster), Steuer-/Mieten-
Regler, weitere Level 13–20 und die erste **Fern-Expansion ins Fluss-Biom**.

## v0.8 — „Geld verdient man, Kosten spürt man"

Feintuning nach Spieler-Feedback: **Geld war zu viel, Kosten zu niedrig.** Leitidee
jetzt: Geld wird über **Herausforderungen (Quests) belohnend verdient** und über
**spürbar teurere Bauten** wieder ausgegeben — Rohstoffe sind der eigentliche
Engpass, fließen dafür aber schneller.

### Bau- & Rohstoffkosten deutlich erhöht

- **Geldkosten quer durch alle Gebäude angehoben** (~1,5× früh, bis ~2× spät):
  z. B. Kleines Haus 6.000 → **9.000**, Markt 20.000 → **30.000**, Laden 30.000 →
  **46.000**, Lagerhaus 26.000 → **40.000**, Feuerwehr 60.000 → **90.000**,
  Apartment 90.000 → **145.000**, Bürogebäude 120.000 → **185.000**. Bauen ist
  wieder eine Entscheidung, kein Rundungsfehler.
- **Rohstoffkosten (Holz/Stein) teurer** — Material ist jetzt der harte Engpass,
  nicht das Geld.

### Dafür: schnellere Produktion

- **Sägewerk 32 → 45**, **Steinbruch 26 → 38**, **Farm 30 → 42**, **Bäckerei
  9 → 14** pro Minute. Teurere Bauten, aber die Rohstoffe kommen schneller rein —
  wer aktiv einsammelt und verbaut, kommt gut voran.

### Geld über Herausforderungen, nicht AFK

- **Quest-Belohnungen kräftig erhöht** (grob +60 %): z. B. erste Straßen 6.000 →
  **8.000**, Markt-Quest 35.000 → **60.000**, Feuerwehr 70.000 → **130.000**,
  Metropole 250.000 → **400.000**. Wer die Herausforderungen aktiv abschließt,
  finanziert damit die nächste Ausbaustufe — deutlich lohnender als passives
  Farmen.

### Lagerhaus-Limit erhöht (4 → 10)

- Das **Lagerhaus-Limit steigt auf max 10** (gestaffelt: L6 max 3, L8 max 6,
  L10 max 10). Pro Lager weiterhin knappe 600 je Ressource + Geld-, Material- und
  Unterhaltskosten — ein echtes Logistikviertel ist jetzt möglich, bleibt aber
  eine Investition, kein Spam.

### Nächster Schritt

Danach geht es weiter mit **MVP 2** (Energie & Kraftwerke, Polizei/Krankenhaus
nach dem Feuerwehr-Muster, Level 11–20, Steuer-/Mieten-Regler, erste
Fern-Expansion ins Fluss-Biom).

## v0.7 — „Aktiv statt AFK: Lager, Limits, Arbeit & Logistik"

Balance-Kurskorrektur nach Spieler-Feedback (riesige Stadt, nur 1.450 Einwohner,
+251k/min, Lager spammbar, Arbeit bei 23 %). Leitbild jetzt klar wie SimCity/CoC:
**aktiv spielen wird belohnt, AFK-Farmen + Gebäude-Spam nicht.**

### Karten-Lesbarkeit zurückgestellt

- Gebäude wieder mit **2-Buchstaben-Kürzeln** (bessere Übersicht im Prototyp).
  Echte Gebäude-Modelle kommen mit der späteren 2.5D/3D-Ansicht.

### Lager umgedreht: knapp statt spammbar

- **Kleinere Caps, höhere Produktion:** Rathaus-Lager 1.000 → **400**, Lagerhaus
  2.000 → **600** je Ressource; Sägewerk 14 → **32**, Steinbruch 11 → **26**,
  Farm 15 → **30** pro Minute.
- **Lagerhaus jetzt limitiert** (max 4). Man kann sich kein 39.000-Puffer mehr
  zusammenspammen — Produktion läuft heiß, das Lager bleibt knapp, also lohnt es
  sich, zurückzukommen und die Rohstoffe zu **verbauen** statt sie zu horten.

### Mehr Grenzen gegen Spam

- Bau-Limits neu/erweitert: **Markt** (max 4), **Wasserwerk** (max 3),
  **Feuerwehr** (max 3), **Lagerhaus** (max 4), **Logistikzentrum** (max 3),
  **Bürogebäude** (max 5) — jeweils mit Level gestaffelt.

### Arbeitsplätze: Bürogebäude (4×2)

- Neues **Bürogebäude** (großes 4×2-Grundstück, 60 Arbeitsplätze, Gewerbeerlös,
  Unterhalt), ab Level 8. Löst den Arbeits-Engpass: eine reine Wohnstadt muss
  jetzt echte Arbeitgeber ansiedeln, nicht nur Häuser stapeln.

### Geld an eine ausbalancierte Stadt gekoppelt

- **Wohnsteuer 90 → 40 pro Kopf.** Rohe Einwohnerzahl druckt kein Geld mehr;
  der Ertrag kommt zunehmend aus **Gewerbe & Produktion**, die mit *besetzten*
  Arbeitsplätzen skalieren. Eine gut gezonte, beschäftigte Stadt verdient
  deutlich mehr als eine Häuserwand — Geld belohnt gute Planung, nicht AFK-Wachstum.

### Erste echte Logistik/Lieferkette (§1)

- Neues **Logistikzentrum** (3×3, ab Level 7): hebt den **Produktions-Ausstoß
  aller Produktionsgebäude im Radius um +25 %**. Läuft über denselben
  Produktions-Bonus-Pfad wie der Geländebonus — ein gut platziertes Depot bei den
  Sägewerken/Steinbrüchen/Farmen ist eine echte Planungsentscheidung. Limitiert
  (max 3), mit Jobs + Unterhalt.
- *Technisch:* generischer `logistics`-Effekt; Produzenten werden im derived-Layer
  in einem zweiten Pass aufgelöst, damit ein Depot Producer unabhängig von der
  Iterationsreihenfolge boostet. Kein Tick-Umbau nötig.

## v0.6 — „Endgame-Balance & saubere Karte"

Nach einer durchgespielten Nacht (Level 10, 7,3 Mio. Geld, Lager randvoll)
gezielt die Endgame-Schwächen adressiert — plus ein Karten-Look, der endlich
nach Stadt statt nach Tabelle aussieht.

### Karte: Gebäude als Glyphen statt Kürzel

- Der Renderer zeichnete Gebäude als abgeschnittene 2-Buchstaben-Namen
  („St", „Ap", „Re"). Jetzt echte Gebäude-Glyphen: Häuser mit Dach, Fenster-
  Raster und Tür (Fensterdichte skaliert mit der Grundfläche, Apartments wirken
  dichter), Produktion mit Schlot, Freizeit als Grünfläche mit Bäumen. Upgrade-
  Stufe bleibt an tieferem Dach + Pips ablesbar. Rein visuell.

### Lager skaliert mit der Stadt

- Holz/Stein/Essen liefen bei ~2.300 gegen eine harte Wand, Produktion verpuffte.
  Rathaus-Lager 300 → **1.000** je Ressource, Lagerhaus 200 → **2.000** je
  Ressource. Ein Lagerhaus lohnt sich jetzt wirklich, und die Obergrenze wächst
  mit der Stadt statt bei 2.300 zu ersticken.

### Unterhaltskosten: Einkommen wird netto (Geld-Sink)

- Große Städte ertranken in Geld (+221k/min, kein Ausgabeziel). Neu: ein
  generischer **`upkeep`-Effekt** — Gebäude kosten im Betrieb laufend Geld.
  Einkommen ist damit **netto = Einnahmen − Unterhalt**.
- Unterhalt liegt v. a. auf **Betriebs-Infrastruktur** (Läden, Märkte, Produktion,
  Wasserwerk, Feuerwehr, Lagerhaus, Parks) und skaliert bei Wohngebäuden mit der
  **Haushaltszahl** — er wächst also mit der Stadt, ohne das frühe Spiel zu
  erdrücken (Straßen kosten minimal pro Feld → sanfter Druck zu kompakten
  Layouts).
- **UI:** Kopfleisten-Geld zeigt jetzt das **Netto**-Einkommen (rot bei Defizit);
  Wirtschaftspanel und Geld-Popover schlüsseln Einnahmen → Unterhalt → Netto auf.
- *Technisch:* Aggregiert im derived-Layer (`upkeep`), verrechnet in der einen
  `computeIncome`-Quelle; der Tick bucht `netto × dt` und floored Geld bei 0.
- *Hinweis:* Erster Balancing-Durchlauf mit runden Werten — die exakte Netto-
  Quote lässt sich später an echten Spielständen feinjustieren (alle Werte in
  `buildings.config`).

### Der eigentliche Endgame-Fix bleibt Content

- Level 10 ist die Content-Decke (bewusster Cliffhanger). Der nächste Schritt
  ist MVP-2-Inhalt (Level 11+, Fluss-Distrikt, Notdienste, Energie) — dann
  bekommt das Geld wieder echte Ausgabeziele.

## v0.5 — „UI/UX-Überarbeitung: modernes City-Builder-Gefühl"

Ein durchgehender Oberflächen-Pass in Richtung eines hochwertigen, modernen
Aufbau-Spiels. Die Spielmechanik bleibt unverändert — neu sind Darstellung,
Interaktion und ein Baukasten wiederverwendbarer UI-Bausteine. Keine Emojis,
durchgängig SVG-Icons; die Spiellogik bleibt strikt von React/Pixi getrennt.

### Wiederverwendbare Komponenten-Basis (§15)

Neu als eigenständige, kombinierbare Bausteine — nicht als Einmal-Widgets:
`Popover`, `Modal`, `ConfirmModal`, `EventModal`, `ResourceBadge`,
`ResourceDetailPopover`, `ActionBubble`, `BuildingPreview`, `FloatingBuildingSheet`,
`EconomyPanel`, `CityStatusPanel` sowie ein zentrales Icon-Modul
(`common/icons.tsx`). Ressourcen-, Bedürfnis- und Kategorie-Icons haben jetzt
**eine** Quelle der Wahrheit — ein neues Icon ist eine Zeile, keine Suche durch
die Komponenten.

### Kopfleiste: Ressourcen-Badges mit Detail-Popover (§2, §12)

- Jede Ressource ist ein **anklickbares Badge** mit Farbakzent; ein Klick öffnet
  ein **Detail-Popover** (Bestand vs. Lagerkapazität als Balken, Produktion pro
  Minute, kurze Erklärung „woher kommt das?").
- Das **Geld-Badge** zeigt das Netto-Einkommen und verlinkt direkt in die
  Wirtschaftsübersicht.

### Gebäude-Interaktion: schwebendes Sheet + Aktions-Bubbles (§3, §4, §13)

- Das Gebäude-Panel ist jetzt ein **schwebendes Sheet über der Karte** statt
  eines abdunkelnden Vollbild-Dialogs — die Stadt bleibt sichtbar.
- Beim Anklicken **zentriert die Kamera sanft** auf das Gebäude (weiche
  Ease-Animation; jede manuelle Geste bricht sie ab).
- Aktionen (Upgrade, Verschieben/Umsetzen, Abriss) sind **runde Aktions-Bubbles**
  im Tonfall der Aktion; Abriss läuft über den gemeinsamen `ConfirmModal`.

### Visuelles Baumenü mit Mini-Vorschau (§5, §12)

- Jede Gebäudekarte zeigt eine **programmatische Mini-Vorschau** (Gebäude-Körper
  mit Fenstern, Straßen als Fahrbahn, Grün als Laub) — dieselbe Bildsprache wie
  auf der Karte, ganz ohne Assets, gestochen scharf in jeder Größe.

### Stadt-Status: umsetzbare Hinweise (§10)

- Neues **Stadt-Status-Panel**: zuerst **anklickbare Alarme** (Bedürfnis niedrig,
  Lager voll, Quest-Belohnung wartet) — jeder Alarm führt direkt zur Lösung
  (ins Baumenü mit vorgewähltem Gebäude bzw. ins passende Panel) —, darunter die
  vollständige Bedürfnis-Aufschlüsselung mit Balken.

### Wirtschaftspanel (§11)

- Eigenes **Wirtschaftspanel** mit Einnahmen-Split (Wohnen/Gewerbe/Produktion)
  als Balken, Gesamtsumme und Beschäftigungsgrad. Liest ausschließlich die
  bestehende `computeIncome`-Quelle — keine Zahl wird im UI nachgerechnet.

### Vereinheitlichtes Popup-System (§9)

- **Toast** (flüchtig) · **EventModal** (bestätigungspflichtige Momente wie
  Level-Up und neuer Sektor, datengetrieben aus einer UI-Event-Queue) ·
  **ConfirmModal** (destruktive Aktionen). Alle bauen auf einer gemeinsamen
  `Modal`-Hülle auf.

### Karten-Interaktion (§7, §13)

- **Straßen per Ziehen bauen:** Mit gedrückter Maustaste über die Karte fahren
  legt einen ganzen Straßenzug; Überlappungen bleiben stumm, echte Blocker
  (Geld, gesperrter Sektor) melden sich einmalig.
- **Kamerafokus** beim Auswählen (siehe oben).

### Bewusst als nächste Schritte offen

Karten-verankerte Aktions-Blasen, die ein Gebäude beim Verschieben der Karte
mitverfolgen, echte Gebäude-Sprites und der Besichtigungsmodus bleiben spätere
Ausbaustufen — die Komponenten-Basis ist darauf ausgelegt.

## v0.4 — „Wirtschaft, Wohnraum & Versorgung"

Ein zusammenhängender System-Pass: glaubwürdige Geldgrößen mit mehreren
Einnahmequellen, ein echtes Wohn-/Bevölkerungsmodell, ein generisches
Versorgungs-Overlay und verschiebbare Spezialgebäude. Alle Werte liegen in
Configs; die Spiellogik bleibt frei von React/Pixi.

### Wirtschaft auf glaubwürdiger Größenordnung (§3–§5)

- **Geld läuft jetzt auf Stadt-Maßstab** statt zweistelliger Spielgeld-Beträge:
  kleines Haus 6.000, Reihenhaus 22.000, Apartment 90.000, Markt 20.000,
  Wasserpumpe 40.000, Sektor-Freischaltung ab ~80.000. Startkapital 45.000.
- **Materialien (Holz/Stein/Essen) bleiben kleinskalig** — dadurch sind sie ein
  *eigener* Engpass neben Geld: Geld kauft den Bauplatz, Material und Versorgung
  begrenzen, *was* du baust. Geld blockiert nicht mehr jede Aktion (§3).
- **Mehrere Einnahmequellen statt nur Miete** (§5), als generischer `revenue`-
  Effekt: **Wohnen** (Grundsteuer pro Kopf, zufriedenheitsabhängig), **Gewerbe**
  (Läden/Markt, skaliert mit besetzten Arbeitsplätzen) und **Produktion**
  (Industrieabgaben). Neue Quellen (Tourismus, Transport) sind reine Config.
- **Neues Finanz-/Wirtschaftspanel** im Bürgermeister-Tab zeigt Einnahmen pro
  Minute nach Quelle + Beschäftigungsgrad — „woher das Geld kommt" auf einen
  Blick. In der Kopfleiste steht das Netto-Einkommen pro Minute am Geldwert.
- **Zahlenformat** `formatMoney`: 12.500 · 250.000 · 1,2 Mio. · 1,2 Mrd.
- *Technisch:* `economy/income.ts` (`computeIncome`) ist die einzige Quelle der
  Wahrheit — Tick und UI rechnen identisch.

### Echtes Wohn- & Bevölkerungsmodell (§6/§7)

- Wohngebäude bestehen jetzt aus **Wohnungen × Bewohner pro Wohnung**
  (generischer `housing`-Effekt) statt einer einzelnen Zahl:
  - **Kleines Haus** – 1 Wohnung, bis 5 Bewohner: Vorstadt, hohe Wohnqualität,
    reagiert stark auf Grün & Industrie in der Nähe.
  - **Reihenhaus** – 5 Wohnungen (bis 20 Bewohner): dichter, höhere Versorgungs-
    und Wassernachfrage.
  - **Apartment** – 16 Wohnungen (bis 48 Bewohner): hohe Verdichtung, braucht
    Infrastruktur & Parks.
  - Haus-Upgrades erhöhen Wohnungen und Bewohner sichtbar.
- Einwohnerzahl ergibt sich aus **tatsächlicher Belegung**: mehr Wohnraum füllt
  sich nur nach und nach und nur bei guter Versorgung/Zufriedenheit. Die
  Kopfzeile zeigt „Einwohner / Kapazität" + Wohnungszahl.
- **Haustyp-Profile** wirken spürbar über `ambienceSensitivity` (Vorstadt
  gewichtet Umgebungsqualität stärker) und unterschiedlichen Wasserbedarf.
- Wasserbedarf kommt jetzt **vollständig aus den Häusern** (skaliert mit Typ &
  Ausbaustufe), nicht mehr aus einer pauschalen Pro-Kopf-Zahl.

### Generisches Versorgungs-Overlay (§1)

- **Ein System für alle Versorgungsarten** (`buildings/coverage.ts`): Klick auf
  ein Versorgungsgebäude zeigt **alle Gebäude desselben Typs** samt Radien und
  markiert jedes Wohngebäude nach Zustand — *versorgt*, *mehrfach versorgt*,
  *unterversorgt* (Kapazität reicht nicht) oder *nicht versorgt*. Das
  ausgewählte Quellgebäude ist hervorgehoben.
- Funktioniert ohne Sonderlogik für Wasser, Freizeit, Essen-Verteilung und
  Brandschutz — und ist damit für Polizei/Gesundheit/Bildung/Umwelt/ÖPNV
  vorbereitet (nur neue Config nötig).
- Halbtransparente Flächen + Status-Punkte über den Gebäuden + **Legende** unten
  links; Überlappungen bleiben lesbar.

### Verschiebbare Spezialgebäude (§2)

- Normale Gebäude bleiben **nach dem Bau unverschiebbar** (abreißen & neu bauen).
- **Nicht abreißbare Spezialgebäude** (Rathaus, Bürgermeisterhaus) sind dafür
  über eine eigene Aktion im Gebäude-Sheet **verschiebbar** — Fehlplatzierungen
  beschädigen den Spielstand nicht mehr dauerhaft. Platzierungsregeln
  (Straße, Untergrund, freier Platz) werden erneut geprüft; optionale Gebühr
  (`relocationCost`) per Config. Steuerung über `canDemolish`/`canRelocate`.

### Migration

- Save-Schema **v2 → v3**: gespeichertes Geld wird ×100 skaliert, damit alte
  Spielstände ihren relativen Wohlstand behalten. Wohn-/Einkommensmodell ist
  config-abgeleitet und greift automatisch.

### Für später vorbereitet

Generischer `revenue`-Effekt (weitere Einnahmearten), generisches
Coverage-System (weitere Versorgungsbedürfnisse), `housing`-Modell (Hochhäuser
mit hoher Verdichtung), `canRelocate` (Distrikt-Zentren).

---

## v0.3 — „Stadtplanung mit Konsequenzen"

Großer Balancing- und Planungs-Pass: Produktionsgebäude sind jetzt wertvoll
statt Spam, Bürger sind anspruchsvoller, Standort und Nähe zählen mehr, und
Fehlplatzierungen haben Konsequenzen (kein freies Verschieben mehr). Alle
neuen Stellschrauben liegen in Configs.

### Gebäude-Limits pro Level (kein Spam mehr)

- **Produktionsgebäude haben jetzt eine Obergrenze, die mit dem Level wächst**
  (`buildLimit` pro Gebäude in `buildings.config.ts`):
  - Sägewerk: 2 (L2) → 3 (L5) → 5 (L8)
  - Steinbruch: 2 (L4) → 3 (L7) → 4 (L10)
  - Farm: 2 (L4) → 3 (L6) → 5 (L9)
  - Kleiner Laden: 2 (L6) → 4 (L9); Bäckerei: 2 (L9)
- **Wohnhäuser, Straßen und Dekoration bleiben unbegrenzt baubar** (§13) — das
  Wachstum wird durch Versorgung/Bedürfnisse gesteuert, nicht durch harte Caps.
- Erreichtes Limit ist klar sichtbar: Zähler „2/2 gebaut · mehr ab Level 7" auf
  der Baukarte (ausgegraut), und beim Platzierungsversuch ein deutlicher Toast
  „Limit erreicht: Mehr Sägewerke ab Level 7."
- *Technisch:* reines Config-Feld + Helfer `buildLimitAt`/`countOf`/`nextLimitLevel`
  (`buildings/limits.ts`); Platzierung prüft `limit_reached`; `getBuildLimit()`
  am Controller liefert der UI Stand/Cap/nächstes Level.

### Produktion neu balanciert (weniger Gebäude, mehr Wert)

- Sägewerk **9 → 14 Holz/min**, Steinbruch **6 → 11 Stein/min**, Farm
  **10 → 15 Essen/min**, Bäckerei **6 → 9**, Kleiner Laden **4 → 6 Geld/min**.
- Wenige, gut platzierte Betriebe reichen jetzt für eine sinnvolle Produktion;
  Standortboni (Wald/Gebirge/Boden) wiegen dadurch schwerer.

### Bürger werden anspruchsvoller (Zufriedenheit realistischer)

- **Erwartungs-Inflation:** Mit jedem Level steigt der Bedarf pro Bedürfnis um
  4 % (`needExpectationPerLevel`). Eine wachsende Stadt muss weiter investieren —
  Zufriedenheit klebt nicht mehr bei 100 %, eine gut geplante Stadt liegt eher
  bei 70–90 %.
- **Wasserbedarf nach Haustyp/-stufe:** Wohnhäuser stellen jetzt eigenen
  Wasserbedarf (neuer, generischer `demand`-Effekt): Kleines Haus 3 → 7 → 13 je
  Ausbaustufe, Reihenhaus 9, Apartment 24. Größer/höher ausgebaut = mehr
  Wasserdruck (§3/§4).
- Beides zusammen macht Unterversorgung spürbar und Überversorgung nicht
  automatisch perfekt.

### Nähe & Radien wichtiger

- **Marktplatz verteilt Essen nur noch im Radius 9** (statt stadtweit): Nur
  Wohnhäuser in Reichweite bekommen volle Versorgung, der Rest fällt auf den
  Ohne-Markt-Deckel zurück. Markt gehört jetzt mitten ins Wohngebiet (§8).
- **Rathaus gibt einen kleinen Attraktivitäts-Bonus** an die direkt umliegenden
  Blocks (Ambience +2, Radius 3) — läuft über dieselbe Zoning-/Ambience-Mechanik
  wie Parks (§9).
- **Farm** wirkt sich jetzt (leicht) negativ auf direkte Wohnnähe aus
  (Ambience −1), wie Sägewerk/Steinbruch — Wohn- und Industriegebiete trennen
  lohnt sich mehr (§11/§12). Ambience-Deckel auf Zufriedenheit **15 → 20**, damit
  Grünflächen stärker zählen.
- Radius wird beim Platzieren/Anklicken weiterhin als Overlay angezeigt.

### Verschieben deaktiviert, Abriss inszeniert

- **Gebäude lassen sich nach dem Bau nicht mehr verschieben** (§5): realistische
  Planung, Fehlplatzierung hat Konsequenzen. Der Info-Dialog erklärt: „Gebäude
  können nach dem Bau nicht verschoben werden. Reiße es ab und baue es neu."
  Verschiebe-Button und Gedrückt-Halten-Geste sind aus (Feature-Flag
  `features.moveBuildings` — Engine-Befehl bleibt für später erhalten).
- **Abriss-Rückerstattung 50 % → 25 %** (`demolishRefundFactor`, konfigurierbar):
  Umplanen bleibt möglich, kostet aber etwas.
- **Abriss-Animation:** kleine Staubwolke am Gebäudeplatz; die
  Rückerstattung erscheint weiter als Toast.

### Expansion inszeniert

- **Neues Gebiet freischalten** blitzt jetzt sichtbar auf dem neuen Sektor auf
  und zeigt ein zentrales Popup „Neues Gebiet freigeschaltet" (§7) — Expansion
  fühlt sich belohnend an statt nur ein UI-Zustand zu wechseln.

### Spielplatz & Grün

- **Spielplatz ist jetzt 2×2** statt 1×1 (§10) — Freizeitplanung braucht Platz.
- Parks, Spielplatz, Bäume und der Rathaus-Bonus verbessern über Ambience die
  Wohnqualität und damit die Zufriedenheit (§11).

### Für später vorbereitet (Architektur)

- **Generischer `demand`-Effekt** und **radiusbasierte `distribution`** sind so
  angelegt, dass weitere Bedürfnisse (Strom, Sicherheit, Gesundheit, Bildung)
  und Verteil-Dienste reine Config-Einträge werden.
- Produktionsketten bleiben über `inputsPerMinute` vorbereitet (Verbrauch →
  Produktion, im Tick implementiert); Logistik/Verkehr kann später als
  Modifikator auf Produktion/Verteilung aufsetzen, ohne neue Struktur.

### Balancing-Referenz (geänderte Werte)

| Wert | vorher | jetzt |
|---|---|---|
| Sägewerk | 9 Holz/min | 14 Holz/min |
| Steinbruch | 6 Stein/min | 11 Stein/min |
| Farm | 10 Essen/min | 15 Essen/min |
| Bäckerei | 6 Essen/min | 9 Essen/min |
| Kleiner Laden | 4 Geld/min | 6 Geld/min |
| Abriss-Rückerstattung | 50 % | 25 % |
| Ambience-Deckel (Zufriedenheit) | ±15 | ±20 |
| Erwartung pro Level | — | +4 % Bedarf |
| Wasserbedarf Kl. Haus (Stufe 0/1/2) | 0 | 3 / 7 / 13 |
| Markt-Verteilung | stadtweit | Radius 9 |
| Rathaus-Aura | — | Ambience +2, Radius 3 |
| Spielplatz | 1×1 | 2×2 |

### Was als Nächstes testen

- Sehr frühes Spiel (L1–3): fühlt sich das Sammeln mit 1–2 Sägewerken flott an?
- Nach vielen Wohnhäusern ohne Brunnen/Pumpe: sinkt die Zufriedenheit spürbar?
- Markt weit weg vs. mitten im Wohngebiet: Unterschied bei „Essen"?
- Produktionsgebäude direkt neben Wohnhäusern: Ambience-Malus sichtbar?
- Produktions-Limit erreichen: klare Meldung, Karte ausgegraut?
- Abriss + neues Gebiet freischalten: Animationen und Popups sichtbar?
- Nach längerer Offline-Zeit: Lager gedeckelt, keine Wunderwerte.

## v0.2.2 — „Wohnen mit Aussicht" (Zoning aktiv)

- **Wohnqualität wirkt jetzt auf die Zufriedenheit.** Die bisher nur berechnete
  Umgebungsqualität (`ambience`) ist jetzt ein echter Spielfaktor: Wohnhäuser
  in der Nähe von **Parks und Dekoration** werden zufriedener, Wohnhäuser neben
  **Industrie** (Sägewerk, Steinbruch) unzufriedener. Damit wird das Trennen von
  Wohn- und Industriegebieten (§12) eine echte Planungsentscheidung statt bloßer
  Vorbereitung.
  - *Wirkung:* stadtweiter, wohnraum-gewichteter Ambience-Schnitt × Faktor,
    gedeckelt auf ±15 Zufriedenheitspunkte (`ambienceHappinessPerPoint`,
    `ambienceHappinessCap` in `balancing.config.ts`).
  - *Sichtbar:* neue Zeile „Wohnqualität" im Zufriedenheits-Panel mit
    Punktbeitrag und Hinweis („… trenne Wohn- und Industriegebiete"); der
    Gebäudedialog zeigt die Umgebung pro Wohnhaus weiterhin einzeln.
  - *Technisch:* `avgAmbience` wird in `derived.ts` einmal pro Strukturänderung
    aggregiert (Tick bleibt O(1) dafür); der Tick addiert den gedeckelten
    Beitrag zur Zufriedenheit. Wohlstands-abhängige Gewichtung (reiche Bürger
    meiden Industrie stärker) kann später als Faktor auf denselben Wert
    aufsetzen — keine neue Struktur nötig.

## v0.2.1 — „Umbauen ohne Reue"

- **Abreißen erstattet Material zurück.** Beim Abriss gibt es **50 %** der
  investierten Bau- **und** Ausbaukosten zurück (pro Ressource abgerundet, Geld
  uneingeschränkt, Material im Rahmen der Lagerkapazität). Der
  Abriss-Bestätigungsdialog zeigt die Rückerstattung vorab an, ein Toast
  bestätigt sie danach.
  - *Warum:* Umplanen soll ein Werkzeug sein, keine Bestrafung. Der 50-%-Abschlag
    verhindert nur, dass Bauen–Abreißen–Schleifen kostenlos sind.
  - *Technisch:* `demolishRefundFactor` in `balancing.config.ts`; reine Funktion
    `demolishRefund(def, upgradeLevel, factor)` (in `buildings/effects.ts`);
    Rückerstattung läuft über den `EconomyService` (`grantResources`), also
    denselben Buchungsweg wie jede andere Gutschrift. `getDemolishRefund()` am
    Controller liefert der UI die Vorschau.
- **Verschieben direkt aus der Auswahl.** Ein ausgewähltes Gebäude lässt sich
  über den „Verschieben"-Button im Info-Dialog aufheben und neu platzieren
  (zusätzlich zum Gedrückt-Halten auf der Karte). Verschieben bleibt kostenlos.

## v0.2 — „Stadtplanung statt Warten"

Ziel dieses Updates: weniger AFK-Wartespiel, mehr aktives Planen und Gestalten.
Geld ist nicht mehr der einzige limitierende Faktor — Fläche, Straßennetz,
Versorgungsradien, Ressourcenlogistik und Standortwahl entscheiden über die
Entwicklung der Stadt.

### Wirtschaft & Ressourcen

- **Kein manuelles Einsammeln mehr.** Produktionsgebäude liefern automatisch
  ins Stadtlager. Volle Lager stoppen die Produktion — Lagerhäuser sind jetzt
  eine echte Ausbau-Entscheidung. Die Kopfleiste zeigt pro Ressource
  Bestand/Kapazität und (per Tooltip) die Produktionsrate; volle Lager werden
  gelb hervorgehoben.
  - *Warum:* Das Abklicken von Ertrags-Bubbles war reine Beschäftigung ohne
    Entscheidung. Der frei gewordene Klick-Fokus liegt jetzt auf Planung.
  - *Technisch:* Produktion bucht im Tick direkt über die Storage-Caps;
    `stats.produced` ersetzt `stats.collected` (Quests zählen produzierte
    statt eingesammelte Mengen). Alte Spielstände werden migriert
    (Schema v1 → v2), ungesammelte Puffer werden einmalig gutgeschrieben.
- **Produktionswerte erhöht** — weniger Gebäude-Spam nötig: Sägewerk
  6 → 9 Holz/min, Steinbruch 4 → 6 Stein/min, Farm 8 → 10 Essen/min,
  Bäckerei 5 → 6 Essen/min.
- **Gelddominanz reduziert:** Steuern 0,5 → 0,3 pro Bürger/min, Steuerfaktor
  hängt stärker an der Zufriedenheit (0,35×–1,5×). Der Kleine Laden erzeugt
  4 statt 8 Geld/min. Baukosten mittlerer Gebäude verlangen mehr Holz/Stein.
  Idle-Einkommen allein trägt den Ausbau nicht mehr — produzieren, versorgen
  und expandieren schon.

### Standortvorteile (neu)

- Produktionsgebäude erhalten **Terrain-Boni** (config-gesteuert über
  `locationBonus` in `buildings.config.ts`):
  - Sägewerk: +5 % pro Waldtile im Umkreis 3 (max. +50 %)
  - Steinbruch: +8 % pro Gebirgstile im Umkreis 3 (max. +60 %)
  - Farm: +4 % pro fruchtbarem Boden im Umkreis 2 (max. +40 %)
- Überbaute Tiles zählen nicht — wer den Wald ums Sägewerk zubaut, verliert
  den Bonus.
- **Sichtbar gemacht:** grüner Badge am Gebäude, Bonus-Prozente live in der
  Platzierungsvorschau (grünes Banner), Bonuszeile im Gebäudedialog und
  Hinweis auf der Baukarte („Bonus in der Nähe von: Wald").

### Brunnen & Versorgung mit Radius

- Brunnen (Radius 7) und Wasserpumpe (Radius 12) versorgen **nur noch
  Wohnhäuser in ihrem Umkreis**. Gesamtkapazität × abgedeckter
  Wohnraum-Anteil = Wasser-Erfüllung.
- Beim Platzieren und beim Anklicken wird der Radius als Overlay eingeblendet
  (ebenso für Parks, Feuerwehr und Dekorations-Auren).
- *Technisch:* Capacity-Effekte können ein `radius`-Feld tragen; die
  Coverage-Berechnung ist generisch pro Bedürfnis (`needCoverage` in
  `derived.ts`) — künftige radiusbasierte Dienste (Polizei, Krankenhaus,
  Schule) sind reine Config-Einträge.

### Straßen-Autotiling

- Straßen verbinden sich jetzt sichtbar: Gehweg-Rahmen, Asphaltkörper,
  Mittelstreifen auf Geraden, Kurven-Markierung in Ecken, T-Kreuzungen und
  **Kreisverkehr-Optik** bei Vierfach-Kreuzungen. Straßen docken optisch am
  Rathaus an.
- *Warum:* Die Stadt soll geplant und urban wirken, nicht wie gewürfelte
  Blöcke.

### Gebäude verschieben (neu)

- **Gedrückt halten (~0,3 s) hebt ein Gebäude auf**, ziehen und klicken setzt
  es ab. Alternativ: „Verschieben"-Button im Gebäudedialog. Rechtsklick/ESC
  bricht ab.
- Verschieben ist kostenlos — Umplanen wird nicht bestraft. Auch das Rathaus
  darf umziehen (nur Abriss bleibt für einzigartige Gebäude gesperrt).
- Während des Tragens: Original ausgegraut, Ghost mit Gültigkeits-Färbung,
  Radius-Vorschau und großem Feedback-Banner.

### Platzierungs-Feedback

- **Großes zentrales Banner** statt kleiner Toasts: zeigt beim Bauen und
  Verschieben live den konkreten Grund („Braucht Anschluss an eine verbundene
  Straße", „Dieser Sektor ist noch gesperrt", …), grün bei gültiger Position,
  inklusive Standortbonus-Anzeige.

### Sichtbare Ausbaustufen

- Ausgebaute Gebäude zeigen **Stufen-Pips** auf dem Dach, ein tieferes
  Dachband und eine kräftigere Kontur. Im Gebäudedialog zeigt eine
  Pip-Leiste Stufe und Maximum.

### Gebäudedialog & UI

- Gebäude-Infos erscheinen als **zentrierter, großer Dialog** mit Icons pro
  Effekt, Produktionsrate inkl. Bonus, Umgebungsqualität, Bauzeit-Status und
  klar getrennten Aktionen (Verschieben / Ausbauen / Abreißen mit
  Inline-Bestätigung statt Browser-Popup).
- **Baumenü:** Karten mit Kosten-Chips (Icons statt Textwüste), Bauzeit,
  Footprint-Größe, Effektzeile, Standortbonus-Hinweis und Schloss-Symbol für
  gesperrte Gebäude; sortiert nach Freischalt-Level; Schließen-Button.
- Größere Toasts, mehr Abstand in den Leisten, Lager-voll-Warnung in der
  Kopfleiste.

### Karte

- **Weiher im Nachbarsektor (West/Süd):** kleiner See mit Sandufer in Sektor
  (0,2). Das Ufer bleibt bebaubar und ist für spätere Wasser-Gameplay-Gebäude
  (Fischerhütte, Kajak-Verleih) reserviert — Anbindung ans Biome-/Effekt-
  System ist vorbereitet.
- **Gebirgszug am Westrand** als Ziel für Steinbruch-Boni.
- Berge, Seen und Flüsse haben erkennbare Tile-Details. Bestehende
  Spielstände erhalten das neue Terrain per Migration (nur unbebaute Tiles
  werden neu abgeleitet).

### Vorbereitet für später (Architektur, bewusst noch ohne Gameplay)

- **Produktionsketten:** `produce`-Effekte unterstützen `inputsPerMinute` —
  ein Gebäude kann Ressourcen verbrauchen und skaliert seine Produktion mit
  der Input-Verfügbarkeit. Getriebe für Weizen → Bäckerei, Erz → Fabrik ist
  im Tick implementiert; Logistik über Auto/Schiff/Flugzeug kann später als
  Modifikator auf dieselbe Schnittstelle aufsetzen.
- **Wohn-/Industrietrennung:** neuer `ambience`-Effekt (positiv: Parks,
  Dekoration; negativ: Sägewerk, Steinbruch). Die Umgebungsqualität wird pro
  Wohnhaus berechnet und im Gebäudedialog angezeigt — die spätere
  Wohnattraktivität (wohlhabende Bürger meiden Industrienähe) braucht nur
  noch eine Formel, keine neue Datenstruktur.

### Balancing-Referenz (geänderte Werte)

| Wert | vorher | jetzt |
|---|---|---|
| Steuern pro Bürger/min | 0,5 | 0,3 |
| Steuerfaktor (Zufriedenheit) | 0,5–1,5× | 0,35–1,5× |
| Sägewerk | 6 Holz/min | 9 Holz/min (+Waldbonus) |
| Steinbruch | 4 Stein/min | 6 Stein/min (+Gebirgsbonus) |
| Farm | 8 Essen/min | 10 Essen/min (+Bodenbonus) |
| Bäckerei | 5 Essen/min | 6 Essen/min |
| Kleiner Laden | 8 Geld/min | 4 Geld/min |
| Brunnen | global | 25 Wasser, Radius 7 |
| Wasserpumpe | global | 90 Wasser, Radius 12 |
| Kleines Haus | 50 G, 10 H | 50 G, 15 H |
| Reihenhaus | 180 G, 50 H, 20 S | 160 G, 60 H, 30 S |
| Apartmenthaus | 520 G, 80 H, 120 S | 450 G, 100 H, 140 S |
