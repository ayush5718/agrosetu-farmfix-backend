// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  name: String,
  brand: String,
  mrp: Number,
  dealerPrice: Number,
  stock: Number,
  imageUrl: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  priceGuard: { type: Boolean, default: false }, // Admin can enable
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);