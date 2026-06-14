/** Matches backend= floor(sqrt(totalXp / 100)) */
export const xpRequiredForLevel = (level) => 100 * level * level;

/** XP threshold required to reach the next level: (level + 1)^2 * 100 */
export const nextLevelXpThreshold = (level) => (level + 1) ** 2 * 100;


export const getLevelProgress = (totalXp, level) => {
  const safeTotalXp = Math.max(0, Math.floor(totalXp));
  const safeLevel = Math.max(0, Math.floor(level));
  const currentThreshold = xpRequiredForLevel(safeLevel);
  const nextThreshold = nextLevelXpThreshold(safeLevel);
  const xpToNextLevel = Math.max(1, nextThreshold - currentThreshold);
  const xpIntoCurrentLevel = Math.max(0, safeTotalXp - currentThreshold);
  const percent = Math.min(100, Math.round((xpIntoCurrentLevel / xpToNextLevel) * 100));

  return {
    level,
    totalXp,
    xpIntoCurrentLevel,
    xpToNextLevel,
    nextLevelXp,
    percent
  };
};

/** @deprecated Use getLevelProgress */
export const xpProgressToNextLevel = (
  totalXp,
  level
): { current; needed; percent } => {
  const progress = getLevelProgress(totalXp, level);
  return {
    current,
    needed,
    percent: progress.percent
  };
};
