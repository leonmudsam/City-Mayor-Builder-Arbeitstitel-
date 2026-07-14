import type { BuildingCategory } from '../../game/types.ts';

// Cartoon building artwork (§11/§ "cartoonartige Gebäudebilder"): every building
// id gets a small illustrated scene — pitched roofs, windows, a barn with a
// silo, a wind turbine — drawn on a rounded grass/paved tile. Cel-shaded flat
// SVG so it reads as a little game object, not a category rectangle with text.
// Build menu, building sheet and the level-up popup all render the same art, so
// the visual language is consistent and swaps for sprites later. No emojis.

type Draw = () => JSX.Element;

// ---- shared little parts ---------------------------------------------------

function win(x: number, y: number, w = 4, h = 5, c = '#bfe3ff') {
  return <rect x={x} y={y} width={w} height={h} rx="0.8" fill={c} />;
}

function windowGrid(x: number, y: number, cols: number, rows: number, gap = 6, c = '#bfe3ff') {
  const out: JSX.Element[] = [];
  for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) out.push(win(x + col * gap, y + r * gap, 4, 4.5, c));
  return <g>{out}</g>;
}

function door(x: number, y: number, w = 7, h = 11, c = '#7a4a25') {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="1" fill={c} />
      <circle cx={x + w - 1.6} cy={y + h / 2} r="0.8" fill="#f4d98a" />
    </g>
  );
}

// ---- archetypes ------------------------------------------------------------

function cottage(wall: string, roof: string): Draw {
  return () => (
    <g>
      <rect x="18" y="30" width="28" height="20" rx="1.5" fill={wall} />
      <path d="M14 32 L32 18 L50 32 Z" fill={roof} />
      <path d="M14 32 L32 18 L32 32 Z" fill="#00000018" />
      <rect x="35" y="14" width="4" height="8" fill="#6b4a2c" />
      {win(22, 35)}
      {win(38, 35)}
      {door(28, 39, 7, 11)}
    </g>
  );
}

function rowhouse(): Draw {
  return () => (
    <g>
      <rect x="8" y="30" width="20" height="20" fill="#e5c07a" />
      <path d="M6 31 L18 20 L30 31 Z" fill="#b6552f" />
      <rect x="32" y="30" width="20" height="20" fill="#d98f6a" />
      <path d="M30 31 L42 20 L54 31 Z" fill="#8a4f8f" />
      {win(11, 35)} {win(21, 35)} {door(13, 40, 6, 10)}
      {win(35, 35)} {win(45, 35)} {door(37, 40, 6, 10)}
    </g>
  );
}

function block(stories: number, wall: string, roof: string): Draw {
  const h = 8 + stories * 8;
  const y = 50 - h;
  return () => (
    <g>
      <rect x="14" y={y} width="36" height={h} rx="1.5" fill={wall} />
      <rect x="14" y={y} width="36" height="5" fill={roof} />
      {windowGrid(19, y + 9, 4, stories, 8)}
      {door(28, 42, 8, 8)}
    </g>
  );
}

function tower(wall: string): Draw {
  return () => (
    <g>
      <rect x="20" y="10" width="24" height="40" rx="2" fill={wall} />
      <rect x="20" y="10" width="24" height="5" rx="2" fill="#3d5a80" />
      <rect x="30" y="6" width="4" height="6" fill="#8aa0bd" />
      {windowGrid(24, 18, 3, 5, 6.5, '#cde6ff')}
    </g>
  );
}

function civic(accent: string): Draw {
  return () => (
    <g>
      <rect x="12" y="26" width="40" height="24" fill="#e8e2d2" />
      <path d="M8 26 L32 12 L56 26 Z" fill="#c9c0aa" />
      <rect x="30" y="6" width="4" height="8" fill="#8a6a3a" />
      <path d="M34 7 L44 9 L34 12 Z" fill={accent} />
      {[16, 24, 32, 40, 47].map((x) => (
        <rect key={x} x={x} y="30" width="4" height="20" fill="#cfc7b2" />
      ))}
      <rect x="27" y="38" width="10" height="12" fill="#7a5a34" />
    </g>
  );
}

function barn(): Draw {
  return () => (
    <g>
      {/* field rows */}
      <rect x="4" y="44" width="56" height="6" rx="2" fill="#8bbf56" />
      <path d="M8 47 H56 M8 49 H56" stroke="#6f9e42" strokeWidth="1" />
      {/* silo */}
      <rect x="10" y="24" width="10" height="22" rx="2" fill="#cfd6dd" />
      <path d="M10 24 A5 5 0 0 1 20 24 Z" fill="#aeb7c0" />
      {/* barn */}
      <rect x="24" y="28" width="30" height="18" fill="#c14b3a" />
      <path d="M22 28 L39 18 L56 28 Z" fill="#9c3728" />
      <path d="M33 34 h12 v12 h-12 Z" fill="#e7d9b0" />
      <path d="M39 34 v12 M33 40 h12" stroke="#c14b3a" strokeWidth="1.6" />
    </g>
  );
}

function sawmill(): Draw {
  return () => (
    <g>
      <rect x="16" y="28" width="32" height="22" fill="#8a6a44" />
      <path d="M14 28 L32 18 L50 28 Z" fill="#5f4a2e" />
      <rect x="20" y="40" width="24" height="10" fill="#6f4a27" />
      {/* stacked logs */}
      <circle cx="21" cy="46" r="4" fill="#a9713f" /><circle cx="21" cy="46" r="2" fill="#c68a52" />
      <circle cx="29" cy="46" r="4" fill="#a9713f" /><circle cx="29" cy="46" r="2" fill="#c68a52" />
      {/* saw blade */}
      <circle cx="38" cy="34" r="6.5" fill="#d7dde3" />
      <circle cx="38" cy="34" r="2" fill="#9aa3af" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <rect key={i} x={38 + Math.cos(a) * 6.5 - 0.8} y={34 + Math.sin(a) * 6.5 - 0.8} width="1.6" height="1.6" fill="#aeb7c0" />;
      })}
    </g>
  );
}

function quarry(): Draw {
  return () => (
    <g>
      <path d="M6 48 Q10 30 22 30 L44 30 Q56 32 58 48 Z" fill="#b7a98d" />
      <ellipse cx="32" cy="44" rx="20" ry="7" fill="#8f8264" />
      <path d="M18 42 L14 34 L22 30 L28 36 Z" fill="#9aa3af" />
      <path d="M36 44 L34 36 L44 34 L48 42 Z" fill="#7f8896" />
      <circle cx="28" cy="42" r="3.4" fill="#aab3bf" />
    </g>
  );
}

function wellArt(): Draw {
  return () => (
    <g>
      <ellipse cx="32" cy="40" rx="14" ry="6" fill="#7a5a34" />
      <ellipse cx="32" cy="38" rx="14" ry="6" fill="#a9713f" />
      <ellipse cx="32" cy="38" rx="9" ry="3.6" fill="#2f9be0" />
      <rect x="20" y="16" width="3" height="22" fill="#6b4a2c" />
      <rect x="41" y="16" width="3" height="22" fill="#6b4a2c" />
      <path d="M18 18 L32 8 L46 18 Z" fill="#b6552f" />
      <rect x="28" y="24" width="8" height="6" rx="1" fill="#8a5a30" />
    </g>
  );
}

function watertower(): Draw {
  return () => (
    <g>
      <rect x="20" y="28" width="24" height="20" rx="3" fill="#5bb1e6" />
      <path d="M18 28 Q32 20 46 28 Z" fill="#3d92cf" />
      <rect x="20" y="28" width="24" height="20" rx="3" fill="none" stroke="#2f7bb0" strokeWidth="1.4" />
      <path d="M26 40 q6 4 12 0" fill="none" stroke="#bfe6ff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="24" r="3.5" fill="#cdeeff" />
      {[24, 40].map((x) => <rect key={x} x={x} y="46" width="3" height="4" fill="#2f7bb0" />)}
    </g>
  );
}

function warehouse(): Draw {
  return () => (
    <g>
      <rect x="10" y="30" width="44" height="20" fill="#b9b0a0" />
      <path d="M8 30 L32 22 L56 30 Z" fill="#8f877a" />
      <rect x="26" y="34" width="16" height="16" fill="#e0a24a" />
      <path d="M26 38 H42 M26 42 H42 M26 46 H42" stroke="#b97f2c" strokeWidth="1.2" />
      {win(15, 35, 5, 5, '#cdd6df')} {win(45, 35, 5, 5, '#cdd6df')}
    </g>
  );
}

function shop(sign: string, emblem?: Draw): Draw {
  return () => (
    <g>
      <rect x="14" y="26" width="36" height="24" fill="#efe7d6" />
      <rect x="14" y="20" width="36" height="7" fill={sign} />
      {/* striped awning */}
      <g>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${16 + i * 7} 27 l3.5 6 h-3.5 Z`} fill={i % 2 ? '#ffffff' : sign} opacity="0.9" />
        ))}
      </g>
      {win(18, 38, 8, 10, '#bfe3ff')}
      {door(38, 38, 8, 12)}
      {emblem && <g transform="translate(29 20) scale(0.6)">{emblem()}</g>}
    </g>
  );
}

function serviceBldg(color: string, emblem: Draw): Draw {
  return () => (
    <g>
      <rect x="14" y="24" width="36" height="26" fill="#eef1f4" />
      <rect x="14" y="24" width="36" height="6" fill={color} />
      {win(19, 34)} {win(29, 34)} {win(39, 34)}
      <rect x="27" y="42" width="10" height="8" fill={color} />
      <g transform="translate(24 6)">{emblem()}</g>
    </g>
  );
}

function powerplant(): Draw {
  return () => (
    <g>
      <path d="M10 50 Q8 34 16 32 Q24 34 22 50 Z" fill="#c9ced4" />
      <path d="M34 50 Q32 30 42 28 Q52 30 50 50 Z" fill="#d7dce1" />
      <ellipse cx="16" cy="33" rx="7" ry="2.4" fill="#aeb4bb" />
      <ellipse cx="42" cy="29" rx="9" ry="2.8" fill="#bcc2c8" />
      <circle cx="20" cy="24" r="6" fill="#e9edf1" opacity="0.9" />
      <circle cx="27" cy="19" r="7" fill="#e9edf1" opacity="0.75" />
      <circle cx="36" cy="16" r="6" fill="#e9edf1" opacity="0.6" />
    </g>
  );
}

function windturbine(): Draw {
  return () => (
    <g>
      <rect x="4" y="46" width="56" height="4" rx="2" fill="#8bbf56" />
      <path d="M30.5 46 L29 20 h3 L31.5 46 Z" fill="#dfe6ec" />
      <circle cx="30.5" cy="20" r="2.6" fill="#b7c0c9" />
      {[0, 120, 240].map((deg) => (
        <path key={deg} d="M30.5 20 L31.6 20 L34 4 Z" fill="#eef2f6" transform={`rotate(${deg} 30.5 20)`} stroke="#c3ccd6" strokeWidth="0.5" />
      ))}
    </g>
  );
}

function parkArt(): Draw {
  return () => (
    <g>
      <rect x="6" y="40" width="52" height="10" rx="4" fill="#8bbf56" />
      <path d="M10 44 Q32 38 54 44" fill="none" stroke="#cbb072" strokeWidth="3" strokeLinecap="round" />
      {tree(18, 30, 10)}
      {tree(44, 28, 12)}
      <rect x="30" y="40" width="6" height="4" fill="#7a4a25" />
    </g>
  );
}

function tree(cx: number, cy: number, r: number) {
  return (
    <g>
      <rect x={cx - 1.6} y={cy} width="3.2" height={44 - cy} fill="#7a4a25" />
      <circle cx={cx} cy={cy} r={r} fill="#57a24a" />
      <circle cx={cx - r * 0.5} cy={cy + 1} r={r * 0.7} fill="#6fb85c" />
      <circle cx={cx + r * 0.45} cy={cy + 2} r={r * 0.6} fill="#4c9040" />
    </g>
  );
}

function flowerbed(): Draw {
  return () => (
    <g>
      <ellipse cx="32" cy="42" rx="20" ry="8" fill="#7a4a25" />
      <ellipse cx="32" cy="40" rx="20" ry="8" fill="#8a5a30" />
      {[[22, 38, '#e0503a'], [32, 36, '#ffcf57'], [42, 38, '#c86bd6'], [27, 41, '#4a8fd6'], [37, 41, '#ff8b74']].map(([x, y, c], i) => (
        <g key={i}>
          {[0, 72, 144, 216, 288].map((d) => (
            <circle key={d} cx={(x as number) + Math.cos((d * Math.PI) / 180) * 2.6} cy={(y as number) + Math.sin((d * Math.PI) / 180) * 2.6} r="1.8" fill={c as string} />
          ))}
          <circle cx={x as number} cy={y as number} r="1.6" fill="#ffe08a" />
        </g>
      ))}
    </g>
  );
}

function fountain(): Draw {
  return () => (
    <g>
      <ellipse cx="32" cy="44" rx="18" ry="7" fill="#9aa3af" />
      <ellipse cx="32" cy="42" rx="18" ry="7" fill="#c3ccd6" />
      <ellipse cx="32" cy="42" rx="13" ry="4.6" fill="#2f9be0" />
      <rect x="30" y="24" width="4" height="16" fill="#aab3bf" />
      <ellipse cx="32" cy="24" rx="6" ry="2.4" fill="#8f98a4" />
      <path d="M32 18 q-6 3 -8 8 M32 18 q6 3 8 8" fill="none" stroke="#bfe6ff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="16" r="2.4" fill="#cdeeff" />
    </g>
  );
}

function bench(): Draw {
  return () => (
    <g>
      <rect x="8" y="42" width="48" height="8" rx="3" fill="#8bbf56" />
      <rect x="16" y="30" width="32" height="4" rx="2" fill="#a9713f" />
      <rect x="16" y="36" width="32" height="4" rx="2" fill="#c68a52" />
      <rect x="18" y="34" width="3" height="10" fill="#6b4a2c" />
      <rect x="43" y="34" width="3" height="10" fill="#6b4a2c" />
    </g>
  );
}

function roadArt(): Draw {
  return () => (
    <g>
      <rect x="6" y="26" width="52" height="16" rx="2" fill="#565c66" />
      <rect x="6" y="24" width="52" height="3" fill="#9aa1ab" />
      <rect x="6" y="42" width="52" height="3" fill="#9aa1ab" />
      {[10, 24, 38, 52].map((x) => <rect key={x} x={x} y="33" width="8" height="2.4" rx="1" fill="#f5f0e6" />)}
    </g>
  );
}

// small emblems for shops / services
const crossEmblem: Draw = () => (
  <g>
    <circle cx="8" cy="8" r="8" fill="#ffffff" stroke="#e0503a" strokeWidth="1.4" />
    <rect x="6.4" y="3.5" width="3.2" height="9" rx="1" fill="#e0503a" />
    <rect x="3.5" y="6.4" width="9" height="3.2" rx="1" fill="#e0503a" />
  </g>
);
const flameEmblem: Draw = () => (
  <g>
    <circle cx="8" cy="8" r="8" fill="#fff2d6" />
    <path d="M8 2 C11 6 12 8 10 12 C13 11 12 6 8 2 Z M8 5 C6 8 5 9 7 12 C4 11 5 7 8 5 Z" fill="#e0503a" />
  </g>
);
const starEmblem: Draw = () => (
  <g>
    <circle cx="8" cy="8" r="8" fill="#dfeafc" />
    <path d="M8 3 L9.6 6.4 L13.3 6.7 L10.4 9 L11.4 12.6 L8 10.6 L4.6 12.6 L5.6 9 L2.7 6.7 L6.4 6.4 Z" fill="#2f6fd0" />
  </g>
);
const coinEmblem: Draw = () => (
  <g>
    <circle cx="8" cy="8" r="7.5" fill="#f6c042" stroke="#d9992e" strokeWidth="1.4" />
    <circle cx="8" cy="8" r="4" fill="#ffd968" />
  </g>
);
const breadEmblem: Draw = () => (
  <g>
    <circle cx="8" cy="8" r="8" fill="#fff2d6" />
    <ellipse cx="8" cy="9" rx="6" ry="4" fill="#d79a4e" />
    <path d="M5 8 q3 -3 6 0" fill="none" stroke="#a9713f" strokeWidth="1.2" />
  </g>
);
const briefcaseEmblem: Draw = () => (
  <g>
    <circle cx="8" cy="8" r="8" fill="#e6efe6" />
    <rect x="3.5" y="6" width="9" height="6.5" rx="1" fill="#3f7d4f" />
    <rect x="6" y="4.5" width="4" height="2" rx="0.6" fill="#2f5f3b" />
  </g>
);

// ---- id → artwork ----------------------------------------------------------

const BUILDINGS: Record<string, Draw> = {
  town_hall: civic('#d94f4f'),
  mayor_house: civic('#4a8fd6'),
  district_center: civic('#c9a227'),
  road: roadArt(),
  house_small: cottage('#e5c07a', '#c05a3a'),
  house_row: rowhouse(),
  apartment: block(3, '#d9b98a', '#b6552f'),
  residential_tower: tower('#7fa8d6'),
  sawmill: sawmill(),
  quarry: quarry(),
  farm: barn(),
  well: wellArt(),
  water_pump: watertower(),
  waterworks: watertower(),
  warehouse: warehouse(),
  depot: warehouse(),
  market: shop('#e0503a', coinEmblem),
  supermarket: shop('#3f9d54', coinEmblem),
  bakery: shop('#d79a4e', breadEmblem),
  shop_small: shop('#c86bd6', coinEmblem),
  office: shop('#4a8fd6', briefcaseEmblem),
  trading_post: shop('#c9a227', coinEmblem),
  fire_station: serviceBldg('#d94f4f', flameEmblem),
  police_station: serviceBldg('#2f6fd0', starEmblem),
  hospital: serviceBldg('#e6e9ee', crossEmblem),
  power_plant: powerplant(),
  wind_farm: windturbine(),
  park: parkArt(),
  playground: parkArt(),
  deco_tree: () => <g>{tree(32, 26, 14)}</g>,
  deco_flowerbed: flowerbed(),
  deco_fountain: fountain(),
  deco_bench: bench(),
};

const CATEGORY_FALLBACK: Record<BuildingCategory, Draw> = {
  roads: roadArt(),
  residential: cottage('#e5c07a', '#c05a3a'),
  production: warehouse(),
  services: serviceBldg('#3f9d54', coinEmblem),
  energy: powerplant(),
  economy: shop('#c9a227', coinEmblem),
  leisure: parkArt(),
  government: civic('#d94f4f'),
  infrastructure: warehouse(),
  decoration: () => <g>{tree(32, 26, 14)}</g>,
  special: civic('#c9a227'),
};

export function BuildingArt({
  id,
  category,
  px = 52,
}: {
  id?: string;
  category: BuildingCategory;
  px?: number;
}) {
  const draw = (id && BUILDINGS[id]) || CATEGORY_FALLBACK[category];
  return (
    <svg className="bld-art" viewBox="0 0 64 64" width={px} height={px} aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="10" className="bld-art-tile" />
      <ellipse cx="32" cy="52" rx="24" ry="4" className="art-shadow" />
      {draw()}
    </svg>
  );
}
