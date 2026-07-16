# Projektstrategie — verbindlich (ab v0.35)

Dieses Dokument ist die **verbindliche Grundlage für alle zukünftigen
Implementierungen**. Bei Konflikten zwischen kurzfristiger Bequemlichkeit und diesen
Prinzipien gewinnen die Prinzipien. `CLAUDE.md` (Repo-Root) fasst die harten Regeln
für die tägliche Arbeit zusammen; hier steht das „Warum".

## 1. Ziel: natives PC-Spiel, eine Codebasis
City Mayor Builder wird **nicht** primär als Browser-Spiel entwickelt, sondern als
vollwertiges natives Spiel. Es gibt **eine** Codebasis, **eine** Spielsimulation —
keine getrennten Projekte, keine parallelen Simulationen.

**Zielplattformen (Reihenfolge):**
1. Windows (Priorität)
2. später Steam
3. später macOS/Linux (optional)
4. danach Android
5. danach iOS

Der Browser bleibt **nur** Entwicklungs-/Test-Umgebung (schnelles `npm run dev`,
Hot Reload). **GitHub Pages ist kein Zielplattform mehr.** GitHub dient nur noch
Versionsverwaltung, Backup und Zusammenarbeit.

## 2. Zwei Laufmodi (beide müssen immer funktionieren)
- **Dev/Browser:** `npm run dev` → `http://localhost:5173`.
- **Desktop:** `npm run tauri:dev` / `npm run tauri:build` (Tauri 2).

Jedes neue Feature muss in **beiden** Modi laufen. Tauri 2 wurde gewählt, weil es
Desktop **und** Mobile aus demselben Projekt bedient — die spätere Mobile-Version
nutzt dieselbe Simulation, nur UI/Kamera/Touch werden angepasst.

## 3. Architektur: Simulation ≠ Darstellung (harte Grenze)
Die Spiellogik ist ein reines TypeScript-Modul ohne Rendering-/React-Bezug. Sie darf
**niemals** mit der Darstellung vermischt werden.

- **Simulation** (`src/game/`): Gebäude, Bürger, Wirtschaft, Verkehr, Missionen,
  Speicherstände. Kein Import von `three`/`pixi`/`react`/`zustand`/Renderer/UI.
- **Rendering** (`src/renderer/`, `src/components/`): UI, 3D, Kamera, Animationen,
  Effekte — liest nur Snapshots, schickt nur Commands.

Damit läuft dieselbe Simulation später unverändert auf PC und Handy. Details:
`docs/ARCHITECTURE.md`.

## 4. Asset-System: Drop-in bleibt Kernprinzip
Bild oder `.glb` mit korrektem Dateinamen einlegen → Spiel erkennt es automatisch →
kein Code ändern. Fehlt ein Asset, greift ein prozeduraler Fallback (das Spiel bricht
nie). Dieses Prinzip wird konsequent beibehalten und erweitert. Namen/Pfade:
`docs/3D_MODEL_MANIFEST.md`, `src/assets/modelManifest.ts` und die
`README.md` je Modellordner.

## 5. 3D-Welt: lebendig, nicht steril
Die 3D-Welt ist der wichtigste visuelle Bestandteil. Ziel: echtes Gelände,
organische Natur, große Landmarken, glaubwürdige Gebirge, Flüsse, Seen, Küsten,
Wälder, Täler, Stadtviertel — **keine** flache Testplatte, keine sichtbaren Kacheln,
keine sterile Landschaft. Die Karte soll sich wie eine echte Welt anfühlen.

## 6. Gameplay vor Grafik
Grafik ist wichtig, Gameplay ist wichtiger. Jede neue Funktion soll sinnvoll sein,
langfristig motivieren, aktives Spielen fördern, strategische Entscheidungen
erzeugen und spätere Erweiterungen ermöglichen. Kurzfristige Lösungen vermeiden.
Inspiration: SimCity, Cities: Skylines, Anno, RollerCoaster Tycoon, Civilization
(Progression), Clash of Clans (Langzeitmotivation).

## 7. Skalierbarkeit & Modularität
Neue Systeme werden skalierbar und modular gebaut — möglichst keine späteren
Komplettumbauten. **Bestehende, datengetriebene Systeme erweitern statt neue
schreiben.** Beispiel: neues Gebäude = Eintrag in `buildings.config.ts`, kein neues
Gebäudesystem. Gleiches gilt für Ressourcen, Missionen, Fahrzeuge, NPCs, Verkehr,
Energie, Politik, Katastrophen.

## 8. Performance von Anfang an
Wenige Draw-Calls, Instancing, LOD, Culling, Chunk-Denken, effiziente Updates, keine
unnötigen Re-Renders. Nicht „später optimieren", sondern von Beginn an sinnvoll
bauen.

## 9. Codequalität
Sauber strukturiert, dokumentiert, modular, leicht erweiterbar, verständlich.
Bevorzugt bestehende Funktionen erweitern; keine doppelten Systeme.

## 10. Dokumentation & Patch Notes
Bei größeren Änderungen: neue Ordner, Asset-Pfade, Modellnamen und Registry-Einträge
dokumentieren; alle Docs aktuell halten. Nach jeder größeren Änderung **ausführliche**
Patch Notes: Was wurde geändert? Warum? Welche Architektur wurde gewählt? Welche
Auswirkungen? Welche zukünftigen Erweiterungen werden dadurch einfacher? Welche
Dateien wurden angepasst? Welche neuen Assets/Ordner werden benötigt?

## 11. Vor neuen großen Systemen
1. Prüfen, ob bereits ein passendes System existiert.
2. Bestehendes System möglichst erweitern.
3. Neue Systeme nur, wenn architektonisch sinnvoll.
4. Immer langfristig denken.
