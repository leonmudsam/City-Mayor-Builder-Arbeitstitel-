import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildBuildingsSpec, buildRegionsDoc } from '../src/assets/buildingSpecDocs.ts';
import { buildingsConfig } from '../src/game/config/buildings.config.ts';
import { levelsConfig } from '../src/game/config/levels.config.ts';
import { regionsConfig } from '../src/game/config/regions.config.ts';

// Hält docs/BUILDINGS.md und docs/REGIONS.md synchron mit der Spiel-Config
// (Auftrag A §13 „Gameplay ↔ Doku konsistent"). Ändert sich ein Gebäude, eine
// Stufe, ein Level oder eine Region, schlägt der Test fehl, bis die Doku neu
// generiert wurde:
//   WRITE_BUILDING_DOCS=1 npx vitest run tests/buildingDocs.test.ts
const WRITE = !!process.env['WRITE_BUILDING_DOCS'];
const pathFor = (rel: string) => fileURLToPath(new URL(`../docs/${rel}`, import.meta.url));

const expected: [string, string][] = [
  ['BUILDINGS.md', buildBuildingsSpec(buildingsConfig, levelsConfig)],
  ['REGIONS.md', buildRegionsDoc(regionsConfig)],
];

describe('generated gameplay docs', () => {
  for (const [rel, content] of expected) {
    it(`docs/${rel} is up to date`, () => {
      const file = pathFor(rel);
      if (WRITE) {
        writeFileSync(file, content, 'utf8');
        return;
      }
      expect(existsSync(file), `Missing docs/${rel} — run WRITE_BUILDING_DOCS=1 npx vitest run tests/buildingDocs.test.ts`).toBe(true);
      expect(
        readFileSync(file, 'utf8'),
        `docs/${rel} is stale — run WRITE_BUILDING_DOCS=1 npx vitest run tests/buildingDocs.test.ts`,
      ).toBe(content);
    });
  }

  it('documents every building and region id', () => {
    const doc = buildBuildingsSpec(buildingsConfig, levelsConfig);
    const missingB = buildingsConfig.filter((b) => b.category !== 'roads').filter((b) => !doc.includes(`\`${b.id}\``)).map((b) => b.id);
    expect(missingB, `BUILDINGS.md fehlt: ${missingB.join(', ')}`).toEqual([]);
    const rdoc = buildRegionsDoc(regionsConfig);
    const missingR = regionsConfig.filter((r) => !rdoc.includes(`| ${r.id} |`)).map((r) => r.id);
    expect(missingR, `REGIONS.md fehlt Region: ${missingR.join(', ')}`).toEqual([]);
  });
});
