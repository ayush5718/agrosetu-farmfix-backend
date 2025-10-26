// routes/farmerProfile.js
const express = require('express');
const FarmerProfile = require('../models/FarmerProfile');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Restrict to farmer role only
router.use(roleMiddleware(['farmer']));

// Get farmer profile
router.get('/profile', async (req, res) => {
  try {
    const profile = await FarmerProfile.findOne({ farmerId: req.user._id });
    
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

// Create or update farmer profile
router.post('/profile', async (req, res) => {
  try {
    const {
      farmerName,
      mobileNumber,
      village,
      tehsil,
      district,
      state,
      landSize,
      mainCrops,
      isWhatsApp
    } = req.body;

    // Check if profile already exists
    let profile = await FarmerProfile.findOne({ farmerId: req.user._id });

    if (profile) {
      // Update existing profile
      profile.farmerName = farmerName || profile.farmerName;
      profile.mobileNumber = mobileNumber || profile.mobileNumber;
      profile.village = village || profile.village;
      profile.tehsil = tehsil || profile.tehsil;
      profile.district = district || profile.district;
      profile.state = state || profile.state;
      profile.landSize = landSize || profile.landSize;
      profile.mainCrops = mainCrops || profile.mainCrops;
      profile.isWhatsApp = isWhatsApp !== undefined ? isWhatsApp : profile.isWhatsApp;
      profile.updatedAt = Date.now();

      await profile.save();
    } else {
      // Create new profile
      profile = new FarmerProfile({
        farmerId: req.user._id,
        farmerName,
        mobileNumber,
        village,
        tehsil,
        district,
        state,
        landSize,
        mainCrops: mainCrops || [],
        isWhatsApp: isWhatsApp || false
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

// Delete farmer profile
router.delete('/profile', async (req, res) => {
  try {
    const profile = await FarmerProfile.findOneAndDelete({ farmerId: req.user._id });

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

