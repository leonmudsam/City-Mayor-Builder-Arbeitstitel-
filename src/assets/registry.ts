// Image-asset registry (§ "generierte Bilder statt SVG"): the drop-in point for
// real rendered artwork. Any PNG/WEBP/JPG placed in the folders below is picked
// up automatically at build time via import.meta.glob — no wiring per file. The
// art components look an asset up by key here; if it exists they render the
// image, otherwise they fall back to the built-in SVG. So the game keeps working
// with zero assets today and reaches the mockup look purely by adding files.
//
//   src/assets/resources/<resourceId>.png     e.g. money.png, wood.png
//   src/assets/buildings/<buildingId>.png      e.g. house_small.png, farm.png
//   src/assets/portraits/<role|citizen_N>.png  e.g. mayor.png, citizen_1.png
//
// Naming and target sizes are documented in docs/ASSETS.md, together with a
// ready-to-paste generation prompt for every single asset.

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

export function resourceImage(id: string): string | undefined {
  return RESOURCE_IMAGES[id];
}

export function buildingImage(id: string | undefined): string | undefined {
  return id ? BUILDING_IMAGES[id] : undefined;
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
