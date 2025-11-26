// models/aiProblem.js

const mongoose = require("mongoose");

const exampleSchema = new mongoose.Schema({
  input: String,
  output: String,
  explanation: String // optional
});


const aiProblemSchema = new mongoose.Schema({
  
  // ================== Relation to Original Problem ==================
  originalProblemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  isPublic: {
    type: Boolean,
    default: false  // Private by default
  },

  // ================== Problem Details ==================
  difficulty: String,
  name: String,
  
  tags: [String],
  
  expected_auxiliary_space: String,
  expected_time_complexity: String,
  time_limit: String,
  memory_limit: String,

  description: String,
  input: String,
  output: String,
  note: String,
  
  examples: [exampleSchema],

  problemType: {
    type: String,
    enum: ['Problem', 'aiProblem'],
    default: 'Problem'
  },
  
  // ================== Metadata ==================
  generatedAt: {
    type: Date,
    default: Date.now
  },
  acceptedByUser: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('aiProblem', aiProblemSchema);