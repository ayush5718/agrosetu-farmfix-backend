// routes/shopRoutes.js
const express = require('express');
const Shop = require('../models/Shop');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { upload, uploadToImageKit } = require('../middleware/uploadMiddleware');
const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
// Restrict to dealer role only
router.use(roleMiddleware(['dealer']));

// Register new shop
router.post('/register', upload.fields([
  { name: 'shopImage', maxCount: 1 },
  { name: 'shopLicense', maxCount: 1 },
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'storagePermitCertificate', maxCount: 1 },
  { name: 'fssaiLicense', maxCount: 1 },
]), async (req, res) => {
  try {
    const { shopName, description, location, ownerName } = req.body;

    // Validation
    if (!shopName || !location || !ownerName) {
      return res.status(400).json({
        success: false,
        message: 'Shop name, location, and owner name are required'
      });
    }

    // Upload images to ImageKit
    const imageUrls = {};
    
    if (req.files) {
      for (const field in req.files) {
        const file = req.files[field][0];
        if (file) {
          try {
            imageUrls[field] = await uploadToImageKit(file, 'agro/shops');
          } catch (error) {
            console.error(`Error uploading ${field}:`, error);
          }
        }
      }
    }

    // Create new shop
    const shop = new Shop({
      shopOwnerId: req.user._id,
      shopName,
      description: description || '',
      location,
      ownerName,
      shopImage: imageUrls.shopImage || '',
      shopLicense: imageUrls.shopLicense || '',
      gstCertificate: imageUrls.gstCertificate || '',
      storagePermitCertificate: imageUrls.storagePermitCertificate || '',
      fssaiLicense: imageUrls.fssaiLicense || '',
      status: 'pending',
    });

    await shop.save();

    res.status(201).json({
      success: true,
      message: 'Shop registered successfully and pending verification',
      shop,
    });
  } catch (error) {
    console.error('Shop registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register shop. Please try again.'
    });
  }
});

// Delete shops by IDs
router.delete('/delete', async (req, res) => {
  try {
    const { shopIds } = req.body;
    
    if (!shopIds || !Array.isArray(shopIds) || shopIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Shop IDs are required and must be an array' 
      });
    }

    const dealerId = req.user._id;
    
    // Find all shops belonging to this dealer
    const shops = await Shop.find({ 
      _id: { $in: shopIds },
      shopOwnerId: dealerId 
    });

    if (shops.length !== shopIds.length) {
      return res.status(403).json({ 
        success: false, 
        message: 'Some shops not found or you do not have permission to delete them' 
      });
    }

    // Delete the shops
    await Shop.deleteMany({ _id: { $in: shopIds } });

    res.json({ 
      success: true, 
      message: `${shopIds.length} shop(s) deleted successfully`,
      deletedCount: shopIds.length 
    });
  } catch (error) {
    console.error('Delete shops error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Get all shops for logged-in dealer
router.get('/list', async (req, res) => {
  try {
    const shops = await Shop.find({ shopOwnerId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      shops,
    });
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shops'
    });
  }
});

// Get single shop details
router.get('/:shopId', async (req, res) => {
  try {
    const shop = await Shop.findOne({
      _id: req.params.shopId,
      shopOwnerId: req.user._id
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    res.json({
      success: true,
      shop,
    });
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop'
    });
  }
});

// Update shop details
router.put('/:shopId', upload.fields([
  { name: 'shopImage', maxCount: 1 },
  { name: 'shopLicense', maxCount: 1 },
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'storagePermitCertificate', maxCount: 1 },
  { name: 'fssaiLicense', maxCount: 1 },
]), async (req, res) => {
  try {
    const { shopName, description, location, ownerName } = req.body;

    const shop = await Shop.findOne({
      _id: req.params.shopId,
      shopOwnerId: req.user._id
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Update fields
    if (shopName) shop.shopName = shopName;
    if (description !== undefined) shop.description = description;
    if (location) shop.location = location;
    if (ownerName) shop.ownerName = ownerName;

    // Upload new images if provided
    if (req.files) {
      for (const field in req.files) {
        const file = req.files[field][0];
        if (file) {
          try {
            const imageUrl = await uploadToImageKit(file, 'agro/shops');
            shop[field] = imageUrl;
          } catch (error) {
            console.error(`Error uploading ${field}:`, error);
          }
        }
      }
    }

    await shop.save();

    res.json({
      success: true,
      message: 'Shop updated successfully',
      shop,
    });
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shop'
    });
  }
});

module.exports = router;

