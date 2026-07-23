# Welt-Performance-Audit — § Final World Compaction 8.1, Säule B

**Stand:** v0.76 · Renderer: `src/renderer/three/ThreeMapRenderer.ts`. Reine
Render-/Domain-Schichten: `graphicsQuality.ts`, `graphicsSettings.ts`,
`perfStats.ts`, `vegetationBudget.ts`.

> **Kernregel des Auftrags:** Die logische und visuelle Vegetationsdichte bleibt
> hoch — nur ihre TECHNISCHE Repräsentation wird mit zunehmender Entfernung
> vereinfacht. Keine Optimierung allein aus subjektivem Eindruck; jede Änderung
> an Budgets wird über das Dev-Performance-Panel messbar gemacht.

## 1. Ausgangslage (was bereits gut war)

Der Bestandsrenderer war **kein** Per-Baum-Scene-Graph. Vor dieser Runde galt
bereits:

- **Instancing/Batching**: Jeder Proptyp ist genau ein `InstancedMesh` — konstante
  Draw-Calls unabhängig von der Instanzzahl (elf Vegetationsgruppen).
- **Deterministische Pro-Region-Budgets** (`selectPropTiles`, `REGION_PROP_BUDGET`):
  Ein Region-Unlock erhöht nur die Gesamtzahl, verschiebt aber nie die Auswahl
  bereits sichtbarer Regionen (Positions-Hash statt Arrayindex).
- **Selektive Schatten**: Kleine Props (Grashalme, Schilf, Blumen, Feldreihen)
  warfen schon nie Schatten; nur Groß-Props (Bäume, Felsen) taten es.
- **Nahdetail-Toggle**: Grashalme wurden nur unterhalb einer Kamera-Distanz gezeigt.
- **Frustum-Culling**: three cullt jedes `InstancedMesh` per Default gegen das
  Kamera-Frustum.

Die größten Hebel (kein Scene-Graph pro Baum, konstante Draw-Calls) waren also
schon gesetzt. Der Auftrag verlangt darauf aufbauend feinere, **einstellbare**
Steuerung.

## 2. In dieser Runde umgesetzt

Reine, getestete Schicht + Renderer-Anbindung:

- **Vier Grafik-Qualitätsstufen** (`graphicsQuality.ts`): Niedrig / Mittel / Hoch /
  Ultra, jede mit KONKRETEN Zahlen für Dichte, Sichtweiten, LOD-Grenzen,
  Schattenbudget, Kleinprop-Cull-Distanz, Tierbudget und Pixel-Ratio-Deckel.
  Persistiert außerhalb des Saves (`graphicsSettings.ts`, `cmb.graphics`).
- **Dichte-Skalierung**: `scaledBudget` skaliert die Pro-Region-Budgets mit der
  Stufe (echte Instanzreduktion; „Niedrig" nie unter 0,5 → Kernvegetation bleibt).
- **Striktes Schattenbudget**: Vegetationsschatten sind auf „Niedrig" ganz aus und
  sonst auf `shadowInstanceBudget` schattenwerfende Groß-Prop-Instanzen gedeckelt.
  Ist das Budget aufgebraucht, werfen weitere Gruppen keine Schatten mehr.
- **Distanzabhängiges Nahdetail** aus dem Profil statt fester Distanz.
- **Pixel-Ratio-Deckel** aus dem Profil zusätzlich zur adaptiven 4K-Grenze.
- **Tierbudget** aus dem Profil (unter der harten Draw-Call-Grenze `ANIMAL_CAP`).
- **Kein voller Weltneuaufbau bei Qualitätswechsel**: nur die Vegetationsgruppe
  wird neu gebaut (Abo auf den Grafik-Store).
- **Vier LOD-Stufen als reine Funktion** (`vegetationLodTier`): 0 volle Geometrie,
  1 reduziert, 2 Impostor, 3 gecullt — deterministisch, monoton, getestet.
- **Dev-Performance-Panel** (`perfStats.ts` + `PerformancePanel.tsx`): FPS,
  Draw-Calls, Dreiecke, Vegetations-Instanzen/-Gruppen und aktive Stufe live.
- **Nebel-Cheat erzwingt keine Maximalqualität**: `revealLockedRegionsVisually`
  steuert nur, WELCHE Regionen Vegetation bekommen; Dichte/Schatten/Sichtweiten
  bleiben strikt an der gewählten Qualitätsstufe.

Tests: `tests/graphicsQuality.test.ts` (8) sichert Monotonie, LOD-Ordnung,
Dichteuntergrenze, Impostor-Skip (Ultra) und das Schatten-Gate.

## 3. Bewusst zurückgestellt (reine LOD-Schicht liegt bereit)

Die folgenden Punkte sind im GPU-Renderer nur mit Zielhardware sinnvoll zu
verifizieren und ohne GPU in dieser Umgebung nicht seriös messbar. `vegetation
LodTier` und die Profil-Sichtweiten sind bereits so gebaut, dass sie diese
Ausbaustufen direkt speisen können:

- **HLOD-Waldcluster**: ferne Regionen zu einem zusammengefassten Cluster-Mesh
  je Biom verschmelzen (Tier 2 → ein Draw-Call je Region statt je Proptyp).
- **Impostor-Billboards**: gerenderte Baum-Silhouetten als Kreuz-Quads jenseits
  von `lodDistances[1]` (Profile mit `impostorsEnabled`).
- **Chunk-Streaming**: Vegetation je Kachel-Chunk auf-/abbauen statt je Region,
  mit Distanz-Cull über `vegetationViewDistance`.
- **Shader-Wind** statt CPU-Animation; **Material-/Textur-Atlas-Merging**.
- **Waldboden-Schattenmaske** statt Einzelschatten in dichten Beständen.

Diese sind in `OPEN_TASKS.md` (P0) als nächste Ausbaustufe geführt.

## 4. Messmethodik (kein Gefühl)

Das Dev-Panel (Debug → Performance) zeigt live FPS, Draw-Calls, Dreiecke und
Vegetations-Instanzen. Vorgehen bei jeder Budget-Änderung: Stufe wählen, Wert in
Stadt- / Regions- / Vollinsel-Sicht ablesen, gegen die Zielwerte prüfen:

- Stadt (nah): **60 FPS**
- Region (mittel): **50–60 FPS**
- Volle Insel (fern, alle Regionen sichtbar): **40–60 FPS**

Erst wenn ein Messwert das Ziel verfehlt, werden Budgets/Sichtweiten der
betroffenen Stufe angepasst — nicht auf Verdacht.

## 5. Verifikation

`npx tsc -b --force` · `npx eslint src tests` · `npx vitest run` · `npm run build`
· 3D-Screenshot-Smoke. Der Windows-Tauri-Build läuft nicht in der Cloud-Umgebung.
