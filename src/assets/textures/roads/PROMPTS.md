# Straßen-Texturen — Anleitung je Datei (v0.44)

> **Auto-generiert** aus `src/assets/roadTextureManifest.ts`. Nicht von Hand editieren.
> Neue Texturen dazunehmen: Eintrag dort ergänzen, dann
> `WRITE_ROAD_DOCS=1 npx vitest run tests/roadTextures.test.ts` (schreibt diese Datei neu).
> Der Test schlägt fehl, sobald die Doku veraltet ist.

Genaue Anweisungen zum Erstellen und Ablegen jeder der 7 Straßen-/Brücken-Texturen (§ Straßen als Textur). Für das Gesamtkonzept (Splatmap-artige Verwendung, Kreisverkehr/Bergstraße/Steg-Logik) siehe `docs/ROAD_TEXTURES.md`.

## Fahrbahn-Oberflächen — `src/assets/textures/roads/surface/`

### `road_path_cartoon.png`

1. **Prompt eingeben** (unverändert kopieren):

   ```text
   Seamless tileable stylized road-surface texture for a premium low-poly city-builder game. Soft painterly look, natural subtle wear, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges along the tiling axis, PBR-ready — warm honey-beige packed earth, exceptionally calm broad painterly fields, virtually no gravel or micro detail, no borders and no lane markings
   ```

2. **Format/Auflösung:** PNG (kein Alphakanal nötig), 1024×1024, quadratisch, seamless/nahtlos kachelbar an allen vier Rändern (kein sichtbarer Bruch bei Wiederholung).
3. **Genau hier speichern:** `src/assets/textures/roads/surface/road_path_cartoon.png`
4. **Was passiert dann:** Wird automatisch erkannt (Datei-Watcher/Reload reicht) — kein Code, kein Neustart nötig. Solange die Datei fehlt, bleibt die aktuelle Flächenfarbe aktiv.

*Kontext:* Frühe Bodenstraßen und Wege im zusammenhängenden geglätteten Straßennetz. Gespiegelte World-Space-UVs auf dem gebündelten Fahrbahnband; ersetzt die dunkle Prototyp-Fläche ohne Richtungsnaht oder Kachelraster. Priorität: **Pflicht**.

### `road_asphalt.png`

1. **Prompt eingeben** (unverändert kopieren):

   ```text
   Seamless tileable stylized road-surface texture for a premium low-poly city-builder game. Soft painterly look, natural subtle wear, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges along the tiling axis, PBR-ready — dark blue-grey asphalt road surface, subtle tire wear streaks, fine grain texture, no lane markings
   ```

2. **Format/Auflösung:** PNG (kein Alphakanal nötig), 1024×1024, quadratisch, seamless/nahtlos kachelbar an allen vier Rändern (kein sichtbarer Bruch bei Wiederholung).
3. **Genau hier speichern:** `src/assets/textures/roads/surface/road_asphalt.png`
4. **Was passiert dann:** Wird automatisch erkannt (Datei-Watcher/Reload reicht) — kein Code, kein Neustart nötig. Solange die Datei fehlt, bleibt die aktuelle Flächenfarbe aktiv.

*Kontext:* Standard-Fahrbahnbelag für Kern + Arme jeder Straßenkachel. ersetzt die Flächenfarbe (0x474d57) auf Kern/Arm-Boxen aus buildRoadTile; kachelt entlang der Straßenachse. Priorität: **Pflicht**.

### `road_mountain.png`

1. **Prompt eingeben** (unverändert kopieren):

   ```text
   Seamless tileable stylized road-surface texture for a premium low-poly city-builder game. Soft painterly look, natural subtle wear, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges along the tiling axis, PBR-ready — rough unpaved mountain road surface, dusty grey-brown gravel, small loose rocks, packed dirt ruts
   ```

2. **Format/Auflösung:** PNG (kein Alphakanal nötig), 1024×1024, quadratisch, seamless/nahtlos kachelbar an allen vier Rändern (kein sichtbarer Bruch bei Wiederholung).
3. **Genau hier speichern:** `src/assets/textures/roads/surface/road_mountain.png`
4. **Was passiert dann:** Wird automatisch erkannt (Datei-Watcher/Reload reicht) — kein Code, kein Neustart nötig. Solange die Datei fehlt, bleibt die aktuelle Flächenfarbe aktiv.

*Kontext:* Bergstraßen/Pässe — Kacheln, deren Untergrund terrainAt==="mountain" ist. ersetzt road_asphalt auf Kern/Arm-Boxen, sobald die Straßenkachel auf Gebirgsterrain liegt. Priorität: **Empfohlen**.

## Markierungen — `src/assets/textures/roads/markings/`

### `road_marking_dash.png`

1. **Prompt eingeben** (unverändert kopieren):

   ```text
   Seamless tileable stylized road-surface texture for a premium low-poly city-builder game. Soft painterly look, natural subtle wear, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges along the tiling axis, PBR-ready — single dashed lane-marking stripe on transparent background, pale yellow-white paint, crisp edges, repeatable along one axis
   ```

2. **Format/Auflösung:** PNG mit Alphakanal (transparente Lücken zwischen den Strichen), 512×512, quadratisch, seamless/nahtlos kachelbar an allen vier Rändern (kein sichtbarer Bruch bei Wiederholung).
3. **Genau hier speichern:** `src/assets/textures/roads/markings/road_marking_dash.png`
4. **Was passiert dann:** Wird automatisch erkannt (Datei-Watcher/Reload reicht) — kein Code, kein Neustart nötig. Solange die Datei fehlt, bleibt die aktuelle Flächenfarbe aktiv.

*Kontext:* Mittellinie für Straßenklassen mit centerline:true. ersetzt die Flächenfarbe (0xe4d98f) der Mittellinien-Box; PNG mit Alpha-Lücken zwischen den Strichen, längs der Achse wiederholt (map.repeat). Priorität: **Empfohlen**.

### `road_roundabout.png`

1. **Prompt eingeben** (unverändert kopieren):

   ```text
   Seamless tileable stylized road-surface texture for a premium low-poly city-builder game. Soft painterly look, natural subtle wear, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges along the tiling axis, PBR-ready — circular roundabout junction surface seen from directly above, asphalt with a pale outer ring marking, radial subtle texture, centred composition
   ```

2. **Format/Auflösung:** PNG (kein Alphakanal nötig), 512×512, quadratisch, seamless/nahtlos kachelbar an allen vier Rändern (kein sichtbarer Bruch bei Wiederholung).
3. **Genau hier speichern:** `src/assets/textures/roads/markings/road_roundabout.png`
4. **Was passiert dann:** Wird automatisch erkannt (Datei-Watcher/Reload reicht) — kein Code, kein Neustart nötig. Solange die Datei fehlt, bleibt die aktuelle Flächenfarbe aktiv.

*Kontext:* Kreisverkehr-Deckel bei 4-Wege-Kreuzungen (alle 4 Nachbarbits gesetzt). ersetzt den quadratischen Kern durch eine texturierte CylinderGeometry-Scheibe bei mask === 15. Priorität: **Empfohlen**.

## Wasserüberquerungen — `src/assets/textures/roads/crossings/`

### `road_bridge_deck.png`

1. **Prompt eingeben** (unverändert kopieren):

   ```text
   Seamless tileable stylized road-surface texture for a premium low-poly city-builder game. Soft painterly look, natural subtle wear, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges along the tiling axis, PBR-ready — sturdy stone bridge deck surface with subtle wood-plank accents, weathered grey tones, top-down view
   ```

2. **Format/Auflösung:** PNG (kein Alphakanal nötig), 1024×1024, quadratisch, seamless/nahtlos kachelbar an allen vier Rändern (kein sichtbarer Bruch bei Wiederholung).
3. **Genau hier speichern:** `src/assets/textures/roads/crossings/road_bridge_deck.png`
4. **Was passiert dann:** Wird automatisch erkannt (Datei-Watcher/Reload reicht) — kein Code, kein Neustart nötig. Solange die Datei fehlt, bleibt die aktuelle Flächenfarbe aktiv.

*Kontext:* Brücken-Fahrbahnbelag für Wasserüberquerungen mit Spannweite > 1 Kachel. ersetzt die Flächenfarbe (0x4a5058) der Brücken-Deck-Box in buildBridgeDeck (breite Variante, mit Geländer/Pfeilern). Priorität: **Empfohlen**.

### `road_boardwalk.png`

1. **Prompt eingeben** (unverändert kopieren):

   ```text
   Seamless tileable stylized road-surface texture for a premium low-poly city-builder game. Soft painterly look, natural subtle wear, no baked lighting, no shadows, top-down orthographic view, perfect seamless edges along the tiling axis, PBR-ready — rustic wooden boardwalk planks seen from above, warm brown wood grain, visible plank seams, weathered
   ```

2. **Format/Auflösung:** PNG (kein Alphakanal nötig), 1024×1024, quadratisch, seamless/nahtlos kachelbar an allen vier Rändern (kein sichtbarer Bruch bei Wiederholung).
3. **Genau hier speichern:** `src/assets/textures/roads/crossings/road_boardwalk.png`
4. **Was passiert dann:** Wird automatisch erkannt (Datei-Watcher/Reload reicht) — kein Code, kein Neustart nötig. Solange die Datei fehlt, bleibt die aktuelle Flächenfarbe aktiv.

*Kontext:* Steg für Wasserüberquerungen mit Spannweite = 1 Kachel (schmal, ohne Pfeiler). ersetzt die Flächenfarbe der schmalen Steg-Deck-Box in buildBridgeDeck (Steg-Variante, ohne Pfeiler). Priorität: **Empfohlen**.
