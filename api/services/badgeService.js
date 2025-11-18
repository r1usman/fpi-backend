const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const User = require('../models/user.model');

class BadgeService {
  // Check and award difficulty-based badges
  async checkDifficultyBadges(userId) {
    const user = await User.findById(userId);
    if (!user) return [];

    const totalSolved = user.totalSolved || 0;
    const awardedBadges = [];

    // Define difficulty badge thresholds
    const thresholds = [
      { rank: 1, code: 'difficulty-1', minSolved: 10 },
      { rank: 2, code: 'difficulty-2', minSolved: 25 },
      { rank: 3, code: 'difficulty-3', minSolved: 50 },
      { rank: 4, code: 'difficulty-4', minSolved: 100 },
      { rank: 5, code: 'difficulty-5', minSolved: 200 },
    ];

    for (const threshold of thresholds) {
      if (totalSolved >= threshold.minSolved) {
        const badge = await Badge.findOne({ code: threshold.code });
        if (badge) {
          const awarded = await this.awardBadge(userId, badge._id);
          if (awarded) {
            awardedBadges.push(badge);
          }
        }
      }
    }

    return awardedBadges;
  }

  // Check and award level-based badges
  async checkLevelBadges(userId) {
    const user = await User.findById(userId);
    if (!user) return [];

    const preferredDifficulty = user.preferredDifficulty || 'EASY';
    const awardedBadges = [];

    // Map difficulty to level badge
    const levelMap = {
      EASY: { rank: 1, code: 'level-1' },
      MEDIUM: { rank: 2, code: 'level-2' },
      MEDIUM_HARD: { rank: 3, code: 'level-3' },
      HARD: { rank: 4, code: 'level-4' },
      VERY_HARD: { rank: 5, code: 'level-5' },
    };

    const levelInfo = levelMap[preferredDifficulty];
    if (levelInfo) {
      const badge = await Badge.findOne({ code: levelInfo.code });
      if (badge) {
        const awarded = await this.awardBadge(userId, badge._id);
        if (awarded) {
          awardedBadges.push(badge);
        }
      }
    }

    return awardedBadges;
  }

  // Award a badge to a user (idempotent - won't duplicate)
  async awardBadge(userId, badgeId) {
    try {
      const existing = await UserBadge.findOne({ userId, badgeId });
      if (existing) {
        return false; // Already has this badge
      }

      await UserBadge.create({ userId, badgeId });
      return true; // Newly awarded
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - already has badge
        return false;
      }
      throw error;
    }
  }

  // Check all badges for a user
  async checkAllBadges(userId) {
    const difficultyBadges = await this.checkDifficultyBadges(userId);
    const levelBadges = await this.checkLevelBadges(userId);
    
    return {
      difficultyBadges,
      levelBadges,
      total: difficultyBadges.length + levelBadges.length,
    };
  }

  // Get all badges for a user
  async getUserBadges(userId) {
    const userBadges = await UserBadge.find({ userId })
      .populate('badgeId')
      .sort({ awardedAt: -1 });

    return userBadges.map(ub => ({
      ...ub.badgeId.toObject(),
      awardedAt: ub.awardedAt,
    }));
  }

  // Get all available badges (for display)
  async getAllBadges() {
    return await Badge.find().sort({ type: 1, rank: 1 });
  }
}

module.exports = new BadgeService();