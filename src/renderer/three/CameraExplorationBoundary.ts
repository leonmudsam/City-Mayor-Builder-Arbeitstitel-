// CameraExplorationBoundary (§ Change 9.0, Phase S3/S3b) — hält die Kamera über
// den bereits freigeschalteten Regionen. Reines Datenmodell + Mathematik (kein
// three.js, kein React), damit `CameraController3D` und seine Tests es frei
// importieren können (siehe tests/camera.test.ts).
//
// Modell aus dem Auftrag §7: die zulässige Target-Fläche ist die Union der
// freigeschalteten Regionen zuzüglich eines weichen Randbandes. Nähert sich das
// Kamera-Ziel der Grenze, wird es gebremst (`slow` → 0) und jenseits der harten
// Grenze weich auf den Rand zurückgeführt — kein harter Stoß, weil der Controller
// den aktuellen Zustand ohnehin zum Ziel east.

/** Ergebnis einer Grenzabfrage für ein Kamera-Ziel in Weltkoordinaten. */
export interface BoundaryConstraint {
  /** Zulässige (ggf. zurückgeführte) X-Zielkoordinate. */
  x: number;
  /** Zulässige (ggf. zurückgeführte) Z-Zielkoordinate. */
  z: number;
  /** 1 = tief im freigeschalteten Gebiet (volle Geschwindigkeit), 0 = an/hinter
   *  der harten Grenze (gestoppt). Dazwischen linear im weichen Randband. */
  slow: number;
}

export interface CameraExplorationBoundaryOptions {
  /** Kantenlänge der (quadratischen) Welt in Kacheln. */
  worldTiles: number;
  /** Ist die Kachel Teil der freigeschalteten Union? */
  allowed: (tileX: number, tileY: number) => boolean;
  /** Ab hier (Weltdistanz zur Union) beginnt das Abbremsen. */
  softDistance?: number;
  /** Hinter dieser Weltdistanz wird das Ziel zurückgeführt. */
  hardDistance?: number;
  /** Kachel-Rasterung des Distanzfelds (>1 = gröber/schneller). */
  step?: number;
}

/**
 * Distanzgestützte Kamera-Grenze. Beim Bauen wird einmal ein Nearest-Feature-Feld
 * (nächstgelegene freigeschaltete Rasterzelle je Zelle) über einen 2-Pass-Chamfer
 * berechnet; `constrain` ist danach O(1). Neu gebaut wird nur bei einem Unlock.
 */
export class CameraExplorationBoundary {
  private readonly gw: number;
  private readonly gh: number;
  private readonly step: number;
  private readonly soft: number;
  private readonly hard: number;
  /** Nächstgelegene erlaubte Zelle je Rasterzelle (Rasterkoordinaten). */
  private readonly nearX: Int16Array;
  private readonly nearY: Int16Array;
  private readonly hasAllowed: boolean;

  constructor(options: CameraExplorationBoundaryOptions) {
    const step = Math.max(1, Math.floor(options.step ?? 4));
    this.step = step;
    this.soft = options.softDistance ?? 10;
    this.hard = options.hardDistance ?? 16;
    const cells = Math.ceil(options.worldTiles / step);
    this.gw = cells;
    this.gh = cells;
    this.nearX = new Int16Array(cells * cells).fill(-1);
    this.nearY = new Int16Array(cells * cells).fill(-1);

    // Seed: jede Rasterzelle, deren Kachelmittelpunkt freigeschaltet ist, zeigt auf
    // sich selbst (Distanz 0). Nur eine Stichprobe je Zelle — das genügt für eine
    // weiche Kamera-Grenze mit mehreren Kacheln Randband.
    let any = false;
    for (let gy = 0; gy < cells; gy++) {
      for (let gx = 0; gx < cells; gx++) {
        const tx = Math.min(options.worldTiles - 1, gx * step + (step >> 1));
        const ty = Math.min(options.worldTiles - 1, gy * step + (step >> 1));
        if (options.allowed(tx, ty)) {
          const i = gy * cells + gx;
          this.nearX[i] = gx;
          this.nearY[i] = gy;
          any = true;
        }
      }
    }
    this.hasAllowed = any;
    if (any) this.computeNearestField();
  }

  /** 4SED-artiger 2-Pass-Chamfer: propagiert die nächstgelegene Quelle. */
  private computeNearestField(): void {
    const { gw, gh, nearX, nearY } = this;
    const distSq = (i: number, gx: number, gy: number): number => {
      const sx = nearX[i]!;
      if (sx < 0) return Number.POSITIVE_INFINITY;
      const dx = gx - sx;
      const dy = gy - nearY[i]!;
      return dx * dx + dy * dy;
    };
    const relax = (i: number, from: number, gx: number, gy: number): void => {
      const sx = nearX[from]!;
      if (sx < 0) return;
      const dx = gx - sx;
      const dy = gy - nearY[from]!;
      if (dx * dx + dy * dy < distSq(i, gx, gy)) {
        nearX[i] = sx;
        nearY[i] = nearY[from]!;
      }
    };
    // Vorwärts: von links/oben.
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const i = gy * gw + gx;
        if (gx > 0) relax(i, i - 1, gx, gy);
        if (gy > 0) relax(i, i - gw, gx, gy);
        if (gx > 0 && gy > 0) relax(i, i - gw - 1, gx, gy);
        if (gx + 1 < gw && gy > 0) relax(i, i - gw + 1, gx, gy);
      }
    }
    // Rückwärts: von rechts/unten.
    for (let gy = gh - 1; gy >= 0; gy--) {
      for (let gx = gw - 1; gx >= 0; gx--) {
        const i = gy * gw + gx;
        if (gx + 1 < gw) relax(i, i + 1, gx, gy);
        if (gy + 1 < gh) relax(i, i + gw, gx, gy);
        if (gx + 1 < gw && gy + 1 < gh) relax(i, i + gw + 1, gx, gy);
        if (gx > 0 && gy + 1 < gh) relax(i, i + gw - 1, gx, gy);
      }
    }
  }

  /** Zulässiges Ziel + Bremsfaktor für ein gewünschtes Kamera-Ziel. */
  constrain(x: number, z: number): BoundaryConstraint {
    if (!this.hasAllowed) return { x, z, slow: 1 };
    const { step, gw, gh } = this;
    const gx = Math.max(0, Math.min(gw - 1, Math.round(x / step)));
    const gz = Math.max(0, Math.min(gh - 1, Math.round(z / step)));
    const i = gz * gw + gx;
    const sxCell = this.nearX[i]!;
    if (sxCell < 0) return { x, z, slow: 1 };
    // Weltmittelpunkt der nächstgelegenen erlaubten Zelle.
    const sx = sxCell * step + (step >> 1);
    const sz = this.nearY[i]! * step + (step >> 1);
    const dx = x - sx;
    const dz = z - sz;
    const dist = Math.hypot(dx, dz);
    if (dist <= this.hard) {
      const slow = dist <= this.soft ? 1 : Math.max(0, 1 - (dist - this.soft) / Math.max(0.001, this.hard - this.soft));
      return { x, z, slow };
    }
    // Jenseits der harten Grenze: auf den harten Ring um die Quelle zurückführen.
    const f = this.hard / (dist || 1);
    return { x: sx + dx * f, z: sz + dz * f, slow: 0 };
  }
}
