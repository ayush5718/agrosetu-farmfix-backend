// routes/auth.js
const express = require('express');
const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const router = express.Router();

// For demo, simple login with mobile + OTP simulation (no real OTP here)
router.post('/login', async (req, res) => {
  const { mobile, role } = req.body;
  if (!mobile || !role) return res.status(400).json({ message: 'Mobile and role required' });

  let user = await User.findOne({ mobile, role });
  if (!user) {
    // Auto-register for demo
    user = new User({ mobile, role, name: 'User-' + mobile });
    await user.save();
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
});

module.exports = router;