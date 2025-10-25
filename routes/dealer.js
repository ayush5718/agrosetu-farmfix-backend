// routes/dealer.js
const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const { roleMiddleware } = require('../middleware/auth');

router.use(roleMiddleware(['dealer']));

// Shop registration
router.post('/shop', async (req, res) => {
  const { name, address, gstNumber, licenseNumber, bankDetails } = req.body;
  const existingShop = await Shop.findOne({ ownerId: req.user._id });
  if (existingShop) return res.status(400).json({ message: 'Shop already registered' });

  const shop = new Shop({
    ownerId: req.user._id,
    name,
    address,
    gstNumber,
    licenseNumber,
    bankDetails,
    status: 'pending',
  });
  await shop.save();
  res.json({ message: 'Shop registration submitted for approval', shop });
});

// Add product
router.post('/product', async (req, res) => {
  const shop = await Shop.findOne({ ownerId: req.user._id, status: 'approved' });
  if (!shop) return res.status(400).json({ message: 'Approved shop required' });

  const { name, brand, mrp, dealerPrice, stock, imageUrl } = req.body;
  const product = new Product({
    dealerId: req.user._id,
    shopId: shop._id,
    name,
    brand,
    mrp,
    dealerPrice,
    stock,
    imageUrl,
    status: 'pending',
    priceGuard: false,
  });
  await product.save();
  res.json({ message: 'Product added and pending admin approval', product });
});

module.exports = router;