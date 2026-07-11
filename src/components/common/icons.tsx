import {
  BriefcaseBusiness,
  Coins,
  Droplets,
  Factory,
  Flower2,
  Home,
  Landmark,
  Logs,
  Mountain,
  Route,
  ShoppingBasket,
  Star,
  Store,
  TreePine,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import type { BuildingCategory, NeedId, ResourceId } from '../../game/types.ts';

// Single source of truth for the icon vocabulary (§12, §15): every resource,
// need and build category maps to exactly one Lucide glyph. Panels, the HUD and
// the build menu all read from here, so the visual language stays consistent
// and adding a resource/need is one line, not a hunt through components.

export const RESOURCE_ICON: Record<ResourceId, LucideIcon> = {
  money: Coins,
  wood: Logs,
  stone: Mountain,
  food: Wheat,
};

export const NEED_ICON: Record<NeedId, LucideIcon> = {
  housing: Home,
  water: Droplets,
  food: Wheat,
  work: BriefcaseBusiness,
  leisure: TreePine,
};

export const CATEGORY_ICON: Record<BuildingCategory, LucideIcon> = {
  roads: Route,
  residential: Home,
  production: Factory,
  services: ShoppingBasket,
  leisure: TreePine,
  economy: Store,
  government: Landmark,
  infrastructure: Route,
  decoration: Flower2,
  special: Star,
};

export function ResourceIcon({ id, size = 15 }: { id: ResourceId; size?: number }) {
  const Icon = RESOURCE_ICON[id];
  return <Icon size={size} />;
}

export function NeedIcon({ id, size = 15 }: { id: NeedId; size?: number }) {
  const Icon = NEED_ICON[id];
  return <Icon size={size} />;
}

export function CategoryIcon({ id, size = 16 }: { id: BuildingCategory; size?: number }) {
  const Icon = CATEGORY_ICON[id];
  return <Icon size={size} />;
}

/** Gold is a premium currency, separate from the storable resources. */
export const GoldIcon = Star;
