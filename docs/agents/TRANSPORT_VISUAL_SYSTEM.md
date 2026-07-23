# Transport – visuelles System

Stand: 23. Juli 2026

## Ablauf

`TransportPlanner` zeigt Quelle → Transportmethode → Ziel, Menge,
Fahrzeugkapazität, Ladungszahl, Distanz, Dauer, Straßenanteil und Kosten.
Die Werte kommen aus:

- `getAvailableForTransfer`,
- `getInventoryTransferTargets`,
- `getInventoryTransferPreview`,
- `activities.vehicles`.

Erst „Transport starten“ ruft `createInventoryTransfer` auf. Laufende Transporte
und Rückruf bleiben im bestehenden Betriebsbereich.

## Handkarren

Der Handkarren ist als frühe, hochwertige Karte mit SVG-Fallback sichtbar, aber
deaktiviert. Grund: Weder `DriveVehicle` noch Fahrzeug-Config oder
`createInventoryTransfer` kennen ihn. Kapazität, Geschwindigkeit,
Arbeiterbindung und Reichweite werden deshalb **nicht erfunden**.

Für eine spätere echte Anbindung erforderlich:

1. datengetriebener Fahrzeug-/Transportmethoden-Eintrag,
2. Controller-Akzeptanz dieses Methodentyps,
3. echte Kapazität, Geschwindigkeit, Ladezeit, Kosten und Arbeiterbedarf,
4. optionales Drop-in-Bild `transport_handcart`.

## Zielkarten

Die Karten zeigen eindeutige Gebäudenamen, Region, echte Routendistanz,
Transportdauer und Straßenqualität. Bestand/Kapazität je Ziel bleiben optional,
weil die aktuelle Einlagerung in den gemeinsamen globalen Pool schreibt.

## Karte und Fracht

Die bestehende 3D-Transportfahrt bleibt die Produktivdarstellung. Der
cyanfarbene Fluss im Panel visualisiert die Phasen, ohne eine zweite Route zu
berechnen. `TourOverview` zeigt für Stadtarbeit zusätzlich je realem
`CargoRouteStop` Ladung vorher/nachher und Delta. Nachfüllungen entstehen nur,
wenn die gezeichnete Route die echte Quelle erneut berührt.

## Offene Logik

- separate optionale Nachfüllquellen und Umwegprognosen,
- Zielpuffer pro Lagergebäude,
- Handkarren,
- Kraftstoff/Fahrzeugzustand,
- frei wählbare Logistik-Legs außerhalb des vorhandenen Straßengraphs.
