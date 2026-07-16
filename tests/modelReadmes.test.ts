import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  MODEL_FOLDER_DOCS,
  FOLDER_PROMPTS,
  BUILDING_PROMPTS,
  renderFolderReadme,
  renderFolderPrompts,
  buildBuildingsReadme,
  buildBuildingsPrompts,
  type BuildingLike,
} from '../src/assets/modelManifest.ts';
import { buildingsConfig } from '../src/game/config/buildings.config.ts';

// Keeps every src/assets/models/<folder>/README.md AND PROMPTS.md in sync with the
// code that loads the models (modelManifest.ts) and with buildings.config.ts. Add a
// building or an accepted model name and these tests fail until the docs/prompts are
// regenerated — so "die Listen aktualisieren sich, wenn etwas dazukommt".
//
//   Regenerate:  WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts
const WRITE = !!process.env['WRITE_MODEL_DOCS'];
const bc = buildingsConfig as unknown as BuildingLike[];
const pathFor = (rel: string) => fileURLToPath(new URL(`../src/assets/models/${rel}`, import.meta.url));

/** [relative path, expected markdown] for every generated docs/prompt file. */
const expected: [string, string][] = [
  ['buildings/README.md', buildBuildingsReadme(bc)],
  ['buildings/PROMPTS.md', buildBuildingsPrompts(bc)],
  ...MODEL_FOLDER_DOCS.map((doc): [string, string] => [`${doc.key}/README.md`, renderFolderReadme(doc)]),
  ...FOLDER_PROMPTS.map((fp): [string, string] => [`${fp.key}/PROMPTS.md`, renderFolderPrompts(fp)]),
];

describe('per-folder model docs (README + PROMPTS)', () => {
  for (const [rel, content] of expected) {
    it(`models/${rel} is up to date`, () => {
      const file = pathFor(rel);
      if (WRITE) {
        writeFileSync(file, content, 'utf8');
        return;
      }
      expect(existsSync(file), `Missing ${file} — run WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`).toBe(
        true,
      );
      expect(
        readFileSync(file, 'utf8'),
        `models/${rel} is stale — run WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`,
      ).toBe(content);
    });
  }

  it('has a generation prompt for every building id', () => {
    const missing = bc.filter((b) => b.category !== 'roads').filter((b) => !BUILDING_PROMPTS[b.id]).map((b) => b.id);
    expect(missing, `BUILDING_PROMPTS fehlt Gebäude: ${missing.join(', ')}`).toEqual([]);
  });
});
