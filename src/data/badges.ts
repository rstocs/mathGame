import type { Badge, PersistedState } from '../types/game';
import { worlds } from './worlds';
import { hasAllStarsInWorld as hasAllStarsInWorldImpl, isWorldUnlocked as isWorldUnlockedImpl } from '../lib/unlocks';

export const badges: Badge[] = [
  { id: 'first-steps', name: 'First Steps', description: 'Complete your first level.', icon: '👣' },
  { id: 'ridge-rookie', name: 'Ridge Rookie', description: 'Complete Ratio Ridge Level 1.', icon: '🥾' },
  { id: 'champion-ratios-proportions', name: 'Ridge Champion', description: 'Earn 3 stars on every level of Ratio Ridge.', icon: '⛰️' },
  { id: 'champion-number-system', name: 'Nexus Champion', description: 'Earn 3 stars on every level of Number Nexus.', icon: '🌊' },
  { id: 'champion-expressions-equations', name: 'Expanse Champion', description: 'Earn 3 stars on every level of Equation Expanse.', icon: '💎' },
  { id: 'champion-geometry', name: 'Grotto Champion', description: 'Earn 3 stars on every level of Geometry Grotto.', icon: '🏛️' },
  { id: 'champion-statistics-probability', name: 'Summit Champion', description: 'Earn 3 stars on every level of Statistics Summit.', icon: '🔭' },
  { id: 'perfect-run', name: 'Flawless', description: 'Complete a level with 100% accuracy.', icon: '💯' },
  { id: 'streak-5', name: 'Heating Up', description: 'Reach a 5-answer streak.', icon: '🔥' },
  { id: 'streak-10', name: 'On Fire', description: 'Reach a 10-answer streak.', icon: '🔥' },
  { id: 'xp-500', name: 'Rising Star', description: 'Reach 500 total XP.', icon: '⭐' },
  { id: 'xp-2000', name: 'Math Master', description: 'Reach 2000 total XP.', icon: '🌟' },
  { id: 'all-worlds-unlocked', name: 'Explorer', description: 'Unlock all 5 worlds.', icon: '🗺️' },
  { id: 'game-complete', name: 'Grade 7 Graduate', description: 'Earn 3 stars on every level in every world.', icon: '🎓' },
];

function hasAllStarsInWorld(state: PersistedState, strandId: string): boolean {
  const world = worlds.find((w) => w.id === strandId);
  if (!world) return false;
  return hasAllStarsInWorldImpl(world, state);
}

function isWorldUnlocked(state: PersistedState, worldIndex: number): boolean {
  return isWorldUnlockedImpl(worlds, state, worldIndex);
}

const badgeConditions: Record<string, (state: PersistedState) => boolean> = {
  'first-steps': (state) => Object.keys(state.levelProgress).length > 0,
  'ridge-rookie': (state) => (state.levelProgress['rp-l1']?.timesPlayed ?? 0) > 0,
  'champion-ratios-proportions': (state) => hasAllStarsInWorld(state, 'ratios-proportions'),
  'champion-number-system': (state) => hasAllStarsInWorld(state, 'number-system'),
  'champion-expressions-equations': (state) => hasAllStarsInWorld(state, 'expressions-equations'),
  'champion-geometry': (state) => hasAllStarsInWorld(state, 'geometry'),
  'champion-statistics-probability': (state) => hasAllStarsInWorld(state, 'statistics-probability'),
  'perfect-run': (state) => Object.values(state.levelProgress).some((p) => p.bestAccuracy >= 1),
  'streak-5': (state) => state.bestStreakEver >= 5,
  'streak-10': (state) => state.bestStreakEver >= 10,
  'xp-500': (state) => state.totalXP >= 500,
  'xp-2000': (state) => state.totalXP >= 2000,
  'all-worlds-unlocked': (state) => worlds.every((_, i) => isWorldUnlocked(state, i)),
  'game-complete': (state) => worlds.every((w) => hasAllStarsInWorld(state, w.id)),
};

export function checkBadgeUnlocks(state: PersistedState): string[] {
  const newlyUnlocked: string[] = [];
  for (const badge of badges) {
    if (state.unlockedBadgeIds.includes(badge.id)) continue;
    const condition = badgeConditions[badge.id];
    if (condition && condition(state)) {
      newlyUnlocked.push(badge.id);
    }
  }
  return newlyUnlocked;
}
