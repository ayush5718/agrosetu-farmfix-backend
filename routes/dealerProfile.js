// routes/dealerProfile.js
const express = require('express');
const DealerProfile = require('../models/DealerProfile');
const Shop = require('../models/Shop');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
// Restrict to dealer role only
router.use(roleMiddleware(['dealer']));

// Get dealer profile
router.get('/profile', async (req, res) => {
  try {
    const profile = await DealerProfile.findOne({ dealerId: req.user._id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Please create your profile.'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Create or update dealer profile
router.post('/profile', async (req, res) => {
  try {
    const {
      dealerName,
      email,
      mobile,
      address,
      city,
      state,
      pincode
    } = req.body;

    // Get total shops count
    const shopCount = await Shop.countDocuments({ shopOwnerId: req.user._id });

    // Check if profile already exists
    let profile = await DealerProfile.findOne({ dealerId: req.user._id });

    if (profile) {
      // Update existing profile
      profile.dealerName = dealerName || profile.dealerName;
      profile.email = email || profile.email;
      profile.mobile = mobile || profile.mobile;
      profile.address = address || profile.address;
      profile.city = city || profile.city;
      profile.state = state || profile.state;
      profile.pincode = pincode || profile.pincode;
      profile.totalShops = shopCount;
      profile.updatedAt = Date.now();

      await profile.save();
    } else {
      // Create new profile
      profile = new DealerProfile({
        dealerId: req.user._id,
        dealerName: dealerName || req.user.name,
        email: email || req.user.email,
        mobile: mobile || req.user.mobile,
        address: address || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        totalShops: shopCount,
      });

      await profile.save();
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Delete dealer profile
router.delete('/profile', async (req, res) => {
  try {
    const profile = await DealerProfile.findOneAndDelete({ dealerId: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile'
    });
  }
});

module.exports = router;

