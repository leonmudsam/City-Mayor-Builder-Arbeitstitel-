import { describe, expect, it } from 'vitest';
import { buildingsConfig } from '../src/game/config/buildings.config.ts';
import { levelsConfig } from '../src/game/config/levels.config.ts';
import { balancingConfig } from '../src/game/config/balancing.config.ts';
import { WORLD_TILES, regionIdAt, startRegionConfig, terrainAt } from '../src/game/config/startRegion.config.ts';
import { RESOURCE_NODE_PROFILES } from '../src/game/operations/nodes.ts';
import type { BuildingDef } from '../src/game/config/types.ts';
import type { ResourceId } from '../src/game/types.ts';

// § Frühspiel-Audit (02.08.2026) — „Keine Voraussetzung darf den Spieler
// blockieren, ohne dass vorher eine Lösung existiert."
//
// Diese Tests prüfen keine Zahlen, sondern die ERREICHBARKEIT: Für jede
// Ressource, die ein Gebäude kostet, muss es zu diesem Zeitpunkt eine Quelle
// geben, die ihrerseits nicht dieselbe Ressource voraussetzt. Ein Ausbau der
// Config, der das verletzt, fällt hier auf — nicht erst im Spieltest.

const LEVEL_CAP = 8;

/** Veredelte Ware → das einzige Gebäude, das sie herstellt (§ Lieferketten-Overhaul). */
const REFINED_SOURCES: [ResourceId, string][] = [
  ['planks', 'wood_workshop'],
  ['cut_stone', 'stone_workshop'],
];

/**
 * Ressourcen, die dieses Gebäude produziert — passiv, über einen Betrieb ODER
 * über eine Werkstatt. Die dritte Möglichkeit kam mit dem Lieferketten-Overhaul
 * hinzu; ohne sie hielte dieser Test eine Werkstatt für keine Quelle und
 * meldete Bretter als unerreichbar, obwohl es sie ab L5 gibt.
 */
function producedBy(def: BuildingDef): ResourceId[] {
  const out = (def.effects ?? [])
    .filter((effect): effect is { type: 'produce'; resource: ResourceId; perMinute: number } => effect.type === 'produce')
    .map((effect) => effect.resource);
  if (def.conversion) out.push(def.conversion.output);
  return out;
}

/** Kosten-Ressourcen ohne Geld — Geld hat immer eine Quelle (Steuern). */
function costResources(def: BuildingDef): ResourceId[] {
  return Object.entries(def.cost ?? {})
    .filter(([key, amount]) => key !== 'money' && (amount ?? 0) > 0)
    .map(([key]) => key as ResourceId);
}

/**
 * Braucht dieses Gebäude ein bestimmtes Terrain, um überhaupt zu ARBEITEN?
 * Ein aktiver Betrieb erntet Knoten, und Knoten liegen laut Profil auf genau
 * einem Terrain — ohne dieses Terrain steht das Gebäude nutzlos herum.
 */
function requiredWorkTerrain(def: BuildingDef): string | undefined {
  const nodeType = def.operation?.nodeType;
  return nodeType ? RESOURCE_NODE_PROFILES[nodeType]?.terrain : undefined;
}

describe('Frühspiel — jede Ressource hat einen Einstieg', () => {
  it('kennt für jede Baukosten-Ressource bis Level 8 eine Quelle, die sie nicht selbst voraussetzt', () => {
    const problems: string[] = [];
    for (const def of buildingsConfig) {
      const level = def.unlockLevel ?? 1;
      if (level > LEVEL_CAP) continue;
      for (const resource of costResources(def)) {
        // Eine gültige Einstiegsquelle: produziert die Ressource, ist spätestens
        // gleichzeitig verfügbar und kostet sie nicht selbst.
        const entry = buildingsConfig.find(
          (candidate) =>
            (candidate.unlockLevel ?? 1) <= level &&
            producedBy(candidate).includes(resource) &&
            !costResources(candidate).includes(resource),
        );
        // Der Startvorrat IST eine gültige Quelle — aber nur, wenn er nicht 0
        // ist. Stein steht bei 0: dort MUSS ein Gebäude einspringen.
        const fromStart = (balancingConfig.startResources[resource] ?? 0) > 0;
        if (!entry && !fromStart) problems.push(`${def.id} (L${level}) braucht ${resource}, ohne verfügbare Quelle`);
      }
    }
    expect(problems, problems.join(' · ')).toEqual([]);
  });

  it('stellt Stein bereit, bevor das erste Gebäude ihn kostet', () => {
    const firstStoneCost = buildingsConfig
      .filter((def) => costResources(def).includes('stone'))
      .map((def) => def.unlockLevel ?? 1)
      .sort((a, b) => a - b)[0];
    expect(firstStoneCost, 'kein Gebäude kostet Stein — Test veraltet').toBeDefined();

    const sources = buildingsConfig.filter(
      (def) => producedBy(def).includes('stone') && (def.unlockLevel ?? 1) <= firstStoneCost!,
    );
    expect(sources.length, 'keine Steinquelle vor der ersten Steinkosten-Stufe').toBeGreaterThan(0);

    // Und mindestens eine davon darf NICHT an Bergterrain hängen: die
    // Startregion hat davon 46 Kacheln, ein einziger Steinbruch erschöpft sie.
    const terrainFree = sources.filter((def) => requiredWorkTerrain(def) === undefined && !def.buildsOnRock);
    expect(
      terrainFree.map((def) => def.id),
      'jede frühe Steinquelle hängt an Terrain, das die Startregion kaum hat',
    ).not.toEqual([]);
  });

  it('hält die Einstiegsquelle schwächer als den echten Betrieb', () => {
    const rateOf = (id: string) => {
      const def = buildingsConfig.find((candidate) => candidate.id === id);
      const effect = (def?.effects ?? []).find(
        (candidate): candidate is { type: 'produce'; resource: ResourceId; perMinute: number } =>
          candidate.type === 'produce' && candidate.resource === 'stone',
      );
      return effect?.perMinute ?? 0;
    };
    // Sonst wäre der Steinbruch — samt Regionsfreischaltung — überflüssig.
    expect(rateOf('stone_pit')).toBeGreaterThan(0);
    expect(rateOf('stone_pit')).toBeLessThan(rateOf('quarry') / 2);
  });

  it('verlangt keine veredelte Ware, bevor eine Werkstatt sie herstellen kann', () => {
    // § Lieferketten-Overhaul §6/§7: „gestaffelt einführen, nicht alles auf
    // einmal". Die harte Untergrenze ist aber keine Balancing-Frage, sondern
    // dieselbe Erreichbarkeitsregel wie oben — nur schärfer, weil eine
    // veredelte Ware NIE aus der Welt kommt: Ohne Werkstatt gibt es kein
    // einziges Brett, auch nicht mit Glück oder Startvorrat.
    const problems: string[] = [];
    for (const def of buildingsConfig) {
      for (const [resource, source] of REFINED_SOURCES) {
        const sourceLevel = buildingsConfig.find((c) => c.id === source)!.unlockLevel;
        const check = (level: number, where: string, cost: Partial<Record<ResourceId, number>> | undefined) => {
          if ((cost?.[resource] ?? 0) > 0 && level < sourceLevel) {
            problems.push(`${where} (L${level}) kostet ${resource}, ${source} gibt es erst ab L${sourceLevel}`);
          }
        };
        check(def.unlockLevel ?? 1, def.id, def.cost);
        for (const up of def.upgrades ?? []) check(up.unlockLevel ?? (def.unlockLevel ?? 1), `${def.id}^`, up.cost);
      }
    }
    expect(problems, problems.join(' · ')).toEqual([]);
  });

  it('macht jede Freischaltung des Levels auch baubar', () => {
    const known = new Set(buildingsConfig.map((def) => def.id));
    const problems: string[] = [];
    for (const level of levelsConfig) {
      for (const id of level.unlocks ?? []) {
        if (!known.has(id)) problems.push(`Level ${level.level} schaltet ${id} frei — kein solches Gebäude`);
      }
    }
    expect(problems, problems.join(' · ')).toEqual([]);
  });
});

describe('Frühspiel — die Startregion trägt ihre eigenen Betriebe', () => {
  /** Terrainzählung der Startregion, aus derselben Quelle wie die Welt.
   *  Bewusst als Funktion: bei Modul-Auswertung ist das Regionsgitter noch
   *  nicht befüllt — die Zählung ergab dann stumm überall 0. */
  const countStartTerrain = () => {
    const counts = new Map<string, number>();
    for (let y = 0; y < WORLD_TILES; y++) {
      for (let x = 0; x < WORLD_TILES; x++) {
        if (regionIdAt(x, y) !== startRegionConfig.startRegionId) continue;
        const terrain = terrainAt(x, y);
        counts.set(terrain, (counts.get(terrain) ?? 0) + 1);
      }
    }
    return counts;
  };

  it('hat Wald für das Sägewerk', () => {
    expect(countStartTerrain().get('forest') ?? 0).toBeGreaterThan(200);
  });

  it('dokumentiert, welche Betriebe in der Startregion NICHT arbeiten können', () => {
    // Kein Soll-Wert, sondern ein Wächter: Wer einem Betrieb ein Terrain gibt,
    // das die Startregion nicht hat, muss ihn auch spät genug freischalten —
    // oder eine terrainfreie Einstiegsquelle mitliefern (siehe `stone_pit`).
    const blocked: string[] = [];
    for (const def of buildingsConfig) {
      const level = def.unlockLevel ?? 1;
      if (level > LEVEL_CAP) continue;
      const terrain = requiredWorkTerrain(def);
      const start = countStartTerrain();
      if (terrain && (start.get(terrain) ?? 0) === 0) blocked.push(`${def.id}@L${level}:${terrain}`);
    }
    // Stand 02.08.2026: die Farm braucht `fertile`, davon hat die Startregion
    // NULL Kacheln. Das ist der offene Punkt des Frühspiel-Auftrags (Felder
    // statt Fruchtbarkeits-Gate); der Test hält ihn sichtbar, statt ihn zu
    // verschweigen. Wird er gelöst, muss diese Liste leer werden.
    expect(blocked).toEqual(['farm@L4:fertile']);
  });
});
