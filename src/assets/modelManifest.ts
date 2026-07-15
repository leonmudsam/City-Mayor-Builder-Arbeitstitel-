// Single source of truth for every 3D model the true3d renderer wires in (v0.34).
//
// The ThreeMapRenderer imports the arrays below to decide which `.glb` to load per
// category, and the per-folder `src/assets/models/<folder>/README.md` files are
// GENERATED from the same data (see tests/modelReadmes.test.ts). So the docs can
// never drift from what the code actually loads: add an accepted name here, the
// renderer picks it up AND the folder README updates on the next generation.
//
// "First match wins" everywhere — precise name first, short alias after. A missing
// model always falls back to the procedural stand-in, so the game never breaks.

import type { TerrainType } from '../game/types.ts';

// ---- accepted model names (consumed by ThreeMapRenderer) --------------------

/** Terrain tile model per terrain type (models/terrain/…). Replaces the coloured
 *  base tile. Precise name first, then a short alias. */
export const TERRAIN_TILE_MODELS: Record<TerrainType, readonly string[]> = {
  grass: ['grass_tile', 'grass'],
  forest: ['forest_ground_tile', 'forest'],
  water: ['ocean_tile', 'water'],
  river: ['river_straight', 'river', 'water'],
  mountain: ['mountain_ground_tile', 'rock_ground_tile', 'mountain'],
  sand: ['sand_tile', 'shore_tile', 'sand'],
  fertile: ['fertile_ground_tile', 'fertile'],
};
/** Raised mountain feature scattered on mountain tiles (models/terrain/mountains/). */
export const MOUNTAIN_FEATURE_MODELS = [
  'mountain_peak_medium',
  'mountain_peak_large',
  'rock_large',
  'mountain_peak',
] as const;

/** Vegetation props (models/props/nature/), culled off the city footprint. */
export const TREE_MODELS = ['pine_tree', 'tree_pine', 'tree', 'tree_deciduous'] as const;
export const BUSH_MODELS = ['bush_small', 'bush', 'bush_medium'] as const;

/** Traffic car + delivery van (models/vehicles/). Author facing +z. */
export const VEHICLE_CAR_MODELS = ['car', 'car_small', 'car_sedan', 'car_van'] as const;
export const VAN_MODELS = ['service_van', 'car_van', 'van', 'delivery_van', 'truck_food'] as const;

/** Chimney smoke effect (models/effects/). */
export const SMOKE_EFFECT_MODELS = ['smoke_chimney', 'smoke', 'steam', 'smoke_puff'] as const;

/** Bridge over water/river (models/bridges/). */
export const BRIDGE_MODELS = [
  'bridge_medium_road',
  'bridge_small_stone',
  'bridge_small_wood',
  'bridge_large_road',
  'bridge_road',
  'bridge',
] as const;

/** Floating status marker per kind (models/markers/). */
export const MARKER_MODELS = {
  activity: ['marker_task', 'marker_activity', 'marker_target'],
  construction: ['marker_construction', 'marker_build'],
  problem: ['marker_problem', 'marker_alert'],
  upgrade: ['marker_upgrade', 'marker_bonus', 'marker_arrow'],
} as const;

/** World-space 3D UI models (models/ui/) — selection ring, floating action
 *  buttons and badges the renderer floats above buildings (v0.34). */
export const UI_SELECTION_RING_MODELS = ['ui_selection_ring', 'selection_ring'] as const;
export const UI_UPGRADE_BUTTON_MODELS = ['ui_upgrade_button', 'ui_button_upgrade', 'button_upgrade'] as const;
export const UI_BUILD_BUTTON_MODELS = ['ui_build_button', 'ui_button_build', 'button_build'] as const;
export const UI_LEVEL_BADGE_MODELS = ['ui_level_badge', 'level_badge', 'ui_badge'] as const;

/** Construction-site model shown while a building is built OR upgraded (v0.34).
 *  Resolved per building first (`<id>_construction.glb`, see BUILD_CONSTRUCTION_SUFFIX),
 *  then a generic model from models/props/construction/, then procedural scaffold. */
export const CONSTRUCTION_MODELS = ['construction_site', 'construction_crane', 'scaffold', 'crane'] as const;
/** Suffix for a per-building construction model, e.g. `sawmill_construction.glb`. */
export const BUILD_CONSTRUCTION_SUFFIX = '_construction';
/** Suffix for a per-building/-part upgrade stage model, e.g. `house_small_stage3.glb`
 *  (stage N ≙ upgradeLevel N-1; the base `<id>.glb` covers every stage otherwise). */
export const BUILD_STAGE_PREFIX = '_stage';

// ---- category → building subfolder ------------------------------------------

/** Recommended organisational subfolder under models/buildings/ per game category
 *  (recognition is by filename, so this is only tidy-up guidance). */
export const BUILDING_CATEGORY_FOLDER: Record<string, string> = {
  government: 'administration',
  residential: 'housing',
  production: 'resources',
  infrastructure: 'resources',
  services: 'services',
  economy: 'economy',
  energy: 'energy',
  leisure: 'leisure',
  decoration: 'leisure',
  special: 'landmarks',
  roads: 'roads',
};

// ---- folder documentation model ---------------------------------------------

export interface ModelDocRow {
  purpose: string;
  names: readonly string[];
  note?: string;
}
export interface ModelFolderDoc {
  /** Key used for the file path: src/assets/models/<key>/README.md */
  key: string;
  title: string;
  loader: string;
  intro: string;
  rows: ModelDocRow[];
}

/** Non-building folders, documented straight from the arrays above. The buildings
 *  folder is generated separately from buildings.config (see buildBuildingsReadme). */
export const MODEL_FOLDER_DOCS: ModelFolderDoc[] = [
  {
    key: 'terrain',
    title: 'Terrain & Gebirge',
    loader: 'terrainModel',
    intro:
      'Bodenkacheln je Terraintyp (ersetzen die farbige Basis-Kachel) und ' +
      'gestreute Gebirgs-Features. Unterordner (tiles/water/mountains/…) sind reine ' +
      'Organisation — erkannt wird rekursiv per Dateiname.',
    rows: [
      { purpose: 'Kachel Gras', names: TERRAIN_TILE_MODELS.grass },
      { purpose: 'Kachel Wald', names: TERRAIN_TILE_MODELS.forest },
      { purpose: 'Kachel Meer', names: TERRAIN_TILE_MODELS.water },
      { purpose: 'Kachel Fluss', names: TERRAIN_TILE_MODELS.river },
      { purpose: 'Kachel Gebirge', names: TERRAIN_TILE_MODELS.mountain },
      { purpose: 'Kachel Sand/Küste', names: TERRAIN_TILE_MODELS.sand },
      { purpose: 'Kachel fruchtbar', names: TERRAIN_TILE_MODELS.fertile },
      { purpose: 'Gebirgs-Feature (gestreut)', names: MOUNTAIN_FEATURE_MODELS, note: 'auf ~⅓ der Gebirgs-Kacheln' },
    ],
  },
  {
    key: 'roads',
    title: 'Straßen',
    loader: 'roadModel',
    intro:
      'Straßensegmente werden nach 4-Bit-Nachbarmaske gewählt und 90°-weise gedreht. ' +
      'Kanonik: gerade = N–S, Kurve = N+E, T = offen nach W, Ende = Arm nach N. ' +
      'Klassenvarianten (`road_main_*`) werden vor dem generischen Namen bevorzugt.',
    rows: [
      { purpose: 'Gerade', names: ['road_main_straight', 'road_straight'], note: 'kanonisch N–S' },
      { purpose: 'Kurve', names: ['road_main_curve', 'road_curve'], note: 'kanonisch N+E' },
      { purpose: 'T-Kreuzung', names: ['road_main_t_intersection', 'road_t_intersection'] },
      { purpose: 'Kreuzung', names: ['road_main_cross_intersection', 'road_cross_intersection'] },
      { purpose: 'Ende/Stich', names: ['road_main_end', 'road_end'] },
    ],
  },
  {
    key: 'bridges',
    title: 'Brücken',
    loader: 'bridgeModel',
    intro: 'Wird verwendet, wenn eine Straße auf Wasser/Fluss liegt. Entlang der Straßenachse gedreht.',
    rows: [{ purpose: 'Brücke über Wasser', names: BRIDGE_MODELS }],
  },
  {
    key: 'props',
    title: 'Props & Vegetation',
    loader: 'propModel',
    intro:
      'Vegetation wird gegen die Stadt gecullt (nie auf Gebäude/Straße). Baustellen-' +
      'Modelle (construction/) werden während Bau & Upgrade genutzt. Unterordner ' +
      '(nature/city/harbor/farm/construction) sind reine Organisation.',
    rows: [
      { purpose: 'Baum', names: TREE_MODELS, note: 'gecullt, instanziert' },
      { purpose: 'Busch', names: BUSH_MODELS, note: 'gecullt, instanziert' },
      { purpose: 'Baustelle (Bau & Upgrade)', names: CONSTRUCTION_MODELS, note: 'generisch; pro Gebäude: <id>_construction.glb' },
    ],
  },
  {
    key: 'vehicles',
    title: 'Fahrzeuge',
    loader: 'vehicleModel',
    intro: 'Front zeigt +z (Fahrtrichtung). Verkehr und Stadtarbeit-Van.',
    rows: [
      { purpose: 'Verkehrsauto', names: VEHICLE_CAR_MODELS },
      { purpose: 'Liefer-Van (Stadtarbeit)', names: VAN_MODELS },
    ],
  },
  {
    key: 'markers',
    title: 'Marker (schwebende Statusanzeigen)',
    loader: 'markerModel',
    intro: 'Ein Marker pro Gebäude (Priorität: Aufgabe > Bau > Problem > Upgrade). Schwebt und rotiert.',
    rows: [
      { purpose: 'Aufgabe / Kartenziel', names: MARKER_MODELS.activity },
      { purpose: 'Im Bau', names: MARKER_MODELS.construction },
      { purpose: 'Problem', names: MARKER_MODELS.problem },
      { purpose: 'Upgrade verfügbar', names: MARKER_MODELS.upgrade },
    ],
  },
  {
    key: 'effects',
    title: 'Effekte',
    loader: 'effectModel',
    intro: 'Partikel-/Look-Effekte. Rauch am Schornstein aktiver Produktion.',
    rows: [{ purpose: 'Schornstein-Rauch', names: SMOKE_EFFECT_MODELS }],
  },
  {
    key: 'ui',
    title: 'Welt-UI (3D-Anzeigen über Gebäuden)',
    loader: 'uiModel',
    intro:
      'Schwebende 3D-UI: Auswahlring, Upgrade-/Bau-Buttons und Level-Badge über dem ' +
      'ausgewählten bzw. betroffenen Gebäude. Ohne Modell zeichnet der Renderer die ' +
      'prozedurale Variante (z. B. den leuchtenden Auswahlring).',
    rows: [
      { purpose: 'Auswahlring', names: UI_SELECTION_RING_MODELS, note: 'unter dem ausgewählten Gebäude' },
      { purpose: 'Upgrade-Button (schwebend, klickbar)', names: UI_UPGRADE_BUTTON_MODELS },
      { purpose: 'Bau-/Aktions-Button (schwebend)', names: UI_BUILD_BUTTON_MODELS },
      { purpose: 'Level-Badge', names: UI_LEVEL_BADGE_MODELS },
    ],
  },
];

// ---- README rendering (pure) ------------------------------------------------

function table(rows: ModelDocRow[]): string {
  const head = '| Zweck | Akzeptierte Dateinamen (Priorität →) | Hinweis |\n|---|---|---|';
  const body = rows
    .map((r) => `| ${r.purpose} | ${r.names.map((n) => `\`${n}.glb\``).join(' → ')} | ${r.note ?? ''} |`)
    .join('\n');
  return `${head}\n${body}`;
}

const GEN_BANNER =
  '> **Auto-generiert** aus `src/assets/modelManifest.ts`. Nicht von Hand editieren.\n' +
  '> Neue Modelle dazunehmen: Namen dort ergänzen, dann\n' +
  '> `WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts` (schreibt diese Dateien neu).\n' +
  '> Der Test schlägt fehl, sobald eine README veraltet ist.';

/** Markdown for one non-building folder README. */
export function renderFolderReadme(doc: ModelFolderDoc): string {
  return (
    `# 3D-Modelle — ${doc.title}\n\n` +
    `${GEN_BANNER}\n\n` +
    `Ordner: \`src/assets/models/${doc.key}/\`  ·  Loader: \`${doc.loader}()\`  ·  ` +
    `Schlüssel = Dateiname (rekursiv).\n\n` +
    `${doc.intro}\n\n` +
    `${table(doc.rows)}\n\n` +
    `Fehlt ein Modell, greift der prozedurale Fallback — das Spiel bricht nie.\n`
  );
}

// ---- buildings README (from buildings.config) -------------------------------

export interface BuildingLike {
  id: string;
  category: string;
  size: { w: number; h: number };
  unlockLevel: number;
  upgrades?: unknown[];
}

/** Markdown for the buildings folder README, derived from the building config so
 *  it always lists every building, its stage count, and its construction model. */
export function buildBuildingsReadme(buildings: readonly BuildingLike[]): string {
  const rows = buildings
    .filter((b) => b.category !== 'roads')
    .map((b) => {
      const stages = (b.upgrades?.length ?? 0) + 1;
      const folder = BUILDING_CATEGORY_FOLDER[b.category] ?? 'buildings';
      const stageFiles =
        stages > 2
          ? `\`${b.id}${BUILD_STAGE_PREFIX}2\`…\`${b.id}${BUILD_STAGE_PREFIX}${stages}\``
          : stages === 2
            ? `\`${b.id}${BUILD_STAGE_PREFIX}2\``
            : '—';
      return `| ${b.id} | \`${b.id}.glb\` | ${folder}/ | ${b.size.w}×${b.size.h} | ${b.unlockLevel} | ${stages} | ${stageFiles} | \`${b.id}${BUILD_CONSTRUCTION_SUFFIX}.glb\` |`;
    })
    .join('\n');
  return (
    `# 3D-Modelle — Gebäude\n\n` +
    `${GEN_BANNER}\n` +
    `> Die Gebäudeliste kommt zusätzlich aus \`src/game/config/buildings.config.ts\` — ` +
    `neue Gebäude erscheinen automatisch.\n\n` +
    `Ordner: \`src/assets/models/buildings/\`  ·  Loader: \`buildingModel(id, stage)\`  ·  ` +
    `**Dateiname = Gebäude-ID** (rekursiv, Unterordner nur zur Organisation).\n\n` +
    `**Stufen/Upgrades:** \`<id>.glb\` deckt alle Stufen ab (Auto-Skalierung). Optionale ` +
    `eigene Stufen-Modelle heißen \`<id>_stage2.glb\` … \`_stage<N>\` (Stufe N ≙ Upgrade-Level N−1). ` +
    `**Baustelle:** während Bau *und* Upgrade zeigt der Renderer \`<id>_construction.glb\`, ` +
    `sonst ein generisches Baustellen-Prop (\`construction_site.glb\`), sonst prozedurales Gerüst.\n\n` +
    `| ID | Datei | Unterordner | Footprint | Ab Level | Stufen | Stufen-Dateien | Baustelle |\n` +
    `|---|---|---|---|---|---|---|---|\n` +
    `${rows}\n\n` +
    `Die Straßen-ID \`road\` nutzt kein \`buildings/road.glb\`, sondern das Straßen-Segment-System ` +
    `(\`src/assets/models/roads/\`).\n`
  );
}
