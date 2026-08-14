import { describe, it, expect } from 'vitest';
import { migratePersistedState } from './migration';
import { getWorld } from '../data/worlds';

describe('v1 -> v2 save migration', () => {
  const v1Save = {
    version: 1,
    playerName: 'Alex',
    totalXP: 420,
    bestStreakEver: 7,
    unlockedBadgeIds: ['first-steps'],
    levelProgress: {
      'rp-l1': { stars: 3 as const, bestAccuracy: 1, timesPlayed: 2, lastPlayedAt: '2026-01-01T00:00:00.000Z' },
    },
    currentWorldId: 'geometry',
    soundEnabled: false,
  };

  it('rewrites a bare strand id to its grade 7 world', () => {
    const migrated = migratePersistedState({ ...v1Save }, 1);
    expect(migrated.currentWorldId).toBe('g7-geometry');
    expect(getWorld(migrated.currentWorldId!)).toBeDefined();
  });

  it('rewrites every grade 7 strand, including ones that start with "g"', () => {
    // Regression: a startsWith('g') guard silently skipped 'geometry', the one
    // strand whose name collides with the new 'g7-' prefix.
    for (const strand of [
      'ratios-proportions',
      'number-system',
      'expressions-equations',
      'geometry',
      'statistics-probability',
    ]) {
      const migrated = migratePersistedState({ ...v1Save, currentWorldId: strand }, 1);
      expect(migrated.currentWorldId, `${strand} was not migrated`).toBe(`g7-${strand}`);
      expect(getWorld(migrated.currentWorldId!), `${strand} maps to no world`).toBeDefined();
    }
  });

  it('defaults an old save to grade 7, which is all v1 had', () => {
    expect(migratePersistedState({ ...v1Save }, 1).selectedGradeId).toBe(7);
  });

  it('preserves everything a kid actually earned', () => {
    const migrated = migratePersistedState({ ...v1Save }, 1);
    expect(migrated.totalXP).toBe(420);
    expect(migrated.bestStreakEver).toBe(7);
    expect(migrated.unlockedBadgeIds).toEqual(['first-steps']);
    expect(migrated.levelProgress?.['rp-l1'].stars).toBe(3);
    expect(migrated.playerName).toBe('Alex');
    expect(migrated.soundEnabled).toBe(false);
  });

  it('leaves an already-migrated save alone', () => {
    const v2 = { ...v1Save, currentWorldId: 'g8-geometry', selectedGradeId: 8 as const };
    const migrated = migratePersistedState(v2, 2);
    expect(migrated.currentWorldId).toBe('g8-geometry');
    expect(migrated.selectedGradeId).toBe(8);
  });

  it('does not mangle an unrecognised world id', () => {
    // Better to fall back at read time than to invent a 'g7-nonsense' world.
    const migrated = migratePersistedState({ ...v1Save, currentWorldId: 'nonsense' }, 1);
    expect(migrated.currentWorldId).toBe('nonsense');
  });

  it('survives a save missing fields entirely', () => {
    expect(() => migratePersistedState({}, 1)).not.toThrow();
    expect(migratePersistedState({}, 1).selectedGradeId).toBe(7);
  });
});
