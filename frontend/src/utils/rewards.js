export function getRewardForDifficulty(difficulty) {
  if (difficulty === "EASY") {
    return { bricks: 2, xp: 20 };
  }
  if (difficulty === "HARD") {
    return { bricks: 10, xp: 100 };
  }
  return { bricks: 5, xp: 50 };
}

export function calcLevel(totalXp) {
  return Math.floor(Math.sqrt(totalXp / 100));
}
