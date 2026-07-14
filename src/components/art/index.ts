// Cartoon artwork system (§11): illustrated resource, building and character
// art that replaces the icon-first look on the visible surfaces. All cel-shaded
// SVG today, structured so real sprites can drop into the same call sites later.
export { ResourceArt, type ArtResourceId } from './ResourceArtwork.tsx';
export { BuildingArt } from './BuildingArtwork.tsx';
export { CitizenPortrait, AdvisorPortrait } from './Portraits.tsx';
export { CategoryArt, ActivityArt, RewardArt, MarkerArt, EventArt } from './UiArt.tsx';
