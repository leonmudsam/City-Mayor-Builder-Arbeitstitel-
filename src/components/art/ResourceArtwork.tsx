import type { ResourceId } from '../../game/types.ts';
import { resourceImage } from '../../assets/registry.ts';

// Cartoon resource artwork (§11 "generierte Bilder statt SVG-Icons"): each
// resource is a small illustrated object — a coin stack, a log pile, a food
// crate — not a line icon. Cel-shaded flat SVG (highlight + body + shadow
// shapes), so it stays crisp at any size, needs no assets and has no gradient
// id collisions. Swappable for real sprites later via the same <ResourceArt>
// call sites. No emojis.

export type ArtResourceId = ResourceId | 'gold' | 'population' | 'happiness';

const DRAW: Record<ArtResourceId, () => JSX.Element> = {
  money: Coins,
  gold: GoldBars,
  wood: Wood,
  stone: Stone,
  food: FoodCrate,
  freshwater: WaterDrop,
  population: Citizens,
  happiness: HappyBadge,
};

export function ResourceArt({ id, size = 30 }: { id: ArtResourceId; size?: number }) {
  // Real generated artwork wins when supplied (src/assets/resources/<id>.png);
  // otherwise the built-in cel-shaded SVG placeholder renders.
  const img = resourceImage(id);
  if (img) return <img className="res-art res-art-img" src={img} width={size} height={size} alt="" aria-hidden="true" />;
  return (
    <svg className="res-art" viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <ellipse cx="20" cy="35" rx="13" ry="3" className="art-shadow" />
      {DRAW[id]()}
    </svg>
  );
}

function coin(cx: number, cy: number) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx="11" ry="4.6" fill="#c9861f" />
      <ellipse cx={cx} cy={cy - 1.6} rx="11" ry="4.6" fill="#f6c042" />
      <ellipse cx={cx} cy={cy - 1.6} rx="6.5" ry="2.6" fill="#ffd968" />
      <ellipse cx={cx - 3} cy={cy - 2.6} rx="2.4" ry="0.9" fill="#fff2c2" opacity="0.9" />
    </g>
  );
}

function Coins() {
  return (
    <g>
      {coin(20, 30)}
      {coin(20, 24)}
      {coin(20, 18)}
    </g>
  );
}

function GoldBars() {
  const bar = (x: number, y: number) => (
    <g>
      <path d={`M${x} ${y} L${x + 20} ${y} L${x + 23} ${y + 7} L${x - 3} ${y + 7} Z`} fill="#e7b23a" />
      <rect x={x - 3} y={y + 7} width="26" height="5" fill="#c98f22" />
      <path d={`M${x} ${y} L${x + 20} ${y} L${x + 21} ${y + 2} L${x + 1} ${y + 2} Z`} fill="#ffe08a" />
    </g>
  );
  return (
    <g>
      {bar(12, 24)}
      {bar(9, 16)}
    </g>
  );
}

function Wood() {
  const log = (cx: number, cy: number) => (
    <g>
      <circle cx={cx} cy={cy} r="6.4" fill="#a9713f" />
      <circle cx={cx} cy={cy} r="6.4" fill="none" stroke="#8a5a30" strokeWidth="1.4" />
      <circle cx={cx} cy={cy} r="4" fill="#c68a52" />
      <circle cx={cx} cy={cy} r="1.6" fill="#a9713f" />
    </g>
  );
  return (
    <g>
      <rect x="6" y="26" width="28" height="8" rx="3" fill="#6f4a27" />
      {log(14, 22)}
      {log(26, 22)}
      {log(20, 14)}
    </g>
  );
}

function Stone() {
  return (
    <g>
      <path d="M9 30 L6 21 L13 13 L26 12 L34 20 L32 30 Z" fill="#8f98a4" />
      <path d="M13 13 L26 12 L34 20 L22 22 Z" fill="#aab3bf" />
      <path d="M6 21 L13 13 L22 22 L9 30 Z" fill="#9aa3af" />
      <path d="M22 22 L34 20 L32 30 L20 31 Z" fill="#7f8896" />
      <path d="M15 15 L23 14" stroke="#c3ccd6" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

function FoodCrate() {
  return (
    <g>
      {/* apple + bread poking out over the crate */}
      <ellipse cx="16" cy="17" rx="6" ry="5.6" fill="#e0503a" />
      <ellipse cx="14" cy="15" rx="2" ry="1.6" fill="#ff8b74" opacity="0.85" />
      <path d="M16 11.5 Q17 8 20 9" fill="none" stroke="#5a7d34" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 9 q4 -1 4 3 q-4 1 -4 -3 Z" fill="#6faa3f" />
      <ellipse cx="27" cy="19" rx="6" ry="4.4" fill="#d79a4e" />
      <ellipse cx="27" cy="17.6" rx="4.4" ry="2.4" fill="#eab871" />
      {/* wooden crate */}
      <path d="M8 22 L32 22 L34 33 L6 33 Z" fill="#a9713f" />
      <path d="M8 22 L32 22 L31.4 25 L8.6 25 Z" fill="#c68a52" />
      <rect x="6" y="26.5" width="28" height="2.4" fill="#8a5a30" />
      <path d="M18 22 L17 33 M22 22 L23 33" stroke="#8a5a30" strokeWidth="1.4" />
    </g>
  );
}

function WaterDrop() {
  return (
    <g>
      <path d="M20 8 C20 8 30 20 30 26 A10 10 0 0 1 10 26 C10 20 20 8 20 8 Z" fill="#2f9be0" />
      <path d="M20 8 C20 8 30 20 30 26 A10 10 0 0 1 20 36 Z" fill="#1f82c4" opacity="0.55" />
      <ellipse cx="16" cy="24" rx="2.6" ry="4" fill="#bfe6ff" opacity="0.9" transform="rotate(-18 16 24)" />
    </g>
  );
}

function person(cx: number, cy: number, skin: string, shirt: string) {
  return (
    <g>
      <path d={`M${cx - 7} ${cy + 15} Q${cx - 7} ${cy + 5} ${cx} ${cy + 5} Q${cx + 7} ${cy + 5} ${cx + 7} ${cy + 15} Z`} fill={shirt} />
      <circle cx={cx} cy={cy} r="4.6" fill={skin} />
    </g>
  );
}

function Citizens() {
  return (
    <g>
      {person(12, 18, '#e8b98f', '#4a8fd6')}
      {person(28, 18, '#c98a5e', '#e07a52')}
      {person(20, 15, '#f0c9a0', '#5bb46a')}
    </g>
  );
}

function HappyBadge() {
  return (
    <g>
      {/* scalloped medal */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={20 + Math.cos(a) * 13} cy={20 + Math.sin(a) * 13} r="3.4" fill="#f6b73c" />;
      })}
      <circle cx="20" cy="20" r="12.5" fill="#ffcf57" />
      <circle cx="20" cy="20" r="12.5" fill="none" stroke="#e79a25" strokeWidth="1.4" />
      <circle cx="15.5" cy="18" r="1.7" fill="#5a3d12" />
      <circle cx="24.5" cy="18" r="1.7" fill="#5a3d12" />
      <path d="M14.5 23 Q20 28 25.5 23" fill="none" stroke="#5a3d12" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}
