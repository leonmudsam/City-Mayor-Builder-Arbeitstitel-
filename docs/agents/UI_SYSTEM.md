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
7. Unten mittig: Info-Layer; Kamera besitzt nur noch kompakte
   Ausrichtungs-/Zoom-Helfer.
8. Ab 1680×860: Der geöffnete Bau-Shop nutzt rechts ein vollhohes
   4-Spalten-Arbeitsdock; darunter bleibt dieselbe Komponente als Bodenleiste.
9. Stadtarbeit ist ein Vollbild-Arbeitsraum: 260–300 px Missionen links,
   mindestens 55 % Kartenfläche mittig, Fahrzeug/Cargo/Tour/Start rechts und
   kompakte Kennzahlen als Overlay über der Karte.

## Tokens

Kompatibilitätswerte stehen in `src/styles.css`. Neue UI-Werte stehen zentral in
`src/styles/tokens.css`; Layout, Komponenten, Animationen und Breakpoints sind
getrennt. Neue UI verwendet insbesondere:

- `--panel-bg`, `--panel-border`
- `--glass-deep`, `--glass`, `--glass-soft`, `--glass-line`
- `--civic-gold`, `--civic-gold-bright`
- `--civic-text`, `--civic-muted`, `--civic-shadow`
- `--good`, `--warn`, `--bad`
- `--bg-panel`, `--bg-card`, `--border-strong`, `--gold`, `--green`, `--red`

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
- Die Anliegen-Inbox darf filtern, aber keinen Queststatus erfinden.
- Info-Layer sind rein visuell und dürfen keine Simulation beeinflussen.
- Vollbild-Routenplanung liegt über der Welt, aber unter dem Top-HUD.
- Stadtarbeit besitzt keinen permanenten Werkzeugmodus, keine gespeicherte
  Standardroute und keine separate Zielsortierung. Der gezeichnete Weg ist die
  sichtbare Quelle für Reihenfolge und Cargo-Stopps.
- Modale Entscheidungen blockieren; normale Details docken rechts oder unten.
- Wetter-Presets sind Renderer-Darstellung und dürfen keine Simulation
  beeinflussen.

## Responsive Regeln

- Pflichtauflösungen: 1280×720, 1366×768, 1920×1080 und 2560×1440.
- Unter 1420 px werden sekundäre HUD-Inhalte ausgeblendet; Schrift bleibt
  mindestens 12 px.
- Bei geringer Höhe werden Notizen bzw. weitere Kompaktkarten verborgen.
- Große Sheets bleiben innerhalb 10–20 px Viewport-Rand und scrollen intern.
- Ab 1680×860 wird der Bau-Shop rechts vollhoch; bei kleineren Viewports bleibt
  das kompakte Bodenlayout.
- Die 3D-Pixeldichte wird oberhalb von zwei Millionen Viewport-Pixeln auf 1,25
  begrenzt; DOM-UI bleibt davon unberührt.

- Referenzabnahmen: 1280×720 und 1920×1080.
- Unter 1420 px werden Ressourcen und Zeitblock kompakter.
- Unter 1120 px verschwindet der sekundäre Zeitblock; Kerndaten bleiben.
- Bei geringer Höhe verschwinden Hilfsaktionen der linken Leiste.
- Panels scrollen intern; die Hauptseite bleibt ohne Body-Scroll.
- Redesign 4.0 verdichtet bei 1280×720 Fahrzeug-/Tourdetails, nicht die
  12-px-Mindestschrift. Bei 1920×1080 bleiben alle Bild- und Kennzahlzonen aktiv.

## Tageslauf und Wetter

Pause sowie 1x/2x/4x ändern ausschließlich `EnvironmentSettings.dayLengthMin`.
Sonne/Regen/Nebel ändern ausschließlich `EnvironmentSettings.weather`.
`SkyEnvironment` setzt beides als visuelle Atmosphäre um. Es handelt sich weder
um Simulationsgeschwindigkeit noch um spielerisches Wetter. Ein späteres echtes
Zeit-/Wettersystem braucht eigene Commands und Tests.
