# Frühlogistik — Handkarren ab L2 + Lagersichtbarkeit (P-C)

> Teil des Spielbarkeits-Auftrags (Nutzer, 24.07.2026). Befund: „In Level 2–3 kann
> Holz aus dem Sägewerk nicht sinnvoll zum Rathauslager transportiert werden."

## 1. Ursache

Das **Sägewerk ist ab Level 2 baubar**, der erste Transportträger (**Lieferwagen**)
aber erst ab **Level 4**. In L2–3 gab es also **kein** Fahrzeug für einen
Lagertransport → lokal geerntetes Holz blieb im Sägewerk-Lager gebunden, der frühe
Baufortschritt stockte. Die Transport-Maschinerie (A5, `operations/transport.ts`) war
vorhanden und korrekt — es fehlte nur ein früh verfügbares Fahrzeug.

## 2. Fix — Handkarren (`handcart`, unlockLevel 2)

Neuer Eintrag im **bestehenden** Fahrzeugkatalog (`activities.config.ts`), kein neues
System:

| Feld | Wert | Warum |
|---|---|---|
| unlockLevel | 2 | schließt die Lücke vor dem Lieferwagen (L4) |
| capacity | 40 | kleine Ladung — mehrere Fahrten für größere Mengen |
| speedKph | 22 | langsam (zu Fuß gezogen) |
| operatingCost | 0 | kein Motor → keine Betriebskosten |
| handling | 5 | wendig, keine Engstellen-Strafe |

Additiv: neuer `DriveVehicle`-Wert `'handcart'` (Type + Zod-Enum), i18n
`vehicle.handcart(.desc)`, Stärke/Schwäche-Keys wiederverwendet. Der Renderer fällt
für unbekannte Fahrzeug-Ids auf das Van-Modell zurück (`?? VAN_MODELS`) — ein echtes
Handkarren-`.glb` ist drop-in-fähig (§5). **Keine Save-Änderung** (v21): Fahrzeuge sind
Config, kein State.

Der Handkarren erscheint **nur** im Lagertransport (Sägewerk-Sheet), nicht in
Stadtarbeit-Missionen (keine Mission listet ihn) — genau die frühe Holz-Kette
Sägewerk → Rathauslager.

## 3. Lagersichtbarkeit (§6)

Die volle **Ressourcennetz-Übersicht** existierte bereits (`ResourceNetworkPanel`:
Gesamtbestand, für Bau verfügbar, in Betriebslagern, unterwegs, reserviert +
Standortliste inkl. Rathaus/Lagerhäusern mit Kapazitätsbalken, Kamera-Fokus). Sie war
nur hinter einem Link vergraben. P-C macht die Kernaufteilung **direkt im
Ressourcen-Popover** sichtbar: „Für Bau verfügbar", „In Betrieben (lokal)",
„Unterwegs", „Reserviert" (nur belegte Zeilen). Der Zentralbestand ist **ein
gemeinsamer Pool** (Rathaus + Lagerhäuser liefern Kapazität, nicht getrennte
Bestände) — die Aufteilung je Gebäude bleibt der vollen Übersicht vorbehalten,
**nichts wird erfunden**.

## 4. Tests (`tests/earlyLogistics.test.ts`, 4 Fälle)

Handkarren ab L2 verfügbar (Lieferwagen erst L4) · Sägewerk-Holz fährt mit dem
Handkarren ins Rathauslager (der frühere Blocker) · Handkarren klein & kostenlos ·
voller Loop: Holz landet nach Ankunft im Zentrallager. Belegt §17 „Frühlogistik".

## 5. Offen (nicht vorgetäuscht)

- Echtes Handkarren-`.glb`/-Bild (aktuell Van-Fallback).
- Weitere frühe Stufen (Pferdewagen o. Ä.) nach Bedarf — additiv im selben Katalog.
- §9-Feintuning von Kapazität/Tempo nach Spielgefühl.
