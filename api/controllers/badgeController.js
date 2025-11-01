const badgeService = require('../services/badgeService');
const Badge = require('../models/Badge');

// Get all available badges
exports.getAllBadges = async (req, res) => {
  try {
    const badges = await badgeService.getAllBadges();
    return res.status(200).json({ badges });
  } catch (error) {
    console.error('Get all badges error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Get user's earned badges
exports.getUserBadges = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const badges = await badgeService.getUserBadges(userId);
    return res.status(200).json({ badges, count: badges.length });
  } catch (error) {
    console.error('Get user badges error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Check and award badges for a user
exports.checkUserBadges = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const result = await badgeService.checkAllBadges(userId);
    
    return res.status(200).json({
      message: 'Badges checked successfully',
      newBadges: result,
    });
  } catch (error) {
    console.error('Check user badges error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// Initialize/seed badges in database (admin only)
exports.seedBadges = async (req, res) => {
  try {
    // Clear existing badges (optional - remove in production)
    await Badge.deleteMany({});

    const badges = [
      // Difficulty-based badges
      {
        code: 'difficulty-1',
        name: 'Bronze Solver',
        type: 'difficulty',
        rank: 1,
        assetPath: 'difficulty-based/1DiffBronze.svg',
        criteria: { minSolved: 10 },
      },
      {
        code: 'difficulty-2',
        name: 'Silver Solver',
        type: 'difficulty',
        rank: 2,
        assetPath: 'difficulty-based/2DiffSilver.svg',
        criteria: { minSolved: 25 },
      },
      {
        code: 'difficulty-3',
        name: 'Gold Solver',
        type: 'difficulty',
        rank: 3,
        assetPath: 'difficulty-based/3DiffGold.svg',
        criteria: { minSolved: 50 },
      },
      {
        code: 'difficulty-4',
        name: 'Platinum Solver',
        type: 'difficulty',
        rank: 4,
        assetPath: 'difficulty-based/4DiffPlatinum.svg',
        criteria: { minSolved: 100 },
      },
      {
        code: 'difficulty-5',
        name: 'Diamond Solver',
        type: 'difficulty',
        rank: 5,
        assetPath: 'difficulty-based/5DiffDiamond.svg',
        criteria: { minSolved: 200 },
      },

      // Level-based badges
      {
        code: 'level-1',
        name: 'Novice',
        type: 'level',
        rank: 1,
        assetPath: 'level-based/1LevelNovice.svg',
        criteria: { preferredDifficulty: 'EASY' },
      },
      {
        code: 'level-2',
        name: 'Apprentice',
        type: 'level',
        rank: 2,
        assetPath: 'level-based/2LevelApprentice.svg',
        criteria: { preferredDifficulty: 'MEDIUM' },
      },
      {
        code: 'level-3',
        name: 'Expert',
        type: 'level',
        rank: 3,
        assetPath: 'level-based/3LevelExpert.svg',
        criteria: { preferredDifficulty: 'MEDIUM_HARD' },
      },
      {
        code: 'level-4',
        name: 'Master',
        type: 'level',
        rank: 4,
        assetPath: 'level-based/4LevelMaster.svg',
        criteria: { preferredDifficulty: 'HARD' },
      },
      {
        code: 'level-5',
        name: 'Grandmaster',
        type: 'level',
        rank: 5,
        assetPath: 'level-based/5LevelGrandmaster.svg',
        criteria: { preferredDifficulty: 'VERY_HARD' },
      },
    ];

    const createdBadges = await Badge.insertMany(badges);
    
    return res.status(201).json({
      message: 'Badges seeded successfully',
      count: createdBadges.length,
      badges: createdBadges,
    });
  } catch (error) {
    console.error('Seed badges error:', error);
    return res.status(500).json({ message: error.message });
  }
};