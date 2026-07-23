# Ressourcen-Netzwerk – visuelles System

Stand: 23. Juli 2026

## Produktiver Vertrag

`ResourceNetworkPanel` wird aus dem Ressourcen-Popover im oberen HUD geöffnet.
`buildResourceNetworkView` verbindet:

- `getInventoryNetworkOverview()` für global/lokal/reserviert/unterwegs,
- `state.operations.inventories` für echte lokale Betriebslager,
- `getBuildingTransfers()` für physisch zugeordnete Transporte,
- Regions-Config und Bake-Schwerpunkte für eindeutige Namen wie
  „Sägewerk · Nord“ statt „Lager 1“,
- `derived.storageCaps` für die zentrale Gesamtkapazität.

Die Standortkarten besitzen Kapazitätsbalken, Status, Regionsnamen,
Kartenfokus und Gebäudedetails. Der Drawer ersetzt andere Hauptflächen.

## Bewusste Datenabgrenzung

Der zentrale Bestand (`state.resources`) ist ein gemeinsamer logischer Pool.
Der Controller kennt heute **keine** Aufteilung dieses Pools auf Rathaus,
Lagerhaus West und weitere Anlieferpunkte. Deshalb:

- erscheint ein ehrlicher Standort „Zentrales Ressourcennetz“,
- bleiben `inWarehouses` und `inTownHall` im ViewModel optional/abwesend,
- werden keine erfundenen physischen Teilbestände oder freien Zielkapazitäten
  gezeigt.

Lokale Betriebslager sind dagegen physisch und werden einzeln ausgewiesen.

## Noch anzubinden

Wenn die Simulation später Zwischenlager als eigene Puffer führt, benötigt der
Adapter je Standort:

```ts
{
  buildingId,
  resource,
  stored,
  reserved,
  capacity,
  incomingTransfers,
  outgoingTransfers
}
```

Das ViewModel und die Standortkarten können diese Werte direkt übernehmen; kein
Redesign ist nötig. Eine Save-Änderung wäre dann Simulationsarbeit und muss linear
migriert werden.
