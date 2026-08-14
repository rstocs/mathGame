import type { PersistedState, World } from '../types/game';

export function isLevelUnlocked(world: World, state: PersistedState, levelIndex: number): boolean {
  if (levelIndex === 0) return true;
  const previousLevel = world.levels[levelIndex - 1];
  const progress = state.levelProgress[previousLevel.id];
  return (progress?.bestAccuracy ?? 0) >= previousLevel.passThreshold;
}

/**
 * `worlds` must be the list for a single grade, in map order. Grades are freely
 * selectable — a 9th grader should not have to clear grade 7 first — so
 * unlocking only ever chains within one grade's map.
 */
export function isWorldUnlocked(worlds: World[], state: PersistedState, worldIndex: number): boolean {
  if (worldIndex === 0) return true;
  const previousWorld = worlds[worldIndex - 1];
  if (!previousWorld) return true;
  const finalLevel = previousWorld.levels[previousWorld.levels.length - 1];
  const progress = state.levelProgress[finalLevel.id];
  return (progress?.bestAccuracy ?? 0) >= finalLevel.passThreshold;
}

export function hasAllStarsInWorld(world: World, state: PersistedState): boolean {
  return world.levels.every((level) => (state.levelProgress[level.id]?.stars ?? 0) === 3);
}

/** Fraction of a grade's levels that have been passed, for the grade cards. */
export function gradeCompletion(worlds: World[], state: PersistedState): number {
  const levels = worlds.flatMap((w) => w.levels);
  if (levels.length === 0) return 0;
  const passed = levels.filter(
    (level) => (state.levelProgress[level.id]?.bestAccuracy ?? 0) >= level.passThreshold,
  ).length;
  return passed / levels.length;
}

/** Total stars earned across a grade, and the most it could be. */
export function gradeStars(worlds: World[], state: PersistedState): { earned: number; possible: number } {
  const levels = worlds.flatMap((w) => w.levels);
  return {
    earned: levels.reduce((sum, level) => sum + (state.levelProgress[level.id]?.stars ?? 0), 0),
    possible: levels.length * 3,
  };
}
