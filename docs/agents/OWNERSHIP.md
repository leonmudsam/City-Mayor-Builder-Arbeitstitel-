# Ownership und Schichtgrenzen

## Verbindliche Zuordnung

| Bereich | Eigentümer / Quelle | Darf | Darf nicht |
| --- | --- | --- | --- |
| Simulation | `src/game/**` + Config + `GameController` | Regeln, Balancing, Commands, deterministische Ableitungen | React, Three.js, Zustand oder Renderer importieren |
| Save/Migration | `newGame.ts`, `storage/migrations.ts`, Save-Tests | lineare Migrationen und Schema-Validierung | Schema still ändern oder alte Saves verwerfen |
| UI | `src/components/**`, `src/state/store.ts`, `src/styles.css`, `src/styles/**` | Snapshots darstellen, Commands senden, lokale Ansichtszustände halten | GameState direkt mutieren oder Regeln duplizieren |
| Renderer | `src/renderer/three/**` | Kamera, Darstellung, Picking, visuelle Effekte, begrenzte Animationen | Ökonomie/Quests/Belohnungen entscheiden |
| Assets | `registry.ts`, `modelManifest.ts`, Manifest-Tests | Drop-in-Dateien laden, Fallbacks wählen | Dateinamen dezentral fest verdrahten |
| Dokumentation | `docs/**` + generierte Dateien | Architektur, Handoff und Entscheidungen erklären | generierte Tabellen manuell vom Config-Stand abkoppeln |

## Codex-/Claude-Handoff

Die v0.69-UI besitzt ausschließlich Darstellung und den noch unbestätigten
Routen-Draft. Kanonische Straßen-, Reihenfolge-, Cargo- und Infrastruktur-
Projektionen liegen in `game/activities/` sowie hinter dem `GameController`.
Claude ergänzt weitere Gameplay-Daten nur an dieser Grenze:

```ts
interface RouteAnalysis {
  orderedTargetIds: string[];
  segments: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    congestionScore: number;
    distanceTiles: number;
  }[];
  estimatedDurationMs: number;
  rewardMultiplier: number;
}
```

Die genaue Form darf angepasst werden, aber:

- Berechnung gehört in eine reine Game-/Graph-Schicht.
- Die UI liest nur das Ergebnis.
- `startActivity`/`setActiveActivityRoute` bleiben die Command-Grenze und nehmen
  optional `{ vehicle, roadPath }` an.
- Keine zweite Aktivität, kein zweiter Questfortschritt, kein paralleler Save.
- Persistierte neue Felder erfordern Schema-Bump und Migration.

Offen und bewusst nicht in der UI geschätzt: mehrere auswählbare Quellen,
Zwischenlager/Rückwaren/Depot-Legs, exakter Warning-Segmentfokus, Steigung,
Straßenqualität, Fahrzeugzustand/Kraftstoff/Schäden und dynamische Routenevents.

Weitere v0.62-Grenzen:

- `CitizenRequest.focusPosition / regionId`: gehört als reine, getestete
  Projektion hinter den Controller; bis dahin bleibt die Kartenaktion deaktiviert.
- `RegionPreview.futureBuildings / unlockProject`: gehört in Config/Progression;
  die UI zeigt bis dahin nur ausdrücklich leere Skeletons.
- `infoLayerMode`: bleibt Präsentationszustand im UI-Store. Die Simulation darf
  niemals von einem aktiven/ausgeschalteten Layer abhängen.
- `EnvironmentSettings.weather`: bleibt lokaler Präsentationszustand. Sonne,
  Regen und Nebel dürfen ohne separate Gameplay-Entscheidung weder Wirtschaft
  noch Bedürfnisse, Quests oder Saves beeinflussen.

## Konfliktvermeidung

Bei paralleler Arbeit nicht gleichzeitig `src/styles.css`, `src/styles/**`,
`src/game/commands/controller.ts` oder `docs/PATCHNOTES.md` ändern. Vor
Übergabe erst Änderungen zusammenführen, dann die vier Pflichtprüfungen und
einen Screenshot-Smoke ausführen.
