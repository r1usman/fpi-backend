// models/SingleSolution.js
const mongoose = require("mongoose");
const singleSolutionSchema = new mongoose.Schema({
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SingleProblem',
    required: true
  },
  code: { type: String, required: true },
  language: { type: String, required: true },
  solutionNumber: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('SingleSolution', singleSolutionSchema);
