# Agenten-Übergabe

Dieser Ordner ist der kurze, verbindliche Einstieg für die Weiterarbeit mit
Claude, Codex oder einem anderen Entwicklungsagenten. Er ergänzt die
Langzeitdokumente; er ersetzt weder `AGENTS.md` noch `docs/ARCHITECTURE.md`.

## Lesereihenfolge

Für World Rebuild 6.0 zuerst `NEW_ISLAND_AUDIT.md`,
`NEW_ISLAND_REBUILD_PLAN.md`, `NEW_ISLAND_PART_MAP.md`,
`NEW_ISLAND_REGION_PLAN.md`, `NEW_ISLAND_MATERIAL_MATRIX.md` und
`NEW_ISLAND_INFRASTRUCTURE.md` lesen. Diese Dokumente überstimmen die
historischen 384²-/32-Regionen-Angaben der älteren Map-Redesign-Berichte.

1. `PROJECT_STATE.md` — was aktuell wirklich läuft.
2. `OWNERSHIP.md` — welche Schicht welche Verantwortung besitzt.
3. `MAP_REDESIGN_AUDIT.md`, `MAP_REDESIGN_PLAN.md` und
   `REGION_VISUAL_REDESIGN.md` — aktuelle Weltpipeline, Abnahme und Regionsmatrix.
4. `TERRAIN_MATERIAL_MATRIX.md` und `WORLD_ASSET_MANIFEST.md` — aktive
   Materialien, KI-Quellen, Modellnamen und ehrliche Drop-in-Lücken.
5. `UI_SYSTEM.md` und `UI_COMPONENT_MAP.md` — visuelle Regeln und Quellorte.
6. `DECISIONS.md` — bindende Entscheidungen und verworfene Alternativen.
7. `OPEN_TASKS.md` — nächste sichere Arbeitspakete.
8. `HANDOFF_LOG.md` — chronologische Änderungen und Prüfergebnisse.
9. `UI_ASSET_MANIFEST.md` — Herkunft, Nutzung und Fallbacks der UI-Assets.
10. `CODEX_VISUAL_AUDIT.md` — historische v0.62-Visualgrundlage und Tests.
11. `VISUAL_ROADMAP.md` — erledigte und spätere Mockup-Bausteine.

Für Map und Stadtarbeit zusätzlich zuerst `../HANDOFF_CLAUDE.md` lesen; dort
stehen die v0.71-Renderergrenzen, v0.69-Read-Verträge und alle exakt benannten
`TODO(CLAUDE_LOGIC)`-Lücken.

## Verbindliche Hauptquellen

- Arbeitsregeln: `AGENTS.md`
- Architektur: `docs/ARCHITECTURE.md`
- Projektstrategie: `docs/PROJECT_STRATEGY.md`
- UI-Audit: `docs/UI_AUDIT.md`
- Overhaul-Plan: `docs/OVERHAUL_3_PLAN.md`
- Patch Notes: `docs/PATCHNOTES.md`

Bei Widerspruch gilt: `AGENTS.md` → Architektur/Config/Tests → diese Übergabe.
