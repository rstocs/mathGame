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

export function playerLevelFromXP(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 50)) + 1;
}

export function xpThresholdForPlayerLevel(playerLevel: number): number {
  return 50 * (playerLevel - 1) ** 2;
}

export function playerLevelProgress(totalXP: number): {
  playerLevel: number;
  currentLevelXP: number;
  xpNeededForNextLevel: number;
  progressFraction: number;
} {
  const playerLevel = playerLevelFromXP(totalXP);
  const floorXP = xpThresholdForPlayerLevel(playerLevel);
  const ceilXP = xpThresholdForPlayerLevel(playerLevel + 1);
  const currentLevelXP = totalXP - floorXP;
  const xpNeededForNextLevel = ceilXP - floorXP;
  return {
    playerLevel,
    currentLevelXP,
    xpNeededForNextLevel,
    progressFraction: xpNeededForNextLevel === 0 ? 1 : currentLevelXP / xpNeededForNextLevel,
  };
}
