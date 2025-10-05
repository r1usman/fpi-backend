// models/Badge.js
const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  
  code: { 
    type: String, 
    required: true, 
    unique: true 
  }, // e.g. "difficulty-1"
  
  name: { 
    type: String, 
    required: true 
  },

  type: { 
    type: String, 
    enum: ['difficulty','level','other'], 
    required: true 
  },

  rank: Number, // for difficulty or level: 1..5
  assetPath: String, // e.g. "difficulty-based/1DiffBronze.svg"
  criteria: mongoose.Schema.Types.Mixed, // optional JSON for custom criteria
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Badge', BadgeSchema);
