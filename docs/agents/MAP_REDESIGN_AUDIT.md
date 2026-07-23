# Map Redesign 5.0 — Audit

> Historische v0.71-Renderergrundlage. Geometrie-, Maß- und Regionsangaben sind
> seit World Rebuild 6.0 durch `NEW_ISLAND_AUDIT.md` und
> `NEW_ISLAND_REBUILD_PLAN.md` ersetzt.

Stand: 21. Juli 2026 · Referenzstand v0.71

## Kurzfazit

Die Insel musste nicht neu gebaut werden. Küstenkontur, 384×384-Welt,
769×769-Höhenfeld, Fluss-/Straßennetz und die 32 spielmechanischen Regionen sind
bereits tragfähig und bleiben unverändert. Der sichtbare Abstand zu den Mockups
lag vor allem in der Materialauswertung: acht globale Bodenschichten, zu wenig
regionale Identität, gestreckter Fels an Steilhängen, einheitliche Baumwahl und
statisches Flusswasser.

v0.70 setzt deshalb auf der bestehenden Pipeline an: 12 visuelle Regionsprofile,
12 Splat-Schichten, weiche Nachbarschafts-Samples, triplanares Fels-Sampling,
mehrere Vegetationsfamilien, neutrale Regionslandmarken und eine gebündelte
Flussströmungsfläche. Gameplay-Regionen, bebaubare Flächen und Saves bleiben
identisch.

v0.71 schließt den separaten Mockup-Befund für gesperrte Regionen: Der frühere
niedrige Teasernebel ließ Terrainspitzen sichtbar. Die bestehende Regionskontur
trägt nun eine vollständige Wolkendecke oberhalb des höchsten Terrainpunkts,
eine instanzierte Randwand und einen Schloss-/Level-Marker. Die Minimap nutzt
dieselben Regions-IDs und Zentren. Regionslogik, Bake und Saves bleiben identisch.

## Bestehende Pipeline

- `islandBake.gen.ts`/`worldHeight.gen.ts` liefern die unveränderte Inselmaske,
  Terrain-IDs, Regions-IDs und Höhenwerte.
- `terrainHeightAt()` ist weiterhin die einzige Höhenquelle für Boden,
  Gebäude, Straßen und Props.
- `ThreeMapRenderer` baut 8×8 Terrain-Chunks mit insgesamt 48×48 Kacheln je
  Chunk, Küstenband, Ozean, Straßen, Vegetation und Landmarken.
- Der Terrain-Shader mischt Texturen; `worldVisualProfiles.ts` ergänzt nur eine
  visuelle Deutung der vorhandenen Regions-IDs.
- Modelle und Texturen werden über Manifest und Drop-in-Registry geladen. Jede
  neue Weltkomponente besitzt einen prozeduralen oder materialbasierten Fallback.
- `SkyEnvironment` verwaltet ausschließlich visuelle Beleuchtung, Wetter und
  Nebel. Es schreibt keine Simulationsdaten.

## Befund und Maßnahme

| Bereich | Ist-Zustand vor v0.70 | Problem | Ziel laut Mockup | Technische Änderung | Risiko / Restarbeit |
|---|---|---|---|---|---|
| Gebirge | Höhenprofil und Fels vorhanden | Fels auf steilen Flächen gestreckt; Gipfel zu gleichförmig | klare Vorland-, Fels- und Schneestufen | Weltkoordinaten-Triplanar für Fels, neue Bergbasis und Schnee, alpine Regionsgewichte | echte Normal-/Roughness-Maps und Hero-Fels-GLBs offen |
| Grasland | globale Grastextur und Blumen | zu homogen, wenig offene Wiesen | lesbare Wiesen, Solitärbäume, Blumeninseln | neue Wiesenbasis, regionale Tönung, offene Vegetationsregel | weitere Gras-/Blumenvarianten als Drop-in offen |
| Wald | dichte Nadelbaumverteilung | eine dominante Silhouette | Kernwald, Waldrand und Mischbestand | drei Baumfamilien, große Kiefern und Laubbäume, Profil `waldkern` | zusätzliche Farn-/Totholz-GLBs offen |
| Küste | Sandband und Schaumlinie | wenig Materialwechsel, ähnliche Ufer | Sand, Kies, Felskap und Buchten | eigene Kies-/Küstenschicht, regionale Küstenstärke, bestehender Schaum erhalten | Klippen-Decals und Brandungsspray offen |
| Wasser | eine Ozeanfläche | zu gleichmäßige Bewegung | Tiefenwirkung, gerichtete Wellen | drei Wellenrichtungen und Makromodulation im bestehenden Wassermaterial | keine physische Wassertiefe; Caustics offen |
| Seen | Wasser vorhanden | kaum vom Meer unterscheidbar | ruhige Seen und Inselmotive | Seenland-Profil, Ufergewicht und Insel-Landmarke | eigener See-Shader optional |
| Flüsse | Flusskacheln vorhanden | optisch statisch | sichtbare Strömungsrichtung | eine gebündelte animierte Overlay-Geometrie entlang aller Flusskacheln | Kurven-/Gischtgeometrie kann weiter verfeinert werden |
| Sumpf | spielmechanisch als Küste geführt | keine eigene visuelle Identität | Moor, Schilf, Totholz und dunkles Wasser | Region 29 erhält Sumpfprofil, KI-Matschtextur, Schilf/Totholz-Verteilung und Moorlandmarke | Gameplay-Auswirkungen bewusst `TODO(CLAUDE_LOGIC)` |
| Wüste | spielmechanisch als Küste geführt | keine rote Trockenzone | rote Felsen, trockener Boden, spärliche Vegetation | Region 9 erhält Wüstenprofil, KI-Sandsteintextur, trockene Props und Felsnadel | Gameplay-Auswirkungen bewusst `TODO(CLAUDE_LOGIC)` |
| Fruchtbares Land | Farmboden und Felder vorhanden | zu wenig Abgrenzung vom Gras | warme Auen, strukturierte Agrarränder | Profil `fruchttal`, Agrarvegetation, bestehende Farmtextur bleibt führend | Hecken-/Obstbaum-GLBs offen |
| Nebel | Wetternebel und niedriger Regions-Teaser vorhanden | gesperrtes Terrain und Gipfel blieben sichtbar; Status nur indirekt | blickdichte Wolkenwand, atmosphärischer Rand, Schloss und Level | v0.71: Decke über Maximalhöhe, drei Alpha-Lagen, ein Wolken-`InstancedMesh`, Canvas-Marker und Minimap-Maske | Dichte und Markergröße auf Zielhardware abnehmen; biomeigener Bodennebel optional |
| Beleuchtung | Tageszeit-/Wettergrading vorhanden | Materiale wirkten bei Distanz flach | warme, atmosphärische Modellierung | neue Farbbereiche reagieren auf bestehendes Licht/Fog; keine zweite Lichtpipeline | HDR-Umgebungskarte optional |
| Vegetation | instanzierte Bäume/Büsche/Blumen | Biomunterschiede zu schwach | charakteristische Silhouetten je Biom | profilabhängige Dichte, drei Baumquellen, Felsen, Schilf und Totholz | weitere echte GLBs fehlen, Fallback bleibt aktiv |
| Landmarken | Boot, Windmühle, Leuchtturm, Wasserfall | wenige neutrale Orientierungspunkte | Felsbogen, Urbaum, Ruine, Insel, Wüsten-/Sumpfzeichen | sechs neue Manifest-Slots mit deterministischer Platzierung und Fallback | echte Drop-in-Modelle offen |
| Performance | Chunking, Instancing und Culling vorhanden | zusätzliche Biomtiefe darf Draw-Calls nicht explodieren lassen | Detail ohne sichtbaren Performancebruch | keine zweite Welt, Textur-Splat im bestehenden Material, Landmark-Caps, gebündelter Fluss | GPU-Screenshot/Profiling auf Zielhardware weiterführen |

## Architekturgrenzen

Das neue Profilmodul liegt ausschließlich unter `src/renderer/three/`. Es liest
Regions-IDs, verändert aber weder `GameState` noch Config-Boni. Insbesondere sind
Morgenküste und Westbucht nur visuell als Wüste beziehungsweise Sumpf markiert.
Eine spätere spielmechanische Umwidmung muss datengetrieben in `src/game/config/`
erfolgen und bei Save-Daten die normale Migrationskette einhalten.
