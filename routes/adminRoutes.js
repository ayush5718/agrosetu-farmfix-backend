const express = require('express');
const User = require('../models/Users');
const FarmerProfile = require('../models/FarmerProfile');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get all farmers (admin only)
router.get('/farmers', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const farmers = await User.find({ role: 'farmer' }).select('-passwordHash').sort({ createdAt: -1 });
    res.json({ 
      success: true, 
      farmers: farmers,
      totalCount: farmers.length
    });
  } catch (error) {
    console.error('Error fetching farmers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

// Get farmer details by ID (admin only)
router.get('/farmers/:farmerId', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    // Get user details
    const user = await User.findById(farmerId).select('-passwordHash');
    
    if (!user || user.role !== 'farmer') {
      return res.status(404).json({ 
        success: false, 
        message: 'Farmer not found' 
      });
    }

    // Get farmer profile
    const farmerProfile = await FarmerProfile.findOne({ farmerId });
    
    res.json({ 
      success: true, 
      farmer: {
        user,
        profile: farmerProfile || null
      }
    });
  } catch (error) {
    console.error('Error fetching farmer details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

// Block/Unblock farmer (admin only)
router.patch('/farmers/:farmerId/status', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: 'isActive must be a boolean' 
      });
    }

    const farmer = await User.findByIdAndUpdate(
      farmerId,
      { isActive },
      { new: true }
    ).select('-passwordHash');

    if (!farmer || farmer.role !== 'farmer') {
      return res.status(404).json({ 
        success: false, 
        message: 'Farmer not found' 
      });
    }

    res.json({ 
      success: true, 
      message: `Farmer ${isActive ? 'activated' : 'blocked'} successfully`,
      farmer 
    });
  } catch (error) {
    console.error('Error updating farmer status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

module.exports = router;

