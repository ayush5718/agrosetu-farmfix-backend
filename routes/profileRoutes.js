// routes/profileRoutes.js
const express = require('express');
const User = require('../models/Users');
const { authMiddleware } = require('../middleware/auth');
const { uploadToImageKit } = require('../middleware/uploadMiddleware');
const multer = require('multer');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get user profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
});

// Update profile picture
router.post('/picture', authMiddleware, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Upload to ImageKit
    const imageUrl = await uploadToImageKit(req.file, 'agro/profiles');
    
    // Update user profile picture
    const user = await User.findById(req.user._id);
    user.profilePicture = imageUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePicture: imageUrl,
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile picture',
      error: error.message,
    });
  }
});

// Update user info
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { name, mobile } = req.body;
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (mobile) user.mobile = mobile;
    
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
});

module.exports = router;

