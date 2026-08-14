import { describe, it, expect } from 'vitest';
import {
  streakMultiplier,
  xpForCorrectAnswer,
  xpForLevelCompletion,
  playerLevelFromXP,
  xpThresholdForPlayerLevel,
  playerLevelProgress,
} from './xp';

describe('streakMultiplier', () => {
  it('stays at 1x until the third consecutive correct answer', () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(1)).toBe(1);
    expect(streakMultiplier(2)).toBe(1);
  });

  it('steps up by 0.5x every 3 answers in the streak', () => {
    expect(streakMultiplier(3)).toBe(1.5);
    expect(streakMultiplier(5)).toBe(1.5);
    expect(streakMultiplier(6)).toBe(2);
    expect(streakMultiplier(9)).toBe(2.5);
  });

  it('caps at 3x no matter how long the streak runs', () => {
    expect(streakMultiplier(12)).toBe(3);
    expect(streakMultiplier(50)).toBe(3);
    expect(streakMultiplier(1000)).toBe(3);
  });
});

describe('xpForCorrectAnswer', () => {
  it('awards the 10 XP base with no streak', () => {
    expect(xpForCorrectAnswer(0)).toBe(10);
  });

  it('scales with the streak multiplier and returns whole numbers', () => {
    expect(xpForCorrectAnswer(3)).toBe(15);
    expect(xpForCorrectAnswer(6)).toBe(20);
    expect(xpForCorrectAnswer(100)).toBe(30);
    expect(Number.isInteger(xpForCorrectAnswer(4))).toBe(true);
  });
});

describe('xpForLevelCompletion', () => {
  it('awards 25 XP per star, and nothing for a failed level', () => {
    expect(xpForLevelCompletion(0)).toBe(0);
    expect(xpForLevelCompletion(1)).toBe(25);
    expect(xpForLevelCompletion(2)).toBe(50);
    expect(xpForLevelCompletion(3)).toBe(75);
  });
});

describe('playerLevelFromXP', () => {
  it('starts a brand-new player at level 1', () => {
    expect(playerLevelFromXP(0)).toBe(1);
  });

  it('levels up at the documented thresholds', () => {
    expect(playerLevelFromXP(49)).toBe(1);
    expect(playerLevelFromXP(50)).toBe(2);
    expect(playerLevelFromXP(200)).toBe(3);
    expect(playerLevelFromXP(450)).toBe(4);
  });

  it('never regresses as XP grows', () => {
    let previous = playerLevelFromXP(0);
    for (let xp = 0; xp <= 5000; xp += 25) {
      const current = playerLevelFromXP(xp);
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });
});

describe('xpThresholdForPlayerLevel', () => {
  it('is the inverse of playerLevelFromXP at each boundary', () => {
    for (let level = 1; level <= 20; level += 1) {
      const threshold = xpThresholdForPlayerLevel(level);
      expect(playerLevelFromXP(threshold)).toBe(level);
      if (threshold > 0) {
        expect(playerLevelFromXP(threshold - 1)).toBe(level - 1);
      }
    }
  });
});

describe('playerLevelProgress', () => {
  it('reports a fresh player as level 1 with an empty bar', () => {
    const progress = playerLevelProgress(0);
    expect(progress.playerLevel).toBe(1);
    expect(progress.currentLevelXP).toBe(0);
    expect(progress.progressFraction).toBe(0);
  });

  it('reports partial progress within a level', () => {
    // Level 2 spans 50 -> 200 XP, so 125 XP is exactly halfway.
    const progress = playerLevelProgress(125);
    expect(progress.playerLevel).toBe(2);
    expect(progress.currentLevelXP).toBe(75);
    expect(progress.xpNeededForNextLevel).toBe(150);
    expect(progress.progressFraction).toBeCloseTo(0.5);
  });

  it('keeps the progress fraction within 0..1 across a wide XP range', () => {
    for (let xp = 0; xp <= 10000; xp += 37) {
      const { progressFraction } = playerLevelProgress(xp);
      expect(progressFraction).toBeGreaterThanOrEqual(0);
      expect(progressFraction).toBeLessThanOrEqual(1);
    }
  });
});
