import type { Badge, GradeId, PersistedState } from '../types/game';
import { worlds, worldsForGrade } from './worlds';
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
  { id: 'all-worlds-unlocked', name: 'Explorer', description: 'Unlock all 5 grade 7 worlds.', icon: '🗺️' },
  { id: 'game-complete', name: 'Grade 7 Graduate', description: 'Earn 3 stars on every grade 7 level.', icon: '🎓' },
  { id: 'grade-8-complete', name: 'Grade 8 Graduate', description: 'Earn 3 stars on every grade 8 level.', icon: '🎓' },
  { id: 'grade-9-complete', name: 'Algebra I Graduate', description: 'Earn 3 stars on every grade 9 level.', icon: '🏆' },
  { id: 'cross-grade', name: 'Time Traveller', description: 'Complete a level in all three grades.', icon: '🚀' },
];

/** Worlds are keyed by full id (`g7-geometry`), not by strand. */
function hasAllStarsInWorld(state: PersistedState, worldId: string): boolean {
  const world = worlds.find((w) => w.id === worldId);
  if (!world) return false;
  return hasAllStarsInWorldImpl(world, state);
}

/**
 * Unlocking chains within a grade, so this must be asked of one grade's list —
 * passing every world across all grades would make world 6 (grade 8's first)
 * appear gated behind finishing grade 7, which it is not.
 */
function allWorldsUnlockedInGrade(state: PersistedState, grade: GradeId): boolean {
  const gradeWorlds = worldsForGrade(grade);
  return gradeWorlds.every((_, i) => isWorldUnlockedImpl(gradeWorlds, state, i));
}

function gradeFullyStarred(state: PersistedState, grade: GradeId): boolean {
  return worldsForGrade(grade).every((w) => hasAllStarsInWorldImpl(w, state));
}

function playedAnyLevelIn(state: PersistedState, grade: GradeId): boolean {
  return worldsForGrade(grade)
    .flatMap((w) => w.levels)
    .some((l) => (state.levelProgress[l.id]?.timesPlayed ?? 0) > 0);
}

const badgeConditions: Record<string, (state: PersistedState) => boolean> = {
  'first-steps': (state) => Object.keys(state.levelProgress).length > 0,
  'ridge-rookie': (state) => (state.levelProgress['rp-l1']?.timesPlayed ?? 0) > 0,
  'champion-ratios-proportions': (state) => hasAllStarsInWorld(state, 'g7-ratios-proportions'),
  'champion-number-system': (state) => hasAllStarsInWorld(state, 'g7-number-system'),
  'champion-expressions-equations': (state) => hasAllStarsInWorld(state, 'g7-expressions-equations'),
  'champion-geometry': (state) => hasAllStarsInWorld(state, 'g7-geometry'),
  'champion-statistics-probability': (state) => hasAllStarsInWorld(state, 'g7-statistics-probability'),
  'perfect-run': (state) => Object.values(state.levelProgress).some((p) => p.bestAccuracy >= 1),
  'streak-5': (state) => state.bestStreakEver >= 5,
  'streak-10': (state) => state.bestStreakEver >= 10,
  'xp-500': (state) => state.totalXP >= 500,
  'xp-2000': (state) => state.totalXP >= 2000,
  'all-worlds-unlocked': (state) => allWorldsUnlockedInGrade(state, 7),
  'game-complete': (state) => gradeFullyStarred(state, 7),
  'grade-8-complete': (state) => gradeFullyStarred(state, 8),
  'grade-9-complete': (state) => gradeFullyStarred(state, 9),
  'cross-grade': (state) =>
    playedAnyLevelIn(state, 7) && playedAnyLevelIn(state, 8) && playedAnyLevelIn(state, 9),
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
