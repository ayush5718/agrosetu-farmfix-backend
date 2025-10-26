// models/Shop.js
const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  shopOwnerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  shopName: { type: String, required: true },
  description: { type: String },
  location: { type: String, required: true },
  ownerName: { type: String, required: true },
  shopImage: { type: String },
  shopLicense: { type: String },
  gstCertificate: { type: String },
  storagePermitCertificate: { type: String },
  fssaiLicense: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'verified', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date },
});

// Update timestamp before saving
shopSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Shop', shopSchema);
