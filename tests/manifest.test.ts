import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildingsConfig } from '../src/game/config/buildings.config.ts';

// Keeps docs/3D_MODEL_MANIFEST.md in sync with the building config: every building
// id must be listed in the manifest, so adding a building without documenting its
// 3D model fails loudly (§ "die Liste soll geupdatet werden, sobald neue Gebäude
// hinzukommen"). Also guards against typos in the manifest's building-id column.
const manifestPath = fileURLToPath(new URL('../docs/3D_MODEL_MANIFEST.md', import.meta.url));
const manifest = readFileSync(manifestPath, 'utf8');

describe('3D model manifest', () => {
  it('lists every building id from buildings.config', () => {
    const missing = buildingsConfig.map((b) => b.id).filter((id) => !manifest.includes(id));
    expect(missing, `docs/3D_MODEL_MANIFEST.md fehlt Gebäude: ${missing.join(', ')}`).toEqual([]);
  });

  it('references every building model file (<id>.glb), except the special-cased road', () => {
    const missing = buildingsConfig
      .filter((b) => b.id !== 'road') // road uses the roads/ segment system, not buildings/road.glb
      .map((b) => `${b.id}.glb`)
      .filter((file) => !manifest.includes(file));
    expect(missing, `Manifest fehlt Modelldatei(en): ${missing.join(', ')}`).toEqual([]);
  });
});
