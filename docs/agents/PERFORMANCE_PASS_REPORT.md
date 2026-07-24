# Performance-Pass — Report (P-E)

> Teil des Spielbarkeits-Auftrags (§15). Enthält: die dauerhafte FPS-Anzeige, den
> Ist-Zustand der bereits vorhandenen Optimierungen, eine Hotspot-Analyse aus dem
> Code-Review und das Mess-Protokoll. **Ehrlichkeitshinweis:** Live-FPS-Zahlen werden
> **im Spiel** mit der neuen Anzeige erfasst — ein Browser-Profiler läuft in der
> Cloud-/CI-Umgebung nicht (nur der Browser-Build wird dort verifiziert, CLAUDE.md).
> Deshalb stehen unten **keine erfundenen** Vorher/Nachher-Zahlen.

## 1. Dauerhafte FPS-Anzeige (§15.1/15.2) — erledigt (v0.90)

- `src/services/fpsMeter.ts`: **ein** `requestAnimationFrame`-Zähler misst die reale
  Bildrate und veröffentlicht **nur ~alle 500 ms** einen Snapshot. Die React-Anzeige
  (`FpsIndicator`, neben der Uhr) liest ihn über `useSyncExternalStore` — **kein
  React-Update pro Frame**. Farbe: grün ≥55, gold 35–54, rot <35; Tooltip: FPS +
  Frame-Zeit. Der Renderer bleibt unberührt.

## 2. Bereits vorhandene Optimierungen (Ist-Zustand)

| Bereich | Zustand | Fundstelle |
|---|---|---|
| Vegetation/Props | Instancing, LOD, Culling, Qualitätsstufen + Dev-Panel | `ThreeMapRenderer`, `WORLD_PERFORMANCE_AUDIT.md` (v0.77) |
| **Infrastruktur-/Straßengraph** | **event-getrieben**, NICHT pro Frame: `derived` (inkl. `roadNetwork`) wird nur bei Bau/Abriss/Upgrade (`afterStructuralChange`) oder im Tick neu berechnet — React liest eine stabile Referenz (§15.5 erfüllt) | `controller.ts` `afterStructuralChange`, `derived.ts`, `world.ts` `computeRoadNetwork` |
| Wasser-Navigationsgraph | einmal beim Modul-Load gebaut (`graph`/`adjacency`/`nodeById`), danach nur gelesen | `waterNavigation.ts` |
| Stadtarbeit-Ziele | **P-A** fror den Planungssnapshot ein → **keine** wiederholte Ziel-/RNG-Generierung mehr pro Tick/Render | `ACTIVITY_STABILITY_AUDIT.md` |
| Zeit/Uhr | reine Projektion, kein `setInterval` in React; HUD re-rendert mit dem 1-Sekunden-Tick | `gameTime.ts`, P-B1 |
| React-Store | `useSyncExternalStore` auf `controller.version` — nur bei echten Änderungen | `state/store.ts` |

## 3. Hotspot-Analyse aus dem Code-Review (§15.4)

| Kandidat | Bewertung | Status |
|---|---|---|
| Wiederholte Activity-Generierung | durch P-A beseitigt (eingefrorener Snapshot) | ✅ erledigt |
| Häufige Netzwerkgraph-Neuberechnung | `derived` ist event-getrieben, nicht pro Render | ✅ bereits ok |
| 2D-Stadtarbeitskarte-Rebuild | nur wenn der Planer offen ist; Marker/Route aus stabilem Snapshot | 🟢 unkritisch, beobachten |
| Marker-Rebuilds | keine wachsende Markerzahl (P-A-Tests belegen Stabilität beim Öffnen/Schließen) | ✅ ok |
| `buildResourceNetworkView` im Ressourcen-Popover | iteriert Gebäude, aber nur solange das Popover offen ist | 🟢 unkritisch |
| Vegetations-Chunks / Schatten / Nebel / GLB-Klone | Instancing/LOD/Culling + Qualitätsstufen vorhanden | 🟢 vorhanden, per FPS-Anzeige messen |
| Straßen-Preview-Geometrie / Wasserlinien | nur im Bau-/Planungsmodus aktiv | 🟢 unkritisch |
| Große Listen ohne Memoisierung | HUD-Listen sind klein; Planer-Reads teils pro `version` neu memoisiert | 🟡 offen (Feinschliff) |

## 4. Mess-Protokoll (mit der FPS-Anzeige im Spiel auszuführen, §15.3)

Für jede Szene FPS (und via Tooltip die Frame-Zeit) ablesen und eintragen:

| Szene | FPS | Frame-Zeit | Notiz |
|---|---:|---:|---|
| Normale Stadtansicht | | | |
| Volle freigeschaltete Welt | | | |
| Dichter Wald | | | |
| Sichtbarer Nebel (gesperrte Regionen) | | | |
| Stadtarbeit-2D-Karte offen | | | |
| Viele Brücken/Anleger | | | |
| Sehr viele Gebäude | | | |

Fällt eine Szene dauerhaft unter ~35 FPS (rot), ist sie der nächste Optimierungs-
schwerpunkt (dann gezielt: Instancing-Batches, LOD-Schwellen, Schatten-Auflösung,
Chunk-Größen). Die Vegetations-Qualitätsstufe im Dev-Panel hilft beim Eingrenzen.

## 5. Offen (nicht vorgetäuscht)

- Live-Profiling-Zahlen aus dem Spiel (Tabelle oben) + daraus abgeleitete gezielte
  Optimierungen.
- Feinschliff einzelner Planer-Reads (Memoisierung stabiler Zielketten statt Neuberechnung
  je `version`).
- Optional: FPS-Tooltip um Draw-Calls/sichtbare Instanzen erweitern (Renderer müsste
  diese Zähler gedrosselt veröffentlichen).
