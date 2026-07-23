# RESOURCE NODE SYSTEM — Ressourcenknoten (§ Active Operations 2.0)

Code: `src/game/operations/nodes.ts`. Rein (kein Renderer/React).

## Prinzip: ableiten, nicht speichern

Verfügbare Naturressourcen (Bäume) sind — wie das Terrain und die Kachel-Belegung
— **deterministisch aus der Welt abgeleitet**, nicht persistiert. Eine Kachel trägt
einen Baumknoten, wenn:

1. ihr Terrain `forest` ist (`worldTerrainAt`, inkl. sparse Overrides),
2. sie nicht überbaut ist (`tileAt(...).buildingId` leer, §26.15),
3. ein deterministischer Positions-Hash (`hash01(x,y) < 0.5`) sie auswählt.

Die **NodeId ist `"x,y"`** — eine stabile Id ohne Speicherbedarf (§3.1). Ein
Renderer kann eine Instanz später über diese Id einem Simulationsknoten zuordnen.

## Persistiert wird nur das Delta

`state.operations.nodeDeltas[nodeId]` (`ResourceNodeDelta`) hält ausschließlich
Abweichungen vom Grundzustand:

| Feld | Bedeutung |
|---|---|
| `remaining` | verbleibende Menge, falls angearbeitet (< `TREE_MAX_AMOUNT` = 32) |
| `reservedBy` | Betrieb+Arbeiter-Tag, der den Knoten bearbeitet |
| `depletedAt` | Zeitpunkt der Erschöpfung |
| `regenerationAt` | Zeitpunkt, ab dem der Baum wieder verfügbar ist |

`resolveNode(state, nodeTerrain, id, now)` überlagert den Grundzustand mit dem Delta
und liefert eine `ResourceNode`-Laufzeitsicht (`available`/`reserved`/`depleted`/
`regrowing`). Nachgewachsene Knoten werden im Tick (`regenerateNodes`) durch Löschen
ihres Deltas wieder voll verfügbar — Regeneration passiert damit **nur auf gültigem
Terrain** (die Ableitung garantiert es, §26.14/15).

## Warum so

- **Save bleibt winzig** (dieselbe Slim-Save-Philosophie wie Terrain/Belegung).
- **Kein Riesen-Array** für zehntausende Bäume der ganzen Insel — Knoten entstehen
  nur dort, wo ein Betrieb sie braucht (Arbeitsgebiet), on demand.
- **Deterministisch** ⇒ testbar und plattformunabhängig (Browser = Tauri).

## Offen (nächste Phasen)

- Weitere Knotentypen (`rock`/`crop`/`livestock`) für Steinbruch/Farm (A6/A7) —
  dasselbe Muster, anderes `nodeTerrain`.
- Aufforstung/neue Vorkommen (A9): Setzlinge, `RegenerationProfile`-gesteuerte
  Zieldichte statt fester Nachwachszeit.
- 3D-Einzelbaum-Raycast im Arbeitsmodus (Renderer), damit einzelne Bäume angeklickt
  werden können; aktuell wählt der Betrieb sein Arbeitsgebiet über das Gebäudefenster.
