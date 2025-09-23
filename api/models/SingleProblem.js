// models/SingleProblem.js
import mongoose from "mongoose";

const exampleSchema = new mongoose.Schema({
  input: String,
  output: String,
  explanation: String // optional
});

const singleProblemSchema = new mongoose.Schema({
  difficulty: String,
  name: String,
  source: String,

  raw_tags: [String],
  tags: [String],
  skill_types: [String],

  url: String,
  expected_auxiliary_space: String,
  expected_time_complexity: String,
  time_limit: String,
  date: String,
  picture_num: String,
  memory_limit: String,

  description: String,
  input: String,
  output: String,
  note: String,

  solutions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SingleSolution'
  }],

  examples: [exampleSchema]

}, { timestamps: true, collection: 'SingleProblem' });

module.exports = mongoose.model('SingleProblem', singleProblemSchema);
