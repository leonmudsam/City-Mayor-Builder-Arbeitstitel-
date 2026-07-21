// Single source of truth for the Terrain-System-V2 material textures (v0.42) —
// mirrors src/assets/modelManifest.ts's pattern exactly: this data generates
// docs/TERRAIN_TEXTURES.md (see tests/terrainTextures.test.ts), so the doc can
// never drift from what's actually planned. NOT yet consumed by the renderer:
// this is the *preparation* for a splatmap-blended ground shader (folder layout,
// naming, per-texture spec, blend rules) — the shader itself, and the drop-in
// registry wiring beyond discovery, are a follow-up phase once real textures
// exist to verify against (see docs/3D_WORLD_ASSETS.md "Terrain-Elevation").
//
// Until then the renderer keeps using the vertex-coloured heightfield (v0.39) —
// dropping a texture file in today does nothing yet, same "never breaks" promise
// as everywhere else, just not wired to a consumer yet.

// ---- categories & shared per-category technical defaults --------------------

export type TextureCategory =
  | 'grass'
  | 'earth'
  | 'stone'
  | 'mountain'
  | 'desert'
  | 'swamp'
  | 'coast'
  | 'sand'
  | 'snow'
  | 'water'
  | 'field'
  | 'path';

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

/** Technical defaults per material category — kept here ONCE instead of
 *  repeated on every one of the ~35 texture entries (same lesson as
 *  SIZE_CLASS_BUDGETS in modelManifest.ts: shared values resolved by class,
 *  not restated per row). Override per-entry only where it truly differs. */
export const CATEGORY_DEFAULTS: Record<TextureCategory, CategoryDefaults> = {
  grass: { folder: 'textures/terrain/grass/', resolution: '1024×1024', maps: { normal: true, roughness: true, ao: false, height: true }, detailLevel: 'nah' },
  earth: { folder: 'textures/terrain/earth/', resolution: '1024×1024', maps: { normal: true, roughness: true, ao: false, height: true }, detailLevel: 'nah' },
  stone: { folder: 'textures/terrain/stone/', resolution: '2048×2048', maps: { normal: true, roughness: true, ao: true, height: true }, detailLevel: 'nah–mittel' },
  mountain: { folder: 'textures/terrain/mountain/', resolution: '2048×2048', maps: { normal: true, roughness: true, ao: true, height: true }, detailLevel: 'nah–fern' },
  desert: { folder: 'textures/terrain/desert/', resolution: '2048×2048', maps: { normal: true, roughness: true, ao: true, height: true }, detailLevel: 'nah–fern' },
  swamp: { folder: 'textures/terrain/swamp/', resolution: '2048×2048', maps: { normal: true, roughness: true, ao: true, height: true }, detailLevel: 'nah–mittel' },
  coast: { folder: 'textures/terrain/coast/', resolution: '2048×2048', maps: { normal: true, roughness: true, ao: true, height: true }, detailLevel: 'nah–mittel' },
  sand: { folder: 'textures/terrain/sand/', resolution: '1024×1024', maps: { normal: true, roughness: true, ao: false, height: true }, detailLevel: 'nah' },
  snow: { folder: 'textures/terrain/snow/', resolution: '1024×1024', maps: { normal: true, roughness: true, ao: false, height: true }, detailLevel: 'nah' },
  water: { folder: 'textures/terrain/water/', resolution: '1024×1024', maps: { normal: true, roughness: false, ao: false, height: false }, detailLevel: 'mittel' },
  field: { folder: 'textures/terrain/field/', resolution: '1024×1024', maps: { normal: true, roughness: true, ao: false, height: true }, detailLevel: 'nah' },
  path: { folder: 'textures/terrain/path/', resolution: '1024×1024', maps: { normal: true, roughness: true, ao: false, height: true }, detailLevel: 'nah' },
};

export type TexturePriority = 'Pflicht' | 'Empfohlen' | 'Optional';

export interface TerrainTextureEntry {
  /** Dateiname ohne Endung, z. B. `terrain_grass_01`. */
  name: string;
  category: TextureCategory;
  style: string;
  palette: string;
  useCase: string;
  materialProps: string;
  /** Mischverhalten im Splatmap-System: womit/wie diese Textur überblendet. */
  blend: string;
  priority: TexturePriority;
  /** Englisches Motiv, wird an TEXTURE_STYLE_PREFIX gehängt. */
  motif: string;
  biomes: readonly string[];
}

// ---- style prefix (shared by every ChatGPT/image-gen prompt) ---------------

export const TEXTURE_STYLE_PREFIX =
  'Seamless tileable stylized terrain texture for a premium low-poly city-builder game. ' +
  'Soft painterly look, natural color variation, subtle height variation, no baked lighting, ' +
  'no shadows, top-down orthographic view, perfect seamless edges, PBR-ready —';

// ---- splatmap concept: height / slope / moisture rules ----------------------

export interface SplatRule {
  condition: string;
  materials: string;
}

/** Height bands (in Kacheln über der Wasserlinie, matches terrainHeight.ts'
 *  scale) → material bias. Documents the "Höhe steuert Material" rule so a
 *  later shader has one place to read the intended weighting from. */
export const SPLAT_HEIGHT_RULES: SplatRule[] = [
  { condition: 'Wasserlinie bis +0.3 (Ufer)', materials: '60 % feuchte Erde/Sand, 30 % Gras, 10 % Kies' },
  { condition: '+0.3 bis +1.5 (Ebene/Bauland)', materials: '80 % Gras, 15 % Erde, 5 % Stein' },
  { condition: '+1.5 bis +2.5 (Hügel)', materials: '55 % Gras, 25 % Erde, 20 % Stein — steigt mit der Neigung' },
  { condition: '+2.5 bis +4 (Gebirgsfuß)', materials: '20 % Gras in Mulden, 80 % Fels/Geröll' },
  { condition: 'über +4 (Hochgebirge)', materials: '90 % Fels, 10 % Schnee (optional, kein aktueller Terrain-Typ)' },
];

/** Steilheit (Gradient von terrainHeightAt) → Felsanteil. */
export const SPLAT_SLOPE_RULES: SplatRule[] = [
  { condition: 'flach (< 15°)', materials: 'Basis-Material der Höhenstufe unverändert' },
  { condition: 'geneigt (15°–35°)', materials: '+20 % Stein/Geröll, Gras/Erde-Anteil sinkt entsprechend' },
  { condition: 'steil (> 35°)', materials: 'Fels/Klippen-Textur dominant (`terrain_cliff`/`terrain_mountain`), kaum Vegetation' },
];

/** Nähe zu Wasser (Fluss/See/Meer) → feuchtere, dunklere Böden. */
export const SPLAT_MOISTURE_RULES: SplatRule[] = [
  { condition: 'direkt angrenzend an Fluss/See/Meer', materials: '`terrain_earth_wet`/`terrain_sand_coast` statt trockener Basis' },
  { condition: '1–2 Kacheln entfernt', materials: 'leichte Beimischung von `terrain_earth_dark`/`terrain_moss`, abklingend' },
  { condition: 'weiter entfernt', materials: 'keine Feuchtigkeits-Beimischung, reine Höhen-/Neigungs-Regel' },
];

export interface BiomeMaterialSet {
  biome: string;
  textures: readonly string[];
}

/** Welche Texturen pro Biom im Materialset zur Auswahl stehen (§ "Biome
 *  steuern Texturen"). Der Splatmap-Mix wählt/gewichtet innerhalb dieses Sets. */
export const BIOME_MATERIAL_SETS: BiomeMaterialSet[] = [
  { biome: 'Grasland', textures: ['grass_meadow', 'terrain_grass_01', 'terrain_grass_dry', 'terrain_meadow', 'terrain_earth_light'] },
  { biome: 'Mischwald', textures: ['terrain_grass_dark', 'terrain_moss', 'terrain_forest_floor', 'terrain_rock'] },
  { biome: 'Fruchtbares Land', textures: ['terrain_earth_dark', 'terrain_farmland', 'terrain_field_plowed', 'terrain_field_wheat', 'terrain_field_harvest'] },
  { biome: 'Gebirge', textures: ['mountain_rock_base', 'mountain_snow', 'terrain_rock', 'terrain_mountain', 'terrain_cliff', 'terrain_rock_granite', 'terrain_gravel', 'terrain_snow', 'terrain_snow_rock', 'terrain_snow_drift'] },
  { biome: 'Wüste', textures: ['desert_sand_red', 'terrain_sand_dune', 'terrain_earth_light', 'terrain_rock_granite'] },
  { biome: 'Sumpf', textures: ['swamp_mud', 'terrain_earth_wet', 'terrain_moss', 'terrain_swamp'] },
  { biome: 'Küste', textures: ['coast_pebbles', 'terrain_sand_coast', 'terrain_coast', 'terrain_rock', 'terrain_shallow_water'] },
  { biome: 'Fluss/See/Meer', textures: ['terrain_deep_water', 'terrain_shallow_water', 'terrain_riverbed', 'terrain_river_delta', 'terrain_swamp', 'terrain_ice'] },
  { biome: 'Straßen/Wege', textures: ['terrain_path', 'terrain_road_edge', 'terrain_gravel', 'terrain_stone'] },
];

// ---- the textures -----------------------------------------------------------

export const TERRAIN_TEXTURES: TerrainTextureEntry[] = [
  // Gras
  {
    name: 'terrain_grass_01',
    category: 'grass',
    style: 'painterly, weich, leicht handgemalt',
    palette: 'sattes Mittelgrün mit helleren/dunkleren Flecken',
    useCase: 'Standard-Bauland- und Grasland-Basis',
    materialProps: 'organisch, matt, leicht rau',
    blend: 'Basis-Layer der Ebene (+0.3 bis +1.5); blendet mit terrain_earth_light/terrain_grass_dry an Rändern',
    priority: 'Pflicht',
    biomes: ['Grasland'],
    motif: 'lush green meadow grass, subtle blade detail, small clover patches, gentle color variation, no dirt patches',
  },
  {
    name: 'terrain_grass_dark',
    category: 'grass',
    style: 'painterly, schattig',
    palette: 'dunkles Waldgrün, kühler Unterton',
    useCase: 'Waldrand, Nordhänge, beschattete Flächen',
    materialProps: 'organisch, matt',
    blend: 'blendet in terrain_moss/terrain_forest_floor am Waldrand',
    priority: 'Empfohlen',
    biomes: ['Mischwald'],
    motif: 'shaded dark green forest-edge grass, cooler undertone, subtle moss speckles, no dirt patches',
  },
  {
    name: 'terrain_grass_dry',
    category: 'grass',
    style: 'painterly, warm',
    palette: 'gelbgrün bis strohfarben',
    useCase: 'trockene Hügel, sonnige Hänge, Sommerlook',
    materialProps: 'organisch, matt, leicht struppig',
    blend: 'blendet mit terrain_grass_01 bei Übergängen, dominiert auf steileren sonnigen Hängen',
    priority: 'Empfohlen',
    biomes: ['Grasland'],
    motif: 'dry sun-bleached grass, straw-yellow to olive tones, sparse patchy coverage, subtle wind-swept strokes',
  },
  {
    name: 'terrain_meadow',
    category: 'grass',
    style: 'painterly, verspielt',
    palette: 'Grün mit bunten Blütentupfern (Weiß/Gelb/Rot)',
    useCase: 'Wiesen, Parks, dekorative Grünflächen',
    materialProps: 'organisch, matt',
    blend: 'Detail-Overlay auf terrain_grass_01, kein eigener Höhenbereich',
    priority: 'Empfohlen',
    biomes: ['Grasland'],
    motif: 'wildflower meadow, small scattered white/yellow/red flowers over green grass, natural clustering',
  },
  {
    name: 'terrain_moss',
    category: 'grass',
    style: 'painterly, feucht',
    palette: 'dunkles Moosgrün',
    useCase: 'feuchte Waldstellen, Felsfüße, Schatten',
    materialProps: 'organisch, weich, leicht glänzend',
    blend: 'blendet zwischen terrain_grass_dark und terrain_forest_floor/terrain_rock',
    priority: 'Optional',
    biomes: ['Mischwald'],
    motif: 'soft dense moss patch, deep green, slightly damp look, small texture bumps',
  },

  // Erde
  {
    name: 'terrain_earth_light',
    category: 'earth',
    style: 'painterly, trocken',
    palette: 'helles Beige-Braun',
    useCase: 'Wegränder, trockene Übergangsflächen, Bauplatz-Erdaushub',
    materialProps: 'körnig, matt',
    blend: 'Übergang zwischen terrain_grass_01 und terrain_sand/terrain_path',
    priority: 'Pflicht',
    biomes: ['Grasland'],
    motif: 'light dry beige-brown earth, fine grain, small pebbles, natural patchy texture',
  },
  {
    name: 'terrain_earth_dark',
    category: 'earth',
    style: 'painterly, fruchtbar',
    palette: 'dunkles Schokoladenbraun',
    useCase: 'fruchtbares Land, Beete, Übergang zu Feldern',
    materialProps: 'körnig, leicht feucht wirkend',
    blend: 'Basis für die Feld-Texturen (terrain_field_*), blendet mit terrain_grass_01',
    priority: 'Pflicht',
    biomes: ['Fruchtbares Land'],
    motif: 'rich dark fertile soil, fine grain, subtle organic clumps, no plants',
  },
  {
    name: 'terrain_earth_wet',
    category: 'earth',
    style: 'painterly, feucht/matschig',
    palette: 'dunkles Braun mit leichtem Glanz',
    useCase: 'Uferzonen, Flussnähe, Regenpfützen-Look',
    materialProps: 'glänzend-matt, leicht reflektierend',
    blend: 'Splatmap-Feuchtigkeitsregel: ersetzt trockene Erde direkt an Fluss/See/Meer',
    priority: 'Empfohlen',
    biomes: ['Fluss/See/Meer'],
    motif: 'wet muddy dark soil, small puddle highlights, subtle sheen, natural uneven surface',
  },
  {
    name: 'terrain_forest_floor',
    category: 'earth',
    style: 'painterly, natürlich',
    palette: 'braun mit grünen/roten Laubtupfern',
    useCase: 'Waldboden unter Baumkronen',
    materialProps: 'organisch, körnig',
    blend: 'blendet mit terrain_moss/terrain_grass_dark am Waldrand',
    priority: 'Pflicht',
    biomes: ['Mischwald'],
    motif: 'forest floor with pine needles, scattered leaves, small roots and twigs, earthy brown base',
  },
  {
    name: 'terrain_farmland',
    category: 'earth',
    style: 'painterly, rural',
    palette: 'mittelbraun, gleichmäßig',
    useCase: 'Acker-Basisboden vor der Bepflanzung',
    materialProps: 'körnig, matt',
    blend: 'Basis unter terrain_field_plowed/terrain_field_wheat/terrain_field_harvest',
    priority: 'Pflicht',
    biomes: ['Fruchtbares Land'],
    motif: 'even brown farmland soil base, ready for crops, subtle texture, no furrows yet',
  },

  // Stein
  {
    name: 'terrain_rock',
    category: 'stone',
    style: 'painterly, low-poly-freundlich',
    palette: 'mittelgrau mit warmen Flecken',
    useCase: 'kleine Felsflächen, Gebirgsrand, Wegsteine',
    materialProps: 'hart, matt, leicht rau',
    blend: 'Übergangstextur zwischen Gras/Erde und terrain_mountain in Hügel-/Gebirgsfuß-Zone',
    priority: 'Pflicht',
    biomes: ['Gebirge', 'Küste'],
    motif: 'small stylized grey rocky ground patch, cracked texture, warm highlight tones, low-poly friendly',
  },
  {
    name: 'terrain_stone',
    category: 'stone',
    style: 'painterly, bearbeitet',
    palette: 'helles Grau',
    useCase: 'Steinplatten, Plätze, befestigte Wege',
    materialProps: 'hart, glatt-matt, geometrisches Fugenmuster',
    blend: 'eigenständige Kachel (Platz/Weg), kein Splatmap-Blend nötig',
    priority: 'Empfohlen',
    biomes: ['Straßen/Wege'],
    motif: 'flat grey paving stone tiles, clean joints, subtle weathering, orthographic top-down',
  },
  {
    name: 'terrain_mountain',
    category: 'stone',
    style: 'painterly, massiv',
    palette: 'dunkles Grau-Braun mit Rissen',
    useCase: 'großflächiger Gebirgsfels (Hochgebirge)',
    materialProps: 'hart, sehr rau, stark strukturiert',
    blend: 'dominant über +2.5 Kacheln, blendet mit terrain_rock/terrain_cliff',
    priority: 'Pflicht',
    biomes: ['Gebirge'],
    motif: 'large rugged mountain rock face, deep cracks and ridges, dark grey-brown, layered stone strata',
  },
  {
    name: 'terrain_cliff',
    category: 'stone',
    style: 'painterly, geschichtet',
    palette: 'Schiefergrau mit horizontalen Bändern',
    useCase: 'steile Klippen, Küstenfelsen, Schluchtwände',
    materialProps: 'hart, geschichtet, rau',
    blend: 'Splatmap-Neigungsregel: dominant bei Steilheit > 35°',
    priority: 'Pflicht',
    biomes: ['Gebirge', 'Küste'],
    motif: 'steep layered slate cliff face, horizontal rock strata bands, weathered grey tones',
  },
  {
    name: 'terrain_rock_granite',
    category: 'stone',
    style: 'painterly, grobkörnig',
    palette: 'rötlich-graues Granit',
    useCase: 'Gebirgsvariante für Abwechslung/Steinbrüche',
    materialProps: 'hart, grobkörnig gesprenkelt',
    blend: 'Variante zu terrain_mountain, gleicher Höhenbereich',
    priority: 'Optional',
    biomes: ['Gebirge'],
    motif: 'coarse-grained pinkish-grey granite rock surface, speckled mineral texture, weathered',
  },
  {
    name: 'terrain_gravel',
    category: 'stone',
    style: 'painterly, klein-teilig',
    palette: 'graubraun, gemischte Korngröße',
    useCase: 'Schotter/Geröll, Wegbeläge, Straßenränder',
    materialProps: 'körnig, unregelmäßig',
    blend: 'blendet mit terrain_path/terrain_road_edge und am Gebirgsfuß mit terrain_rock',
    priority: 'Empfohlen',
    biomes: ['Gebirge', 'Straßen/Wege'],
    motif: 'loose gravel and scree, mixed grey-brown stone chips, natural random scatter, top-down',
  },

  // Sand
  {
    name: 'terrain_sand',
    category: 'sand',
    style: 'painterly, fein',
    palette: 'helles Beige',
    useCase: 'allgemeine Sandflächen, Basis-Sand',
    materialProps: 'fein, matt, leicht körnig',
    blend: 'Basis für terrain_sand_coast/terrain_sand_river/terrain_sand_dune',
    priority: 'Pflicht',
    biomes: ['Küste'],
    motif: 'fine light beige sand, subtle grain texture, soft natural ripples',
  },
  {
    name: 'terrain_sand_coast',
    category: 'sand',
    style: 'painterly, feucht am Saum',
    palette: 'helles Beige mit dunklerem Nasssaum',
    useCase: 'Strand direkt am Meer',
    materialProps: 'fein, teils feucht-glänzend',
    blend: 'Splatmap-Feuchtigkeitsregel direkt an terrain_deep_water/terrain_shallow_water',
    priority: 'Pflicht',
    biomes: ['Küste'],
    motif: 'sandy beach with a darker wet tideline edge, fine grain, gentle foam residue',
  },
  {
    name: 'terrain_sand_river',
    category: 'sand',
    style: 'painterly, grobkörniger',
    palette: 'graubeige',
    useCase: 'Flussufer-Sandbänke',
    materialProps: 'grobkörniger als Küstensand, leicht kiesig',
    blend: 'schmaler Saum entlang terrain_riverbed/terrain_shallow_water',
    priority: 'Empfohlen',
    biomes: ['Fluss/See/Meer'],
    motif: 'coarse riverbank sand with small pebbles, greyish-beige tone, natural scattered texture',
  },
  {
    name: 'terrain_sand_dune',
    category: 'sand',
    style: 'painterly, wellig',
    palette: 'warmes Beige-Gold',
    useCase: 'Dünen, trockene Küstenhügel',
    materialProps: 'fein, mit sichtbarem Windrippel-Muster',
    blend: 'Höhenvariante von terrain_sand, weiter von der Wasserlinie entfernt',
    priority: 'Optional',
    biomes: ['Küste'],
    motif: 'wind-rippled dune sand, warm golden-beige tone, soft wave-like ripple pattern',
  },

  // Schnee (optional — TerrainType kennt aktuell keinen Schnee-Typ)
  {
    name: 'terrain_snow',
    category: 'snow',
    style: 'painterly, weich',
    palette: 'reines Weiß mit leicht blauem Schatten',
    useCase: 'Hochgebirge (zukünftig, kein aktueller Terrain-Typ)',
    materialProps: 'weich, matt, leicht glitzernd',
    blend: 'ersetzt Fels-Anteil über +4 Kacheln, sobald ein Schnee-Biom existiert',
    priority: 'Optional',
    biomes: ['Gebirge'],
    motif: 'fresh soft snow, subtle blue-tinted shadows, gentle sparkle, smooth drifts',
  },
  {
    name: 'terrain_ice',
    category: 'snow',
    style: 'painterly, glatt',
    palette: 'helles Blaugrau, halbtransparent wirkend',
    useCase: 'zugefrorene Gewässer (zukünftig)',
    materialProps: 'glatt, glänzend, leicht durchscheinend',
    blend: 'Ersatz-Textur für terrain_deep_water in kalten Zonen (zukünftig)',
    priority: 'Optional',
    biomes: ['Fluss/See/Meer'],
    motif: 'frozen ice surface, pale blue-grey, subtle cracks, semi-translucent look',
  },
  {
    name: 'terrain_snow_rock',
    category: 'snow',
    style: 'painterly, vereist',
    palette: 'Grau mit weißen Schneeflecken',
    useCase: 'vereiste Felsen im Hochgebirge (zukünftig)',
    materialProps: 'hart, teilweise weich (Schneeauflage)',
    blend: 'Mischtextur terrain_mountain + terrain_snow, oberste Höhenstufe',
    priority: 'Optional',
    biomes: ['Gebirge'],
    motif: 'rocky mountain surface partially covered in snow patches, grey stone with white accents',
  },
  {
    name: 'terrain_snow_drift',
    category: 'snow',
    style: 'painterly, windgeformt',
    palette: 'Weiß mit sanften Grauschatten',
    useCase: 'Schneeverwehungen an Kämmen (zukünftig)',
    materialProps: 'weich, mit sichtbarem Windrippel-Muster',
    blend: 'Detail-Overlay auf terrain_snow an windexponierten Kämmen',
    priority: 'Optional',
    biomes: ['Gebirge'],
    motif: 'wind-sculpted snow drift, soft undulating ridges, gentle grey shadow accents',
  },

  // Wasser
  {
    name: 'terrain_riverbed',
    category: 'water',
    style: 'painterly, sichtbar durchs Wasser',
    palette: 'graubraun mit Kieseln',
    useCase: 'sichtbarer Flussgrund an seichten Stellen',
    materialProps: 'körnig, unter der Wasseroberfläche liegend',
    blend: 'liegt unter dem animierten Wasser-Shader (v0.37), an seichten Stellen sichtbar',
    priority: 'Empfohlen',
    biomes: ['Fluss/See/Meer'],
    motif: 'visible riverbed under shallow water, smooth pebbles and light sand, seen through clear water',
  },
  {
    name: 'terrain_shallow_water',
    category: 'water',
    style: 'painterly, klar',
    palette: 'helles Türkis-Blau',
    useCase: 'seichte Stellen an Ufern, Flussrändern',
    materialProps: 'transparent wirkend, leicht changierend',
    blend: 'Übergang zwischen terrain_sand_coast/terrain_riverbed und terrain_deep_water',
    priority: 'Pflicht',
    biomes: ['Fluss/See/Meer'],
    motif: 'clear shallow turquoise water, sandy bottom visible, soft light caustics',
  },
  {
    name: 'terrain_deep_water',
    category: 'water',
    style: 'painterly, tief',
    palette: 'sattes Dunkelblau',
    useCase: 'See-/Meeresfläche',
    materialProps: 'gleichmäßig, leicht glänzend',
    blend: 'Basis der Wasserfläche, blendet zu terrain_shallow_water am Ufer',
    priority: 'Pflicht',
    biomes: ['Fluss/See/Meer'],
    motif: 'deep calm blue sea/lake water, subtle gentle wave pattern, rich saturated tone',
  },
  {
    name: 'terrain_coast',
    category: 'water',
    style: 'painterly, Brandung',
    palette: 'Weiß-Schaum auf Türkis/Beige',
    useCase: 'Strand-Wasser-Übergang mit Brandungssaum',
    materialProps: 'schaumig, bewegt wirkend',
    blend: 'schmaler Saum zwischen terrain_sand_coast und terrain_shallow_water',
    priority: 'Empfohlen',
    biomes: ['Küste'],
    motif: 'gentle surf foam line where beach meets sea, soft white foam over turquoise water edge',
  },
  {
    name: 'terrain_swamp',
    category: 'water',
    style: 'painterly, trüb',
    palette: 'dunkles Oliv-Braun',
    useCase: 'Sumpf/Moor, stehendes Wasser',
    materialProps: 'trüb, mit organischen Flecken',
    blend: 'eigene Übergangszone zwischen terrain_earth_wet und terrain_deep_water',
    priority: 'Optional',
    biomes: ['Fluss/See/Meer'],
    motif: 'murky dark olive-brown swamp water, scattered algae patches, still surface',
  },
  {
    name: 'terrain_river_delta',
    category: 'water',
    style: 'painterly, verzweigt',
    palette: 'Sandbeige mit Wasseradern',
    useCase: 'Flussmündung mit Sandbänken',
    materialProps: 'gemischt Sand/Wasser, kleinteilig verzweigt',
    blend: 'Übergangszone an der Flussmündung, mischt terrain_sand_river und terrain_shallow_water',
    priority: 'Optional',
    biomes: ['Fluss/See/Meer'],
    motif: 'braided river delta with sandbanks and shallow water channels, top-down aerial look',
  },

  // Felder
  {
    name: 'terrain_field_plowed',
    category: 'field',
    style: 'painterly, gefurcht',
    palette: 'dunkles Braun mit parallelen Furchen',
    useCase: 'frisch gepflügter Acker',
    materialProps: 'strukturiert, gleichmäßige Furchenlinien',
    blend: 'ersetzt terrain_farmland auf bestellten Feld-Kacheln',
    priority: 'Pflicht',
    biomes: ['Fruchtbares Land'],
    motif: 'freshly plowed farmland with parallel furrow lines, rich dark brown soil, subtle shading in the grooves',
  },
  {
    name: 'terrain_field_wheat',
    category: 'field',
    style: 'painterly, reif',
    palette: 'goldgelb',
    useCase: 'reifes Getreidefeld',
    materialProps: 'organisch, mit Ährenstruktur',
    blend: 'saisonale/Produktionsstufen-Variante von terrain_field_plowed',
    priority: 'Empfohlen',
    biomes: ['Fruchtbares Land'],
    motif: 'golden ripe wheat field, dense rows of wheat ears, gentle wind-swept pattern, top-down',
  },
  {
    name: 'terrain_field_harvest',
    category: 'field',
    style: 'painterly, abgeerntet',
    palette: 'blasses Strohgelb-Braun',
    useCase: 'abgeerntetes Stoppelfeld',
    materialProps: 'strukturiert, kurze Stoppelreihen',
    blend: 'Folgestufe nach terrain_field_wheat im Produktionszyklus',
    priority: 'Empfohlen',
    biomes: ['Fruchtbares Land'],
    motif: 'harvested stubble field, short pale straw-colored rows, evenly cut, top-down',
  },

  // Wege
  {
    name: 'terrain_path',
    category: 'path',
    style: 'painterly, ausgetreten',
    palette: 'helles Erdbraun',
    useCase: 'Trampelpfad, Feldweg',
    materialProps: 'verdichtet, mit vereinzelten Grasresten am Rand',
    blend: 'schmales Band, blendet beidseitig in Gras/Erde',
    priority: 'Empfohlen',
    biomes: ['Straßen/Wege'],
    motif: 'worn dirt footpath, packed light brown earth, thin grass fringe along the edges',
  },
  {
    name: 'terrain_road_edge',
    category: 'path',
    style: 'painterly, Übergang',
    palette: 'Asphaltgrau in Erdbraun/Gras auslaufend',
    useCase: 'weicher Übergang Straße → Gelände (§ Straßen im Terrain)',
    materialProps: 'strukturiert, Verlaufsgradient',
    blend: 'Pflicht-Übergangstextur an jeder Straßenkante, verhindert harte Kanten',
    priority: 'Pflicht',
    biomes: ['Straßen/Wege'],
    motif: 'soft gradient road-edge transition, asphalt grey fading into dirt and grass, small gravel scatter',
  },

  // Map Redesign 5.0 — KI-generierte Kernmaterialien
  {
    name: 'grass_meadow',
    category: 'grass',
    style: 'painterly stylized realism, weich und natuerlich',
    palette: 'Mittelgruen, Oliv und Moos mit sehr kleinen cremefarbenen und blauen Bluetentupfern',
    useCase: 'hochwertige Graslandbasis und offene Lichtungen',
    materialProps: 'kurzes Wiesengras, organische Cluster, geringe Mikrounruhe',
    blend: 'Basis-Layer der Ebene; trockenes Gras, Waldboden und fruchtbare Erde ueberblenden regional',
    priority: 'Pflicht',
    biomes: ['Grasland', 'Hügelland'],
    motif: 'natural medium-green meadow grass with broad painterly variation, sparse tiny wildflower flecks and open breathing areas',
  },
  {
    name: 'mountain_rock_base',
    category: 'mountain',
    style: 'painterly stylized realism, helle alpine Makroformen',
    palette: 'warmes Hellgrau, Steinbeige und dezente moosgruene Fugen',
    useCase: 'triplanare Felsbasis fuer Mittel- und Hochgebirge',
    materialProps: 'breite Schichtungen, kantige Platten, geringe Mikrokörnung',
    blend: 'hoehen- und hangabhaengig; triplanar mit cliff, Geröll und Schnee',
    priority: 'Pflicht',
    biomes: ['Gebirge', 'Hochland'],
    motif: 'light warm-grey alpine bedrock with broad angular strata, restrained moss traces and no mirrored pattern',
  },
  {
    name: 'mountain_snow',
    category: 'mountain',
    style: 'painterly stylized realism, kompakt und windgeformt',
    palette: 'warmes Off-White mit sehr hellem Blaugrau',
    useCase: 'Gipfelzone oberhalb der Felsbaender',
    materialProps: 'weiche breite Verwehungen, dezente Eiskrusten',
    blend: 'nur in grosser Hoehe; Alpine-Profil verstaerkt, Hang reduziert',
    priority: 'Pflicht',
    biomes: ['Gebirge'],
    motif: 'clean compact wind-swept alpine snow with broad soft drifts and restrained pale-blue mineral seams',
  },
  {
    name: 'desert_sand_red',
    category: 'desert',
    style: 'painterly stylized realism, warm und erosionsgepraegt',
    palette: 'Terrakotta, Rostorange, Ocker und dunkles Rotbraun',
    useCase: 'visuelle Wueste der roten Suedostkueste',
    materialProps: 'kompakter Sand, breite Sandsteinplatten, flache Trockenrisse',
    blend: 'organisch mit trockenem Gras, Kuestensand und Fels; keine Gameplaywirkung',
    priority: 'Pflicht',
    biomes: ['Wüste', 'Trockene Ebene'],
    motif: 'burnt-sienna desert ground with compact sand, eroded sandstone plates and shallow cracked-earth seams',
  },
  {
    name: 'swamp_mud',
    category: 'swamp',
    style: 'painterly stylized realism, feucht und moosig',
    palette: 'Torfbraun, gedämpftes Oliv, Moosgruen und nasses Anthrazit',
    useCase: 'Moorboden der westlichen Sumpfbucht',
    materialProps: 'gesaettigter Schlamm, Torf, Moosinseln und flache feuchte Adern',
    blend: 'niedrige Lagen; weich mit Waldboden, Feuchterde und Schilfufer',
    priority: 'Pflicht',
    biomes: ['Sumpf'],
    motif: 'dark wet peat and olive-brown mud with broad mossy patches and shallow water-darkened seams',
  },
  {
    name: 'coast_pebbles',
    category: 'coast',
    style: 'painterly stylized realism, rund gewaschene Kuestensteine',
    palette: 'Blaugrau, warmes Steingrau, Beige und dezentes Seegruen',
    useCase: 'Kiesbuchten, Felskuesten und Flussmuendungen',
    materialProps: 'runde Kiesel, feuchter Schotter und wenig Sand',
    blend: 'niedrige Kuestenlagen; mischt Sand, Fels und den tuerkisen Flachwassersaum',
    priority: 'Pflicht',
    biomes: ['Küste', 'Flusstal'],
    motif: 'rounded slate and granite coastal pebbles mixed with muted damp sand and natural size variation',
  },
];

// ---- README/PROMPTS-style markdown rendering (pure) --------------------------

const GEN_BANNER =
  '> **Auto-generiert** aus `src/assets/terrainTextureManifest.ts`. Nicht von Hand editieren.\n' +
  '> Neue Texturen dazunehmen: Eintrag dort ergänzen, dann\n' +
  '> `WRITE_TERRAIN_DOCS=1 npx vitest run tests/terrainTextures.test.ts` (schreibt diese Datei neu).\n' +
  '> Der Test schlägt fehl, sobald die Doku veraltet ist.';

function mapsLine(m: MapSet): string {
  const yn = (b: boolean) => (b ? '✓' : '–');
  return `Normal ${yn(m.normal)} · Roughness ${yn(m.roughness)} · AO ${yn(m.ao)} · Height ${yn(m.height)}`;
}

function ruleTable(rows: SplatRule[]): string {
  const head = '| Bedingung | Material-Gewichtung |\n|---|---|';
  return `${head}\n${rows.map((r) => `| ${r.condition} | ${r.materials} |`).join('\n')}`;
}

function textureBlock(e: TerrainTextureEntry): string {
  const d = CATEGORY_DEFAULTS[e.category];
  const head = `### \`${e.name}.png\``;
  const prompt = `\`\`\`text\n${TEXTURE_STYLE_PREFIX} ${e.motif}\n\`\`\``;
  const spec =
    `**Spec:** Ordner \`${d.folder}\` · ${d.resolution} · nahtlos kachelbar · Stil: ${e.style} · ` +
    `Palette: ${e.palette} · Einsatz: ${e.useCase} · Material: ${e.materialProps} · ` +
    `Mischverhalten: ${e.blend} · Maps: ${mapsLine(d.maps)} · Detailstufe: ${d.detailLevel} · ` +
    `Priorität: **${e.priority}** · Biome: ${e.biomes.join(', ')}`;
  return `${head}\n\n${prompt}\n\n${spec}\n`;
}

const CATEGORY_TITLES: Record<TextureCategory, string> = {
  grass: 'Gras',
  earth: 'Erde',
  stone: 'Stein',
  mountain: 'Gebirge 5.0',
  desert: 'Wüste 5.0',
  swamp: 'Sumpf 5.0',
  coast: 'Küste 5.0',
  sand: 'Sand',
  snow: 'Schnee (optional — kein aktueller Terrain-Typ)',
  water: 'Wasser',
  field: 'Felder',
  path: 'Wege & Straßenränder',
};
const CATEGORY_ORDER: TextureCategory[] = ['grass', 'earth', 'stone', 'sand', 'snow', 'water', 'field', 'path'];

/** Markdown für docs/TERRAIN_TEXTURES.md — vollständig generiert. */
export function renderTerrainTexturesDoc(): string {
  const byCategory = (cat: TextureCategory) => TERRAIN_TEXTURES.filter((t) => t.category === cat);

  const categorySections = CATEGORY_ORDER.map((cat) => {
    const entries = byCategory(cat);
    if (entries.length === 0) return '';
    return `## ${CATEGORY_TITLES[cat]}\n\n${entries.map(textureBlock).join('\n')}`;
  }).join('\n');

  const biomeSection =
    `## Biome-Materialsets\n\n` +
    `Welche Texturen pro Biom im Splatmap-Mix zur Auswahl stehen; die Höhen-/` +
    `Neigungs-/Feuchtigkeitsregeln (unten) gewichten innerhalb dieses Sets.\n\n` +
    `| Biom | Texturen |\n|---|---|\n` +
    BIOME_MATERIAL_SETS.map((b) => `| ${b.biome} | ${b.textures.map((t) => `\`${t}\``).join(', ')} |`).join('\n') +
    '\n';

  const splatSection =
    `## Splatmap-Konzept\n\n` +
    `Jede Terrainfläche trägt künftig **Materialgewichte statt eines einzelnen Typs** ` +
    `(z. B. 70 % Gras, 20 % Erde, 10 % Stein) — daraus mischt der Ground-Shader weich, ` +
    `ohne harte Kacheloder Quadrat-Kanten. Die Gewichte leiten sich aus drei Regeln ab, ` +
    `die zusammen ausgewertet werden (Höhe zuerst, dann Neigung, dann Feuchtigkeit):\n\n` +
    `### Höhe (§ "Höhe steuert Material")\n\n${ruleTable(SPLAT_HEIGHT_RULES)}\n\n` +
    `### Neigung (§ "Je steiler → mehr Felsen")\n\n${ruleTable(SPLAT_SLOPE_RULES)}\n\n` +
    `### Feuchtigkeit / Wassernähe\n\n${ruleTable(SPLAT_MOISTURE_RULES)}\n\n` +
    `**Umsetzungsstand:** Diese Regeln sind die Spezifikation für den künftigen Ground-` +
    `Shader — der Renderer nutzt aktuell weiterhin das vertex-gefärbte Höhenfeld (v0.39, ` +
    `\`ThreeMapRenderer.buildGroundMesh\`). Der Shader selbst ist eine eigene Code-Phase, ` +
    `sobald reale Texturen zum Verifizieren vorliegen — die Drop-in-Ordner und der Loader ` +
    `(\`terrainTextureUrl()\` in \`src/assets/registry.ts\`) sind aber bereits vorbereitet.\n`;

  return (
    `# Terrain-Texturen — Splatmap-Materialsystem (v0.42, Terrain System V2)\n\n` +
    `${GEN_BANNER}\n\n` +
    `Ersetzt einzelne kleine 3D-Modelle (Gras, kleine Felsen, Erde) durch ein ` +
    `**Terrain-Materialsystem**: die Bodenoberfläche besteht aus nahtlos kachelbaren, ` +
    `weich ineinander überblendeten Texturen statt aneinandergereihten Objekten. ` +
    `3D-Modelle bleiben für große, prägende Elemente reserviert (Bäume, Landmarken, ` +
    `große Felsen, Gebäude, Brücken — siehe \`docs/3D_WORLD_ASSETS.md\`).\n\n` +
    `**Drop-in:** \`.png\`/\`.webp\`/\`.jpg\` in den unten angegebenen Ordner unter ` +
    `\`src/assets/textures/terrain/…\` legen, Dateiname exakt wie hier. Erkennung ist ` +
    `bereits vorbereitet (\`terrainTextureUrl()\`); die Renderer-Anbindung an den ` +
    `Splatmap-Shader folgt in einer eigenen Phase (siehe „Splatmap-Konzept" unten).\n\n` +
    `${categorySections}\n` +
    `${biomeSection}\n` +
    `${splatSection}`
  );
}
