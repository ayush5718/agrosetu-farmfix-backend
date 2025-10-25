// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number, // final price per unit
  }],
  status: { 
    type: String, 
    enum: ['placed', 'assigned', 'ready', 'in_transit', 'delivered', 'cancelled'], 
    default: 'placed' 
  },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentMode: { type: String, enum: ['online', 'cod'] },
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

module.exports = mongoose.model('Order', orderSchema);