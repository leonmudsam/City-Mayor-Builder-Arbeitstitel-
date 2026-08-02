# Frühspiel-Audit — Level 1 bis 8

**Stand 02.08.2026 · Save v32 · 9 Regionen · Startregion 9 „Gründerland"**

Auftrag: „Simuliere einen echten Spieler, der bei Level 1 startet … finde alle
Situationen, in denen der Spieler nicht weiterbauen kann." Dieses Dokument
enthält **keine Vermutungen**. Jede Zahl ist aus der Config und dem Weltbake
gemessen (`terrainAt` × `regionIdAt`, `RESOURCE_NODE_PROFILES`,
`buildings.config.ts`, `levels.config.ts`); die Messung ist als Test
festgehalten (`tests/earlyGameProgression.test.ts`), damit ein späterer
Config-Ausbau dieselben Blockaden nicht neu erzeugt.

---

## 1. Die Ausgangslage in Zahlen

**Startvorrat** (`balancing.config.ts`): Geld 45.000 · **Holz 60** ·
**Stein 0** · Nahrung 40 · Wasser 0.

**Startregion 9 — 1.587 Kacheln:**

| Terrain | Kacheln | Anteil | Trägt Knoten |
|---|---:|---:|---|
| grass | 1.039 | 65 % | — |
| forest | 491 | 31 % | `tree` → Holz |
| mountain | 46 | 3 % | `rock` → Stein |
| sand | 11 | 1 % | — |
| **fertile** | **0** | **0 %** | `crop` → Nahrung |

Knoten entstehen deterministisch aus Terrain × Dichte:

- **Holz:** 491 × 0,5 ≈ **246 Baumknoten** × 100 = 24.600 Holz, **wächst nach**
  (8 Min). Kein Engpass.
- **Stein:** 46 × 0,4 ≈ **18 Felsknoten** × 180 = **3.312 Stein — einmalig.**
  `rock` hat `regenerationMs: undefined`: Fels wächst nie nach.
- **Nahrung:** 0 × 0,6 = **0 Feldknoten.**

---

## 2. Die zwei echten Blockaden

### 2.1 Farm: gebaut, aber arbeitsunfähig (offen)

Die Farm (L4) ist ein **aktiver Betrieb**: sie erntet `crop`-Knoten, und die
liegen ausschließlich auf `fertile`. Die Startregion hat davon **null Kacheln**.

Folge: Die Farm ist **gültig platzierbar** (kein Terrain-Gate beim Bauen), zahlt
Unterhalt, produziert aber nie etwas. Gebäude mit `operation` überspringen den
passiven `produce`-Pfad — die „260 Nahrung/min" im Datenblatt sind für eine Farm
ohne Felder unerreichbar.

Erste `fertile`-Kacheln der Insel: **Region 7** (L2, 263) · Region 2 (L4, 372) ·
Region 4 (L8, 1.051).

> **Erledigt in v1.35:** Der Betrieb sagt es jetzt. Neue Diagnose
> `no_resource_nodes` („Kein Vorkommen im Arbeitsgebiet") — dieselbe Meldeebene
> wie D-047: eine **Warnung**, keine Bauregel, sonst verbietet man das Vorbauen.
> **Offen:** Das vom Nutzer gewünschte Feldsystem (Felder kaufen und frei
> platzieren, Effizienz nach Entfernung) ersetzt die Fruchtbarkeits-Bindung
> vollständig. Entwurf siehe §5.

### 2.2 Stein: eine einzige Quelle, an Bergterrain gebunden (behoben)

Die vom Nutzer vermutete Schleife „Stein für den Steinbruch" existiert **nicht**:
`quarry` kostet `{ money 45.000, wood 120 }` — keinen Stein. Der echte Riegel
war das **Terrain**: bis v1.34 war der Steinbruch die *einzige* Steinquelle, und
er braucht `rock`-Knoten auf `mountain`.

In der Startregion heißt das: ein Bruch, ~3.312 Stein, danach für immer leer.
Dem stehen allein bis L8 gegenüber: warehouse 100 · depot 200 · fire_station 220
· office 480 · water_pump 150 · dock_small 25 · Ausbaustufen (quarry 140,
farm 130, sawmill 130). Wer die Region nicht wechselt, steht ohne Stein da —
und Stein startet bei **0**.

> **Erledigt in v1.35: `stone_pit` („Steingrube"), ab Level 2.** 3×3, Kosten
> `{ money 9.000, wood 60 }` — **kein Stein**, kein Terrain, erste gratis.
> 13 Stein/min passiv, Ausbau auf 26 (L5). Bewusst **ein Drittel** des
> Steinbruchs: sie hält die Stadt am Leben, ersetzt aber kein Bergrevier —
> sonst wäre die Regionsfreischaltung entwertet.

---

## 3. Leveldurchlauf

| Level | XP | Neu | Braucht | Befund |
|---|---:|---|---|---|
| 1 | 0 | road, house_small | Holz 30/Haus | Startvorrat 60 = **zwei Häuser**. Sehr knapp, aber nicht blockiert. |
| 2 | 36 | sawmill (gratis), **stone_pit**, road_elevated | Holz | Holzkreislauf startet; 246 Baumknoten in Reichweite. Stein ab hier verfügbar. |
| 3 | 130 | well, mayor_house | Holz 50 | unkritisch |
| 4 | 310 | farm, quarry | Holz 80/120 | **Farm arbeitet in der Startregion nicht** (§2.1). Steinbruch nur auf den 46 Bergkacheln, endlich. |
| 5 | 620 | market, trading_post | Holz | unkritisch |
| 6 | 1.120 | shop_small, warehouse, dock_small | **Stein 100/25** | Erste Steinkosten überhaupt — ohne §2.2 hier der harte Stopp. |
| 7 | 1.780 | park, playground, water_pump, depot, Deko | **Stein 150/200/15** | Steinbedarf verdreifacht sich; Steingrube allein trägt das nur langsam → Expansion wird zur echten Entscheidung (gewollt). |
| 8 | 2.680 | fire_station, office | **Stein 220/480** | Office 480 Stein ist der teuerste Frühbau; ohne Bergregion mehrere Ingame-Stunden Steingrube. |

**Kein Level bis 8 ist mehr unpassierbar.** Die verbleibende Härte ist eine
*Entscheidung* (expandieren oder langsamer bauen), keine Sackgasse.

---

## 4. Was der Test dauerhaft sichert

`tests/earlyGameProgression.test.ts`:

1. **Jede Baukosten-Ressource bis L8 hat eine Quelle**, die sie nicht selbst
   voraussetzt — oder einen Startvorrat > 0. (Stein hat 0 → braucht zwingend ein
   Gebäude.)
2. **Stein existiert, bevor das erste Gebäude ihn kostet**, und mindestens eine
   frühe Quelle hängt **nicht** an Bergterrain.
3. Die Einstiegsquelle bleibt **schwächer als die Hälfte** des echten Betriebs.
4. Jede `levels.config`-Freischaltung benennt ein existierendes Gebäude.
5. Die Startregion hat Wald für das Sägewerk.
6. **Die Liste der in der Startregion arbeitsunfähigen Betriebe ist exakt
   `['farm@L4:fertile']`** — der offene Punkt steht im Test, statt verschwiegen
   zu werden. Wird das Feldsystem gebaut, muss die Liste leer werden.

---

## 5. Felder statt Fruchtbarkeit — Simulation steht, Bedienung fehlt

Der Nutzerauftrag: Farm baut → „Felder verwalten" → Felder kaufen, frei
platzieren, Effizienz nach Entfernung (100/80/60 %).

**Umgesetzt in v1.35 als `game/operations/farmFields.ts` + Commands `getFarmFieldPlan`/`buildFarmField`/`clearFarmField`/`getFarmFieldTiles`, 6 Tests. OFFEN ist ausschließlich die BEDIENUNG (Rechteck ziehen im Farm-Sheet) — ohne sie ist das System im Spiel nicht erreichbar und darf nicht als fertig dargestellt werden.**

**Gemessene Randbedingung, die den Entwurf bestimmt:** `isNodeTile` schließt
Kacheln **unter Gebäuden** aus. Ein Feld als Gebäude kann deshalb nicht selbst
der Knoten sein. Der saubere Weg über die vorhandene Maschinerie (§2 — erweitern
statt neu bauen):

- Ein Feld ist **kein Gebäude, sondern eine bezahlte Geländeänderung**: der
  Command schreibt `fertile` in `state.world.terrainOverrides` (existiert,
  persistiert, Zod-geprüft). Ab da liefern `isNodeTile`/`deriveNodesInArea`
  ganz normal `crop`-Knoten — Betrieb, Arbeiter, Radius und Lager bleiben
  unverändert.
- **Effizienz nach Entfernung** ist bereits vorhanden: `efficientRadius` gegen
  `maxRadius` im `BuildingOperationProfile`. Kein zweiter Mechanismus nötig.
- Kosten je Kachel, Rückbau entfernt den Override.
- Save: additiv, **kein Schemabruch** (`terrainOverrides` ist bereits im Schema).

Gebaut: Feldkacheln kosten 260 Geld je Kachel, brauchen freies, bebaubares
`grass`/`fertile` **im `maxRadius` einer Farm** (dieselbe Reichweite, aus der
der Betrieb seine Arbeiter schickt), und Rückbau entfernt nur `fertile`-Overrides
— fremde Debug-Overrides bleiben unangetastet. Belegt durch Test: vor dem Feld
findet `deriveNodesInArea` **null** `crop`-Knoten, danach echte.

Offen: die Bedienung im Farm-Sheet („Felder verwalten", Rechteck ziehen,
Vorschau) und die Darstellung der Felder im Renderer.

---

## 6. Nicht geprüft (ehrliche Grenze)

Dieses Audit misst **Ressourcen-, Terrain- und Level-Voraussetzungen**. Nicht
geprüft wurden: Zufriedenheits-/Bedarfsspiralen, Geldbilanz über die Zeit,
Quest-Reihenfolgen und die Frage, ob die XP-Schwellen (36 → 2.680) sich in
angenehmer Zeit erreichen lassen. Wer das behaupten will, muss eine echte
Zeitsimulation über mehrere Ingame-Stunden fahren — das ist hier nicht passiert.
