import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  MODEL_FOLDER_DOCS,
  renderFolderReadme,
  buildBuildingsReadme,
  type BuildingLike,
} from '../src/assets/modelManifest.ts';
import { buildingsConfig } from '../src/game/config/buildings.config.ts';

// Keeps every src/assets/models/<folder>/README.md in sync with the code that
// actually loads the models (modelManifest.ts) and with buildings.config.ts. Add a
// building or an accepted model name and this test fails until the READMEs are
// regenerated — so "die Liste aktualisiert sich, wenn etwas dazukommt".
//
//   Regenerate:  WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts
const WRITE = !!process.env['WRITE_MODEL_DOCS'];
const pathFor = (key: string) =>
  fileURLToPath(new URL(`../src/assets/models/${key}/README.md`, import.meta.url));

/** [folderKey, expected markdown] for every documented model folder. */
const expected: [string, string][] = [
  ['buildings', buildBuildingsReadme(buildingsConfig as unknown as BuildingLike[])],
  ...MODEL_FOLDER_DOCS.map((doc): [string, string] => [doc.key, renderFolderReadme(doc)]),
];

describe('per-folder model READMEs', () => {
  for (const [key, content] of expected) {
    it(`models/${key}/README.md is up to date`, () => {
      const file = pathFor(key);
      if (WRITE) {
        writeFileSync(file, content, 'utf8');
        return;
      }
      expect(existsSync(file), `Missing ${file} — run WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`).toBe(
        true,
      );
      expect(
        readFileSync(file, 'utf8'),
        `models/${key}/README.md is stale — run WRITE_MODEL_DOCS=1 npx vitest run tests/modelReadmes.test.ts`,
      ).toBe(content);
    });
  }
});
