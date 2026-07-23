# WORLD RENDERING PERFORMANCE AUDIT — § Change 9.0, Phase S4

> Audit vor Implementierung (Auftrag §2/§10/§11/§24.7). **Baut auf**
> `WORLD_PERFORMANCE_AUDIT.md` (v0.76/0.77, Säule B) auf — hier nur die *neuen*
> 9.0-Anforderungen und die dokumentierten Lücken. Kernregel bleibt: Dichte hoch,
> nur die Darstellung wird mit Entfernung vereinfacht (keine Optimierung nach
> Gefühl — über das Dev-Panel messen).

## 1. Bereits vorhanden (nicht neu bauen — §1)

Aus Säule B (v0.76/0.77), getestet:

- **Instancing:** jeder Proptyp = genau ein `InstancedMesh` (konstante Draw-Calls;
  elf Vegetationsgruppen). **Kein** Per-Baum-Scene-Graph.
- **Deterministische Pro-Region-Budgets** (`selectPropTiles`, `REGION_PROP_BUDGET`):
  Unlock erhöht nur die Gesamtzahl, verschiebt keine bestehende Auswahl.
- **Vier Qualitätsstufen** (`graphicsQuality.ts`) mit konkreten Zahlen (Dichte,
  Sichtweiten, LOD-Grenzen, Schatten-/Tierbudget, Kleinprop-Cull, Pixel-Ratio).
- **Reine LOD-Funktion** `vegetationLodTier` (0 voll / 1 reduziert / 2 Impostor /
  3 gecullt), monoton + getestet.
- **Striktes Schattenbudget** (`shadowInstanceBudget`), selektive Kleinprop-Schatten.
- **Dev-Performance-Panel** (`perfStats.ts` + `PerformancePanel.tsx`): FPS,
  Draw-Calls, Dreiecke, Vegetations-Instanzen/-Gruppen, aktive Stufe.
- **Tierbudget** (`ANIMAL_CAP`), **Frustum-Culling** (three per Default).

## 2. Lücken gegenüber Auftrag 9.0 (§10) — was fehlt

| §10 | Anforderung | Ist | Lücke |
|---|---|---|---|
| 10.1 | Instancing/Batching, gemeinsame Geometrie/Material, Atlas | InstancedMesh je Typ ✅ | **BatchedMesh**/Textur-Atlas-Merge fehlt |
| 10.2 | Räumliche Chunks (16×16/24×24), nur betroffene neu bauen | Pro-Region-Budget, kein Kachel-Chunk | **Chunk-Struktur** + Chunk-Rebuild fehlt |
| 10.3 | 4 LOD-Stufen inkl. „keine CPU-Updates pro Baum" | `vegetationLodTier` als Funktion | LOD wird noch nicht pro Chunk **angewandt/umgeschaltet** |
| 10.4 | **HLOD-Waldcluster** (fern: 2–5 Cluster/Biom) | nur Einzel-Instancing | **HLOD** fehlt (in OPEN_TASKS als P0 notiert) |
| 10.5 | Kleinprops distanzabhängig, Bäume bis fern über LOD/HLOD | Nahdetail-Toggle vorhanden | Distanz-Cull je Propklasse verfeinern |
| 10.5 | **Impostor-Billboards** jenseits `lodDistances[1]` | LOD-Tier 2 = „Impostor" nur als Funktion | echte Impostor-Geometrie/Bake fehlt |
| 10.6 | Waldboden-Schattenmaske/AO statt Einzelschatten fern | Schattenbudget-Cap | **gebackene Waldboden-Dunkelungsmaske** fehlt |
| 10.7 | **Shader-Wind** per-instance, keine JS-Animation pro Baum | (zu prüfen) CPU-Wind? | Wind in den Vertex-Shader verlagern |
| 10.8 | Tiere: viele logisch, kleines aktives Budget | `ANIMAL_CAP` vorhanden | Habitat-Zonen + Entfernungs-Pause verfeinern (§9.4) |
| 11 | Dev-Panel um GPU-Zeit, Chunks, LOD-Verteilung, Shadow-Caster, Nebel-Meshes, Speicher erweitern | Teilmenge vorhanden | Panel-Felder ergänzen + Vorher/Nachher-Messungen |

## 3. Profiling zuerst (§24.7)

**Vor** jeder Optimierung mit vollständig sichtbarer Insel (alle Regionen
freigeschaltet, Nebel aus) messen und im Panel/Report festhalten:
Nahansicht · Stadtansicht · Regionsansicht · komplette Insel. Kennwerte: FPS,
CPU/GPU-Frametime, Draw-Calls, Dreiecke, sichtbare Baum-/Prop-Instanzen, aktive
Chunks, LOD-Verteilung, Shadow-Caster, aktive Tiere, Nebel-Meshes, Speicher.
Zielwerte (aus OPEN_TASKS): Stadt 60 FPS, Region 50–60, Vollinsel 40–60 — **nur an
echter Zielhardware** seriös; die Cloud-Umgebung liefert nur relative Trends.

## 4. Problem-/Fix-/Test-Matrix (§2)

| Problem | Ursache | Betroffene Dateien | Geplanter Fix | Tests |
|---|---|---|---|---|
| Ruckeln bei hoher Dichte (Vollinsel) | keine Fern-Aggregation (HLOD), alle Regionen als Einzel-Instancing | `ThreeMapRenderer.ts`, neue `vegetationChunks.ts`/`hlod.ts` | HLOD-Waldcluster je Biom fern; Chunk-Struktur | Perf-Panel Vorher/Nachher, `vegetationBudget.test.ts` |
| Kein Chunk-Rebuild | Pro-Region statt Kachel-Chunk | Renderer + reine Chunk-Auswahl | 16×16/24×24-Chunks, nur betroffene neu bauen | Unit: Chunk-Zuordnung deterministisch |
| Impostor nur als LOD-Name | keine Billboard-Geometrie | Renderer, Bake | Impostor-Bake jenseits `lodDistances[1]` | Test: Tier-2 nutzt Billboard |
| Ferne Einzelschatten teuer | Schatten-Cap, aber keine Maske | Renderer, Bake | gebackene Waldboden-Schatten-/AO-Maske | Perf: Shadow-Caster fern ≈ 0 |
| Wind CPU-seitig (zu prüfen) | JS-Animation pro Baum | Vegetations-Material | per-instance Windphase im Vertex-Shader | Unit/Perf: keine CPU-Wind-Schleife |
| Zoom erhöht Meshzahl | (zu prüfen) | Renderer | LOD/HLOD statt Neuerzeugung | `worldReveal.test.ts`: Meshzahl stabil |
| Unlock baut Welt neu | (zu prüfen) Rebuild-Trigger | Renderer | nur Nebel zurückziehen, keine Vegetations-Neuerstellung | Test: Instanzzahl vor≈nach Unlock |
| Panel unvollständig | Felder fehlen | `perfStats.ts`, `PerformancePanel.tsx` | GPU-Zeit/Chunks/LOD/Shadow/Nebel/Speicher ergänzen | Panel-Snapshot-Test |

## 5. Harte Leitplanken (§1/§10)

- **Keine** Reduktion der logischen Prop-/Baumzahl als „Optimierung" — nur die
  Darstellung vereinfachen (LOD/HLOD/Impostor/Cull).
- Vegetations**daten** (welche Kachel trägt was) strikt von der Vegetations**darstellung**
  trennen (§1) — die Simulation/Auswahl (aktive Ressourcenknoten, §20) darf nie von
  LOD abhängen.
- Chunking/HLOD dürfen die **Auswählbarkeit** aktiver Ressourcenknoten im Nah-LOD
  nicht brechen (siehe `ACTIVE_RESOURCE_WORK_PLAN.md` §20).
