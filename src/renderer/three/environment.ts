// Pure day/night grading (v0.37). All the *maths* of the atmosphere lives here,
// framework- and WebGL-free, so it is unit-testable in node: given a normalised
// time-of-day `t ∈ [0,1)` it returns the sun direction plus every colour and
// intensity the scene needs. `SkyEnvironment.ts` merely applies these values to
// three.js objects. Nothing here touches the simulation (CLAUDE.md §1).
//
// Time model: 0.0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset. The sun
// rises in the east (+x), climbs to the zenith and sets in the west (-x); below
// the horizon the dominant light becomes a dim, cool moon from the opposite side.

import { Color } from 'three';

const TAU = Math.PI * 2;

/** Wrap any real number into [0,1). */
export function wrap01(t: number): number {
  return ((t % 1) + 1) % 1;
}

/** Sun elevation in [-1,1]: 0 at sunrise/sunset, +1 at noon, -1 at midnight. */
export function sunElevation(t: number): number {
  return Math.sin((wrap01(t) - 0.25) * TAU);
}

/** Unit-ish direction *towards* the sun (i.e. where the light comes from). A
 *  constant northward `z` bias keeps shadows from being pure side-light. */
export function sunDirection(t: number): { x: number; y: number; z: number } {
  const phase = (wrap01(t) - 0.25) * TAU;
  const x = Math.cos(phase);
  const y = Math.sin(phase);
  const z = -0.45;
  const len = Math.hypot(x, y, z) || 1;
  return { x: x / len, y: y / len, z: z / len };
}

/** Direction towards the moon — opposite the sun, so it is overhead at night. */
export function moonDirection(t: number): { x: number; y: number; z: number } {
  return sunDirection(t + 0.5);
}

/** Everything the renderer needs to paint the sky/lights for a moment in the day. */
export interface EnvGrade {
  /** Colour of the sky at the zenith. */
  skyTop: Color;
  /** Colour of the sky at the horizon (also drives the fog + water tint). */
  skyHorizon: Color;
  /** Distance fog colour. */
  fog: Color;
  /** Water surface tint (reflects the sky mood). */
  water: Color;
  /** Colour of the dominant directional light (sun by day, cool moon by night). */
  sunColor: Color;
  /** Intensity of the dominant directional light. */
  sunIntensity: number;
  /** Ambient fill so the night never goes fully black (city stays readable). */
  ambient: number;
  /** Hemisphere light sky/ground colours + intensity. */
  hemiSky: Color;
  hemiGround: Color;
  hemiIntensity: number;
  /** Star field opacity (0 by day, 1 deep night). */
  stars: number;
  /** Moon disc opacity (0 by day, 1 deep night). */
  moon: number;
}

interface Key {
  t: number;
  skyTop: number;
  skyHorizon: number;
  fog: number;
  sunColor: number;
  sunIntensity: number;
  ambient: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  stars: number;
  moon: number;
}

// Art-directed keyframes across the day. Values between two keys are linearly
// interpolated (colours in linear RGB); the list wraps 0.86 → 1.0/0.0. Noon
// deliberately keeps the original static look (#9fd0ef horizon) for parity.
//
// § MVP3 Phase 2 (Atmosphäre & Licht): daytime `ambient` was lifted a touch and
// `hemiGround` warmed so ACES filmic tone mapping (which compresses highlights and
// deepens shadows) does not crush the shaded terrain/mountain faces into flat mud
// — soft bounce fill keeps the world readable and warm. Night keys are untouched
// so the day/night contrast (and stars) stay intact.
const KEYS: Key[] = [
  { t: 0.0, skyTop: 0x0a1230, skyHorizon: 0x16203f, fog: 0x16203f, sunColor: 0x9fb4e0, sunIntensity: 0.18, ambient: 0.1, hemiSky: 0x24304f, hemiGround: 0x10131c, hemiIntensity: 0.35, stars: 1, moon: 1 },
  { t: 0.22, skyTop: 0x243a63, skyHorizon: 0x7a5a72, fog: 0x6f5570, sunColor: 0xd98a5a, sunIntensity: 0.28, ambient: 0.15, hemiSky: 0x3a4a72, hemiGround: 0x2a2620, hemiIntensity: 0.52, stars: 0.5, moon: 0.45 },
  { t: 0.28, skyTop: 0x5a86c0, skyHorizon: 0xf0a878, fog: 0xf0b890, sunColor: 0xffd0a0, sunIntensity: 1.05, ambient: 0.27, hemiSky: 0x86b0e0, hemiGround: 0x6a5238, hemiIntensity: 0.9, stars: 0, moon: 0 },
  { t: 0.36, skyTop: 0x6ea6df, skyHorizon: 0xcfe3f2, fog: 0xcfe3f2, sunColor: 0xfff0d8, sunIntensity: 1.3, ambient: 0.31, hemiSky: 0xbcd8f0, hemiGround: 0x74805e, hemiIntensity: 1.05, stars: 0, moon: 0 },
  { t: 0.5, skyTop: 0x4f97e6, skyHorizon: 0x9fd0ef, fog: 0x9fd0ef, sunColor: 0xfff6e2, sunIntensity: 1.42, ambient: 0.33, hemiSky: 0xffffff, hemiGround: 0x74805e, hemiIntensity: 1.1, stars: 0, moon: 0 },
  { t: 0.64, skyTop: 0x5f9ee0, skyHorizon: 0xbfe0f2, fog: 0xbfe0f2, sunColor: 0xfff0d0, sunIntensity: 1.3, ambient: 0.31, hemiSky: 0xbcd8f0, hemiGround: 0x74805e, hemiIntensity: 1.05, stars: 0, moon: 0 },
  { t: 0.72, skyTop: 0x55719c, skyHorizon: 0xf2915a, fog: 0xf0a878, sunColor: 0xffbf88, sunIntensity: 1.08, ambient: 0.27, hemiSky: 0x9aacd0, hemiGround: 0x6a4a30, hemiIntensity: 0.85, stars: 0, moon: 0 },
  { t: 0.78, skyTop: 0x2e3d68, skyHorizon: 0x9a5a6e, fog: 0x7a5470, sunColor: 0xb07a70, sunIntensity: 0.4, ambient: 0.17, hemiSky: 0x3e4c74, hemiGround: 0x221e20, hemiIntensity: 0.52, stars: 0.5, moon: 0.45 },
  { t: 0.86, skyTop: 0x101a3c, skyHorizon: 0x1a2444, fog: 0x1a2444, sunColor: 0x9fb4e0, sunIntensity: 0.2, ambient: 0.11, hemiSky: 0x26324f, hemiGround: 0x10131c, hemiIntensity: 0.36, stars: 1, moon: 1 },
];

function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

/** Find the two keyframes bracketing `t` (with wraparound) and the blend factor. */
function bracket(t: number): { a: Key; b: Key; k: number } {
  const x = wrap01(t);
  const a = KEYS[KEYS.length - 1]!;
  const b = KEYS[0]!;
  for (let i = 0; i < KEYS.length; i++) {
    const cur = KEYS[i]!;
    const nxt = KEYS[i + 1];
    if (nxt && x >= cur.t && x < nxt.t) {
      return { a: cur, b: nxt, k: (x - cur.t) / (nxt.t - cur.t) };
    }
  }
  // Wraparound segment: last key → first key across midnight.
  const span = 1 - a.t + b.t;
  const into = x >= a.t ? x - a.t : 1 - a.t + x;
  return { a, b, k: span > 0 ? into / span : 0 };
}

const _a = new Color();
const _b = new Color();
function mixColor(ca: number, cb: number, k: number): Color {
  _a.set(ca);
  _b.set(cb);
  return new Color().copy(_a).lerp(_b, k);
}

/** Full atmosphere grade for a normalised time-of-day. */
export function grade(t: number): EnvGrade {
  const { a, b, k } = bracket(t);
  const skyHorizon = mixColor(a.skyHorizon, b.skyHorizon, k);
  return {
    skyTop: mixColor(a.skyTop, b.skyTop, k),
    skyHorizon,
    fog: mixColor(a.fog, b.fog, k),
    // Keep the island silhouette readable at every time of day. The previous
    // mostly-horizon tint became almost identical to fog in the steep overview.
    water: new Color(0x0b6f9f).lerp(skyHorizon, 0.18),
    sunColor: mixColor(a.sunColor, b.sunColor, k),
    sunIntensity: lerp(a.sunIntensity, b.sunIntensity, k),
    ambient: lerp(a.ambient, b.ambient, k),
    hemiSky: mixColor(a.hemiSky, b.hemiSky, k),
    hemiGround: mixColor(a.hemiGround, b.hemiGround, k),
    hemiIntensity: lerp(a.hemiIntensity, b.hemiIntensity, k),
    stars: lerp(a.stars, b.stars, k),
    moon: lerp(a.moon, b.moon, k),
  };
}
