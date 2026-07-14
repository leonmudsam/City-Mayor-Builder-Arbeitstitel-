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
