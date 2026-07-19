# UI-/Welt-Asset-Manifest v0.60

Alle Assets sind Drop-in-Dateien. Fehlt eine Datei, muss der vorhandene
Code-/Three-Fallback ohne Absturz übernehmen.

| Asset | Format / Größe | Einsatz | Fallback |
| --- | --- | --- | --- |
| `ui/brand/mayor_crest.png` | 256×256, ca. 87 kB | Level-/Bürgermeisterwappen | bestehendes Level-Badge |
| `environment/cloud_bank.webp` | 1024×1024, ca. 53 kB | Himmel und horizontaler Regionsnebel | prozedurale Canvas-Wolke |
| `ui/events/region_unlock_hero.webp` | 1280×720, ca. 171 kB | Hero der Regionsfreischaltung | CSS-Landschaftsgradient |
| `models/props/nature/boat_small.glb` | ca. 14 kB | Küsten-/Wasserlandmarke | prozedurales Boot |
| `models/props/nature/windmill_small.glb` | ca. 26 kB | fruchtbare Regionen | prozedurale Windmühle |
| `models/props/nature/lighthouse.glb` | ca. 24 kB | Küstenlandmarke | prozeduraler Leuchtturm |

## Bildgenerierung

Modus: integriertes Bildgenerierungswerkzeug.

### Bürgermeisterwappen

Promptkern: „HUD level crest; ornate civic mayor crest, stylized golden
compass-and-city emblem in a heraldic shield, crown/laurel, readable at 48–80
px, polished 3D game UI, no text.“ Das zunächst einfarbige Keying wurde lokal
transparent aufbereitet.

### Wolkenbank

Promptkern: „Reusable grayscale cloud alpha texture; painterly island-map
clouds and coastal mist, black background, white/light gray only, square, no
scenery, no text.“ Das Ergebnis wurde als kompaktes WebP eingebunden.

### Regions-Hero

Finaler Prompt:

> Stylized-concept, wide region-unlock hero for a premium city-builder:
> newly unlocked fertile island region with green meadows, winding river,
> pine woodland, distant mountains, small rustic settlement rooftops and
> coastline; painterly polished 3D render; warm late-morning light; maritime
> blue, forest green and restrained amber; landscape only, no UI, no text,
> no logo, no watermark.

Das zuletzt übermittelte Master-Mockup diente nur als Stil-/Farb-/Qualitätsreferenz.

## 3D-Erzeugung

Die drei GLBs wurden aus textuellen Asset-Spezifikationen mit einem lokalen
generativen/prozeduralen Erzeugungsskript gebaut und anschließend über
`SCENIC_PROP_MODELS` registriert. Die vollständigen Text-zu-3D-Prompts stehen in
`src/assets/models/props/PROMPTS.md`.

Nach Modelländerungen:

`WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`
