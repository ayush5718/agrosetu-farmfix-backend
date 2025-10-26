// models/FarmerProfile.js
const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema({
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  farmerName: { type: String },
  mobileNumber: { type: String },
  village: { type: String },
  tehsil: { type: String },
  district: { type: String },
  state: { type: String },
  landSize: { type: String }, // Format: "X-Y / Z acres"
  mainCrops: [{ type: String }], // Array of crop names
  isWhatsApp: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update timestamp before saving
farmerProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema);

