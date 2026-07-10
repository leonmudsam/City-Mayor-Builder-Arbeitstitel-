import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/game/config/index.ts';

describe('config', () => {
  it('loads and validates all static configs', () => {
    const config = loadConfig();
    expect(config.buildingList.length).toBeGreaterThanOrEqual(18);
    expect(config.levels.length).toBe(10);
    expect(config.questList.length).toBeGreaterThanOrEqual(15);
    expect(config.mayorActions.length).toBe(3);
  });

  it('has a strictly increasing XP curve', () => {
    const config = loadConfig();
    for (let i = 1; i < config.levels.length; i++) {
      expect(config.levels[i]!.xpRequired).toBeGreaterThan(config.levels[i - 1]!.xpRequired);
    }
  });
});
