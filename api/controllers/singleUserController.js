const bcryptjs = require("bcryptjs");
const User = require("../models/user.model.js");

exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.params.id; // expecting /stats/:id
    const user = await User.findById(userId).populate("solvedProblems");

    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    const solvedCounts = user.solvedCounts || {};
    const EASY = solvedCounts.EASY || 0;
    const MEDIUM = solvedCounts.MEDIUM || 0;
    const MEDIUM_HARD = solvedCounts.MEDIUM_HARD || 0;
    const HARD = solvedCounts.HARD || 0;
    const VERY_HARD = solvedCounts.VERY_HARD || 0;
    const TOTAL = user.totalSolved || 0;
    const PREFERRED_TAGS = user.preferredTags || [];

    return res.status(200).json({
      EASY,
      MEDIUM,
      MEDIUM_HARD,
      HARD,
      VERY_HARD,
      TOTAL,
      PREFERRED_TAGS,
    });
  } catch (error) {
    next(error);
  }
};


// Solved Counts 
/*

// EASY MEDIUM MEDIUM_HARD HARD VERY_HARD
solvedCounts: {
    EASY: { type: Number, default: 0 },
    MEDIUM: { type: Number, default: 0 },
    MEDIUM_HARD: { type: Number, default: 0 },
    HARD: { type: Number, default: 0 },
    VERY_HARD: { type: Number, default: 0 }
},

totalSolved: { 
    type: Number, 
    default: 0 
},

// weighted tags: each has tag + count
preferredTags: [
    {
    tag: { type: String, required: true },
    count: { type: Number, default: 0 }
    }
]

*/ 

// {"EASY":2,"MEDIUM":3,"HARD":2,"MEDIUM_HARD":3,"VERY_HARD":4,"TOTAL":14}