// Map projection (v0.27, iso step 1). The single source of truth for turning
// logical tile coordinates into on-screen world coordinates and back. The game
// logic never imports this — it deals purely in tile coordinates; only the
// renderer (and the placement ghost / hit-testing it drives) projects.
//
// Two modes today:
//   flat2d       — the original top-down grid: tile (tx,ty) → (tx*TILE, ty*TILE).
//   isometric2d  — a 2:1 isometric diamond grid, tile centre at
//                  ((tx-ty)*isoW/2, (tx+ty)*isoH/2).
//
// Camera pan/zoom is handled by the Pixi `world` container's position/scale, so
// projection only ever converts within world space — pan/zoom stay mode-agnostic.

export type RenderMode = 'flat2d' | 'isometric2d';

/** Flat-grid tile size in world px (unchanged from the original renderer). */
export const TILE = 32;

/** Isometric tuning — 2:1 diamonds. `elevation` = world px of extrusion per height unit. */
export const ISO = {
  tileW: 64,
  tileH: 32,
  elevation: 14,
} as const;

/** World point for the CENTRE of tile (tx,ty). Flat returns the tile's top-left. */
export function tileCenterWorld(mode: RenderMode, tx: number, ty: number): { x: number; y: number } {
  if (mode === 'isometric2d') {
    return { x: (tx - ty) * (ISO.tileW / 2), y: (tx + ty) * (ISO.tileH / 2) };
  }
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

/** World point for the centre of a footprint (x,y,w,h). Used for camera framing. */
export function footprintCenterWorld(
  mode: RenderMode,
  x: number,
  y: number,
  w: number,
  h: number,
): { x: number; y: number } {
  if (mode === 'isometric2d') {
    return tileCenterWorld(mode, x + (w - 1) / 2, y + (h - 1) / 2);
  }
  return { x: (x + w / 2) * TILE, y: (y + h / 2) * TILE };
}

/** The four world-space corners of a single tile's iso diamond, as a flat poly. */
export function isoTileDiamond(tx: number, ty: number): number[] {
  const c = tileCenterWorld('isometric2d', tx, ty);
  const hw = ISO.tileW / 2;
  const hh = ISO.tileH / 2;
  // top, right, bottom, left
  return [c.x, c.y - hh, c.x + hw, c.y, c.x, c.y + hh, c.x - hw, c.y];
}

/**
 * The four world-space corners of a whole footprint's base diamond (x,y,w,h):
 * top = tile(x,y) top, right = tile(x+w-1,y) right, bottom = tile(x+w-1,y+h-1)
 * bottom, left = tile(x,y+h-1) left. Used for the placeholder building base,
 * the ghost and the selection outline.
 */
export function isoFootprintDiamond(x: number, y: number, w: number, h: number): number[] {
  const hw = ISO.tileW / 2;
  const hh = ISO.tileH / 2;
  const top = tileCenterWorld('isometric2d', x, y);
  const right = tileCenterWorld('isometric2d', x + w - 1, y);
  const bottom = tileCenterWorld('isometric2d', x + w - 1, y + h - 1);
  const left = tileCenterWorld('isometric2d', x, y + h - 1);
  return [top.x, top.y - hh, right.x + hw, right.y, bottom.x, bottom.y + hh, left.x - hw, left.y];
}

/** Inverse projection: which integer tile does world point (wx,wy) fall in? */
export function pickTile(mode: RenderMode, wx: number, wy: number): { x: number; y: number } {
  if (mode === 'isometric2d') {
    const a = wx / (ISO.tileW / 2); // = tx - ty
    const b = wy / (ISO.tileH / 2); // = tx + ty
    // Diamond membership ↔ nearest integer tile centre, so round.
    return { x: Math.round((a + b) / 2), y: Math.round((b - a) / 2) };
  }
  return { x: Math.floor(wx / TILE), y: Math.floor(wy / TILE) };
}

/**
 * A depth-sort key for iso draw order (§5): back-to-front by tile sum, with the
 * footprint span nudging bigger/front buildings later so they occlude correctly.
 */
export function isoDepth(x: number, y: number, w: number, h: number): number {
  return (x + y) * 8 + (w + h);
}
