// routes/delivery.js
const express = require('express');
const router = express.Router();
const { roleMiddleware } = require('../middleware/auth');
const Order = require('../models/Order');

router.use(roleMiddleware(['delivery']));

// Update order status during delivery
router.post('/order/:id/status', async (req, res) => {
  const { status } = req.body; // 'in_transit', 'delivered'
  if (!['in_transit', 'delivered'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.status = status;
  order.updatedAt = new Date();
  await order.save();

  res.json({ message: `Order status updated to ${status}`, order });
});

module.exports = router;