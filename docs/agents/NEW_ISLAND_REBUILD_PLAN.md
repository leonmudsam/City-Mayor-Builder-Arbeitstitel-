# New Island Rebuild — Plan und Status 6.1

| Phase | Ergebnis | Status |
|---|---|---|
| T1 Audit | Renderpfad, Materialursachen, Wiederholungen und Props dokumentiert | erledigt |
| T2 Gebirge | facettierter Triplanar-Mix, Schichten, Geröll, Moos, Schnee und Nah-Normalen | erledigt |
| T3 Gras | painterly Wiesenbasis, Makrovariation und instanziertes Nahgras | erledigt |
| T4 Wald | dunkler Waldboden, Cluster, Baumgrößen, Unterholz und Totholz | erledigt |
| T5 Regionen | datengetriebene Plateau-, Steppe-, Fruchttal-, Moor-, Wüsten- und Sumpfprofile | erledigt |
| T6 Maßstab | X/Z 0,8898, Y separat auf knapp 50 Einheiten, Baufläche −20,0 % | erledigt |
| W1–W5 Wasser | Wasserlinie angehoben, vier Ufertypen, Flachwasser, Bauaprons und Brückenkorridore | erledigt |
| T7 Materialien | 2048er Gebirgs-, Gras-, Wald-, Küsten- und Regionalbibliothek samt ausgewählten PBR-Maps | erledigt |
| T8 Start/Kamera | zentraler Bake-Score, Region 24, zwei Straßenachsen, Küstenankunft und echte Übersichtmitte | erledigt |
| T9 Ableitungen | Höhenfeld, Raster, Regionen, Surface, Infrastruktur, Minimap und Stadtarbeitkarte neu gebacken | erledigt |
| T10 Verifikation | TypeScript, ESLint, 262 Tests und Produktionsbuild | erledigt; Runtime-Screenshot blockiert |

## Verbindliche Architektur

1. Es gibt weiterhin genau eine Insel-, Bake-, Surface- und Renderer-Pipeline.
2. `src/game/**` liest nur synchrone, deterministische Bake-Daten. Three.js,
   Materialien und Vegetation bleiben vollständig unter `src/renderer/**`.
3. Die GLB mit rund 1,85 Millionen Dreiecken wird nur von
   `tools/bakeWorld.mjs` gelesen und nie zur Laufzeit ausgeliefert.
4. Infrastrukturdateien sind geografische Hooks. Brücken-, Tunnel-, Hafen- und
   Ankunftsgameplay bleibt `TODO(CLAUDE_LOGIC)` und erweitert später bestehende
   Command-, Straßen- und Aktivitätssysteme.
5. Wüsten-/Sumpf-/Moorprofile sind visuell vorbereitet. Fehlende
   Gameplaywirkungen sind ausdrücklich `TODO(CLAUDE_LOGIC)`.
6. Save v15 verwirft inkompatible Weltkoordinaten kontrolliert und sichert den
   v14-Spielstand einmalig, statt Gebäude in die neue Geografie zu projizieren.

## Abnahmemesswerte

- 512² logische Welt, 1025² Höhenfeld, 64 cullbare Terrain-Chunks.
- Quellspannweite 420 statt 472 Kacheln: X/Z-Faktor 0,8898,
  Flächenfaktor 0,7918.
- 44.757 statt 55.941 bebaubare Kacheln: exakt −20,0 %.
- 40 organische Regionen; Herzland (24) startet mit 1.290 bebaubaren Kacheln,
  zusammen mit frühen Nachbarn 4.418.
- Rathaus `(125,193)`, Gründungsmittelpunkt `(127,195)`, zwei verlängerbare
  Straßenachsen mit 16 Kacheln.
- Küstenankunft `(222,206)`, 115 Kacheln vorbereitete Versorgungstrasse und
  echter zukünftiger Hafenanker.
- Wasserlinie normalisiert `0,004 → 0,0065`, sichtbare Wasserfläche `−0,04`;
  569 direkt bebaubare Uferkacheln und 16 garantierte 5×5-Uferplattformen.
- 2 Brücken-, 24 Viadukt-, 24 Tunnel-, 16 Hafen- und 585
  Wasserwegkandidaten.
- Terrainbibliothek: 29 neue dokumentierte Farbtexturen plus ausgewählte
  Normal-, Roughness- und AO-Maps; fehlende Drop-ins fallen sicher auf die
  Vertexpalette zurück.

## Verifikation und verbleibende Grenzen

`npx tsc -b --force`, `npx eslint src tests`, `npx vitest run` und
`npm run build` sind erfolgreich. Die Bake-Vorschau wurde visuell geprüft.

Der integrierten Browsersteuerung stand keine Browserinstanz zur Verfügung;
deshalb konnte der geforderte echte WebGL-Vorher-/Nachher-Screenshot in dieser
Sitzung nicht aufgenommen werden. Der native Tauri-Build benötigt lokal
`cargo`/`rustc`, die in dieser Umgebung nicht installiert sind. Beides ist ein
Verifikationslimit, kein zweiter oder vorgetäuschter Rendererpfad.
