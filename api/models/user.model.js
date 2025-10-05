const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: null },

    status: {
      type: String,
      required: true,
      enum: ["Admin", "Student", "Instructor"],
      default: "Student",
    },

    submissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SingleSubmission",
      },
    ],

    // preferredDifficulty: { 
    //   type: String, 
    //   enum: ["EASY", "MEDIUM", "HARD", "MEDIUM_HARD", "VERY_HARD"], 
    //   default: "EASY" 
    // },

    // solvedProblems: [
    //   {type: String}
    // ],

    // preferredTags: [
    //   {
    //     type: String,
    //     count: { type: Number, default: 1 } // track frequency of tag usage
    //   }
    // ],

    // ================================ Personalization Related fields
    // Problem Personalization related fields
    preferredDifficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "MEDIUM_HARD", "HARD", "VERY_HARD"],
      default: "EASY"
    },

    // store solved problems as ObjectId refs (better for queries)
    solvedProblems: [
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "SingleProblem" 
      }
    ],

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
    ],

    // optional incremental fields (for performance, explained later)
    solvedCount: { type: Number, default: 0 },
    difficultyScoreSum: { type: Number, default: 0 },


    // ================================ Badges and Certifications
    badges: [
      {
        type: String, // e.g., "Novice", "Bronze"
      }
    ],

    certifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SingleCertification"
      }
    ]

  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
