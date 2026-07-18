// Single source of truth for every 3D model the true3d renderer wires in (v0.40,
// "World Graphics V2" doc consolidation).
//
// The ThreeMapRenderer imports the arrays below to decide which `.glb` to load per
// category, and the per-folder `src/assets/models/<folder>/README.md` files are
// GENERATED from the same data (see tests/modelReadmes.test.ts). So the docs can
// never drift from what the code actually loads: add an accepted name here, the
// renderer picks it up AND the folder README updates on the next generation.
//
// "First match wins" everywhere — precise name first, short alias after. A missing
// model always falls back to the procedural stand-in, so the game never breaks.
//
// v0.40 also makes this file the ONE place that specifies every PLANNED (not yet
// wired) model too — footprint, height, pivot, placement/biome rules, budget class,
// animation/effect nodes — so `PROMPTS.md` per folder is a complete, artist-ready
// spec instead of a bare name+motif list. See docs/3D_WORLD_ASSETS.md for the
// narrative style guide and docs/3D_MODEL_MANIFEST.md for the short naming index.

import type { TerrainType } from '../game/types.ts';
import type { BuildingSizeClass } from '../game/config/types.ts';

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

// ---- size classes → shared poly/texture/material budget ---------------------
// v0.40: every model (current + planned) resolves its budget from ONE of these
// classes instead of restating tris/texture numbers per row (unmaintainable at
// ~150–250 entries). Matches docs/3D_WORLD_ASSETS.md §22. Add per-entry
// `heightRange`/`footprint` for the parts that actually vary model to model.

export type SizeClass =
  | 'prop'
  | 'prop_large'
  | 'vehicle'
  | 'marker'
  | 'effect'
  | 'terrain_tile'
  | 'terrain_feature'
  | 'bridge'
  | 'building_small'
  | 'building_large'
  | 'landmark'
  | 'hero';

export interface SizeClassBudget {
  label: string;
  triBudget: string;
  textureSize: string;
  materials: string;
}

export const SIZE_CLASS_BUDGETS: Record<SizeClass, SizeClassBudget> = {
  prop: { label: 'kleines Prop', triBudget: '< 500 Tris', textureSize: '≤ 256²', materials: '1 Material' },
  prop_large: { label: 'großes Prop / Setpiece', triBudget: '500–1 500 Tris', textureSize: '≤ 512²', materials: '1–2 Materialien' },
  vehicle: { label: 'Fahrzeug', triBudget: '500–1 200 Tris', textureSize: '≤ 512²', materials: '1–2 Materialien' },
  marker: { label: 'Marker / Welt-UI', triBudget: '< 200 Tris', textureSize: '≤ 128² (oder Canvas)', materials: '1 Material, emissiv' },
  effect: { label: 'Effekt-Mesh', triBudget: '< 300 Tris', textureSize: '≤ 128²', materials: '1 Material, halbtransparent' },
  terrain_tile: { label: 'Terrain-/Straßen-Kachel', triBudget: '200–800 Tris', textureSize: '≤ 512² (bevorzugt geteilt)', materials: '1 Material' },
  terrain_feature: { label: 'Terrain-Feature', triBudget: '800–3 000 Tris', textureSize: '≤ 512²', materials: '1–2 Materialien' },
  bridge: { label: 'Brücke', triBudget: '1 500–4 000 Tris', textureSize: '≤ 512²', materials: '1–2 Materialien' },
  building_small: { label: 'kleines Gebäude', triBudget: '500–2 000 Tris', textureSize: '≤ 512²', materials: '1–2 Materialien' },
  building_large: { label: 'großes Gebäude', triBudget: '2 000–6 000 Tris', textureSize: '≤ 1024²', materials: '2–3 Materialien' },
  landmark: { label: 'Landmarke', triBudget: '6 000–12 000 Tris', textureSize: '≤ 1024²', materials: '2–4 Materialien' },
  hero: { label: 'Hero-/Weltform (modular bevorzugt)', triBudget: 'so niedrig wie möglich, modular', textureSize: '≤ 1024², geteilt', materials: '2–6 Materialien je Modul' },
};

// § Gebäudesystem 2.0: Budget je GEBÄUDE-Größenklasse (XS–XXL, Pflichtfeld
// `sizeClass` auf jedem BuildingDef). Getrennt von SIZE_CLASS_BUDGETS oben (das
// deckt Props/Terrain/Fahrzeuge ab) — hier steigt das Poly-/Textur-Budget mit
// der Grundfläche, ein 8×8-Kraftwerk (XXL) darf deutlich mehr als ein 2×2-Laden
// (S). buildings/PROMPTS.md und docs/BUILDINGS.md lösen ihr Budget hierüber auf.
export const BUILDING_SIZE_BUDGETS: Record<BuildingSizeClass, SizeClassBudget & { footprint: string }> = {
  XS: { label: 'Deko/Kachel', footprint: '1×1', triBudget: '< 600 Tris', textureSize: '≤ 256²', materials: '1 Material' },
  S: { label: 'kleines Gebäude', footprint: '2×2', triBudget: '800–2 000 Tris', textureSize: '≤ 512²', materials: '1–2 Materialien' },
  M: { label: 'mittleres Gebäude', footprint: '3×3', triBudget: '1 500–3 500 Tris', textureSize: '≤ 512²', materials: '2 Materialien' },
  L: { label: 'großes Gebäude', footprint: '4×4–5×5', triBudget: '3 000–6 000 Tris', textureSize: '≤ 1024²', materials: '2–3 Materialien' },
  XL: { label: 'Groß-Areal', footprint: '6×6–7×7', triBudget: '5 000–9 000 Tris', textureSize: '≤ 1024²', materials: '3–4 Materialien' },
  XXL: { label: 'Mega-Areal', footprint: '8×8', triBudget: '8 000–12 000 Tris', textureSize: '≤ 1024² (bevorzugt 2 Sets)', materials: '3–5 Materialien' },
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
  /** Set when this folder no longer accepts `.glb` drop-ins at all (moved to a
   *  texture-based system, § Straßen als Textur) — renderFolderReadme prints
   *  this note instead of the loader/table template, which would otherwise
   *  wrongly imply a model could still be dropped in here. */
  deprecated?: string;
}

/** Non-building folders, documented straight from the arrays above. The buildings
 *  folder is generated separately from buildings.config (see buildBuildingsReadme).
 *  This lists only what the renderer ACTUALLY loads today — planned-but-unwired
 *  models live in FOLDER_PROMPTS below, not here (adding a name here without
 *  renderer code would be a lie about what the game does). */
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
    loader: '',
    intro: '',
    rows: [],
    deprecated:
      '**Straßen laden seit v0.44 nie mehr ein `.glb`** (§ Straßen als Textur). Die Mask-getriebene ' +
      'Straßengeometrie (gerade/Kurve/T/Kreuzung/Ende, Kreisverkehr, Bergstraße, Steg/Brücke) ist jetzt ' +
      'texturbasiert — siehe `docs/ROAD_TEXTURES.md` und `src/assets/roadTextureManifest.ts` für die ' +
      'aktuelle Drop-in-Spezifikation (`src/assets/textures/roads/…`).',
  },
  {
    key: 'bridges',
    title: 'Brücken',
    loader: '',
    intro: '',
    rows: [],
    deprecated:
      '**Brücken laden seit v0.44 nie mehr ein `.glb`** (§ Straßen als Textur). Eine Straße über Wasser ' +
      'wird jetzt als texturierter Steg (schmale Spannweite) oder Brücke (breite Spannweite) gerendert — ' +
      'siehe `docs/ROAD_TEXTURES.md` und `src/assets/roadTextureManifest.ts`.',
  },
  {
    key: 'props',
    title: 'Props & Vegetation',
    loader: 'propModel',
    intro:
      'Vegetation wird gegen die Stadt gecullt (nie auf Gebäude/Straße). Baustellen-' +
      'Modelle (construction/) werden während Bau & Upgrade genutzt. Unterordner ' +
      '(nature/city/harbor/farm/construction/infrastructure) sind reine Organisation.',
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
  if (doc.deprecated) {
    return (
      `# 3D-Modelle — ${doc.title}\n\n` +
      `${GEN_BANNER}\n\n` +
      `Ordner: \`src/assets/models/${doc.key}/\` (historisch — kein aktiver Drop-in-Ziel mehr)\n\n` +
      `${doc.deprecated}\n`
    );
  }
  return (
    `# 3D-Modelle — ${doc.title}\n\n` +
    `${GEN_BANNER}\n\n` +
    `Ordner: \`src/assets/models/${doc.key}/\`  ·  Loader: \`${doc.loader}()\`  ·  ` +
    `Schlüssel = Dateiname (rekursiv).\n\n` +
    `${doc.intro}\n\n` +
    `${table(doc.rows)}\n\n` +
    `Fehlt ein Modell, greift der prozedurale Fallback — das Spiel bricht nie. Die volle ` +
    `Spezifikation (Footprint, Höhe, Pivot, Platzierung, Biom, Budget) für diese UND alle ` +
    `geplanten Modelle dieses Ordners steht in \`PROMPTS.md\` daneben.\n`
  );
}

// ---- buildings README (from buildings.config) -------------------------------

export interface BuildingLike {
  id: string;
  category: string;
  size: { w: number; h: number };
  sizeClass?: BuildingSizeClass;
  unlockLevel: number;
  upgrades?: unknown[];
}

/** Benannte Nodes/Anschlusspunkte, die der Renderer an einem Gebäudemodell
 *  erwartet (animiert oder als Effekt-Ursprung) — dokumentiert in
 *  buildings/PROMPTS.md und docs/BUILDINGS.md, damit die Modelle sie mitliefern.
 *  Nur Gebäude mit Sonderknoten stehen hier; alle anderen brauchen keine. */
export const BUILDING_NODES: Record<string, string> = {
  sawmill: '`chimney` (Rauch-Ursprung am Schornstein)',
  power_plant: '`chimney` (Dampf/Rauch am Kühlturm/Schlot)',
  wind_farm: '`rotor` (drehende Rotorblätter je Turbine)',
};

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
    `(\`src/assets/models/roads/\`). Volle Spezifikation je Gebäude (Größenklasse, Budget, Front/Eingang, ` +
    `Baustil): \`PROMPTS.md\` daneben.\n`
  );
}

// ---- Generierungs-Prompts (PROMPTS.md je Ordner) ----------------------------
// Fertige Text-zu-3D-Prompts (Meshy/Rodin/Tripo/Luma …): jeder Block ist copy-paste-
// fertig (Stil-Prefix + Motiv) UND trägt die volle Modell-Spezifikation (Größenklasse/
// Budget, Höhe, Pivot, Platzierung, Biom, Animationen …). Aus derselben Quelle
// generiert wie die READMEs; der Test tests/modelReadmes.test.ts hält sie synchron.
// Motive bewusst auf Englisch, da die Text-zu-3D-Tools damit am besten arbeiten.

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

/** Default pivot/front, only overridden on an entry when it genuinely differs
 *  (e.g. markers/effects hover instead of sitting on the ground). */
const DEFAULT_PIVOT = 'unten-mittig (X/Z zentriert, Unterkante Y = 0)';
const DEFAULT_FRONT = '+Z';

export interface PromptEntry {
  /** Dateiname ohne `.glb`. */
  name: string;
  /** Footprint/Größe, z. B. "2×2" (optional). */
  footprint?: string;
  /** Englisches Motiv, wird an STYLE_PREFIX gehängt. */
  motif: string;
  // ---- v0.40: volle Modell-Spezifikation (alle optional, Defaults gelten sonst) ----
  /** Budget-Klasse → löst Tris/Textur/Material-Richtwert auf (SIZE_CLASS_BUDGETS). */
  sizeClass?: SizeClass;
  /** Empfohlene Höhe in Kacheln, z. B. "≈1.4–1.8 Kacheln". */
  heightRange?: string;
  /** Nur setzen, wenn abweichend von DEFAULT_PIVOT. */
  pivot?: string;
  /** Nur setzen, wenn abweichend von DEFAULT_FRONT oder nicht zutreffend (z. B. Terrain). */
  frontFacing?: string;
  /** Biom(e), in denen das Modell vorkommt. */
  biome?: string;
  /** Worauf platzierbar (Terrain-/Biom-Typen oder Gebäude-Nachbarschaft). */
  placeOn?: string;
  /** Worauf NIE platzierbar. */
  neverOn?: string;
  /** Mindestabstand zu gleichartigen Instanzen. */
  minSpacing?: string;
  /** Zufalls-Rotation/-Skalierung, Cluster-Verhalten. */
  randomize?: string;
  /** Ob der Renderer/die Platzierung Instancing nutzt (mehrfach, gleiche Geometrie). */
  instancing?: boolean;
  /** Benannter Node, den der Renderer animiert (z. B. `rotor`). */
  animationNodes?: string;
  /** Benannter Node/Anschlusspunkt für Partikel-Effekte (z. B. `chimney`). */
  effectNodes?: string;
  /** Spawn-Wahrscheinlichkeit / Verteilungsregel. */
  spawnRule?: string;
  /** 'particle-shader' = bewusst KEIN `.glb`, sondern Partikel/Shader im Renderer. */
  implementation?: 'glb' | 'particle-shader';
  /** Ist das Modell schon in der Renderer-Pipeline verdrahtet (§0 in 3D_MODEL_MANIFEST.md)? */
  status?: 'live' | 'planned';
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

/**
 * § Gebäudesystem 2.0 (A9): ein **eigenes Motiv pro Ausbaustufe** — Index 0 =
 * Basis (`<id>.glb`), Index N = `<id>_stage{N+1}.glb`. Die Stufen ändern die
 * Grundfläche NIE (Nutzer-Entscheidung), aber das Modell verdichtet dasselbe
 * Grundstück sichtbar: aus dem Kleinen Haus wird über sechs Stufen ein
 * Wohnblock, aus dem Sägewerk ein Holzkombinat. `buildBuildingsPrompts`
 * emittiert daraus einen vollwertigen Prompt je Stufen-Datei; der Test in
 * tests/modelReadmes.test.ts erzwingt **Prompt-Anzahl ≡ Stufenzahl**, damit jede
 * Stufe eines Mehrstufen-Gebäudes eine artist-fertige Beschreibung hat.
 * Einstufige Gebäude brauchen keinen Eintrag (Fallback = BUILDING_PROMPTS).
 * Footprint bleibt fix, deshalb überall „same fixed footprint".
 */
export const BUILDING_STAGE_PROMPTS: Record<string, readonly string[]> = {
  town_hall: [
    'a modest town hall with a small clock tower, a columned entrance, a flag and a red roof, a paved forecourt (fills a 5×5 civic plot)',
    'an expanded city administration: the town hall grown with side wings, more windows, a larger clock tower and a busier forecourt with lampposts (same 5×5 plot)',
    'a grand city palace: an ornate administrative palace with a dome, a colonnade, statues and a formal garden square (same 5×5 plot, clearly more prestigious)',
    'a monumental city hall: a towering civic landmark with a tall clock spire, grand staircase, fountains and flags dominating the plaza (same 5×5 plot, the city’s crown)',
  ],
  house_small: [
    'a small cozy family house with a red pitched roof, a chimney, a tiny front garden and warm windows (fills a 3×3 plot with garden)',
    'a detached single-family home: a slightly bigger house with a porch, a garage and a neat garden on the same 3×3 plot',
    'a semi-detached duplex: two joined homes with pitched roofs sharing the same 3×3 plot, two doorsteps and small gardens',
    'a multi-family house: a compact three-storey apartment house with balconies and a shared entrance filling the 3×3 plot',
    'an apartment block: a five-storey residential building with rows of balconies, a flat roof and a small forecourt on the 3×3 plot',
    'a dense residential block: a tall filled-out apartment block covering the whole 3×3 plot, many balconies, roof units and a paved base — as many households as a whole street of starter houses',
  ],
  residential_tower: [
    'a tall residential tower with many balconies, a flat roof and a modern colorful facade on a landscaped 5×5 plaza',
    'a high-rise residential building: taller than the tower with a stepped silhouette, glass balconies and rooftop gardens (same 5×5 plaza)',
    'a skyscraper: a gleaming residential skyscraper piercing the skyline, glass-and-steel facade, sky terraces and a grand plaza base (same 5×5 plaza, metropolis endgame)',
  ],
  sawmill: [
    "a wooden sawmill with a pitched roof, log piles, a saw shed and a chimney (name the chimney node 'chimney'); fills a 4×4 works yard with a loading area",
    "a large sawmill: a bigger mill hall, more stacked logs, a conveyor and a second chimney on the 4×4 yard (name a chimney node 'chimney')",
    "a timber combine: a full industrial wood-processing complex with multiple halls, cranes, huge log stockpiles and smoking chimneys filling the 4×4 yard (name a chimney node 'chimney')",
  ],
  quarry: [
    'a stone quarry site with terraced rock, a small crane, gravel piles and a work shed on a 5×5 excavation plot',
    'a deep quarry: a wider terraced pit with conveyor belts, dump trucks and larger spoil heaps on the 5×5 plot',
    'a mining complex: a full-scale rock-mining operation with heavy machinery, crushers, silos and rail carts filling the 5×5 plot',
  ],
  farm: [
    'a farm with a barn, a farmhouse, silos and fenced fields, warm rural look, filling a 6×6 farmstead plot',
    'a large farm: a bigger barn, more silos, extra outbuildings and expanded ploughed fields on the 6×6 plot',
    'an agricultural complex: an industrial-scale farm with greenhouses, tall grain silos, machinery sheds and dense fields filling the 6×6 plot',
  ],
  well: [
    'a small stone village well with a little wooden roof and a bucket (1×1)',
    'a deep well: a sturdier stone well with an iron pump mechanism and a raised base (1×1)',
  ],
  water_pump: [
    'a compact water pumping station: a small building with pipes, valves and a tank on a 3×3 plot',
    'a pumping works: a larger pump house with multiple tanks, a control room and a pipe manifold filling the 3×3 plot',
  ],
  warehouse: [
    'a rectangular storage warehouse with large roller doors, a flat roof and loading bays on a 4×4 yard',
    'a high-bay warehouse: a taller automated storage building with tall racking visible through openings, more loading docks and parked trailers on the 4×4 yard',
  ],
  depot: [
    'a logistics depot: a large shed with loading docks, crates, a small yard and parked trailers on a 5×5 plot',
    'a logistics hub: a bigger multi-dock distribution centre with a truck yard, container stacks and a control office filling the 5×5 plot',
  ],
  waterworks: [
    'a waterworks facility with round filtration tanks, pipes and a control building at the water’s edge on a 5×5 plot',
    'a sewage/treatment works: additional large clarifier basins, aeration tanks and a bigger control building on the 5×5 plot',
  ],
  market: [
    'a small market with striped awnings, crates of produce and a paved front on a 3×3 square',
    'a covered market hall: a larger roofed market building with arched openings, many stalls and a busy paved forecourt on the 3×3 square',
  ],
  supermarket: [
    'a modern supermarket: a wide flat building with a big storefront, a sign board and a small parking strip on a 4×4 plot',
    'a shopping centre: a larger retail complex with a glass frontage, multiple storefronts and a bigger car park filling the 4×4 plot',
  ],
  bakery: [
    'a charming corner bakery with a shop window, an awning and a chimney, warm inviting look (2×2)',
    'a large bakery: a bigger bakery with a production annex, a delivery door and a taller chimney on the 2×2 plot',
  ],
  fire_station: [
    'a small fire station with a red facade, a garage door, a short training tower and a flag on a 5×5 plot with a forecourt',
    'a city fire station: a larger station with several garage bays, a taller drill tower, a vehicle yard and a green strip filling the 5×5 plot',
    'a fire response centre: a major headquarters with a long row of garage bays, a command tower, helipad markings and a busy apparatus yard filling the 5×5 plot',
  ],
  police_station: [
    'a police station: a sturdy civic building with blue accents, an entrance porch and a flag on a 4×4 plot with a yard',
    'a police precinct: a larger station with a parking yard for patrol cars, an extension wing and blue signage filling the 4×4 plot',
    'a police headquarters: an imposing presidium building with a secure courtyard, a communications mast and flags filling the 4×4 plot',
  ],
  hospital: [
    'a clinic: a clean white medical building with a red cross sign, an ambulance bay and many windows on a 6×6 campus',
    'a hospital: a larger multi-wing hospital with a taller main block, a bigger ambulance bay and a helipad on the 6×6 campus',
    'a university hospital: a sprawling medical campus with several connected wings, a research tower, a helipad and landscaped grounds filling the 6×6 campus',
  ],
  trading_post: [
    'a trading post / merchant house with crates, barrels, an awning and a hanging sign on a 3×3 plot',
    'a commodities exchange: a busier trading house with a weighing yard, more stacked goods and a signboard on the 3×3 plot',
    'an export centre: a large trading complex with a loading yard, container stacks and an office wing filling the 3×3 plot',
  ],
  shop_small: [
    'a small retail shop with a colorful storefront, an awning and a sign (2×2)',
    'a retail parade: a row of two to three small joined shops with awnings and signs filling the 2×2 plot',
  ],
  office: [
    'a small office: a low-rise office building with a glass facade, clean modern lines and an entrance plaza on a 4×4 plot',
    'an office building: a taller mid-rise office block with a full glass curtain wall and a lobby entrance on the 4×4 plot',
    'a business center: a large corporate office complex with two connected towers, a plaza and flags filling the 4×4 plot',
    'an office tower: a tall gleaming office skyscraper with a sleek glass-and-steel facade dominating the 4×4 plot',
  ],
  power_plant: [
    "a coal power plant: a large hall with tall smokestacks emitting steam, cooling towers and a coal yard filling an 8×8 industrial plot (name a smokestack node 'chimney')",
    "a large power station: an expanded plant with more cooling towers, a bigger boiler house, a rail siding and towering smokestacks filling the 8×8 plot (name a smokestack node 'chimney')",
  ],
  park: [
    'a small green park with trees, paths, benches and a lawn, low and flat, on a 5×5 plot',
    'a city park: a larger landscaped park with a pond, winding paths, tree clusters, flowerbeds and a bandstand filling the 5×5 plot',
  ],
};

/** Geplante Landmarken/Hero-Bauten (noch keine Config-IDs; siehe 3D_WORLD_ASSETS §13). */
export const BUILDING_LANDMARK_PROMPTS: PromptEntry[] = [
  { name: 'lighthouse', footprint: '2×2', sizeClass: 'landmark', heightRange: '≈4–6 Kacheln', biome: 'Küste', placeOn: 'Küstenklippe/Landzunge, Wasserzugang', motif: 'a red-and-white striped lighthouse on a rocky base with a lantern room' },
  { name: 'harbor_small', footprint: '4×4 / modular', sizeClass: 'hero', biome: 'Küste, Bucht', placeOn: 'Küste, Wasserzugang auf mind. 2 Seiten', motif: 'a small harbor with wooden piers, bollards, crates and a calm water edge' },
  { name: 'harbor_pier', footprint: 'modular', sizeClass: 'terrain_feature', biome: 'Küste, See', placeOn: 'ragt über Wasser', motif: 'a wooden harbor pier segment with planks and posts, extends over water' },
  { name: 'ship_sailing', footprint: '2×4', sizeClass: 'prop_large', pivot: DEFAULT_PIVOT, frontFacing: '+Z, fährt entlang Wasserfläche', biome: 'Meer, See', motif: 'a small stylized sailing ship / cargo boat, front facing +Z, readable silhouette' },
  { name: 'monument_city', footprint: '2×2', sizeClass: 'landmark', biome: 'Stadtzentrum, Platz', motif: 'a city monument: a stone obelisk or statue on a stepped base with a small plaza' },
  { name: 'museum', footprint: '3×3', sizeClass: 'landmark', biome: 'Stadtzentrum', motif: 'a classical museum with columns, a wide staircase, a pediment and a flag' },
  { name: 'stadium', footprint: '4×4', sizeClass: 'landmark', biome: 'Stadtrand', motif: 'a small sports stadium with tiered stands, a pitch and floodlights' },
  { name: 'observation_tower', footprint: '2×2', sizeClass: 'landmark', heightRange: '≈6–9 Kacheln', biome: 'Hochplateau, Stadtrand', motif: 'a tall slim observation tower with a viewing platform at the top' },
  { name: 'mountain_tunnel_landmark', footprint: '3×3', sizeClass: 'landmark', biome: 'Gebirge', placeOn: 'Gebirgswand, an Straße/Gebirgspass', motif: 'a mountain tunnel / mine entrance carved into rock, with a portal, rails and props' },
  { name: 'hero_city_hall_plaza', footprint: '6×6, modular', sizeClass: 'hero', biome: 'Stadtzentrum', spawnRule: 'ein Exemplar, handplatziert im Stadtkern', motif: 'a hero city-hall plaza: the town hall with a grand paved square, fountains and greenery' },
  { name: 'hero_market_district', footprint: '6×6, modular', sizeClass: 'hero', biome: 'Stadtzentrum', spawnRule: 'ein Exemplar, handplatziert nahe Marktachse', motif: 'a hero market district: a bustling square with market stalls, awnings, crates and paved streets' },
  { name: 'hero_harbor_complex', footprint: '6×6, modular', sizeClass: 'hero', biome: 'Küste, Bucht', spawnRule: 'ein Exemplar, handplatziert an der Küstenzone', motif: 'a hero harbor complex: piers, cranes, warehouses, moored boats and a promenade' },
  { name: 'hero_lighthouse_cliff', footprint: '6×6, modular', sizeClass: 'hero', biome: 'Küste, Klippe', spawnRule: 'ein Exemplar, handplatziert an prägnanter Klippe', motif: 'a hero coastal cliff with a lighthouse on top, rocky shore and crashing waves' },
  { name: 'hero_grand_bridge', footprint: 'modular', sizeClass: 'hero', biome: 'Fluss/Schlucht', placeOn: 'spannt Fluss oder Schlucht', motif: 'a hero grand stone-and-steel bridge spanning a wide river valley with towers' },
  { name: 'hero_mine_complex', footprint: '6×6, modular', sizeClass: 'hero', biome: 'Gebirge', spawnRule: 'ein Exemplar, handplatziert am Gebirgsfuß', motif: 'a hero mining complex: a mountain mine entrance with rail tracks, ore carts, a headframe and stockpiles' },
  { name: 'hero_dam_complex', footprint: '8×4, modular', sizeClass: 'hero', biome: 'Fluss/Tal', placeOn: 'spannt Flusstal', motif: 'a hero hydro dam complex: a concrete dam wall across a valley with spillways and a small control building' },
  { name: 'hero_central_park', footprint: '6×6, modular', sizeClass: 'hero', biome: 'Stadtzentrum, Grünfläche', motif: 'a hero central park: lawns, tree clusters, ponds, paths, a bandstand and benches' },
  { name: 'hero_waterfront_district', footprint: '6×6, modular', sizeClass: 'hero', biome: 'Küste, Seeufer', motif: 'a hero waterfront district: a scenic promenade with cafés, small piers and moored boats along the water' },
  { name: 'castle_hilltop', footprint: '4×4', sizeClass: 'landmark', heightRange: '≈8–12 Kacheln', biome: 'Hochplateau, Gebirgsrand', status: 'planned', motif: 'a small stylized hilltop castle with a keep, walls and a flag, evoking a distant-future endgame prestige building' },
  { name: 'hero_grand_observatory', footprint: '4×4', sizeClass: 'hero', heightRange: '≈10–14 Kacheln', biome: 'Hochplateau, Gebirgsgipfel', status: 'planned', motif: 'a hero endgame grand observatory: a domed tower on a rocky summit with a telescope, reachable by a winding path' },
];

/** Prompt-Katalog je Nicht-Gebäude-Ordner: aktiv genutzte + geplante Modelle. */
export const FOLDER_PROMPTS: FolderPrompts[] = [
  {
    key: 'terrain',
    title: 'Terrain & Gebirge',
    intro:
      'Bodenkacheln (1×1, kachelbar) und Gebirgs-/Hero-Formen. **Der Boden ist ein organisches ' +
      'Höhenfeld** — Hügel/Gebirge sind geneigt, Wasser abgesenkt; Kachel-/Fels-/Gipfel-Modelle ' +
      'werden automatisch auf die Bodenhöhe gesetzt (reiten das Höhenfeld). Deshalb **Pivot unten-mittig, ' +
      'flache Unterseite, nichts schwebt**; Gebirge groß & sauber (klare Felsflächen, keine losen Teile). ' +
      SCALE_NOTE,
    groups: [
      {
        title: 'Aktiv genutzt (Kacheln je Terraintyp)',
        entries: [
          { name: 'grass_tile', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'Grasland', placeOn: 'grass', instancing: true, status: 'live', motif: 'a flat green grass meadow tile, subtle micro-detail, tileable edges' },
          { name: 'forest_ground_tile', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'Mischwald', placeOn: 'forest', instancing: true, status: 'live', motif: 'a forest floor tile with moss, roots and a few leaves, tileable' },
          { name: 'ocean_tile', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'Meer', placeOn: 'water', instancing: true, status: 'live', motif: 'a calm sea water tile with a gentle stylized wave, deep blue, tileable' },
          { name: 'river_straight', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'Fluss', placeOn: 'river', instancing: true, status: 'live', motif: 'a straight flowing blue river water tile, gentle current, tileable along its axis' },
          { name: 'mountain_ground_tile', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'Gebirge', placeOn: 'mountain', instancing: true, status: 'live', motif: 'a steep grey rocky mountain ground tile, tileable' },
          { name: 'sand_tile', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'Strand/Küste', placeOn: 'sand', instancing: true, status: 'live', motif: 'a light sandy beach tile, tileable' },
          { name: 'fertile_ground_tile', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'Fruchtbares Land', placeOn: 'fertile', instancing: true, status: 'live', motif: 'a ploughed fertile farmland soil tile with brown furrows, tileable' },
          { name: 'mountain_peak_medium', footprint: '1–2 Kacheln', sizeClass: 'terrain_feature', heightRange: '≈2–3 Kacheln', biome: 'Gebirge', placeOn: 'mountain', spawnRule: '~⅓ der Gebirgs-Kacheln, zufällig gestreut', instancing: true, randomize: 'Zufallsrotation + leichte Zufallsskalierung', status: 'live', motif: 'a stylized rocky mountain peak / large boulder cluster, layered rock, no snow' },
        ],
      },
      {
        title: 'Geplant — Gebirge (schroffe Felsen statt runder Blöcke)',
        note: 'Bilden zusammen ein zerklüftetes Gebirge mit Tälern/Pässen statt flacher grauer Blöcke (siehe World-Graphics-V2 §2).',
        entries: [
          { name: 'mountain_wall_straight', footprint: '2×2', sizeClass: 'terrain_feature', heightRange: '≈3–5 Kacheln', biome: 'Gebirge', placeOn: 'mountain, Gebirgsrand', neverOn: 'Straße, Bauplatz', instancing: false, status: 'planned', motif: 'a straight steep mountain wall segment, layered rock, tileable side to side' },
          { name: 'mountain_wall_corner', footprint: '2×2', sizeClass: 'terrain_feature', heightRange: '≈3–5 Kacheln', biome: 'Gebirge', placeOn: 'Gebirgsrand-Ecke', instancing: false, status: 'planned', motif: 'a 90° corner mountain wall segment, layered rock, connects two straight wall pieces' },
          { name: 'mountain_valley_pass', footprint: '3×3', sizeClass: 'terrain_feature', biome: 'Gebirge', placeOn: 'zwischen zwei Gebirgswänden, an Straße/Serpentine', instancing: false, status: 'planned', motif: 'a mountain valley pass: two rock walls with a passable corridor between them' },
          { name: 'mountain_tunnel_entrance', footprint: '2×1', sizeClass: 'terrain_feature', biome: 'Gebirge', placeOn: 'Gebirgswand, an Straße', animationNodes: 'reserved: light_window (Tunnellicht)', instancing: false, status: 'planned', motif: 'a mountain tunnel entrance carved into rock, with a portal frame and rail-free road opening' },
          { name: 'rock_spire', footprint: '1×1', sizeClass: 'terrain_feature', heightRange: '≈2.5–4 Kacheln', biome: 'Gebirge', placeOn: 'mountain', neverOn: 'Straße, Bauplatz', instancing: true, randomize: 'Zufallsrotation', status: 'planned', motif: 'a tall narrow stylized rock spire / pinnacle rising from rugged mountain terrain' },
          { name: 'mountain_peak_large', footprint: '3×3', sizeClass: 'terrain_feature', heightRange: '≈4–6 Kacheln', biome: 'Gebirge', placeOn: 'mountain, zentral im Gebirgscluster', instancing: false, status: 'planned', motif: 'a large stylized rocky mountain peak with steep faces and a broad flat base, no snow' },
        ],
      },
      {
        title: 'Geplant — Gebirgsflüsse (Quelle → Schlucht → Mündung)',
        note: 'Flüsse entspringen im Gebirge, graben sich ein und münden ins Meer/den See (World-Graphics-V2 §3).',
        entries: [
          { name: 'river_source', footprint: '1×1', sizeClass: 'terrain_feature', biome: 'Gebirge/Fluss-Ursprung', placeOn: 'am Fuß einer Gebirgswand, Anfang eines Flusslaufs', effectNodes: 'water_surface_motion_effect (Partikel)', instancing: false, status: 'planned', motif: 'a small mountain spring where a river originates from rock, trickling water, mossy stones' },
          { name: 'river_curve', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'Fluss', placeOn: 'river (Kurven-Nachbarmaske)', instancing: true, status: 'planned', motif: 'a curved river water tile connecting two adjacent edges, tileable' },
          { name: 'river_fork', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'Fluss', placeOn: 'river (Verzweigung/Zusammenfluss)', instancing: true, status: 'planned', motif: 'a river fork/confluence water tile where two branches join, tileable' },
          { name: 'river_mouth', footprint: '1×1', sizeClass: 'terrain_feature', biome: 'Flussmündung/Küste', placeOn: 'Übergang Fluss → Meer/See', instancing: false, status: 'planned', motif: 'a river mouth tile where fresh water widens and meets the sea, sandbanks, tileable edges' },
          { name: 'waterfall_small', footprint: '2×2', sizeClass: 'terrain_feature', heightRange: '≈2–3 Kacheln', biome: 'Gebirgsfluss', placeOn: 'Geländestufe zwischen zwei Flusshöhen', effectNodes: 'waterfall_mist (Gischt-Partikel)', instancing: false, status: 'planned', motif: 'a small waterfall cascading over a short rocky drop into a stream, light foam at the base' },
          { name: 'waterfall_large', footprint: '4×4–8×8', sizeClass: 'hero', biome: 'Gebirge', placeOn: 'große Geländestufe im Hero-Gebirge', effectNodes: 'waterfall_mist (Gischt-Partikel)', spawnRule: 'ein bis zwei Exemplare, handplatziert', instancing: false, status: 'planned', motif: 'a tall cascading waterfall over rocky cliffs into a pool, stylized foam at the base' },
          { name: 'lake_center', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'See', placeOn: 'in einer Geländesenke', instancing: true, status: 'planned', motif: 'a calm lake water tile, still deep-blue surface, tileable' },
          { name: 'lake_edge', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'See-Ufer', placeOn: 'Übergang See → Ufer', instancing: true, status: 'planned', motif: 'a lake shoreline tile blending calm water into a sandy or grassy edge, tileable' },
        ],
      },
      {
        title: 'Geplant — Küste & Klippen',
        note: 'Meer wird Küstenlinie statt Fläche: Strand, Klippen, Brandung (World-Graphics-V2 §4).',
        entries: [
          { name: 'grass_tile_variant_01', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'Grasland', placeOn: 'grass', instancing: true, status: 'planned', motif: 'a grass tile variant with tufts and small stones, tileable' },
          { name: 'shore_tile', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'Ufer', placeOn: 'Übergang Gras → Wasser', instancing: true, status: 'planned', motif: 'a shoreline tile where grass meets water, tileable' },
          { name: 'coast_rocky', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'Felsküste', placeOn: 'Übergang Land → Meer an Klippen', instancing: true, status: 'planned', motif: 'a rocky coastline tile where land meets sea, tileable' },
          { name: 'coast_sandy', footprint: '1×1', sizeClass: 'terrain_tile', biome: 'Sandküste', placeOn: 'Übergang Land → Meer am Strand', instancing: true, status: 'planned', motif: 'a sandy coastline tile with light surf foam where the beach meets the sea, tileable' },
          { name: 'cliff_edge', footprint: '1×1', sizeClass: 'terrain_feature', biome: 'Küstenklippe, Hochplateau', placeOn: 'Geländestufe/Kante', instancing: false, status: 'planned', motif: 'a cliff edge tile: flat top dropping to a rocky face, tileable' },
          { name: 'cliff_corner', footprint: '1×1', sizeClass: 'terrain_feature', biome: 'Küstenklippe, Hochplateau', placeOn: 'Ecke einer Klippenkante', instancing: false, status: 'planned', motif: 'a cliff corner tile turning the cliff edge 90°, tileable with cliff_edge' },
          { name: 'hero_coastal_cliff', footprint: '6×6, modular', sizeClass: 'hero', biome: 'Küste', spawnRule: 'ein Exemplar, handplatziert an der Küstenzone', status: 'planned', motif: 'a hero coastal cliff formation with crashing waves, seabirds and a narrow cliffside path' },
          { name: 'hero_harbor_bay', footprint: '6×6, modular', sizeClass: 'hero', biome: 'Küste, Bucht', spawnRule: 'ein Exemplar, handplatziert', status: 'planned', motif: 'a coastal harbor bay with wooden piers, small docks and calm water, rocky shoreline' },
        ],
      },
      {
        title: 'Geplant — Hügel, Ebenen & weitere Hero-Weltformen',
        note: 'Große, prägende Weltformen für Orientierung; handplatziert pro Zone, nicht zufallsgestreut.',
        entries: [
          { name: 'hill_small', footprint: '2×2', sizeClass: 'terrain_feature', biome: 'Grasland-Hügelland', placeOn: 'Übergangszone Ebene → Gebirge', instancing: false, status: 'planned', motif: 'a small rounded grassy hill mound with a gentle slope, blends into flat ground at its base' },
          { name: 'boulder_cluster', footprint: '1×1', sizeClass: 'prop_large', biome: 'Gebirge, Fels, Küste', placeOn: 'mountain, sand, Felsrand', neverOn: 'Straße, Gebäude', instancing: true, randomize: 'Zufallsrotation + Zufallsskalierung', status: 'planned', motif: 'a cluster of stylized grey boulders of varied size sitting on the ground, low-poly' },
          { name: 'rock_outcrop', footprint: '1–2 Kacheln', sizeClass: 'terrain_feature', biome: 'Gebirge, Grasland-Übergang', placeOn: 'mountain-nahe Kacheln', instancing: true, status: 'planned', motif: 'a rocky outcrop rising from the ground, layered stone, flat base' },
          { name: 'hero_mountain_range_west', footprint: '8×8–12×12, modular', sizeClass: 'hero', biome: 'Gebirge', spawnRule: 'ein Exemplar, bildet den Gebirgszug einer Kartenseite', status: 'planned', motif: 'a large stylized rocky mountain range with steep cliffs, a valley pass and a tunnel entrance, layered peaks, no snow' },
          { name: 'hero_river_valley', footprint: '6×6, modular', sizeClass: 'hero', biome: 'Fluss/Tal', spawnRule: 'ein Exemplar, entlang des Hauptflusslaufs', status: 'planned', motif: 'a hero river valley: a carved river gorge with a stream, footbridge and terraced banks' },
          { name: 'hero_lake_basin', footprint: '6×6, modular', sizeClass: 'hero', biome: 'See', spawnRule: 'ein Exemplar, in einer Geländesenke', status: 'planned', motif: 'a hero lake basin: a calm lake surrounded by reeds, rocks and a small shoreline path' },
          { name: 'hero_forest_ridge', footprint: '6×6, modular', sizeClass: 'hero', biome: 'Mischwald', spawnRule: 'ein Exemplar, auf einem Höhenzug', status: 'planned', motif: 'a hero forest ridge: a densely wooded hilltop ridge with a scenic overlook clearing' },
          { name: 'hero_fertile_valley', footprint: '6×6, modular', sizeClass: 'hero', biome: 'Fruchtbares Land', spawnRule: 'ein Exemplar, in der Farmregion', status: 'planned', motif: 'a hero fertile valley: patchwork farm fields with hedgerows, a windmill and a dirt path' },
          { name: 'hero_dam_site', footprint: '8×4, modular', sizeClass: 'hero', biome: 'Fluss/Tal', placeOn: 'spannt Flusstal', status: 'planned', motif: 'a hero dam site: a concrete dam across a narrow valley with a reservoir and a spillway' },
          { name: 'hero_ruins_ancient', footprint: '4×4, modular', sizeClass: 'hero', biome: 'Grasland, Wald', spawnRule: 'ein Exemplar, versteckt abseits der Stadt', status: 'planned', motif: 'a hero ancient ruin: crumbling stone walls, broken columns and overgrown vines on a grassy mound' },
          { name: 'hero_cave_system', footprint: '4×4, modular', sizeClass: 'hero', biome: 'Gebirge', placeOn: 'Gebirgswand', status: 'planned', motif: 'a hero cave system entrance: a large dark cave mouth in a rock face with stalactite details and a path leading in' },
          { name: 'hero_island_offshore', footprint: '4×4, modular', sizeClass: 'hero', biome: 'Meer', placeOn: 'im Meer, sichtbar vom Festland', status: 'planned', motif: 'a hero small offshore island with a few trees, rocks and a sandy beach, surrounded by sea' },
        ],
      },
    ],
  },
  {
    key: 'roads',
    title: 'Straßen',
    intro:
      '**Straßen laden seit v0.44 nie mehr ein `.glb`** (§ Straßen als Textur). Die Mask-getriebene ' +
      'Straßengeometrie (gerade/Kurve/T/Kreuzung/Ende, Kreisverkehr, Bergstraße, Steg/Brücke) ist jetzt ' +
      'texturbasiert — siehe `docs/ROAD_TEXTURES.md` und `src/assets/roadTextureManifest.ts` für die ' +
      'aktuelle Drop-in-Spezifikation (`src/assets/textures/roads/…`).',
    groups: [],
  },
  {
    key: 'bridges',
    title: 'Brücken',
    intro:
      '**Brücken laden seit v0.44 nie mehr ein `.glb`** (§ Straßen als Textur). Eine Straße über Wasser ' +
      'wird jetzt als texturierter Steg (schmale Spannweite) oder Brücke (breite Spannweite) gerendert — ' +
      'siehe `docs/ROAD_TEXTURES.md` und `src/assets/roadTextureManifest.ts`.',
    groups: [],
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
          { name: 'pine_tree', footprint: '1×1', sizeClass: 'prop', heightRange: '≈1.4–1.8 Kacheln', biome: 'Wald, Grasland, fruchtbares Land', placeOn: 'grass, forest, fertile', neverOn: 'Straße, Gebäude-Footprint, Bauplatz, Wasser, Gebirge', minSpacing: '0.3–0.5 Kacheln', randomize: 'Zufallsrotation + Zufallsskalierung (±15%)', instancing: true, status: 'live', motif: 'a single stylized low-poly pine tree, slightly irregular' },
          { name: 'bush_small', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.5 Kacheln', biome: 'Wald, Grasland', placeOn: 'grass, forest, fertile', neverOn: 'Straße, Gebäude-Footprint, Wasser', instancing: true, status: 'live', motif: 'a small round low-poly bush' },
          { name: 'construction_site', footprint: '1–3 Kacheln', sizeClass: 'prop_large', biome: 'überall (temporär)', placeOn: 'Gebäude im Bau/Upgrade', instancing: false, status: 'live', motif: 'a construction site prop: scaffolding, a small crane and barriers with warning stripes, to sit over a building under construction' },
        ],
      },
      {
        title: 'Geplant — Natur, Stadt, Hafen, Farm',
        note: 'Siehe docs/3D_WORLD_ASSETS.md §11/§14.',
        entries: [
          { name: 'tree_deciduous', footprint: '1×1', sizeClass: 'prop', heightRange: '≈1.5 Kacheln', biome: 'Mischwald, Grasland', placeOn: 'grass, forest, fertile', neverOn: 'Straße, Gebäude, Wasser, Gebirge', minSpacing: '0.3–0.5 Kacheln', randomize: 'Zufallsrotation + Zufallsskalierung', instancing: true, status: 'planned', motif: 'a single stylized low-poly broadleaf/deciduous tree with a round crown, about 1.5 tiles tall' },
          { name: 'tree_pine_large', footprint: '1×1', sizeClass: 'prop', heightRange: '≈1.8 Kacheln', biome: 'Wald, Gebirgsrand', placeOn: 'forest, mountain-nahe grass', instancing: true, status: 'planned', motif: 'a tall stylized pine tree, about 1.8 tiles tall, slim conical crown' },
          { name: 'forest_cluster_small', footprint: '2×2', sizeClass: 'prop_large', biome: 'Waldrand', placeOn: 'forest-Kante', spawnRule: 'am Waldrand für organische Übergänge statt harter Kante', instancing: false, status: 'planned', motif: 'a small cluster of 3–4 mixed trees and undergrowth, forming a natural forest-edge patch' },
          { name: 'forest_cluster_medium', footprint: '3×3', sizeClass: 'prop_large', biome: 'Waldrand', placeOn: 'forest-Kante', spawnRule: 'am Waldrand für organische Übergänge statt harter Kante', instancing: false, status: 'planned', motif: 'a medium cluster of 6–8 mixed trees, bushes and fallen logs, forming a natural forest-edge patch' },
          { name: 'fallen_log', footprint: '1×1', sizeClass: 'prop', biome: 'Wald', placeOn: 'forest', instancing: true, status: 'planned', motif: 'a fallen mossy tree log lying on the forest floor, low-poly' },
          { name: 'grass_patch', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.2 Kacheln', biome: 'Grasland', placeOn: 'grass', instancing: true, randomize: 'Zufallsrotation', status: 'planned', motif: 'a small patch of taller grass tufts, low-poly, sits flush on grass tiles' },
          { name: 'flower_patch', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.2 Kacheln', biome: 'Grasland, fruchtbares Land', placeOn: 'grass, fertile', instancing: true, randomize: 'Zufallsrotation + Zufallsfarbe (falls Vertex-Color)', status: 'planned', motif: 'a small patch of colorful wildflowers among short grass, low-poly' },
          { name: 'hedge', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.5 Kacheln', biome: 'Stadtrand, Park', instancing: true, status: 'planned', motif: 'a low trimmed green hedge segment, about 0.5 tiles tall, tileable side to side' },
          { name: 'reeds_water', footprint: '1×1', sizeClass: 'prop', biome: 'See-/Flussufer', placeOn: 'shore_tile, lake_edge', instancing: true, status: 'planned', motif: 'a cluster of tall water reeds/cattails for lake and river shores, low-poly' },
          { name: 'rock_small', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.4 Kacheln', biome: 'Gebirge, Grasland', instancing: true, status: 'planned', motif: 'a small stylized grey rock / few stones on the ground, about 0.4 tiles tall, low-poly' },
          { name: 'rock_medium', footprint: '1×1', sizeClass: 'prop', biome: 'Gebirge, Küste', instancing: true, status: 'planned', motif: 'a medium stylized grey boulder / rock cluster, low-poly' },
          { name: 'rock_large', footprint: '1×1', sizeClass: 'prop_large', heightRange: '≈1.0 Kacheln', biome: 'Gebirge', instancing: true, status: 'planned', motif: 'a large stylized grey boulder, about 1 tile tall, layered stone, low-poly' },
          { name: 'street_lamp', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.9 Kacheln', biome: 'Stadt', placeOn: 'entlang Gehweg/Straße', animationNodes: 'reserved: light_window/glow bei Nacht', instancing: true, status: 'planned', motif: 'a stylized street lamp post with a glowing lamp head' },
          { name: 'bench', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.4 Kacheln', biome: 'Stadt, Park', instancing: true, status: 'planned', motif: 'a simple park bench, low-poly' },
          { name: 'market_stall', footprint: '1×1', sizeClass: 'prop', biome: 'Stadtzentrum, Markt', instancing: false, status: 'planned', motif: 'a market stall with a striped awning and crates of goods' },
          { name: 'boat_small', footprint: '1×2', sizeClass: 'prop_large', frontFacing: '+Z', biome: 'Küste, See', placeOn: 'an Pier/Ufer, im Wasser', instancing: false, status: 'planned', motif: 'a small rowing/fishing boat, front facing +Z, low-poly' },
          { name: 'hay_bale', footprint: '1×1', sizeClass: 'prop', biome: 'Fruchtbares Land', instancing: true, status: 'planned', motif: 'a round hay bale, low-poly' },
          { name: 'tractor_small', footprint: '1×1', sizeClass: 'prop', frontFacing: '+Z', biome: 'Fruchtbares Land', instancing: false, status: 'planned', motif: 'a small farm tractor, front facing +Z, low-poly' },
          { name: 'field_crop_rows', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.3 Kacheln', biome: 'Fruchtbares Land, Farm', placeOn: 'freie Kacheln im Farm-Footprint', instancing: true, randomize: 'Zufallsrotation (0/90°), Frucht-Farbvariante', status: 'planned', motif: 'a patch of neat crop rows (wheat or vegetables) on ploughed soil, tileable, low-poly' },
          { name: 'fence_wooden', footprint: '1×1, modular', sizeClass: 'prop', heightRange: '≈0.5 Kacheln', biome: 'Farm, Weide', placeOn: 'Rand des Farm-/Weide-Grundstücks', instancing: true, status: 'planned', motif: 'a wooden farm fence segment with posts and rails, tileable side to side, low-poly' },
          { name: 'farm_gate', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.6 Kacheln', biome: 'Farm, Weide', placeOn: 'Zaun-Öffnung zur Straße', instancing: false, status: 'planned', motif: 'a simple wooden farm gate in a fence line, low-poly' },
          { name: 'scarecrow', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.8 Kacheln', biome: 'Fruchtbares Land, Farm', placeOn: 'im Feld', instancing: true, status: 'planned', motif: 'a straw scarecrow on a wooden cross frame standing in a field, low-poly' },
          { name: 'windmill_small', footprint: '2×2', sizeClass: 'prop_large', heightRange: '≈2.5 Kacheln', biome: 'Fruchtbares Land', animationNodes: 'reserved: rotor (drehende Flügel)', instancing: false, status: 'planned', motif: "a small rustic windmill with four turning sails on a node named 'rotor', stone or wooden base, low-poly" },
        ],
      },
      {
        title: 'Geplant — Gelände-Anpassung für Straßen (props/infrastructure/)',
        note: 'Straßen dürfen niemals schweben: bei Steigungen entstehen Böschungen/Stützmauern statt schwebender Kanten (World-Graphics-V2 §5).',
        entries: [
          { name: 'retaining_wall', footprint: '1×1, modular entlang Kante', sizeClass: 'terrain_feature', biome: 'Gebirge, Hügelland', placeOn: 'entlang einer Straßen-/Bauplatzkante mit Höhenversatz', instancing: true, status: 'planned', motif: 'a stone retaining wall segment holding back a slope, tileable side to side' },
          { name: 'embankment_slope', footprint: '1×1, modular', sizeClass: 'terrain_feature', biome: 'Gebirge, Hügelland', placeOn: 'natürliche Böschung statt Stützmauer, weicher Höhenübergang', instancing: true, status: 'planned', motif: 'a grassy earth embankment slope segment smoothing a height step next to a road, tileable' },
        ],
      },
      {
        title: 'Geplant — Wegkreuze, Wanderwege, Naturdenkmäler, ländliche Umgebung',
        note: 'Kleine Weltobjekte AUSSERHALB der Stadt, die die Karte lebendig statt leer wirken lassen (World-Graphics-V2 Erweiterung).',
        entries: [
          { name: 'wayside_cross', footprint: '1×1', sizeClass: 'prop', heightRange: '≈1.0 Kacheln', biome: 'Grasland, Feldweg', instancing: false, status: 'planned', motif: 'a small stone or wooden wayside cross/shrine beside a country path, weathered and rustic' },
          { name: 'hiking_trail_marker', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.6 Kacheln', biome: 'Gebirge, Wald, Hügelland', placeOn: 'entlang eines Wanderwegs', instancing: true, status: 'planned', motif: 'a small wooden hiking trail signpost with a directional arrow, rustic style' },
          { name: 'natural_monument_stone', footprint: '1×1', sizeClass: 'prop_large', heightRange: '≈1.2 Kacheln', biome: 'Gebirge, Grasland', instancing: false, status: 'planned', motif: 'a striking single natural monument boulder, distinct shape, marked as a scenic point of interest' },
          { name: 'viewpoint_bench', footprint: '1×1', sizeClass: 'prop', biome: 'Hochplateau, Klippe', placeOn: 'an Aussichtspunkten', instancing: false, status: 'planned', motif: 'a scenic viewpoint bench with a small wooden railing, facing outward over a vista' },
          { name: 'cave_entrance_small', footprint: '1×1', sizeClass: 'prop_large', biome: 'Gebirge', placeOn: 'mountain-Wandfuß', instancing: false, status: 'planned', motif: 'a small dark cave entrance opening in a rocky mountainside, low-poly' },
          { name: 'mine_entrance_small', footprint: '1×1', sizeClass: 'prop_large', biome: 'Gebirge', placeOn: 'mountain-Wandfuß, außerhalb der Stadt', instancing: false, status: 'planned', motif: 'a small abandoned mine entrance with wooden support beams set into a rocky slope' },
          { name: 'farmstead_ruin', footprint: '2×2', sizeClass: 'prop_large', biome: 'Fruchtbares Land, Grasland', instancing: false, status: 'planned', motif: 'a small rustic farmstead outside the city: a weathered barn, a fence and a dirt yard' },
          { name: 'village_cluster_small', footprint: '3×3', sizeClass: 'hero', biome: 'Grasland, Hügelland', spawnRule: 'ein bis zwei Exemplare, abseits der Stadt', instancing: false, status: 'planned', motif: 'a tiny rural village cluster of 3–4 small cottages with a shared dirt path, outside the main city' },
        ],
      },
      {
        title: 'Geplant — saisonale Deko',
        note: 'Optionale Überlagerung auf bestehenden Props/Terrain, keine neue Kategorie in der Spiellogik.',
        entries: [
          { name: 'seasonal_wreath_winter', footprint: '1×1', sizeClass: 'prop', biome: 'Stadt (saisonal)', instancing: false, status: 'planned', motif: 'a small festive winter wreath decoration with a red ribbon, to hang on a building facade' },
          { name: 'seasonal_pumpkin_pile', footprint: '1×1', sizeClass: 'prop', biome: 'Stadt, Farm (saisonal)', instancing: true, status: 'planned', motif: 'a small autumn pile of decorative pumpkins beside a path' },
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
          { name: 'car', footprint: '≈0.3×0.5', sizeClass: 'vehicle', status: 'live', motif: 'a small stylized car, readable from an isometric camera, front facing +Z, low-poly' },
          { name: 'service_van', footprint: '≈0.4×0.7', sizeClass: 'vehicle', status: 'live', motif: 'a small white delivery / service van, front facing +Z, low-poly' },
        ],
      },
      {
        title: 'Geplant — Flotte',
        note: 'Verkehr fährt künftig Haus → Straße → Ziel statt Zufallslauf (World-Graphics-V2 §11) — betrifft nur die Pathing-Logik, nicht die Modelle hier.',
        entries: [
          { name: 'truck_food', footprint: '≈0.5×0.9', sizeClass: 'vehicle', status: 'planned', motif: 'a small food delivery truck with a box body, front facing +Z, low-poly' },
          { name: 'firetruck', footprint: '≈0.5×0.9', sizeClass: 'vehicle', status: 'planned', motif: 'a red fire truck with a ladder, front facing +Z, low-poly' },
          { name: 'police_car', footprint: '≈0.3×0.5', sizeClass: 'vehicle', status: 'planned', motif: 'a police car with blue livery and a light bar, front facing +Z, low-poly' },
          { name: 'ambulance', footprint: '≈0.4×0.7', sizeClass: 'vehicle', status: 'planned', motif: 'a white ambulance with a red cross and a light bar, front facing +Z, low-poly' },
          { name: 'bus_small', footprint: '≈0.4×1.0', sizeClass: 'vehicle', status: 'planned', motif: 'a small city bus, front facing +Z, low-poly' },
        ],
      },
      {
        title: 'Geplant — Stadtarbeit-Fahrzeuge (A6, „Selbst fahren")',
        note: 'Die fünf steuerbaren Missionsfahrzeuge (A6). Der Fahrmodus nutzt bis zum Drop-in prozedurale Platzhalter je Typ — diese Modelle ersetzen sie. Front +Z, klare Silhouette auch aus der Verfolgerkamera.',
        entries: [
          { name: 'logging_truck', footprint: '≈0.5×1.1', sizeClass: 'vehicle', status: 'planned', motif: 'a logging truck carrying stacked tree logs on a long flatbed trailer, front facing +Z, low-poly' },
          { name: 'flatbed', footprint: '≈0.5×1.0', sizeClass: 'vehicle', status: 'planned', motif: 'a flatbed construction-material truck loaded with pallets of bricks and planks, front facing +Z, low-poly' },
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
          { name: 'marker_task', footprint: '~1 Kachel hoch', sizeClass: 'marker', pivot: 'zentriert, schwebt über dem Gebäude', frontFacing: 'n/a, immer zur Kamera (Billboard-Fallback)', status: 'live', motif: 'a floating quest/task marker: a rounded teal pin with a clean icon, readable from any angle' },
          { name: 'marker_construction', footprint: '~1 Kachel hoch', sizeClass: 'marker', pivot: 'zentriert, schwebt', status: 'live', motif: 'a floating construction marker: a yellow pin with a wrench or hard-hat icon' },
          { name: 'marker_problem', footprint: '~1 Kachel hoch', sizeClass: 'marker', pivot: 'zentriert, schwebt', status: 'live', motif: 'a floating problem marker: a red pin with a white exclamation mark' },
          { name: 'marker_upgrade', footprint: '~1 Kachel hoch', sizeClass: 'marker', pivot: 'zentriert, schwebt', status: 'live', motif: 'a floating upgrade marker: a green pin with a white up-arrow' },
        ],
      },
      {
        title: 'Geplant — weitere Zustände & Sektoren',
        entries: [
          { name: 'marker_water', footprint: '~1 Kachel hoch', sizeClass: 'marker', pivot: 'zentriert, schwebt', status: 'planned', motif: 'a floating blue water marker: a droplet icon pin' },
          { name: 'marker_trade', footprint: '~1 Kachel hoch', sizeClass: 'marker', pivot: 'zentriert, schwebt', status: 'planned', motif: 'a floating orange trade marker: a coins/handshake icon pin' },
          { name: 'marker_resource', footprint: '~1 Kachel hoch', sizeClass: 'marker', pivot: 'zentriert, schwebt', status: 'planned', motif: 'a floating resource marker: a crate/ore icon pin' },
          { name: 'sector_border_locked', footprint: 'entlang Sektorgrenze', sizeClass: 'marker', pivot: 'liegt auf dem Boden', status: 'planned', motif: 'a low glowing fence/border line marking a locked sector boundary, semi-transparent' },
          { name: 'sector_border_unlocked', footprint: 'entlang Sektorgrenze', sizeClass: 'marker', pivot: 'liegt auf dem Boden', status: 'planned', motif: 'a subtle low border line marking a freshly unlocked sector boundary' },
          { name: 'sector_marker_build', footprint: '1×1', sizeClass: 'marker', pivot: 'liegt auf dem Boden', status: 'planned', motif: 'a buildable-zone marker: a green dashed frame with a small tool icon on the ground' },
          { name: 'sector_marker_resource', footprint: '1×1', sizeClass: 'marker', pivot: 'liegt auf dem Boden', status: 'planned', motif: 'a resource-hint zone marker: a faint dashed frame with a subtle ore/wood icon on the ground' },
        ],
      },
      {
        title: 'Geplant — Sektor-Nebel & Bürgerhinweise',
        note: 'Gesperrte Sektoren zeigen keine vollständige Sicht: dichter Nebel, Silhouetten, gelegentliche Bürgerhinweise als Sprechblase (World-Graphics-V2 §9). Reiner Hinweis-/Mystery-Zweck, keine Gameplay-Information.',
        entries: [
          { name: 'locked_sector_fog_veil', footprint: 'deckt einen ganzen Sektor ab', sizeClass: 'terrain_feature', pivot: 'flache Ebene über dem Sektor, halbtransparent', frontFacing: 'n/a', biome: 'gesperrter Sektor', effectNodes: 'leichte Partikel-Nebelbewegung', instancing: false, status: 'planned', motif: 'a dense, softly animated fog veil mesh covering an unrevealed map sector, semi-transparent, obscuring detail beneath' },
          { name: 'landmark_silhouette_hint', footprint: 'grob wie das verborgene Hero-Objekt', sizeClass: 'terrain_feature', pivot: DEFAULT_PIVOT, biome: 'gesperrter Sektor', spawnRule: 'nur wenn ein Hero-/Landmarken-Objekt im Sektor liegt', instancing: false, status: 'planned', motif: 'a low-detail dark silhouette shape hinting at a large landmark hidden behind fog, barely readable, no surface detail' },
          { name: 'marker_citizen_hint', footprint: '~1 Kachel hoch', sizeClass: 'marker', pivot: 'schwebt über einem Bürger/Gebäude', biome: 'überall, temporär', status: 'planned', motif: 'a floating speech-bubble marker mesh with a small dashed outline, used for a citizen hint about an unrevealed sector (text content is UI/i18n, not part of the mesh)' },
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
          { name: 'smoke_chimney', footprint: 'klein', sizeClass: 'effect', effectNodes: 'chimney (Ursprungspunkt am Gebäude)', status: 'live', motif: 'a small soft stylized smoke/steam puff mesh for a chimney, light grey, semi-transparent look' },
        ],
      },
      {
        title: 'Geplant — feste Effekt-Meshes',
        entries: [
          { name: 'upgrade_glow', footprint: 'klein', sizeClass: 'effect', status: 'planned', motif: 'a soft golden glow/sparkle burst mesh to play when a building is upgraded' },
          { name: 'building_complete_effect', footprint: 'klein', sizeClass: 'effect', status: 'planned', motif: 'a small celebratory confetti/spark ring mesh for when construction completes' },
          { name: 'waterfall_mist', footprint: 'klein, am Wasserfallfuß', sizeClass: 'effect', status: 'planned', motif: 'a soft white mist/foam puff mesh to sit at the base of a waterfall' },
          { name: 'fire_response_effect', footprint: 'klein', sizeClass: 'effect', status: 'planned', motif: 'a small flashing emergency-light effect mesh for an active fire response' },
          { name: 'police_patrol_effect', footprint: 'klein', sizeClass: 'effect', status: 'planned', motif: 'a small flashing blue-light effect mesh for an active police patrol' },
          { name: 'trade_delivery_effect', footprint: 'klein', sizeClass: 'effect', status: 'planned', motif: 'a small sparkle/coin effect mesh marking a completed trade delivery' },
        ],
      },
      {
        title: 'Geplant — lebendige Welt (bewusst KEIN `.glb`, Partikel/Shader)',
        note: 'World-Graphics-V2 §10: die Welt soll sich schon aus großer Entfernung bewegen. Diese Effekte sind als Renderer-Partikel/Shader sinnvoller als als Mesh — hier trotzdem vollständig dokumentiert, damit nichts fehlt.',
        entries: [
          { name: 'bird_flock_effect', footprint: 'groß, am Himmel', sizeClass: 'effect', implementation: 'particle-shader', status: 'planned', motif: 'a small flock of simple low-poly birds looping across the sky at distance' },
          { name: 'butterfly_swarm_effect', footprint: 'klein, über Wiesen/Blumenbeeten', sizeClass: 'effect', implementation: 'particle-shader', status: 'planned', motif: 'a few simple low-poly butterflies drifting above meadows and flower patches' },
          { name: 'tree_wind_sway_effect', footprint: 'n/a (Vertex-Shader auf Baum-/Buschmodellen)', sizeClass: 'effect', implementation: 'particle-shader', status: 'planned', motif: 'a gentle vertex-shader sway applied to tree and bush canopies to suggest wind' },
          { name: 'water_surface_motion_effect', footprint: 'n/a (Shader auf Wasserflächen)', sizeClass: 'effect', implementation: 'particle-shader', status: 'planned', motif: 'a subtle animated ripple/wave shader for river, lake and ocean surfaces' },
          { name: 'harbor_wave_effect', footprint: 'klein, an Küste/Pier', sizeClass: 'effect', implementation: 'particle-shader', status: 'planned', motif: 'small breaking-wave foam particles along a rocky or sandy coastline' },
          { name: 'cloud_shadow_effect', footprint: 'groß, über der Karte', sizeClass: 'effect', implementation: 'particle-shader', status: 'planned', motif: 'a soft moving cloud-shadow patch drifting slowly across the terrain' },
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
          { name: 'ui_selection_ring', footprint: 'Footprint des Gebäudes', sizeClass: 'marker', pivot: 'liegt flach auf dem Boden unter dem Gebäude', status: 'live', motif: 'a thin glowing flat selection ring that lies on the ground around a building, emissive, no top surface' },
          { name: 'ui_upgrade_button', footprint: 'klein', sizeClass: 'marker', pivot: 'schwebt über dem Gebäude', status: 'planned', motif: 'a floating 3D upgrade button: an up-arrow inside a rounded chip, bright and readable, hovers above a building' },
          { name: 'ui_build_button', footprint: 'klein', sizeClass: 'marker', pivot: 'schwebt über dem Gebäude', status: 'planned', motif: 'a floating 3D action button: a hammer or plus inside a rounded chip' },
          { name: 'ui_level_badge', footprint: 'klein', sizeClass: 'marker', pivot: 'schwebt über dem Gebäude', status: 'planned', motif: 'a small floating level badge chip that displays a building level number' },
        ],
      },
    ],
  },
  {
    key: 'animals',
    title: 'Weidetiere (Landwirtschaft)',
    intro:
      'Tiere für die lebendigen Höfe (A7). Der Renderer streut sie instanziert auf freie Weidekacheln rund um ' +
      'aktive Bauernhöfe und lässt sie gemächlich grasen/wandern; bis zum Drop-in sind es prozedurale ' +
      'Platzhalter. **Klein halten** (ein Rind ≈ 0.5 Kacheln hoch), Pivot unten-mittig, Front +Z, wenige Tris ' +
      '(werden vielfach instanziert). ' +
      SCALE_NOTE,
    groups: [
      {
        title: 'Geplant — Nutztiere (instanziert, Weide-Wander-Animation im Renderer)',
        note: 'Ein ruhiges Idle/Graze genügt; die Bewegung über die Weide macht der Renderer (kein Skelett-Animationszwang). Mehr Tiere je Farmstufe, global gedeckelt.',
        entries: [
          { name: 'cow', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.5 Kacheln', biome: 'Farm, Weide, Fruchtbares Land', placeOn: 'freie Weidekacheln um die Farm', instancing: true, randomize: 'Zufallsrotation, leichte Skalierung, Fell-Farbvariante', status: 'planned', motif: 'a small stylized cow standing on grass, black-and-white patches, front facing +Z, low-poly' },
          { name: 'sheep', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.4 Kacheln', biome: 'Farm, Weide', placeOn: 'freie Weidekacheln', instancing: true, randomize: 'Zufallsrotation, leichte Skalierung', status: 'planned', motif: 'a small fluffy white sheep grazing on grass, front facing +Z, low-poly' },
          { name: 'chicken', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.25 Kacheln', biome: 'Farm', placeOn: 'freie Kacheln nahe der Scheune', instancing: true, randomize: 'Zufallsrotation', status: 'planned', motif: 'a tiny stylized chicken pecking the ground, front facing +Z, low-poly' },
          { name: 'horse', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.6 Kacheln', biome: 'Farm, Weide', placeOn: 'freie Weidekacheln', instancing: true, randomize: 'Zufallsrotation, Fell-Farbvariante', status: 'planned', motif: 'a small stylized horse standing on grass, brown coat, front facing +Z, low-poly' },
          { name: 'pig', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.35 Kacheln', biome: 'Farm', placeOn: 'freie Kacheln nahe der Scheune', instancing: true, randomize: 'Zufallsrotation', status: 'planned', motif: 'a small pink pig standing on soil, front facing +Z, low-poly' },
          { name: 'goat', footprint: '1×1', sizeClass: 'prop', heightRange: '≈0.4 Kacheln', biome: 'Farm, Weide, Hügelland', placeOn: 'freie Weidekacheln', instancing: true, randomize: 'Zufallsrotation', status: 'planned', motif: 'a small stylized goat grazing on grass, front facing +Z, low-poly' },
        ],
      },
    ],
  },
];

const PROMPT_INTRO_TECH =
  '**Technik (Pflicht):** `.glb`, Texturen eingebettet, keine Lichter/Kameras, +Y oben, ' +
  'Front +Z, Pivot mittig an der Unterkante, 1 Tile = 1 Welt-Einheit. Stil-Details & Budgets: ' +
  '`docs/3D_WORLD_ASSETS.md`.';

/** Formats the structured per-model spec (size class, height, pivot, placement,
 *  biome, animation/effect nodes …) as one compact line under the prompt block.
 *  Only fields that are actually set (or resolvable defaults) are printed — this
 *  is what makes ~200 entries maintainable instead of restating every field by
 *  hand on every row. */
function specLine(e: PromptEntry): string {
  const parts: string[] = [];
  if (e.sizeClass) {
    const b = SIZE_CLASS_BUDGETS[e.sizeClass];
    parts.push(`Größenklasse \`${e.sizeClass}\` — ${b.label} (${b.triBudget}, ${b.textureSize}, ${b.materials})`);
  }
  if (e.heightRange) parts.push(`Höhe ${e.heightRange}`);
  if (e.implementation !== 'particle-shader') {
    parts.push(`Pivot ${e.pivot ?? DEFAULT_PIVOT}`);
    parts.push(`Front ${e.frontFacing ?? DEFAULT_FRONT}`);
  }
  if (e.biome) parts.push(`Biom: ${e.biome}`);
  if (e.placeOn) parts.push(`platzierbar auf: ${e.placeOn}`);
  if (e.neverOn) parts.push(`nie auf: ${e.neverOn}`);
  if (e.minSpacing) parts.push(`Mindestabstand ${e.minSpacing}`);
  if (e.randomize) parts.push(e.randomize);
  if (e.instancing !== undefined) parts.push(`Instancing: ${e.instancing ? 'ja' : 'nein'}`);
  if (e.animationNodes) parts.push(`Animations-Node: \`${e.animationNodes}\``);
  if (e.effectNodes) parts.push(`Effekt-Node/-Anschluss: \`${e.effectNodes}\``);
  if (e.spawnRule) parts.push(`Spawn: ${e.spawnRule}`);
  if (e.implementation === 'particle-shader') parts.push('**Kein `.glb`** — als Partikel/Shader im Renderer umgesetzt, nicht als Modell');
  parts.push(e.status === 'live' ? '**live** (bereits verdrahtet)' : '*geplant* (noch nicht verdrahtet)');
  return parts.length ? `\n**Spec:** ${parts.join(' · ')}\n` : '';
}

/** Ein copy-paste-fertiger Prompt-Block (Überschrift + Codeblock mit Prefix+Motiv + Spec-Zeile). */
function promptBlock(e: PromptEntry): string {
  const head = e.footprint ? `### \`${e.name}.glb\` — ${e.footprint}` : `### \`${e.name}.glb\``;
  return `${head}\n\n\`\`\`text\n${STYLE_PREFIX} ${e.motif}\n\`\`\`\n${specLine(e)}`;
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
    `(Stil-Prefix + Motiv) und trägt darunter die volle Spezifikation (Größenklasse/Budget, ` +
    `Höhe, Pivot, Front, Platzierung, Biom, Animationen). ${PROMPT_INTRO_TECH}\n\n` +
    `${fp.intro}\n\n` +
    `${body}`
  );
}

/** Größenklasse eines Gebäudes (XS–XXL). Nimmt das Pflichtfeld `sizeClass`, mit
 *  Footprint-Fallback für gelockerte BuildingLike-Testdaten. */
function buildingSizeClassOf(b: BuildingLike): BuildingSizeClass {
  if (b.sizeClass) return b.sizeClass;
  const n = Math.max(b.size.w, b.size.h);
  if (n <= 1) return 'XS';
  if (n === 2) return 'S';
  if (n === 3) return 'M';
  if (n <= 5) return 'L';
  if (n <= 7) return 'XL';
  return 'XXL';
}

/** Stufen-Motive eines Gebäudes (Index 0 = Basis). Explizite Einträge aus
 *  BUILDING_STAGE_PROMPTS; sonst das Basis-Motiv auf die Stufenzahl aufgefüllt.
 *  Der Sync-Test erzwingt für Mehrstufen-Gebäude echte Einträge. */
export function buildingStagePrompts(b: BuildingLike): readonly string[] {
  const stages = (b.upgrades?.length ?? 0) + 1;
  const explicit = BUILDING_STAGE_PROMPTS[b.id];
  if (explicit) return explicit;
  const base = BUILDING_PROMPTS[b.id] ?? `a ${b.category} building`;
  return Array.from({ length: stages }, () => base);
}

/** Spec-Zeile eines Gebäude-Stufen-Blocks (Budget aus der Gebäude-Größenklasse). */
function buildingSpecLine(b: BuildingLike, stageIndex: number, stages: number): string {
  const cls = buildingSizeClassOf(b);
  const bud = BUILDING_SIZE_BUDGETS[cls];
  const parts: string[] = [
    `Größenklasse \`${cls}\` — ${bud.label} (${bud.triBudget}, ${bud.textureSize}, ${bud.materials})`,
    `Footprint ${b.size.w}×${b.size.h} (fix über alle Stufen)`,
    `Pivot ${DEFAULT_PIVOT}`,
    `Front ${DEFAULT_FRONT} (Eingang zur Straße)`,
  ];
  const nodes = BUILDING_NODES[b.id];
  if (nodes) parts.push(`Nodes: ${nodes}`);
  parts.push(
    stageIndex === 0
      ? `Stufe 1/${stages} — Basis \`${b.id}.glb\``
      : `Stufe ${stageIndex + 1}/${stages} — \`${b.id}${BUILD_STAGE_PREFIX}${stageIndex + 1}.glb\``,
  );
  return `\n**Spec:** ${parts.join(' · ')}\n`;
}

/** Ein copy-paste-fertiger Prompt-Block für EINE Gebäude-Stufe. */
function buildingStageBlock(b: BuildingLike, stageIndex: number, motif: string, stages: number): string {
  const file = stageIndex === 0 ? `${b.id}.glb` : `${b.id}${BUILD_STAGE_PREFIX}${stageIndex + 1}.glb`;
  const head = `#### \`${file}\` — Stufe ${stageIndex + 1}/${stages}`;
  return `${head}\n\n\`\`\`text\n${STYLE_PREFIX} ${motif}\n\`\`\`\n${buildingSpecLine(b, stageIndex, stages)}`;
}

/** Markdown für `buildings/PROMPTS.md` — ein Prompt je STUFE + Landmarken. */
export function buildBuildingsPrompts(buildings: readonly BuildingLike[]): string {
  const rows = buildings
    .filter((b) => b.category !== 'roads')
    .map((b) => {
      const stages = (b.upgrades?.length ?? 0) + 1;
      const motifs = buildingStagePrompts(b);
      const blocks = motifs.map((m, i) => buildingStageBlock(b, i, m, stages)).join('\n');
      const construction =
        `> Baustelle (Bau *und* Upgrade): \`${b.id}${BUILD_CONSTRUCTION_SUFFIX}.glb\`, sonst generisches ` +
        `Baustellen-Prop, sonst prozedurales Gerüst. Der Renderer skaliert jedes Modell automatisch auf den Footprint.\n`;
      return `### ${b.id} — ${stages} ${stages === 1 ? 'Stufe' : 'Stufen'}\n\n${blocks}${construction}`;
    })
    .join('\n');
  const landmarks = BUILDING_LANDMARK_PROMPTS.map(promptBlock).join('\n');
  return (
    `# 3D-Prompts — Gebäude\n\n` +
    `${GEN_BANNER}\n` +
    `> Gebäudeliste kommt aus \`src/game/config/buildings.config.ts\` — neue Gebäude/Stufen erscheinen automatisch.\n\n` +
    `Zielordner: \`src/assets/models/buildings/<kategorie>/\`, **Dateiname = Gebäude-ID** (Basis) bzw. ` +
    `\`<id>_stage<N>.glb\` (Stufe N ≙ Upgrade-Level N−1). **Ein Block je Stufe** — jede Stufe verdichtet den ` +
    `FIXEN Footprint sichtbar weiter. Jeder Block ist copy-paste-fertig (Stil-Prefix + Motiv) und trägt die ` +
    `volle Spezifikation. ${PROMPT_INTRO_TECH}\n\n` +
    `**Front/Eingang:** Vorderseite zeigt +Z zur Straße; der Renderer ergänzt automatisch Gehweg/Vorplatz. ` +
    `Volle Gameplay-Tabelle (Kosten, Effekte, Gates je Stufe): \`docs/BUILDINGS.md\`.\n\n` +
    `## Gebäude (aus buildings.config.ts)\n\n` +
    `${rows}\n` +
    `## Landmarken & Hero-Bauten (geplant)\n\n` +
    `Noch keine Config-IDs; per \`visual.model3d\` verknüpfbar (siehe docs/3D_WORLD_ASSETS.md §13).\n\n` +
    `${landmarks}`
  );
}
