# Active Simplicity — verbindliche Designentscheidung (D-039)

> **Der Spieler entscheidet. Die Stadt arbeitet.** Nicht andersherum.
>
> Entschieden am 25.07.2026 vom Auftraggeber. Diese Datei ist ab sofort die
> **oberste Designregel** des Projekts und schlägt im Konfliktfall jede frühere
> Feature-Planung.

## Die Leitregel

> **Jede Aktion, die der Spieler mehr als drei Mal hintereinander ausführen muss,
> wird automatisiert oder durch ein dauerhaftes Regelwerk ersetzt.**

Ergänzend gilt: Die **Simulation bleibt detailliert** — vereinfacht wird die
*Bedienung*, nicht das Modell. Tiefe im Hintergrund, Ruhe im Vordergrund.

## Warum (Befund)

Das Spiel driftete Richtung *Factorio + Transport Fever + Anno*: Arbeitsgebiet
setzen → Transport planen → Lager wählen → Route wählen → Nachfüllen → Fahrzeug
wählen → starten → beobachten → erneut starten. Dutzende Male. Die Vision war aber
**„Ich bin Bürgermeister und treffe Entscheidungen"**, nicht „Ich bin Logistik-
manager mit 400 Mikromanagement-Aufgaben".

**Ehrliche Selbsteinordnung:** Die Phasen R3/R4/R5 (v1.01/v1.02) haben genau diesen
Drift verstärkt — Lagervergleich, Transportplaner und Nachfüllmarker sind für sich
korrekt, ergeben zusammen aber einen Logistikmanager. Sie werden nicht gelöscht,
sondern **in den Hintergrund geschoben**: sie bleiben als *Detailansicht auf Wunsch*
und als Datenbasis der Automatik.

## Was das ausdrücklich ablöst

Diese Entscheidung **überschreibt** frühere, bewusst getroffene Festlegungen:

| Früher (bleibt als Technik) | Jetzt (Bedienung) |
|---|---|
| **A5/D-032:** Transport ist ein **manuell erteilter** Auftrag | Transport entsteht **automatisch**; manuell ist die Ausnahme |
| **R4:** Spieler wählt Ziel-Lager und Fahrzeug | Spiel wählt: nächstes freies Lager · kürzester Weg · Prioritätslager |
| **R5:** Spieler plant Nachfüllstopps | Nachfüllen passiert automatisch; Marker bleiben nur in der Detailansicht |
| **§26.3:** Arbeitsgebiet je Auftrag neu wählen | Dauerbetrieb (R2, v0.99) ist der Normalfall — bereits erledigt |

Die zugrunde liegenden Systeme (`operations/transport.ts`, `logistics.ts`,
`routeAnalysis.ts`, `shippingRoutes.ts`) bleiben **unverändert die Wahrheit**. Die
Automatik ist ein *Auftraggeber* über ihnen — **kein zweites Transportsystem (§2/§8).**

## Phasen (Reihenfolge = Umsetzung, jede ein testbarer Meilenstein)

- **AS-1 Automatischer Warenfluss** `[P0]` — Ein Betrieb liefert selbstständig ins
  beste erreichbare Lager, sobald sich das lokale Lager füllt. Zielwahl (nächstes
  freies Lager, kürzester Weg), Fahrzeugwahl (bestes verfügbares) und Nachfüllen
  passieren ohne Klick. Nutzt `createInventoryTransfer` unverändert.
  **Ergebnis: Sägewerk bauen → fertig.**
- **AS-2 Warnungen statt Aufgaben** `[P0]` — Kein „Transport planen"-Auftrag mehr,
  sondern „⚠ Rathaus bekommt bald kein Holz mehr [Automatik reparieren]" und
  „⚠ Lager voll [Neues Lager zuweisen]". Ein Klick, nicht neun.
- **AS-3 Gebäudefenster entschlacken** `[P1]` — ~70 % weniger Bedienelemente:
  Produktion · Lager · Arbeitsgebiet · Automatik. Alles Weitere hinter
  „Mehr Details ›".
- **AS-4 Regeln statt Befehle** `[P1]` — Dauerhafte Prioritäten statt Einzelaufträge
  („Holz zuerst: Rathaus, Baustellen"; „Stein immer nach Lager Nord"; „Lager >80 % →
  abtransportieren").
- **AS-5 Ressourcenanzeige beruhigen** `[P1]` — Vorne nur `Holz · 145 verfügbar ·
  +48/min · Alle Lager frei ✓`. Die Aufschlüsselung (global/lokal/reserviert/
  unterwegs) wandert hinter „Details".
- **AS-6 Stadtarbeit wird besonders** `[P1]` — Keine Routine-Lieferungen mehr.
  Stadtarbeit nur noch für Ereignisse: Krankenhaus dringend versorgen, Großbaustelle
  priorisieren, Feuerwehr nach Waldbrand, Festival, Notfallhilfe.
- **AS-7 Straßenbau A→B** `[P1]` — Punkt A, Punkt B, Vorschlag, bauen. Der Router
  existiert bereits (I2/`roadRouting.ts`); es fehlt die Ein-Schritt-Bedienung.
- **AS-8 Bürger begreifbar machen** `[P2]` — Statt „1.800 Einwohner" lieber
  „420 Einwohner · 340 Arbeiter · 80 Kinder". **Hängt am Bevölkerungs-Rebalancing
  (I5 Teil 2)** und braucht dessen Migration.
- **AS-9 Multimodale Selbstverständlichkeit** `[P2]` — Straße→Anleger→Schiff→
  Anleger→Lager entsteht automatisch; der Spieler baut nur die Infrastruktur.
  Baut auf AS-1 + I4.

## Nicht tun

- **Keine Automatik ohne Sichtbarkeit.** Was das Spiel selbst entscheidet, muss
  nachvollziehbar sein (welches Lager, warum) — sonst wirkt es kaputt statt clever.
- **Keine stillen Fehlschläge.** Kann die Automatik nicht liefern, ist das eine
  **Warnung mit Ein-Klick-Lösung**, kein unsichtbarer Stillstand.
- **Kein Entzug von Entscheidungen.** Automatisiert wird *Ausführung*, nie *Wahl*:
  Wo expandieren, was bauen, welche Steuern, welche Bürgerwünsche — bleibt Spieler.
- **Keine zweite Simulation.** Die Automatik erteilt Aufträge an die vorhandenen
  Systeme; sie rechnet nichts eigenes.
- **Keine erfundenen Daten** (unverändert gültig).

## Prüffrage für jedes künftige Feature

> Muss der Spieler das **öfter als dreimal** tun? → Dann ist es eine Regel, keine
> Aktion. Und: Ist das eine **Entscheidung** (behalten) oder **Ausführung**
> (automatisieren)?
