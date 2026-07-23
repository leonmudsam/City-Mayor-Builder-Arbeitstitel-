# AGENTS.md — Arbeitsregeln (verbindlich)

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
- Modell-Identifier (`Codex-*`) niemals in Commits/Code/PRs.
- Commit-Trailer:
  `Co-Authored-By: Codex Opus 4.8 <noreply@anthropic.com>`
  `Codex-Session: https://Codex.ai/code/session_01N5jzudvxboYPYLvPCVhDw9`
- Entwicklungsbranch: `Codex/city-builder-concept-w2f70y`.

## Nicht anfassen ohne Grund
`src-tauri/target`, `src-tauri/gen`, `dist/`, `node_modules/`, `scratchpad/`
(gitignored). GitHub Pages ist abgeschaltet — kein Deploy-Workflow wieder einführen.
`archive/legacy-2d/` = archivierte 2D-/Iso-Reste (nicht reaktivieren).

## Status: Ausbaustufe 2.0 abgeschlossen, World Rebuild 6.0 aktiv (v0.50–v0.72)
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

v0.60–v0.62 übertragen die verbindlichen Haupt-HUD-Mockups auf die bestehende Architektur:
maritimes HUD, linke Hauptnavigation, Live-Minimap, große Bau-/Gebäude-/
Anliegen-/Regionsfenster, Stadtarbeit-Routenplaner, visueller Info-Layer,
Rollenporträts, rechten Premium-PC-Baushop, Gebäude-Stufenvorschau, rein
visuelle Sonne-/Regen-/Nebel-Presets sowie Berg-/Küsten-/Nebel-/Biompolish.

v0.63–v0.69 ergänzen echte Straßenanalyse, Logistik und die verbindliche
Stadtarbeit: manuell gezeichnete und validierte 2D-Routen, aus dem Weg
abgeleitete Reihenfolge, Cargo/Kapazität/Nachfüllen/Leerfahrt,
datengetriebene Fahrzeugwahl, automatische 3D-Fahrt, Verfolger-/freie Kamera
und Ergebniswertung. Persistierte Route und Ladungsreserve liegen im bestehenden
`ActiveActivity`; deshalb gilt Save-Schema **v13** mit Migrationen
`v11→v12→v13`. Keine zweite
Verkehrssimulation oder Mission-State-Machine einführen. Offene, nicht
vorgetäuschte Daten sind in `docs/agents/OPEN_TASKS.md` dokumentiert
(insbesondere echte Steigung, Straßenzustand und dynamische Ereignisse).
Redesign 4.0 entfernt gespeicherte Standardrouten, Drag-&-Drop-Ziellisten und
getrennte Kartenwerkzeuge. Vor Weiterarbeit zuerst `docs/HANDOFF_CLAUDE.md` und
`docs/agents/PROJECT_STATE.md` lesen; der v0.62-Visual-Audit bleibt historische
Grundlage.

v0.70 erweitert ausschließlich den bestehenden Three-Renderer um zwölf visuelle
Regionsprofile, zwölf Terrain-Splat-Layer, triplanares Gebirge, differenzierte
Vegetation, animierte Flüsse und neutrale Landmark-Fallbacks. Inselbake,
Gameplayregionen und Save v13 bleiben unverändert. Vor Weltarbeit zuerst
`docs/agents/MAP_REDESIGN_AUDIT.md` lesen; Wüste/Sumpf sind visuell und jede
Gameplaywirkung bleibt `TODO(CLAUDE_LOGIC)`.

v0.71 ersetzt den niedrigen Regions-Teasernebel im bestehenden Renderer durch
eine blickdichte Wolkenwand oberhalb aller Geländeobjekte. Weltmarker zeigen
Schloss, lokalisierten Regionsnamen und echtes Freischaltlevel; die Minimap
verdeckt dieselben gesperrten IDs und zeigt Schloss/Level an. Die Unlock-Animation
bleibt erhalten. Rein visuell, keine Config-/Save-Änderung; Schema bleibt v13.

v0.72 ersetzt die alte Geometrie vollständig durch den Offline-Bake aus
`reference/world/island 3d new.glb`: 512² Terrain, 1025² Höhe, 40 organische
Regionen, Oststart, Bau-/Wasser-/Infrastrukturmasken und gemeinsame UI-Karten.
Die Source-GLB wird nie zur Laufzeit geladen; die alte Source hat keinen aktiven
Verbraucher und bleibt bis zur Git-Sicherung erhalten. Save v14 verwendet für
v10–v13 einen einmaligen Backup-/Neustartpfad. Vor Weltarbeit zuerst
`docs/agents/NEW_ISLAND_AUDIT.md` und `NEW_ISLAND_REBUILD_PLAN.md` lesen.
