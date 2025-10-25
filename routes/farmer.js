// routes/farmer.js
const express = require('express');
const router = express.Router();
const { roleMiddleware } = require('../middleware/auth');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Shop = require('../models/Shop');

router.use(roleMiddleware(['farmer']));

// Browse products (only approved products)
router.get('/products', async (req, res) => {
  const products = await Product.find({ status: 'approved', stock: { $gt: 0 } }).populate('shopId', 'name address');
  res.json({ products });
});

// Place order
router.post('/order', async (req, res) => {
  const { products, paymentMode } = req.body; // products: [{productId, quantity}]
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: 'Products required' });
  }

  // Validate products and calculate total
  let totalAmount = 0;
  const orderItems = [];
  for (let item of products) {
    const product = await Product.findOne({ _id: item.productId, status: 'approved', stock: { $gte: item.quantity } });
    if (!product) return res.status(400).json({ message: `Product not available or insufficient stock: ${item.productId}` });

    // Enforce price guard if enabled (dealerPrice <= MRP)
    let price = product.dealerPrice;
    if (product.priceGuard && price > product.mrp) {
      price = product.mrp;
    }

    totalAmount += price * item.quantity;
    orderItems.push({ productId: product._id, quantity: item.quantity, price });
  }

  const order = new Order({
    farmerId: req.user._id,
    products: orderItems,
    status: 'placed',
    paymentMode,
    totalAmount,
  });
  await order.save();

  // TODO: Notify admin for order assignment

  res.json({ message: 'Order placed successfully', order });
});

module.exports = router;