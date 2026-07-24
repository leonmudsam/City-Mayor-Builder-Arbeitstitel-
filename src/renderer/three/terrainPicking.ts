// Terrain-Picking (Core Gameplay 8.0 · G2 ①). Cursor → Bodenpunkt gegen das
// gebackene Höhenfeld statt gegen eine flache y=0-Ebene.
//
// Warum das nötig ist: Der alte Pfad raycastete gegen eine unsichtbare Ebene bei
// y = 0. Auf erhöhtem Gelände liegt der so getroffene Punkt um ~Höhe/tan(Kamera-
// winkel) daneben — Gebäude, Straßen und der Ghost landen auf der falschen Kachel.
// Das machte Bauen auf Hängen/Bergen praktisch unbrauchbar (Audit §2.1).
//
// Dieser Helfer ist ABSICHTLICH frei von three.js: er bekommt einen Strahl als
// nackte Zahlen und einen Höhen-Sampler (in der Praxis `terrainHeightAt` — die
// EINZIGE Bodenhöhenquelle, CLAUDE.md) und ist damit deterministisch unit-testbar.

/** Strahl in Weltkoordinaten (Ursprung o, Richtung d; d muss nicht normiert sein). */
export interface PickRay {
  ox: number;
  oy: number;
  oz: number;
  dx: number;
  dy: number;
  dz: number;
}

export interface HeightfieldPickOptions {
  /** Untere Bandgrenze (unter dem tiefsten Terrain, z. B. Ozeanboden). */
  minY: number;
  /** Obere Bandgrenze (über dem höchsten Gipfel). */
  maxY: number;
  /** Schrittweite entlang des Strahls (Welteinheiten). Default 0.5. */
  step?: number;
  /** Binäre Verfeinerungs-Iterationen nach dem Bracketing. Default 6. */
  refine?: number;
  /** Sicherheits-Obergrenze der Marschstrecke (Welteinheiten). Default 6000. */
  maxDistance?: number;
  /** Unter diesem |dy| gilt der Strahl als zu flach fürs Band-Clamping. Default 1e-3. */
  grazingDy?: number;
}

/**
 * Marschiert einen Strahl gegen ein Höhenfeld und liefert den ersten Boden-
 * Schnittpunkt als Weltkoordinate `{ x, z }` (die Höhe selbst interessiert den
 * Aufrufer nicht — er will die Kachel darunter).
 *
 * `sample(x, z)` liefert die Bodenhöhe (y) an einem Weltpunkt. Wir suchen den
 * ersten `t`, bei dem der Strahl von „über dem Boden" nach „unter dem Boden"
 * wechselt (Vorzeichenwechsel von `p.y - sample(p.x, p.z)`), und verfeinern die
 * Fundstelle binär. Das Suchband wird über [minY, maxY] auf die Terrain-Schale
 * geklemmt, damit nur wenige Dutzend Samples nötig sind.
 *
 * Liefert `undefined`, wenn der Strahl das Terrain nicht schneidet (z. B. in den
 * Himmel zeigt) — dann kann der Aufrufer auf eine Ebene zurückfallen.
 */
export function raycastHeightfield(
  ray: PickRay,
  sample: (x: number, z: number) => number,
  opts: HeightfieldPickOptions,
): { x: number; z: number } | undefined {
  const len = Math.hypot(ray.dx, ray.dy, ray.dz);
  if (!(len > 0)) return undefined;
  const dx = ray.dx / len;
  const dy = ray.dy / len;
  const dz = ray.dz / len;

  const step = opts.step ?? 0.5;
  const refine = opts.refine ?? 6;
  const maxDistance = opts.maxDistance ?? 6000;
  const grazingDy = opts.grazingDy ?? 1e-3;

  // Vertikales Suchband auf die Terrain-Schale eingrenzen. Bei zu flachem Strahl
  // ist das Band-Clamping instabil → geradeaus bis maxDistance marschieren.
  let tEnter = 0;
  let tExit = maxDistance;
  if (Math.abs(dy) >= grazingDy) {
    const tTop = (opts.maxY - ray.oy) / dy;
    const tBot = (opts.minY - ray.oy) / dy;
    tEnter = Math.max(0, Math.min(tTop, tBot));
    tExit = Math.min(maxDistance, Math.max(tTop, tBot));
    if (tExit <= tEnter) return undefined; // Band liegt hinter der Kamera.
  }

  const at = (t: number) => ({ x: ray.ox + dx * t, y: ray.oy + dy * t, z: ray.oz + dz * t });
  const signedGap = (t: number) => {
    const p = at(t);
    return p.y - sample(p.x, p.z);
  };

  let tPrev = tEnter;
  // Startet der Strahl bereits im/unter dem Boden, ist der Eintrittspunkt die Lösung.
  if (signedGap(tPrev) <= 0) {
    const p = at(tPrev);
    return { x: p.x, z: p.z };
  }

  for (let t = tEnter + step; t <= tExit + step; t += step) {
    const tc = Math.min(t, tExit);
    if (signedGap(tc) <= 0) {
      // Vorzeichenwechsel zwischen tPrev (über Boden) und tc (unter Boden):
      // binär auf die Oberfläche verfeinern.
      let lo = tPrev; // gap > 0
      let hi = tc; // gap <= 0
      for (let i = 0; i < refine; i++) {
        const mid = (lo + hi) * 0.5;
        if (signedGap(mid) > 0) lo = mid;
        else hi = mid;
      }
      const p = at((lo + hi) * 0.5);
      return { x: p.x, z: p.z };
    }
    tPrev = tc;
    if (tc >= tExit) break;
  }

  return undefined;
}
