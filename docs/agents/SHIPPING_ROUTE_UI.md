# UI-Vertrag für Schifffahrtsrouten

Stand: 22. Juli 2026 · Overhaul 7.0

## Aktive Vorschau

`InfoLayerControl` besitzt den Infrastrukturfilter mit `Gesamtes Netz`,
`Straßen`, `Wasserwege`, `Häfen`, `Handel`, `Versorgung` und `Probleme`.

Der Renderer liest:

- den gebackenen Wassergraphen,
- platzierte Waterfront-Gebäude,
- `getAvailableHarborConnections` und
- `getShippingRoutePreview`.

Bei mindestens zwei Häfen wird die erste erreichbare Verbindung des gewählten
Hafens als dünne cyanfarbene, halbtransparente gestrichelte Linie dargestellt.
Kleine Richtungspfeile folgen den Graphpunkten. Die Route besteht ausschließlich
aus vom Bake geprüften Wassergraph-Kanten und kann deshalb nicht als direkte
Linie durch Land laufen. Straßen- und Hafenmarkierungen sind instanziert bzw.
gebündelt.

## Problemlesbarkeit

- rotes Straßensymbol: `no_road`
- blaues Ankersymbol: `no_waterway`
- gelbes Netzsymbol: nur Straße oder nur Wasser
- orange Route: reserviert für blockierte/zu flache Vorschauen

Das Gebäudesheet zeigt Landnetz, Wassernetz und die Zahl erreichbarer Häfen.
Der Baushop und Platzierungsbanner zeigen Land-/Wasserfläche, Mindesttiefe und
den empfohlenen späteren Straßenanschluss.

## Bewusste Grenze

Die aktuelle Linie ist eine geometrische `ShippingRoutePreview`, keine aktive
Handelsroute. Es gibt daher noch keine erfundenen Waren, Abfahrtszeiten,
Auslastungen, Schiffe oder Betriebskosten.

## TODO(CLAUDE_LOGIC)

- `getActiveShippingRoutes` und Commands für Erstellen, Zuweisen, Pausieren und
  Löschen erst mit kanonischem, persistiertem Routenmodell.
- Status `active`, `missing_ship`, blockierte Problemstelle und tatsächliche
  Fahrtrichtung aus Simulationsdaten ergänzen.
- Hafenaktionen „Route erstellen“, „Schiff zuweisen“ und „Lager zuweisen“ erst
  aktivieren, wenn die Commands existieren; keine lokale React-Ersatzlogik.
- Zoom-LOD für aktive Routen und Stadtarbeits-2D-Kartenprojektion auf denselben
  Read-Helper aufsetzen.

