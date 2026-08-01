/**
 * Rein visuelles City-Framing. Der Renderer liest die vorhandenen Footprints,
 * verändert aber weder Gebäude noch Karte. Ausreißer außerhalb des eigentlichen
 * Stadtkerns werden vor dem Aufruf ausgefiltert.
 */
export interface CityFrameFootprint {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CityFrame {
  x: number;
  z: number;
  dist: number;
}

export function deriveCityFrame(
  footprints: readonly CityFrameFootprint[],
  fallbackX: number,
  fallbackZ: number,
): CityFrame {
  if (footprints.length === 0) return { x: fallbackX, z: fallbackZ, dist: 34 };

  let minX = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  for (const footprint of footprints) {
    minX = Math.min(minX, footprint.x);
    minZ = Math.min(minZ, footprint.y);
    maxX = Math.max(maxX, footprint.x + footprint.w);
    maxZ = Math.max(maxZ, footprint.y + footprint.h);
  }

  const span = Math.max(maxX - minX, (maxZ - minZ) * 1.08);
  return {
    x: (minX + maxX) / 2,
    z: (minZ + maxZ) / 2,
    // Kleine Städte füllen sofort den Blick. Der Deckel verhindert, dass ein
    // wachsender Kern unbemerkt wieder zur weit entfernten Regionskarte wird.
    dist: Math.min(48, Math.max(34, span * 1.04 + 15)),
  };
}
