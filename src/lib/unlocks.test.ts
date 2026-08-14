import { describe, it, expect } from 'vitest';
import { isLevelUnlocked, isWorldUnlocked, hasAllStarsInWorld } from './unlocks';
import type { Level, LevelProgress, PersistedState, StrandId, World } from '../types/game';

function makeLevel(id: string, strand: StrandId, order: number): Level {
  return {
    id,
    strand,
    order,
    title: id,
    description: id,
    questionIds: [],
    passThreshold: 0.6,
  };
}

function makeWorld(id: StrandId, levelIds: string[]): World {
  return {
    id,
    name: id,
    shortLabel: id,
    description: id,
    colorTheme: { primary: '#000', secondary: '#111', accent: '#222' },
    icon: 'mountain',
    levels: levelIds.map((levelId, i) => makeLevel(levelId, id, i + 1)),
  };
}

function makeProgress(stars: 0 | 1 | 2 | 3, bestAccuracy: number): LevelProgress {
  return { stars, bestAccuracy, timesPlayed: 1, lastPlayedAt: '2026-01-01T00:00:00.000Z' };
}

function makeState(levelProgress: Record<string, LevelProgress> = {}): PersistedState {
  return {
    version: 1,
    playerName: 'Test',
    totalXP: 0,
    bestStreakEver: 0,
    unlockedBadgeIds: [],
    levelProgress,
    currentWorldId: 'ratios-proportions',
    soundEnabled: true,
  };
}

const worldA = makeWorld('ratios-proportions', ['a-1', 'a-2', 'a-3']);
const worldB = makeWorld('number-system', ['b-1', 'b-2']);
const worlds = [worldA, worldB];

describe('isLevelUnlocked', () => {
  it('always unlocks the first level of a world', () => {
    expect(isLevelUnlocked(worldA, makeState(), 0)).toBe(true);
  });

  it('keeps later levels locked until the previous one is passed', () => {
    expect(isLevelUnlocked(worldA, makeState(), 1)).toBe(false);
  });

  it('unlocks the next level once the previous meets its pass threshold', () => {
    const state = makeState({ 'a-1': makeProgress(1, 0.6) });
    expect(isLevelUnlocked(worldA, state, 1)).toBe(true);
  });

  it('does not unlock on a failing attempt', () => {
    const state = makeState({ 'a-1': makeProgress(0, 0.59) });
    expect(isLevelUnlocked(worldA, state, 1)).toBe(false);
  });

  it('gates only on the immediately preceding level', () => {
    // Passing level 1 but not 2 must not unlock level 3.
    const state = makeState({ 'a-1': makeProgress(3, 1) });
    expect(isLevelUnlocked(worldA, state, 2)).toBe(false);
  });
});

describe('isWorldUnlocked', () => {
  it('always unlocks the first world', () => {
    expect(isWorldUnlocked(worlds, makeState(), 0)).toBe(true);
  });

  it('keeps the next world locked until the previous world is finished', () => {
    expect(isWorldUnlocked(worlds, makeState(), 1)).toBe(false);
  });

  it('requires the final level of the previous world, not just any level', () => {
    const partial = makeState({ 'a-1': makeProgress(3, 1), 'a-2': makeProgress(3, 1) });
    expect(isWorldUnlocked(worlds, partial, 1)).toBe(false);

    const finished = makeState({ 'a-3': makeProgress(1, 0.6) });
    expect(isWorldUnlocked(worlds, finished, 1)).toBe(true);
  });
});

describe('hasAllStarsInWorld', () => {
  it('is false for an untouched world', () => {
    expect(hasAllStarsInWorld(worldB, makeState())).toBe(false);
  });

  it('is false when any level is short of 3 stars', () => {
    const state = makeState({ 'b-1': makeProgress(3, 1), 'b-2': makeProgress(2, 0.8) });
    expect(hasAllStarsInWorld(worldB, state)).toBe(false);
  });

  it('is true only when every level has 3 stars', () => {
    const state = makeState({ 'b-1': makeProgress(3, 1), 'b-2': makeProgress(3, 1) });
    expect(hasAllStarsInWorld(worldB, state)).toBe(true);
  });
});
