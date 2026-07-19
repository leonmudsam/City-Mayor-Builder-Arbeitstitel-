# OVERHAUL 3.0 — Welt-, UI- & Interaktions-Überarbeitung (Audit + Umsetzungsplan)

> **Status: O1 abgeschlossen; visuelle Grundlage aus O2/O3/O5/O12 in v0.60
> umgesetzt.** Dieses Dokument bleibt der verbindliche
> Umsetzungsplan gemäß Auftrag „WORLD, UI & INTERACTION OVERHAUL 3.0", Abschnitt 4.
> Es baut auf dem **abgeschlossenen Programm Ausbaustufe 2.0 (A1–A10, v0.50–v0.59)**
> auf und ersetzt es nicht. Designvorgabe ist das beigefügte **ChatGPT-Mockup**
> (Nachher-Ziel), die aktuellen Spiel-Screenshots sind der **Ist-Zustand**.
>
> **Grundregel (CLAUDE.md §1/§2, Auftrag §2/§3):** Simulation bleibt frei von
> `three`/`react`/`zustand`/Renderer/State. Bestehende Systeme **erweitern**, keine
> parallelen Systeme. Genau eine aktive Quelle je Bereich (Single Source of Truth).
> Saves brechen nie (ab v11 lineare Migration je persistierter Änderung).

### Stand v0.60 (Mockup-Übertragung)

Umgesetzt sind das maritime Glas-/Gold-Design, die kompakte Ressourcenleiste,
Level-Wappen, visuelle Zeitsteuerung, vertikale linke Hauptnavigation,
responsive kollisionsfreie HUD-Zonen, Ein-Sheet-Regel, Live-Inselkarte,
Bürger-Kompakt-/Detailansicht, KI-Regions-Hero, organischere Waldcluster,
Küstenschaum, horizontale Wolken-/Regionsnebel, atmosphärische Wolkenbänke sowie
die Drop-in-Landmarken Boot, Windmühle und Leuchtturm. Alle Änderungen sind rein
visuell bzw. UI-intern; Save-Schema **bleibt v11**.

Nicht als bereits erledigt zu lesen sind die größeren Gameplay-Phasen O4,
O6–O9 und O11. Der bedienbare 2D-Stadtarbeit-Routenplaner ist in v0.60 als
Erweiterung des bestehenden Aktivitätssystems umgesetzt (Zielreihenfolge,
Optimierung, Prognose, Speichern/Starten). Seine Belastungsfarben sind bis zum
echten Verkehrsmodell O9 eine deterministische Schätzung; echte
Straßengraph-/Staudaten und deren Kopplung an die Auszahlung bleiben O10-Rest.

---

## 0. Methodik & Ist-Architektur (verifiziert)

Kern-Inventur aus dem aktuellen Code (Grundlage für „technische Ursache" je Problem):

| Bereich | Aktive Quelle / Ort | Beobachteter Ist-Zustand |
| --- | --- | --- |
| Simulation | `src/game/**` (rein, Zod-Config) | Sauber getrennt, `GameController` einzige Command-API. |
| Renderer | `src/renderer/three/ThreeMapRenderer.ts` (3636 Z.) | Ein Monolith; Ozean, Terrain, Nebel, Deko, Straßen, Fahrmodus. |
| UI | `src/components/**` + `src/styles.css` (1186 Z.) | Feste `position:absolute` + z-index-Stapel; A8 führte `--bottom-bar-clear:120px` ein. |
| Wasser | `buildOcean()` @ `ThreeMapRenderer.ts:1285` | **Eine** 4096er-Wellenebene auf `WATER_LEVEL` füllt Meer + Seen/Flüsse (Becken unter Wasserlinie im Bake). |
| Regionen | `regions.config.ts` (32 Defs) + `world/islandRegions.gen.ts` | Organische Regionen (A1). **Keine** Ausbauflächen-Unterteilung. |
| Straßen | `placeBuilding('road',…)` @ `MapView.tsx:104` | **Sofortbau** beim Drag-Painting; keine Planungs-/Bestätigungsphase. |
| Stadtarbeit | `activities.config.ts` + `simulation/activities.ts`, `DriveHud.tsx` | WASD-Fahrmodus als Hauptinteraktion (`drive:true`). |
| Zeit/Wetter | `environmentSettings.ts` (localStorage, **nicht** im Save) | Nur visueller Tag/Nacht-Zyklus; **kein** Wetter, keine Spielzeit. |
| Gebäude | `buildings.config.ts` (`sizeClass` XS–XXL), `effects.ts` | Footprints/Klassen fix (A1). Platzierung: Config-`size`-Loop. |

**Bestätigte SSoT-Kandidaten** (Auftrag §3), die wir erweitern statt duplizieren:
`buildings.config.ts`, `levels.config.ts`, `regions.config.ts`, `modelManifest.ts`,
`terrainTextureManifest.ts`, `roadTextureManifest.ts`, `GameController`, `SaveGame`,
Bake-Dateien (`world/island*.gen.ts`), `terrainHeightAt()` (einzige Höhenquelle).

---

## 1. Screenshot-Analyse (Ist) vs. Mockup-Analyse (Ziel)

### 1.1 Aktuelle Spiel-Screenshots (Ist-Zustand)
- Welt technisch solide (organische Regionen, Biome, Küste), aber: Seewasser teils
  unsichtbar, Meer wirkt endlich, Insel stellenweise „plattenhaft", Klippenkanten
  hart, große Flächen leer, Wälder gleichförmig, Nebel wirkt wie transparente Wand.
- UI: Bürgeranliegen überlappen untere Leiste/Einstellungen; Build-Button über
  Inhalten; rechte Seitenleiste dominant; untere Navigation groß/unklar; mehrere
  große Panels gleichzeitig.
- Interaktion: Straßen sofort gebaut; Stadtarbeit = WASD; Platzierungs-Ghost/Radien
  im 3D unvollständig; Kleines Büro zu klein; Upgrade-Abschluss wenig belohnend.

### 1.2 ChatGPT-Mockup (verbindliches Nachher-Ziel)
- Große zentrale 3D-Welt, sichtbares Meer bis zum Horizont, markante Gebirge,
  dichte Wälder, Seen/Flüsse als Highlights, Landmarken, bessere Minimap.
- **Kompakte obere Ressourcenleiste** (Rate direkt sichtbar), Levelblock links,
  Zeit+Wetter oben rechts, Menü ganz rechts.
- **Nur ein primäres Sheet** gleichzeitig; Stadtstatus als Chip/Sheet statt
  Dauerpanel; Bürgeranliegen als kompakte Inbox mit Detail-Sheet; vertikale
  Hauptnavigation links mit klarem „Bauen"-Hauptpunkt; warme Goldakzente,
  dunkles Glas.
- Bau-Menü mit echten 3D-Thumbnails, Stufenvergleich, Standortanforderungen.
- **2D-Top-down-Routenplanung** für Stadtarbeit (Screenshot 1): nummerierte Ziele,
  Verkehrs-Overlay grün/gelb/rot, Effizienz, Zeit, Medaillenprognose, „Auto-optimieren".
- Straßenbau mit vollständiger Routenvorschau (Länge/Kosten/Steigung/Viadukt).

---

## 2. Sichtbare Unterschiede → technische Ursache → Zielsystem → Dateien

Legende Save-Auswirkung: **[V]** rein visuell (kein Save) · **[S]** persistiert (Migration).

### A. Welt & Wasser
| Unterschied | Technische Ursache (Hypothese, in O2 zu verifizieren) | Zielsystem | Dateien | Save |
| --- | --- | --- | --- | --- |
| Seewasser teils unsichtbar | Frustum-Culling der großen Ozean-Ebene (BoundingSphere), Region-Dimming/Fog über Wasser, oder Seebecken-Kacheln nicht unter `WATER_LEVEL` im Bake; ggf. Transparenz-Sortierung/`depthWrite`. | Ozean-Mesh: `frustumCulled=false` + korrekte BBox; Bake-Assert „jeder See < Wasserlinie"; Wasser rendert nach Terrain. | `ThreeMapRenderer.ts` (`buildOcean`), `tools/bakeWorld.mjs`, Wasser-Tests | [V] |
| Meer wirkt endlich / Plattenkante | Ferne Inseln + Horizont-Blend fehlen an manchen Winkeln; harte Terrain-Klippen. | Küsten-Blend, Schaum an Felskanten, sanftere Klippen-Normalen, Horizontdunst. | `ThreeMapRenderer.ts`, `SkyEnvironment.ts` | [V] |
| Wälder gleichförmig, leere Flächen | Nur wenige Baum-Instanzen, eine Größe, Rasterverteilung. | Mehrschicht-Vegetation (Krone/Unterholz/Boden), Größenklassen 50–220 %, Cluster-Rauschen. | `ThreeMapRenderer.ts` (Deko-Pass), neue Drop-in-GLBs, `modelManifest.ts` | [V] |
| Nebel wie Glaswand | Extrudiertes Volumen mit harter Kante. | Mehrschicht-Nebel (Bodendunst, Bänke, Höhenvariation, Silhouetten, Noise-Shader). | `ThreeMapRenderer.ts` (Regions-Nebel) | [V] |

### B. UI
| Unterschied | Ursache | Zielsystem | Dateien | Save |
| --- | --- | --- | --- | --- |
| Panels überlappen | Feste absolute Positionen + z-index-Stapel, mehrere Sheets gleichzeitig erlaubt. | Ein-Sheet-Regel im `uiStore`; Layout-Grid mit reservierten Zonen; kompakte Ressourcenleiste/Nav. | `App.tsx`, `state/store.ts`, `styles.css`, alle `panels/*`, `hud/*` | [V] |
| Build-Button/rechte Leiste dominant | `.build-menu` `left/right:12px bottom:12px`; `.side-panel` volle rechte Spalte. | Zentrale Bottom-Nav; Side-Sheets kontextuell; Statusleiste als Chip. | `styles.css`, `hud/GameHud.tsx`, `hud/QuickActionBar.tsx` | [V] |
| Portraits/Icons statisch | Einfache Kreisgrafiken. | Rollenbasierte Portrait-Karten + konsistentes Icon-Set. | `components/art/Portraits.tsx`, `common/icons.tsx` | [V] |

### C. Gebäude & Platzierung
| Unterschied | Ursache | Zielsystem | Dateien | Save |
| --- | --- | --- | --- | --- |
| Ghost folgt nicht / kein echtes Modell | Placeholder-Ghost statt geladenes GLB am Raycast. | Echtes Modell als Ghost, live an Raycast, Footprint/Ausrichtung/Anschluss/Radius. | `ThreeMapRenderer.ts` (`setPlacing`), `MapView.tsx` | [V] |
| Verschieben im 3D fehlerhaft | Move-Flow ohne Live-Ghost/Validierung. | Verschieben = Ghost + Validierung, Mutation nur über Command. | `ThreeMapRenderer.ts`, `state/store.ts`, `controller.ts` | [V]/[S] |
| Radien fehlen in 3D | Keine Bodenprojektion der Wirkradien. | Weiche geländeprojizierte Radiusflächen (Wasser/Nahrung/Sicherheit/…). | `ThreeMapRenderer.ts`, `buildings/coverage.ts` (liefert Werte) | [V] |
| Kleines Büro zu klein / Upgrades schrumpfen | Prozedurale Höhe/Fallback nutzt Footprint nicht aus. | Größen-Audit + Dev-Matrix; §22-Regel „jede Stufe ≥3 Punkte stärker". | `ThreeMapRenderer.ts` (Höhen/Fallback), ggf. `visual.heightClass` je Def | [V] |

### D. Straßen, Verkehr, Stadtarbeit
| Unterschied | Ursache | Zielsystem | Dateien | Save |
| --- | --- | --- | --- | --- |
| Straße sofort gebaut | `placeBuilding` direkt im Pointer-Handler. | Planungsmodus: Route zeichnen → Vorschau (Farbe/Kosten/Steigung) → Bestätigen → Commands. | `MapView.tsx`, neues `roadPlanning` (Renderer/State), `controller.ts` | [S] neue Straßentypen |
| Gebirgsstraßen nur Textur | Keine geländebewussten Bauwerke. | Pass/Serpentine/Viadukt/Brücke/Tunnel als GLB-Bauwerke + Analyse. | `ThreeMapRenderer.ts`, `modelManifest.ts`, `roadTextureManifest.ts` | [S] |
| Fahrzeuge kollidieren | Ambient-Deko ohne Belegungsmodell. | Deterministisches Lane-Slot/Segment-/Kreuzungs-Token-Modell + Verkehrs-LOD. | `ThreeMapRenderer.ts` (Verkehr), evtl. reine Graph-Utils in `game/` | [V] |
| Parkplätze/Highway fehlen | Nicht vorhanden. | Parkplatz ab L7 (einparkende Autos), Highway ab L14 (Auf-/Abfahrten). | `buildings.config.ts`, `roadTextureManifest.ts`, Renderer | [S] |
| Stadtarbeit = WASD | `drive:true` als Hauptmodus. | **2D-Routenplanung** als Primärmodus (liest denselben Graph/Commands); WASD optional Arcade. | `activities.config.ts`, neue 2D-Planungsansicht (Renderer/UI), `controller.ts` | [S] Routenfortschritt (falls relevant) |

---

## 3. Savegame-Auswirkungen (Kap. 35)

Aktuell **Schema v11**. Jede persistierte Änderung = genau eine lineare Migration
+ Zod + Test. Geplante Save-Bumps (nur wenn spielerisch relevant, sonst außerhalb Save):

- **v12** (O4 Ausbauflächen): freigeschaltete `expansionAreaIds`; Migration
  v11→v12 leitet aus den bereits freigeschalteten Regionen die enthaltenen
  Startflächen ab (mindestens die Startfläche(n) der Startregion).
- **v13** (O6/O8 Straßen): neue Straßentypen (Highway/Gebirgsbauwerke) im
  Kachel-/Segmentmodell; Migration mappt Alt-Straßen auf `road_basic`.
- **v14** (O8 Parkplätze, O3-Zäune falls Save-relevant): Parkplatz-Slots,
  Zaunsegmente/Farmareale (falls Bonus persistiert).
- **Optional v15** (O11): Spielzeit/Wetterzustand **nur** falls spielerisch relevant;
  rein visuelle Tageszeit bleibt in `environmentSettings` (kein Save).

Jede Migration einzeln landbar; `docs/SAVE_MIGRATION.md` wird je Bump fortgeschrieben.

---

## 4. Performance-Risiken (Kap. 34) & Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
| --- | --- |
| Dichtere Vegetation → Draw-Calls | Instancing je Modell, LOD, Chunk-/Distanz-Culling, Dichte-Cap. |
| Verkehr/Arbeiter/Tiere | Feste Caps (Fahrzeug/Arbeiter/Tier), Verkehrs-LOD, Sim-Reduktion außerhalb Kamera. |
| Wetterpartikel | Nur im Kamerabereich; Nebel-LOD; keine Lichtquelle pro Fenster (Emissive + Fenstergruppen). |
| 2D-Routenansicht | Kein zweiter Kartenrenderer — liest denselben Graphen; nur Canvas/leichtes Mesh-Overlay. |
| React-Renders | Kein Re-Render pro Fahrzeug-/Wetterframe (Renderer-intern, Snapshot-Bridge unangetastet). |

Messpunkte (in `docs/PERFORMANCE.md`): Draw-Calls, sichtbare Meshes, aktive
Fahrzeuge/Arbeiter/Tiere/Partikel, CPU/GPU Frame Time, Speicher, Ladezeit —
Szenarien: leere Insel, L8-Stadt, Großstadt, Übersicht, Regen bei Nacht, dichter
Wald, ≥100 Fahrzeuge, mehrere offene Ausbauflächen.

---

## 5. Umsetzungsreihenfolge (Phasen O1–O13, entspricht Auftrag Kap. 37)

Jede Phase endet grün auf `npx tsc -b --force` · `npx eslint src tests` ·
`npx vitest run` · `npm run build`; Rendering-Phasen zusätzlich Playwright-
Screenshot-Smoke (Scratchpad, `vite preview`, Basis-URL `/`). Patch Note je Phase
(Deutsch, ausführlich) ab **v0.60**. Windows-Tauri-Build lokal nach O2 und O13.

- **O1** Audit + dieses Dokument. *(abgeschlossen)*
- **O2** Kritische Fehler: Meer/Seewasser, UI-Overlaps und Nebelwand in v0.60 behoben; 3D-Ghost/Verschieben, Radien und Größen-Audit bleiben offen.
- **O3** UI-Design-System: Tokens, Ressourcenleiste, Hauptnav, Side-Sheets, Bürgeranliegen, Stadtstatus, Bau-Menü, Gebäude-Detail, responsive Layouts, Portrait-/Icon-Aufwertung. *(visuelle Grundlage + Ein-Sheet-Regel in v0.60; Detail-Panels weiter iterieren)*
- **O4** Ausbauflächen: Bake-Sub-Segmentierung, `ExpansionAreaDefinition` im Regionssystem, Migration v12, Freischalt-UI + Teilgebietsnamen + Nebel je Fläche.
- **O5** Vegetation & Arbeitswelt: Waldcluster und Größenvariation in v0.60; Unterholz sowie sichtbare Ressourcen-Arbeiter/Maschinen bleiben offen.
- **O6** Straßenplanung: Planungsmodus + Routenvorschau (Kosten/Steigung/Vegetation/Konflikte) + Bestätigung + Straßen-Upgrade. Migration v13.
- **O7** Gebirgsinfrastruktur: Pass/Serpentine/Viadukt/Bergbrücke/Tunnel + Analyse + Stützmauern/Geländer.
- **O8** Parkplätze (L7) & Highway (L14): einparkende Autos, Auf-/Abfahrten, Verkehrsregeln, Aufgaben. Migration v14.
- **O9** Verkehr: Lane-Slots, Mindestabstand, Kreuzungsreservierung, Einfädeln, Parkplatzzufahrt, Verkehrs-LOD, Kollisionsvermeidung.
- **O10** Stadtarbeit-Routenplanung: Top-down-Planer, Zielsortierung,
  RNG-neutrale Vorschau, Auto-Optimierung, Prognose, Speichern und Übergabe an
  den bestehenden WASD-Fahrmodus in v0.60; echter Verkehrsgraph,
  Staudaten-Kopplung und effizienzbasierte Auszahlung bleiben offen.
- **O11** Wetter, Zeit & Nacht: automatische Zeit (1 Realmin = 30 Ingame-Min), Geschwindigkeiten, Wolken/Regen/nasse Materialien, Nachtbeleuchtung (Emissive).
- **O12** Biome, Nebel-Polish & Landmarken: Nebel-Schichten, Küstenschaum und erste Landmarken in v0.60; neue Biome und stärkere Regionsidentität bleiben offen.
- **O13** Abschluss & Bereinigung: Legacy/tote Dateien, Docs (Kap. 5), ADRs (Kap. 5), Tests (Kap. 36), Performancebericht, Patch Notes, Vorher/Nachher-Screenshots.

**Begründete Reihenfolge-Abweichung vom Mockup:** O2 zieht die kritischen
Fehlerbehebungen vor die kosmetische UI-Politur, weil unsichtbares Wasser und
Panel-Überlappungen die Spielbarkeit beeinträchtigen (Auftrag §7 „verbindlich").

---

## 6. Akzeptanzkriterien (Auftrag Kap. 38, verdichtet je Phase)

- **O2:** Hauptinsel vollständig von Meer umgeben; jeder See/Fluss zeigt Wasser
  (Test: Bake-Assert + „Wasser-Mesh nicht gecullt"); keine Panel-Überlappung bei
  1280×720/1920×1080; Ghost folgt Raycast; Verschieben+Abbruch erhält Ursprung;
  Radien sichtbar & = Simulation; Kleines Büro ≥ Mindestvolumen; keine Stufe kleiner.
- **O3:** Nur ein primäres Sheet; Build-Button verdeckt nichts; Belohnungsbuttons
  erreichbar; Ressourcenleiste/Nav wie Mockup.
- **O4:** 80–120 Ausbauflächen, je einer Region zugeordnet, überlappungsfrei, nicht
  voll im Wasser; Unlock-Abhängigkeiten erreichbar; Preise/Level balanciert.
- **O6–O10:** Straße erst nach Bestätigung; Vorschaukosten = Baukosten; Verkehr
  ohne sichtbares Durchfahren; Routenbewertung deterministisch; 2D-Planung nutzt
  dieselben Welt-/Verkehrsdaten; Fahrzeug fährt Route sichtbar in 3D ab.
- **O11:** Zeit läuft/pausiert/beschleunigt; Regen endet korrekt; Nachtbeleuchtung
  aktiv; Performancegrenzen gehalten.

---

## 7. Geplante Tests (Auftrag Kap. 36 → konkrete Dateien)

- `tests/water.test.ts` — Insel von Meer umgeben, jeder See hat Wasserabdeckung,
  Flüsse verbunden, Wasser nicht über Land, Ozean-Mesh nicht gecullt.
- `tests/expansionAreas.test.ts` (O4) — je Fläche genau eine Region, kein Overlap,
  nicht voll im Wasser, Unlock erreichbar, Startfläche groß genug, Teaser gesperrt.
- `tests/placement.test.ts` (erweitern) — Ghost folgt Raycast, Verschieben, Abbruch
  erhält Ursprung, Rotation, Radien = Simulation.
- `tests/roadPlanning.test.ts` (O6) — Bau erst nach Bestätigung, Vorschaukosten =
  Baukosten, Gebirgssteigung/Viadukt-Vorschlag, Highway ohne Direktzufahrt.
- `tests/traffic.test.ts` (O9) — kein überlappender Spawn, Mindestabstand,
  Kreuzungsreservierung, Parkplatzslots, Ausfahrt, kein Durchfahren.
- `tests/missions.test.ts` (O10) — Routenbewertung deterministisch, Optimierung,
  Bronze/Silber/Gold-Grenzen, Stau beeinflusst Prognose, Command-Pfad.
- `tests/farmFence.test.ts` (O3/§13) — geschlossene Fläche erkannt, offener Zaun
  ohne Bonus, Torzugang, Farm-Cap je Stufe, kein Overlap.
- `tests/ui.layout.test.ts` — keine Überlappung 1280×720/1920×1080, nur ein Sheet,
  Bürgeranliegen ↔ Einstellungen kollisionsfrei.
- `tests/weather.test.ts` (O11) — Zeitlauf/Speed/Pause, Regen-Ende, Nachtlicht,
  Performancegrenzen.
- Bestehende `config.test.ts`/`balancing.test.ts`/`storage.test.ts` erweitern
  (Migrationen v12–v14, neue Balancing-Invarianten).

---

## 8. Dokumentation & ADRs (Auftrag Kap. 5)

Anzulegen/konsolidieren (schrittweise mit den Phasen, final in O13):
`WORLD_ARCHITECTURE.md`, `UI_DESIGN_SYSTEM.md`, `RENDER_PIPELINE.md`,
`ASSET_PIPELINE.md`, `BUILDING_SYSTEM.md`, `REGION_EXPANSION.md`, `ROAD_SYSTEM.md`,
`TRAFFIC_SYSTEM.md`, `WEATHER_SYSTEM.md`, `PERFORMANCE.md`, `CODE_GUIDELINES.md`
(vorhandene `PROJECT_STRATEGY.md`/`ARCHITECTURE.md`/`WORLD_REBUILD.md`/`WORLD_SCALE.md`/
`SAVE_MIGRATION.md`/`PATCHNOTES.md` bleiben aktiv). ADR-001…010 unter `docs/adr/`
(Status/Kontext/Entscheidung/verworfene Alternativen/Konsequenzen/Erweiterbarkeit).

## 9. Repository-Hygiene (Auftrag Kap. 6)

Statuszuordnung (Active/Planned Replacement/Deprecated/Scheduled for Removal/Removed)
für: alte Sektor-Reste (bereits entfernt, Verifikation), WASD-HUD (O10 → optional),
alte Platzierungs-Ghosts/Radien, tote Renderer-Funktionen, historische CSS-Regeln,
ungenutzte Feature-Flags/Icons, temporäre Reports. **Keine Datei blind löschen** —
Referenzen/Importe/Tests/Save-Abhängigkeiten prüfen, Ersatz zuerst, dann
entfernen/archivieren (Muster `archive/legacy-2d/`). Finaler §28-Bericht in O13.
