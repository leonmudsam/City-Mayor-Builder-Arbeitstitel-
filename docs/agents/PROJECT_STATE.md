# Projektstand — v0.60

Stand: 19. Juli 2026

## Technische Basis

- Natives PC-Spiel mit Tauri, Windows zuerst; Browser nur Entwicklung/Test.
- Einziger Renderer: Three.js unter `src/renderer/three/`.
- Simulation: reines TypeScript unter `src/game/`.
- Command-/Snapshot-Grenze: `GameController`.
- UI-Zustand: Zustand-Store unter `src/state/store.ts`.
- Save-Schema: **v11**, durch diese UI-/Renderer-Phase unverändert.

## Abgeschlossen

- Maritimes Glas-/Gold-UI gemäß vier Mockup-Referenzen.
- Vertikale Hauptnavigation links.
- Kompaktes Top-HUD mit KI-Wappen, Ressourcenraten, Zufriedenheit und visuellem
  Tageslauf (Pause sowie 1x/2x/4x nur für die Darstellung).
- Live-Minimap mit echten Welt-/Snapshot-Daten und Kamerafokus per Klick.
- Bürgeranliegen als Kompaktkarten und großes Detail-Sheet.
- Bildstarke Regionsfreischaltung mit KI-Landschaftshero.
- Gebäudekatalog und Gebäudedetail in gemeinsamer Fensterarchitektur.
- Vollbild-Stadtarbeit-Routenplaner mit RNG-neutraler Zielvorschau,
  Stoppreihenfolge, Speichern/Laden, Zurücksetzen, Nächster-Nachbar-Optimierung,
  Schätzung und Start über den bestehenden Controller.
- Ozean-/Küstenpolish, horizontale Regionswolken, atmosphärische Wolken,
  Vegetationscluster und Landmarken.
- Drop-in-GLBs für Boot, Windmühle und Leuchtturm mit prozeduralem Fallback.

## Bewusst nicht als Gameplay fertig deklariert

- Verkehrsfarben, Staurisiko, Distanz und Zeit im Routenplaner sind
  deterministische UI-Schätzungen.
- Es gibt noch keinen kanonischen Straßengraphen mit Segmentlasten,
  Routenalternativen oder effizienzabhängiger Auszahlung.
- Der Tageslauf ist visuell und beeinflusst die Simulation nicht.
- Straßenbau besitzt noch keine Planen-/Bestätigen-Phase.
- Wetter, Ausbauflächen, vollständiger Platzierungs-Ghost und
  geländeprojizierte Wirkungsradien bleiben spätere Phasen.

## Aktuelle Prüfung

- `npx tsc -b --force`: grün.
- `npx eslint src tests`: grün.
- `npx vitest run`: grün, **26 Testdateien / 185 Tests**.
- `npm run build`: grün; nur bekannte Warnung zum großen Haupt-Chunk.
- Browser-Smoke 1280×720: Hauptansicht, Bürgerdetail und Ein-Sheet-Wechsel ohne
  Konsolenfehler.
- Browser-Smoke 1920×1080: HUD-Zonen, Welt und Live-Minimap kollisionsfrei.

## Einstiegspunkte

- UI-Komposition: `src/App.tsx`
- HUD/Minimap/Nav: `src/components/hud/`
- Panels/Planer: `src/components/panels/`
- UI-Stil: `src/styles.css`
- Renderer/Welt: `src/renderer/three/ThreeMapRenderer.ts`
- Tagesumgebung: `src/renderer/three/SkyEnvironment.ts`
- Controller-Aktivitäten: `src/game/commands/controller.ts`
- Assets: `src/assets/registry.ts`, `src/assets/modelManifest.ts`
