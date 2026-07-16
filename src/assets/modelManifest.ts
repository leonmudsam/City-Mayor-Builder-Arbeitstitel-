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

// ---- Generierungs-Prompts (PROMPTS.md je Ordner) ----------------------------
// Fertige Text-zu-3D-Prompts (Meshy/Rodin/Tripo/Luma …): jeder Block ist copy-paste-
// fertig (Stil-Prefix + Motiv). Aus derselben Quelle generiert wie die READMEs; der
// Test tests/modelReadmes.test.ts hält sie synchron. Motive bewusst auf Englisch,
// da die Text-zu-3D-Tools damit am besten arbeiten.

/** Shared style/technical prefix — identisch zu docs/3D_WORLD_ASSETS.md §6. */
export const STYLE_PREFIX =
  'Low-poly stylized 3D city-builder game asset, colorful cartoon look, clean shapes, ' +
  'soft bevels, hand-painted feel, optimized for realtime rendering, embedded textures, ' +
  'no lights, no cameras, centered object, pivot at bottom center, +Y up, front facing +Z —';

/**
 * Maßstab & Proportionen (v0.39). **1 Kachel ≈ 4 m.** Der Boden ist ein
 * organisches Höhenfeld (Hügel/Gebirge geneigt, Wasser abgesenkt); alle Modelle
 * werden automatisch auf die Bodenhöhe an ihrer Kachel gesetzt. Deshalb:
 * **Pivot unten-mittig, flache/definierte Unterseite, nichts schwebt.** Richtwerte
 * für die Höhe (in Kacheln, damit die Größen zueinander stimmen — eine Parkbank
 * ist NICHT so groß wie ein Baum):
 *
 * - Baum ≈ 1.4–1.8 · Strauch ≈ 0.5 · Hecke ≈ 0.5 · Parkbank ≈ 0.4 · Laterne ≈ 0.9
 * - Brunnen ≈ 0.9 · Blumenbeet ≈ 0.3 · Fels klein ≈ 0.4 · Fels groß ≈ 1.0
 * - kleines Haus (2×2) ≈ 1.4 hoch · Gebirgsgipfel groß · Straße/Kachel flach
 *
 * Gebäude füllen ihren Footprint; kleine Deko-/Natur-Props behalten ihre reale
 * Höhe (siehe DECO_TARGET_HEIGHT im Renderer). Straßen/Bodenkacheln bleiben flach
 * und kachelbar, damit sie sauber auf der geneigten Oberfläche liegen.
 */
export const SCALE_NOTE =
  'Maßstab 1 Kachel ≈ 4 m · Pivot unten-mittig, nichts schwebt · Höhen-Richtwerte: ' +
  'Baum ≈ 1.4–1.8, Strauch ≈ 0.5, Bank ≈ 0.4, Laterne ≈ 0.9, Fels ≈ 0.4–1.0, Brunnen ≈ 0.9 (Kacheln).';

export interface PromptEntry {
  /** Dateiname ohne `.glb`. */
  name: string;
  /** Footprint/Größe, z. B. "2×2" (optional). */
  footprint?: string;
  /** Englisches Motiv, wird an STYLE_PREFIX gehängt. */
  motif: string;
}
export interface PromptGroup {
  title: string;
  note?: string;
  entries: PromptEntry[];
}
export interface FolderPrompts {
  key: string;
  title: string;
  intro: string;
  groups: PromptGroup[];
}

/** Ein Motiv je Config-Gebäude (Dateiname = ID). Der Test erzwingt Vollständigkeit,
 *  d. h. jedes neue Gebäude braucht hier einen Eintrag. */
export const BUILDING_PROMPTS: Record<string, string> = {
  town_hall: 'a grand town hall with a clock tower, columns, a flag and a red roof, a small plaza in front',
  mayor_house: "an elegant mayor's residence, larger than a normal house, with a small portico, bay windows and a tidy front garden",
  district_center: 'a modern district administration building, wide facade with a glass entrance, flags and a small forecourt',
  house_small: 'a small cozy family house with a red pitched roof, a chimney, a tiny front garden and warm windows',
  house_row: 'a short terraced row house of two to three joined units with pitched roofs and small doorsteps',
  apartment: 'a mid-rise apartment building, three to four floors, balconies, a low roof and a tidy entrance',
  residential_tower: 'a tall residential tower with many balconies, a flat roof and a modern colorful facade',
  sawmill: "a wooden sawmill with a pitched roof, log piles, a saw shed and a chimney (name the chimney node 'chimney')",
  quarry: 'a stone quarry site with terraced rock, a small crane, gravel piles and a work shed',
  farm: 'a farm with a barn, a farmhouse, silos and fenced fields, warm rural look',
  well: 'a small stone village well with a little wooden roof and a bucket',
  water_pump: 'a compact water pumping station: a small building with pipes, valves and a tank',
  warehouse: 'a rectangular storage warehouse with large roller doors, a flat roof and loading bays',
  depot: 'a logistics depot: a large shed with loading docks, crates, a small yard and parked trailers',
  waterworks: 'a waterworks facility with round filtration tanks, pipes and a control building',
  market: 'a small market hall with striped awnings, crates of produce and a paved front',
  supermarket: 'a modern supermarket: a wide flat building with a big storefront, a sign board and a small parking strip',
  bakery: 'a charming corner bakery with a shop window, an awning and a chimney, warm inviting look',
  fire_station: 'a fire station with a red facade, large garage doors, a small tower and a flag',
  police_station: 'a police station: a sturdy civic building with blue accents, an entrance porch and a flag',
  hospital: 'a hospital with a clean white facade, a red cross sign, an ambulance bay and many windows',
  trading_post: 'a trading post / merchant house with crates, barrels, an awning and a hanging sign',
  shop_small: 'a small retail shop with a colorful storefront, an awning and a sign',
  office: 'a wide low-rise office building with a glass facade, clean modern lines and an entrance plaza',
  power_plant: "a coal power plant: a large hall with tall smokestacks emitting steam (name a smokestack node 'chimney')",
  wind_farm: "a wind power station: a base building with a white wind turbine; put the rotor blades on a node named 'rotor' so they can spin",
  park: 'a small green park with trees, paths, benches and a lawn, low and flat',
  playground: 'a children playground with a swing, a slide, a sandbox and colorful equipment on a soft ground',
  deco_tree: 'a single decorative ornamental tree on a small planter base',
  deco_flowerbed: 'a small decorative flowerbed with colorful flowers and a low border',
  deco_fountain: 'a small ornamental fountain with a round basin and a gentle water spout',
  deco_bench: 'a small park bench with a nearby lamp or planter on a paved patch',
};

/** Geplante Landmarken/Hero-Bauten (noch keine Config-IDs; siehe 3D_WORLD_ASSETS §13). */
export const BUILDING_LANDMARK_PROMPTS: PromptEntry[] = [
  { name: 'lighthouse', footprint: '2×2', motif: 'a red-and-white striped lighthouse on a rocky base with a lantern room' },
  { name: 'harbor_small', footprint: '4×4 / modular', motif: 'a small harbor with wooden piers, bollards, crates and a calm water edge' },
  { name: 'harbor_pier', footprint: 'modular', motif: 'a wooden harbor pier segment with planks and posts, extends over water' },
  { name: 'ship_sailing', footprint: '2×4', motif: 'a small stylized sailing ship / cargo boat, front facing +Z, readable silhouette' },
  { name: 'monument_city', footprint: '2×2', motif: 'a city monument: a stone obelisk or statue on a stepped base with a small plaza' },
  { name: 'museum', footprint: '3×3', motif: 'a classical museum with columns, a wide staircase, a pediment and a flag' },
  { name: 'stadium', footprint: '4×4', motif: 'a small sports stadium with tiered stands, a pitch and floodlights' },
  { name: 'observation_tower', footprint: '2×2', motif: 'a tall slim observation tower with a viewing platform at the top' },
  { name: 'mountain_tunnel_landmark', footprint: '3×3', motif: 'a mountain tunnel / mine entrance carved into rock, with a portal, rails and props' },
  { name: 'hero_city_hall_plaza', footprint: '6×6, modular', motif: 'a hero city-hall plaza: the town hall with a grand paved square, fountains and greenery' },
  { name: 'hero_harbor_complex', footprint: '6×6, modular', motif: 'a hero harbor complex: piers, cranes, warehouses, moored boats and a promenade' },
  { name: 'hero_lighthouse_cliff', footprint: '6×6, modular', motif: 'a hero coastal cliff with a lighthouse on top, rocky shore and crashing waves' },
  { name: 'hero_grand_bridge', footprint: 'modular', motif: 'a hero grand stone-and-steel bridge spanning a wide river valley with towers' },
  { name: 'hero_central_park', footprint: '6×6, modular', motif: 'a hero central park: lawns, tree clusters, ponds, paths, a bandstand and benches' },
];

/** Prompt-Katalog je Nicht-Gebäude-Ordner: aktiv genutzte + geplante Modelle. */
export const FOLDER_PROMPTS: FolderPrompts[] = [
  {
    key: 'terrain',
    title: 'Terrain & Gebirge',
    intro:
      'Bodenkacheln (1×1, kachelbar) und Gebirgs-/Hero-Formen. **Der Boden ist ein organisches ' +
      'Höhenfeld** — Hügel/Gebirge sind geneigt, Wasser abgesenkt; Kachel-/Fels-/Gipfel-Modelle ' +
      'werden automatisch auf die Bodenhöhe gesetzt. Deshalb **Pivot unten-mittig, flache Unterseite, ' +
      'nichts schwebt**; Gebirge groß & sauber (klare Felsflächen, keine losen Teile). ' +
      SCALE_NOTE,
    groups: [
      {
        title: 'Aktiv genutzt (Kacheln je Terraintyp)',
        entries: [
          { name: 'grass_tile', footprint: '1×1', motif: 'a flat green grass meadow tile, subtle micro-detail, tileable edges' },
          { name: 'forest_ground_tile', footprint: '1×1', motif: 'a forest floor tile with moss, roots and a few leaves, tileable' },
          { name: 'ocean_tile', footprint: '1×1', motif: 'a calm sea water tile with a gentle stylized wave, deep blue, tileable' },
          { name: 'river_straight', footprint: '1×1', motif: 'a straight flowing blue river water tile, gentle current, tileable along its axis' },
          { name: 'mountain_ground_tile', footprint: '1×1', motif: 'a steep grey rocky mountain ground tile, tileable' },
          { name: 'sand_tile', footprint: '1×1', motif: 'a light sandy beach tile, tileable' },
          { name: 'fertile_ground_tile', footprint: '1×1', motif: 'a ploughed fertile farmland soil tile with brown furrows, tileable' },
          { name: 'mountain_peak_medium', footprint: '1–2 tiles', motif: 'a stylized rocky mountain peak / large boulder cluster, layered rock, no snow' },
        ],
      },
      {
        title: 'Geplant (Wasser, Gebirge, Klippen, Hero)',
        note: 'Noch nicht verdrahtet, aber vom Weltbild vorgesehen (siehe docs/3D_WORLD_ASSETS.md §7–§10).',
        entries: [
          { name: 'grass_tile_variant_01', footprint: '1×1', motif: 'a grass tile variant with tufts and small stones, tileable' },
          { name: 'shore_tile', footprint: '1×1', motif: 'a shoreline tile where grass meets water, tileable' },
          { name: 'river_curve', footprint: '1×1', motif: 'a curved river water tile connecting two adjacent edges, tileable' },
          { name: 'lake_center', footprint: '1×1', motif: 'a calm lake water tile, still deep-blue surface, tileable' },
          { name: 'coast_rocky', footprint: '1×1', motif: 'a rocky coastline tile where land meets sea, tileable' },
          { name: 'waterfall_large', footprint: '4×4–8×8', motif: 'a tall cascading waterfall over rocky cliffs into a pool, stylized foam at the base' },
          { name: 'mountain_wall_straight', footprint: '2×2', motif: 'a straight steep mountain wall segment, layered rock, tileable side to side' },
          { name: 'mountain_valley_pass', footprint: '3×3', motif: 'a mountain valley pass: two rock walls with a passable corridor between them' },
          { name: 'cliff_edge', footprint: '1×1', motif: 'a cliff edge tile: flat top dropping to a rocky face, tileable' },
          { name: 'hill_small', footprint: '2×2', motif: 'a small rounded grassy hill mound with a gentle slope, blends into flat ground at its base' },
          { name: 'boulder_cluster', footprint: '1×1', motif: 'a cluster of stylized grey boulders of varied size sitting on the ground, low-poly' },
          { name: 'rock_outcrop', footprint: '1–2 tiles', motif: 'a rocky outcrop rising from the ground, layered stone, flat base' },
          { name: 'mountain_peak_large', footprint: '3×3', motif: 'a large stylized rocky mountain peak with steep faces and a broad flat base, no snow' },
          { name: 'hero_mountain_range_west', footprint: '8×8–12×12, modular', motif: 'a large stylized rocky mountain range with steep cliffs, a valley pass and a tunnel entrance, layered peaks, no snow' },
          { name: 'hero_harbor_bay', footprint: '6×6, modular', motif: 'a coastal harbor bay with wooden piers, small docks and calm water, rocky shoreline' },
        ],
      },
    ],
  },
  {
    key: 'roads',
    title: 'Straßen',
    intro: 'Flache, kachelbare Segmente; der Renderer wählt & dreht sie nach Nachbar-Maske. Kanonik: gerade = N–S, Kurve = N+E.',
    groups: [
      {
        title: 'Aktiv genutzt (Wohnstraße)',
        entries: [
          { name: 'road_straight', footprint: '1×1', motif: 'a straight two-lane asphalt road segment running north–south, with kerbs; flat and tileable' },
          { name: 'road_curve', footprint: '1×1', motif: 'a 90° road curve joining the north and east edges, asphalt with kerbs, flat' },
          { name: 'road_t_intersection', footprint: '1×1', motif: 'a T-junction road segment with three arms (north, east, south), open to the west, asphalt with kerbs' },
          { name: 'road_cross_intersection', footprint: '1×1', motif: 'a four-way crossroads road segment, asphalt with kerbs and lane markings' },
          { name: 'road_end', footprint: '1×1', motif: 'a dead-end road cap with a single arm to the north, asphalt with kerbs' },
        ],
      },
      {
        title: 'Geplant (Hauptstraße, Gehwege, Rampen)',
        note: 'Klassenvarianten `road_main_*` werden vom Renderer vor dem generischen Namen bevorzugt.',
        entries: [
          { name: 'road_main_straight', footprint: '1×1', motif: 'a wider main-road straight segment with a centre line and sidewalks, running north–south, flat and tileable' },
          { name: 'road_main_cross_intersection', footprint: '1×1', motif: 'a wide main-road four-way crossroads with markings and sidewalks' },
          { name: 'sidewalk_straight', footprint: '1×1', motif: 'a straight paved sidewalk segment with a kerb, flat and tileable' },
          { name: 'road_slope', footprint: '1×1', motif: 'a road ramp segment rising one height step, asphalt with kerbs' },
        ],
      },
    ],
  },
  {
    key: 'bridges',
    title: 'Brücken',
    intro: 'Wird verwendet, wenn eine Straße auf Wasser liegt; entlang der Straßenachse ausgerichtet.',
    groups: [
      {
        title: 'Brückenvarianten',
        entries: [
          { name: 'bridge_medium_road', footprint: 'modular', motif: 'a stylized stone road bridge with arches, sidewalks and railings, spanning water along its axis' },
          { name: 'bridge_small_stone', footprint: '1×1', motif: 'a small single-arch stone footbridge with low railings, spanning a narrow stream' },
          { name: 'bridge_small_wood', footprint: '1×1', motif: 'a small wooden plank bridge with posts and rope/wood railings, spanning a stream' },
          { name: 'bridge_large_road', footprint: 'modular', motif: 'a large multi-span road bridge with piers, a wide deck, sidewalks and railings' },
        ],
      },
    ],
  },
  {
    key: 'props',
    title: 'Props & Vegetation',
    intro:
      'Kleine Welt-Objekte. Vegetation wird instanziert & gegen die Stadt gecullt; Baustellen-Props ' +
      'liegen über Bau/Upgrade. **Proportionen einhalten** — eine Parkbank darf NICHT so groß wie ein ' +
      'Baum sein. ' +
      SCALE_NOTE,
    groups: [
      {
        title: 'Aktiv genutzt',
        entries: [
          { name: 'pine_tree', footprint: '1×1', motif: 'a single stylized low-poly pine tree, slightly irregular' },
          { name: 'bush_small', footprint: '1×1', motif: 'a small round low-poly bush' },
          { name: 'construction_site', footprint: '1–3 tiles', motif: 'a construction site prop: scaffolding, a small crane and barriers with warning stripes, to sit over a building under construction' },
        ],
      },
      {
        title: 'Geplant (Natur, Stadt, Hafen, Farm)',
        note: 'Siehe docs/3D_WORLD_ASSETS.md §11/§14.',
        entries: [
          { name: 'tree_deciduous', footprint: '1×1', motif: 'a single stylized low-poly broadleaf/deciduous tree with a round crown, about 1.5 tiles tall' },
          { name: 'tree_pine_large', footprint: '1×1', motif: 'a tall stylized pine tree, about 1.8 tiles tall, slim conical crown' },
          { name: 'hedge', footprint: '1×1', motif: 'a low trimmed green hedge segment, about 0.5 tiles tall, tileable side to side' },
          { name: 'reeds_water', footprint: '1×1', motif: 'a cluster of tall water reeds/cattails for lake and river shores, low-poly' },
          { name: 'rock_small', footprint: '1×1', motif: 'a small stylized grey rock / few stones on the ground, about 0.4 tiles tall, low-poly' },
          { name: 'rock_large', footprint: '1×1', motif: 'a large stylized grey boulder, about 1 tile tall, layered stone, low-poly' },
          { name: 'rock_medium', footprint: '1×1', motif: 'a medium stylized grey boulder / rock cluster, low-poly' },
          { name: 'street_lamp', footprint: '1×1', motif: 'a stylized street lamp post with a glowing lamp head' },
          { name: 'bench', footprint: '1×1', motif: 'a simple park bench, low-poly' },
          { name: 'market_stall', footprint: '1×1', motif: 'a market stall with a striped awning and crates of goods' },
          { name: 'boat_small', footprint: '1×2', motif: 'a small rowing/fishing boat, front facing +Z, low-poly' },
          { name: 'hay_bale', footprint: '1×1', motif: 'a round hay bale, low-poly' },
          { name: 'tractor_small', footprint: '1×1', motif: 'a small farm tractor, front facing +Z, low-poly' },
        ],
      },
    ],
  },
  {
    key: 'vehicles',
    title: 'Fahrzeuge',
    intro: 'Klein, lesbar, Pivot mittig unten, **Front zeigt +Z** (Fahrtrichtung).',
    groups: [
      {
        title: 'Aktiv genutzt',
        entries: [
          { name: 'car', footprint: '≈0.3×0.5', motif: 'a small stylized car, readable from an isometric camera, front facing +Z, low-poly' },
          { name: 'service_van', footprint: '≈0.4×0.7', motif: 'a small white delivery / service van, front facing +Z, low-poly' },
        ],
      },
      {
        title: 'Geplant (Flotte)',
        entries: [
          { name: 'truck_food', footprint: '≈0.5×0.9', motif: 'a small food delivery truck with a box body, front facing +Z, low-poly' },
          { name: 'firetruck', footprint: '≈0.5×0.9', motif: 'a red fire truck with a ladder, front facing +Z, low-poly' },
          { name: 'police_car', footprint: '≈0.3×0.5', motif: 'a police car with blue livery and a light bar, front facing +Z, low-poly' },
          { name: 'ambulance', footprint: '≈0.4×0.7', motif: 'a white ambulance with a red cross and a light bar, front facing +Z, low-poly' },
          { name: 'bus_small', footprint: '≈0.4×1.0', motif: 'a small city bus, front facing +Z, low-poly' },
        ],
      },
    ],
  },
  {
    key: 'markers',
    title: 'Marker (schwebende Statusanzeigen)',
    intro: 'Schweben über Gebäuden, kippen mit der Welt und rotieren. Klar von jeder Seite lesbar, kräftige Farbe.',
    groups: [
      {
        title: 'Aktiv genutzt',
        entries: [
          { name: 'marker_task', footprint: '~1 tile hoch', motif: 'a floating quest/task marker: a rounded teal pin with a clean icon, readable from any angle' },
          { name: 'marker_construction', footprint: '~1 tile hoch', motif: 'a floating construction marker: a yellow pin with a wrench or hard-hat icon' },
          { name: 'marker_problem', footprint: '~1 tile hoch', motif: 'a floating problem marker: a red pin with a white exclamation mark' },
          { name: 'marker_upgrade', footprint: '~1 tile hoch', motif: 'a floating upgrade marker: a green pin with a white up-arrow' },
        ],
      },
      {
        title: 'Geplant (weitere Zustände & Sektoren)',
        entries: [
          { name: 'marker_water', footprint: '~1 tile hoch', motif: 'a floating blue water marker: a droplet icon pin' },
          { name: 'marker_trade', footprint: '~1 tile hoch', motif: 'a floating orange trade marker: a coins/handshake icon pin' },
          { name: 'marker_resource', footprint: '~1 tile hoch', motif: 'a floating resource marker: a crate/ore icon pin' },
          { name: 'sector_marker_build', footprint: '1×1', motif: 'a buildable-zone marker: a green dashed frame with a small tool icon on the ground' },
        ],
      },
    ],
  },
  {
    key: 'effects',
    title: 'Effekte',
    intro: 'Feste Effekt-Meshes als `.glb` (vieles läuft bereits als Partikel/Shader). Halb-transparente, weiche Formen.',
    groups: [
      {
        title: 'Aktiv genutzt',
        entries: [
          { name: 'smoke_chimney', footprint: 'klein', motif: 'a small soft stylized smoke/steam puff mesh for a chimney, light grey, semi-transparent look' },
        ],
      },
      {
        title: 'Geplant',
        note: 'Bewegtes Wasser, Gischt, Wind-Sway etc. sind als Partikel/Shader sinnvoller als `.glb` (siehe 3D_WORLD_ASSETS §17).',
        entries: [
          { name: 'upgrade_glow', footprint: 'klein', motif: 'a soft golden glow/sparkle burst mesh to play when a building is upgraded' },
          { name: 'building_complete_effect', footprint: 'klein', motif: 'a small celebratory confetti/spark ring mesh for when construction completes' },
        ],
      },
    ],
  },
  {
    key: 'ui',
    title: 'Welt-UI (3D-Anzeigen über Gebäuden)',
    intro: 'Schwebende 3D-UI über dem gewählten/betroffenen Gebäude. Klar, kräftig, gut lesbar; ohne Modell zeichnet der Renderer die prozedurale Variante.',
    groups: [
      {
        title: 'Welt-UI-Modelle',
        entries: [
          { name: 'ui_selection_ring', footprint: 'Footprint des Gebäudes', motif: 'a thin glowing flat selection ring that lies on the ground around a building, emissive, no top surface' },
          { name: 'ui_upgrade_button', footprint: 'klein', motif: 'a floating 3D upgrade button: an up-arrow inside a rounded chip, bright and readable, hovers above a building' },
          { name: 'ui_build_button', footprint: 'klein', motif: 'a floating 3D action button: a hammer or plus inside a rounded chip' },
          { name: 'ui_level_badge', footprint: 'klein', motif: 'a small floating level badge chip that displays a building level number' },
        ],
      },
    ],
  },
];

const PROMPT_INTRO_TECH =
  '**Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, ' +
  'Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: ' +
  '`docs/3D_WORLD_ASSETS.md`.';

/** Ein copy-paste-fertiger Prompt-Block (Überschrift + Codeblock mit Prefix+Motiv). */
function promptBlock(e: PromptEntry): string {
  const head = e.footprint ? `### \`${e.name}.glb\` — ${e.footprint}` : `### \`${e.name}.glb\``;
  return `${head}\n\n\`\`\`text\n${STYLE_PREFIX} ${e.motif}\n\`\`\`\n`;
}

/** Markdown für ein `PROMPTS.md` eines Nicht-Gebäude-Ordners. */
export function renderFolderPrompts(fp: FolderPrompts): string {
  const body = fp.groups
    .map((g) => {
      const head = `## ${g.title}\n`;
      const note = g.note ? `${g.note}\n\n` : '';
      return `${head}\n${note}${g.entries.map(promptBlock).join('\n')}`;
    })
    .join('\n');
  return (
    `# 3D-Prompts — ${fp.title}\n\n` +
    `${GEN_BANNER}\n\n` +
    `Zielordner: \`src/assets/models/${fp.key}/\`. Jeder Block ist copy-paste-fertig ` +
    `(Stil-Prefix + Motiv). ${PROMPT_INTRO_TECH}\n\n` +
    `${fp.intro}\n\n` +
    `${body}`
  );
}

/** Markdown für `buildings/PROMPTS.md` — ein Prompt je Config-Gebäude + Landmarken. */
export function buildBuildingsPrompts(buildings: readonly BuildingLike[]): string {
  const rows = buildings
    .filter((b) => b.category !== 'roads')
    .map((b) => {
      const motif = BUILDING_PROMPTS[b.id] ?? `a ${b.category} building`;
      const stages = (b.upgrades?.length ?? 0) + 1;
      const block = promptBlock({ name: b.id, footprint: `${b.size.w}×${b.size.h}`, motif });
      const extra =
        stages > 1
          ? `> Stufen: \`${b.id}${BUILD_STAGE_PREFIX}2\`…\`${b.id}${BUILD_STAGE_PREFIX}${stages}\` (sichtbar weiterentwickelt) · Baustelle: \`${b.id}${BUILD_CONSTRUCTION_SUFFIX}.glb\`\n`
          : `> Baustelle optional: \`${b.id}${BUILD_CONSTRUCTION_SUFFIX}.glb\`\n`;
      return `${block}${extra}`;
    })
    .join('\n');
  const landmarks = BUILDING_LANDMARK_PROMPTS.map(promptBlock).join('\n');
  return (
    `# 3D-Prompts — Gebäude\n\n` +
    `${GEN_BANNER}\n` +
    `> Gebäudeliste kommt aus \`src/game/config/buildings.config.ts\` — neue Gebäude erscheinen automatisch.\n\n` +
    `Zielordner: \`src/assets/models/buildings/<kategorie>/\`, **Dateiname = Gebäude-ID**. Jeder Block ist ` +
    `copy-paste-fertig (Stil-Prefix + Motiv). ${PROMPT_INTRO_TECH}\n\n` +
    `## Gebäude (aus buildings.config.ts)\n\n` +
    `${rows}\n` +
    `## Landmarken & Hero-Bauten (geplant)\n\n` +
    `Noch keine Config-IDs; per \`visual.model3d\` verknüpfbar (siehe docs/3D_WORLD_ASSETS.md §13).\n\n` +
    `${landmarks}`
  );
}
