/**
 * Reine Geometrievorbereitung für ruhige Küstenkonturen.
 *
 * Das Welt-Grid bleibt die einzige Wahrheit. Marching Squares verschiebt die
 * sichtbare Kontur lediglich zwischen die Kachelmittelpunkte; dadurch entsteht
 * aus der Treppenkante ein zusammenhängender, diagonalfähiger Saum, ohne eine
 * zweite Wasser- oder Terrainmaske einzuführen.
 */

export interface ShorePoint {
  x: number;
  z: number;
}

export interface ShoreSegment {
  a: ShorePoint;
  b: ShorePoint;
}

export interface ShoreChain {
  points: ShorePoint[];
  closed: boolean;
}

type GridSampler = (x: number, y: number) => boolean;

const samePoint = (a: ShorePoint, b: ShorePoint): boolean =>
  Math.abs(a.x - b.x) < 0.0001 && Math.abs(a.z - b.z) < 0.0001;

const pointKey = (point: ShorePoint): string => `${point.x.toFixed(3)},${point.z.toFixed(3)}`;

/**
 * Erzeugt Kontursegmente zwischen Wasser- und Land-Kachelzentren.
 * Die beiden Sattel-Fälle werden als zwei getrennte, nicht kreuzende Bögen
 * aufgelöst; kleine Inseln und Flussmündungen bleiben dadurch lesbar.
 */
export function marchingShoreSegments(
  width: number,
  height: number,
  waterAt: GridSampler,
): ShoreSegment[] {
  if (width < 2 || height < 2) return [];
  const segments: ShoreSegment[] = [];
  const add = (a: ShorePoint, b: ShorePoint): void => {
    segments.push({ a, b });
  };

  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const topLeft = waterAt(x, y);
      const topRight = waterAt(x + 1, y);
      const bottomRight = waterAt(x + 1, y + 1);
      const bottomLeft = waterAt(x, y + 1);
      const mask =
        Number(topLeft) |
        (Number(topRight) << 1) |
        (Number(bottomRight) << 2) |
        (Number(bottomLeft) << 3);
      if (mask === 0 || mask === 15) continue;

      // Kachelmittelpunkte liegen bei +0,5. Die Kontur schneidet jeweils die
      // Mitte der Verbindung zweier benachbarter Samples.
      const top = { x: x + 1, z: y + 0.5 };
      const right = { x: x + 1.5, z: y + 1 };
      const bottom = { x: x + 1, z: y + 1.5 };
      const left = { x: x + 0.5, z: y + 1 };

      switch (mask) {
        case 1: add(left, top); break;
        case 2: add(top, right); break;
        case 3: add(left, right); break;
        case 4: add(right, bottom); break;
        case 5:
          add(left, top);
          add(right, bottom);
          break;
        case 6: add(top, bottom); break;
        case 7: add(left, bottom); break;
        case 8: add(bottom, left); break;
        case 9: add(top, bottom); break;
        case 10:
          add(top, right);
          add(bottom, left);
          break;
        case 11: add(right, bottom); break;
        case 12: add(left, right); break;
        case 13: add(top, right); break;
        case 14: add(left, top); break;
      }
    }
  }
  return segments;
}

/** Verbindet die Marching-Squares-Segmente zu offenen oder geschlossenen Linien. */
export function traceShoreChains(segments: readonly ShoreSegment[]): ShoreChain[] {
  const adjacency = new Map<string, number[]>();
  const addAdjacent = (point: ShorePoint, index: number): void => {
    const key = pointKey(point);
    const list = adjacency.get(key);
    if (list) list.push(index);
    else adjacency.set(key, [index]);
  };
  segments.forEach((segment, index) => {
    addAdjacent(segment.a, index);
    addAdjacent(segment.b, index);
  });

  const visited = new Set<number>();
  const chains: ShoreChain[] = [];
  const walk = (startIndex: number, startPoint: ShorePoint): ShoreChain => {
    const points = [{ ...startPoint }];
    let segmentIndex = startIndex;
    let current = startPoint;
    let closed = false;

    while (!visited.has(segmentIndex)) {
      visited.add(segmentIndex);
      const segment = segments[segmentIndex]!;
      const next = samePoint(current, segment.a) ? segment.b : segment.a;
      points.push({ ...next });
      if (points.length > 2 && samePoint(next, points[0]!)) {
        closed = true;
        break;
      }
      current = next;
      const candidates = adjacency.get(pointKey(current)) ?? [];
      const nextSegment = candidates.find((candidate) => !visited.has(candidate));
      if (nextSegment === undefined) break;
      segmentIndex = nextSegment;
    }
    return { points, closed };
  };

  // Offene Enden zuerst; anschließend bleiben ausschließlich geschlossene Ringe.
  segments.forEach((segment, index) => {
    if (visited.has(index)) return;
    const degreeA = adjacency.get(pointKey(segment.a))?.length ?? 0;
    const degreeB = adjacency.get(pointKey(segment.b))?.length ?? 0;
    if (degreeA !== 2 || degreeB !== 2) {
      chains.push(walk(index, degreeA !== 2 ? segment.a : segment.b));
    }
  });
  segments.forEach((segment, index) => {
    if (!visited.has(index)) chains.push(walk(index, segment.a));
  });
  return chains.filter((chain) => chain.points.length >= 2);
}

/**
 * Eine Chaikin-Runde nimmt den harten Grid-Knick heraus, bewahrt aber die
 * Topologie. Für geschlossene Küsten wird der letzte Punkt wieder exakt an den
 * ersten geheftet, damit im Schaum kein Spalt entsteht.
 */
export function smoothShoreChain(chain: ShoreChain, iterations = 1): ShoreChain {
  let points = chain.closed && samePoint(chain.points[0]!, chain.points.at(-1)!)
    ? chain.points.slice(0, -1)
    : [...chain.points];

  for (let iteration = 0; iteration < iterations && points.length >= 3; iteration++) {
    const next: ShorePoint[] = [];
    if (!chain.closed) next.push(points[0]!);
    const edgeCount = chain.closed ? points.length : points.length - 1;
    for (let index = 0; index < edgeCount; index++) {
      const a = points[index]!;
      const b = points[(index + 1) % points.length]!;
      next.push(
        { x: a.x * 0.75 + b.x * 0.25, z: a.z * 0.75 + b.z * 0.25 },
        { x: a.x * 0.25 + b.x * 0.75, z: a.z * 0.25 + b.z * 0.75 },
      );
    }
    if (!chain.closed) next.push(points.at(-1)!);
    points = next;
  }

  if (chain.closed && points.length > 0) points.push({ ...points[0]! });
  return { points, closed: chain.closed };
}
