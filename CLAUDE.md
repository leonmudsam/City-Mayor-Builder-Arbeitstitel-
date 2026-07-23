# CLAUDE.md — Arbeitsregeln (verbindlich)

City Mayor Builder wird als **natives PC-Spiel** (Tauri, Windows zuerst) aus **einer**
Codebasis entwickelt; der Browser ist nur Dev/Test. Vollständige Begründung:
`docs/PROJECT_STRATEGY.md`. Architektur: `docs/ARCHITECTURE.md`.

## Harte Regeln
1. **Simulation ≠ Rendering.** Nichts unter `src/game/**` darf `three`, `pixi.js`,
   `react`, `zustand`, `../renderer`, `../components` oder `../state` importieren. UI
   liest Snapshots über den `GameController` (`version`/`subscribe`) und schickt
   Commands — mutiert nie direkt den State.
2. **Erweitern statt neu bauen.** Neues Gebäude/Mission/Quest/Ressource = Eintrag in
   der passenden `src/game/config/*.ts` (Zod-validiert), kein neues System. Vor einem
   neuen System prüfen, ob ein bestehendes erweitert werden kann.
3. **Saves brechen nie.** Schema-Änderung → `SCHEMA_VERSION` in `src/game/newGame.ts`
   erhöhen **und** eine Migration `n→n+1` in `src/game/storage/migrations.ts`
   ergänzen. Alte Spielstände müssen ladbar bleiben.
4. **Beide Modi müssen laufen.** Browser (`npm run dev`) **und** Desktop
   (`npm run tauri:dev`/`tauri:build`). Keine Annahmen über einen absoluten
   Basis-Pfad; `base: '/'`. Assets nur über die Drop-in-Registry laden.
5. **Drop-in-Assets.** `.glb`/Bild mit korrektem Namen einlegen → automatisch genutzt,
   sonst prozeduraler Fallback (nie crashen). Namen zentral in
   `src/assets/modelManifest.ts`; der Renderer importiert von dort, die Ordner-READMEs
   werden generiert (`tests/modelReadmes.test.ts` hält sie synchron:
   `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`).
6. **Performance by default.** Instancing, LOD, Culling, wenige Draw-Calls, keine
   unnötigen Re-Renders. Nicht „später optimieren".
7. **Gameplay vor Grafik.** Features sollen langfristig motivieren und strategische
   Tiefe schaffen, nicht nur hübsch sein.

## Verifikation vor jedem Commit
`npx tsc -b --force` · `npx eslint src tests` · `npx vitest run` · `npm run build`.
Bei Rendering-Änderungen zusätzlich ein 3D-Screenshot-Smoke (Playwright im
Scratchpad, `vite preview`, Basis-URL `/`). Der **Windows-Tauri-Build läuft nicht in
der Cloud-Umgebung** (kein Rust/Windows) — dort nur den Browser-Pfad verifizieren.

## Konventionen
- Commits, Patch Notes und In-Game-Texte auf **Deutsch**. Patch Notes ausführlich
  (Was/Warum/Architektur/Auswirkung/Zukunft/Dateien/Assets) in `docs/PATCHNOTES.md`.
- Modell-Identifier (`claude-*`) niemals in Commits/Code/PRs.
- Commit-Trailer:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01N5jzudvxboYPYLvPCVhDw9`
- Entwicklungsbranch: `claude/city-builder-concept-w2f70y`.

## Nicht anfassen ohne Grund
`src-tauri/target`, `src-tauri/gen`, `dist/`, `node_modules/`, `scratchpad/`
(gitignored). GitHub Pages ist abgeschaltet — kein Deploy-Workflow wieder einführen.
`archive/legacy-2d/` = archivierte 2D-/Iso-Reste (nicht reaktivieren).

## Status: Ausbaustufe 2.0 abgeschlossen (v0.50–v0.59)
Gebäudesystem 2.0 + Welt 2.0 sind vollständig (A1–A10). **Nur noch der
3D-Renderer** existiert (`src/renderer/three/`); der 2D-/Iso-Pixi-Renderer,
`house_row`/`apartment` und `pixi.js` sind endgültig entfernt (kein Modus-Wähler
wieder einführen). Gebäude-/Regions-/Prompt-Doku ist **generiert & testgeprüft**
(`docs/BUILDINGS.md`, `docs/REGIONS.md`, `models/**/PROMPTS.md` — Regel §5 gilt
weiter). Save-Schema steht bei **v14** (neue Welt; v10–v13 werden einmalig gesichert). Balancing/Progression sind über
20 Level × 40 Regionen abgesichert und durch `config.test.ts`/`balancing.test.ts`
gegen Regressionen gesichert. Bewusst offen (drop-in-fähig, Prompts existieren):
der erweiterte Biom-Prop-Katalog (Wasserfälle/Windmühlen/Boote/Landmarken) —
prozedurale Fallbacks decken den Kern, echte `.glb` einfach einlegen.

## Status: World Rebuild 6.0 — verbindlicher Stand (v0.60–v0.72)
Die visuelle Mockup-Grundlage ist umgesetzt: maritimes Glas-HUD, vertikale linke
Hauptnavigation, Live-Inselkarte, Bürger-Kompakt-/Detailansicht,
KI-Regions-Hero, Ein-Sheet-Regel, organischere Vegetation, Küstenschaum,
Wolken-/Regionsnebel sowie Drop-in-Boote, -Windmühlen und -Leuchttürme. Einstieg:
`docs/agents/README.md`; Designregeln: `docs/agents/UI_SYSTEM.md`; Restphasen:
`docs/OVERHAUL_3_PLAN.md`.

v0.61 ergänzt den großen Bau-Shop, Standort-/Radius-Gebäudedetails, eine
filterbare Anliegen-Inbox, den rein visuellen Info-Layer, Minimap-Panning,
Rollenporträts und hellere Berg-/Küsten-/Nebel-/Biomdarstellung. CSS ist unter
`src/styles/` nach Tokens/Layout/Komponenten/Animation/Responsive getrennt.
Der damalige `CODEX_VISUAL_AUDIT.md` bleibt als historische Grundlage erhalten.

v0.62 ergänzt den vollhohen rechten PC-Baushop ab 1680×860,
Gebäude-Stufenvorschauen, biomabhängige Regions-Heros, ein visuelles
Sonne-/Regen-/Nebel-Fenster samt Live-Renderer-Grading und gedeckelte
Wasserfall-Landmarken. Wetter bleibt reine Darstellung in
`environmentSettings`/`SkyEnvironment` und hat keinerlei Simulations- oder
Save-Wirkung.

v0.63–v0.65 ersetzen den alten Stadtarbeit-Prototyp durch eine echte, manuelle
Straßengraph-Planung innerhalb des bestehenden Aktivitätssystems. Der Spieler
zeichnet die Route selbst, ordnet Ziele, wählt ein datengetriebenes Fahrzeug und
verfolgt anschließend dessen automatische 3D-Fahrt. Die Abschlussansicht bewertet
Zeit, Distanz, Effizienz und Straßenabdeckung. `ActiveActivity.vehicle` und
`plannedRoadPath` sind optional persistiert; Save-Schema ist deshalb **v12** mit
Migration `v11→v12`. Alte v11-Spielstände bleiben gültig und erhalten keine
erfundene Route.

v0.66–v0.68 ergänzen Cargo/Kapazität, reservierte Ladung und reine
Infrastruktur-/Leerfahrtbewertung. Save-Schema ist **v13** mit linearer
Migration `v12→v13`. v0.69 überträgt Redesign 4.0: keine gespeicherte
Standardroute, keine Drag-&-Drop-Zielreihenfolge und kein Werkzeugmodus;
Reihenfolge, Tour, Cargo und Nachfüllen entstehen live aus dem exakten Weg.

v0.70 überträgt die Insel-/Biom-Mockups auf den bestehenden Three-Renderer:
zwölf visuelle Regionsprofile, zwölf Terrain-Splat-Layer, triplanares Gebirge,
differenzierte Vegetation, animierte Flüsse und neutrale Landmark-Fallbacks.
Inselbake, Gameplayregionen und Save v13 bleiben unverändert. Vor Weltarbeit
zuerst `docs/agents/MAP_REDESIGN_AUDIT.md`, danach
`MAP_REDESIGN_PLAN.md` und `WORLD_ASSET_MANIFEST.md` lesen. Region 9/29 sind nur
visuell Wüste/Sumpf; jede Gameplaywirkung ist `TODO(CLAUDE_LOGIC)`.

v0.71 ersetzt den niedrigen Teasernebel gesperrter Regionen durch eine
blickdichte Wolkenwand oberhalb des höchsten Terrainpunkts. Ein gedeckeltes
Wolken-`InstancedMesh`, drei Alpha-Lagen und die vorhandene Unlock-Animation
bleiben Teil desselben Three-Renderer-Pfads. Welt und Minimap zeigen Schloss,
Regionsname beziehungsweise echtes Level aus kanonischer Config. Keine
Simulation und keine Save-Änderung; Schema bleibt v13.

v0.72 ersetzt die frühere 384²-Geometrie durch den Offline-Bake aus
`reference/world/island 3d new.glb`: 512² Terrain, 1025² Höhe, 40 Regionen,
Oststart, Surface-/Wasser-/Infrastrukturmasken und Save v14 mit einmaligem
Backup-/Neustart für v10–v13. Die GLB wird nie zur Laufzeit geladen. Verbindliche
Einstiegsdokumente: `docs/agents/NEW_ISLAND_AUDIT.md` und
`NEW_ISLAND_REBUILD_PLAN.md`.

v0.76/0.77 (Final World Compaction 8.1) verdichten die Insel ein zweites Mal
(13 Regionen, Save v16) und führen Vegetations-Qualitätsstufen + Dev-Performance-
Panel ein (Säule B). Details: `PATCHNOTES.md`, `WORLD_COMPACTION_REPORT.md`,
`WORLD_PERFORMANCE_AUDIT.md`.

v0.78 startet **Active Operations 2.0**: das Sägewerk erzeugt kein passives Holz
mehr, sondern über Arbeiter + Ressourcenknoten (Bäume) + lokales Betriebslager
(Save **v17**, additiv). Nur Gebäude mit `BuildingDef.operation` sind aktive
Betriebe; ihr `produce`-Pfad ist in Tick+Derived abgeschaltet. Reines Sim-Modul
`src/game/operations/**` (kein Renderer/React). Sägewerkholz bleibt bis Phase A5
(Transport) bewusst lokal gebunden — Transport/Steinbruch/Farm/Feuerwehr/
Automatisierung sind Folgephasen und dürfen in der UI nicht vorgetäuscht werden.
Verbindlicher Einstieg vor Betriebsarbeit: `docs/agents/ACTIVE_OPERATIONS_PLAN.md`.
Keine zweite Logistik-Simulation anlegen — Transport (A5) wiederverwendet
`activities/logistics.ts` + `routeAnalysis.ts`.

v0.79 setzt **Phase A5 (Transport)** um: ein manueller Lagertransport bringt
lokal geerntetes Holz über Fahrzeug + Straßenroute ins **Zentrallager** (globaler
Pool über ein Lagergebäude als Anlieferpunkt). Reine Sim
`src/game/operations/transport.ts` mit Zustandsmaschine `loading→in_transit→
unloading→delivered` (nur live), Reservierung im Quell-Lager, gedeckelter
Einlagerung (kein Doppelzählen in `stats.produced`) und Netzwerk-Übersicht
global/lokal/reserviert/unterwegs (§7.2). **Verwendet `routeAnalysis.ts` +
`logistics.ts` wieder — kein zweites System (§8).** Save **v18** additiv
(`operations.transfers`) mit Migration `v17→v18`. Additive gepoolte 3D-Fahrzeuge.
Offen (nicht vortäuschen): Mehrfachladung/Nachfüllfahrten, Rückruf während der
Fahrt, Transport-Betriebskosten, Zwischenlager-Puffer. Details:
`docs/agents/LOGISTICS_INTEGRATION.md`, D-032.

## Status: § Change 9.0 — Central Start / Fog / Living World / Active Work (v0.80+)
Großauftrag in Phasen S1–S8. Verbindliche Vorab-Audits:
`docs/agents/CENTRAL_START_REGION_AUDIT.md`, `FOG_OF_WAR_AUDIT.md`,
`WORLD_RENDERING_PERFORMANCE_AUDIT.md`, `ACTIVE_RESOURCE_WORK_PLAN.md`.
**v0.80 = S1+S2 erledigt:** zentraler Start über die **Bake-Zielvorgabe** (820→
**1.400** bebaubare Kacheln, kein manuelles Rathaus-Verschieben — §3.2) neu
gebacken; Regionsbalancing mit rotierten Forst-Ids (Nordwald→12, Südforst→11,
Ostforst→10) und L3-Erstwahl {7,12}. **Save v19** (Weltumbau, Backup/Neustart
`cmb.save.backup.world-v18`). Entscheidung **D-033**. Offen: **S3** Fog of War
(globale Wolkenfront + Kamera-Clamping, existiert nicht) · **S4** Vegetations-
Performance (Chunking/HLOD/Shader-Wind) · **S5** lebendige Welt (Mammutbäume/
Tiere) · **S6** Sägewerk-Arbeitsmodus (3D-Kreiswerkzeug/Raycast/Overlay, baut auf
A1–A5) · **S7** Steinbruch/Farm · **S8** weitere Betriebe. Reihenfolge zwingend
(§24). Nichts Fehlendes in der UI vortäuschen.

Verbindlicher Einstieg für die Weiterarbeit:
`docs/HANDOFF_CLAUDE.md` → `docs/agents/PROJECT_STATE.md` →
`docs/agents/OPEN_TASKS.md`. Keine zweite Verkehrs- oder Missionssimulation
anlegen. Noch fehlende echte Daten für Steigung, Straßenzustand und dynamische
Ereignisse sind dort ausdrücklich dokumentiert und dürfen in der UI nicht
vorgetäuscht werden.
