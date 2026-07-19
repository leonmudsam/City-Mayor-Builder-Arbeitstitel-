# UI-System — Maritime Civic Glass

## Zielbild

Die 3D-Insel ist der Hauptdarsteller. UI-Fenster wirken wie ein zusammengehöriges
kommunales Kontrollsystem: dunkles blaugrünes Glas, feine kühle Rahmen,
sparsame Goldakzente, klare Statusfarben und bildstarke Hero-Bereiche.

## Desktop-Zonen

1. Oben: `GameHud` mit Level/Wappen, XP, Ressourcen, Zufriedenheit,
   visuellem Tageslauf und Menü.
2. Links oben: vertikale `QuickActionBar`.
3. Links daneben: kompakter `CityStatusPanel`.
4. Links unten: `WorldMiniMap`.
5. Rechts: kompakte `CitizenRequestsPanel`.
6. Kontextuell: genau ein großes Panel, Detail-Sheet, Gebäude-Sheet oder
   Regionsdialog.
7. Unten mittig: Kamera-Presets; sie sind Helfer, keine Hauptnavigation.

## Tokens

Aktive Werte stehen in `src/styles.css`. Neue UI verwendet insbesondere:

- `--panel-bg`, `--panel-border`
- `--glass-deep`, `--glass`, `--glass-soft`, `--glass-line`
- `--civic-gold`, `--civic-gold-bright`
- `--civic-text`, `--civic-muted`, `--civic-shadow`
- `--good`, `--warn`, `--bad`

Keine zweite Palette ergänzen. Gold kennzeichnet primäre Aktionen und Auswahl,
nicht jeden dekorativen Rand.

## Typografie und Bedienung

- Mindestschrift: 12 px.
- Überschriften: 15–21 px je Hierarchie.
- Zahlen: tabellarische Ziffern.
- Primäraktionen: mindestens 38 px hoch.
- Icon-Schaltflächen: mindestens 34×34 px.
- Kompaktkarten dürfen kurze Beschreibungen abschneiden; das Detail-Sheet muss
  den vollständigen Inhalt zeigen.
- Keine Emojis; Lucide, Drop-in-Art oder bestehende SVG-Fallbacks verwenden.

## Fensterregeln

- `openPanel`, `selectedBuildingId`, `regionDialog` und
  `activityPlannerDefId` sind gegenseitig exklusiv.
- Das lokale Bürgerdetail schließt ebenfalls, sobald ein anderer
  Kontext geöffnet wird.
- Vollbild-Routenplanung liegt über der Welt, aber unter dem Top-HUD.
- Modale Entscheidungen blockieren; normale Details docken rechts oder unten.

## Responsive Regeln

- Referenzabnahmen: 1280×720 und 1920×1080.
- Unter 1420 px werden Ressourcen und Zeitblock kompakter.
- Unter 1120 px verschwindet der sekundäre Zeitblock; Kerndaten bleiben.
- Bei geringer Höhe verschwinden Hilfsaktionen der linken Leiste.
- Panels scrollen intern; die Hauptseite bleibt ohne Body-Scroll.

## Tageslauf

Pause sowie 1x/2x/4x ändern ausschließlich `EnvironmentSettings.dayLengthMin`.
Sie sind visuelle Atmosphärensteuerung und keine Simulationsgeschwindigkeit.
Ein späteres echtes Zeit-/Wettersystem braucht eigene Commands und Tests.
