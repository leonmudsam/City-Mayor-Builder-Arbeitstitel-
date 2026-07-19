# Übergabe an Claude — Mockup-/Welt-Überarbeitung v0.60

## Was jetzt vorhanden ist

- Mockup-treues maritimes Glas-HUD mit Goldakzenten, kompaktem Level- und
  Ressourcenblock, visueller Zeitsteuerung, linker vertikaler Hauptnavigation
  und separaten Kamera-/Hilfsaktionen.
- Live-Canvas-Inselkarte aus Terrain, Regionen, Gebäuden, Straßen, Problemen,
  Missionszielen und Kamerapose; Klick setzt den echten Kamerafokus.
- Bürgeranliegen als kompakte Inbox und großes Detail-Sheet.
- Bildstarker Regionsdialog mit `region_unlock_hero.webp`.
- Ein-Sheet-Regel im UI-Store; Gebäude, Region und Panel schließen einander.
- Organischere, deterministische Waldcluster; Küstenschaum; durchgehende
  Ozeanfläche ohne sichtbare Weltquadrat-Kante; horizontale
  Regions-Wolkenbänke statt Glaswänden.
- Atmosphärische Himmelswolken mit festem Budget.
- Szenische Drop-in-Modelle für Boote, Windmühlen und Leuchttürme inklusive
  prozeduraler Fallbacks.
- KI-Assets `mayor_crest.png`, `cloud_bank.webp` und
  `region_unlock_hero.webp`.
- Vollbild-Stadtarbeit-Routenplaner in
  `components/panels/ActivityRoutePlanner.tsx`: RNG-neutrale Zielvorschau,
  sortierbare Stopps, Nächster-Nachbar-Optimierung, Speichern/Laden,
  Belastungsschätzung, Effizienz-/Medaillenprognose und Start über den
  bestehenden Aktivitäts-Command.

## Wichtige Quellen

- UI: `src/components/hud/GameHud.tsx`, `QuickActionBar.tsx`,
  `WorldMiniMap.tsx`, `CameraControls.tsx`, `src/App.tsx`, `src/styles.css`.
- UI-Zustand: `src/state/store.ts`.
- Welt: `src/renderer/three/ThreeMapRenderer.ts`, `SkyEnvironment.ts`.
- Assets: `src/assets/registry.ts`, `modelManifest.ts`,
  `src/assets/ui/brand/`, `src/assets/environment/`,
  `src/assets/models/props/nature/`.
- Ziel und Restumfang: `docs/OVERHAUL_3_PLAN.md`.
- Designregeln: `docs/UI_DESIGN_SYSTEM.md`.
- Vollständiger Agenten-Einstieg: `docs/agents/README.md`.

## Architekturgrenzen

Die Änderungen sind UI-/Renderer-seitig. `src/game/**` wurde nicht mit
Darstellungsabhängigkeiten belastet. Der `GameController` bleibt Command-Grenze,
die UI liest Snapshots. Das Save-Schema bleibt **v11**; für v0.60 ist keine
Migration nötig. Der aktive Renderer bleibt ausschließlich Three.js.

## Bewusst nicht vorgetäuscht

Der Stadtarbeit-Planer ist jetzt bedienbar und übernimmt die Zielreihenfolge in
die aktive Fahrmission. Er verwendet noch keine echte Verkehrssimulation:
farbige Segmente/Staurisiko sind deterministische Schätzungen; Auszahlung bleibt
zeitbasiert. Reale Verkehrs-/Straßengraphdaten und deren Wertung sind O9/O10-Rest.
Straßenplanung (O6), Ausbauflächen (O4) und spielerisches Wetter (O11) bleiben
offen und benötigen eigene Commands, Tests, Balancing und gegebenenfalls
Migrationen.

## Assets erweitern

Neue Bilder kommen in die Drop-in-Ordner und werden über `registry.ts` geladen.
Neue Modelle werden zuerst in `modelManifest.ts` eingetragen; anschließend:

`WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`

Dadurch bleiben die Ordner-READMEs und Prompts synchron. Fehlende Assets müssen
immer auf den bestehenden prozeduralen Fallback zurückfallen.

## Weiterarbeit

Die nächste sichere Iteration ist O2-Rest: Platzierungs-/Verschiebe-Ghost,
geländeprojizierte Wirkungsradien und Größen-Audit. Danach sollte O3 die
Detail-Sheets verfeinern. O4/O6/O10 erst als vollständige, getrennt getestete
Gameplay-Phasen umsetzen.
