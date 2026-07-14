import type { QuestSender } from '../../game/config/types.ts';
import { portraitImage } from '../../assets/registry.ts';

// Cartoon character portraits (§ "Bürger / Avatare / Berater"): little people
// with a face, hair, clothing and a role marker on a coloured backdrop — a
// citizen, a builder in a hard hat, a merchant, the mayor. Deterministic from a
// seed so the same request always shows the same person, but different requests
// show visibly different citizens. Cel-shaded flat SVG, no assets, no emojis.

const SKIN = ['#f0c9a0', '#e8b98f', '#d49a6a', '#b87a4a', '#8a5a34'];
const HAIR = ['#3a2a1a', '#6b4a2c', '#c9a227', '#9a9a9a', '#d98f4a', '#1f1f1f'];
const SHIRT = ['#4a8fd6', '#e07a52', '#5bb46a', '#c86bd6', '#d94f4f', '#3f9d54'];

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const ROLE_BG: Record<QuestSender, [string, string]> = {
  citizen: ['#6ea8e0', '#3f6fb0'],
  buildingDept: ['#e6a84a', '#c07f22'],
  fire: ['#e57a6a', '#c1402f'],
  merchant: ['#6bbf7a', '#3f8f52'],
  mayor: ['#8a7fd6', '#5a4fa0'],
};

/** The role-specific clothing colour and headgear drawn over the generic body. */
function roleLayer(role: QuestSender): JSX.Element | null {
  switch (role) {
    case 'buildingDept':
      return (
        <g>
          <path d="M12 15 Q20 8 28 15 Z" fill="#f4c430" />
          <rect x="10" y="14" width="20" height="2.4" rx="1.2" fill="#e0a800" />
          <rect x="18.6" y="9" width="2.8" height="5" fill="#e0a800" />
        </g>
      );
    case 'fire':
      return (
        <g>
          <path d="M11 15 Q20 7 29 15 Z" fill="#c1402f" />
          <path d="M20 7 L22 15 H18 Z" fill="#f4d98a" />
          <rect x="10" y="14.5" width="20" height="2.4" rx="1.2" fill="#9c3020" />
        </g>
      );
    case 'merchant':
      return (
        <g>
          <path d="M12 14 Q20 9 28 14 L28 16 L12 16 Z" fill="#3f8f52" />
          <ellipse cx="20" cy="13.5" rx="9" ry="2" fill="#357a45" />
        </g>
      );
    case 'mayor':
      return (
        <g>
          <path d="M14 11 L16.5 15 L20 11 L23.5 15 L26 11 L26 16 L14 16 Z" fill="#f4c430" />
          {[16, 20, 24].map((x) => <circle key={x} cx={x} cy="12" r="1" fill="#e0503a" />)}
        </g>
      );
    default:
      return null;
  }
}

export function CitizenPortrait({ role, seed, size = 40 }: { role: QuestSender; seed: string; size?: number }) {
  const h = hash(seed + role);
  // Real generated portrait wins when supplied (src/assets/portraits/*.png);
  // officials by role, citizens rotate by seed. Otherwise the SVG face renders.
  const img = portraitImage(role, h);
  if (img) return <img className="portrait portrait-img" src={img} width={size} height={size} alt="" aria-hidden="true" />;
  const skin = SKIN[h % SKIN.length]!;
  const hair = HAIR[(h >> 3) % HAIR.length]!;
  const shirt = role === 'citizen' ? SHIRT[(h >> 6) % SHIRT.length]! : bodyColor(role);
  const [bg1, bg2] = ROLE_BG[role];
  const longHair = (h >> 9) % 2 === 0;

  return (
    <svg className="portrait" viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <defs>
        <clipPath id={`pc-${h}`}>
          <rect x="0" y="0" width="40" height="40" rx="10" />
        </clipPath>
      </defs>
      <g clipPath={`url(#pc-${h})`}>
        <rect x="0" y="0" width="40" height="40" fill={bg1} />
        <path d="M0 40 L0 26 Q20 20 40 26 L40 40 Z" fill={bg2} opacity="0.5" />
        {/* shoulders / shirt */}
        <path d="M6 40 Q6 28 20 28 Q34 28 34 40 Z" fill={shirt} />
        <path d="M15 28 Q20 33 25 28 L25 30 Q20 34 15 30 Z" fill="#ffffff" opacity="0.25" />
        {/* neck + head */}
        <rect x="17.5" y="22" width="5" height="6" fill={skin} />
        {longHair && <path d="M9 20 Q9 32 13 34 L27 34 Q31 32 31 20 Z" fill={hair} />}
        <circle cx="20" cy="17" r="8" fill={skin} />
        {/* hair top */}
        <path d="M11.5 16 Q11 7 20 7 Q29 7 28.5 16 Q25 11 20 11 Q15 11 11.5 16 Z" fill={hair} />
        {/* face */}
        <circle cx="16.8" cy="17" r="1.1" fill="#3a2a1a" />
        <circle cx="23.2" cy="17" r="1.1" fill="#3a2a1a" />
        <path d="M17 20.5 Q20 22.6 23 20.5" fill="none" stroke="#9c5a3a" strokeWidth="1.2" strokeLinecap="round" />
        {roleLayer(role)}
      </g>
    </svg>
  );
}

function bodyColor(role: QuestSender): string {
  switch (role) {
    case 'buildingDept':
      return '#e0a24a';
    case 'fire':
      return '#c1402f';
    case 'merchant':
      return '#3f8f52';
    case 'mayor':
      return '#39406a';
    default:
      return '#4a8fd6';
  }
}

/** An advisor portrait is just a role-forward citizen with a stable seed, used
 *  in decision popups and activity cards where the speaker is an official. */
export function AdvisorPortrait({ role, size = 44 }: { role: QuestSender; size?: number }) {
  return <CitizenPortrait role={role} seed={`advisor-${role}`} size={size} />;
}
