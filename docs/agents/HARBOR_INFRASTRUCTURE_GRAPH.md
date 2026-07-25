# Anlegernetz — Landanker & lokales Straßennetz (P-D, §11)

> Teil des Spielbarkeits-Auftrags (Nutzer). Befund: „Anleger und Schiffsrouten sind
> noch nicht als zusammenhängendes Infrastrukturnetz nutzbar. Straßen können an noch
> nicht angeschlossene Anleger teilweise nicht sinnvoll angebaut werden."

## 1. Erledigt (v0.92): Straßenstart am isolierten Anleger (§11.2)

Bisher brauchte jede neue Straße Anschluss an eine **bestehende verbundene Straße**
oder ein **Distriktzentrum** (`roadWouldConnect` / `computeRoadNetwork` seedeten nur
aus Distriktzentren). Hinter einer Wasserverbindung ließ sich damit kein neuer
Stadtteil beginnen.

**Fix (kein zweiter Graph, §2):** Ein **Anleger/Hafen** (jedes `waterfront`-Gebäude)
ist jetzt ein **Infrastruktur-Landanker** und seedet den Straßengraphen wie ein
Distriktzentrum:

- `roadWouldConnect` (Platzierungsprüfung) erlaubt die **erste** Straße an der
  Landkante eines aktiven Anlegers — auch ohne Anschluss ans Hauptnetz.
- `computeRoadNetwork` nimmt Anleger-Footprints als **Saatpunkte** auf, sodass die
  anliegenden Straßen einen **zusammenhängenden, erweiterbaren lokalen Verbund**
  bilden (BFS ab dem Anleger). So wächst hinter dem Wasser ein echtes lokales
  Straßennetz (Straße → Anleger → … → Anleger → Straße).

Beides nutzt denselben `roadNetwork`/`validatePlacement`-Pfad — **kein zweites
Verkehrssystem**. Der gemeinsame Helfer `adjacentToFootprintEdge` prüft orthogonale
Kanten-Adjazenz (Distriktzentrum wie Anleger). Additiv, **keine Save-Änderung** (v21).

Tests: `tests/harborNetwork.test.ts` (Straße am isolierten Anleger gültig · Straße
ohne Anschluss weiter abgelehnt · lokales Netz erweiterbar).

## 2. Vorhandene Bausteine (Wiederverwendung, kein Neubau)

- `infrastructure/waterNavigation.ts`: `getShippingRoutePreview` (Anleger→Anleger,
  Dijkstra über `waterRouteNodes/Edges` mit Tiefe/Region-Gates), `getAvailableHarborConnections`.
- `infrastructure/buildingInfrastructure.ts`: `buildingInfrastructureStatus`
  (road/water/`water_only`), `nearestNavigableWaterNode`, `infrastructureNetworkOverview`.
- `operations/transport.ts`: die A5-Transportmaschinerie (Reservierung, Ladung, Fahrt).

## 2b. Erledigt (v0.96, I3): Teilnetze + Anleger als Netzknoten

`roadNetwork` ist EIN flaches Set (Distriktzentren **und** Anleger seeden es). Ein
isoliertes Anleger-Netz war darin nicht vom Stadtnetz unterscheidbar — genau das
verhinderte den Netzknoten-Charakter.

- `infrastructure/networkSegments.ts` — `computeRoadSegments` zerlegt **dasselbe**
  Netz in zusammenhängende Teilnetze und klassifiziert sie: `city` (berührt ein
  Distriktzentrum) vs. `local`. Deterministische Ids (kleinste Kachel), stabile
  Reihenfolge. Gebaut in `computeDerived` → nur bei Strukturänderungen (§15.5).
- `infrastructure/harborNodes.ts` — `getHarborNodeStatus` je Anleger: Landseite
  (Teilnetz + `onCityNetwork`), Wasserseite (`waterNodeId`, `navigable`),
  `reachableHarborIds` und **`linksToCityVia`** (erreichbare Anleger am Stadtnetz →
  genau die Eingabe für I4-Routen). `getHarborNetworkOverview` aggregiert.
- UI: Gebäudefenster zeigt die Landseite (Stadtnetz / anschließbar / isoliert / keine
  Straße). Kein zweiter Graph, keine Save-Änderung (v21).
- **Nicht erfunden:** Kapazität/Reisezeit/Betriebskosten/Warenfluss = I4.
- **Operabilität unverändert:** lokale Netze werden gezeigt, nicht bestraft — ohne
  Schiffsrouten (I4) hätte der Spieler kein Gegenmittel.

Tests: `tests/networkSegments.test.ts` (8).

## 3. Offen — I4 „voll ausgebaut" (nächste große Stufe, nicht vorgetäuscht)

- **Persistente Schiffsrouten** Anleger↔Anleger als echter Netz-Bestandteil:
  Kapazität, Reisezeit, Betriebskosten, Warenfluss, Pause/Löschen. Neuer persistierter
  Zustand ⇒ **lineare Save-Migration**. Schiffsbewegung als gepoolte 3D-Fahrzeuge.
- **Anleger-Netzknoten-Panel**: Status („Lokales Netz – noch nicht mit dem Stadtnetz
  verbunden" / „über Wasser verbunden"), erreichbare Häfen, aktive Routen, Waren.
- **Multimodale Stadtarbeit** (Straße → Schiff → Straße) über den gemeinsamen
  Infrastrukturgraphen. Vorbereitet, aber bewusst noch nicht als real dargestellt.

Diese I4-Stufe ist ein eigener testbarer Meilenstein (Save-Migration + Sim + UI) und
folgt separat.
