# UI-Audit v0.69 — Mockups, Hauptwelt, Detailfenster und Stadtarbeit 4.0

Stand: 19. Juli 2026. Referenzen sind die drei Projektdateien
`chatgpt mockup stadtarbeit.png`, `chatgpt mockup ui 1.png`,
`chatgpt mockup ui 2.png` sowie das zuletzt übermittelte Master-Mockup mit
Hauptansicht, Regionsfreischaltung, Bürgerdetail, Gebäudekatalog,
Gebäudedetail, Routenplanung, Straßenplanung und Wetter/Zeit sowie die beiden
Premium-Fidelity-Referenzen vom 19. Juli 2026.

Am 21. Juli 2026 kam das verbindliche Stadtarbeit-Redesign-4.0-Mockup hinzu.
Die frühere v0.62/v0.65-Zeile „Reihenfolge/Optimierung“ ist dadurch ersetzt:
keine separate Zielsortierung, kein „Letzte Route“, kein Werkzeugmodus;
Reihenfolge, Tour, Cargo und Nachfüllen entstehen aus dem exakten Straßenweg.

## Ergebnis

Die erste verbindliche UI-Phase ist umgesetzt. Das Spiel besitzt jetzt eine
gemeinsame visuelle Sprache, eine große freie 3D-Welt und klar getrennte
Kompakt- und Detailansichten. Die Änderungen verwenden bestehende
Controller-Snapshots und Commands; es wurde keine zweite Simulation gebaut.

| Bereich | Vorher | Ziel / aktueller Stand | Status |
| --- | --- | --- | --- |
| Top-HUD | funktional, visuell uneinheitlich | Wappen/Level, XP, Ressourcenraten, Zufriedenheit, Tageslauf und Menü in maritimem Glas | erledigt |
| Navigation | breite untere Leiste | kompakte vertikale Hauptnavigation links, Gold für aktiv/primär | erledigt |
| Stadtstatus | dauerhaft dominant | kompakte Kennzahlen links, großes Detail-Sheet bei Bedarf | erledigt |
| Bürgeranliegen | nur Kartenstapel | kompakte Inbox plus eigenes großes Detailfenster mit Zielen und Belohnungen | erledigt |
| Minimap | statisches Terrainbild | Terrain, Regionen, Gebäude, Straßen, Probleme, Missionsziele und Live-Kamerarahmen; Klick fokussiert Weltposition | erledigt |
| Region | textlastiger Dialog | großes KI-Landschaftsbild, Region/Biom, Boni, Kosten und Bestätigung | erledigt |
| Gebäudekatalog | funktional | bildstarke Karten, Tabs, Status, Kosten, Level; ab 1680×860 rechtes 4-Spalten-Dock | erledigt |
| Gebäudedetail | kleines Dialogmuster | breites Kontext-Sheet mit Hero, Kennzahlen, Diagnosen, Stufenvorschau und Aktionen | erledigt |
| Stadtarbeit | technischer Planer mit Zielliste, Tools und Routenvorlage | bildstarkes Redesign 4.0 mit dominanter Karte, direkter Bedienung, Weg-Reihenfolge, Live-Tour/Cargo, Fahrzeugkarten und Berater | erledigt; mehrteilige Logistik-Legs offen |
| UI ausblenden | vorhanden | Welt bleibt mit kleinem Wiederherstellen-Knopf bedienbar | erledigt |
| Straßenplanung | Sofortbau | Mockup-Ziel: Planen → Vorschau → Bestätigen | offen, Gameplay-Phase O6 |
| Wetter | nur visueller Tageslauf | Sonne/Regen/Nebel wirken live auf Renderer; spielerische Effekte bleiben O11 | visuell erledigt, Gameplay offen |

## Visuelle Regeln

- Dunkles blaugrünes Glas; Gold nur für aktive Auswahl, Währung und primäre
  Bestätigung; Grün/Gelb/Rot nur für Status.
- Keine UI-Schrift unter 12 px.
- Die 3D-Welt bleibt die größte Fläche.
- Kompaktansicht und Detailansicht zeigen dieselben Live-Daten.
- Nur ein primäres Sheet zur gleichen Zeit.
- Klickziele bleiben mindestens 34 px, primäre Aktionen mindestens 38 px hoch.
- Responsive Abnahmen: 1280×720 und 1920×1080.

## Verifizierte Ansichten

- 1280×720: Top-HUD, linke Navigation, Stadtstatus, Bürger-Inbox, Live-Minimap,
  Kameraaktionen und Welt ohne Überlappung.
- 1280×720: Bürgerdetail mit Portrait, Beschreibung, Fortschritt und
  Belohnungen; keine Konsolenwarnung.
- 1600×1000: Stadtarbeit-Routenplanung mit vollständiger Karte und Detailspalte.
- 1920×1080: Haupt-HUD, Welt, Navigation und Live-Minimap kollisionsfrei.
- 1920×1080: rechter Bau-Shop 820×990 mit 4-Spalten-Katalog und 796×270-Vorschau.
- 1920×1080: Wetter-Sheet 650×990; Sommerregen aktualisiert Sheet, HUD und
  Renderer-Atmosphäre ohne Boot-Fehler.
- Ein-Sheet-Wechsel: Gebäudekatalog schließt das lokale Bürgerdetail.

Der finale Teststand steht in `docs/agents/PROJECT_STATE.md` und
`docs/PATCHNOTES.md`.
