import type {
  BuildingCategory,
  BuildingDefId,
  MayorActionId,
  NeedId,
  QuestId,
  ResourceId,
  ResourceNodeType,
  TerrainType,
  DriveVehicle,
} from '../types.ts';
export type { DriveVehicle } from '../types.ts';

// ---- Building definitions -------------------------------------------------

export type BuildingEffect =
  /**
   * Production flows directly into city storage (no manual collecting).
   * `inputsPerMinute` is the production-chain hook: if set, the building
   * consumes those resources and scales its output by input availability —
   * later chains (wheat → bakery, ore → factory) are just config entries.
   */
  | { type: 'produce'; resource: ResourceId; perMinute: number; inputsPerMinute?: Partial<Record<ResourceId, number>> }
  /** With `radius`, the capacity only reaches housing within that range (wells). */
  | { type: 'capacity'; need: NeedId; amount: number; radius?: number }
  /**
   * Residential housing broken into households (§6/§7). Resident capacity is
   * `units × maxResidentsPerUnit`; `min…max` describe the believable household
   * size (shown in the UI). `ambienceSensitivity` (default 1) scales how much
   * this home's neighborhood quality shifts happiness — suburbs (small houses)
   * react more strongly to green space and industry than dense blocks do.
   */
  | { type: 'housing'; units: number; minResidentsPerUnit: number; maxResidentsPerUnit: number; ambienceSensitivity?: number }
  /**
   * Ongoing municipal income a building generates, split into legible sources
   * (§5). Commercial/industrial revenue scales with staffing (filled jobs) and
   * happiness in the tick — the generic hook for shops, markets, industry and
   * later tourism/fees. Residential income stays modeled as per-capita tax.
   */
  | { type: 'revenue'; category: 'commercial' | 'industrial'; perMinute: number }
  /**
   * Ongoing running cost a building drains while active (§ money sink). Keeps
   * income *net*: large cities pay to operate their services and infrastructure
   * instead of drowning in tax. Per-resource so material upkeep is possible
   * later; money is the default. Aggregated in the derived layer.
   */
  | { type: 'upkeep'; resource: ResourceId; perMinute: number }
  /**
   * Logistics/transport hub: lifts the output of every production building
   * within `radius` by `boostPct` percent (first real supply chain, §1). Reuses
   * the same production-bonus path as terrain, so a well-placed depot near the
   * sawmills/quarries/farms is a genuine planning decision, not decoration.
   */
  | { type: 'logistics'; boostPct: number; radius: number }
  /**
   * Radius-based service coverage (leisure/safety/health). `radius` is the
   * reach; the optional `capacity` is how many *residents* the building can
   * effectively serve within that reach (§ radius vs. capacity). Without it the
   * coverage is unlimited within range (parks). With it, a big city that grows
   * past the served capacity gets only partial fulfillment even inside the
   * radius — so late-game services scale by capacity/upgrades, not by spamming
   * ever more identical buildings. Aggregated per need in the derived layer.
   */
  | { type: 'coverage'; need: NeedId; radius: number; capacity?: number }
  | { type: 'storage'; resource: ResourceId; amount: number }
  | { type: 'jobs'; amount: number }
  /**
   * Extra demand a building itself places on a need, independent of raw
   * population: bigger/upgraded homes want more water, later industry will want
   * power. Aggregated into the need's demand alongside per-capita demand — the
   * generic hook that lets "house type & level raise the water bill" (§3/§4).
   */
  | { type: 'demand'; need: NeedId; amount: number }
  /** Distributes a consumption need to housing within `radius` (market ↔ food). */
  | { type: 'distribution'; need: NeedId; radius: number }
  | { type: 'protection'; hazard: 'fire'; radius: number }
  /**
   * Environment quality aura (positive: parks/deco, negative: industry).
   * Groundwork for residential attractiveness & zoning (MVP 2): the derived
   * layer already aggregates it per residential building.
   */
  | { type: 'ambience'; amount: number; radius: number };

export interface BuildingUpgradeDef {
  cost: Partial<Record<ResourceId, number>>;
  constructionSec: number;
  effects: BuildingEffect[];
  xpReward: number;
  /**
   * City level required to start this upgrade (§ level-coupled upgrades). Absent
   * → available as soon as the previous stage is built. This is the "level cap"
   * on densification: a building can only climb to the tier its city has earned,
   * so the centre keeps improving as the city grows instead of maxing out at
   * level 1. Reuses the same level gate as building unlocks — no parallel system.
   */
  unlockLevel?: number;
  /**
   * Optional display name for this upgrade stage ("Stadthaus", "Hochhaus"). Lets
   * the same building read as a visibly different structure per tier in the UI
   * (§ visual/prestige development). Falls back to the base name + level.
   */
  nameKey?: string;
}

/**
 * Location bonus: production scales with matching terrain near the building
 * (sawmill ↔ forest, quarry ↔ mountain, farm ↔ fertile soil). Placement
 * becomes a real decision instead of "anywhere next to a road".
 */
export interface LocationBonusDef {
  terrain: TerrainType;
  /** Chebyshev distance from the footprint within which tiles count. */
  radius: number;
  /** Bonus percent contributed by each matching tile. */
  perTilePct: number;
  /** Upper bound for the total bonus percent. */
  maxPct: number;
}

/**
 * Größenklasse eines Gebäudes (§ Gebäudesystem 2.0, verbindlich dokumentiert in
 * docs/BUILDINGS.md): XS 1×1 Deko/Straße · S 2×2 · M 3×3 · L 4×4–5×5 ·
 * XL 6×6–7×7 · XXL 8×8. Grundlage für Asset-Budgets, Renderer-Höhen und alle
 * künftigen Gebäude — jede neue Def MUSS sich einer Klasse zuordnen.
 */
export type BuildingSizeClass = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export type InfrastructureMode = 'road' | 'water' | 'rail' | 'air';

/**
 * Straßen-Bauklasse (§ Infrastruktur 2.0 / I1, D-036). Erweitert die EINE
 * Placement-/Netz-Logik um mehrstufige Straßentypen (Bodenstraße → Höhenstraße/
 * Brücke), OHNE zweites Verkehrssystem: gilt nur für `category: 'roads'` und wird
 * von `validatePlacement` (Terrainzweig) und `analyseRoadPath` gelesen. Fehlt das
 * Feld, ist es eine Bodenstraße mit den bisherigen Regeln (Wasser/Klippe/
 * Steilhang gesperrt). Pfeiler/Deck/Rampen sind reine Renderer-Darstellung.
 */
export interface RoadClassDef {
  /** Darf Wasser/Fluss überbrücken (Brückendeck + Pfeiler). */
  crossesWater?: boolean;
  /** Darf Klippen/Steilhänge als Viadukt überwinden. */
  crossesCliff?: boolean;
  /** Maximal überwindbarer Steigungswert. Default 0.8 (= Bodenstraße). */
  maxSlope?: number;
  /**
   * Zusatzkosten je tatsächlich überbrückter (Wasser-/Klippen-)Kachel — modelliert
   * Pfeiler/Deck. Wird ZUSÄTZLICH zur normalen Kachel-Baukostenbasis berechnet.
   */
  bridgeCostPerTile?: Partial<Record<ResourceId, number>>;
}

/** Zweigeteilte Hafenfläche; das Gebäudemodell zeigt bei 0° mit +Z zum Land. */
export interface WaterfrontFootprint {
  landWidth: number;
  landDepth: number;
  waterWidth: number;
  waterDepth: number;
  shorelineTolerance: number;
  minimumWaterDepth: number;
}

/**
 * Werte einer aktiven Betriebs-Ausbaustufe (§ Active Operations 2.0, §5). Index
 * im `BuildingOperationProfile.stages`-Array = `upgradeLevel`; fehlt der Index,
 * gilt der letzte Eintrag. Höhere Stufen verbessern nicht pauschal „+X/min",
 * sondern Arbeiter, Tempo, Traglast und lokales Lager.
 */
export interface BuildingOperationStage {
  /** Anzahl gleichzeitiger Arbeiter. */
  workerSlots: number;
  /** Laufgeschwindigkeit in Kacheln pro Minute. */
  movementSpeed: number;
  /** Bearbeitungstempo in Ressourceneinheiten pro Minute je Arbeiter. */
  workSpeed: number;
  /** Maximal getragene Menge je Weg. */
  carryCapacity: number;
  /** Lokale Lagerkapazität des Betriebs. */
  storageCapacity: number;
}

/**
 * Macht ein Gebäude zu einem **aktiven Betrieb** (§2): sein passiver
 * `produce`-Effekt wird abgeschaltet (Tick UND Derived), stattdessen gewinnen
 * Arbeiter die Ressource an Ressourcenknoten und lagern sie im lokalen Lager ein.
 * Config-only; die Logik lebt in `src/game/operations/**`.
 */
export interface BuildingOperationProfile {
  /** Aktiv gewonnene Ressource (Referenzschnitt: 'wood'). */
  resource: ResourceId;
  /** Bearbeiteter Knotentyp (Referenzschnitt: 'tree'). */
  nodeType: ResourceNodeType;
  /** Terrain, das Ressourcenknoten trägt (tree ↔ forest). */
  nodeTerrain: TerrainType;
  /** Effizientes Arbeitsgebiet: Chebyshev-Radius um die Grundfläche. */
  efficientRadius: number;
  /** Maximale Einsatzentfernung (≥ efficientRadius). */
  maxRadius: number;
  /** Werte je Ausbaustufe (Index = upgradeLevel). */
  stages: BuildingOperationStage[];
}

export interface BuildingDef {
  id: BuildingDefId;
  category: BuildingCategory;
  nameKey: string;
  size: { w: number; h: number };
  /** Größenklasse (Pflicht, § Gebäudesystem 2.0) — muss zu `size` passen. */
  sizeClass: BuildingSizeClass;
  requiresRoad: boolean;
  /** Unterstützte Netze. Aktuell werden Straße und Wasser ausgewertet. */
  infrastructureModes?: InfrastructureMode[];
  /**
   * Straßen-Bauklasse (§ Infrastruktur 2.0 / I1). Nur für `category: 'roads'`.
   * Fehlt das Feld → Bodenstraße (Wasser/Klippe/Steilhang gesperrt).
   */
  road?: RoadClassDef;
  /**
   * Bau auf sonst unbebaubarem Fels/Gebirge (§ Steinbruch). Erlaubt
   * Gebirgskacheln als Untergrund und ersetzt die pauschale Gebirgs-/
   * Klippensperre durch eine echte Steilheitsgrenze (`maxSlope`, Vorgabe 2):
   * nur flache Felsschelfe sind bebaubar, senkrechte Wände bleiben gesperrt.
   * Rein additiv — Gebäude ohne dieses Feld bleiben exakt wie bisher gesperrt.
   */
  buildsOnRock?: { maxSlope?: number };
  /** Zusätzlicher Wasser-Footprint für Anleger/Häfen. */
  waterfront?: WaterfrontFootprint;
  unlockLevel: number;
  cost: Partial<Record<ResourceId, number>>;
  constructionSec: number;
  xpReward: number;
  effects: BuildingEffect[];
  upgrades?: BuildingUpgradeDef[];
  /**
   * Aktiver Betrieb (§ Active Operations 2.0): schaltet den passiven
   * `produce`-Pfad ab und übergibt Produktion an Arbeiter + Ressourcenknoten +
   * lokales Lager. Nur Gebäude MIT diesem Feld sind aktive Betriebe.
   */
  operation?: BuildingOperationProfile;
  locationBonus?: LocationBonusDef;
  /**
   * Per-level build cap (production buildings). Ascending breakpoints: the
   * active cap is the last entry with `level` ≤ the city level. Absent → no
   * cap (houses, roads, decoration stay freely buildable, §13). Keeps players
   * from spamming resource buildings and makes placement/location a decision.
   */
  buildLimit?: { level: number; max: number }[];
  /** Only one instance allowed (town hall, mayor house). */
  unique?: boolean;
  /**
   * Whether the building can be torn down. Default true. Central/unique
   * buildings (town hall, mayor house, later district centers) set this false
   * so the city's anchor can never be lost — but they must then be relocatable
   * (see `canRelocate`) so a misplacement isn't permanent (§2).
   */
  canDemolish?: boolean;
  /**
   * Whether the building may be relocated via an explicit action in the
   * building sheet, independent of the global `moveBuildings` flag. Intended
   * for non-demolishable specials. Placement rules are re-checked on drop.
   */
  canRelocate?: boolean;
  /** Optional fee charged when relocating a `canRelocate` building. */
  relocationCost?: Partial<Record<ResourceId, number>>;
  /** Cannot be built from the menu (pre-placed buildings). */
  buildable?: boolean;
  biomeRequirement?: TerrainType[];
  /**
   * Placement requires a tile of this terrain orthogonally/diagonally adjacent
   * to the footprint (e.g. the riverside waterworks needs 'river' next to it).
   * Generic riverfront/coast rule — no per-building special-casing.
   */
  adjacentTerrain?: TerrainType;
  /**
   * Escalating cost per copy already built (§ anti-spam, e.g. warehouses). When
   * set (>1), the effective build cost of the next copy is `baseCost × factor^n`
   * where `n` is how many already exist — so mass-building the same utility gets
   * progressively pricier and storage/logistics become a deliberate investment
   * rather than a cheap spam. Generic and config-only; absent → flat cost.
   * The escalation premium is a congestion surcharge and is not refunded on
   * demolition (refund stays on the base cost).
   */
  costScaling?: number;
  /**
   * First-build discount (§ faster early game): a fraction (0..1) taken off the
   * cost of the *first ever* copy of this building — 1 means the first one is
   * free, 0.5 half price. Keyed on lifetime built count (`stats.built`), never
   * the current count, so demolishing and rebuilding can't farm the discount.
   * Lets the core economy loop (first sawmill/well/farm/market) start without a
   * money wait, after which normal prices apply. Generic and config-only.
   */
  firstBuildDiscount?: number;
  /**
   * Marks the building as an active-trade hub (§7 Handelskontor). Its presence
   * unlocks manual selling/buying of resources; a higher completed upgrade stage
   * improves the sell rate. Purely a flag — the pricing lives in the balancing
   * config so the mechanic stays config-driven.
   */
  tradePost?: boolean;
  /**
   * Optional visual metadata (v0.21, forward-looking): lets a later 2.5D/3D
   * render pick assets and heights per building/stage WITHOUT any simulation
   * change — the sim only ever reads logical fields (position, size, effects).
   * All fields are optional and unused by the current programmatic renderer
   * (which derives skyline height from upgradeLevel); they exist so upgrade
   * visuals and iso/3D models can be swapped in per stage without a data
   * migration. See docs/CONCEPT.md "visual layer".
   */
  visual?: BuildingVisual;
}

/** Forward-looking visual descriptor (see BuildingDef.visual). */
export interface BuildingVisual {
  /** Relative height class for a later 2.5D/3D render (0 = flat, higher = taller). */
  heightClass?: number;
  sprite2d?: string;
  spriteIso?: string;
  model3d?: string;
  /**
   * Consistent art family per building (v0.26, §14): keeps the build-menu
   * preview, the detail sheet, the later 2D map sprite and the eventual iso/3D
   * variant referencing the SAME visual identity. All optional and currently
   * ignored by the 2D renderer; when unset the art components fall back to
   * `buildings/<id>.png` and finally the built-in vector art. `cardArt`/`sheetArt`
   * are asset-registry keys (filenames without extension), the sprite/model
   * fields are references a later renderer resolves.
   */
  cardArt?: string;
  sheetArt?: string;
  mapSprite2d?: string;
  isoPreview?: string;
  model3dRef?: string;
  /** Low-poly LOD + fallback model, plus fine-tuning for how the model sits on
   *  its footprint (v0.32 world-asset pipeline — optional, honoured by the 3D
   *  renderer). `model3d` (above) is the explicit model filename override. */
  model3dLod?: string;
  fallbackModel?: string;
  /** Uniform scale multiplier applied after the auto-fit to the footprint. */
  scale?: number;
  /** Extra Y-rotation in radians (front-facing correction for a model). */
  rotationOffset?: number;
  /** Small visual nudge in world units so a model lines up with its footprint. */
  footprintVisualOffset?: { x: number; y: number; z: number };
  /** Coarse size bucket for a later renderer (does not affect logic). */
  sizeClass?: 'flat' | 'low' | 'medium' | 'high' | 'landmark' | 'hero';
  /** Where markers/overlays anchor, in footprint-relative tile units. */
  overlayAnchor?: { x: number; y: number };
  /** Optional per-upgrade-stage overrides, index = upgradeLevel. */
  stages?: BuildingVisual[];
}

// ---- Resources & needs ----------------------------------------------------

export interface ResourceDef {
  id: ResourceId;
  nameKey: string;
  /** Base storage cap; Infinity for money. */
  baseStorage: number;
}

export interface NeedDef {
  id: NeedId;
  nameKey: string;
  unlockLevel: number;
  weight: number;
  kind: 'capacity' | 'coverage' | 'consumption';
  /** demand = population × demandPerCapita (capacity/consumption kinds). */
  demandPerCapita: number;
  /**
   * For `consumption` needs: the stored resource citizens eat/drink each tick
   * (food → 'food', drinking water → 'freshwater'). Lets several consumable
   * supply chains share one generic consumption path. Defaults to 'food'.
   */
  consumesResource?: ResourceId;
}

// ---- Progression ----------------------------------------------------------

export interface LevelDef {
  level: number;
  /** Cumulative XP required to reach this level. */
  xpRequired: number;
  unlocks: BuildingDefId[];
  rewards: { money?: number; gold?: number };
}

export type QuestObjective =
  | { type: 'build'; defId: BuildingDefId; count: number }
  | { type: 'population'; amount: number }
  | { type: 'resource'; resource: ResourceId; amount: number }
  /** Lifetime production of a resource (production stores automatically). */
  | { type: 'produce'; resource: ResourceId; amount: number }
  | { type: 'level'; level: number }
  /** Zusätzlich freigeschaltete Regionen (§ Welt 2.0; Startregion zählt nicht). */
  | { type: 'regions'; count: number }
  | { type: 'mayorAction'; actionId: MayorActionId; count: number }
  | { type: 'happiness'; amount: number }
  /** Completed building upgrades — a specific def, or any (§ active play). */
  | { type: 'upgrade'; defId?: BuildingDefId; count: number }
  /** Completed Stadtarbeit activities of any type. */
  | { type: 'activity'; count: number }
  /** Lifetime money earned through active trading/contracts. */
  | { type: 'tradeEarnings'; amount: number };

/**
 * Who a quest comes from (§6/§14): reframes the level checklist as a living
 * request from a citizen, the building department, the fire service, a merchant
 * or the mayor's office. Purely presentational — the reward still comes from the
 * game system, but the task now reads as "you helped someone".
 */
export type QuestSender = 'citizen' | 'buildingDept' | 'fire' | 'merchant' | 'mayor';

export interface QuestDef {
  id: QuestId;
  titleKey: string;
  descriptionKey: string;
  unlockLevel: number;
  objectives: QuestObjective[];
  /**
   * Payout on claim. `resources` lets a quest hand out materials (wood/stone/…)
   * alongside money/gold/xp — used by the housing drive (§16) to seed the next
   * build. Materials respect storage caps like any grant.
   */
  rewards: { money?: number; gold?: number; xp?: number; resources?: Partial<Record<ResourceId, number>> };
  nextQuestId?: QuestId;
  /** Optional "who's asking" framing for the quest card (§6). */
  sender?: QuestSender;
}

// ---- Mayor ----------------------------------------------------------------

export interface MayorActionDef {
  id: MayorActionId;
  nameKey: string;
  descriptionKey: string;
  unlockLevel: number;
  cooldownSec: number;
  effect:
    | { type: 'buff'; kind: 'happiness' | 'tax' | 'production' | 'foodDistribution'; amount: number; durationSec: number }
    | { type: 'resolveEvents'; eventType: 'fire' };
}

// ---- Stadtarbeit / activities (v0.21, § aktives Stadtmanagement) -----------

/**
 * Reward band for an activity, picked by player level (highest matching
 * `minLevel` wins). Keeps one activity definition rewarding across the whole
 * game: thousands early, tens of thousands mid-game, hundreds of thousands
 * late (§ Belohnungsskalierung).
 */
export interface ActivityRewardTier {
  minLevel: number;
  money: number;
  xp: number;
  gold?: number;
  resources?: Partial<Record<ResourceId, number>>;
  /** Optional timed session bonus on completion (e.g. food distribution). */
  buff?: { kind: 'happiness' | 'tax' | 'production' | 'foodDistribution'; amount: number; durationSec: number };
}

/** One choice in a mayor decision, with visible trade-offs. */
export interface ActivityDecisionOption {
  /** i18n: `activity.<activityId>.option.<id>` (+ `.effect`). */
  id: string;
  cost?: Partial<Record<ResourceId, number>>;
  reward?: { money?: number; xp?: number };
  buff?: { kind: 'happiness' | 'tax' | 'production' | 'foodDistribution'; amount: number; durationSec: number };
  /** Several simultaneous effects for one option (§12: real trade-offs). */
  buffs?: { kind: 'happiness' | 'tax' | 'production' | 'foodDistribution'; amount: number; durationSec: number }[];
  /** Option only offered when the city has one of these buildings (§12). */
  requiresAnyBuilding?: string[];
}

/**
 * Display grouping for the Stadtarbeit board filters (§3) — orthogonal to the
 * mechanic (`type`). Several activities can share a mechanic but sit in
 * different categories (a delivery can be `supply` or `logistics`).
 */
export type ActivityCategory =
  | 'supply'
  | 'inspection'
  | 'politics'
  | 'event'
  | 'safety'
  | 'trade'
  | 'environment'
  | 'logistics';

/** How demanding a mission is — drives a board badge and reward scaling (§6). */
export type ActivityDifficulty = 'easy' | 'medium' | 'hard';

/** Completion grade (§6): scales the payout — poor run < full run < perfect run. */
export type ActivityQuality = 'bronze' | 'silver' | 'gold';

export type VehicleConsumption = 'low' | 'medium' | 'high';

/**
 * Datengetriebene Fahrzeugkarte für Planung und Renderer. Die Werte sind echte
 * Config-Daten; UI und Renderer dürfen keine Kapazität oder Geschwindigkeit
 * erfinden. `future` bereitet Bahn/Flug sichtbar vor, macht sie aber nicht
 * auswählbar.
 */
export interface ActivityVehicleDef {
  id: DriveVehicle;
  nameKey: string;
  descriptionKey: string;
  unlockLevel: number;
  capacity: number;
  speedKph: number;
  handling: number;
  operatingCost: number;
  consumption: VehicleConsumption;
  imageKey: string;
  strengthsKeys: string[];
  weaknessesKeys: string[];
  future?: boolean;
  /**
   * Fahrzeugeignung (§ Stadtarbeit-Logik 2.0, L4 / A6). Alle optional und
   * rückwärtskompatibel; nur die Bewertung/Prognose (`evaluateInfrastructure`)
   * liest sie — kein Save, keine Auszahlung. Fehlt ein Feld, greift ein
   * benannter Standardwert in `activities/logistics.ts`.
   */
  /** Zeit für eine Beladung an der Quelle (Sekunden). */
  loadTimeSec?: number;
  /** Entladezeit je beliefertem Ziel (Sekunden). */
  unloadTimeSecPerTarget?: number;
  /** Malus in engen/vollen Straßen 0..1 (großes Fahrzeug = höher). */
  narrowStreetPenalty?: number;
  /** §12: gekühlt — verderbliche Ladung verliert kaum Qualität. */
  cooling?: boolean;
}

/**
 * A Stadtarbeit activity: a short, repeatable, hands-on mayor task that only
 * exists while the player is playing. `delivery` and `inspection` put clickable
 * targets on the map; `decision` opens a trade-off popup. Trade contracts are
 * separate templates (below) because they rotate instead of cooling down.
 *
 * Availability is no longer a cooldown wall (§2): a mission shows on the board
 * whenever the city can actually support it (unlock level, required buildings,
 * enough targets). Only `decision` activities keep a modest cooldown so a single
 * policy choice can't be spammed for XP.
 */
export interface ActivityDef {
  id: string;
  type: 'delivery' | 'inspection' | 'decision';
  /** Board grouping for filters/badges (§3). Defaults from `type` if omitted. */
  category?: ActivityCategory;
  /** Difficulty badge + reward scaling context (§6). */
  difficulty?: ActivityDifficulty;
  nameKey: string;
  descriptionKey: string;
  unlockLevel: number;
  /** Cooldown in seconds. Optional/0 = always available (§2). Used for decisions. */
  cooldownSec?: number;
  /** Who's asking — reuses the quest sender avatars (§ Stadtkommunikation). */
  sender: QuestSender;
  /** Offered only if the city has at least one of these building def ids (§14). */
  requiresAnyBuilding?: string[];
  /** delivery/inspection: how many map targets are picked. */
  targetCount?: { min: number; max: number };
  /**
   * Fahr-Minispiel (§ Stadtarbeit / A6): statt Ziele anzuklicken fährt der
   * Spieler ein Fahrzeug (WASD, Verfolgerkamera) über das Straßennetz zu den
   * Zielen. Rein zusätzliche Interaktionsschicht — dieselben Ziele/Belohnungen
   * wie eine Klick-Lieferung, `progressActivity` schließt ein erreichtes Ziel ab.
   */
  drive?: boolean;
  /** Standardfahrzeug, wenn keine Auswahl übergeben wird. */
  vehicle?: DriveVehicle;
  /** Für diesen Auftrag wählbare Fahrzeuge; Reihenfolge = Empfehlung. */
  vehicleOptions?: DriveVehicle[];
  /** Zielauswahl: nur Gebäude dieser Kategorien (statt der delivery-Standardhäuser). */
  targetCategories?: BuildingCategory[];
  /** Zielauswahl: nur Gebäude mit diesen Def-Ids (hat Vorrang vor targetCategories). */
  targetDefIds?: string[];
  /** delivery: beating this deadline pays the speed bonus. Never fails. */
  timeLimitSec?: number;
  /** delivery: reward multiplier when finished within the time limit. */
  speedBonusFactor?: number;
  /** delivery: resources consumed per delivered target (e.g. food per stop). */
  costPerTarget?: Partial<Record<ResourceId, number>>;
  /**
   * Ladungsmodell (§ Stadtarbeit-Logik 2.0): die TRANSPORTIERTE Menge, die das
   * Fahrzeug füllt und Nachladen erzwingt — getrennt vom Ökonomie-Verbrauch
   * (`costPerTarget`). Ohne dieses Feld leitet der Logistikplaner das Modell aus
   * einer Ein-Ressourcen-`costPerTarget` ab. Auswertung: `game/activities/logistics.ts`.
   */
  cargoModel?: {
    resource: ResourceId;
    perTarget: number;
    scaleByResidents?: boolean;
    perishable?: boolean;
  };
  /** decision: 2–4 options with trade-offs. */
  options?: ActivityDecisionOption[];
  rewardTiers: ActivityRewardTier[];
}

/**
 * A trade-contract template (§ Handelsaufträge). Each rotation window a
 * deterministic selection of these is offered; fulfilling one consumes the
 * demanded resources and pays out immediately. Big contracts are rare,
 * high-level and lucrative (up to ~1M).
 */
export interface TradeContractTemplate {
  id: string;
  minLevel: number;
  demands: Partial<Record<ResourceId, number>>;
  rewardMoney: number;
  rewardXp: number;
  rewardGold?: number;
  /** Relative selection weight within a rotation (default 1). */
  weight?: number;
}

export interface ActivitiesConfig {
  activities: ActivityDef[];
  vehicles: ActivityVehicleDef[];
  tradeContracts: TradeContractTemplate[];
  /** Seconds per contract rotation window. */
  tradeRotationSec: number;
  /** Offers shown per rotation window. */
  tradeOffersPerRotation: number;
}

// ---- World ----------------------------------------------------------------

export interface BiomeDef {
  id: string;
  nameKey: string;
  terrainTypes: TerrainType[];
  unlockLevel: number;
}

/** Landschafts-Charakter einer organischen Region (§ Welt 2.0). */
export type RegionBiome =
  | 'zentrum'
  | 'ebene'
  | 'wald'
  | 'gebirge'
  | 'huegel'
  | 'see'
  | 'kueste'
  | 'fruchtbar'
  | 'flusstal'
  | 'insel';

/**
 * Datengetriebene Region-Definition (§ Welt 2.0): der Spieler schaltet keine
 * Quadrate frei, sondern Landschaften. Geometrie (Kachelzugehörigkeit,
 * Nachbarschaft, Statistik) kommt aus dem Bake (`islandRegions.gen.ts`); diese
 * Config gibt jeder Region Namen, Charakter, Vor-/Nachteile und
 * Freischaltbedingungen. `buildableTiles` ist informativ aus dem Bake-Report
 * (Anzeige/Balancing-Referenz), nicht simulationswirksam.
 */
export interface RegionDef {
  /** Numerische Region-Id aus dem Bake (1..REGION_COUNT). */
  id: number;
  nameKey: string;
  biome: RegionBiome;
  /** Nie freischaltbare Regionen (z. B. vorgelagerte Teaser-Inseln). */
  unlockable: boolean;
  /** Mindest-Stadtlevel für die Freischaltung. */
  unlockLevel: number;
  /** Explizite Freischaltkosten. */
  unlockCost: number;
  /**
   * Zusätzlich nötige, bereits freigeschaltete Regionen (z. B. der
   * Hochgebirgskern erst über seine Randregionen). Muss eine Teilmenge der
   * gebackenen Nachbarschaft sein — loadConfig erzwingt das.
   */
  prerequisiteRegionIds?: number[];
  /** Bebaubare Kacheln laut Bake-Report (informativ). */
  buildableTiles: number;
  /**
   * Produktions-Modifikatoren der Region (× auf den Gebäude-Output, wirksam ab
   * Phase A4): z. B. Waldregion wood 1.5, Gebirge stone 1.6 / food 0.6.
   */
  productionModifiers?: Partial<Record<'wood' | 'stone' | 'food' | 'water' | 'energy', number>>;
  /**
   * Nachteil-Malus: Faktor auf Straßen-Baukosten in dieser Region (Gebirge
   * baut teurer, § Welt 2.0 „jede Region hat Vor- und Nachteile"). Wirksam ab
   * Phase A4; 1/undefined = neutral.
   */
  roadCostFactor?: number;
  /**
   * § Final World Compaction 8.1: Die Region hängt NICHT über Land am
   * bestehenden Stadtgebiet, sondern nur über eine schmale Wasserstraße
   * (`BAKED_REGIONS[].seaAdjacent`). Sie lässt sich erst erschließen, wenn in
   * einer bereits freigeschalteten, seebenachbarten Region ein echter Hafen
   * steht. Nutzt die vorhandenen Gebäude `dock_small`/`river_port` — es gibt
   * keine zweite Regions- oder Schifffahrtslogik.
   */
  requiresHarbor?: boolean;
}

// ---- Balancing ------------------------------------------------------------

export interface BalancingConfig {
  /**
   * Global population multiplier (§9): every stated household holds this many
   * times its per-unit residents, so cities reach believable head counts
   * (~100k at L11) while configs keep small, readable numbers. Per-capita
   * demands/taxes (food/water/work/tax) are divided by the same factor so the
   * economy stays in balance at the larger scale, and coverage capacities and
   * growth rates are multiplied by it.
   */
  populationScale: number;
  /** Residential income (property/residence tax) per citizen per minute. */
  taxPerCapitaPerMin: number;
  /** Happiness → income multiplier range (applies to every income source). */
  taxFactorMin: number;
  taxFactorMax: number;
  /**
   * Share of the population that forms the labor force. Commercial/industrial
   * income scales with staffing: `min(1, laborForce / jobs)`. Also the
   * reference the work need uses so "filled jobs" is one consistent notion.
   */
  laborParticipation: number;
  /**
   * Base citizens moving in per minute — a flat floor so even a tiny village
   * keeps filling. The real driver of a big city is `growthFillRatePerMin`
   * below; this just guarantees a minimum trickle.
   */
  growthPerMin: number;
  /**
   * Fraction of *free* housing that moves in per minute at full happiness
   * (§ believable growth). Move-in scales with how much empty housing exists, so
   * a 45 000-capacity metropolis at 99 % happiness fills in minutes instead of
   * crawling at a flat trickle — the fix for "big city stuck far below capacity".
   * Applied on top of `growthPerMin` and scaled by how far happiness sits above
   * the growth threshold.
   */
  growthFillRatePerMin: number;
  declinePerMin: number;
  growthHappinessThreshold: number;
  declineHappinessThreshold: number;
  /** Without an active market, food fulfillment is capped at this value. */
  foodWithoutDistributionCap: number;
  startResources: Record<ResourceId, number>;
  startGold: number;
  /** Fire risk per production/residential building per minute (level ≥ fire unlock). */
  fireChancePerBuildingPerMin: number;
  fireDurationSec: number;
  fireDurationProtectedSec: number;
  fireUnlockLevel: number;
  /** Max catch-up chunk length in seconds (accuracy of offline simulation). */
  maxTickChunkSec: number;
  /** Gold cost per started minute of remaining construction time. */
  speedupMinutesPerGold: number;
  /** Share of the invested build + upgrade cost refunded on demolition (0..1). */
  demolishRefundFactor: number;
  /** Happiness points per average ambience point (residential quality → zoning). */
  ambienceHappinessPerPoint: number;
  /** Absolute cap on the ambience happiness contribution (± this value). */
  ambienceHappinessCap: number;
  /**
   * Citizens grow more demanding as the city levels up: every level above 1
   * raises each need's demand by this fraction (expectation creep). Keeps
   * happiness from sticking at 100 % as the city grows (§3).
   */
  needExpectationPerLevel: number;
  /** Lower/upper bound the mayor can set a tax rate to (§ tax sliders). */
  taxRateMin: number;
  taxRateMax: number;
  /** Happiness lost per +1.0 of residential tax rate above neutral (residents feel it most). */
  residentialTaxHappinessPer: number;
  /** Happiness lost per +1.0 of commercial tax rate above neutral (softer: business climate). */
  commercialTaxHappinessPer: number;
  /** Level at which the first far expansion (river district) becomes possible. */
  districtUnlockLevel: number;
  /** One-off cost to found a district (the "Fernstraße/Distrikt" project, §8). */
  districtFoundCost: Partial<Record<ResourceId, number>>;
  /**
   * Money cost at/above which a building counts as a "Großprojekt" (major
   * project) in the UI — it gets an investment framing and, when unaffordable,
   * a helpful income hint ("more revenue needed: X/min now, ~Y/min recommended")
   * instead of a bare "too little money" (§ realistic prices / long-term goals).
   */
  majorProjectMoneyThreshold: number;
  /**
   * Rough guideline for the income hint: a major project should be affordable
   * from steady income within this many minutes, so the recommended net income
   * shown is `cost / this`. Purely advisory UI text, no simulation effect.
   */
  majorProjectPaybackMinutes: number;
  /**
   * Base sell price per unit at the trading post (§7) — the only way surplus
   * becomes money since v0.21 (no passive overflow export). Scarcer/harder
   * resources are worth more (stone > wood > food). Absent resources can't be
   * sold. Selling is a manual player command, so it is inherently active.
   */
  exportRates: Partial<Record<ResourceId, number>>;
  /**
   * Sell-rate bonus per completed trading-post stage (§7): a stage-1 Handelskontor
   * sells at `1 + tradeSellBonusPerLevel` × the base export rate, so upgrading it
   * pays off.
   */
  tradeSellBonusPerLevel: number;
  /**
   * How much dearer buying is than the base export rate (§7): buy price =
   * `exportRates × tradeBuyMarkup`. Kept well above the sell rate so buying is an
   * emergency convenience, never an arbitrage — production stays the real source.
   */
  tradeBuyMarkup: number;
}

export interface FeaturesConfig {
  goldSystem: boolean;
  testShop: boolean;
  debugTools: boolean;
  /**
   * Relocating placed buildings. Off in MVP 1: realistic planning means a
   * misplacement is torn down and rebuilt, not dragged (§5). The engine command
   * stays for a possible later toggle; the UI gesture/button are gated on this.
   */
  moveBuildings: boolean;
}
