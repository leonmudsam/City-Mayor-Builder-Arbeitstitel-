// Single source of truth for the road/bridge surface textures (v0.44, "Straßen
// als Textur statt 3D-Modell") — mirrors src/assets/terrainTextureManifest.ts's
// pattern exactly: this data generates docs/ROAD_TEXTURES.md (see
// tests/roadTextures.test.ts), so the doc can never drift from what's planned.
//
// Unlike the terrain splat textures (continuous height/slope-blended weights),
// roads are ORIENTED per tile — the existing neighbour-mask → shape+rotation
// logic in ThreeMapRenderer's `roadSegment()` already decides straight/curve/
// T/cross/end; these textures are applied to that same geometry instead of a
// flat colour. Consumed by `buildRoadTile`/`buildBridgeDeck` in
// ThreeMapRenderer.ts; missing files fall back to the existing flat colours
// (never breaks, same drop-in promise as everywhere else). The soft edge
// blend into grass reuses the already-documented `terrain_road_edge` texture
// (docs/TERRAIN_TEXTURES.md, category "Wege") — deliberately not duplicated here.

// ---- categories & shared per-category technical defaults --------------------

export type RoadTextureCategory = 'surface' | 'marking' | 'crossing';

export interface MapSet {
  normal: boolean;
  roughness: boolean;
  ao: boolean;
  height: boolean;
}

export interface CategoryDefaults {
  folder: string;
  resolution: string;
  maps: MapSet;
  detailLevel: string;
}

/** Technical defaults per category — kept here ONCE instead of repeated on
 *  every entry (same lesson as CATEGORY_DEFAULTS in terrainTextureManifest.ts). */
export const CATEGORY_DEFAULTS: Record<RoadTextureCategory, CategoryDefaults> = {
  surface: { folder: 'textures/roads/surface/', resolution: '1024×1024', maps: { normal: true, roughness: true, ao: false, height: false }, detailLevel: 'nah' },
  marking: { folder: 'textures/roads/markings/', resolution: '512×512', maps: { normal: false, roughness: false, ao: false, height: false }, detailLevel: 'nah' },
  crossing: { folder: 'textures/roads/crossings/', resolution: '1024×1024', maps: { normal: true, roughness: true, ao: false, height: false }, detailLevel: 'nah' },
};

export type RoadTexturePriority = 'Pflicht' | 'Empfohlen' | 'Optional';

export interface RoadTextureEntry {
  /** Dateiname ohne Endung, z. B. `road_asphalt`. */
  name: string;
  category: RoadTextureCategory;
  style: string;
  palette: string;
  useCase: string;
  materialProps: string;
  /** Wie/wo diese Textur in der Mask-getriebenen Straßen-Geometrie sitzt. */
  usage: string;
  priority: RoadTexturePriority;
  /** Englisches Motiv, wird an TEXTURE_STYLE_PREFIX gehängt. */
  motif: string;
  /** Ob die Textur Transparenz (Alpha-Lücken) braucht, z. B. gestrichelte Linie. */
  alpha: boolean;
}

// ---- style prefix (shared by every ChatGPT/image-gen prompt) ---------------

export const TEXTURE_STYLE_PREFIX =
  'Seamless tileable stylized road-surface texture for a premium low-poly city-builder game. ' +
  'Soft painterly look, natural subtle wear, no baked lighting, no shadows, top-down ' +
  'orthographic view, perfect seamless edges along the tiling axis, PBR-ready —';

// ---- the textures -----------------------------------------------------------

export const ROAD_TEXTURES: RoadTextureEntry[] = [
  {
    name: 'road_asphalt',
    category: 'surface',
    style: 'painterly, leicht verwittert',
    palette: 'dunkles Blaugrau',
    useCase: 'Standard-Fahrbahnbelag für Kern + Arme jeder Straßenkachel',
    materialProps: 'matt, feinkörnig, leichte Fahrspuren',
    usage: 'ersetzt die Flächenfarbe (0x474d57) auf Kern/Arm-Boxen aus buildRoadTile; kachelt entlang der Straßenachse',
    priority: 'Pflicht',
    alpha: false,
    motif: 'dark blue-grey asphalt road surface, subtle tire wear streaks, fine grain texture, no lane markings',
  },
  {
    name: 'road_mountain',
    category: 'surface',
    style: 'painterly, grob',
    palette: 'staubiges Grau-Braun',
    useCase: 'Bergstraßen/Pässe — Kacheln, deren Untergrund terrainAt==="mountain" ist',
    materialProps: 'körnig, unbefestigt, kleine Geröllsteine',
    usage: 'ersetzt road_asphalt auf Kern/Arm-Boxen, sobald die Straßenkachel auf Gebirgsterrain liegt',
    priority: 'Empfohlen',
    alpha: false,
    motif: 'rough unpaved mountain road surface, dusty grey-brown gravel, small loose rocks, packed dirt ruts',
  },
  {
    name: 'road_marking_dash',
    category: 'marking',
    style: 'painterly, klar',
    palette: 'blasses Gelb-Weiß auf transparentem Grund',
    useCase: 'Mittellinie für Straßenklassen mit centerline:true',
    materialProps: 'flach, matt, scharfe Kante',
    usage: 'ersetzt die Flächenfarbe (0xe4d98f) der Mittellinien-Box; PNG mit Alpha-Lücken zwischen den Strichen, längs der Achse wiederholt (map.repeat)',
    priority: 'Empfohlen',
    alpha: true,
    motif: 'single dashed lane-marking stripe on transparent background, pale yellow-white paint, crisp edges, repeatable along one axis',
  },
  {
    name: 'road_roundabout',
    category: 'marking',
    style: 'painterly, radial',
    palette: 'Asphalt-Blaugrau mit hellem Ring',
    useCase: 'Kreisverkehr-Deckel bei 4-Wege-Kreuzungen (cross_intersection)',
    materialProps: 'matt, radiales Muster',
    usage: 'ersetzt den quadratischen Kern durch eine texturierte CylinderGeometry-Scheibe bei roadSegment(mask).base === "cross_intersection"',
    priority: 'Empfohlen',
    alpha: false,
    motif: 'circular roundabout junction surface seen from directly above, asphalt with a pale outer ring marking, radial subtle texture, centred composition',
  },
  {
    name: 'road_bridge_deck',
    category: 'crossing',
    style: 'painterly, massiv',
    palette: 'Stein-Grau mit Holzbohlen-Akzent',
    useCase: 'Brücken-Fahrbahnbelag für Wasserüberquerungen mit Spannweite > 1 Kachel',
    materialProps: 'fest, leicht verwittert',
    usage: 'ersetzt die Flächenfarbe (0x4a5058) der Brücken-Deck-Box in buildBridgeDeck (breite Variante, mit Geländer/Pfeilern)',
    priority: 'Empfohlen',
    alpha: false,
    motif: 'sturdy stone bridge deck surface with subtle wood-plank accents, weathered grey tones, top-down view',
  },
  {
    name: 'road_boardwalk',
    category: 'crossing',
    style: 'painterly, rustikal',
    palette: 'warmes Holzbraun',
    useCase: 'Steg für Wasserüberquerungen mit Spannweite = 1 Kachel (schmal, ohne Pfeiler)',
    materialProps: 'organisch, sichtbare Bohlenfugen',
    usage: 'ersetzt die Flächenfarbe der schmalen Steg-Deck-Box in buildBridgeDeck (Steg-Variante, ohne Pfeiler)',
    priority: 'Empfohlen',
    alpha: false,
    motif: 'rustic wooden boardwalk planks seen from above, warm brown wood grain, visible plank seams, weathered',
  },
];

// ---- README/PROMPTS-style markdown rendering (pure) --------------------------

const GEN_BANNER =
  '> **Auto-generiert** aus `src/assets/roadTextureManifest.ts`. Nicht von Hand editieren.\n' +
  '> Neue Texturen dazunehmen: Eintrag dort ergänzen, dann\n' +
  '> `WRITE_ROAD_DOCS=1 npx vitest run tests/roadTextures.test.ts` (schreibt diese Datei neu).\n' +
  '> Der Test schlägt fehl, sobald die Doku veraltet ist.';

function mapsLine(m: MapSet): string {
  const yn = (b: boolean) => (b ? '✓' : '–');
  return `Normal ${yn(m.normal)} · Roughness ${yn(m.roughness)} · AO ${yn(m.ao)} · Height ${yn(m.height)}`;
}

function textureBlock(e: RoadTextureEntry): string {
  const d = CATEGORY_DEFAULTS[e.category];
  const head = `### \`${e.name}.png\``;
  const prompt = `\`\`\`text\n${TEXTURE_STYLE_PREFIX} ${e.motif}\n\`\`\``;
  const spec =
    `**Spec:** Ordner \`${d.folder}\` · ${d.resolution} · nahtlos kachelbar${e.alpha ? ' · mit Alphakanal' : ''} · Stil: ${e.style} · ` +
    `Palette: ${e.palette} · Einsatz: ${e.useCase} · Material: ${e.materialProps} · ` +
    `Verwendung: ${e.usage} · Maps: ${mapsLine(d.maps)} · Detailstufe: ${d.detailLevel} · ` +
    `Priorität: **${e.priority}**`;
  return `${head}\n\n${prompt}\n\n${spec}\n`;
}

const CATEGORY_TITLES: Record<RoadTextureCategory, string> = {
  surface: 'Fahrbahn-Oberflächen',
  marking: 'Markierungen',
  crossing: 'Wasserüberquerungen',
};
const CATEGORY_ORDER: RoadTextureCategory[] = ['surface', 'marking', 'crossing'];

/** Markdown für docs/ROAD_TEXTURES.md — vollständig generiert. */
export function renderRoadTexturesDoc(): string {
  const byCategory = (cat: RoadTextureCategory) => ROAD_TEXTURES.filter((t) => t.category === cat);

  const categorySections = CATEGORY_ORDER.map((cat) => {
    const entries = byCategory(cat);
    if (entries.length === 0) return '';
    return `## ${CATEGORY_TITLES[cat]}\n\n${entries.map(textureBlock).join('\n')}`;
  }).join('\n');

  const conceptSection =
    `## Konzept: Textur statt 3D-Modell\n\n` +
    `Straßen laden nie mehr ein \`.glb\` (der alte Drop-in-Pfad über \`roadModel\`/\`bridgeModel\` ` +
    `wurde aus \`ThreeMapRenderer.ts\` entfernt). Stattdessen bleibt die vorhandene, Mask-` +
    `getriebene Geometrie aus \`buildRoadTile\`/\`buildBridgeDeck\` (Kern + Arme + Randstreifen, ` +
    `flach nahe \`y≈0\` ins Höhenfeld integriert) bestehen — sie bekommt nur echte Texturen statt ` +
    `Flächenfarben, sobald eine Datei hier abgelegt wird:\n\n` +
    `- **Form/Rotation** kommt weiterhin aus \`roadSegment(mask)\` (gerade/Kurve/T/Kreuz/Ende) — ` +
    `unverändert seit dem alten 3D-Modell-System.\n` +
    `- **Kreisverkehr** ist keine neue Instanz, sondern dieselbe \`cross_intersection\`-Form mit ` +
    `einer runden statt eckigen Kern-Geometrie + \`road_roundabout\`.\n` +
    `- **Bergstraße/Pass** ist eine reine Textur-Umschaltung, sobald die Kachel auf ` +
    `\`terrainAt==="mountain"\` liegt — kein eigener Straßentyp.\n` +
    `- **Brücke vs. Steg** unterscheidet sich an der gemessenen Wasser-Spannweite (1 Kachel → Steg, ` +
    `mehrere → Brücke) — ebenfalls keine neue Sim-Instanz.\n` +
    `- **Randübergang** zu Gras/Erde nutzt die bereits dokumentierte \`terrain_road_edge.png\` ` +
    `(siehe \`docs/TERRAIN_TEXTURES.md\`, Kategorie „Wege") — hier bewusst nicht dupliziert.\n`;

  return (
    `# Straßen-Texturen — Textur statt 3D-Modell (v0.44)\n\n` +
    `${GEN_BANNER}\n\n` +
    `Ersetzt die 3D-Straßen-/Brücken-Modelle durch texturierte, flach ins Terrain integrierte ` +
    `Fahrbahnflächen. **Drop-in:** \`.png\`/\`.webp\`/\`.jpg\` in den unten angegebenen Ordner ` +
    `unter \`src/assets/textures/roads/…\` legen, Dateiname exakt wie hier — greift automatisch, ` +
    `kein weiterer Code nötig.\n\n` +
    `${categorySections}\n` +
    `${conceptSection}`
  );
}
