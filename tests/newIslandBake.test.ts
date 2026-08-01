import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BAKED_START,
  BAKED_WORLD,
  WORLD_SOURCE_SHA256,
  WORLD_TILES,
  terrainGrid,
} from '../src/game/config/world/islandTerrain.gen.ts';
import {
  BUILDABLE_BIT,
  WATERFRONT_BIT,
  buildabilityGrid,
  shoreTypeGrid,
  surfaceHeightGrid,
  surfaceSlopeGrid,
  waterDepthGrid,
} from '../src/game/config/world/islandBuildability.gen.ts';
import {
  bridgeCandidates,
  elevatedRoadCandidates,
  harborCandidates,
  tunnelCandidates,
  waterRouteEdges,
  waterRouteNodes,
} from '../src/game/config/world/islandInfrastructure.gen.ts';
import { BAKED_REGIONS, regionGrid } from '../src/game/config/world/islandRegions.gen.ts';
import { regionsConfig } from '../src/game/config/regions.config.ts';
import { HEIGHT_GRID, heightGrid } from '../src/renderer/three/worldHeight.gen.ts';
import { coastDistanceGrid, oceanDepthGrid, shoreTypeGrid as rendererShoreTypeGrid, waterMaskGrid } from '../src/renderer/three/worldMasks.gen.ts';

describe('§ World Overhaul 12.0 — Bake der neuen Insel', () => {
  it('binds all generated data to the audited 117-part source GLB', () => {
    const source = readFileSync('reference/world/new island 3d model.glb');
    expect(createHash('sha256').update(source).digest('hex')).toBe(WORLD_SOURCE_SHA256);
    const report = JSON.parse(readFileSync('tools/new-island-report.json', 'utf8')) as {
      source: { sha256: string };
      counts: { parts: number; vertices: number; triangles: number };
    };
    expect(report.source.sha256).toBe(WORLD_SOURCE_SHA256);
    expect(report.counts).toMatchObject({ parts: 117, vertices: 989_147, triangles: 1_914_065 });
  });

  it('keeps terrain, surface, water and height grids dimensionally synchronized', () => {
    const tileCount = WORLD_TILES * WORLD_TILES;
    expect(WORLD_TILES).toBe(512);
    expect(HEIGHT_GRID).toBe(WORLD_TILES * 2 + 1);
    expect(terrainGrid).toHaveLength(tileCount);
    expect(buildabilityGrid).toHaveLength(tileCount);
    expect(surfaceHeightGrid).toHaveLength(tileCount);
    expect(surfaceSlopeGrid).toHaveLength(tileCount);
    expect(waterDepthGrid).toHaveLength(tileCount);
    expect(waterMaskGrid).toHaveLength(tileCount);
    expect(coastDistanceGrid).toHaveLength(tileCount);
    expect(oceanDepthGrid).toHaveLength(tileCount);
    expect(shoreTypeGrid).toHaveLength(tileCount);
    expect(rendererShoreTypeGrid).toEqual(shoreTypeGrid);
    expect(heightGrid).toHaveLength(HEIGHT_GRID * HEIGHT_GRID);
  });

  // § MODELLTREUE 13.0 (Auftrag 31.07.2026) — „Ich will, dass meine Spielwelt
  // nicht von dem Modell abweicht." Das ist der zentrale Test dieses Auftrags.
  it('ships the source GLB geometry unchanged — no terraforming at all', () => {
    // Vorher wurden 157.749 von 233.287 Landknoten verändert (67,6 %) und die
    // mittlere Landhöhe von 8,46 auf 6,45 m gedrückt: Ufer-Blend, Terraforming,
    // Glättung, Nadelreparatur und Klippen-Plateaus haben zusammen eine andere
    // Landschaft erzeugt als die, die im Viewer zu sehen ist. Jetzt gilt die
    // Reihenfolge des Auftrags: erst die Geometrie exakt übernehmen, DANN
    // Wasser, Ufer, Biome und Texturen ableiten.
    expect(BAKED_WORLD.modelFidelity.terrainMode).toBe('raw');
    expect(BAKED_WORLD.modelFidelity.changedNodes).toBe(0);
    expect(BAKED_WORLD.modelFidelity.maxAbsDelta).toBe(0);
    expect(BAKED_WORLD.modelFidelity.meanWorldHeight)
      .toBe(BAKED_WORLD.modelFidelity.meanModelHeight);
    // Der Beweis, dass wirklich das ganze Land gemessen wurde und nicht nur ein
    // Ausschnitt: die Insel bedeckt ~22 % des 1025²-Rasters.
    expect(BAKED_WORLD.modelFidelity.landNodes).toBeGreaterThan(200_000);
  });

  it('keeps the model own cliffs instead of replacing them with beach', () => {
    // Folge der Modelltreue: Die Quell-GLB ist eine Klippeninsel. Der alte Bake
    // zog JEDE Uferkante auf eine 0,24-m-Plattform und ersetzte damit genau die
    // Form, die das Modell ausmacht. Gemessen an den Ufertypen muss Steilküste
    // jetzt klar überwiegen — und die Reparaturen, die früher Ersatzlandschaft
    // gebaut haben, laufen gar nicht mehr.
    expect(BAKED_WORLD.coastGeometry.needlesRepaired).toBe(0);
    expect(BAKED_WORLD.coastGeometry.isolatedPeaksRepaired).toBe(0);
    expect(BAKED_WORLD.coastGeometry.cliffPlateauTiles).toBe(0);
    let cliff = 0;
    let flat = 0;
    for (const type of shoreTypeGrid) {
      if (type === 4) cliff++;
      else if (type === 1) flat++;
    }
    // § 13.1: Der höhere Meeresspiegel legt das Wasser an die Terrassenkante und
    // schafft dadurch bewusst mehr flaches Ufer (322 → 557). Die Klippe bleibt
    // trotzdem das Gesicht der Küste.
    expect(cliff).toBeGreaterThan(1_500);
    expect(cliff).toBeGreaterThan(flat * 2);
  });

  it('never turns top-down-degenerate coast walls into isolated heightfield cones', () => {
    expect(BAKED_WORLD.coastGeometry.projectedDegenerateTrianglesSkipped).toBeGreaterThan(100);
    expect(BAKED_WORLD.coastGeometry.isolatedPeaksRepaired).toBeGreaterThanOrEqual(0);
    // § 12.0: nach der Reparatur bleiben höchstens ein paar isolierte
    // Küstenspitzen übrig (unkritisch).
    expect(BAKED_WORLD.coastGeometry.isolatedPeakCount).toBeLessThanOrEqual(3);
    // § Modelltreue 13.0: Auch ohne jede Reparatur enthält das Modell keine
    // Nadeln — die „Zacken" früherer Spieltests kamen nie aus der Geometrie.
    expect(BAKED_WORLD.coastGeometry.needleCount).toBe(0);
    expect(BAKED_WORLD.coastGeometry.maxNeighborStep).toBeLessThan(30);
  });

  it('places the founding point centrally on real buildable land', () => {
    expect(Math.hypot(
      BAKED_START.centralFoundingPoint.x - BAKED_WORLD.islandCenter.x,
      BAKED_START.centralFoundingPoint.y - BAKED_WORLD.islandCenter.y,
    )).toBeLessThan(65);
    let min = Infinity;
    let max = -Infinity;
    for (let dy = -1; dy <= 5; dy++) {
      for (let dx = -1; dx <= 5; dx++) {
        const x = BAKED_START.townHall.x + dx;
        const y = BAKED_START.townHall.y + dy;
        const offset = y * WORLD_TILES + x;
        expect(buildabilityGrid[offset]! & BUILDABLE_BIT).toBe(BUILDABLE_BIT);
        min = Math.min(min, surfaceHeightGrid[offset]!);
        max = Math.max(max, surfaceHeightGrid[offset]!);
      }
    }
    expect((max - min) / 100).toBeLessThan(0.85);
    // § 10.0 R7/R8 §3.3: zentraler Start als langfristiges Zentrum, 1.200–1.750
    // (Bake-Korridor MIN/MAX_START_BUILDABLE).
    expect(BAKED_START.score.buildableTiles).toBeGreaterThanOrEqual(1200);
    expect(BAKED_START.score.buildableTiles).toBeLessThanOrEqual(1750);
    expect(BAKED_START.score.expansionDirectionScore).toBeGreaterThanOrEqual(0.75);
    expect(BAKED_START.score.resourceAccessScore).toBe(1);
    expect(BAKED_START.score.waterRisk).toBe(0);
    // § 10.0: nach der dritten Verdichtung hat der beste zentrale Start ein
    // minimales, unkritisches Klippenrisiko am Rand des 25×25-Fensters (< 0,1).
    expect(BAKED_START.score.cliffRisk).toBeLessThan(0.1);
    expect(BAKED_START.initialSupplyRoute.at(0)).toEqual(BAKED_START.coastalArrivalPoint);
    expect(BAKED_START.initialSupplyRoute.at(-1)).toEqual({ x: BAKED_START.centralFoundingPoint.x, y: BAKED_START.centralFoundingPoint.y + 3 });
  });

  it('keeps the island inscribed with an ocean margin and stays playable', () => {
    // Die Insel bleibt mit Ozeanrand in das 512er-Raster eingeschrieben; der
    // Faktor beschreibt die Spannweite gegenüber der 6.1-Referenz (420 → 314).
    expect(BAKED_WORLD.horizontalScaleFromV60).toBeGreaterThan(0.73);
    expect(BAKED_WORLD.horizontalScaleFromV60).toBeLessThan(0.76);
    // § World Overhaul 12.0: Regressionsschutz für die Bespielbarkeit. Die neue
    // Insel liefert 44.170 bebaubare Kacheln (alte Insel nach dem Flattening:
    // 38.126). Die Untergrenze sichert das Bauflächenbudget, die Obergrenze hält
    // fest, dass die Insel NICHT komplett eingeebnet wurde (§7: „Die Welt muss
    // bereits ohne Gebäude interessant aussehen").
    // § Modelltreue 13.0: Ohne Terraforming liefert das Modell selbst 37.891
    // bebaubare Kacheln (mit Terraforming waren es 48.029). Der Verlust ist der
    // PREIS der Treue und ausdrücklich gewollt — die Obergrenze hält weiterhin
    // fest, dass die Insel nicht eingeebnet wurde.
    const buildable = [...buildabilityGrid].filter((flags) => (flags & BUILDABLE_BIT) !== 0).length;
    expect(buildable).toBeGreaterThanOrEqual(34_000);
    expect(buildable).toBeLessThanOrEqual(42_000);
    // §6 „Wassergebäude benötigen klare Übergänge": reichlich direkt wassernahe,
    // bebaubare Uferkacheln für Hafen/Dock/Brücke/Wasserpumpe/Handelsplatz.
    // § Modelltreue 13.0 — EHRLICH BEZIFFERT, NICHT WEGGEMESSEN. Die Quell-GLB
    // ist eine Klippeninsel: Land und Wasser treffen sich fast überall an einer
    // Wand, nicht an einem Strand. Die alten 900+ bebaubaren Uferkacheln gab es
    // nur, WEIL das Terraforming jede Uferkante planiert hat. Ohne das sind es
    // 150 — Häfen und Anleger sind damit selten und gezielt zu suchen (28
    // mögliche 2×2-Anlegerplätze inselweit). Das ist der bewusste Preis der
    // Treue; die Pfahl-/Steglogik für Klippenufer bleibt offen.
    const waterfront = [...buildabilityGrid].filter((flags) => (flags & WATERFRONT_BIT) !== 0).length;
    expect(waterfront).toBeGreaterThan(100);
    expect(BAKED_WORLD.harbourPads).toBeGreaterThan(10);
    // §6: Sanfte Ufer (Strand/Fluss-/Seeufer) müssen die bewusste Steilküste
    // klar dominieren — Klippen sind optische Highlights, nicht die Regel.
    const gentleShore = [...shoreTypeGrid].filter((type) => type >= 1 && type <= 3).length;
    const cliffShore = [...shoreTypeGrid].filter((type) => type === 4).length;
    expect(gentleShore).toBeGreaterThan(300);
    // § 12.2: Steilküste braucht jetzt ECHTES Relief im Hinterland (≥ 5 m im
    // Umkreis 7). Vorher wählte allein ein Zonen-Hash aus, und das Ergebnis war
    // absurd: 223 „Steilküsten"-Kacheln mit einem Höhenmedian von 0,2–1,3 m —
    // also flaches Ufer, das nur vom flachen Profil AUSGESCHLOSSEN war, ohne
    // dass je eine Klippe sichtbar wurde. Jetzt sind es 124 Kacheln, die
    // wirklich Klippe sind. Weniger, aber echt.
    // § Modelltreue 13.0: Das Verhältnis ist jetzt umgekehrt — die Insel IST
    // eine Klippeninsel. Die alte Obergrenze („Klippen sind die Ausnahme")
    // beschrieb das Ergebnis des Terraformings, nicht das Modell.
    expect(cliffShore).toBeGreaterThan(1_500);

    // § Modelltreue 13.0: Statt einer 5×5-Uferplattform (die es auf einer
    // Klippeninsel nirgends gibt) wird das geprüft, was der Spieler tatsächlich
    // bauen will — ein 2×2-Anleger bündig am Wasser. Genau diese funktionale
    // Prüfung war schon die Lehre aus § 12.1 §6: zählen sagt nichts, bauen schon.
    let dockPlatform = false;
    for (let y = 1; y < WORLD_TILES - 3 && !dockPlatform; y++) {
      for (let x = 1; x < WORLD_TILES - 3 && !dockPlatform; x++) {
        let allBuildable = true;
        let hasWaterfrontTile = false;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const flags = buildabilityGrid[(y + dy) * WORLD_TILES + x + dx]!;
            allBuildable &&= (flags & BUILDABLE_BIT) !== 0;
            hasWaterfrontTile ||= (flags & WATERFRONT_BIT) !== 0;
          }
        }
        if (!allBuildable || !hasWaterfrontTile) continue;
        for (let ring = -1; ring <= 2 && !dockPlatform; ring++) {
          dockPlatform ||= waterMaskGrid[(y - 1) * WORLD_TILES + x + ring]! > 0;
          dockPlatform ||= waterMaskGrid[(y + 2) * WORLD_TILES + x + ring]! > 0;
          dockPlatform ||= waterMaskGrid[(y + ring) * WORLD_TILES + x - 1]! > 0;
          dockPlatform ||= waterMaskGrid[(y + ring) * WORLD_TILES + x + 2]! > 0;
        }
      }
    }
    expect(dockPlatform).toBe(true);
  });

  it('bakes non-empty, bounded infrastructure hooks without enabling gameplay', () => {
    // § Modelltreue 13.0 — WARUM NULL BRÜCKEN. Die Brückensuche verlangt auf
    // BEIDEN Ufern eine straßenfähige Kachel (Hang ≤ 0,8) und höchstens 2,5 m
    // Höhenunterschied. Auf der modelltreuen Klippeninsel trifft das an keiner
    // Wasserquerung zu — jede Kante ist eine Wand. Das ist kein fehlender Hook,
    // sondern die Geografie des Modells; gequert wird über die Höhenstraße
    // (`road_elevated`, I1), die genau dafür existiert und deren Kandidaten hier
    // als Viadukte auftauchen. Geprüft wird deshalb die Summe der
    // Querungshinweise, nicht eine einzelne Bauart.
    expect(bridgeCandidates.length + elevatedRoadCandidates.length).toBeGreaterThan(10);
    expect(elevatedRoadCandidates.length).toBeGreaterThan(0);
    expect(tunnelCandidates.length).toBeGreaterThan(0);
    expect(harborCandidates.length).toBeGreaterThan(0);
    expect(waterRouteNodes.length).toBeGreaterThan(100);
    expect(waterRouteEdges.length).toBeGreaterThan(waterRouteNodes.length);
    expect(harborCandidates.every((harbor) => harbor.regionId > 0)).toBe(true);
    for (const bridge of bridgeCandidates) {
      expect(bridge.span).toBeGreaterThanOrEqual(2);
      expect(bridge.start.x).toBeGreaterThanOrEqual(0);
      expect(bridge.end.x).toBeLessThan(WORLD_TILES);
    }
  });

  it('keeps every baked navigation edge on water', () => {
    const nodes = new Map(waterRouteNodes.map((node) => [node.id, node]));
    for (const edge of waterRouteEdges) {
      const from = nodes.get(edge.from);
      const to = nodes.get(edge.to);
      expect(from, edge.id).toBeDefined();
      expect(to, edge.id).toBeDefined();
      const samples = Math.max(2, Math.ceil(edge.length * 2));
      for (let sample = 0; sample <= samples; sample++) {
        const t = sample / samples;
        const x = Math.floor(from!.position.x + (to!.position.x - from!.position.x) * t);
        const y = Math.floor(from!.position.z + (to!.position.z - from!.position.z) * t);
        expect(waterMaskGrid[y * WORLD_TILES + x], `${edge.id} überquert Land bei ${x},${y}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('§ World Overhaul 12.0 §6 — spielerfreundliche Wasserhöhe und Küste', () => {
  it('legt die Wasseroberfläche auf Höhe der Uferflächen statt in eine Schlucht', () => {
    // Auftrag §6: „Die Wasseroberfläche soll ungefähr auf Höhe der Haupt-
    // Bauflächen liegen. Nicht wie eine tiefe Schlucht um die Insel." Gemessen
    // wird die Höhe JEDER Landkachel direkt an der Wasserkante über der
    // Wasserlinie (= 0). Der ganz überwiegende Teil muss flach auslaufen.
    const edgeHeights: number[] = [];
    for (let y = 1; y < WORLD_TILES - 1; y++) {
      for (let x = 1; x < WORLD_TILES - 1; x++) {
        const offset = y * WORLD_TILES + x;
        if (waterMaskGrid[offset]! > 0) continue;
        const touchesWater = waterMaskGrid[offset - 1]! > 0 || waterMaskGrid[offset + 1]! > 0
          || waterMaskGrid[offset - WORLD_TILES]! > 0 || waterMaskGrid[offset + WORLD_TILES]! > 0;
        if (touchesWater) edgeHeights.push(surfaceHeightGrid[offset]! / 100);
      }
    }
    expect(edgeHeights.length).toBeGreaterThan(2000);
    // § Modelltreue 13.0 — NEU AUSGERICHTET. Die ursprüngliche Forderung („> 85 %
    // der Uferkacheln flach") beschrieb ein Ziel, das nur das Terraforming
    // erreichen konnte: sie wurde erfüllt, indem JEDE Uferkante auf 0,24 m
    // heruntergezogen wurde — genau das, was der Spieler als „vom Modell
    // abweichend" gemeldet hat. Die Quell-GLB ist eine Klippeninsel; ihr Ufer
    // liegt zu zwei Dritteln flach und sonst auf echten Klippen.
    //
    // Was §6 wirklich verhindern soll, bleibt geprüft: das Wasser darf nicht in
    // einer Schlucht liegen. Dafür zählt der Median, nicht der Anteil.
    const gentle = edgeHeights.filter((height) => height <= 1.5).length;
    expect(gentle / edgeHeights.length).toBeGreaterThan(0.6);
    const median = [...edgeHeights].sort((a, b) => a - b)[Math.floor(edgeHeights.length / 2)]!;
    expect(median).toBeLessThan(1.5);
  });

  it('bietet reichlich vollständig bebaubare Bauplätze für 3×3- und 4×4-Gebäude', () => {
    // §11 „Platzierungslogik": Gebäude dürfen nicht schweben oder schief stehen.
    // Grundlage dafür sind großflächig zusammenhängende, ebene Bauflächen.
    const fits = (size: number) => {
      let count = 0;
      for (let y = 0; y + size <= WORLD_TILES; y++) {
        for (let x = 0; x + size <= WORLD_TILES; x++) {
          let ok = true;
          for (let dy = 0; dy < size && ok; dy++) {
            for (let dx = 0; dx < size; dx++) {
              if ((buildabilityGrid[(y + dy) * WORLD_TILES + x + dx]! & BUILDABLE_BIT) === 0) { ok = false; break; }
            }
          }
          if (ok) count++;
        }
      }
      return count;
    };
    // Alte Insel nach dem Map Flattening: ~30k 3×3-Plätze. Die neue Insel muss
    // mindestens gleichwertig bleiben.
    expect(fits(3)).toBeGreaterThan(28_000);
    expect(fits(4)).toBeGreaterThan(23_000);
  });
});

describe('§ World Overhaul 12.0 §4 — zentrale Startregion mit echten Startressourcen', () => {
  it('liegt zentral, flach, mit Wasserzugang und mehreren Expansionsrichtungen', () => {
    const start = BAKED_REGIONS.find((region) => region.id === BAKED_START.regionId);
    expect(start, 'Startregion fehlt im Bake').toBeDefined();
    // Zentral: der Regionsschwerpunkt liegt nahe am Schwerpunkt der Landmasse.
    expect(Math.hypot(
      start!.centroid.x - BAKED_WORLD.islandCenter.x,
      start!.centroid.y - BAKED_WORLD.islandCenter.y,
    )).toBeLessThan(45);
    // „Größte frühe zusammenhängende Baufläche": Zielkorridor des Bakes.
    expect(start!.buildable).toBeGreaterThanOrEqual(1200);
    expect(start!.buildable).toBeLessThanOrEqual(1750);
    // §4 „Wasser": echter Zugang zu Küste, See oder Fluss.
    expect(start!.coastTiles).toBeGreaterThan(0);
    // §4 „mehrere Expansionsrichtungen": Auf der modelltreuen Insel sind die
    // Regionen wenige und groß; ein zentraler 1.400-Kachel-Ausschnitt grenzt
    // deshalb an ZWEI von ihnen (Herzland und Nordwald). Die Forderung nach drei
    // direkten Nachbarn hätte den Start an den Inselrand gezwungen — gemessen
    // 94 statt 22 Kacheln vom Schwerpunkt. Zwei echte Nachbarn sind eine echte
    // Wahl, und das Herzland öffnet danach sechs weitere Richtungen.
    expect((start!.adjacent as readonly number[]).length).toBeGreaterThanOrEqual(2);
    // §4 „Holz": Wald in der Startregion selbst.
    expect(start!.terrain.forest).toBeGreaterThan(200);
  });

  it('erreicht jede Region — über Land, sonst nur mit ausgewiesener Hafenpflicht', () => {
    // § Modelltreue 13.0: Die Quell-GLB ist ein Archipel — eine große Landmasse
    // plus eine echte vorgelagerte Insel. Der frühere Test verlangte, dass JEDE
    // Region über Land erreichbar ist; das beschrieb die eingeebnete Welt.
    // Verbindlich ist jetzt das Stärkere: Was nicht über Land erreichbar ist,
    // MUSS in `regions.config.ts` als `requiresHarbor` ausgewiesen sein — sonst
    // wäre es eine dauerhaft gesperrte Region, die der Spieler nie versteht.
    const byId = new Map<number, (typeof BAKED_REGIONS)[number]>(
      BAKED_REGIONS.map((region) => [region.id, region]),
    );
    const reached = new Set<number>([BAKED_START.regionId]);
    const queue: number[] = [BAKED_START.regionId];
    while (queue.length > 0) {
      const current = byId.get(queue.shift()!)!;
      for (const neighbour of current.adjacent as readonly number[]) {
        if (reached.has(neighbour)) continue;
        reached.add(neighbour);
        queue.push(neighbour);
      }
    }
    for (const region of BAKED_REGIONS) {
      if (reached.has(region.id)) continue;
      const def = regionsConfig.find((entry) => entry.id === region.id);
      expect(def, `Region ${region.id} fehlt in regions.config`).toBeDefined();
      expect(def!.requiresHarbor, `Region ${region.id} ist nur über See erreichbar`).toBe(true);
      // Und sie muss wenigstens einen Seenachbarn haben, sonst ist auch ein
      // Hafen wirkungslos.
      expect((region.seaAdjacent as readonly number[]).length).toBeGreaterThan(0);
    }
    // Die große Landmasse bleibt zusammenhängend: höchstens die eine Insel fehlt.
    expect(reached.size).toBeGreaterThanOrEqual(BAKED_REGIONS.length - 1);
  });

  it('weist jeder Landkachel eine Region zu — es gibt kein totes Land', () => {
    // Verwaiste Landkacheln (Region 0) wären sichtbares Land, das der Spieler
    // nie betreten könnte. Der Bake sammelt sie in §7c-bis ein.
    let orphans = 0;
    for (let offset = 0; offset < WORLD_TILES * WORLD_TILES; offset++) {
      if (waterMaskGrid[offset]! > 0) continue;
      if (regionGrid[offset] === 0) orphans++;
    }
    expect(orphans).toBe(0);
  });
});
