// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true, sparse: true },
  mobile: { type: String, sparse: true }, // sparse: true allows multiple documents with null/missing value
  role: { type: String, enum: ['admin', 'dealer', 'farmer', 'delivery'], required: true },
  passwordHash: String,
  village: String,
  tehsil: String,
  district: String,
  state: String,
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }, // For dealer
  walletBalance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

// Create index for email only when email exists
userSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);