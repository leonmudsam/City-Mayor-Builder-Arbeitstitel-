// Regions-Vorschau (§ Overhaul 3.0 / C5): welche Gebäude eine (noch gesperrte)
// Region durch ihren Charakter begünstigt. Reine, DETERMINISTISCHE Projektion aus
// den statischen Configs — kein State, kein RNG, kein Save (CLAUDE.md §1). Ersetzt
// das `TODO(CLAUDE_LOGIC)`-Skeleton in `components/panels/RegionDialog.tsx`.
//
// Regel: Ein Gebäude ist „begünstigt", wenn es eine Ressource PRODUZIERT
// (Basis- oder Ausbaustufe), deren Produktion die Region über ihre
// `productionModifiers` anhebt (> 1). So begründet die Vorschau ehrlich, warum
// sich eine Waldregion (+Holz) für das Sägewerk oder eine fruchtbare Region
// (+Nahrung) für den Bauernhof lohnt — ohne erfundene Freischaltungen (D-010).

import type { ResourceId } from '../types.ts';
import { buildingsConfig } from '../config/buildings.config.ts';
import { regionsConfig } from '../config/regions.config.ts';

export interface RegionFavouredBuilding {
  defId: string;
  /** Produzierte Ressource, die die Region anhebt. */
  resource: ResourceId;
  /** Regions-Bonus in Prozentpunkten (z. B. +50 %). */
  modifierPct: number;
}

export interface RegionPreview {
  regionId: number;
  favouredBuildings: RegionFavouredBuilding[];
}

/** Region-Modifier-Schlüssel → produzierbare Ressource. `water` ist im Regions-
 *  Modell der Süßwasser-Bonus. `energy` hat keinen `produce`-Erzeuger → entfällt. */
function modifierResource(key: string): ResourceId | undefined {
  if (key === 'water') return 'freshwater';
  if (key === 'wood' || key === 'stone' || key === 'food' || key === 'freshwater' || key === 'money') return key;
  return undefined;
}

/** Ressource → Gebäude-Ids, die sie (Basis oder Ausbaustufe) produzieren. Einmalig. */
const PRODUCERS: Map<ResourceId, string[]> = (() => {
  const map = new Map<ResourceId, string[]>();
  for (const def of buildingsConfig) {
    const stages = [def.effects, ...(def.upgrades?.map((u) => u.effects) ?? [])];
    const resources = new Set<ResourceId>();
    for (const effects of stages) {
      for (const e of effects) if (e.type === 'produce') resources.add(e.resource);
    }
    for (const r of resources) {
      const list = map.get(r) ?? [];
      if (!list.includes(def.id)) list.push(def.id);
      map.set(r, list);
    }
  }
  for (const list of map.values()) list.sort();
  return map;
})();

/**
 * Vorschau-Projektion einer Region. `undefined` bei unbekannter Id. Die Liste ist
 * leer, wenn die Region keine produktionsrelevanten Boni hat (dann zeigt die UI
 * bewusst nichts statt erfundener Daten).
 */
export function regionPreview(regionId: number): RegionPreview | undefined {
  const region = regionsConfig.find((r) => r.id === regionId);
  if (!region) return undefined;

  const boosted: { resource: ResourceId; pct: number }[] = [];
  for (const [key, factor] of Object.entries(region.productionModifiers ?? {})) {
    if (factor === undefined || factor <= 1) continue;
    const resource = modifierResource(key);
    if (resource) boosted.push({ resource, pct: Math.round((factor - 1) * 100) });
  }
  boosted.sort((a, b) => b.pct - a.pct || a.resource.localeCompare(b.resource));

  const seen = new Set<string>();
  const favouredBuildings: RegionFavouredBuilding[] = [];
  for (const { resource, pct } of boosted) {
    for (const defId of PRODUCERS.get(resource) ?? []) {
      if (seen.has(defId)) continue;
      seen.add(defId);
      favouredBuildings.push({ defId, resource, modifierPct: pct });
    }
  }
  return { regionId, favouredBuildings };
}
