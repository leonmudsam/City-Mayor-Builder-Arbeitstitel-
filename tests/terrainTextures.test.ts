import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  CATEGORY_DEFAULTS,
  renderTerrainTexturesDoc,
  TERRAIN_TEXTURES,
} from '../src/assets/terrainTextureManifest.ts';

// Keeps docs/TERRAIN_TEXTURES.md in sync with terrainTextureManifest.ts, the same
// way modelReadmes.test.ts guards the 3D-model docs — add a texture there and this
// test fails until the doc is regenerated.
//
//   Regenerate:  WRITE_TERRAIN_DOCS=1 npx vitest run tests/terrainTextures.test.ts
const WRITE = !!process.env['WRITE_TERRAIN_DOCS'];
const docPath = fileURLToPath(new URL('../docs/TERRAIN_TEXTURES.md', import.meta.url));

describe('terrain texture docs', () => {
  it('docs/TERRAIN_TEXTURES.md is up to date', () => {
    const content = renderTerrainTexturesDoc();
    if (WRITE) {
      writeFileSync(docPath, content, 'utf8');
      return;
    }
    expect(existsSync(docPath), `Missing ${docPath} — run WRITE_TERRAIN_DOCS=1 npx vitest run tests/terrainTextures.test.ts`).toBe(true);
    expect(
      readFileSync(docPath, 'utf8'),
      'docs/TERRAIN_TEXTURES.md is stale — run WRITE_TERRAIN_DOCS=1 npx vitest run tests/terrainTextures.test.ts',
    ).toBe(content);
  });

  it('every texture name is unique', () => {
    const names = TERRAIN_TEXTURES.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every texture name follows a documented terrain/biome naming convention', () => {
    const bad = TERRAIN_TEXTURES
      .filter((t) => !/^(terrain|mountain|desert|swamp|coast|grass|forest|dry|fertile|moor)_[a-z0-9_]+$/.test(t.name))
      .map((t) => t.name);
    expect(bad, `Non-conforming names: ${bad.join(', ')}`).toEqual([]);
  });

  it('dokumentiert für gelieferte Cartoon-Albedos ihre echte PNG-Auflösung', () => {
    const supplied = TERRAIN_TEXTURES.filter((texture) => texture.resolution);
    expect(supplied.length).toBeGreaterThan(0);
    for (const texture of supplied) {
      const defaults = CATEGORY_DEFAULTS[texture.category];
      const path = fileURLToPath(
        new URL(`../src/assets/${texture.folder ?? defaults.folder}${texture.name}.png`, import.meta.url),
      );
      const png = readFileSync(path);
      expect(png.subarray(1, 4).toString('ascii'), path).toBe('PNG');
      const actual = `${png.readUInt32BE(16)}×${png.readUInt32BE(20)}`;
      expect(actual, texture.name).toBe(texture.resolution);
    }
  });
});
