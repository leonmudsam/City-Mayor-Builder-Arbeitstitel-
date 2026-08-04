import type { BuildingDef } from './types.ts';

// § Gebäudesystem 2.0 — verbindliche Größen & Progression (docs/BUILDINGS.md).
//
// Jedes Gebäude hat eine Größenklasse (XS 1×1 · S 2×2 · M 3×3 · L 4×4–5×5 ·
// XL 6×6–7×7 · XXL 8×8) und einen Footprint, der zur realen Wirkung passt:
// eine Feuerwehr (5×5 mit Vorplatz/Garagen/Hof) ist sichtbar größer als ein
// Wohnhaus (3×3), ein Kraftwerk (8×8) dominiert ein Viertel. Footprints sind
// FIX über alle Stufen (Nutzer-Entscheidung) und bewusst quadratisch, damit
// Rotation rein visuell bleibt. Stufenregeln (§7 Auftrag A): Deko 1 ·
// Geschäfte 2 · Versorgung 2–3 · Industrie 3 · Verwaltung 3–4 · Wohnen eigene
// Ketten · Landmarken 1 — wenige, dafür deutlich sichtbare Sprünge (weniger
// GLB-Stufenmodelle, jede Stufe ein Meilenstein).
//
// Wohn-Progression (Hybrid, Nutzer-Entscheidung): `house_small` ist DER
// Begleiter durchs Spiel (6 Stufen: Kleines Haus → … → Wohnblock);
// `residential_tower` ist das späte Prestige-Gebäude (Wohnturm → Hochhaus →
// Wolkenkratzer, L15–L20). house_row/apartment sind entfallen (Migration v11
// erstattet sie zu 100 %).
//
// Money is on a believable municipal scale (§4); materials stay small-scale so
// they remain a separate bottleneck (§3). Income sources (§5): residential tax
// (per capita), commercial and industrial revenue — the latter two scale with
// staffing.
export const buildingsConfig: BuildingDef[] = [
  // ---- Verwaltung / Regierung ----
  {
    id: 'town_hall',
    category: 'government',
    nameKey: 'building.town_hall',
    size: { w: 5, h: 5 },
    sizeClass: 'L',
    requiresRoad: false,
    unlockLevel: 1,
    cost: {},
    constructionSec: 0,
    xpReward: 0,
    unique: true,
    buildable: false,
    // The city's anchor can never be torn down — but it can be relocated so an
    // awkward starting spot isn't permanent (§2).
    canDemolish: false,
    canRelocate: true,
    effects: [
      { type: 'jobs', amount: 5 },
      { type: 'storage', resource: 'wood', amount: 400 },
      { type: 'storage', resource: 'stone', amount: 400 },
      { type: 'storage', resource: 'food', amount: 400 },
      { type: 'storage', resource: 'planks', amount: 150 },
      { type: 'storage', resource: 'cut_stone', amount: 150 },
      // Civic presence: a small attractiveness aura for the surrounding blocks
      // (§9), reusing the same ambience → happiness path as parks/zoning.
      { type: 'ambience', amount: 2, radius: 4 },
    ],
    // Monumental-Kette (§ Gebäudesystem 2.0): Rathaus → Stadtverwaltung →
    // Stadtpalais → Monumentalrathaus. Das 5×5-Grundstück (Vorplatz, Flügel)
    // wird je Stufe sichtbarer gefüllt; jede Stufe ist ein Stadt-Meilenstein.
    upgrades: [
      {
        cost: { money: 150_000, wood: 140, stone: 140, cut_stone: 30 },
        constructionSec: 180,
        xpReward: 60,
        unlockLevel: 6,
        nameKey: 'building.town_hall.2', // Stadtverwaltung
        effects: [
          { type: 'jobs', amount: 14 },
          { type: 'storage', resource: 'wood', amount: 700 },
          { type: 'storage', resource: 'stone', amount: 700 },
          { type: 'storage', resource: 'food', amount: 700 },
          { type: 'storage', resource: 'planks', amount: 400 },
          { type: 'storage', resource: 'cut_stone', amount: 400 },
          { type: 'ambience', amount: 3, radius: 5 },
        ],
      },
      {
        cost: { money: 600_000, wood: 300, stone: 380, planks: 160, cut_stone: 220 },
        constructionSec: 360,
        xpReward: 150,
        unlockLevel: 11,
        nameKey: 'building.town_hall.3', // Stadtpalais
        effects: [
          { type: 'jobs', amount: 28 },
          { type: 'storage', resource: 'wood', amount: 1_100 },
          { type: 'storage', resource: 'stone', amount: 1_100 },
          { type: 'storage', resource: 'food', amount: 1_100 },
          { type: 'storage', resource: 'planks', amount: 700 },
          { type: 'storage', resource: 'cut_stone', amount: 700 },
          { type: 'ambience', amount: 4, radius: 6 },
        ],
      },
      {
        cost: { money: 2_000_000, wood: 600, stone: 850 },
        constructionSec: 600,
        xpReward: 320,
        unlockLevel: 16,
        nameKey: 'building.town_hall.4', // Monumentalrathaus
        effects: [
          { type: 'jobs', amount: 48 },
          { type: 'storage', resource: 'wood', amount: 1_700 },
          { type: 'storage', resource: 'stone', amount: 1_700 },
          { type: 'storage', resource: 'food', amount: 1_700 },
          { type: 'storage', resource: 'planks', amount: 1_100 },
          { type: 'storage', resource: 'cut_stone', amount: 1_100 },
          { type: 'ambience', amount: 6, radius: 8 },
        ],
      },
    ],
  },
  {
    id: 'mayor_house',
    category: 'government',
    nameKey: 'building.mayor_house',
    size: { w: 3, h: 3 },
    sizeClass: 'M',
    requiresRoad: true,
    unlockLevel: 3,
    cost: { money: 30_000, wood: 50 },
    constructionSec: 60,
    xpReward: 40,
    unique: true,
    canDemolish: false,
    canRelocate: true,
    relocationCost: { money: 3_000 },
    effects: [],
  },

  // District centre (MVP 2): the anchor of a far district, planted by the
  // "found district" project (not buildable from the menu). Like a small town
  // hall — it stores goods, employs a few, lifts the local mood and seeds its
  // own road network (§8).
  {
    id: 'district_center',
    category: 'government',
    nameKey: 'building.district_center',
    size: { w: 4, h: 4 },
    sizeClass: 'L',
    requiresRoad: false,
    unlockLevel: 12,
    cost: {},
    constructionSec: 0,
    xpReward: 0,
    buildable: false,
    canDemolish: false,
    canRelocate: false,
    effects: [
      { type: 'jobs', amount: 6 },
      { type: 'storage', resource: 'wood', amount: 300 },
      { type: 'storage', resource: 'stone', amount: 300 },
      { type: 'storage', resource: 'food', amount: 300 },
      { type: 'storage', resource: 'planks', amount: 120 },
      { type: 'storage', resource: 'cut_stone', amount: 120 },
      { type: 'ambience', amount: 2, radius: 4 },
    ],
  },

  // ---- Straßen ----
  {
    id: 'road',
    category: 'roads',
    nameKey: 'building.road',
    size: { w: 1, h: 1 },
    sizeClass: 'XS',
    requiresRoad: false,
    unlockLevel: 1,
    cost: { money: 300 },
    constructionSec: 0,
    xpReward: 1,
    // Der Spieler baut nur diese EINE Straße. Gelände, Wasser, Klippen und
    // Längsprofil wählen automatisch die passende Konstruktion; die Aufschläge
    // sind datengetrieben und werden in Vorschau und Command identisch genutzt.
    road: {
      crossesWater: true,
      crossesCliff: true,
      maxSlope: 5,
      variantCostPerTile: {
        slope: { money: 90 },
        pass: { money: 220, stone: 1 },
        support: { money: 650, stone: 5, wood: 1 },
        viaduct: { money: 1_250, stone: 12, wood: 3 },
        bridge: { money: 900, stone: 8, wood: 6 },
        coast: { money: 320, stone: 3 },
      },
    },
    // Road maintenance: tiny per tile, but it scales with sprawl — a gentle
    // pressure toward compact layouts rather than endless empty avenues.
    effects: [{ type: 'upkeep', resource: 'money', perMinute: 8 }],
  },

  // Höhenstraße (§ Infrastruktur 2.0 / I1, D-036): DER Unblocker der verdichteten
  // Welt (D-035). Überwindet Wasser/Fluss (Brücke mit Pfeilern) und Klippen/
  // Steilhänge (Viadukt) — Deck/Pfeiler/Rampen stellt der Renderer automatisch aus
  // dem Terrain dar. Deutlich teurer als die Bodenstraße und zusätzlich stein-/
  // holzintensiv; über tatsächlich überbrückten Wasser-/Klippenkacheln kommt ein
  // Pfeiler-Aufschlag dazu (`road.bridgeCostPerTile`). Bleibt eine normale
  // Straßen-Bauklasse über denselben `roadNetwork` — kein zweites System (§2).
  {
    id: 'road_elevated',
    category: 'roads',
    nameKey: 'building.road_elevated',
    size: { w: 1, h: 1 },
    sizeClass: 'XS',
    requiresRoad: false,
    // Save-/API-Kompatibilität für alte Höhenstraßen. Der Baushop filtert diese
    // Legacy-Definition explizit; neue Spielertrassen verwenden nur `road`.
    unlockLevel: 2,
    // Holzbasiert (Sägewerk ab L2), damit die Höhenstraße die verdichtete Welt
    // WIRKLICH früh entsperrt — Stein käme erst mit dem Steinbruch (L4) und würde
    // weiter blockieren. Teure Holz-Trestle-Brücken; steinerne Prachtbrücken sind
    // eine spätere Bauklasse (I2/I4).
    cost: { money: 1_200, wood: 40 },
    constructionSec: 0,
    xpReward: 2,
    road: {
      crossesWater: true,
      crossesCliff: true,
      maxSlope: 5,
      bridgeCostPerTile: { money: 800, wood: 20 },
    },
    effects: [{ type: 'upkeep', resource: 'money', perMinute: 30 }],
  },

  // ---- Wohnen ----
  // Das kleine Haus (§ Gebäudesystem 2.0): DER wichtigste Gebäudetyp — es
  // begleitet den Spieler über 6 Stufen durchs ganze Spiel. 3×3-Grundstück
  // (Haus + Garten), jede Stufe verdichtet dasselbe Grundstück sichtbar:
  // Kleines Haus → Einfamilienhaus → Doppelhaus → Mehrfamilienhaus →
  // Apartmenthaus → Wohnblock. Vorstädte reagieren stark auf Umgebung (§7).
  {
    id: 'house_small',
    category: 'residential',
    nameKey: 'building.house_small',
    size: { w: 3, h: 3 },
    sizeClass: 'M',
    requiresRoad: true,
    unlockLevel: 1,
    cost: { money: 12_000, wood: 30 },
    constructionSec: 20,
    xpReward: 5,
    effects: [
      { type: 'housing', units: 1, minResidentsPerUnit: 2, maxResidentsPerUnit: 5, ambienceSensitivity: 1.4 },
      { type: 'demand', need: 'water', amount: 6 },
      // Residential upkeep scales with households, so it tracks population and
      // gently nets out the per-capita tax without hurting the early game.
      { type: 'upkeep', resource: 'money', perMinute: 40 },
    ],
    upgrades: [
      {
        cost: { money: 34_000, wood: 60, stone: 25 },
        constructionSec: 90,
        xpReward: 18,
        unlockLevel: 3,
        nameKey: 'building.house_small.2', // Einfamilienhaus
        effects: [
          { type: 'housing', units: 3, minResidentsPerUnit: 2, maxResidentsPerUnit: 5, ambienceSensitivity: 1.4 },
          { type: 'demand', need: 'water', amount: 14 },
          { type: 'upkeep', resource: 'money', perMinute: 95 },
        ],
      },
      {
        cost: { money: 160_000, wood: 150, stone: 100, planks: 40 },
        constructionSec: 240,
        xpReward: 36,
        unlockLevel: 6,
        nameKey: 'building.house_small.3', // Doppelhaus
        effects: [
          { type: 'housing', units: 6, minResidentsPerUnit: 2, maxResidentsPerUnit: 6, ambienceSensitivity: 1.3 },
          { type: 'demand', need: 'water', amount: 26 },
          { type: 'upkeep', resource: 'money', perMinute: 210 },
        ],
      },
      {
        cost: { money: 380_000, wood: 260, stone: 220 },
        constructionSec: 300,
        xpReward: 55,
        unlockLevel: 9,
        nameKey: 'building.house_small.4', // Mehrfamilienhaus
        effects: [
          { type: 'housing', units: 14, minResidentsPerUnit: 3, maxResidentsPerUnit: 6, ambienceSensitivity: 1.2 },
          { type: 'demand', need: 'water', amount: 62 },
          { type: 'demand', need: 'energy', amount: 24 },
          { type: 'upkeep', resource: 'money', perMinute: 480 },
        ],
      },
      {
        cost: { money: 950_000, wood: 420, stone: 440 },
        constructionSec: 420,
        xpReward: 85,
        unlockLevel: 12,
        nameKey: 'building.house_small.5', // Apartmenthaus
        effects: [
          { type: 'housing', units: 40, minResidentsPerUnit: 3, maxResidentsPerUnit: 5, ambienceSensitivity: 1.15 },
          { type: 'demand', need: 'water', amount: 150 },
          { type: 'demand', need: 'energy', amount: 95 },
          { type: 'upkeep', resource: 'money', perMinute: 1_350 },
        ],
      },
      {
        // Wohnblock — das Gründer-Grundstück, voll verdichtet: beherbergt so
        // viele Haushalte wie eine ganze Straße von Starterhäusern.
        cost: { money: 2_100_000, wood: 680, stone: 720 },
        constructionSec: 540,
        xpReward: 130,
        unlockLevel: 15,
        nameKey: 'building.house_small.6', // Wohnblock
        effects: [
          { type: 'housing', units: 90, minResidentsPerUnit: 3, maxResidentsPerUnit: 5, ambienceSensitivity: 1.1 },
          { type: 'demand', need: 'water', amount: 300 },
          { type: 'demand', need: 'energy', amount: 190 },
          { type: 'upkeep', resource: 'money', perMinute: 2_900 },
        ],
      },
    ],
    // Wohn-Limit (§1/§2): das Haus bleibt das Rückgrat — der Deckel wächst mit
    // der Stadt, aber Dichte kommt aus dem AUFWERTEN der Bestände, nicht aus
    // endlosen neuen Kisten.
    buildLimit: [{ level: 1, max: 10 }, { level: 5, max: 14 }, { level: 8, max: 18 }, { level: 11, max: 22 }, { level: 14, max: 26 }, { level: 17, max: 30 }],
  },
  // Wohnturm (§ Gebäudesystem 2.0): das späte Prestige-Wohngebäude auf großem
  // 5×5-Grundstück (Turm + Plaza) — Wohnturm → Hochhaus → Wolkenkratzer. Hier
  // kommt die Bevölkerung der Metropole her; schwere Infrastrukturlast, und
  // seine Bewohner erwarten ein gepflegtes Umfeld (§6).
  {
    id: 'residential_tower',
    category: 'residential',
    nameKey: 'building.residential_tower',
    size: { w: 5, h: 5 },
    sizeClass: 'L',
    requiresRoad: true,
    unlockLevel: 15,
    cost: { money: 2_800_000, wood: 600, stone: 1_200 },
    constructionSec: 600,
    xpReward: 140,
    effects: [
      { type: 'housing', units: 900, minResidentsPerUnit: 3, maxResidentsPerUnit: 5, ambienceSensitivity: 1.25 },
      { type: 'demand', need: 'water', amount: 1_800 },
      { type: 'demand', need: 'energy', amount: 1_100 },
      { type: 'upkeep', resource: 'money', perMinute: 13_000 },
    ],
    // Skyline-Endgame: zwei Multi-Millionen-Stufen bis zum Wolkenkratzer (L20) —
    // der langfristige „Verdichte das Zentrum"-Motor.
    upgrades: [
      {
        cost: { money: 6_000_000, wood: 900, stone: 2_000 },
        constructionSec: 660,
        xpReward: 220,
        unlockLevel: 17,
        nameKey: 'building.residential_tower.2', // Hochhaus
        effects: [
          { type: 'housing', units: 1_400, minResidentsPerUnit: 3, maxResidentsPerUnit: 5, ambienceSensitivity: 1.3 },
          { type: 'demand', need: 'water', amount: 2_800 },
          { type: 'demand', need: 'energy', amount: 1_700 },
          { type: 'upkeep', resource: 'money', perMinute: 20_000 },
        ],
      },
      {
        cost: { money: 12_000_000, wood: 1_400, stone: 3_200 },
        constructionSec: 780,
        xpReward: 360,
        unlockLevel: 20,
        nameKey: 'building.residential_tower.3', // Wolkenkratzer
        effects: [
          { type: 'housing', units: 2_200, minResidentsPerUnit: 3, maxResidentsPerUnit: 5, ambienceSensitivity: 1.35 },
          { type: 'demand', need: 'water', amount: 4_400 },
          { type: 'demand', need: 'energy', amount: 2_600 },
          { type: 'upkeep', resource: 'money', perMinute: 30_000 },
        ],
      },
    ],
    buildLimit: [{ level: 15, max: 6 }, { level: 17, max: 10 }, { level: 19, max: 16 }],
  },

  // ---- Ressourcen / Produktion (Industrie: 3 Stufen, §7 Auftrag A) ----
  // Sägewerk: 4×4-Werksgelände (Halle, Stammlager, Verladehof).
  {
    id: 'sawmill',
    category: 'production',
    nameKey: 'building.sawmill',
    size: { w: 4, h: 4 },
    sizeClass: 'L',
    requiresRoad: true,
    unlockLevel: 2,
    cost: { money: 11_000 },
    // First sawmill is free (§3): the wood loop starts the moment it unlocks.
    firstBuildDiscount: 1,
    constructionSec: 30,
    xpReward: 15,
    canRelocate: true,
    relocationCost: { money: 5_000 },
    effects: [
      { type: 'produce', resource: 'wood', perMinute: 45 },
      { type: 'jobs', amount: 4 },
      { type: 'revenue', category: 'industrial', perMinute: 600 },
      { type: 'upkeep', resource: 'money', perMinute: 300 },
      { type: 'demand', need: 'energy', amount: 8 },
      { type: 'ambience', amount: -1, radius: 4 },
    ],
    // Kette: Sägewerk → Großsägewerk (L7) → Holzkombinat (L12). Drei markante
    // Stufen statt vieler kleiner — jede füllt das Gelände sichtbar weiter.
    upgrades: [
      {
        cost: { money: 220_000, wood: 160, stone: 130, planks: 50 },
        constructionSec: 240,
        xpReward: 45,
        unlockLevel: 7,
        nameKey: 'building.sawmill.2', // Großsägewerk
        effects: [
          { type: 'produce', resource: 'wood', perMinute: 100 },
          { type: 'jobs', amount: 7 },
          { type: 'revenue', category: 'industrial', perMinute: 1_200 },
          { type: 'upkeep', resource: 'money', perMinute: 600 },
          { type: 'demand', need: 'energy', amount: 15 },
          { type: 'ambience', amount: -1, radius: 4 },
        ],
      },
      {
        cost: { money: 1_800_000, wood: 500, stone: 450 },
        constructionSec: 480,
        xpReward: 130,
        unlockLevel: 12,
        nameKey: 'building.sawmill.3', // Holzkombinat
        effects: [
          { type: 'produce', resource: 'wood', perMinute: 260 },
          { type: 'jobs', amount: 13 },
          { type: 'revenue', category: 'industrial', perMinute: 2_900 },
          { type: 'upkeep', resource: 'money', perMinute: 1_500 },
          { type: 'demand', need: 'energy', amount: 36 },
          { type: 'ambience', amount: -2, radius: 6 },
        ],
      },
    ],
    // § Active Operations 2.0 (Referenzschnitt): Das Sägewerk erzeugt Holz NICHT
    // mehr passiv (der `produce`-Effekt oben wird für Betriebe mit diesem Profil
    // abgeschaltet). Stattdessen fällen Arbeiter markierte Bäume und lagern das
    // Holz ins lokale Betriebslager. Höhere Stufen = mehr Arbeiter, Tempo,
    // Traglast, Lager. Werte sind Startbalance und werden auf Zielhardware
    // feinjustiert (docs/agents/ACTIVE_OPERATIONS_PLAN.md §4).
    operation: {
      resource: 'wood',
      nodeType: 'tree',
      efficientRadius: 8,
      maxRadius: 14,
      stages: [
        // § 12.1 §3 — KALIBRIERUNG NACHGEHOLT. Gemessen lieferte Stufe 1 nur
        // 13,5 Holz/min gegen die frühere Passivrate von 45 (Stufe 2 traf sie mit
        // 44,1). Steinbruch (38 Stein/min) und Farm (260 Nahrung/min) sind seit
        // §A6/A7 auf ihre Passivrate kalibriert — das Sägewerk war es nie, und
        // genau das war im Spieltest als „Holzproduktion viel zu langsam" spürbar.
        //
        // Die Stufen bleiben das, was §3 verlangt: nicht „+X/min", sondern bessere
        // Infrastruktur — mehr Arbeiter, schnellere Wege, besseres Werkzeug,
        // größere Traglast, mehr Lager und ein WEITERES Arbeitsgebiet. Der
        // wachsende Radius fehlte dem Sägewerk als einzigem Betrieb.
        { workerSlots: 3, movementSpeed: 12, workSpeed: 55, carryCapacity: 20, storageCapacity: 200 },
        { workerSlots: 5, movementSpeed: 14, workSpeed: 75, carryCapacity: 30, storageCapacity: 460, efficientRadius: 10, maxRadius: 17 },
        { workerSlots: 7, movementSpeed: 15, workSpeed: 90, carryCapacity: 38, storageCapacity: 1_100, efficientRadius: 12, maxRadius: 20 },
      ],
    },
    locationBonus: { terrain: 'forest', radius: 3, perTilePct: 5, maxPct: 50 },
    buildLimit: [{ level: 2, max: 2 }, { level: 5, max: 3 }, { level: 8, max: 5 }],
  },
  // § Wirtschafts-/Lieferketten-Overhaul §1 — DIE KLEINE STEINGRUBE.
  //
  // Gemessener Ist-Zustand vor diesem Eintrag: Der Deadlock „Stein braucht
  // Stein" gibt es seit D-055 nicht mehr — `stone_pit` öffnet auf L2, der erste
  // ist gratis, und die erste Steinkosten-Stelle ist das Wohnhaus-Upgrade auf
  // **L3** (25 Stein). Der Riegel ist also nicht die Kette, sondern die **Form**:
  // eine 3×3-Grube mit Straßenzwang und 60 Holz Baukosten — genau dem gesamten
  // Startvorrat — auf einer Insel, deren Startregion 1.039 Gras- gegen 46
  // Bergkacheln hat. Wer sich bei der Stadtgründung verplant, hat keinen Platz
  // und keine Ausweichfläche.
  //
  // Die kleine Steingrube ist deshalb bewusst das ANSPRUCHSLOSESTE Gebäude des
  // Spiels: 1×1, ab Level 1, **ohne Straßenanschluss** und **ohne Materialkosten**.
  // Sie kann damit an keiner Voraussetzung scheitern — ein Einstieg, der eine
  // Bedingung hat, ist kein Einstieg. Ihr Preis dafür ist die Rate: 4 Stein/min
  // sind ein Zehntel des Steinbruchs; drei Gruben (Baugrenze) ersetzen nicht
  // einmal die alte Steingrube. Wer Stein in Mengen will, erschließt weiterhin
  // ein Bergrevier (§7 Gameplay vor Bequemlichkeit).
  {
    id: 'stone_pit_small',
    category: 'production',
    nameKey: 'building.stone_pit_small',
    size: { w: 1, h: 1 },
    sizeClass: 'XS',
    // KEIN Straßenzwang: Der Einstieg darf nicht an der Infrastruktur hängen,
    // die er erst finanziert. Sie produziert passiv in den Pool und braucht
    // dafür keine Logistik (anders als die Werkstätten, §4).
    requiresRoad: false,
    unlockLevel: 1,
    // Nur Geld — der Startvorrat Holz (60) gehört dem ersten Wohnhaus.
    cost: { money: 1_800 },
    firstBuildDiscount: 1,
    constructionSec: 10,
    xpReward: 6,
    canRelocate: true,
    effects: [
      { type: 'produce', resource: 'stone', perMinute: 4 },
      { type: 'jobs', amount: 1 },
      { type: 'upkeep', resource: 'money', perMinute: 30 },
    ],
    // Keine Ausbaustufe: Diese Grube soll NICHT mitwachsen. Sie ist der
    // Anfang, nicht der Weg.
    buildLimit: [{ level: 1, max: 3 }, { level: 5, max: 5 }],
  },
  // Steinbruch: 5×5-Abbaugelände (Bruchkante, Förderband, Halden).
  {
    // § Frühspiel-Audit (02.08.2026): DIE EINSTIEGSQUELLE FÜR STEIN.
    //
    // Gemessener Befund: Die Startregion hat 46 Bergkacheln — der Steinbruch
    // braucht `rock`-Knoten auf `mountain`, findet dort also höchstens ~18
    // Knoten und läuft danach für immer leer (Fels wächst nicht nach). Ohne
    // eigenes Bergterrain war Stein damit an eine Regionsfreischaltung geknüpft,
    // während Lagerhaus (L6), Depot (L7) und Feuerwache (L8) ihn voraussetzen.
    //
    // Die Steingrube löst das nicht durch mehr Berge, sondern durch eine
    // ZWEITE, schwächere Quelle ohne Terrainbindung: oberirdisches Lesegestein,
    // von Hand gesammelt. Sie kostet Holz und Arbeit, aber KEINEN Stein — der
    // Einstieg darf nie das voraussetzen, was er erst ermöglicht. Ihre Rate ist
    // bewusst ein Drittel des Steinbruchs: sie hält die Stadt am Leben, ersetzt
    // aber kein echtes Steinrevier (§7 Gameplay vor Bequemlichkeit).
    id: 'stone_pit',
    category: 'production',
    nameKey: 'building.stone_pit',
    size: { w: 3, h: 3 },
    sizeClass: 'M',
    requiresRoad: true,
    unlockLevel: 2,
    cost: { money: 9_000, wood: 60 },
    firstBuildDiscount: 1,
    constructionSec: 25,
    xpReward: 12,
    canRelocate: true,
    relocationCost: { money: 3_000 },
    effects: [
      { type: 'produce', resource: 'stone', perMinute: 13 },
      { type: 'jobs', amount: 3 },
      { type: 'revenue', category: 'industrial', perMinute: 220 },
      { type: 'upkeep', resource: 'money', perMinute: 140 },
      { type: 'ambience', amount: -1, radius: 3 },
    ],
    // Eine Stufe: die Grube wächst zur Sammelstelle, endet aber bewusst weit
    // unter dem Steinbruch — wer mehr Stein will, erschließt ein Bergrevier.
    upgrades: [
      {
        cost: { money: 46_000, wood: 120 },
        constructionSec: 90,
        xpReward: 24,
        unlockLevel: 5,
        nameKey: 'building.stone_pit.2',
        effects: [
          { type: 'produce', resource: 'stone', perMinute: 26 },
          { type: 'jobs', amount: 5 },
          { type: 'revenue', category: 'industrial', perMinute: 380 },
          { type: 'upkeep', resource: 'money', perMinute: 240 },
          { type: 'ambience', amount: -1, radius: 3 },
        ],
      },
    ],
  },
  {
    id: 'quarry',
    category: 'production',
    nameKey: 'building.quarry',
    size: { w: 5, h: 5 },
    sizeClass: 'L',
    requiresRoad: true,
    unlockLevel: 4,
    // Der Steinbruch schneidet in den Fels: er darf auf sonst gesperrtem Gebirge
    // stehen, solange es ein flaches Felsschelf ist (keine senkrechte Wand).
    buildsOnRock: { maxSlope: 2 },
    cost: { money: 45_000, wood: 120 },
    firstBuildDiscount: 0.5,
    constructionSec: 90,
    xpReward: 25,
    canRelocate: true,
    relocationCost: { money: 12_000 },
    effects: [
      { type: 'produce', resource: 'stone', perMinute: 38 },
      { type: 'jobs', amount: 6 },
      { type: 'revenue', category: 'industrial', perMinute: 1_000 },
      { type: 'upkeep', resource: 'money', perMinute: 500 },
      { type: 'demand', need: 'energy', amount: 12 },
      { type: 'ambience', amount: -2, radius: 5 },
    ],
    // Kette: Steinbruch → Tiefbruch (L8) → Bergbaukomplex (L13).
    upgrades: [
      {
        cost: { money: 300_000, wood: 120, stone: 140, cut_stone: 70 },
        constructionSec: 300,
        xpReward: 55,
        unlockLevel: 8,
        nameKey: 'building.quarry.2', // Tiefbruch
        effects: [
          { type: 'produce', resource: 'stone', perMinute: 80 },
          { type: 'jobs', amount: 9 },
          { type: 'revenue', category: 'industrial', perMinute: 1_800 },
          { type: 'upkeep', resource: 'money', perMinute: 900 },
          { type: 'demand', need: 'energy', amount: 20 },
          { type: 'ambience', amount: -2, radius: 5 },
        ],
      },
      {
        cost: { money: 2_600_000, wood: 550, stone: 650 },
        constructionSec: 540,
        xpReward: 150,
        unlockLevel: 13,
        nameKey: 'building.quarry.3', // Bergbaukomplex
        effects: [
          { type: 'produce', resource: 'stone', perMinute: 210 },
          { type: 'jobs', amount: 17 },
          { type: 'revenue', category: 'industrial', perMinute: 4_400 },
          { type: 'upkeep', resource: 'money', perMinute: 2_400 },
          { type: 'demand', need: 'energy', amount: 48 },
          { type: 'ambience', amount: -4, radius: 7 },
        ],
      },
    ],
    // § Active Operations 2.0 / A6: Der Steinbruch erzeugt Stein NICHT mehr passiv.
    // Arbeiter brechen Fels an echten Vorkommen (Gebirgskacheln) und tragen ihn ins
    // lokale Betriebslager. Entscheidender Unterschied zum Sägewerk: **Fels wächst
    // nicht nach** (`rock`-Knotenprofil ohne `regenerationMs`). Ein Bruch läuft
    // irgendwann leer und muss versetzt werden — das ist eine Entscheidung des
    // Spielers und bleibt deshalb bewusst manuell (D-039).
    //
    // Kalibrierung: Die Stufenwerte sind so gewählt, dass ein Steinbruch am Fels
    // ungefähr seine frühere Passivrate erreicht (38/80/210 Stein pro Minute bei
    // mittlerer Zielentfernung) — die Umstellung darf die Progression nicht kippen.
    // Ein schlecht platzierter Bruch liegt darunter, ein sehr guter darüber (§12).
    operation: {
      resource: 'stone',
      nodeType: 'rock',
      efficientRadius: 8,
      maxRadius: 13,
      stages: [
        { workerSlots: 3, movementSpeed: 9, workSpeed: 26, carryCapacity: 30, storageCapacity: 200 },
        { workerSlots: 5, movementSpeed: 11, workSpeed: 36, carryCapacity: 42, storageCapacity: 480, efficientRadius: 10, maxRadius: 15 },
        { workerSlots: 7, movementSpeed: 15, workSpeed: 65, carryCapacity: 65, storageCapacity: 1_100, efficientRadius: 12, maxRadius: 18 },
      ],
    },
    // Mountains matter (§12): a quarry hugging the rock face gets a big, visible
    // stone bonus — the strategic pull toward the Gebirgs-Regionen. Seit A6 wirkt
    // der Bonus auf Arbeits- und Laufgeschwindigkeit statt auf eine Passivrate.
    locationBonus: { terrain: 'mountain', radius: 3, perTilePct: 10, maxPct: 70 },
    buildLimit: [{ level: 4, max: 2 }, { level: 7, max: 3 }, { level: 10, max: 4 }],
  },
  // Bauernhof: 6×6-Hofanlage — Felder, Scheune, Hof; wächst in A7 sichtbar mit
  // Zäunen, Silos und Tieren (§ Welt 2.0 Landwirtschaft).
  {
    id: 'farm',
    category: 'production',
    nameKey: 'building.farm',
    size: { w: 6, h: 6 },
    sizeClass: 'XL',
    requiresRoad: true,
    unlockLevel: 4,
    cost: { money: 28_000, wood: 80 },
    firstBuildDiscount: 1,
    constructionSec: 60,
    xpReward: 20,
    canRelocate: true,
    relocationCost: { money: 8_000 },
    effects: [
      // Größere Hofanlage = mehr Grundertrag als die alte 3×3-Farm.
      { type: 'produce', resource: 'food', perMinute: 260 },
      { type: 'jobs', amount: 14 },
      { type: 'revenue', category: 'industrial', perMinute: 800 },
      { type: 'upkeep', resource: 'money', perMinute: 550 },
      { type: 'demand', need: 'energy', amount: 10 },
      { type: 'ambience', amount: -1, radius: 3 },
    ],
    // Kette: Bauernhof → Großfarm (L8) → Agrarkomplex (L13). Spätere Stufen
    // TRINKEN: echte Wasser-Nachfrage — Nahrung skalieren heißt Wasser skalieren.
    upgrades: [
      {
        cost: { money: 320_000, wood: 150, stone: 130, planks: 70 },
        constructionSec: 300,
        xpReward: 55,
        unlockLevel: 8,
        nameKey: 'building.farm.2', // Großfarm
        effects: [
          { type: 'produce', resource: 'food', perMinute: 500 },
          { type: 'jobs', amount: 18 },
          { type: 'revenue', category: 'industrial', perMinute: 1_300 },
          { type: 'upkeep', resource: 'money', perMinute: 900 },
          { type: 'demand', need: 'energy', amount: 18 },
          { type: 'demand', need: 'water', amount: 45 },
          { type: 'ambience', amount: -1, radius: 3 },
        ],
      },
      {
        cost: { money: 2_400_000, wood: 480, stone: 480 },
        constructionSec: 540,
        xpReward: 140,
        unlockLevel: 13,
        nameKey: 'building.farm.3', // Agrarkomplex
        effects: [
          { type: 'produce', resource: 'food', perMinute: 1_100 },
          { type: 'jobs', amount: 28 },
          { type: 'revenue', category: 'industrial', perMinute: 2_900 },
          { type: 'upkeep', resource: 'money', perMinute: 2_300 },
          { type: 'demand', need: 'energy', amount: 40 },
          { type: 'demand', need: 'water', amount: 120 },
          { type: 'ambience', amount: -2, radius: 4 },
        ],
      },
    ],
    // § Active Operations 2.0 / A7: Die Farm erzeugt Nahrung NICHT mehr passiv.
    // Landarbeiter bewirtschaften echte Felder (fruchtbare Kacheln) und fahren die
    // Ernte in die Scheune. Der „Feld-Lebenszyklus" ist bewusst KEIN zweites
    // System (§2): Aussaat/Wachstum/Ernte fallen mit der vorhandenen
    // Knoten-Regeneration zusammen (`crop` wächst in 10 Minuten nach).
    //
    // Kalibrierung wie beim Steinbruch auf die frühere Passivrate (260/500/1.100
    // Nahrung pro Minute). Höhere Stufen bewirtschaften zusätzlich **mehr Land**
    // (Stufen-Radien) — sonst wäre ein Agrarkomplex durch die Feldzahl statt durch
    // seine Arbeiter begrenzt.
    operation: {
      resource: 'food',
      nodeType: 'crop',
      efficientRadius: 6,
      maxRadius: 10,
      stages: [
        { workerSlots: 6, movementSpeed: 14, workSpeed: 95, carryCapacity: 65, storageCapacity: 700 },
        { workerSlots: 8, movementSpeed: 16, workSpeed: 130, carryCapacity: 85, storageCapacity: 1_600, efficientRadius: 9, maxRadius: 13 },
        { workerSlots: 10, movementSpeed: 20, workSpeed: 230, carryCapacity: 130, storageCapacity: 3_400, efficientRadius: 12, maxRadius: 16 },
      ],
    },
    // Fertile soil matters (§12): a farm on rich land gets a strong, visible food
    // bonus — the strategic pull toward the fruchtbaren Regionen. Seit A7 wirkt der
    // Bonus auf Arbeits- und Laufgeschwindigkeit statt auf eine Passivrate.
    locationBonus: { terrain: 'fertile', radius: 2, perTilePct: 6, maxPct: 50 },
    buildLimit: [{ level: 4, max: 2 }, { level: 6, max: 3 }, { level: 9, max: 5 }, { level: 12, max: 8 }],
  },
  // § Wirtschafts-/Lieferketten-Overhaul §4 — DIE ZWEITE VERARBEITUNGSSTUFE.
  //
  // Holzwerkstatt und Steinwerkstatt sind die ersten Gebäude des Spiels, deren
  // Ertrag NICHT am Standort hängt. Sie haben kein Arbeitsgebiet, keinen
  // Knotentyp und keinen Standortbonus — nur Eingang, Ausgang und ein
  // Verhältnis. Damit verschiebt sich die Frage von „wo steht es?" zu „wie
  // kommt der Rohstoff hin?", und genau das ist der Punkt des Auftrags.
  //
  // Kalibrierung (§6/§10): Ein Sägewerk Stufe 1 liefert ~53 Holz/min. Eine
  // Holzwerkstatt verbraucht bei voller Auslastung 2 Holz je Brett und
  // 14 Bretter/min, also 28 Holz/min — gut die Hälfte eines Sägewerks. Ein
  // Betrieb ernährt damit eine Werkstatt und behält Reserve für den Bau; wer
  // zwei Werkstätten betreibt, braucht ein zweites Sägewerk. Die Kette ist
  // spürbar, aber nicht erdrückend.
  {
    id: 'wood_workshop',
    category: 'production',
    nameKey: 'building.wood_workshop',
    size: { w: 3, h: 3 },
    sizeClass: 'M',
    // Straßenzwang ist hier KEINE Formalie, sondern die Mechanik: Ohne
    // Anschluss kommt kein Rohstoff an und nichts geht hinaus. Der Ghost warnt
    // seit D-047 vorher.
    requiresRoad: true,
    unlockLevel: 5,
    cost: { money: 38_000, wood: 90 },
    firstBuildDiscount: 0.5,
    constructionSec: 60,
    xpReward: 22,
    canRelocate: true,
    relocationCost: { money: 9_000 },
    effects: [
      { type: 'jobs', amount: 5 },
      { type: 'revenue', category: 'industrial', perMinute: 700 },
      { type: 'upkeep', resource: 'money', perMinute: 420 },
      { type: 'demand', need: 'energy', amount: 6 },
      { type: 'ambience', amount: -1, radius: 3 },
    ],
    upgrades: [
      {
        cost: { money: 210_000, wood: 180, stone: 120 },
        constructionSec: 240,
        xpReward: 48,
        unlockLevel: 8,
        nameKey: 'building.wood_workshop.2', // Holzmanufaktur
        effects: [
          { type: 'jobs', amount: 9 },
          { type: 'revenue', category: 'industrial', perMinute: 1_500 },
          { type: 'upkeep', resource: 'money', perMinute: 880 },
          { type: 'demand', need: 'energy', amount: 12 },
          { type: 'ambience', amount: -1, radius: 3 },
        ],
      },
      {
        cost: { money: 1_100_000, wood: 460, stone: 380, cut_stone: 120 },
        constructionSec: 420,
        xpReward: 120,
        unlockLevel: 13,
        nameKey: 'building.wood_workshop.3', // Holzwerk
        effects: [
          { type: 'jobs', amount: 16 },
          { type: 'revenue', category: 'industrial', perMinute: 3_100 },
          { type: 'upkeep', resource: 'money', perMinute: 2_000 },
          { type: 'demand', need: 'energy', amount: 26 },
          { type: 'ambience', amount: -2, radius: 4 },
        ],
      },
    ],
    conversion: {
      input: 'wood',
      output: 'planks',
      // 2 Holz je Brett: Die Veredelung kostet spürbar Substanz, sonst wäre
      // „alles zu Brettern machen" immer richtig und nie eine Entscheidung.
      inputPerOutput: 2,
      stages: [
        { outputPerMinute: 14, workerSlots: 5, inputCapacity: 240, outputCapacity: 160 },
        { outputPerMinute: 34, workerSlots: 9, inputCapacity: 560, outputCapacity: 380 },
        { outputPerMinute: 78, workerSlots: 16, inputCapacity: 1_200, outputCapacity: 820 },
      ],
    },
    buildLimit: [{ level: 5, max: 1 }, { level: 8, max: 2 }, { level: 11, max: 4 }],
  },
  {
    id: 'stone_workshop',
    category: 'production',
    nameKey: 'building.stone_workshop',
    size: { w: 3, h: 3 },
    sizeClass: 'M',
    requiresRoad: true,
    unlockLevel: 5,
    cost: { money: 42_000, wood: 70, stone: 60 },
    firstBuildDiscount: 0.5,
    constructionSec: 70,
    xpReward: 24,
    canRelocate: true,
    relocationCost: { money: 10_000 },
    effects: [
      { type: 'jobs', amount: 5 },
      { type: 'revenue', category: 'industrial', perMinute: 780 },
      { type: 'upkeep', resource: 'money', perMinute: 470 },
      { type: 'demand', need: 'energy', amount: 7 },
      { type: 'ambience', amount: -2, radius: 3 },
    ],
    upgrades: [
      {
        cost: { money: 240_000, wood: 140, stone: 180 },
        constructionSec: 260,
        xpReward: 52,
        unlockLevel: 8,
        nameKey: 'building.stone_workshop.2', // Steinmetzerei
        effects: [
          { type: 'jobs', amount: 9 },
          { type: 'revenue', category: 'industrial', perMinute: 1_650 },
          { type: 'upkeep', resource: 'money', perMinute: 960 },
          { type: 'demand', need: 'energy', amount: 14 },
          { type: 'ambience', amount: -2, radius: 3 },
        ],
      },
      {
        cost: { money: 1_300_000, wood: 380, stone: 520, planks: 140 },
        constructionSec: 440,
        xpReward: 130,
        unlockLevel: 13,
        nameKey: 'building.stone_workshop.3', // Steinwerk
        effects: [
          { type: 'jobs', amount: 16 },
          { type: 'revenue', category: 'industrial', perMinute: 3_300 },
          { type: 'upkeep', resource: 'money', perMinute: 2_200 },
          { type: 'demand', need: 'energy', amount: 28 },
          { type: 'ambience', amount: -3, radius: 4 },
        ],
      },
    ],
    conversion: {
      input: 'stone',
      output: 'cut_stone',
      // 2,5 Stein je Werkstein — Stein ist die knappere Ware (er wächst nie
      // nach), Werkstein deshalb bewusst teurer als das Brett.
      inputPerOutput: 2.5,
      stages: [
        { outputPerMinute: 9, workerSlots: 5, inputCapacity: 260, outputCapacity: 150 },
        { outputPerMinute: 22, workerSlots: 9, inputCapacity: 600, outputCapacity: 360 },
        { outputPerMinute: 52, workerSlots: 16, inputCapacity: 1_300, outputCapacity: 780 },
      ],
    },
    buildLimit: [{ level: 5, max: 1 }, { level: 8, max: 2 }, { level: 11, max: 4 }],
  },
  {
    id: 'well',
    category: 'services',
    nameKey: 'building.well',
    size: { w: 1, h: 1 },
    sizeClass: 'XS',
    requiresRoad: false,
    unlockLevel: 3,
    cost: { money: 6_500, wood: 10 },
    firstBuildDiscount: 1,
    constructionSec: 15,
    xpReward: 12,
    canRelocate: true,
    effects: [
      { type: 'capacity', need: 'water', amount: 120, radius: 9 },
      { type: 'upkeep', resource: 'money', perMinute: 100 },
    ],
    upgrades: [
      {
        cost: { money: 22_000, wood: 30, stone: 20 },
        constructionSec: 60,
        xpReward: 16,
        unlockLevel: 6,
        nameKey: 'building.well.2', // Tiefbrunnen
        effects: [
          { type: 'capacity', need: 'water', amount: 220, radius: 11 },
          { type: 'upkeep', resource: 'money', perMinute: 170 },
        ],
      },
    ],
  },
  // Wasserpumpe: 3×3-Pumpwerk mit Becken — Versorgung: 2 markante Stufen.
  {
    id: 'water_pump',
    category: 'services',
    nameKey: 'building.water_pump',
    size: { w: 3, h: 3 },
    sizeClass: 'M',
    requiresRoad: true,
    unlockLevel: 7,
    cost: { money: 130_000, stone: 150 },
    constructionSec: 180,
    xpReward: 50,
    canRelocate: true,
    relocationCost: { money: 15_000 },
    effects: [
      { type: 'capacity', need: 'water', amount: 1_800, radius: 18 },
      { type: 'jobs', amount: 6 },
      { type: 'upkeep', resource: 'money', perMinute: 1_600 },
      { type: 'demand', need: 'energy', amount: 30 },
    ],
    // Kette: Wasserpumpe → Pumpwerk (L11; bündelt die alten Stufen 2+3).
    upgrades: [
      {
        cost: { money: 420_000, stone: 420 },
        constructionSec: 300,
        xpReward: 75,
        unlockLevel: 11,
        nameKey: 'building.water_pump.2', // Pumpwerk
        effects: [
          { type: 'capacity', need: 'water', amount: 3_800, radius: 21 },
          { type: 'jobs', amount: 12 },
          { type: 'upkeep', resource: 'money', perMinute: 3_000 },
          { type: 'demand', need: 'energy', amount: 60 },
        ],
      },
    ],
    buildLimit: [{ level: 7, max: 2 }, { level: 9, max: 3 }, { level: 11, max: 5 }, { level: 13, max: 8 }],
  },
  // Lagerhaus: 4×4-Logistikhof (Halle, Rampe, Stellflächen) — „Lagerhäuser
  // größer" (§ Auftrag A).
  {
    id: 'warehouse',
    category: 'production',
    nameKey: 'building.warehouse',
    size: { w: 4, h: 4 },
    sizeClass: 'L',
    requiresRoad: true,
    unlockLevel: 6,
    cost: { money: 95_000, wood: 160, stone: 100 },
    constructionSec: 120,
    xpReward: 18,
    costScaling: 1.4,
    firstBuildDiscount: 0.5,
    effects: [
      { type: 'storage', resource: 'wood', amount: 1_000 },
      { type: 'storage', resource: 'stone', amount: 1_000 },
      { type: 'storage', resource: 'food', amount: 4_000 },
      { type: 'storage', resource: 'freshwater', amount: 4_000 },
      { type: 'storage', resource: 'planks', amount: 900 },
      { type: 'storage', resource: 'cut_stone', amount: 900 },
      { type: 'jobs', amount: 3 },
      { type: 'upkeep', resource: 'money', perMinute: 350 },
      { type: 'demand', need: 'energy', amount: 5 },
    ],
    // Kette: Lagerhaus → Hochregallager (L10).
    upgrades: [
      {
        cost: { money: 260_000, wood: 200, stone: 150, planks: 110, cut_stone: 90 },
        constructionSec: 180,
        xpReward: 30,
        unlockLevel: 10,
        nameKey: 'building.warehouse.2', // Hochregallager
        effects: [
          { type: 'storage', resource: 'wood', amount: 1_800 },
          { type: 'storage', resource: 'stone', amount: 1_800 },
          { type: 'storage', resource: 'food', amount: 7_000 },
          { type: 'storage', resource: 'freshwater', amount: 7_000 },
          { type: 'storage', resource: 'planks', amount: 1_600 },
          { type: 'storage', resource: 'cut_stone', amount: 1_600 },
          { type: 'jobs', amount: 5 },
          { type: 'upkeep', resource: 'money', perMinute: 650 },
          { type: 'demand', need: 'energy', amount: 8 },
        ],
      },
    ],
    buildLimit: [{ level: 6, max: 3 }, { level: 8, max: 6 }, { level: 10, max: 10 }],
  },
  // Logistikzentrum: 5×5-Areal (Hallen, Verladehof, Fuhrpark).
  {
    id: 'depot',
    category: 'production',
    nameKey: 'building.depot',
    size: { w: 5, h: 5 },
    sizeClass: 'L',
    requiresRoad: true,
    unlockLevel: 7,
    cost: { money: 210_000, wood: 150, stone: 200, planks: 60 },
    constructionSec: 240,
    xpReward: 55,
    effects: [
      { type: 'logistics', boostPct: 25, radius: 6 },
      { type: 'jobs', amount: 9 },
      { type: 'upkeep', resource: 'money', perMinute: 1_500 },
      { type: 'demand', need: 'energy', amount: 12 },
    ],
    // Kette: Logistikzentrum → Logistikhub (L14): stärkerer Boost, mehr Reichweite.
    upgrades: [
      {
        cost: { money: 900_000, stone: 400 },
        constructionSec: 360,
        xpReward: 95,
        unlockLevel: 14,
        nameKey: 'building.depot.2', // Logistikhub
        effects: [
          { type: 'logistics', boostPct: 35, radius: 9 },
          { type: 'jobs', amount: 14 },
          { type: 'upkeep', resource: 'money', perMinute: 2_800 },
          { type: 'demand', need: 'energy', amount: 20 },
        ],
      },
    ],
    buildLimit: [{ level: 7, max: 1 }, { level: 9, max: 2 }, { level: 10, max: 3 }],
  },
  // Wasseraufbereitung: 5×5-Werk am Fluss (Klärbecken, Pumpenhaus).
  {
    id: 'waterworks',
    category: 'production',
    nameKey: 'building.waterworks',
    size: { w: 5, h: 5 },
    sizeClass: 'L',
    requiresRoad: true,
    unlockLevel: 11,
    cost: { money: 280_000, wood: 90, stone: 220 },
    constructionSec: 240,
    xpReward: 65,
    adjacentTerrain: 'river',
    canRelocate: true,
    relocationCost: { money: 25_000 },
    effects: [
      { type: 'produce', resource: 'freshwater', perMinute: 400 },
      { type: 'storage', resource: 'freshwater', amount: 6_000 },
      { type: 'jobs', amount: 10 },
      { type: 'revenue', category: 'industrial', perMinute: 900 },
      { type: 'upkeep', resource: 'money', perMinute: 1_100 },
      { type: 'demand', need: 'energy', amount: 30 },
    ],
    // Kette: Wasseraufbereitung → Klärwerk (L14).
    upgrades: [
      {
        cost: { money: 800_000, stone: 450 },
        constructionSec: 360,
        xpReward: 110,
        unlockLevel: 14,
        nameKey: 'building.waterworks.2', // Klärwerk
        effects: [
          { type: 'produce', resource: 'freshwater', perMinute: 700 },
          { type: 'storage', resource: 'freshwater', amount: 10_000 },
          { type: 'jobs', amount: 16 },
          { type: 'revenue', category: 'industrial', perMinute: 1_500 },
          { type: 'upkeep', resource: 'money', perMinute: 1_900 },
          { type: 'demand', need: 'energy', amount: 50 },
        ],
      },
    ],
    buildLimit: [{ level: 11, max: 2 }, { level: 13, max: 3 }, { level: 15, max: 5 }],
  },

  // ---- Versorgung / Geschäfte (2 Stufen, §7 Auftrag A) ----
  // Markt: 3×3-Marktplatz mit Ständen.
  {
    id: 'market',
    category: 'services',
    nameKey: 'building.market',
    size: { w: 3, h: 3 },
    sizeClass: 'M',
    requiresRoad: true,
    unlockLevel: 5,
    cost: { money: 55_000, wood: 90 },
    firstBuildDiscount: 0.5,
    constructionSec: 90,
    xpReward: 45,
    canRelocate: true,
    relocationCost: { money: 8_000 },
    effects: [
      { type: 'distribution', need: 'food', radius: 14 },
      { type: 'jobs', amount: 20 },
      { type: 'revenue', category: 'commercial', perMinute: 2_000 },
      { type: 'upkeep', resource: 'money', perMinute: 900 },
      { type: 'demand', need: 'energy', amount: 8 },
    ],
    // Kette: Markt → Markthalle (L9).
    upgrades: [
      {
        cost: { money: 160_000, wood: 150, stone: 90 },
        constructionSec: 180,
        xpReward: 55,
        unlockLevel: 9,
        nameKey: 'building.market.2', // Markthalle
        effects: [
          { type: 'distribution', need: 'food', radius: 18 },
          { type: 'jobs', amount: 34 },
          { type: 'revenue', category: 'commercial', perMinute: 3_400 },
          { type: 'upkeep', resource: 'money', perMinute: 1_500 },
          { type: 'demand', need: 'energy', amount: 12 },
        ],
      },
    ],
    buildLimit: [{ level: 5, max: 2 }, { level: 8, max: 3 }, { level: 10, max: 4 }],
  },
  // Supermarkt: 4×4 mit Parkplatz und Anlieferung.
  {
    id: 'supermarket',
    category: 'services',
    nameKey: 'building.supermarket',
    size: { w: 4, h: 4 },
    sizeClass: 'L',
    requiresRoad: true,
    unlockLevel: 12,
    cost: { money: 380_000, wood: 140, stone: 200 },
    constructionSec: 300,
    xpReward: 80,
    canRelocate: true,
    relocationCost: { money: 30_000 },
    effects: [
      { type: 'distribution', need: 'food', radius: 16 },
      { type: 'distribution', need: 'freshwater', radius: 16 },
      { type: 'storage', resource: 'freshwater', amount: 3_000 },
      { type: 'jobs', amount: 60 },
      { type: 'revenue', category: 'commercial', perMinute: 3_500 },
      { type: 'upkeep', resource: 'money', perMinute: 1_100 },
      { type: 'demand', need: 'energy', amount: 12 },
    ],
    // Kette: Supermarkt → Einkaufszentrum (L15).
    upgrades: [
      {
        cost: { money: 950_000, wood: 180, stone: 320 },
        constructionSec: 420,
        xpReward: 130,
        unlockLevel: 15,
        nameKey: 'building.supermarket.2', // Einkaufszentrum
        effects: [
          { type: 'distribution', need: 'food', radius: 20 },
          { type: 'distribution', need: 'freshwater', radius: 20 },
          { type: 'storage', resource: 'freshwater', amount: 5_000 },
          { type: 'jobs', amount: 110 },
          { type: 'revenue', category: 'commercial', perMinute: 6_500 },
          { type: 'upkeep', resource: 'money', perMinute: 2_000 },
          { type: 'demand', need: 'energy', amount: 22 },
        ],
      },
    ],
    buildLimit: [{ level: 12, max: 2 }, { level: 14, max: 4 }],
  },
  {
    id: 'bakery',
    category: 'services',
    nameKey: 'building.bakery',
    size: { w: 2, h: 2 },
    sizeClass: 'S',
    requiresRoad: true,
    unlockLevel: 9,
    cost: { money: 130_000, wood: 110, stone: 90 },
    constructionSec: 240,
    xpReward: 40,
    effects: [
      { type: 'produce', resource: 'food', perMinute: 90 },
      { type: 'jobs', amount: 12 },
      { type: 'revenue', category: 'industrial', perMinute: 1_200 },
      { type: 'upkeep', resource: 'money', perMinute: 700 },
      { type: 'demand', need: 'energy', amount: 8 },
    ],
    // Kette: Bäckerei → Großbäckerei (L12).
    upgrades: [
      {
        cost: { money: 320_000, wood: 150, stone: 120 },
        constructionSec: 300,
        xpReward: 60,
        unlockLevel: 12,
        nameKey: 'building.bakery.2', // Großbäckerei
        effects: [
          { type: 'produce', resource: 'food', perMinute: 180 },
          { type: 'jobs', amount: 20 },
          { type: 'revenue', category: 'industrial', perMinute: 2_200 },
          { type: 'upkeep', resource: 'money', perMinute: 1_200 },
          { type: 'demand', need: 'energy', amount: 14 },
        ],
      },
    ],
    buildLimit: [{ level: 9, max: 2 }, { level: 12, max: 4 }],
  },
  // Feuerwehr: 5×5-Wache mit Vorplatz, Garagen, Fahrzeughof und Grünstreifen —
  // das Modell soll die komplette Fläche sinnvoll füllen (§ Auftrag A Beispiel).
  {
    id: 'fire_station',
    category: 'services',
    nameKey: 'building.fire_station',
    size: { w: 5, h: 5 },
    sizeClass: 'L',
    requiresRoad: true,
    unlockLevel: 8,
    cost: { money: 280_000, wood: 160, stone: 220, cut_stone: 60 },
    constructionSec: 360,
    xpReward: 85,
    canRelocate: true,
    relocationCost: { money: 20_000 },
    effects: [
      { type: 'protection', hazard: 'fire', radius: 18 },
      { type: 'jobs', amount: 16 },
      { type: 'upkeep', resource: 'money', perMinute: 1_700 },
      { type: 'demand', need: 'energy', amount: 10 },
    ],
    // Kette: Kleine Wache → Stadtfeuerwehr (L11) → Einsatzzentrum (L16).
    upgrades: [
      {
        cost: { money: 340_000, wood: 180, stone: 260 },
        constructionSec: 300,
        xpReward: 95,
        unlockLevel: 11,
        nameKey: 'building.fire_station.2', // Stadtfeuerwehr
        effects: [
          { type: 'protection', hazard: 'fire', radius: 24 },
          { type: 'jobs', amount: 28 },
          { type: 'upkeep', resource: 'money', perMinute: 2_800 },
          { type: 'demand', need: 'energy', amount: 14 },
        ],
      },
      {
        cost: { money: 1_400_000, stone: 600 },
        constructionSec: 420,
        xpReward: 160,
        unlockLevel: 16,
        nameKey: 'building.fire_station.3', // Einsatzzentrum
        effects: [
          { type: 'protection', hazard: 'fire', radius: 32 },
          { type: 'jobs', amount: 44 },
          { type: 'upkeep', resource: 'money', perMinute: 4_500 },
          { type: 'demand', need: 'energy', amount: 24 },
        ],
      },
    ],
    buildLimit: [{ level: 8, max: 2 }, { level: 10, max: 3 }, { level: 13, max: 5 }],
  },
  // Polizei: 4×4-Revier mit Hof und Stellplätzen.
  {
    id: 'police_station',
    category: 'services',
    nameKey: 'building.police_station',
    size: { w: 4, h: 4 },
    sizeClass: 'L',
    requiresRoad: true,
    unlockLevel: 13,
    cost: { money: 560_000, wood: 120, stone: 300 },
    constructionSec: 360,
    xpReward: 95,
    canRelocate: true,
    relocationCost: { money: 40_000 },
    effects: [
      { type: 'coverage', need: 'safety', radius: 16, capacity: 8_000 },
      { type: 'jobs', amount: 30 },
      { type: 'upkeep', resource: 'money', perMinute: 1_900 },
      { type: 'demand', need: 'energy', amount: 12 },
    ],
    // Kette: Polizeiwache → Revier (L14) → Polizeipräsidium (L17).
    upgrades: [
      {
        cost: { money: 900_000, stone: 420 },
        constructionSec: 420,
        xpReward: 120,
        unlockLevel: 14,
        nameKey: 'building.police_station.2', // Revier
        effects: [
          { type: 'coverage', need: 'safety', radius: 18, capacity: 14_000 },
          { type: 'jobs', amount: 46 },
          { type: 'upkeep', resource: 'money', perMinute: 2_900 },
          { type: 'demand', need: 'energy', amount: 18 },
        ],
      },
      {
        cost: { money: 2_400_000, stone: 700 },
        constructionSec: 540,
        xpReward: 190,
        unlockLevel: 17,
        nameKey: 'building.police_station.3', // Polizeipräsidium
        effects: [
          { type: 'coverage', need: 'safety', radius: 22, capacity: 26_000 },
          { type: 'jobs', amount: 70 },
          { type: 'upkeep', resource: 'money', perMinute: 4_400 },
          { type: 'demand', need: 'energy', amount: 28 },
        ],
      },
    ],
    buildLimit: [{ level: 13, max: 2 }, { level: 15, max: 4 }],
  },
  // Krankenhaus: 6×6-Campus (Haupthaus, Nebenflügel, Zufahrt, Grün) — „deutlich
  // größer" (§ Auftrag A).
  {
    id: 'hospital',
    category: 'services',
    nameKey: 'building.hospital',
    size: { w: 6, h: 6 },
    sizeClass: 'XL',
    requiresRoad: true,
    unlockLevel: 14,
    cost: { money: 2_200_000, wood: 240, stone: 560 },
    constructionSec: 600,
    xpReward: 140,
    canRelocate: true,
    relocationCost: { money: 120_000 },
    effects: [
      { type: 'coverage', need: 'health', radius: 18, capacity: 15_000 },
      { type: 'jobs', amount: 80 },
      { type: 'upkeep', resource: 'money', perMinute: 3_200 },
      { type: 'demand', need: 'energy', amount: 25 },
    ],
    // Kette: Klinik → Krankenhaus (L16) → Universitätsklinikum (L19).
    upgrades: [
      {
        cost: { money: 4_500_000, wood: 320, stone: 850 },
        constructionSec: 720,
        xpReward: 220,
        unlockLevel: 16,
        nameKey: 'building.hospital.2', // Krankenhaus
        effects: [
          { type: 'coverage', need: 'health', radius: 20, capacity: 26_000 },
          { type: 'jobs', amount: 130 },
          { type: 'upkeep', resource: 'money', perMinute: 5_200 },
          { type: 'demand', need: 'energy', amount: 40 },
        ],
      },
      {
        cost: { money: 9_000_000, wood: 500, stone: 1_400 },
        constructionSec: 840,
        xpReward: 340,
        unlockLevel: 19,
        nameKey: 'building.hospital.3', // Universitätsklinikum
        effects: [
          { type: 'coverage', need: 'health', radius: 24, capacity: 45_000 },
          { type: 'jobs', amount: 220 },
          { type: 'upkeep', resource: 'money', perMinute: 8_200 },
          { type: 'demand', need: 'energy', amount: 70 },
        ],
      },
    ],
    buildLimit: [{ level: 14, max: 2 }, { level: 16, max: 3 }],
  },

  // ---- Wirtschaft ----
  // Handelskontor: 3×3 mit Hof und Waage.
  {
    id: 'trading_post',
    category: 'economy',
    nameKey: 'building.trading_post',
    size: { w: 3, h: 3 },
    sizeClass: 'M',
    requiresRoad: true,
    unlockLevel: 5,
    cost: { money: 42_000, wood: 65 },
    constructionSec: 90,
    xpReward: 30,
    tradePost: true,
    canRelocate: true,
    relocationCost: { money: 6_000 },
    effects: [
      { type: 'jobs', amount: 8 },
      { type: 'revenue', category: 'commercial', perMinute: 800 },
      { type: 'upkeep', resource: 'money', perMinute: 250 },
    ],
    upgrades: [
      {
        cost: { money: 180_000, wood: 120, stone: 100 },
        constructionSec: 180,
        xpReward: 45,
        unlockLevel: 9,
        nameKey: 'building.trading_post.2', // Rohstoffbörse (+25 % Verkaufskurs)
        effects: [
          { type: 'jobs', amount: 16 },
          { type: 'revenue', category: 'commercial', perMinute: 1_600 },
          { type: 'upkeep', resource: 'money', perMinute: 450 },
        ],
      },
      {
        cost: { money: 520_000, stone: 260 },
        constructionSec: 300,
        xpReward: 80,
        unlockLevel: 13,
        nameKey: 'building.trading_post.3', // Exportzentrum (+50 % Verkaufskurs)
        effects: [
          { type: 'jobs', amount: 28 },
          { type: 'revenue', category: 'commercial', perMinute: 3_000 },
          { type: 'upkeep', resource: 'money', perMinute: 800 },
        ],
      },
    ],
    buildLimit: [{ level: 5, max: 1 }, { level: 9, max: 2 }, { level: 13, max: 3 }],
  },
  {
    id: 'shop_small',
    category: 'economy',
    nameKey: 'building.shop_small',
    size: { w: 2, h: 2 },
    sizeClass: 'S',
    requiresRoad: true,
    unlockLevel: 6,
    cost: { money: 85_000, wood: 90 },
    constructionSec: 150,
    xpReward: 45,
    effects: [
      { type: 'revenue', category: 'commercial', perMinute: 4_000 },
      { type: 'jobs', amount: 40 },
      { type: 'upkeep', resource: 'money', perMinute: 1_400 },
      { type: 'demand', need: 'energy', amount: 12 },
    ],
    // Kette: Kleiner Laden → Ladenzeile (L10).
    upgrades: [
      {
        cost: { money: 260_000, wood: 140 },
        constructionSec: 240,
        xpReward: 70,
        unlockLevel: 10,
        nameKey: 'building.shop_small.2', // Ladenzeile
        effects: [
          { type: 'revenue', category: 'commercial', perMinute: 7_500 },
          { type: 'jobs', amount: 70 },
          { type: 'upkeep', resource: 'money', perMinute: 2_400 },
          { type: 'demand', need: 'energy', amount: 20 },
        ],
      },
    ],
    buildLimit: [{ level: 6, max: 2 }, { level: 9, max: 4 }, { level: 12, max: 8 }],
  },
  // Büro: 4×4-Campus — die Jobmaschine der Stadt. Kette mit 4 Stufen (§9
  // Auftrag A): Kleines Büro → Bürogebäude → Business Center → Büroturm.
  {
    id: 'office',
    category: 'economy',
    nameKey: 'building.office',
    size: { w: 4, h: 4 },
    sizeClass: 'L',
    requiresRoad: true,
    unlockLevel: 8,
    cost: { money: 850_000, wood: 260, stone: 480, planks: 120, cut_stone: 100 },
    constructionSec: 540,
    xpReward: 200,
    effects: [
      { type: 'jobs', amount: 2_000 },
      { type: 'revenue', category: 'commercial', perMinute: 18_000 },
      { type: 'upkeep', resource: 'money', perMinute: 6_000 },
      { type: 'demand', need: 'energy', amount: 120 },
    ],
    upgrades: [
      {
        cost: { money: 1_400_000, wood: 360, stone: 700 },
        constructionSec: 600,
        xpReward: 260,
        unlockLevel: 12,
        nameKey: 'building.office.2', // Bürogebäude
        effects: [
          { type: 'jobs', amount: 3_200 },
          { type: 'revenue', category: 'commercial', perMinute: 30_000 },
          { type: 'upkeep', resource: 'money', perMinute: 9_500 },
          { type: 'demand', need: 'energy', amount: 190 },
        ],
      },
      {
        cost: { money: 3_000_000, wood: 520, stone: 1_100 },
        constructionSec: 720,
        xpReward: 360,
        unlockLevel: 15,
        nameKey: 'building.office.3', // Business Center
        effects: [
          { type: 'jobs', amount: 4_600 },
          { type: 'revenue', category: 'commercial', perMinute: 44_000 },
          { type: 'upkeep', resource: 'money', perMinute: 13_500 },
          { type: 'demand', need: 'energy', amount: 270 },
        ],
      },
      {
        cost: { money: 6_500_000, wood: 700, stone: 1_800 },
        constructionSec: 840,
        xpReward: 500,
        unlockLevel: 18,
        nameKey: 'building.office.4', // Büroturm
        effects: [
          { type: 'jobs', amount: 6_500 },
          { type: 'revenue', category: 'commercial', perMinute: 62_000 },
          { type: 'upkeep', resource: 'money', perMinute: 19_000 },
          { type: 'demand', need: 'energy', amount: 380 },
        ],
      },
    ],
    buildLimit: [{ level: 8, max: 1 }, { level: 10, max: 2 }, { level: 12, max: 4 }, { level: 14, max: 7 }],
  },

  // ---- Energie ----
  // Kohlekraftwerk: 8×8 — RIESIG (§ Auftrag A), das dominante Industrie-Areal
  // der Stadt: Kesselhaus, Kühltürme, Kohlelager, Gleisanschluss.
  {
    id: 'power_plant',
    category: 'energy',
    nameKey: 'building.power_plant',
    size: { w: 8, h: 8 },
    sizeClass: 'XXL',
    requiresRoad: true,
    unlockLevel: 11,
    cost: { money: 700_000, wood: 150, stone: 450 },
    constructionSec: 480,
    xpReward: 140,
    effects: [
      { type: 'capacity', need: 'energy', amount: 5_000 },
      { type: 'jobs', amount: 30 },
      { type: 'upkeep', resource: 'money', perMinute: 4_000 },
      { type: 'ambience', amount: -4, radius: 8 },
    ],
    // Kette: Kohlekraftwerk → Großkraftwerk (L16).
    upgrades: [
      {
        cost: { money: 2_800_000, stone: 900 },
        constructionSec: 600,
        xpReward: 260,
        unlockLevel: 16,
        nameKey: 'building.power_plant.2', // Großkraftwerk
        effects: [
          { type: 'capacity', need: 'energy', amount: 9_000 },
          { type: 'jobs', amount: 50 },
          { type: 'upkeep', resource: 'money', perMinute: 6_500 },
          { type: 'ambience', amount: -5, radius: 9 },
        ],
      },
    ],
    // Wenige, riesige Anlagen: das 8×8-Areal ist selbst der Balancing-Hebel.
    buildLimit: [{ level: 11, max: 1 }, { level: 13, max: 2 }, { level: 16, max: 3 }],
  },
  // Windpark: 7×7-Feld mit mehreren Turbinen — großflächig, sauber, leiser
  // Output; skaliert über Mehrfachbau statt Stufen (Landmarken-Regel: 1 Stufe).
  {
    id: 'wind_farm',
    category: 'energy',
    nameKey: 'building.wind_farm',
    size: { w: 7, h: 7 },
    sizeClass: 'XL',
    requiresRoad: true,
    unlockLevel: 11,
    cost: { money: 450_000, wood: 100, stone: 260 },
    constructionSec: 300,
    xpReward: 85,
    effects: [
      { type: 'capacity', need: 'energy', amount: 2_200 },
      { type: 'jobs', amount: 8 },
      { type: 'upkeep', resource: 'money', perMinute: 1_100 },
      { type: 'ambience', amount: 1, radius: 5 },
    ],
    buildLimit: [{ level: 11, max: 3 }, { level: 14, max: 6 }, { level: 17, max: 9 }],
  },

  // ---- Wasser-Infrastruktur (Overhaul 7.0) ----
  // Straße ist Betriebsanforderung, aber keine Platzierungssperre. Der
  // zusätzliche Wasser-Footprint wird in buildings/placement.ts validiert.
  {
    id: 'dock_small',
    category: 'infrastructure',
    nameKey: 'building.dock_small',
    size: { w: 2, h: 2 },
    sizeClass: 'S',
    requiresRoad: true,
    infrastructureModes: ['road', 'water'],
    waterfront: {
      landWidth: 2,
      landDepth: 2,
      waterWidth: 2,
      waterDepth: 2,
      // § Modelltreue 13.0: Die Uferlinie der Quell-GLB ist zackig, nicht
      // schnurgerade — `shorelineTolerance: 0` verlangte ein perfekt
      // rechteckiges Wasserfeld bündig am Ufer und ließ inselweit nur 32
      // Anleger zu, den Flusshafen sogar an NULL Stellen. Ein Drittel der
      // Wasserzellen darf jetzt Land sein (beim Anleger also eine von vier).
      shorelineTolerance: 0.34,
      minimumWaterDepth: 0.55,
    },
    unlockLevel: 6,
    cost: { money: 95_000, wood: 140, stone: 25 },
    constructionSec: 75,
    xpReward: 35,
    effects: [
      { type: 'storage', resource: 'wood', amount: 180 },
      { type: 'storage', resource: 'food', amount: 120 },
      { type: 'jobs', amount: 5 },
      { type: 'upkeep', resource: 'money', perMinute: 420 },
    ],
    buildLimit: [{ level: 6, max: 2 }, { level: 9, max: 5 }, { level: 13, max: 10 }],
  },
  {
    id: 'river_port',
    category: 'infrastructure',
    nameKey: 'building.river_port',
    size: { w: 4, h: 4 },
    sizeClass: 'L',
    requiresRoad: true,
    infrastructureModes: ['road', 'water'],
    waterfront: {
      landWidth: 4,
      landDepth: 3,
      waterWidth: 4,
      waterDepth: 3,
      /** § Modelltreue 13.0 — siehe `dock_small`: 4 von 12 Wasserzellen dürfen
       *  Land sein, sonst ist der Flusshafen auf der zackigen Modellküste
       *  nirgends baubar (gemessen 0 Plätze bei Toleranz 0, 42 bei 0,34). */
      shorelineTolerance: 0.34,
      minimumWaterDepth: 0.7,
    },
    unlockLevel: 9,
    cost: { money: 360_000, wood: 320, stone: 220 },
    constructionSec: 210,
    xpReward: 90,
    effects: [
      { type: 'storage', resource: 'wood', amount: 650 },
      { type: 'storage', resource: 'stone', amount: 650 },
      { type: 'storage', resource: 'food', amount: 420 },
      { type: 'storage', resource: 'planks', amount: 800 },
      { type: 'storage', resource: 'cut_stone', amount: 800 },
      { type: 'jobs', amount: 18 },
      { type: 'logistics', boostPct: 12, radius: 8 },
      { type: 'upkeep', resource: 'money', perMinute: 1_650 },
    ],
    buildLimit: [{ level: 9, max: 2 }, { level: 12, max: 4 }, { level: 16, max: 8 }],
  },

  // ---- Freizeit ----
  // Park: 5×5 — „wesentlich größer" (§ Auftrag A): Wege, Teich, Baumgruppen.
  {
    id: 'park',
    category: 'leisure',
    nameKey: 'building.park',
    size: { w: 5, h: 5 },
    sizeClass: 'L',
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 60_000, wood: 90 },
    constructionSec: 60,
    xpReward: 30,
    effects: [
      { type: 'coverage', need: 'leisure', radius: 14 },
      { type: 'ambience', amount: 3, radius: 8 },
      { type: 'upkeep', resource: 'money', perMinute: 400 },
    ],
    // Kette: Park → Stadtpark (L12).
    upgrades: [
      {
        cost: { money: 200_000, wood: 220 },
        constructionSec: 120,
        xpReward: 50,
        unlockLevel: 12,
        nameKey: 'building.park.2', // Stadtpark
        effects: [
          { type: 'coverage', need: 'leisure', radius: 18 },
          { type: 'ambience', amount: 4, radius: 10 },
          { type: 'upkeep', resource: 'money', perMinute: 700 },
        ],
      },
    ],
  },
  // Spielplatz: 3×3 (§ Auftrag A „größer") — Geräte, Sandkasten, Bänke.
  {
    id: 'playground',
    category: 'leisure',
    nameKey: 'building.playground',
    size: { w: 3, h: 3 },
    sizeClass: 'M',
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 30_000, wood: 60 },
    constructionSec: 40,
    xpReward: 15,
    effects: [
      { type: 'coverage', need: 'leisure', radius: 8 },
      { type: 'ambience', amount: 1, radius: 5 },
      { type: 'upkeep', resource: 'money', perMinute: 200 },
    ],
  },

  // ---- Dekoration (XS, 1 Stufe — §7 Auftrag A) ----
  {
    id: 'deco_tree',
    category: 'decoration',
    nameKey: 'building.deco_tree',
    size: { w: 1, h: 1 },
    sizeClass: 'XS',
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 1_500 },
    constructionSec: 0,
    xpReward: 1,
    effects: [{ type: 'ambience', amount: 1, radius: 3 }],
  },
  {
    id: 'deco_flowerbed',
    category: 'decoration',
    nameKey: 'building.deco_flowerbed',
    size: { w: 1, h: 1 },
    sizeClass: 'XS',
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 2_400 },
    constructionSec: 0,
    xpReward: 1,
    effects: [{ type: 'ambience', amount: 1, radius: 3 }],
  },
  {
    id: 'deco_fountain',
    category: 'decoration',
    nameKey: 'building.deco_fountain',
    size: { w: 1, h: 1 },
    sizeClass: 'XS',
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 12_000, stone: 15 },
    constructionSec: 20,
    xpReward: 3,
    effects: [{ type: 'ambience', amount: 2, radius: 4 }],
  },
  {
    id: 'deco_bench',
    category: 'decoration',
    nameKey: 'building.deco_bench',
    size: { w: 1, h: 1 },
    sizeClass: 'XS',
    requiresRoad: false,
    unlockLevel: 7,
    cost: { money: 3_000, wood: 8 },
    constructionSec: 0,
    xpReward: 1,
    effects: [{ type: 'ambience', amount: 1, radius: 2 }],
  },
];
