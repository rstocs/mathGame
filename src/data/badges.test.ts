import { describe, it, expect } from 'vitest';
import { badges, checkBadgeUnlocks } from './badges';
import { worldsForGrade } from './worlds';
import type { GradeId, LevelProgress, PersistedState } from '../types/game';

function progress(stars: 0 | 1 | 2 | 3, accuracy = 1): LevelProgress {
  return { stars, bestAccuracy: accuracy, timesPlayed: 1, lastPlayedAt: '2026-01-01T00:00:00.000Z' };
}

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

function starGrade(state: PersistedState, grade: GradeId, stars: 0 | 1 | 2 | 3 = 3): void {
  for (const level of worldsForGrade(grade).flatMap((w) => w.levels)) {
    state.levelProgress[level.id] = progress(stars);
  }
}

describe('badge definitions', () => {
  it('has a unique id per badge', () => {
    const ids = badges.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every badge a condition that can actually fire', () => {
    // Regression: after worlds gained grade-prefixed ids, the champion badges
    // still looked up bare strand ids and were silently unreachable forever.
    const state = emptyState();
    state.totalXP = 999999;
    state.bestStreakEver = 999;
    for (const grade of [7, 8, 9] as GradeId[]) starGrade(state, grade);

    const unlocked = checkBadgeUnlocks(state);
    for (const badge of badges) {
      expect(unlocked, `${badge.id} can never be earned`).toContain(badge.id);
    }
  });
});

describe('badge conditions', () => {
  it('awards nothing to a brand-new player', () => {
    expect(checkBadgeUnlocks(emptyState())).toEqual([]);
  });

  it('awards the grade 7 champion badges only when that world is fully starred', () => {
    const state = emptyState();
    const ridge = worldsForGrade(7)[0];
    for (const level of ridge.levels) state.levelProgress[level.id] = progress(2, 0.8);
    expect(checkBadgeUnlocks(state)).not.toContain('champion-ratios-proportions');

    for (const level of ridge.levels) state.levelProgress[level.id] = progress(3);
    expect(checkBadgeUnlocks(state)).toContain('champion-ratios-proportions');
  });

  it('scopes the graduate badges to their own grade', () => {
    const state = emptyState();
    starGrade(state, 7);
    const unlocked = checkBadgeUnlocks(state);
    expect(unlocked).toContain('game-complete');
    expect(unlocked).not.toContain('grade-8-complete');
    expect(unlocked).not.toContain('grade-9-complete');
  });

  it('does not gate the grade 7 Explorer badge behind other grades', () => {
    const state = emptyState();
    starGrade(state, 7);
    expect(checkBadgeUnlocks(state)).toContain('all-worlds-unlocked');
  });

  it('awards Time Traveller only after playing all three grades', () => {
    const state = emptyState();
    state.levelProgress[worldsForGrade(7)[0].levels[0].id] = progress(1, 0.6);
    state.levelProgress[worldsForGrade(8)[0].levels[0].id] = progress(1, 0.6);
    expect(checkBadgeUnlocks(state)).not.toContain('cross-grade');

    state.levelProgress[worldsForGrade(9)[0].levels[0].id] = progress(1, 0.6);
    expect(checkBadgeUnlocks(state)).toContain('cross-grade');
  });

  it('never re-awards a badge already held', () => {
    const state = emptyState();
    state.totalXP = 600;
    expect(checkBadgeUnlocks(state)).toContain('xp-500');

    state.unlockedBadgeIds = ['xp-500'];
    expect(checkBadgeUnlocks(state)).not.toContain('xp-500');
  });
});
