# Küstengeometrie-Audit — Overhaul 7.0

Stand: 22. Juli 2026

## Befund

Die großen Kegel aus den Ist-Screenshots waren keine Fels-Props, kein
Normalenfehler und kein Three.js-Küstenskirt. Ihre Quelle lag im Offline-Bake:
annähernd senkrechte Dreiecke der Source-GLB sind in der X/Z-Draufsicht
degeneriert. Der frühere Fallback schrieb trotzdem die drei Eckhöhen dieser
Dreiecke als einzelne Heightfield-Proben. Eine hohe Wandkante wurde damit zu
einem isolierten hohen Rasterpunkt; die reguläre Triangulierung des
Renderer-Heightfields zog daraus einen weithin sichtbaren Kegel.

## Auditmatrix

| Problem | Tatsächliche/vermutete Ursache | Betroffene Datei | Fix | Regressionstest |
|---|---|---|---|---|
| Große Einzelkegel an Ufern | Senkrechte Source-Dreiecke degenerieren in X/Z, deren hohe Ecken wurden als Height-Proben übernommen | `tools/bakeWorld.mjs` | Top-down-degenerierte Dreiecke werden für das Heightfield verworfen; 173 Stück im aktuellen Bake | `newIslandBake.test.ts`: mehr als 100 verworfene Projektionen, kein isolierter Peak |
| Einzelner verbleibender Ausreißer | Rasterpunkt wird nur von höchstens einem plausiblen Nachbarn gestützt | `tools/bakeWorld.mjs` | konservative Reparatur ausschließlich im Küstenband; 1 Probe im aktuellen Bake | `isolatedPeaksRepaired`, danach `isolatedPeakCount === 0` |
| Extreme Nachbarstufe | möglicher Höhen-Ausreißer oder falsche Chunkprobe | Bake-Diagnose und `worldHeight.gen.ts` | finalen Höhenraster nach dem Repair erneut prüfen | `maxNeighborStep < 30`; aktuell 12,311 m |
| Chunknaht | abweichende Randproben zwischen Chunks | `ThreeMapRenderer.buildGroundChunks` | nicht bestätigt: alle Chunks lesen weiterhin dasselbe 1025²-Grid | Dimensions-/Höhengridtests bleiben aktiv |
| Defekter Renderer-Skirt | extrudierte Küstenkontur | Renderer-Audit | nicht bestätigt: der sichtbare Kegel entstand bereits im Heightfield, nicht in einer Skirt-Geometrie | Bake-Vorschau plus Runtime-Smoke |
| Falsche Normalen | Folge, nicht Ursache eines extremen Höhenpunkts | finale Terrain-Geometrie | normale Renderer-Neuberechnung bleibt; keine Prop-Abdeckung als Fix | visueller 3D-Smoke |

## Kontrolliertes Küstenband

Die bestehende 6.1-Ableitung bleibt die verbindliche Staffelung:

`Land → Küstenhang → Uferzone → Flachwasser → Tiefwasser`

Der neue Repair verändert keine zusammenhängenden Klippenzüge und schließt
keine Buchten. Er greift nur bei einer isolierten Probe mit höchstens einem
stützenden Nachbarn. Die geologische Hauptsilhouette der 78 Source-Teile bleibt
damit erhalten.

## Aktuelle Diagnosewerte

- Source: `reference/world/island 3d new.glb`
- projiziert-degenerierte Dreiecke verworfen: **173**
- isolierte Ausreißer repariert: **1**
- isolierte Peaks nach Reparatur: **0**
- größter Nachbarschritt: **12,311 m**

Die Werte stehen zusätzlich in `BAKED_WORLD.coastGeometry`, damit ein späterer
Rebake die Qualitätsgrenze nicht stillschweigend umgehen kann.

