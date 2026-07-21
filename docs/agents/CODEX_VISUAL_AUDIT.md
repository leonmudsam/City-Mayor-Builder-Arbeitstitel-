# Codex Visual Audit — v0.62, ergänzt um Stadtarbeit v0.69

Stand: 19. Juli 2026  
Referenzen: die zwei neuen Premium-Mockups (Haupt-HUD/Gebäude/Region/Wetter
sowie rechter Bau-Shop/Gebäude-Upgrades/Statistik), das vorherige Gesamt-Mockup
und das Master-Mockup der Inselhauptansicht.

## Ergänzung 21. Juli 2026 — Stadtarbeit Redesign 4.0

Das neue Stadtarbeit-Mockup ersetzt für diesen Vollbildscreen die historische
v0.62/v0.65-Planungsdarstellung. Erledigt sind: dominante stilisierte Karte,
gemeinsame Maussteuerung ohne Werkzeugmodus, Fit/Zoom, keine „Letzte Route“,
Reihenfolge aus dem Weg, Live-Tour/Cargo/Nachfüllen, kompakte Fahrzeugwahl,
visuelle Missionen, Kennzahlkarten und Portrait-Berater. Verbindliche Details:
`docs/HANDOFF_CLAUDE.md`, `docs/agents/PROJECT_STATE.md` und Patch Notes v0.69.

Die damaligen Aussagen „UI-Schätzung“, „Drag-&-Drop“ und Save v11/v12 in den
historischen Abschnitten unten sind durch die kanonischen v0.63–v0.69-
Read-Modelle sowie Save v13 überholt. Sie bleiben nur als Audit-Historie stehen.

## 0. v0.62 — Fidelity-Nachschärfung

| Neue Referenzforderung | Umsetzung |
| --- | --- |
| Bau-Shop rechts als großer PC-Arbeitsbereich | ab 1680×860 vollhohes rechtes Dock, 4-Spalten-Katalog, 8 Empfehlungen inklusive Vorschau auf kommende Unlocks, große Detailzone |
| Gebäudevorschau mit sichtbaren Ausbaustufen | `BuildingArt(stage)` nutzt vorhandene `_stageN.glb`; Bau-Shop und Gebäude-Sheet besitzen Stufenstreifen, aktueller Stand und Level-Gates bleiben klar |
| Wetter & Zeit als bildstarkes Fenster | neues Atmosphären-Sheet mit KI-Panorama, Sonnen-/Regen-/Nebel-Presets, Tageszeit-Presets, Slider und visuellem Tageslauf |
| Wetter soll in der Welt sichtbar sein | `SkyEnvironment` verändert nur Darstellung: Licht, Himmel, Wolken, Fernsicht, Wasserfarbe und ein Regenvorhang mit einem Draw-Call |
| Unterschiedliche Regionsvorschauen | Biomgruppen wählen Hochland-, Fruchtland- oder Küsten-Hero; allgemeiner Hero bleibt Fallback |
| Fünf stabile Stadtstatuszeilen | noch gesperrte Bedarfe erscheinen ehrlich als Level-Vorschau statt zu verschwinden oder Werte vorzutäuschen |
| markanteres Weltmotiv | bis zu vier deterministische Wasserfälle an wassernahem Gebirge; optionales GLB, prozeduraler Fallback |

Wetter ist ausdrücklich **keine** neue Spielzeit- oder Wettersimulation. Die
Auswahl liegt im lokalen `environmentSettings`-Store und beeinflusst keine
Wirtschaft, Bedarfe, Quests, Belohnungen oder Saves. Das Save-Schema bleibt v11.

## 1. Ergebnis

Die vorhandene v0.60-Architektur wurde erweitert, nicht ersetzt. Das Spiel
besitzt weiterhin genau eine Simulation, einen GameController und einen
Three.js-Renderer. v0.61 schließt die wichtigsten visuellen Abweichungen:

| Referenzbereich | Vor v0.61 | Stand v0.61 |
| --- | --- | --- |
| Bau-Shop | kompakter Katalog, geringe Vorschauhierarchie | „Empfohlen“, Config-Badges, große Fokusvorschau |
| Gebäude-Detail | schmal, wenig Standortkontext | Hero, Stufe, echte Stats, Region/Gelände/Straße/Grundfläche, Radius |
| Anliegen | kleine Karten plus einzelnes Detail | max. drei Karten, Filter-Inbox, Archiv und Detail |
| Stadtstatus | funktional, geringe Leitwerthierarchie | kanonische Zufriedenheit, Live-Hinweis, Diagnose-/Bedarfsblöcke |
| Kartenhinweise | permanente gemischte Marker | sechs Filter, Priorität, Culling, Clustering |
| Minimap | Klickfokus | Klick-/Ziehfokus, Relief, Regionsstatus und Modifikatoren |
| Regionen | allgemeiner Hero | eigener Hochland-Hero, ehrlicher Vorschau-Skeleton |
| Berge/Küste/Nebel | dunkle Gipfel, eine Küstenlinie, statische Schichten | alpine Staffelung, Flachwasser plus Schaum, vier driftende Schichten |
| Biomdetails | Bäume/Büsche/Felsen/Schilf | zusätzlich Blumen, Feldspuren und Totholz als Instancing |

## 2. Verbindliche Datenquellen

- Ressourcen, Bevölkerung, Zufriedenheit: Controller-Snapshot/Derivationen.
- Stadtprobleme: `getCityDiagnostics()`/bestehende Marker.
- Gebäude: validierte Building-Config, Instanz-Snapshot, `effectiveEffects`,
  `locationBonusPct`, `regionIdAt`, `terrainAt`/Weltterrain.
- Anliegen: aktive/abgeschlossene Quests und `claimable`.
- Regionen: Regions-Config und Weltstatus.
- Kartenkamera: kleine `MapApi`-Brücke.

Kein React-Element mutiert GameState direkt.

## 3. Bewusst nicht vorgetäuscht

1. Anliegen besitzen noch keine kanonische Kartenposition. Der Button
   „Auf Karte zeigen“ bleibt deaktiviert.
2. Regionen besitzen noch keine kanonische Liste späterer Gebäude. Das Fenster
   zeigt drei Skeletons und ein `TODO(CLAUDE_LOGIC)`.
3. Der Gebäuderadius zeigt nur einen vorhandenen Config-Wert; er erzeugt keine
   neue Coverage-Regel.
4. „Empfohlen“ sortiert vorhandene Gebäude lokal und verändert weder Unlocks
   noch Kosten.
5. Tagesgeschwindigkeit bleibt visuell.
6. Vorhandene Routenwerte bleiben die in v0.60 dokumentierte UI-Schätzung.

## 4. UI-Zonen

- Top: Level/Wappen, Ressourcen, Einwohner, Zufriedenheit, Saison/Zeit,
  Pause/1×/2×/4×, Einstellungen/Menü.
- Links: Hauptnavigation und Stadtstatus.
- Links unten: Inselkarte.
- Rechts: höchstens drei Anliegenkarten.
- Unten mittig: Info-Layer.
- Kontext: genau ein großes Sheet/Dialog/Gebäudefenster.

## 5. Designsystem

Importreihenfolge in `src/main.tsx`:

1. `styles.css` — kompatible Legacy-Basis.
2. `styles/tokens.css` — Farben, Radien, Schatten, Abstände.
3. `styles/layout.css` — feste Desktop-Zonen.
4. `styles/components.css` — Komponentenoptik.
5. `styles/animations.css` — kurze Übergänge und Reduced Motion.
6. `styles/responsive.css` — Breakpoints und 12-px-Lesbarkeitsgrenze.

Kein zweites Theme und kein Tailwind-/CSS-in-JS-System wurde eingeführt.

## 6. Info-Layer-Vertrag

`InfoLayerMode = off | problems | needs | upgrades | production | all`.

Fluss:

`InfoLayerControl` → Zustand-Store → `MapApi.setInfoLayer()` →
`IMapRenderer.setInfoLayer()` → `ThreeMapRenderer.rebuildMarkers()`.

Aktivitäts-/Baumarker bleiben essenziell sichtbar. Andere Marker folgen Filter,
Priorität, Entfernung und Übersicht-Cluster. Fehlende Marker-GLBs fallen auf
Canvas-Sprechblasen zurück.

## 7. Asset-Fallback-Kette

- Gebäude-Art: GLB-Thumbnail → Gebäude-Bild → SVG.
- Porträt: `role_N` → `role` → `citizen_N` → SVG.
- Regions-Hero Hochland: `region_unlock_highland` → allgemeiner
  `region_unlock_hero` → CSS-Fallback.
- Weltprops: GLB aus Manifest → prozedurales Instancing/Mesh.
- UI-Kontextbilder: `uiImage(id)` → vorhandene Icon-/CSS-Darstellung.

## 8. Neue Assetstruktur

Porträts:

- `portraits/citizens`
- `portraits/merchants`
- `portraits/workers`
- `portraits/advisors`
- `portraits/government`
- `portraits/emergency`

UI-Kontext:

- `ui/requests`
- `ui/regions`
- `ui/buildings`
- `ui/missions`
- `ui/weather`
- `ui/status`
- `ui/navigation`

Jeder Ordner enthält ein README. Leere Kategorien sind bewusst vorbereitete
Drop-in-Slots und kein neues Laufzeitsystem.

## 9. Weltbudgets

- Blumen: maximal 180 Instanzen / ein Draw-Call.
- Feldspuren: maximal 220 Instanzen / ein Draw-Call.
- Totholz: maximal 90 Instanzen / ein Draw-Call.
- Vorhandene Bäume, Büsche, Felsen und Schilf behalten ihre Caps.
- Küsten-Flachwasser und Schaum sind je ein gebatchtes Mesh.
- Regionsnebel nutzt vier Flächen je gesperrter Region und feste Silhouetten.
- Marker werden in der Übersicht pro 26×26-Zone geclustert.
- Renderer-DPR: max. 1,5; bei >2 Mio. Viewport-Pixeln max. 1,25.

## 10. Responsive-Abnahme

Verbindliche Zielgrößen: 1280×720, 1366×768, 1920×1080 und 2560×1440.

Für v0.62 wurde die Live-Ansicht zusätzlich mit echter 1920×1080-Innenfläche
per DOM-Geometrie geprüft:

- Hauptbereich: 1920×1010 unter einem 70 px hohen Top-HUD.
- Wetter-Sheet: 650×990 bei x=1260/y=80; Hero 622×252; kein Dokument-Scroll.
- Rechter Bau-Shop: 820×990 bei x=1090/y=80.
- Bau-Shop-Inhalt: 796×861; Katalog 4 Spalten; Vorschau 796×270.
- Stadtstatus: 276×398; genau fünf Leitzeilen, gesperrte Bedarfe mit Level-Gate.
- Rechtes Bürgeranliegen-Dock wird während des Bau-Shop-/Wetter-Sheets korrekt
  ausgeblendet.
- Wetter-Interaktion: „Sommerregen“ aktualisiert Sheet und HUD auf „Regen“;
  keine Boot-Fehler.

Der ältere v0.61-Smoke mit 1280×720 bleibt zusätzlich gültig:

- Dokument: 1280×720, keine horizontale/vertikale Dokument-Scrollfläche.
- Hauptpanels: kein Element außerhalb des Viewports.
- Stadtstatus: 258×191 bei x=91/y=80.
- Inselkarte: 228×253 bei x=10/y=457.
- Anliegen kompakt: 278×240 bei x=992/y=80.
- Info-Layer: 540×52 bei x=370/y=658.
- Bau-Shop: 899×346 bei x=90/y=364, keine Außenüberläufe.
- Anliegen-Inbox: 560×610 bei x=700/y=90.
- Stadtstatus-Detail: 560×630 bei x=710/y=80.
- Browser-Konsole: keine Fehler/Warnungen.

Die Screenshot-Schnittstelle lief selbst bei einer leeren Browserseite in ein
Zeitlimit. Deshalb existiert auch für v0.62 keine behauptete Vier-Bild-Freigabe.
Die CSS-Breakpoints für alle vier Größen sind implementiert; ein späterer Agent
soll die vier Screenshots nachholen, sobald die Aufnahme-Infrastruktur reagiert.

## 11. Prüfkommandos

Vor Übergabe ausführen:

```text
npx tsc -b --force
npx eslint src tests
WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts
npx vitest run
npm run build
npm run tauri:build
```

Die finalen Ergebnisse stehen im jüngsten Eintrag von `HANDOFF_LOG.md`.

Der finale Prüfstand wird im jüngsten Eintrag von `HANDOFF_LOG.md` geführt.

## 12. Sichere Weiterarbeit für Claude

1. Keine zweite UI-/Renderer-Architektur beginnen.
2. Für Anliegen-Kartenfokus zuerst eine reine Controller-Projektion und Tests
   ergänzen; kein UI-Raten nach Senderrolle.
3. Für Regionsgebäude zuerst Progressions-/Config-Daten und Tests ergänzen.
4. Bei persistierten Feldern Schema v12 plus Migration v11→v12.
5. Modellnamen nur über `modelManifest.ts`, danach generierte READMEs erneuern.
6. Die v0.62-Tokens, Breakpoints und Sheet-Regel wiederverwenden.
