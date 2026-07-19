# Ownership und Schichtgrenzen

## Verbindliche Zuordnung

| Bereich | Eigentümer / Quelle | Darf | Darf nicht |
| --- | --- | --- | --- |
| Simulation | `src/game/**` + Config + `GameController` | Regeln, Balancing, Commands, deterministische Ableitungen | React, Three.js, Zustand oder Renderer importieren |
| Save/Migration | `newGame.ts`, `storage/migrations.ts`, Save-Tests | lineare Migrationen und Schema-Validierung | Schema still ändern oder alte Saves verwerfen |
| UI | `src/components/**`, `src/state/store.ts`, `src/styles.css` | Snapshots darstellen, Commands senden, lokale Ansichtszustände halten | GameState direkt mutieren oder Regeln duplizieren |
| Renderer | `src/renderer/three/**` | Kamera, Darstellung, Picking, visuelle Effekte, begrenzte Animationen | Ökonomie/Quests/Belohnungen entscheiden |
| Assets | `registry.ts`, `modelManifest.ts`, Manifest-Tests | Drop-in-Dateien laden, Fallbacks wählen | Dateinamen dezentral fest verdrahten |
| Dokumentation | `docs/**` + generierte Dateien | Architektur, Handoff und Entscheidungen erklären | generierte Tabellen manuell vom Config-Stand abkoppeln |

## Codex-/Claude-Handoff

Die aktuelle Codex-Phase besitzt UI, Renderer-Polish und die visuelle
Routenplaner-Projektion. Claude sollte als nächstes echte Gameplay-Daten nur an
der vorhandenen Grenze ergänzen:

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
- `startActivity`/`setActiveActivityRoute` bleiben die Command-Grenze.
- Keine zweite Aktivität, kein zweiter Questfortschritt, kein paralleler Save.
- Persistierte neue Felder erfordern Schema-Bump und Migration.

`TODO(CLAUDE_LOGIC)` in `ActivityRoutePlanner.tsx` markiert die aktuelle
Schätzstelle.

## Konfliktvermeidung

Bei paralleler Arbeit nicht gleichzeitig `src/styles.css`,
`src/game/commands/controller.ts` oder `docs/PATCHNOTES.md` ändern. Vor
Übergabe erst Änderungen zusammenführen, dann die vier Pflichtprüfungen und
einen Screenshot-Smoke ausführen.
