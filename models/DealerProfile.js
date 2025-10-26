// models/DealerProfile.js
const mongoose = require('mongoose');

const dealerProfileSchema = new mongoose.Schema({
  dealerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  dealerName: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  totalShops: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update timestamp before saving
dealerProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DealerProfile', dealerProfileSchema);

