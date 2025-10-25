// models/Shop.js
const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  address: String,
  gstNumber: String,
  licenseNumber: String,
  bankDetails: {
    accountNumber: String,
    ifsc: String,
    bankName: String,
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Shop', shopSchema);