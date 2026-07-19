# UI-Design-System — Maritime Civic Glass (v0.60)

Dieses Dokument beschreibt die aus den drei ChatGPT-Mockups abgeleitete,
verbindliche UI-Richtung. Es ergänzt `ARCHITECTURE.md` und `UI_ASSETS.md`.

## Zielbild

- Dunkles, leicht blaugrünes Glas statt deckender grauer Flächen.
- Gold als sparsamer Primärakzent für Level, Geld, aktive Navigation und
  wichtige Bestätigungen.
- Die 3D-Welt bleibt der größte sichtbare Bereich.
- Oben: Level/Wappen, Ressourcen mit Änderungsrate, Zufriedenheit, Zeit.
- Links: genau eine vertikale primäre Navigation; daneben kompakter Stadtstatus,
  darunter die Live-Inselkarte. Rechts: Bürgeranliegen als kompakte Inbox.
- Kamera-Helfer bleiben unten mittig, sind aber keine Hauptnavigation.
- Primäre Sheets überlagern einander nie.

## Tokens und Layout

Die aktiven Tokens stehen am Ende von `src/styles.css`:
`--glass-deep`, `--glass`, `--glass-soft`, `--glass-line`, `--civic-gold`,
`--civic-gold-bright`, `--civic-text`, `--civic-muted` und
`--civic-shadow`. Neue HUD-Komponenten verwenden diese Tokens und erfinden keine
zweite Palette.

Die Desktop-Zonen sind bewusst fest reserviert:

1. `GameHud` oben.
2. linke HUD-Zone für `CityStatus` und `WorldMiniMap`.
3. `.right-hud-stack` ausschließlich für `CitizenRequests`.
4. `.primary-nav` vertikal links.
5. `.quick-actions` als kleine Hilfsgruppe in derselben linken Leiste.
6. `.camera-controls` unten mittig.

Bei 1420 px und 1120 px greifen kompaktere Abstände und Spaltenbreiten. Bei
geringer Höhe werden sekundäre Details reduziert, die Hauptnavigation bleibt
erreichbar.

## Zustandsregel

`useUiStore` besitzt weiterhin den einzigen UI-Zustand. `openPanel`,
`selectedBuilding` und `regionDialog` sind gegenseitig exklusiv. Ein
Navigationspunkt öffnet bestehende Panels bzw. setzt bestehende
Kamera-Presets; es gibt kein paralleles Routing- oder Rendering-System.

## Asset-Regel

- `brandImage('mayor_crest')` lädt das Level-Wappen.
- `environmentImage('cloud_bank')` lädt die Wolken-/Nebel-Alpha-Textur.
- `eventImage('region_unlock_hero')` lädt das Landschaftsbild des Regionsdialogs.
- Jedes Asset hat einen Code-Fallback und darf das Spiel bei Fehlen nie stoppen.
- Neue Rasterbilder kommen in die passenden Drop-in-Ordner; Modellnamen werden
  ausschließlich in `modelManifest.ts` ergänzt.

## Noch offene Mockup-Bausteine

Die 2D-Routenplanung für Stadtarbeit ist als Projektion des bestehenden
Aktivitätssystems umgesetzt. Der Planer darf nicht zu einer zweiten Simulation
werden; reale Verkehrsgraphdaten werden später aus O9 zugeliefert.
Bestätigungspflichtige Straßenplanung, Ausbauflächen und spielerisches Wetter
bleiben Gameplay-Phasen aus `OVERHAUL_3_PLAN.md`.

Die ausführliche aktuelle Fassung mit 12-px-Mindestschrift, Fensterregeln und
Breakpoints steht in `docs/agents/UI_SYSTEM.md`.
