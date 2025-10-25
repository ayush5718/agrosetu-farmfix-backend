// routes/admin.js
const express = require('express');
const router = express.Router();
const { roleMiddleware } = require('../middleware/auth');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/Users');

router.use(roleMiddleware(['admin']));

// Approve or reject shop
router.post('/shop/:id/approve', async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const shop = await Shop.findById(req.params.id);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  shop.status = status;
  await shop.save();
  res.json({ message: `Shop ${status}`, shop });
});

// Approve or reject product, enable price guard
router.post('/product/:id/approve', async (req, res) => {
  const { status, priceGuard } = req.body; // status: 'approved' or 'rejected'
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  product.status = status;
  if (priceGuard !== undefined) product.priceGuard = priceGuard;
  await product.save();
  res.json({ message: `Product ${status}`, product });
});

// Assign order to dealer
router.post('/order/:id/assign', async (req, res) => {
  const { dealerId } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.status !== 'placed') return res.status(400).json({ message: 'Order not in placed status' });

  const dealer = await User.findById(dealerId);
  if (!dealer || dealer.role !== 'dealer') return res.status(400).json({ message: 'Invalid dealer' });

  order.dealerId = dealerId;
  order.shopId = dealer.shopId;
  order.status = 'assigned';
  await order.save();
  res.json({ message: 'Order assigned to dealer', order });
});

// Release payout - simplified
router.post('/payout/release', async (req, res) => {
  const { dealerId, amount } = req.body;
  if (!dealerId || !amount || amount <= 0) return res.status(400).json({ message: 'Invalid input' });

  const dealer = await User.findById(dealerId);
  if (!dealer || dealer.role !== 'dealer') return res.status(404).json({ message: 'Dealer not found' });

  if (dealer.walletBalance < amount) return res.status(400).json({ message: 'Insufficient wallet balance' });

  dealer.walletBalance -= amount;
  await dealer.save();
  res.json({ message: 'Payout released', dealerWalletBalance: dealer.walletBalance });
});

module.exports = router;