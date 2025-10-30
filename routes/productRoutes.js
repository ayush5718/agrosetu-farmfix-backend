// routes/productRoutes.js
const express = require('express');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { upload, uploadToImageKit } = require('../middleware/uploadMiddleware');
const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// ==================== DEALER ROUTES ====================

// Get all products for logged-in dealer
router.get('/dealer/list', roleMiddleware(['dealer']), async (req, res) => {
  try {
    const products = await Product.find({ dealerId: req.user._id })
      .populate('shopId', 'shopName location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error('Get dealer products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// Add new product (only if shop is verified)
router.post('/dealer/add', roleMiddleware(['dealer']), upload.fields([
  { name: 'productImage', maxCount: 1 },
  { name: 'productImages', maxCount: 5 }
]), async (req, res) => {
  try {
    const { shopId, productName, category, description, price, quantity, warehouseQuantity, unit, isPublished } = req.body;

    // Validation
    if (!shopId || !productName || !category || !price || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Shop ID, product name, category, price, and quantity are required'
      });
    }

    // Verify shop belongs to dealer and is verified
    const shop = await Shop.findOne({ _id: shopId, shopOwnerId: req.user._id });
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found or you do not have access'
      });
    }

    if (shop.status !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Cannot add products. Shop must be verified by admin first.'
      });
    }

    // Upload product images if provided
    let imageUrl = '';
    const images = [];
    if (req.files && req.files.productImage && req.files.productImage[0]) {
      imageUrl = await uploadToImageKit(req.files.productImage[0], 'agro/products');
    }
    if (req.files && req.files.productImages && req.files.productImages.length > 0) {
      for (const f of req.files.productImages.slice(0, 5)) {
        images.push(await uploadToImageKit(f, 'agro/products'));
      }
    }

    // Create new product
    const product = new Product({
      shopId,
      dealerId: req.user._id,
      productName,
      category,
      description: description || '',
      price: parseFloat(price),
      quantity: parseInt(quantity),
      warehouseQuantity: warehouseQuantity !== undefined ? parseInt(warehouseQuantity) : parseInt(quantity),
      unit: unit || 'kg',
      productImage: imageUrl,
      productImages: images,
      isPublished: isPublished === 'true' || isPublished === true,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product,
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product'
    });
  }
});

// Update product
router.put('/dealer/:productId', roleMiddleware(['dealer']), upload.fields([
  { name: 'productImage', maxCount: 1 },
  { name: 'productImages', maxCount: 5 }
]), async (req, res) => {
  try {
    const { productName, category, description, price, quantity, warehouseQuantity, unit, isPublished, isAvailable } = req.body;
    
    const product = await Product.findOne({
      _id: req.params.productId,
      dealerId: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update fields
    if (productName) product.productName = productName;
    if (category) product.category = category;
    if (description !== undefined) product.description = description;
    if (price) product.price = parseFloat(price);
    if (quantity !== undefined) product.quantity = parseInt(quantity);
    if (warehouseQuantity !== undefined) product.warehouseQuantity = parseInt(warehouseQuantity);
    if (unit) product.unit = unit;
    if (isPublished !== undefined) product.isPublished = isPublished === 'true' || isPublished === true;
    if (isAvailable !== undefined) product.isAvailable = isAvailable === 'true' || isAvailable === true;

    // Upload new images if provided
    if (req.files && req.files.productImage && req.files.productImage[0]) {
      product.productImage = await uploadToImageKit(req.files.productImage[0], 'agro/products');
    }
    if (req.files && req.files.productImages && req.files.productImages.length > 0) {
      const imgs = [];
      for (const f of req.files.productImages.slice(0,5)) {
        imgs.push(await uploadToImageKit(f, 'agro/products'));
      }
      product.productImages = imgs;
    }

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});

// Delete product
router.delete('/dealer/:productId', roleMiddleware(['dealer']), async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.productId,
      dealerId: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

// ==================== FARMER ROUTES ====================

// Get all published products (for farmers to browse)
router.get('/farmer/list', roleMiddleware(['farmer', 'admin']), async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;
    
    // Build query
    const query = {
      isPublished: true,
      isAvailable: true,
      quantity: { $gt: 0 } // Only show products with available stock
    };

    // Add search filter
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    // Add price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const products = await Product.find(query)
      .select('-warehouseQuantity')
      .populate('shopId', 'shopName location ownerName shopImage')
      .populate('dealerId', 'name email mobile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    console.error('Get farmer products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// Get single product details
router.get('/:productId', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .select('-warehouseQuantity')
      .populate('shopId', 'shopName location ownerName shopImage')
      .populate('dealerId', 'name email mobile');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

module.exports = router;

