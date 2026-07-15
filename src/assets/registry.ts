// Image-asset registry (§ "generierte Bilder statt SVG"): the drop-in point for
// real rendered artwork. Any PNG/WEBP/JPG placed in the folders below is picked
// up automatically at build time via import.meta.glob — no wiring per file. The
// art components look an asset up by key here; if it exists they render the
// image, otherwise they fall back to the built-in SVG. So the game keeps working
// with zero assets today and reaches the mockup look purely by adding files.
//
//   src/assets/resources/<resourceId>.png       e.g. money.png, wood.png
//   src/assets/buildings/<buildingId>.png        e.g. house_small.png, farm.png
//   src/assets/portraits/<role|citizen_N>.png    e.g. mayor.png, citizen_1.png
//   src/assets/ui/buttons/<name>.png             e.g. btn_build.png
//   src/assets/ui/categories/<cat>.png           e.g. cat_housing.png
//   src/assets/ui/markers/<name>.png             e.g. marker_problem.png
//   src/assets/ui/activities/<name>.png          e.g. activity_food_delivery.png
//   src/assets/ui/events/<name>.png              e.g. event_city_festival.png
//   src/assets/ui/rewards/<name>.png             e.g. reward_money.png
//   src/assets/vehicles/<name>.png               e.g. truck_food.png
//   src/assets/overlays/<name>.png               e.g. overlay_water.png
//
// Naming, sizes and usage are documented in docs/ASSETS.md and docs/UI_ASSETS.md,
// together with a ready-to-paste generation prompt for every single asset.

type UrlMap = Record<string, string>;

/** `./buildings/house_small.png` → `house_small`. */
function keyed(glob: UrlMap): UrlMap {
  const out: UrlMap = {};
  for (const [path, url] of Object.entries(glob)) {
    const file = path.split('/').pop() ?? '';
    const key = file.replace(/\.(png|webp|jpg|jpeg)$/i, '');
    out[key] = url;
  }
  return out;
}

const RESOURCE_IMAGES = keyed(
  import.meta.glob('./resources/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const BUILDING_IMAGES = keyed(
  import.meta.glob('./buildings/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const PORTRAIT_IMAGES = keyed(
  import.meta.glob('./portraits/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
// New UI-artwork folders (v0.26): buttons, category tiles, map markers, activity
// illustrations, event/decision art, reward icons, vehicles and overlay symbols.
const BUTTON_IMAGES = keyed(
  import.meta.glob('./ui/buttons/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const CATEGORY_IMAGES = keyed(
  import.meta.glob('./ui/categories/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const MARKER_IMAGES = keyed(
  import.meta.glob('./ui/markers/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const ACTIVITY_IMAGES = keyed(
  import.meta.glob('./ui/activities/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const EVENT_IMAGES = keyed(
  import.meta.glob('./ui/events/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const REWARD_IMAGES = keyed(
  import.meta.glob('./ui/rewards/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const VEHICLE_IMAGES = keyed(
  import.meta.glob('./vehicles/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const OVERLAY_IMAGES = keyed(
  import.meta.glob('./overlays/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
// Isometric map assets (v0.27): building sprites for the isometric render mode
// and isometric terrain tiles. Keyed by `<id>_iso` filename → `<id>_iso`.
const BUILDING_ISO_IMAGES = keyed(
  import.meta.glob('./buildings/iso/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const TERRAIN_ISO_IMAGES = keyed(
  import.meta.glob('./terrain/*.{png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);

export function resourceImage(id: string): string | undefined {
  return RESOURCE_IMAGES[id];
}

export function buildingImage(id: string | undefined): string | undefined {
  return id ? BUILDING_IMAGES[id] : undefined;
}

export function buttonImage(id: string): string | undefined {
  return BUTTON_IMAGES[id];
}
export function categoryImage(id: string): string | undefined {
  return CATEGORY_IMAGES[id];
}
export function markerImage(id: string): string | undefined {
  return MARKER_IMAGES[id];
}
export function activityImage(id: string): string | undefined {
  return ACTIVITY_IMAGES[id];
}
export function eventImage(id: string): string | undefined {
  return EVENT_IMAGES[id];
}
export function rewardImage(id: string): string | undefined {
  return REWARD_IMAGES[id];
}
export function vehicleImage(id: string): string | undefined {
  return VEHICLE_IMAGES[id];
}
export function overlayImage(id: string): string | undefined {
  return OVERLAY_IMAGES[id];
}

/** Isometric map sprite for a building. Looks up `<id>_iso` first, then `<id>`. */
export function buildingIsoImage(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return BUILDING_ISO_IMAGES[`${id}_iso`] ?? BUILDING_ISO_IMAGES[id];
}
/** Isometric terrain tile, e.g. `grass_iso`, `water_river_iso`. */
export function terrainIsoImage(id: string): string | undefined {
  return TERRAIN_ISO_IMAGES[id];
}

// ---- 3D models (v0.29, true3d render mode) --------------------------------
// glTF-binary (.glb) models are the drop-in point for the real 3D map. As with
// the image folders above, any `.glb` placed in these folders is picked up at
// build time via import.meta.glob (as a URL the GLTFLoader fetches) — no wiring
// per file. When a model is missing the 3D renderer draws a procedural block, so
// the game keeps working with zero models and reaches the full look purely by
// adding files. Naming, scale and pivot rules live in docs/3D_MODELS.md.
//
//   src/assets/models/buildings/<id>.glb          base model (all stages)
//   src/assets/models/buildings/<id>_stage2.glb   optional per-upgrade variant
//   src/assets/models/terrain/<name>.glb           e.g. grass.glb, water.glb
//   src/assets/models/vehicles/<name>.glb          e.g. car.glb, truck_food.glb
// v0.32: models are discovered RECURSIVELY (`**`), so the documented nested
// structure — buildings/housing/, terrain/mountains/, props/nature/, … — is pure
// drop-in: put a correctly named `.glb` ANYWHERE under the category folder and it
// is picked up, keyed by its filename. See docs/3D_WORLD_ASSETS.md. All categories
// have a procedural fallback, so a missing model never breaks the game.
const BUILDING_MODELS = keyedExt(
  import.meta.glob('./models/buildings/**/*.glb', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const TERRAIN_MODELS = keyedExt(
  import.meta.glob('./models/terrain/**/*.glb', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const VEHICLE_MODELS = keyedExt(
  import.meta.glob('./models/vehicles/**/*.glb', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const ROAD_MODELS = keyedExt(
  import.meta.glob('./models/roads/**/*.glb', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const BRIDGE_MODELS = keyedExt(
  import.meta.glob('./models/bridges/**/*.glb', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const PROP_MODELS = keyedExt(
  import.meta.glob('./models/props/**/*.glb', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const MARKER_MODELS = keyedExt(
  import.meta.glob('./models/markers/**/*.glb', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);
const EFFECT_MODELS = keyedExt(
  import.meta.glob('./models/effects/**/*.glb', { eager: true, query: '?url', import: 'default' }) as UrlMap,
);

/** `./models/buildings/housing/house_small.glb` → `house_small` (filename key). */
function keyedExt(glob: UrlMap): UrlMap {
  const out: UrlMap = {};
  for (const [path, url] of Object.entries(glob)) {
    const file = path.split('/').pop() ?? '';
    out[file.replace(/\.glb$/i, '')] = url;
  }
  return out;
}

/**
 * 3D model URL for a building. When `stage > 0` and a per-stage variant
 * `<id>_stage<stage+1>.glb` exists it is preferred (so upgrades can look
 * different); otherwise the base `<id>.glb` is used for every stage. Returns
 * undefined → the renderer falls back to a procedural block.
 */
export function buildingModel(id: string | undefined, stage = 0): string | undefined {
  if (!id) return undefined;
  if (stage > 0) {
    const staged = BUILDING_MODELS[`${id}_stage${stage + 1}`];
    if (staged) return staged;
  }
  return BUILDING_MODELS[id];
}
/** 3D terrain model for a terrain type, e.g. `grass`, `water`, `mountain`. */
export function terrainModel(name: string): string | undefined {
  return TERRAIN_MODELS[name];
}
/** 3D vehicle model, e.g. `car`, `car_small`, `van_service`, `truck_delivery`. */
export function vehicleModel(name: string): string | undefined {
  return VEHICLE_MODELS[name];
}
/** 3D road segment model, e.g. `road_straight`, `road_cross`, `road_t`, `road_end`. */
export function roadModel(name: string): string | undefined {
  return ROAD_MODELS[name];
}
/** 3D bridge model, e.g. `bridge_small_stone`, `bridge_medium_road`. */
export function bridgeModel(name: string): string | undefined {
  return BRIDGE_MODELS[name];
}
/** 3D world prop model, e.g. `tree_pine`, `bush`, `fence`, `crate`, `rock`. */
export function propModel(name: string): string | undefined {
  return PROP_MODELS[name];
}
/** 3D map-marker model, e.g. `marker_problem`, `marker_mission`. */
export function markerModel(name: string): string | undefined {
  return MARKER_MODELS[name];
}
/** 3D effect model, e.g. `crane`, `dust`, `sparkle`. */
export function effectModel(name: string): string | undefined {
  return EFFECT_MODELS[name];
}
/** First available road model (drives whether the procedural road is used). */
export function hasAnyRoadModel(): boolean {
  return Object.keys(ROAD_MODELS).length > 0;
}
/** Whether ANY building model has been supplied (drives a first-run hint). */
export function hasAnyBuildingModel(): boolean {
  return Object.keys(BUILDING_MODELS).length > 0;
}

/** How many generic `citizen_N.png` portraits were supplied (for seed spread). */
const CITIZEN_KEYS = Object.keys(PORTRAIT_IMAGES)
  .filter((k) => /^citizen_\d+$/.test(k))
  .sort();

/**
 * A portrait image for a role. Officials (mayor, merchant, fire, buildingDept)
 * use their own file; ordinary citizens rotate through `citizen_1..N` by seed so
 * different requests show different faces. Returns undefined → SVG fallback.
 */
export function portraitImage(role: string, seedHash: number): string | undefined {
  if (role !== 'citizen') return PORTRAIT_IMAGES[role] ?? undefined;
  if (CITIZEN_KEYS.length === 0) return PORTRAIT_IMAGES['citizen'];
  return PORTRAIT_IMAGES[CITIZEN_KEYS[seedHash % CITIZEN_KEYS.length]!];
}
