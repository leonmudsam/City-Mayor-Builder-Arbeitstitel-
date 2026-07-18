// § A9 (Ausbaustufe 2.0): GENERATOR für docs/BUILDINGS.md und docs/REGIONS.md.
//
// Beide Dokumente werden aus der Spiel-Config abgeleitet (buildings.config,
// levels.config, regions.config) und über tests/buildingDocs.test.ts synchron
// gehalten (WRITE_BUILDING_DOCS=1). So kann die verbindliche Gebäude-/Regions-
// Tabelle (Auftrag A §10, Auftrag B) nie von der tatsächlichen Config abweichen —
// neue Gebäude/Stufen/Regionen erscheinen automatisch, veraltete Doku bricht den
// Test. Dies liegt unter src/assets (Asset-/Doku-Schicht) und importiert nur
// Config + i18n, nie Renderer/State — die §1-Trennung bleibt gewahrt.

import type { BuildingDef, BuildingEffect, BuildingUpgradeDef, LevelDef, RegionDef } from '../game/config/types.ts';
import type { ResourceId } from '../game/types.ts';
import de from '../i18n/de.json';
import { BUILDING_NODES, BUILDING_SIZE_BUDGETS, BUILD_CONSTRUCTION_SUFFIX, BUILD_STAGE_PREFIX } from './modelManifest.ts';

const DE = de as Record<string, string>;
const nameOf = (key: string): string => DE[key] ?? key;

const GEN_BANNER =
  '> **Auto-generiert** aus der Spiel-Config (`buildings.config.ts` / `levels.config.ts` /\n' +
  '> `regions.config.ts`). Nicht von Hand editieren. Neu generieren:\n' +
  '> `WRITE_BUILDING_DOCS=1 npx vitest run tests/buildingDocs.test.ts`.\n' +
  '> Der Test schlägt fehl, sobald diese Datei von der Config abweicht.';

/** Ganzzahl mit deutschen Tausenderpunkten, deterministisch (kein ICU nötig). */
function nf(n: number): string {
  const sign = n < 0 ? '-' : '';
  const s = Math.abs(Math.round(n)).toString();
  return sign + s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const RES_LABEL: Record<string, string> = {
  money: 'Geld',
  wood: 'Holz',
  stone: 'Stein',
  food: 'Nahrung',
  freshwater: 'Wasser',
  water: 'Wasser',
  gold: 'Gold',
  energy: 'Energie',
};
const resLabel = (r: string): string => RES_LABEL[r] ?? r;

const NEED_LABEL: Record<string, string> = {
  water: 'Wasser',
  energy: 'Energie',
  safety: 'Sicherheit',
  health: 'Gesundheit',
  leisure: 'Freizeit',
};
const needLabel = (n: string): string => NEED_LABEL[n] ?? n;

// Reihenfolge der Baukosten-Ressourcen (Gold ist keine Baukosten-Ressource,
// sondern nur Level-Belohnung — separat behandelt).
const RES_ORDER: readonly ResourceId[] = ['money', 'wood', 'stone', 'food', 'freshwater'];

function fmtCost(cost: Partial<Record<ResourceId, number>> | undefined): string {
  if (!cost) return '—';
  const parts = RES_ORDER.filter((r) => (cost[r] ?? 0) > 0).map((r) => `${nf(cost[r] as number)} ${resLabel(r)}`);
  return parts.length ? parts.join(' · ') : 'kostenlos';
}

/** Kurz-Token für die „interessanten" Effekte einer Stufe (Kern-Wirkung). */
function effectToken(e: BuildingEffect): { prio: number; text: string } | null {
  switch (e.type) {
    case 'housing':
      return { prio: 0, text: `${nf(e.units)} Wohneinheiten` };
    case 'produce':
      return { prio: 1, text: `+${nf(e.perMinute)} ${resLabel(e.resource)}/min` };
    case 'capacity':
      return { prio: 2, text: `+${nf(e.amount)} ${needLabel(e.need)}${e.radius ? ` (r=${e.radius})` : ''}` };
    case 'coverage':
      return { prio: 3, text: `${needLabel(e.need)} r=${e.radius}${e.capacity ? `, Kap. ${nf(e.capacity)}` : ''}` };
    case 'protection':
      return { prio: 4, text: `Brandschutz r=${e.radius}` };
    case 'distribution':
      return { prio: 5, text: `Verteilung ${needLabel(e.need)} r=${e.radius}` };
    case 'logistics':
      return { prio: 6, text: `Logistik +${e.boostPct}% r=${e.radius}` };
    case 'revenue':
      return { prio: 7, text: `+${nf(e.perMinute)} ${e.category === 'commercial' ? 'Gewerbe' : 'Industrie'}/min` };
    case 'storage': {
      // Lager je Ressource zusammenfassen wäre schön, aber ein Token je Effekt
      // reicht für die Kern-Wirkung; Storage nur für reine Lagerbauten prägnant.
      return { prio: 8, text: `Lager +${nf(e.amount)} ${resLabel(e.resource)}` };
    }
    case 'jobs':
      return { prio: 9, text: `${nf(e.amount)} Jobs` };
    case 'ambience':
      return { prio: 10, text: `Ambiente ${e.amount > 0 ? '+' : ''}${e.amount} r=${e.radius}` };
    default:
      return null;
  }
}

/** Die 1–3 prägnantesten Effekte einer Stufe als kompakte Zelle. */
function headlineEffects(effects: readonly BuildingEffect[]): string {
  const tokens = effects
    .map(effectToken)
    .filter((t): t is { prio: number; text: string } => t !== null)
    .sort((a, b) => a.prio - b.prio);
  // Storage-Bauten haben mehrere gleichwertige Lager-Tokens — dann alle zeigen,
  // sonst auf die drei stärksten kappen.
  const onlyStorage = effects.every((e) => ['storage', 'jobs', 'upkeep', 'demand'].includes(e.type));
  const picked = onlyStorage ? tokens : tokens.slice(0, 3);
  return picked.length ? picked.map((t) => t.text).join(' · ') : '—';
}

const stageCount = (b: BuildingDef): number => (b.upgrades?.length ?? 0) + 1;

/** Benötigte GLB-Dateien (Basis + Stufen + Baustelle). */
function requiredGlbs(b: BuildingDef): string {
  const stages = stageCount(b);
  const stageFiles =
    stages > 2
      ? ` · \`${b.id}${BUILD_STAGE_PREFIX}2\`…\`${b.id}${BUILD_STAGE_PREFIX}${stages}.glb\``
      : stages === 2
        ? ` · \`${b.id}${BUILD_STAGE_PREFIX}2.glb\``
        : '';
  return `\`${b.id}.glb\`${stageFiles} · \`${b.id}${BUILD_CONSTRUCTION_SUFFIX}.glb\``;
}

/** Besondere Eigenschaften (Flags) eines Gebäudes als Liste. */
function flags(b: BuildingDef): string {
  const f: string[] = [];
  if (b.unique) f.push('einzigartig');
  if (b.buildable === false) f.push('nicht frei baubar (Projekt-/Startgebäude)');
  if (b.requiresRoad === false && b.category !== 'decoration' && b.category !== 'roads') f.push('kein Straßenanschluss nötig');
  if (b.adjacentTerrain) f.push(`muss an \`${b.adjacentTerrain}\` grenzen`);
  if (b.locationBonus) f.push(`Standortbonus: \`${b.locationBonus.terrain}\` in r=${b.locationBonus.radius} (+${b.locationBonus.perTilePct}%/Kachel, max +${b.locationBonus.maxPct}%)`);
  if (b.buildLimit && b.buildLimit.length) {
    const last = b.buildLimit[b.buildLimit.length - 1];
    if (last) f.push(`Baugrenze bis ${last.max} (ab L${last.level})`);
  }
  if (b.canRelocate) f.push('versetzbar');
  if (b.canDemolish === false) f.push('nicht abreißbar');
  return f.length ? f.join(' · ') : '—';
}

interface StageRow {
  name: string;
  level: string;
  cost: string;
  effects: string;
}

function stageRows(b: BuildingDef): StageRow[] {
  const base: StageRow = {
    name: nameOf(b.nameKey),
    level: `L${b.unlockLevel}`,
    cost: fmtCost(b.cost),
    effects: headlineEffects(b.effects),
  };
  const ups = (b.upgrades ?? []).map((u: BuildingUpgradeDef, i): StageRow => ({
    name: nameOf(u.nameKey ?? `${b.nameKey}.${i + 2}`),
    level: u.unlockLevel ? `L${u.unlockLevel}` : '—',
    cost: fmtCost(u.cost),
    effects: headlineEffects(u.effects),
  }));
  return [base, ...ups];
}

const SIZE_LEGEND: Record<string, string> = {
  XS: '1×1',
  S: '2×2',
  M: '3×3',
  L: '4×4–5×5',
  XL: '6×6–7×7',
  XXL: '8×8',
};

const CATEGORY_LABEL: Record<string, string> = {
  government: 'Verwaltung',
  roads: 'Straßen',
  residential: 'Wohnen',
  production: 'Produktion & Ressourcen',
  services: 'Versorgung & Dienste',
  economy: 'Wirtschaft',
  energy: 'Energie',
  leisure: 'Freizeit',
  decoration: 'Dekoration',
  infrastructure: 'Infrastruktur',
  special: 'Landmarken',
};

const CATEGORY_ORDER: readonly string[] = [
  'government', 'residential', 'production', 'services', 'economy', 'energy', 'leisure', 'decoration', 'roads',
];

/** Markdown für docs/BUILDINGS.md — verbindliche Gebäudetabelle (Auftrag A §10). */
export function buildBuildingsSpec(buildings: readonly BuildingDef[], levels: readonly LevelDef[]): string {
  const legend = (['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const)
    .map((c) => {
      const bud = BUILDING_SIZE_BUDGETS[c];
      return `| **${c}** | ${SIZE_LEGEND[c]} | ${bud.triBudget} | ${bud.textureSize} | ${bud.materials} |`;
    })
    .join('\n');

  const summary = buildings
    .filter((b) => b.category !== 'roads')
    .map(
      (b) =>
        `| ${nameOf(b.nameKey)} | \`${b.id}\` | ${CATEGORY_LABEL[b.category] ?? b.category} | ${b.sizeClass} | ${b.size.w}×${b.size.h} | L${b.unlockLevel} | ${stageCount(b)} |`,
    )
    .join('\n');

  const byCat = CATEGORY_ORDER.filter((c) => c !== 'roads')
    .map((cat) => {
      const inCat = buildings.filter((b) => b.category === cat);
      if (!inCat.length) return '';
      const sections = inCat
        .map((b) => {
          const rows = stageRows(b)
            .map((s, i) => `| ${i + 1} | ${s.name} | ${s.level} | ${s.cost} | ${s.effects} |`)
            .join('\n');
          const nodes = BUILDING_NODES[b.id];
          const nodeLine = nodes ? `\n- **Modell-Nodes:** ${nodes}` : '';
          const budget = BUILDING_SIZE_BUDGETS[b.sizeClass];
          return (
            `### ${nameOf(b.nameKey)} — \`${b.id}\`\n\n` +
            `- **Größenklasse:** ${b.sizeClass} (${SIZE_LEGEND[b.sizeClass]}) · **Footprint:** ${b.size.w}×${b.size.h} (fix über alle Stufen)\n` +
            `- **Asset-Budget:** ${budget.triBudget}, ${budget.textureSize}, ${budget.materials}\n` +
            `- **Ab Level:** ${b.unlockLevel} · **Stufen:** ${stageCount(b)} · **Kategorie:** ${CATEGORY_LABEL[b.category] ?? b.category}\n` +
            `- **Benötigte GLBs:** ${requiredGlbs(b)}${nodeLine}\n` +
            `- **Besonderheiten:** ${flags(b)}\n\n` +
            `| Stufe | Name | ab Level | Kosten | Kern-Wirkung |\n|---|---|---|---|---|\n${rows}\n`
          );
        })
        .join('\n');
      return `## ${CATEGORY_LABEL[cat] ?? cat}\n\n${sections}`;
    })
    .filter(Boolean)
    .join('\n');

  const levelRows = levels
    .map((l: LevelDef) => {
      const unlocks = l.unlocks.length ? l.unlocks.map((id) => nameOf(`building.${id}`)).join(', ') : '—';
      const rewards: string[] = [];
      if (l.rewards.money) rewards.push(`${nf(l.rewards.money)} Geld`);
      if (l.rewards.gold) rewards.push(`${nf(l.rewards.gold)} Gold`);
      return `| ${l.level} | ${nf(l.xpRequired)} | ${unlocks} | ${rewards.join(' · ') || '—'} |`;
    })
    .join('\n');

  return (
    `# Gebäude — verbindliche Tabelle (Gebäudesystem 2.0)\n\n` +
    `${GEN_BANNER}\n\n` +
    `Footprints sind **fix über alle Stufen** und **quadratisch** (Nutzer-Entscheidung) — eine Stufe ` +
    `verdichtet dasselbe Grundstück sichtbar, ändert aber nie die Fläche. Die 3D-Prompts je Stufe stehen ` +
    `generiert in \`src/assets/models/buildings/PROMPTS.md\`.\n\n` +
    `## Größenklassen & Asset-Budgets\n\n` +
    `| Klasse | Footprint | Tris | Textur | Material |\n|---|---|---|---|---|\n${legend}\n\n` +
    `## Übersicht\n\n` +
    `| Gebäude | ID | Kategorie | Klasse | Footprint | ab Level | Stufen |\n|---|---|---|---|---|---|---|\n${summary}\n\n` +
    `${byCat}\n` +
    `## Levelkurve (20 Level)\n\n` +
    `L15–L20 schalten kaum neue Gebäude frei, sondern gaten die Top-Stufen der Ketten (Meilenstein-Gefühl).\n\n` +
    `| Level | XP (kumuliert) | Schaltet frei | Belohnung |\n|---|---|---|---|\n${levelRows}\n`
  );
}

// ---- Regionen (docs/REGIONS.md) --------------------------------------------

const biomeLabel = (b: string): string => nameOf(`biome.${b}`);

/** Markdown für docs/REGIONS.md — organische Regionen aus regions.config.ts. */
export function buildRegionsDoc(regions: readonly RegionDef[]): string {
  const sorted = [...regions].sort((a, b) => a.id - b.id);
  const rows = sorted
    .map((r) => {
      const mods = r.productionModifiers
        ? Object.entries(r.productionModifiers)
            .map(([k, v]) => `${resLabel(k)} ×${v}`)
            .join(', ')
        : '—';
      const road = r.roadCostFactor && r.roadCostFactor !== 1 ? `Straßen ×${r.roadCostFactor}` : '—';
      const prereq = r.prerequisiteRegionIds && r.prerequisiteRegionIds.length ? r.prerequisiteRegionIds.join(', ') : '—';
      const unlock = r.unlockable ? `L${r.unlockLevel} · ${nf(r.unlockCost)} Geld` : 'nie';
      return `| ${r.id} | ${nameOf(r.nameKey)} | ${biomeLabel(r.biome)} | ${unlock} | ${prereq} | ${nf(r.buildableTiles)} | ${mods} | ${road} |`;
    })
    .join('\n');

  const start = sorted.find((r) => r.unlockLevel === 1 && r.unlockCost === 0);
  const teaser = sorted.filter((r) => !r.unlockable);

  return (
    `# Regionen — organische Landschaften (Welt 2.0)\n\n` +
    `${GEN_BANNER}\n\n` +
    `${sorted.length} gebackene Regionen ersetzen die alten Quadrat-Sektoren. Geometrie/Nachbarschaft kommen ` +
    `aus dem Bake (\`src/game/config/world/islandRegions.gen.ts\`, \`tools/bake-report.md\`); diese Tabelle gibt ` +
    `jeder Region Namen, Charakter, Vor-/Nachteile und Freischaltbedingungen.\n\n` +
    (start ? `**Startregion:** ${nameOf(start.nameKey)} (Region ${start.id}) — bewusst NEUTRAL (keine Modifikatoren) als Bezugspunkt.\n\n` : '') +
    (teaser.length ? `**Nie freischaltbar (Teaser):** ${teaser.map((r) => `${nameOf(r.nameKey)} (${r.id})`).join(', ')} — am Horizont sichtbares Versprechen für spätere Inhalte.\n\n` : '') +
    `| Id | Name | Biom | Freischaltung | Voraussetzungen | Bebaubare Kacheln | Produktion | Nachteil |\n` +
    `|---|---|---|---|---|---|---|---|\n${rows}\n\n` +
    `**Produktion** = Multiplikatoren auf den Gebäude-Output in dieser Region (ab A4 wirksam). ` +
    `**Nachteil** = Malus (z. B. teurere Straßen im Gebirge). Neutral (Startregion) hat bewusst beides nicht.\n`
  );
}
