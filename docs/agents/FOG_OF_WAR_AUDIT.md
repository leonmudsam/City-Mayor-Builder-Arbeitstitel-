# FOG OF WAR AUDIT — § Change 9.0, Phase S3

> Audit vor Implementierung (Auftrag §2/§24.5-6). Grundlage: der echte Renderer
> `src/renderer/three/ThreeMapRenderer.ts` (Abschnitt „Organischer Regions-Nebel",
> `buildRegionFog`/`createFogVolume`, ab Z. 2236) und `CameraInputController.ts`.

## 1. Ist-Zustand (gemessen)

- **Pro-Region-Nebelvolumen:** `fogVolumes = Map<regionId, LockedRegionFogVolume>`.
  Jede gesperrte Region bekommt in `createFogVolume(id)` ein eigenes Volumen
  entlang ihrer **echten** Regionsgrenze (Außenkontur; innere Löcher = Seen bleiben
  vernebelt). Aufbau je Region: eine `cover`-Fläche, **drei driftende
  `cloud_bank`-Alpha-Lagen** (`fog.position.set((i-1)*0.65, fogY+layer.y, …)`,
  i=0..2) und (laut v0.71) ein auf ~168 Ellipsoide gedeckeltes `InstancedMesh`.
- **Höhe pro Region:** `fogY = Math.max(WATER_LEVEL + 5.5, maxH + 4.8)` — die
  Nebeloberkante richtet sich nach der **jeweiligen Regionshöhe**, nicht nach einer
  globalen absoluten Höhe.
- **Unlock-Animation:** vorhanden (Fade/ausdünnender Nebel beim Freischalten,
  danach Entsorgung des Volumens). `revealLockedRegionsVisually`/`fogDisabled`
  sind reine Anzeige-Cheats.
- **Kamera:** `CameraInputController` mappt nur Pan/Orbit/Zoom auf
  `CameraController3D`. Eine grep nach `clamp|bound|Boundary|unlocked|region`
  liefert **keinen Treffer** → es gibt **kein regionsbasiertes Kamera-Clamping**.

## 2. Kernbefunde (Auftrag §6.1/§6.4/§7)

1. **Sichtbare „Kapseln" (§2 IST-Bild):** Das gedeckelte Ellipsoid-`InstancedMesh`
   pro Region erzeugt die weißen Einzelkörper. Genau das soll weg.
2. **Keine globale absolute Nebelhöhe (§6.4):** `fogY` ist pro Region → flache und
   hohe Regionen bekommen unterschiedliche Oberkanten; hohe Gipfel ragen nicht
   *konsistent* aus einer einheitlichen Wolkendecke.
3. **Harte/technische Wand statt weicher Front (§6.2):** cover + 3 Lagen wirken als
   blickdichte Fläche, ohne weichen Grenzübergang/Noise/Dither.
4. **Kamera kann gesperrte Regionen betreten (§7):** ohne Clamping fliegt der
   Spieler frei über/in gesperrte Regionen und sieht ihre Landschaft.
5. **Render-Kosten:** je gesperrter Region ein Canvas-Sprite (Marker) + cover + 3
   Meshes + InstancedMesh → skaliert mit der Zahl gesperrter Regionen.

## 3. Zielbild (§6.2/§6.3/§6.4)

Eine **globale** weiche Wolken-/Nebelfront statt pro-Region-Kapseln:

- **Regionsbasierte Nebelmaske** (welche Weltflächen sind gesperrt) → wenige
  großflächige Cloud-Cards + weicher prozeduraler Noise, `dithered`/Alpha-Hash-
  Transparenz, Distanznebel; **wenige Meshes** statt eines Volumens pro Region.
- **Globale absolute Oberkante:** flache Regionen ganz verdeckt, Hügel als
  Silhouette, hohe Gebirge ragen leicht heraus; entfernte Landschaft nur als
  Silhouette angeteast.
- **Keine** weißen Einzelkörper, keine Kachelgrenzen, keine harten Alpha-Sortier-
  Fehler.
- Optional dünne volumetrische Schicht **nur** nahe der Freischaltgrenze.

## 4. Kamera-Clamping (§7)

Neu aufzubauen (existiert nicht). Modell aus dem Auftrag:
`CameraExplorationBoundary { unlockedRegionIds, allowedTargetPolygon,
softBoundaryDistance, hardBoundaryDistance }`. Die zulässige Target-Fläche = Union
der freigeschalteten Regionen (aus der bestehenden Region-Maske ableitbar). Nähe
zur Grenze → Kamera langsamer + Nebel dichter → weiche Rückführung (kein harter
Stoß). Gilt für Stadt-/Regions-/Inselansicht, freie Drehung und extreme Winkel
(§7.2). **Getrennter** Dev-Cheat „Regionsgrenzen für Kamera deaktivieren",
unabhängig von „Nebel deaktivieren" und „Alle Regionen freischalten" (§7.3).

## 5. Problem-/Fix-/Test-Matrix (§2)

| Problem | Ursache | Betroffene Dateien | Geplanter Fix | Tests |
|---|---|---|---|---|
| Sichtbare weiße Kapseln | Ellipsoid-`InstancedMesh` je Region | `ThreeMapRenderer.ts` (`createFogVolume`) | Ellipsoide entfernen; großflächige Cloud-Cards + Noise/Dither | Smoke-Screenshots (keine Kapseln) |
| Uneinheitliche Nebelhöhe | `fogY` pro Region | `ThreeMapRenderer.ts` | globale absolute `FOG_TOP_Y`; Gipfel > FOG_TOP ragen heraus | Renderer-Unit: konstante Oberkante |
| Harte Nebelwand | cover + 3 Lagen, kein weicher Rand | `ThreeMapRenderer.ts` | weicher Grenz-Falloff (Noise/Alpha-Hash), Distanznebel | Screenshot-Abnahme |
| Kamera betritt gesperrte Region | kein Clamping | neue `CameraExplorationBoundary` in `CameraController3D.ts`/`CameraInputController.ts` | zulässiges Target-Polygon aus Unlock-Maske, weiche Rückführung | `camera.test.ts`: Fokus außerhalb → geklemmt |
| Cheats vermischt | nur `fogDisabled`/`revealLockedRegionsVisually` | `state`/`DebugPanel.tsx`, Renderer | dritter Cheat „Kamera-Grenzen aus" getrennt | Test: Cheats unabhängig |
| Renderlast skaliert mit Regionszahl | Volumen je Region | `ThreeMapRenderer.ts` | eine globale Front, Meshzahl unabhängig von Regionszahl | Perf-Panel: Nebel-Meshes konstant |
| Unlock erzeugt Props neu | (zu prüfen) Vegetations-Rebuild bei Unlock | `ThreeMapRenderer.ts` | Unlock zieht nur Nebel zurück, keine Prop-Neugenerierung | Test: Instanzzahl vor≈nach Unlock |

## 6. Erhalten (nicht kaputt machen)

Vorhandene Unlock-Fade-Animation, Klickweiterleitung des Regionsmarkers (Raycast
öffnet Regionsdialog), `WorldMiniMap`-Verdeckung gesperrter Regionen und die
prozeduralen Fallbacks bleiben. Der Nebel bleibt **rein visuell** — keine zweite
Regionslogik, keine Simulation, keine Save-Wirkung (Schema unverändert, sofern
kein neues persistiertes Feld nötig ist).

## 7. Umsetzungsstand (v0.81 — S3 erledigt)

- **S3a globale Front:** ✅ `worldFogTopY()` (86. Perzentil aller Landhöhen,
  gecacht) ersetzt die Pro-Region-Höhe; Wolkenballen jetzt mit `alphaHash`
  (dithered, ordnungsunabhängig), geringerer Deckkraft, dichter/kleiner (Cap
  168→240) → eine zusammenhängende, weiche Front ohne Kapsel-Silhouetten. Gipfel >
  Decke ragen bewusst heraus (§6.4). Marker + Fade unverändert.
- **S3b Kamera-Clamping:** ✅ neu `CameraExplorationBoundary` (three-freies
  Nearest-Feature-Distanzfeld) + `CameraController3D.setExplorationBoundary` /
  Zurückführung in `clampTarget`; Renderer baut sie bei Unlock/Cheat neu
  (`updateCameraBoundary`). Unit-Tests in `camera.test.ts` (+6).
- **S3c Cheat-Trennung:** ✅ `WorldRevealState.cameraBoundsDisabled` (nicht
  persistiert) + Store `toggleCameraBounds` + DebugPanel-Button + MapView-Sync.
- **S3d Unlock-Retract:** ✅ verifiziert — Nebel wird nur zurückgezogen (persistente
  `fogVolumes`-Fade, `fogGroup` wird bei `rebuildTerrainIfNeeded` NICHT entsorgt).
  Terrain-Deko/Vegetation bauen beim Unlock noch voll, aber **deterministisch**
  (Hash → identische Platzierung, kein Prop-Sprung). Der inkrementelle
  (chunkweise) Neuaufbau ist bewusst Teil von **S4**, nicht hier vorgetäuscht.
- **Verifikation:** tsc/eslint/build sauber, **346 Tests** grün, 3D-Smoke
  1600×900 (msedge) `{boot:true, errors:[]}`. Keine Save-Änderung (Schema v19).
