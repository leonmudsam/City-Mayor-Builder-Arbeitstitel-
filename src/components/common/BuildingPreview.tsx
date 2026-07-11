import type { BuildingCategory } from '../../game/types.ts';
import { CATEGORY_COLORS } from '../../renderer/colors.ts';

// A small, deterministic mini-preview glyph for build-menu cards (§5, §12).
// It draws the building programmatically — a category-tinted body, roads as a
// laned segment, greenery as foliage — mirroring how the map renderer paints
// the same buildings, so the card previews what will land on the map. Pure SVG,
// no assets, so it stays crisp at any size and swaps for sprites later.

function cssHex(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`;
}

function shade(n: number, factor: number): string {
  const r = Math.min(255, Math.round(((n >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.round(((n >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.round((n & 0xff) * factor));
  return `rgb(${r}, ${g}, ${b})`;
}

export function BuildingPreview({
  category,
  size = { w: 1, h: 1 },
  px = 46,
}: {
  category: BuildingCategory;
  size?: { w: number; h: number };
  px?: number;
}) {
  const base = CATEGORY_COLORS[category];
  return (
    <svg className="bp" viewBox="0 0 48 48" width={px} height={px} aria-hidden="true">
      <rect x="1" y="1" width="46" height="46" rx="8" className="bp-ground" />
      {category === 'roads' ? <RoadGlyph /> : category === 'leisure' || category === 'decoration' ? <FoliageGlyph color={base} /> : <BuildingGlyph color={base} size={size} />}
    </svg>
  );
}

function BuildingGlyph({ color, size }: { color: number; size: { w: number; h: number } }) {
  // Wider footprints read as broader, flatter blocks; tall ones as towers.
  const wide = size.w >= size.h;
  const bw = wide ? 30 : 22;
  const bh = wide ? 22 : 30;
  const x = (48 - bw) / 2;
  const y = 44 - bh;
  return (
    <g>
      <rect x={x} y={y} width={bw} height={bh} rx="2.5" fill={cssHex(color)} />
      <rect x={x} y={y} width={bw} height="6" rx="2.5" fill={shade(color, 1.25)} />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => {
          const wx = x + 5 + col * ((bw - 10) / 2);
          const wy = y + 10 + row * ((bh - 14) / 2);
          if (wy > 40) return null;
          return <rect key={`${row}-${col}`} x={wx - 1.6} y={wy - 1.6} width="3.2" height="3.2" rx="0.6" fill={shade(color, 0.55)} />;
        }),
      )}
    </g>
  );
}

function FoliageGlyph({ color }: { color: number }) {
  return (
    <g>
      <rect x="22" y="30" width="4" height="12" rx="1.5" fill={shade(color, 0.6)} />
      <circle cx="24" cy="22" r="12" fill={cssHex(color)} />
      <circle cx="17" cy="26" r="8" fill={shade(color, 0.85)} />
      <circle cx="31" cy="26" r="8" fill={shade(color, 1.1)} />
    </g>
  );
}

function RoadGlyph() {
  return (
    <g>
      <rect x="4" y="19" width="40" height="10" rx="2" fill="#454b54" />
      <rect x="4" y="17" width="40" height="2" fill="#9aa1ab" />
      <rect x="4" y="29" width="40" height="2" fill="#9aa1ab" />
      {[8, 18, 28, 38].map((cx) => (
        <rect key={cx} x={cx} y="23" width="6" height="2" rx="1" fill="#f5f0e6" />
      ))}
    </g>
  );
}
