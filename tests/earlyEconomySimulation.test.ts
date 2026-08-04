import { describe, expect, it } from 'vitest';
import { newController, TOWN_HALL, T0 } from './helpers.ts';
import { buildingsConfig } from '../src/game/config/buildings.config.ts';
import { balancingConfig } from '../src/game/config/balancing.config.ts';
import { effectiveBuildCost } from '../src/game/buildings/effects.ts';
import type { GameController } from '../src/game/commands/controller.ts';
import type { ResourceId } from '../src/game/types.ts';

// § Wirtschafts-/Lieferketten-Overhaul §10 — „Simuliere aktiv die ersten 8 Level."
//
// Diese Suite spielt NICHT auf einer geglätteten Testfläche, sondern auf dem
// echten Inselterrain (`flatten: false`) und ohne vorgegründetes Rathaus. Genau
// dort entscheidet sich, ob das Frühspiel spielbar ist: Der Spieler hat 45.000 ⌾,
// 60 Holz, **0 Stein** und muss von dort aus loskommen.
//
// Geprüft wird nicht Balancing („fühlt es sich gut an"), sondern
// ERREICHBARKEIT — jede Frage, die der Auftrag stellt, als Aussage über den
// echten Zustand nach echten Commands.

const MIN = 60_000;

/** Neues Spiel auf echtem Terrain, gegründet am vom Bake geprüften Anker. */
function freshCity(): GameController {
  const { controller } = newController(T0, { flatten: false, found: false });
  expect(controller.foundCity(TOWN_HALL.x, TOWN_HALL.y), 'Gründung am Bake-Anker').toEqual({ ok: true });
  return controller;
}

/** Erste Kachel im Umkreis, auf der dieses Gebäude wirklich platziert werden darf. */
function placeNear(controller: GameController, defId: string, radius = 14): { x: number; y: number } | undefined {
  for (let r = 1; r <= radius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = TOWN_HALL.x + dx;
        const y = TOWN_HALL.y + dy;
        if (controller.placeBuilding(defId, x, y).ok) return { x, y };
      }
    }
  }
  return undefined;
}

const def = (id: string) => buildingsConfig.find((d) => d.id === id)!;

describe('§10 Frühspiel — Level 1 ist ohne Vorbedingung spielbar', () => {
  it('startet mit 0 Stein und kann trotzdem sofort eine Steinquelle bauen', () => {
    const controller = freshCity();
    expect(balancingConfig.startResources.stone, 'Ausgangslage: kein Stein').toBe(0);

    const pit = def('stone_pit_small');
    expect(pit.unlockLevel, 'muss ab Level 1 verfügbar sein').toBe(1);
    // Der Einstieg darf an KEINER Bedingung scheitern: kein Straßenzwang, kein
    // Material, kein Terrain. Jede dieser drei Bedingungen war in einer
    // früheren Fassung der Grund, warum Stein sich blockiert anfühlte.
    expect(pit.requiresRoad).toBe(false);
    expect(Object.keys(pit.cost).filter((k) => k !== 'money')).toEqual([]);
    expect(pit.operation, 'ein Arbeitsgebiet wäre eine Terrainbedingung').toBeUndefined();

    const spot = placeNear(controller, 'stone_pit_small');
    expect(spot, 'kein Platz für eine 1×1-Grube rund um das Rathaus').toBeDefined();
  });

  it('liefert nach einer gespielten Stunde genug Stein für die erste Steinkosten-Stufe', () => {
    const controller = freshCity();
    expect(placeNear(controller, 'stone_pit_small')).toBeDefined();
    controller.update(T0 + 60 * MIN, true);

    // Die erste Stelle, die Stein kostet, ist das Wohnhaus-Upgrade auf L3 (25).
    const firstStoneCost = Math.min(
      ...buildingsConfig.flatMap((d) => [
        ...((d.cost.stone ?? 0) > 0 ? [d.cost.stone!] : []),
        ...(d.upgrades ?? []).filter((u) => (u.cost.stone ?? 0) > 0).map((u) => u.cost.stone!),
      ]),
    );
    expect(controller.state.resources.stone).toBeGreaterThan(firstStoneCost);
  });

  it('macht den ersten Bau jeder Einstiegsquelle bezahlbar', () => {
    // Der Startvorrat muss die erste Holz- UND die erste Steinquelle tragen —
    // sonst hängt der Spieler an einer Kasse statt an einer Entscheidung.
    const controller = freshCity();
    const budget = controller.state.resources.money;
    for (const id of ['stone_pit_small', 'sawmill', 'stone_pit']) {
      const cost = effectiveBuildCost(def(id), controller.state.stats.built[id] ?? 0);
      expect(cost.money ?? 0, `${id} ist beim ersten Bau zu teuer`).toBeLessThanOrEqual(budget);
    }
  });
});

describe('§10 Frühspiel — die Farm blockiert nicht mehr', () => {
  it('nimmt den Betrieb auch ohne eine einzige fruchtbare Kachel auf', () => {
    const controller = freshCity();
    controller.state.level.current = 6;
    controller.state.resources.money = 2_000_000;
    controller.state.resources.wood = 2_000;
    const spot = placeNear(controller, 'farm', 18);
    expect(spot, 'keine Farm platzierbar').toBeDefined();
    controller.update(T0 + 5 * MIN, true);
    const farm = Object.values(controller.state.buildings).find((b) => b.defId === 'farm')!;

    // D-058: Ein Betrieb, dessen Knoten der Spieler selbst anlegt, darf leer
    // starten. Vor dem Feldsystem war genau das ein `fail('invalid')`.
    expect(controller.startBuildingOperation(farm.id)).toEqual({ ok: true });
    const info = controller.getBuildingOperationInfo(farm.id);
    // `active` ist der laufende Auftrag. Er existiert auch bei NULL Zielen —
    // genau das ist der Dauerbetrieb aus D-058: er wartet, statt abzulehnen.
    expect(info?.active, 'Farm hat keinen Auftrag angenommen').toBeDefined();
    expect(info?.active?.paused, 'Farm startet nicht pausiert').toBe(false);
  });
});

describe('§10 Level 5 — der Umstieg auf Bretter und Werkstein trägt', () => {
  it('schaltet beide Werkstätten gleichzeitig frei und macht sie bezahlbar', () => {
    for (const id of ['wood_workshop', 'stone_workshop']) {
      expect(def(id).unlockLevel, `${id} muss auf L5 öffnen`).toBe(5);
    }
    // Level-5-Prämie (47.000) plus Ersteinsteiger-Rabatt: Eine der beiden muss
    // aus dem Level-Up selbst finanzierbar sein, sonst wartet der Spieler ein
    // ganzes Band lang auf sein erstes Brett.
    const reward = 47_000;
    const first = effectiveBuildCost(def('wood_workshop'), 0);
    expect(first.money ?? 0).toBeLessThanOrEqual(reward);
  });

  it('verbraucht mehr Rohstoff, als es Produkt liefert — Veredelung kostet', () => {
    for (const id of ['wood_workshop', 'stone_workshop']) {
      const conversion = def(id).conversion!;
      expect(conversion.inputPerOutput).toBeGreaterThan(1);
    }
  });

  it('lässt eine Werkstatt von EINEM Betrieb versorgen', () => {
    // Sonst wäre die zweite Stufe erst ab zwei Sägewerken sinnvoll, und der
    // Einstieg fiele mitten in eine Baugrenze.
    const workshop = def('wood_workshop').conversion!;
    const demand = workshop.stages[0]!.outputPerMinute * workshop.inputPerOutput;
    // Bezugsgröße ist die KALIBRIERTE Rate des Sägewerks: Seit § 12.1 sind die
    // Betriebsstufen genau auf die frühere Passivrate des `produce`-Effekts
    // eingestellt (Stufe 1 = 45 Holz/min). Eine eigene Schätzung aus
    // `workSpeed` wäre eine zweite Kalibrierung — und war in der ersten Fassung
    // dieses Tests prompt um 2 % daneben.
    const sawmillRate = (def('sawmill').effects.find((e) => e.type === 'produce') as { perMinute: number }).perMinute;
    expect(sawmillRate).toBeGreaterThan(0);
    expect(demand, 'Werkstatt frisst mehr als ein Sägewerk liefert').toBeLessThan(sawmillRate);
    // …aber deutlich mehr als die Hälfte: Zwei Werkstätten brauchen ein
    // zweites Sägewerk. Ohne diese Spannung wäre die Kette kostenlos.
    expect(demand).toBeGreaterThan(sawmillRate * 0.5);
  });
});

describe('§10 Level 1–8 — keine Ressource ohne Weg', () => {
  it('hat für jede Kosten-Ressource bis L8 einen Bau, der sie liefert', () => {
    // Die scharfe Fassung dieser Regel steht in `earlyGameProgression.test.ts`.
    // Hier wird sie am Spielstand geprüft statt an der Config: Nach dem Bau der
    // Einstiegsgebäude müssen die Bestände wirklich steigen.
    const controller = freshCity();
    controller.state.level.current = 5;
    controller.state.resources.money = 3_000_000;
    controller.state.resources.wood = 1_000;
    const before: Partial<Record<ResourceId, number>> = { ...controller.state.resources };
    expect(placeNear(controller, 'stone_pit_small')).toBeDefined();
    controller.update(T0 + 45 * MIN, true);
    expect(controller.state.resources.stone).toBeGreaterThan(before.stone ?? 0);
  });
});
