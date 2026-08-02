import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ROAD_VARIANT_MODELS } from '../src/assets/modelManifest.ts';

const files = [
  ['roads', 'road_flat'],
  ['roads', 'road_slope'],
  ['roads', 'road_support'],
  ['roads', 'road_viaduct'],
  ['bridges', 'road_bridge'],
  ['roads', 'road_hairpin_curve'],
  ['roads', 'road_coast'],
] as const;

describe('Straßen-Drop-in-Modelle', () => {
  it.each(files)('%s/%s.glb ist ein gültiger binärer glTF-Container', (folder, name) => {
    const path = fileURLToPath(new URL(`../src/assets/models/${folder}/${name}.glb`, import.meta.url));
    const data = readFileSync(path);
    expect(data.subarray(0, 4).toString('utf8')).toBe('glTF');
    expect(data.readUInt32LE(4)).toBe(2);
    expect(data.readUInt32LE(8)).toBe(data.length);
    expect(data.length).toBeGreaterThan(2_000);
  });

  it('ordnet jede automatische Variante einem Fallback-Modell zu', () => {
    expect(Object.keys(ROAD_VARIANT_MODELS).sort()).toEqual(
      ['bridge', 'coast', 'flat', 'pass', 'slope', 'support', 'viaduct'],
    );
    expect(Object.values(ROAD_VARIANT_MODELS).every((names) => names.length > 0)).toBe(true);
  });
});
