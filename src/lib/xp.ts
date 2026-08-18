const BASE_XP_PER_CORRECT = 10;
const XP_PER_STAR = 25;
const MAX_STREAK_MULTIPLIER = 3;

export function streakMultiplier(streak: number): number {
  const multiplier = 1 + Math.floor(streak / 3) * 0.5;
  return Math.min(multiplier, MAX_STREAK_MULTIPLIER);
}

export function xpForCorrectAnswer(streakBeforeThisAnswer: number): number {
  return Math.round(BASE_XP_PER_CORRECT * streakMultiplier(streakBeforeThisAnswer));
}

export function xpForLevelCompletion(stars: 0 | 1 | 2 | 3): number {
  return stars * XP_PER_STAR;
}

/**
 * The player's RANK, from total XP.
 *
 * Deliberately not called a level. A "level" in this game is a thing you play —
 * Powers of Ten, Adding Decimals — and the map numbers them 1, 2, 3. Showing an
 * XP tier called "Lv 3" directly above that list invited exactly the question it
 * got: why does it say 3 when I finished one?
 *
 * Rank is a separate axis: it goes up with every correct answer, across every
 * grade, and never resets.
 */
export function rankFromXP(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 50)) + 1;
}

export function xpThresholdForRank(rank: number): number {
  return 50 * (rank - 1) ** 2;
}

export function rankProgress(totalXP: number): {
  rank: number;
  xpIntoRank: number;
  xpNeededForNextRank: number;
  progressFraction: number;
} {
  const rank = rankFromXP(totalXP);
  const floorXP = xpThresholdForRank(rank);
  const ceilXP = xpThresholdForRank(rank + 1);
  const xpIntoRank = totalXP - floorXP;
  const xpNeededForNextRank = ceilXP - floorXP;
  return {
    rank,
    xpIntoRank,
    xpNeededForNextRank,
    progressFraction: xpNeededForNextRank === 0 ? 1 : xpIntoRank / xpNeededForNextRank,
  };
}
