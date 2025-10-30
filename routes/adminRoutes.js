const express = require('express');
const User = require('../models/Users');
const FarmerProfile = require('../models/FarmerProfile');
const DealerProfile = require('../models/DealerProfile');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
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

// Get all dealers (admin only)
router.get('/dealers', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const dealers = await User.find({ role: 'dealer' }).select('-passwordHash').sort({ createdAt: -1 });
    res.json({ 
      success: true, 
      dealers: dealers,
      totalCount: dealers.length
    });
  } catch (error) {
    console.error('Error fetching dealers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

// Get dealer details by ID (admin only)
router.get('/dealers/:dealerId', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { dealerId } = req.params;
    
    // Get user details
    const user = await User.findById(dealerId).select('-passwordHash');
    
    if (!user || user.role !== 'dealer') {
      return res.status(404).json({ 
        success: false, 
        message: 'Dealer not found' 
      });
    }

    // Get dealer profile
    const dealerProfile = await DealerProfile.findOne({ dealerId });
    
    res.json({ 
      success: true, 
      dealer: {
        user,
        profile: dealerProfile || null
      }
    });
  } catch (error) {
    console.error('Error fetching dealer details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

// Block/Unblock dealer (admin only)
router.patch('/dealers/:dealerId/status', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: 'isActive must be a boolean' 
      });
    }

    const dealer = await User.findByIdAndUpdate(
      dealerId,
      { isActive },
      { new: true }
    ).select('-passwordHash');

    if (!dealer || dealer.role !== 'dealer') {
      return res.status(404).json({ 
        success: false, 
        message: 'Dealer not found' 
      });
    }

    res.json({ 
      success: true, 
      message: `Dealer ${isActive ? 'activated' : 'blocked'} successfully`,
      dealer 
    });
  } catch (error) {
    console.error('Error updating dealer status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

// Get all shops for admin with dealer details
router.get('/shops', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { status, category } = req.query;
    
    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    
    // Fetch shops with dealer details
    const shops = await Shop.find(query)
      .populate('shopOwnerId', 'name email mobile profilePicture')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      shops: shops,
      totalCount: shops.length,
      statusCounts: {
        pending: await Shop.countDocuments({ status: 'pending' }),
        processing: await Shop.countDocuments({ status: 'processing' }),
        verified: await Shop.countDocuments({ status: 'verified' }),
        rejected: await Shop.countDocuments({ status: 'rejected' }),
      }
    });
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

// Get shop details by ID (admin only)
router.get('/shops/:shopId', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { shopId } = req.params;
    
    const shop = await Shop.findById(shopId)
      .populate('shopOwnerId', 'name email mobile profilePicture');
    
    if (!shop) {
      return res.status(404).json({ 
        success: false, 
        message: 'Shop not found' 
      });
    }
    
    res.json({ 
      success: true, 
      shop 
    });
  } catch (error) {
    console.error('Error fetching shop details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

// Update shop status (admin only)
router.patch('/shops/:shopId/status', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { shopId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'verified', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of: pending, processing, verified, rejected' 
      });
    }

    // Build update object
    const updateData = { status };
    
    // Only set verifiedAt if status is 'verified'
    if (status === 'verified') {
      updateData.verifiedAt = Date.now();
    }

    const shop = await Shop.findByIdAndUpdate(
      shopId,
      updateData,
      { new: true }
    ).populate('shopOwnerId', 'name email mobile profilePicture');

    if (!shop) {
      return res.status(404).json({ 
        success: false, 
        message: 'Shop not found' 
      });
    }

    res.json({ 
      success: true, 
      message: `Shop status updated to ${status} successfully`,
      shop 
    });
  } catch (error) {
    console.error('Error updating shop status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

// List all products (admin only)
router.get('/products', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;

    const products = await Product.find(query)
      .populate('shopId', 'shopName location')
      .populate('dealerId', 'name email mobile')
      .sort({ createdAt: -1 });

    res.json({ success: true, products, totalCount: products.length });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// Delete any product (admin only)
router.delete('/products/:productId', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

module.exports = router;

