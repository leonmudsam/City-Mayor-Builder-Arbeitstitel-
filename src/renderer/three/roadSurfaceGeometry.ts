/**
 * Reine Geometriehelfer für das sichtbare Straßennetz. Keine Three-, State-
 * oder Controller-Abhängigkeit: Dadurch lässt sich insbesondere die
 * Dreiecksorientierung testen, bevor WebGL Backfaces verwirft.
 */

export interface RoadSurfacePoint {
  x: number;
  z: number;
}

export type RoadHeightSampler = (x: number, z: number) => number;

/**
 * Ersetzt die überschwingende Spline durch lokal gerundete Rasterecken.
 * Gerade Abschnitte bleiben wirklich gerade; nur an einem Richtungswechsel
 * entsteht ein kurzer quadratischer Bogen.
 */
export function roundedRoadPolyline(
  points: readonly RoadSurfacePoint[],
  radius = 0.28,
  cornerSegments = 4,
): RoadSurfacePoint[] {
  if (points.length < 3) return points.map((point) => ({ ...point }));
  const output: RoadSurfacePoint[] = [{ ...points[0]! }];
  const segmentCount = Math.max(2, Math.floor(cornerSegments));

  for (let index = 1; index < points.length - 1; index++) {
    const previous = points[index - 1]!;
    const corner = points[index]!;
    const next = points[index + 1]!;
    const inLength = Math.hypot(corner.x - previous.x, corner.z - previous.z);
    const outLength = Math.hypot(next.x - corner.x, next.z - corner.z);
    if (inLength < 0.001 || outLength < 0.001) continue;
    const inX = (corner.x - previous.x) / inLength;
    const inZ = (corner.z - previous.z) / inLength;
    const outX = (next.x - corner.x) / outLength;
    const outZ = (next.z - corner.z) / outLength;
    const dot = inX * outX + inZ * outZ;
    if (dot > 0.998 || dot < -0.998) {
      output.push({ ...corner });
      continue;
    }
    const localRadius = Math.min(radius, inLength * 0.34, outLength * 0.34);
    const approach = {
      x: corner.x - inX * localRadius,
      z: corner.z - inZ * localRadius,
    };
    const exit = {
      x: corner.x + outX * localRadius,
      z: corner.z + outZ * localRadius,
    };
    output.push(approach);
    for (let segment = 1; segment <= segmentCount; segment++) {
      const t = segment / segmentCount;
      const inverse = 1 - t;
      output.push({
        x: inverse * inverse * approach.x + 2 * inverse * t * corner.x + t * t * exit.x,
        z: inverse * inverse * approach.z + 2 * inverse * t * corner.z + t * t * exit.z,
      });
    }
  }
  output.push({ ...points.at(-1)! });
  return output;
}

/**
 * Verlängert einen Bodenweg bis minimal über die gemeinsame Kachelkante.
 * Brücken und Höhenstraßen beginnen erst dort; ohne diesen kurzen Anschluss
 * bleibt zwischen der runden Endfläche und ihrem Deck eine sichtbare Lücke.
 */
export function roadTileEdgeConnector(
  center: RoadSurfacePoint,
  directionX: number,
  directionZ: number,
): [RoadSurfacePoint, RoadSurfacePoint] {
  const length = Math.hypot(directionX, directionZ);
  if (length < 0.001) return [{ ...center }, { ...center }];
  const overlap = 0.515;
  return [
    { ...center },
    {
      x: center.x + (directionX / length) * overlap,
      z: center.z + (directionZ / length) * overlap,
    },
  ];
}

export function appendRoadRibbonTriangles(
  target: number[],
  points: readonly RoadSurfacePoint[],
  halfWidth: number,
  lift: number,
  heightAt: RoadHeightSampler,
): void {
  appendVariableRibbonTriangles(
    target,
    points,
    points.map(() => halfWidth),
    lift,
    heightAt,
  );
}

/**
 * Wie `appendRoadRibbonTriangles`, aber mit einer Breite je Konturpunkt.
 * Der Küstensaum kann dadurch lokal breit an flachen Stränden und schmal an
 * Klippen sein, ohne komplette Inselkonturen pauschal gleich zu behandeln.
 */
export function appendVariableRibbonTriangles(
  target: number[],
  points: readonly RoadSurfacePoint[],
  halfWidths: readonly number[],
  lift: number,
  heightAt: RoadHeightSampler,
): void {
  if (points.length < 2) return;
  const slices = points.map((point, index) => {
    const before = points[Math.max(0, index - 1)]!;
    const after = points[Math.min(points.length - 1, index + 1)]!;
    const tx = after.x - before.x;
    const tz = after.z - before.z;
    const length = Math.max(0.001, Math.hypot(tx, tz));
    const nx = -tz / length;
    const nz = tx / length;
    const halfWidth = halfWidths[index] ?? halfWidths.at(-1) ?? 0;
    const lx = point.x + nx * halfWidth;
    const lz = point.z + nz * halfWidth;
    const rx = point.x - nx * halfWidth;
    const rz = point.z - nz * halfWidth;
    return {
      lx,
      lz,
      ly: heightAt(lx, lz) + lift,
      rx,
      rz,
      ry: heightAt(rx, rz) + lift,
    };
  });

  for (let index = 0; index < slices.length - 1; index++) {
    const a = slices[index]!;
    const b = slices[index + 1]!;
    // Oberseite gegen den Uhrzeigersinn: Normalen zeigen zu +Y und bleiben aus
    // der üblichen schrägen Spielkamera sichtbar.
    target.push(
      a.lx, a.ly, a.lz,
      b.lx, b.ly, b.lz,
      b.rx, b.ry, b.rz,
      a.lx, a.ly, a.lz,
      b.rx, b.ry, b.rz,
      a.rx, a.ry, a.rz,
    );
  }
}

export function appendRoadDiscTriangles(
  target: number[],
  center: RoadSurfacePoint,
  radius: number,
  lift: number,
  heightAt: RoadHeightSampler,
  segments = 18,
): void {
  const centerY = heightAt(center.x, center.z) + lift;
  for (let index = 0; index < segments; index++) {
    const a0 = (index / segments) * Math.PI * 2;
    const a1 = ((index + 1) / segments) * Math.PI * 2;
    const x0 = center.x + Math.cos(a0) * radius;
    const z0 = center.z + Math.sin(a0) * radius;
    const x1 = center.x + Math.cos(a1) * radius;
    const z1 = center.z + Math.sin(a1) * radius;
    target.push(
      center.x, centerY, center.z,
      x1, heightAt(x1, z1) + lift, z1,
      x0, heightAt(x0, z0) + lift, z0,
    );
  }
}
