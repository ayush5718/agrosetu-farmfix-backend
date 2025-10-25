// routes/carbonCreditRoutes.js
const express = require('express');
const router = express.Router();
const CarbonCredit = require('../models/CarbonCredit');
const { roleMiddleware } = require('../middleware/auth');

router.use(roleMiddleware(['farmer']));

// GET /carbon-credits - Get user carbon credit balance
router.get('/', async (req, res) => {
  let credits = await CarbonCredit.findOne({ userId: req.user._id });
  if (!credits) {
    credits = new CarbonCredit({ userId: req.user._id });
    await credits.save();
  }
  res.json({ totalCredits: credits.totalCredits, transactions: credits.transactions });
});

// POST /carbon-credits/earn - Record earned credits with certificate
router.post('/earn', async (req, res) => {
  const { amount, certificateId } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  let credits = await CarbonCredit.findOne({ userId: req.user._id });
  if (!credits) {
    credits = new CarbonCredit({ userId: req.user._id, totalCredits: 0, transactions: [] });
  }

  credits.totalCredits += amount;
  credits.transactions.push({ type: 'earn', amount, certificateId });
  credits.updatedAt = new Date();
  await credits.save();

  res.json({ message: 'Carbon credits earned recorded', totalCredits: credits.totalCredits });
});

// POST /carbon-credits/redeem - Redeem credits for benefits
router.post('/redeem', async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  let credits = await CarbonCredit.findOne({ userId: req.user._id });
  if (!credits || credits.totalCredits < amount) {
    return res.status(400).json({ message: 'Insufficient credits' });
  }

  credits.totalCredits -= amount;
  credits.transactions.push({ type: 'redeem', amount });
  credits.updatedAt = new Date();
  await credits.save();

  res.json({ message: 'Carbon credits redeemed', totalCredits: credits.totalCredits });
});

module.exports = router;