// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  dealerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Seed', 'Fertilizer', 'Pesticide', 'Equipment', 'Organic', 'Other'],
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  // Visible only to dealer/admin; not exposed to farmer APIs
  warehouseQuantity: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'gram', 'litre', 'ml', 'piece', 'pack', 'other'],
    required: true,
    default: 'kg'
  },
  productImage: {
    type: String
  },
  productImages: {
    type: [String],
    validate: [arr => arr.length <= 5, 'A maximum of 5 images allowed']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
