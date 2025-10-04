const mongoose = require('mongoose');

const singleCertificationSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, unique: true 
  }, // e.g. "solved-100"
  
  name: { 
    type: String, 
    required: true 
  },

  description: String,
  
  assetPath: String, // optional certificate image or PDF path
  
  criteria: mongoose.Schema.Types.Mixed, // e.g. { solvedCount: 100 } or { badgesRequired: 5 }
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('SingleCertification', singleCertificationSchema);