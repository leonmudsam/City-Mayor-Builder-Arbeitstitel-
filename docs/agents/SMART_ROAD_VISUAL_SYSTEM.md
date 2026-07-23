# Smart Road Planning – visuelles System

Stand: 23. Juli 2026

## Produktiver Ablauf

Straßenklick und -drag schreiben nicht mehr sofort in den Spielzustand. Sie
erzeugen `roadPlanPath` im UI-Store. Schnelle Pointerbewegungen werden
orthogonal lückenlos gerastert. `roadPathPreview` liefert je Kachel:

- vorhanden,
- baubar,
- Brücke,
- blockiert samt Grund,
- echte Kosten.

Der Renderer zeichnet Start grün, Ziel orange, neue Segmente hell,
Brückensegmente cyan und Blockaden rot. Die HUD-Zusammenfassung zeigt Länge,
Kosten, Brücken und Konflikte. `Enter` oder der Primärbutton baut nur einen
gültigen und bezahlbaren Entwurf.

## Command-Grenze

Ein atomarer `placeRoadPath`-Command existiert nicht. Nach einer vollständigen,
mutationsfreien Vorschau ruft die UI deshalb den bestehenden
`placeBuilding('road', x, y)`-Command pro neuer Kachel auf. Bereits vorhandene
Straßen werden übersprungen. Eine unerwartete Ablehnung stoppt die Folge und
meldet die Zahl der bereits gebauten Segmente.

## Sichtbar, aber nicht vorgetäuscht

- „Alternative Route“ ist deaktiviert: kein entsprechender Read-Helper.
- Kontrollpunkte sind im ViewModel vorbereitet, aber nicht bedienbar.
- `elevatedCount` bleibt null: Viaduktprofile fehlen.
- echte Steigung, Abrissbedarf und Rampen sind nicht Teil von
  `RoadPlanPreview`.

## Spätere Controller-Erweiterungen

- atomarer `placeRoadPath`-Command mit Gesamtprüfung/Transaktion,
- Vorschlags- und Alternativrouten,
- Kontrollpunkt-ReadModel,
- Steigung/Rampe/Viadukt/Abriss pro Segment,
- Kostenaufschlüsselung über alle Ressourcen.

Diese Erweiterungen können `SmartRoadPlanView` befüllen, ohne HUD oder
Renderer-Sprache neu zu entwerfen.
