import { describe, it, expect } from 'vitest';
import { worlds, worldsForGrade, getWorld, getWorldForLevel, getLevel } from './worlds';
import { GRADE_IDS } from '../types/game';
import { MAP_LAYOUT, MAP_LAYOUT_PORTRAIT } from '../components/map/mapLayout';
import { gradeCompletion, gradeStars, isWorldUnlocked } from '../lib/unlocks';
import type { PersistedState } from '../types/game';

function emptyState(): PersistedState {
  return {
    version: 1,
    playerName: 'Test',
    totalXP: 0,
    bestStreakEver: 0,
    unlockedBadgeIds: [],
    levelProgress: {},
    currentWorldId: 'g7-ratios-proportions',
    selectedGradeId: 7,
    soundEnabled: true,
  };
}

describe('world and level identity', () => {
  it('gives every world a unique id', () => {
    const ids = worlds.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every level a unique id across all grades', () => {
    const ids = worlds.flatMap((w) => w.levels.map((l) => l.id));
    expect(new Set(ids).size, 'duplicate level ids would collide in levelProgress').toBe(ids.length);
  });

  it('numbers levels consecutively from 1 within each world', () => {
    for (const world of worlds) {
      expect(
        world.levels.map((l) => l.order),
        `${world.id} has non-consecutive level order`,
      ).toEqual(world.levels.map((_, i) => i + 1));
    }
  });

  it('resolves a world from any of its level ids', () => {
    for (const world of worlds) {
      for (const level of world.levels) {
        expect(getWorldForLevel(level.id)?.id, `${level.id}`).toBe(world.id);
        expect(getLevel(level.id)?.id).toBe(level.id);
      }
    }
  });

  it('returns undefined rather than throwing for unknown ids', () => {
    expect(getWorld('nope')).toBeUndefined();
    expect(getWorldForLevel('nope')).toBeUndefined();
    expect(getLevel('nope')).toBeUndefined();
  });
});

describe('grades', () => {
  it('covers every grade from 5 to 9', () => {
    for (const grade of GRADE_IDS) {
      expect(worldsForGrade(grade).length, `grade ${grade} has no worlds`).toBeGreaterThan(0);
    }
    expect(new Set(worlds.map((w) => w.grade))).toEqual(new Set(GRADE_IDS));
  });

  it('never puts more worlds on a map than the layout has nodes', () => {
    for (const grade of GRADE_IDS) {
      const count = worldsForGrade(grade).length;
      expect(count, `grade ${grade} overflows the wide map`).toBeLessThanOrEqual(MAP_LAYOUT.length);
      expect(count, `grade ${grade} overflows the portrait map`).toBeLessThanOrEqual(
        MAP_LAYOUT_PORTRAIT.length,
      );
    }
  });

  it('gives every level at least one question to ask', () => {
    for (const world of worlds) {
      for (const level of world.levels) {
        const total = level.questionIds.length + (level.generated?.length ?? 0);
        expect(total, `${level.id} has no questions`).toBeGreaterThan(0);
      }
    }
  });

  it('assigns every world a strand that has a theme', () => {
    const themed = new Set([
      'ratios-proportions',
      'number-system',
      'expressions-equations',
      'geometry',
      'statistics-probability',
    ]);
    for (const world of worlds) {
      expect(themed.has(world.strand), `${world.id} has an unthemed strand`).toBe(true);
    }
  });
});

describe('grade-scoped unlocking', () => {
  it('unlocks the first world of every grade without prior progress', () => {
    const state = emptyState();
    for (const grade of GRADE_IDS) {
      expect(isWorldUnlocked(worldsForGrade(grade), state, 0), `grade ${grade} is gated shut`).toBe(true);
    }
  });

  it('does not require finishing grade 7 to start grade 8', () => {
    // The whole point of a free grade selector: a 9th grader starts at grade 9.
    const state = emptyState();
    expect(isWorldUnlocked(worldsForGrade(9), state, 0)).toBe(true);
  });

  it('still chains world unlocking within a grade', () => {
    const state = emptyState();
    const g8 = worldsForGrade(8);
    expect(isWorldUnlocked(g8, state, 1)).toBe(false);

    const previous = g8[0];
    const finalLevel = previous.levels[previous.levels.length - 1];
    state.levelProgress[finalLevel.id] = {
      stars: 2,
      bestAccuracy: 0.9,
      timesPlayed: 1,
      lastPlayedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(isWorldUnlocked(g8, state, 1)).toBe(true);
  });
});

describe('grade progress summaries', () => {
  it('reports zero for an untouched grade and 1 when every level is passed', () => {
    const state = emptyState();
    const g9 = worldsForGrade(9);
    expect(gradeCompletion(g9, state)).toBe(0);
    expect(gradeStars(g9, state).earned).toBe(0);

    for (const level of g9.flatMap((w) => w.levels)) {
      state.levelProgress[level.id] = {
        stars: 3,
        bestAccuracy: 1,
        timesPlayed: 1,
        lastPlayedAt: '2026-01-01T00:00:00.000Z',
      };
    }
    expect(gradeCompletion(g9, state)).toBe(1);
    const stars = gradeStars(g9, state);
    expect(stars.earned).toBe(stars.possible);
  });

  it('counts only the grade asked about', () => {
    const state = emptyState();
    for (const level of worldsForGrade(7).flatMap((w) => w.levels)) {
      state.levelProgress[level.id] = {
        stars: 3,
        bestAccuracy: 1,
        timesPlayed: 1,
        lastPlayedAt: '2026-01-01T00:00:00.000Z',
      };
    }
    expect(gradeCompletion(worldsForGrade(7), state)).toBe(1);
    expect(gradeCompletion(worldsForGrade(8), state)).toBe(0);
  });
});
