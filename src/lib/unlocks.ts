import type { PersistedState, World } from '../types/game';

export function isLevelUnlocked(world: World, state: PersistedState, levelIndex: number): boolean {
  if (levelIndex === 0) return true;
  const previousLevel = world.levels[levelIndex - 1];
  const progress = state.levelProgress[previousLevel.id];
  return (progress?.bestAccuracy ?? 0) >= previousLevel.passThreshold;
}

export function isWorldUnlocked(worlds: World[], state: PersistedState, worldIndex: number): boolean {
  if (worldIndex === 0) return true;
  const previousWorld = worlds[worldIndex - 1];
  const finalLevel = previousWorld.levels[previousWorld.levels.length - 1];
  const progress = state.levelProgress[finalLevel.id];
  return (progress?.bestAccuracy ?? 0) >= finalLevel.passThreshold;
}

export function hasAllStarsInWorld(world: World, state: PersistedState): boolean {
  return world.levels.every((level) => (state.levelProgress[level.id]?.stars ?? 0) === 3);
}
