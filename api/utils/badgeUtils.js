// Badge criteria logic

function getLevelBadge(solvedCount) {
  if (solvedCount >= 500) return "Grandmaster";
  if (solvedCount >= 300) return "Master";
  if (solvedCount >= 150) return "Expert";
  if (solvedCount >= 50) return "Apprentice";
  if (solvedCount >= 10) return "Novice";
  return null;
}

function getDifficultyBadge(difficultyStats) {
  // difficultyStats = { EASY: x, MEDIUM: y, HARD: z, VERY_HARD: w }

  if (difficultyStats.EASY >= 25) return "Bronze";
  if (difficultyStats.MEDIUM >= 50) return "Silver";
  if (difficultyStats.HARD >= 25) return "Gold";
  if (difficultyStats.VERY_HARD >= 10) return "Platinum";

  // Special Diamond condition
  const total = Object.values(difficultyStats).reduce((a, b) => a + b, 0);
  if (
    difficultyStats.EASY > 0 &&
    difficultyStats.MEDIUM > 0 &&
    difficultyStats.HARD > 0 &&
    difficultyStats.VERY_HARD > 0 &&
    total >= 100
  ) {
    return "Diamond";
  }

  return null;
}

module.exports = { getLevelBadge, getDifficultyBadge };
