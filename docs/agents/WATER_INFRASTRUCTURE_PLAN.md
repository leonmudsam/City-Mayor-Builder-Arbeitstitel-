# Wasser-Infrastruktur — technischer Stand und Ausbauplan

Stand: 22. Juli 2026 · Overhaul 7.0

## Heute umgesetzt

Die vorhandene Simulation wurde erweitert; es existiert keine zweite
Infrastruktur-Simulation.

- `InfrastructureMode` bereitet `road`, `water`, `rail` und `air` in der
  Gebäude-Config vor. Ausgewertet werden derzeit Straße und Wasser.
- Gebäude dürfen ohne Straße platziert und fertiggestellt werden. Der
  Anschluss ist danach eine Diagnose und Betriebsbedingung.
- `buildingInfrastructureStatus` liefert `connected`, `disconnected`,
  `water_only`, `road_only`, `partially_connected` oder `blocked` sowie
  textfreie Problemcodes.
- Unverbundene Gebäude tragen keine Kapazität, Produktion, Lagerwirkung oder
  Radiusversorgung zur Simulation bei. Ein Hafen mit Wasser, aber ohne Straße,
  bleibt sichtbar als `water_only` und kann geometrisch geroutet werden.
- Der Bake erzeugt **569** Wasser-Nodes und **1.775** befahrbare Kanten mit
  Tiefe, Breite, Clearance und Region. Jede Kante wird als Supercover gegen die
  Wasser-Maske geprüft; Landüberquerungen werden nicht exportiert.
- Controller-Read-Helper: `getBuildingInfrastructureStatus`,
  `getInfrastructureNetworkOverview`, `getWaterNavigationGraph`,
  `getAvailableHarborConnections`, `getShippingRoutePreview` und
  `getWaterfrontPlacementPreview`.

## Netzfolge

`Straße → Hafen (Landseite) → Wassergraph → Hafen (Wasserseite) → Straße`

Der Renderer projiziert nur diese Daten. Er berechnet keine Erreichbarkeit,
Kosten oder Warenbewegung.

## Vorbereitete Remote-Expansion

Ein freigeschaltetes Ufer kann schon heute einen Hafen ohne bestehende Straße
aufnehmen. Von dessen Land-Footprint aus lassen sich anschließend normale
Straßen und Gebäude errichten. Das macht den Hafen geometrisch zum möglichen
Ausgangspunkt, gewährt aber noch keine kostenlosen Ressourcen oder eine
regionweite Versorgung.

```ts
interface RemoteConstructionAccess {
  sourceHarborId: string;
  targetHarborId: string;
  availableMaterials: ResourceBundle;
  deliveryRate: number;
  connectedRegionId: number;
}
```

## TODO(CLAUDE_LOGIC)

- Persistente `ShippingRoute` samt Commands, Schiffszuteilung, Kapazität,
  Fahrzeit, Kosten, Pausieren und Löschen.
- Hafenbetrieb mit Arbeitskräften, lokalem Lager, Umschlag und
  Straßenvor-/nachlauf.
- Remote region construction through harbor logistics; Materialreservierung
  und Lieferleistung müssen an die bestehende Ökonomie andocken.
- Regionsversorgung nur über explizite Reichweite/Netzknoten, niemals durch die
  bloße Existenz eines Hafens.
- `BridgeNavigationProfile`, Schiffsklassen, Durchfahrtshöhen und Warn-Command
  beim Brückenentwurf.
- Multimodale Stadtarbeits-Legs (`road`/`water`) samt Umladepunkten; bestehende
  `ActiveActivity` erweitern, keine neue Missions-State-Machine.
- Persistente Felder erst mit Schema-Bump und linearer Migration. Overhaul 7.0
  fügt ausschließlich abgeleitete Graph-/Previewdaten hinzu; Save bleibt v15.

