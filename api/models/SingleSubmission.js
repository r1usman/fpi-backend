// models/SingleSubmission.js
const mongoose = require("mongoose");
const singleSubmissionSchema = new mongoose.Schema({
  // (1) what to get from user
  language: { type: String, required: true },
  version: { type: String, required: true },
  code: { type: String, required: true },
  note: { type: String },

  // (2) what is the response of PISTON-API
  status: {
    type: String,
    enum: ["accepted", "rejected"],
    default: "rejected"
  },
  executionTime: { type: Number },

  results: [
    {
      input: { type: String },
      output: { type: String },
      expected: { type: String },
      passed: { type: Boolean },
      executionTime: { type: Number },
      error: { type: String }
    }
  ],

  // (3) db references
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SingleProblem'
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('SingleSubmission', singleSubmissionSchema);
