import type { ReactNode } from 'react';
import {
  activityImage,
  categoryImage,
  eventImage,
  markerImage,
  rewardImage,
} from '../../assets/registry.ts';
import { CategoryIcon } from '../common/icons.tsx';
import { ResourceArt } from './ResourceArtwork.tsx';
import type { BuildingCategory } from '../../game/types.ts';
import {
  AlertTriangle,
  Award,
  ClipboardList,
  Gift,
  PackageCheck,
  PartyPopper,
  Search,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react';

// UI artwork system (v0.26, §9-§13): the drop-in point for big, game-like
// imagery on the *chrome* — category tiles, activity/event illustrations,
// reward icons and map markers. Same rule as the building/resource art: a real
// PNG (src/assets/ui/**) wins, otherwise a styled fallback (Lucide glyph in a
// tinted tile, or an existing ResourceArt) renders so nothing is ever blank.
// Logic never imports this — it is pure presentation over the asset registry.

/** Shared frame: renders `src` as an image if present, else the fallback node. */
function ArtFrame({
  src,
  fallback,
  px,
  className,
}: {
  src: string | undefined;
  fallback: ReactNode;
  px: number;
  className: string;
}) {
  if (src) {
    return <img className={`ui-art ${className}`} src={src} width={px} height={px} alt="" aria-hidden="true" />;
  }
  return (
    <span className={`ui-art ui-art-fallback ${className}`} style={{ width: px, height: px }} aria-hidden="true">
      {fallback}
    </span>
  );
}

// ---- Category tiles (build menu tabs, §13.E) -------------------------------

const CATEGORY_FILE: Record<BuildingCategory, string> = {
  roads: 'cat_roads',
  residential: 'cat_housing',
  production: 'cat_resources',
  services: 'cat_services',
  energy: 'cat_energy',
  economy: 'cat_economy',
  leisure: 'cat_leisure',
  government: 'cat_administration',
  infrastructure: 'cat_roads',
  decoration: 'cat_decoration',
  special: 'cat_administration',
};

export function CategoryArt({ id, px = 30 }: { id: BuildingCategory; px?: number }) {
  return (
    <ArtFrame
      src={categoryImage(CATEGORY_FILE[id])}
      fallback={<CategoryIcon id={id} size={Math.round(px * 0.6)} />}
      px={px}
      className={`ui-art-category cat-${id}`}
    />
  );
}

// ---- Activity illustrations (Stadtarbeit, §13.G) --------------------------

const ACTIVITY_FILE: Record<string, string> = {
  food_delivery: 'activity_food_delivery',
  material_delivery: 'activity_material_delivery',
  city_inspection: 'activity_inspection',
  decision_farm_subsidy: 'activity_decision',
  decision_street_party: 'activity_decision',
  decision_overtime: 'activity_decision',
};
const ACTIVITY_TYPE_FALLBACK: Record<string, string> = {
  delivery: 'activity_food_delivery',
  inspection: 'activity_inspection',
  decision: 'activity_decision',
  tradeContract: 'activity_trade',
};
const ACTIVITY_ICON: Record<string, LucideIcon> = {
  delivery: PackageCheck,
  inspection: Search,
  decision: ClipboardList,
  tradeContract: Sparkles,
};

export function ActivityArt({ id, type, px = 48 }: { id: string; type: string; px?: number }) {
  const file = ACTIVITY_FILE[id] ?? ACTIVITY_TYPE_FALLBACK[type];
  const Icon = ACTIVITY_ICON[type] ?? ClipboardList;
  return (
    <ArtFrame
      src={file ? activityImage(file) : undefined}
      fallback={<Icon size={Math.round(px * 0.5)} />}
      px={px}
      className="ui-art-activity"
    />
  );
}

// ---- Reward icons (quest / activity payouts, §13.I) -----------------------

type RewardKind = 'money' | 'xp' | 'gold' | 'happiness' | 'resource';
const REWARD_FILE: Record<RewardKind, string> = {
  money: 'reward_money',
  xp: 'reward_xp',
  gold: 'reward_gold',
  happiness: 'reward_happiness',
  resource: 'reward_resource',
};
const REWARD_ICON: Record<RewardKind, LucideIcon> = {
  money: Gift,
  xp: Star,
  gold: Award,
  happiness: PartyPopper,
  resource: Gift,
};

export function RewardArt({ kind, px = 22 }: { kind: RewardKind; px?: number }) {
  // Money/gold reuse the polished resource artwork; xp/happiness get their own.
  if (kind === 'money') return <ResourceArt id="money" size={px} />;
  if (kind === 'gold') return <ResourceArt id="gold" size={px} />;
  const Icon = REWARD_ICON[kind];
  return (
    <ArtFrame
      src={rewardImage(REWARD_FILE[kind])}
      fallback={<Icon size={Math.round(px * 0.7)} />}
      px={px}
      className={`ui-art-reward reward-${kind}`}
    />
  );
}

// ---- Map / status markers (§13.F) -----------------------------------------

const MARKER_ICON: Record<string, LucideIcon> = {
  marker_problem: AlertTriangle,
  marker_warning: AlertTriangle,
  marker_new: Sparkles,
  marker_task: ClipboardList,
};

export function MarkerArt({ id, px = 24 }: { id: string; px?: number }) {
  const Icon = MARKER_ICON[id] ?? AlertTriangle;
  return (
    <ArtFrame src={markerImage(id)} fallback={<Icon size={Math.round(px * 0.7)} />} px={px} className="ui-art-marker" />
  );
}

// ---- Event / decision hero art (§13.H) ------------------------------------

export function EventArt({ id, px = 72 }: { id: string; px?: number }) {
  return (
    <ArtFrame src={eventImage(id)} fallback={<Sparkles size={Math.round(px * 0.5)} />} px={px} className="ui-art-event" />
  );
}
