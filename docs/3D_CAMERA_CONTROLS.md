# 3D-Kamerasteuerung (v0.30)

Die Karte läuft nur noch in **3D** (three.js). Die Kamera fühlt sich wie in einem
modernen Aufbauspiel an: greifen & schieben, weich zoomen, bewusst drehen/neigen,
mit weichen Übergängen und harten Weltgrenzen. Es gibt **keinen 2D/Iso/3D-Umschalter**
mehr — stattdessen **Kamera-Presets** (Stadt/Bau/Übersicht/Zentrum). Der alte
2D/Iso-Renderer existiert nur noch als Debug-Fallback (Einstellungen → Debug →
Render-Engine).

## Maussteuerung (Desktop)

| Eingabe | Wirkung |
|---|---|
| **Linke Maustaste ziehen** | Kamera schwenken ("Karte greifen und schieben"), Perspektive bleibt gleich |
| **STRG + linke Maustaste ziehen** | Drehen (horizontal) + Neigen/Pitch (vertikal) um den Fokuspunkt |
| **Mittlere Maustaste ziehen** | Drehen/Neigen (Alternative zu STRG+Links) |
| **Mausrad** | Zoom — **zum Cursor hin** (weich, mit Grenzen) |
| **Rechte Maustaste (Klick)** | Abbrechen/Schließen (Platzierung/Auswahl) — **bewegt die Kamera nie** |
| **Linksklick (ohne Ziehen)** | Gebäude auswählen · leeres Feld → Auswahl aufheben · gesperrter Sektor → Freischalt-Dialog |

Erst ab ~5 px Mausbewegung wird ein Druck zum Ziehen — darunter bleibt es ein
Klick. So löst ein Bau- oder Auswahlklick nie versehentlich einen Kameraschwenk aus.

## Tastatursteuerung

| Taste(n) | Wirkung |
|---|---|
| **W A S D** / **Pfeiltasten** | Kamera über die Karte bewegen |
| **Q / E** | Kamera links/rechts drehen |
| **Bild↑ / Bild↓** (PageUp/PageDown) | Kamera neigen (Pitch) |
| **+ / −** | Zoom rein/raus |
| **Leertaste** | Auf Stadtzentrum/Rathaus fokussieren |
| **F** | Ausgewähltes Gebäude fokussieren |
| **Shift** (gehalten) | Schneller bewegen |
| **ESC** | Platzierung/Auswahl abbrechen (setzt **nicht** die Kamera zurück) |

Tasten wirken nicht, während in ein Textfeld getippt wird; Leertaste/F kapern
keinen fokussierten Button/Link (Barrierefreiheit).

## Touch-Gesten (für Mobile vorbereitet)

| Geste | Wirkung |
|---|---|
| **1 Finger ziehen** | Kamera schwenken |
| **2 Finger Pinch** | Zoom |
| **2 Finger drehen (Twist)** | Kamera drehen |
| **2 Finger vertikal** | Kamera neigen |
| **Tippen** | Gebäude auswählen |

Die Eingabe läuft über Pointer-Events, Maus und Touch teilen sich denselben Pfad —
die Touch-Bedienung ist damit strukturell vorhanden und wird später nur noch
feinjustiert.

## Kamera-Presets (statt Kartenmodus)

Unten mittig auf der Karte. Alle Presets sind **derselbe 3D-Modus** — nur Winkel,
Zoom und Zielpunkt ändern sich, weich animiert.

| Preset | Beschreibung | Winkel |
|---|---|---|
| **Stadtansicht** | schöne schräge Spielansicht (Standard) | ~52° |
| **Bauansicht** | fast von oben — ideal für Straßen & Platzierung | ~78° |
| **Übersicht** | weit herausgezoomt, Stadt + Biome | ~56°, große Distanz |
| **Zentrum** | zurück aufs Rathaus | ~52° |

Im **Baumodus** erscheint zusätzlich ein prominenter **„Bauansicht"**-Knopf, der
die Kamera schnell in die steile Planungsansicht bringt (erneut klicken →
Stadtansicht). Der Straßenbau/Ghost bleibt dabei präzise (Boden-Raycast).

Daneben: **Kompass** (zeigt die Blickrichtung, Klick = Ausrichtung zurücksetzen)
und **Zoom +/−**.

## Fokus-Funktionen

- Rathaus/Zentrum (Preset „Zentrum", Leertaste, „Karte zentrieren").
- Ausgewähltes Gebäude (Auswahl fokussiert automatisch; F).
- Neu freigeschalteter Sektor (Kamera zieht weich hin — geplant/erweiterbar).
Alle Fokusfahrten sind weich (kein Sprung).

## Grenzen (nie aus der Welt fliegen)

Definiert in `src/renderer/three/CameraConfig.ts`:

- **Zoom:** `minDist = 10`, `maxDist = 200` (nicht durch den Boden, nicht ins Nichts).
- **Neigung:** `minPitch = 28°` (schräg) … `maxPitch = 84°` (fast top-down, nie
  komplett überkopf — sonst leidet Klickerkennung/Billboards).
- **Schwenk:** an die endliche Welt (`startRegion.worldBounds`) geklemmt, mit
  etwas Rand (`worldPadding`). Der Zielpunkt kann den Board-Rand nicht verlassen.

## Bediengefühl (Smooth / Inertia)

- Weiches Nachziehen von Ziel, Distanz, Yaw und Pitch (`update(dt)` in
  `CameraController3D`).
- Leichte Pan-Inertia: nach dem Loslassen „gleitet" die Kamera kurz aus.
- In den Einstellungen abschaltbar (**Weiche Kamera**) → dann komplett direkt.
- Direkte Eingabe bleibt erhalten (kein schwammiges Gefühl): die Ziel-Ease-Rate
  ist hoch, das Smoothing glättet vor allem Ruckler.

## Einstellungen (gespeichert)

Einstellungen → **Kamerasteuerung** (`src/renderer/three/cameraSettings.ts`,
in localStorage):

- Bewegungstempo, Zoomtempo, Drehtempo (0,3×–3×)
- Drehen umkehren, Zoom umkehren
- Weiche Kamera (Smooth) an/aus
- Randscrollen (Maus am Bildschirmrand) an/aus (Standard aus)
- „Kamera zurücksetzen" (Standardwerte)

## Konflikt-Regeln (UI vs. Kamera vs. Bauen)

- Kamera-Eingaben hängen **nur am Canvas** — Klicks/Scrolls über UI-Panels
  erreichen die Kamera nicht (kein versehentliches Pan/Zoom).
- **Baumodus:** Linksklick ist fürs Platzieren/Malen reserviert und bewegt die
  Kamera nicht; geschwenkt wird per Mittelklick oder Tastatur, gedreht per
  STRG+Links/Mittelklick. Straßen/Deko malen beim Ziehen (Drag-Paint).
- **Rechtsklick** bleibt Abbrechen/Schließen und pannt nie.
- Rotation passiert nur **bewusst** (STRG oder Mittelklick), nie beim normalen
  Schwenken.

## Marker & Overlays in 3D

- Aktivitäts-Ziele (Stadtarbeit) sind **Billboard-Sprites** — sie zeigen immer
  zur Kamera und bleiben bei Drehung/Neigung korrekt und lesbar.
- Gebäude-Detail-Sheets sind rechts angedockte UI-Panels (bildschirmbezogen),
  also unabhängig vom Kamerawinkel korrekt.

## Technische Struktur

| Datei | Aufgabe |
|---|---|
| `src/renderer/three/CameraConfig.ts` | Grenzen (Zoom/Pitch/Welt) + Presets, aus der Welt abgeleitet. Reine Daten, three-frei. |
| `src/renderer/three/CameraController3D.ts` | Zentraler Zustand: Zielpunkt, Distanz, Yaw, Pitch + Ziele; pan/orbit/zoom/keys/presets/focus, Clamping, Smoothing/Inertia. **Rein & unit-getestet** (`tests/camera.test.ts`). |
| `src/renderer/three/CameraInputController.ts` | Alle Eingaben (Maus/Rad/Tastatur/Touch) → Kamera-Intents + Klick/Platzierung; Baumodus-Gating, Cursor-Feedback. |
| `src/renderer/three/cameraSettings.ts` | Gespeicherte Feineinstellungen (framework-agnostisch). |
| `src/renderer/three/ThreeMapRenderer.ts` | Liest pro Frame `pose()` und schreibt die three-Kamera; Billboard-Marker. |
| `src/components/hud/CameraControls.tsx` | Presets + Kompass + Zoom (nur im 3D-Modus). |

Die Kamera-Mathematik ist bewusst von three.js getrennt, damit sie ohne Browser
testbar ist (Grenzen, Presets, Fokus, Smoothing — `tests/camera.test.ts`).

## Bekannte Grenzen / spätere Erweiterungen

- Pitch endet bei 84° (kein exaktes Top-Down), damit Picking/Billboards sauber
  bleiben.
- Randscrollen ist bewusst konservativ (Standard aus) und kennt keine
  UI-Panel-Ränder — nur bei Bedarf aktivieren.
- Geplant: Mini-Map, Fokus auf Problem-/Bürgeranliegen-Ziele per Knopf,
  animierte Kamerafahrt bei Sektor-Freischaltung, Screenshot-Preset ohne UI,
  Gamepad-Support.
