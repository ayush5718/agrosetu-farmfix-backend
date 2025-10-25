// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  mobile: { type: String, unique: true },
  role: { type: String, enum: ['admin', 'dealer', 'farmer', 'delivery'], required: true },
  passwordHash: String, // For simplicity; can use OTP tokens too
  village: String,
  tehsil: String,
  district: String,
  state: String,
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }, // For dealer
  walletBalance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model('User', userSchema);