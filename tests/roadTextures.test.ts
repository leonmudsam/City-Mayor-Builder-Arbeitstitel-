import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderRoadTexturesDoc, ROAD_TEXTURES } from '../src/assets/roadTextureManifest.ts';

// Keeps docs/ROAD_TEXTURES.md in sync with roadTextureManifest.ts, the same way
// terrainTextures.test.ts guards the terrain-texture docs — add a texture there
// and this test fails until the doc is regenerated.
//
//   Regenerate:  WRITE_ROAD_DOCS=1 npx vitest run tests/roadTextures.test.ts
const WRITE = !!process.env['WRITE_ROAD_DOCS'];
const docPath = fileURLToPath(new URL('../docs/ROAD_TEXTURES.md', import.meta.url));

describe('road texture docs', () => {
  it('docs/ROAD_TEXTURES.md is up to date', () => {
    const content = renderRoadTexturesDoc();
    if (WRITE) {
      writeFileSync(docPath, content, 'utf8');
      return;
    }
    expect(existsSync(docPath), `Missing ${docPath} — run WRITE_ROAD_DOCS=1 npx vitest run tests/roadTextures.test.ts`).toBe(true);
    expect(
      readFileSync(docPath, 'utf8'),
      'docs/ROAD_TEXTURES.md is stale — run WRITE_ROAD_DOCS=1 npx vitest run tests/roadTextures.test.ts',
    ).toBe(content);
  });

  it('every texture name is unique', () => {
    const names = ROAD_TEXTURES.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every texture name follows the road_ naming convention', () => {
    const bad = ROAD_TEXTURES.filter((t) => !/^road_[a-z0-9_]+$/.test(t.name)).map((t) => t.name);
    expect(bad, `Non-conforming names: ${bad.join(', ')}`).toEqual([]);
  });
});
