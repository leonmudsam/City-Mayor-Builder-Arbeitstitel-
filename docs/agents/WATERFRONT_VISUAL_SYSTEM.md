# Waterfront Placement – visuelles System

Stand: 23. Juli 2026

## Ghost

Die vorhandene Wasserplatzierung wurde visuell erweitert:

- echtes transparentes Drop-in-GLB, wenn `buildingModel(def.id)` vorhanden ist,
- prozedurale Massing-Box als garantierter Fallback,
- halbtransparente Landplattform,
- cyanfarbene Wasserzellen und Wasseranker,
- weiße Gründungspunkte/Pfeiler,
- Fundamentausgleich aus `samplePlacementSurface`,
- Ausrichtungsanzeige und automatische Küstenrotation.

Materialien des GLB werden pro Ghost geklont. Der Modellcache und bereits
gebaute Gebäude bleiben unangetastet.

## HUD

`WaterfrontPlacementHud` ersetzt während einer Wasserplatzierung das generische
Banner. Es zeigt:

- gültig / Straße fehlt / ungültig,
- reale minimale Wassertiefe,
- Fundament-Höhendifferenz,
- Land- und Wasserfootprint,
- Zahl der Wasseranker,
- Rotation und Fehlgrund.

`getWaterfrontPlacementPreview` und `placementDiagnostics` bleiben die einzigen
Regelquellen. Cursorbewegung erzeugt keine Toasts.

## Noch fehlende Daten

- wirtschaftliche Pfeilerkosten,
- kanonische Pfeilerhöhe je Stützpunkt,
- Zufahrtsrampenlänge,
- „hohe Pfeilerkosten“ als echter Warncode,
- expliziter Straßen-Snappoint und Richtungspfeil,
- schmale-Wasserarm-/Klippenwarnungen jenseits der vorhandenen Placement-Codes.

Diese Werte gehören in einen Read-Helper, nicht in React oder Three.js.
