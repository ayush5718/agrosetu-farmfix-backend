// routes/orderRoutes.js
const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const Shop = require('../models/Shop');
const User = require('../models/Users');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// ==================== FARMER ROUTES ====================

// Place order (farmer)
router.post('/place', roleMiddleware(['farmer']), async (req, res) => {
  try {
    const { shopId, products, paymentMode } = req.body;

    // Validation
    if (!shopId || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Shop ID and products are required'
      });
    }

    let totalAmount = 0;
    const orderProducts = [];

    // Validate and calculate total for each product
    for (const item of products) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      if (!product.isPublished || !product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.productName} is not available`
        });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.productName}`
        });
      }

      const productTotal = product.price * item.quantity;
      totalAmount += productTotal;

      orderProducts.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      });

      // Reserve stock: Reduce both visible quantity and warehouse quantity
      // Warehouse quantity is the internal stock that dealer tracks separately
      // Both quantities should decrease when order is placed
      const orderedQty = item.quantity;
      
      // Validate we have enough stock
      if (product.quantity < orderedQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.productName}. Available: ${product.quantity}, Requested: ${orderedQty}`
        });
      }
      
      // Reduce visible stock (quantity) - this is what farmers see
      product.quantity -= orderedQty;
      
      // Reduce warehouse stock (dealer's internal tracking)
      // Always reduce warehouseQuantity if it exists, even if it becomes 0
      if (typeof product.warehouseQuantity === 'number') {
        product.warehouseQuantity = Math.max(0, product.warehouseQuantity - orderedQty);
      }
      
      // Mark as unavailable if stock is exhausted
      if (product.quantity <= 0) {
        product.isAvailable = false;
      }
      
      await product.save();
      
      console.log(`✅ Stock reduced for product "${product.productName}": quantity=${product.quantity} (was ${product.quantity + orderedQty}), warehouseQuantity=${product.warehouseQuantity} (was ${product.warehouseQuantity + orderedQty})`);
    }

    // Get dealer ID from shop
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Create order
    const order = new Order({
      farmerId: req.user._id,
      dealerId: shop.shopOwnerId,
      shopId,
      products: orderProducts,
      paymentMode: paymentMode || 'cod',
      totalAmount,
      status: 'placed'
    });

    await order.save();

    // Create notifications
    // Notification for dealer
    const dealerNotification = new Notification({
      userId: shop.shopOwnerId,
      type: 'order',
      message: `New order #${order._id.toString().slice(-6)} received from ${req.user.name}`,
      read: false
    });
    await dealerNotification.save();

    // Notification for admin
    const adminUsers = await User.find({ role: 'admin', isActive: true });
    for (const admin of adminUsers) {
      const adminNotification = new Notification({
        userId: admin._id,
        type: 'order',
        message: `Farmer ${req.user.name} placed a new order`,
        read: false
      });
      await adminNotification.save();
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place order'
    });
  }
});

// Get farmer's orders
router.get('/farmer/my-orders', roleMiddleware(['farmer']), async (req, res) => {
  try {
    const orders = await Order.find({ farmerId: req.user._id })
      .populate('shopId', 'shopName location')
      .populate('dealerId', 'name email mobile')
      .populate('products.productId', 'productName category price unit productImage')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get farmer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Cancel order (farmer)
router.patch('/farmer/:orderId/cancel', roleMiddleware(['farmer']), async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      farmerId: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Can only cancel if order is placed or assigned
    if (!['placed', 'assigned'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Restore product quantities (both visible stock and warehouse stock)
    for (const item of order.products) {
      const product = await Product.findById(item.productId);
      if (product) {
        const restoredQty = item.quantity;
        
        // Restore visible stock (quantity)
        product.quantity += restoredQty;
        
        // Restore warehouse stock if it was previously set
        // We restore to warehouseQuantity as well to maintain dealer's internal tracking
        if (typeof product.warehouseQuantity === 'number') {
          product.warehouseQuantity += restoredQty;
        }
        
        // Make product available again if stock is restored
        if (product.quantity > 0) {
          product.isAvailable = true;
        }
        
        await product.save();
        
        console.log(`Stock restored for product ${product.productName}: quantity=${product.quantity}, warehouseQuantity=${product.warehouseQuantity}`);
      }
    }

    // Update order status
    order.status = 'cancelled';
    order.updatedAt = Date.now();
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
});

// ==================== DEALER ROUTES ====================

// Get dealer's orders
router.get('/dealer/my-orders', roleMiddleware(['dealer']), async (req, res) => {
  try {
    const orders = await Order.find({ dealerId: req.user._id })
      .populate('farmerId', 'name email mobile')
      .populate('shopId', 'shopName location')
      .populate('products.productId', 'productName category price unit productImage')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get dealer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// Update order status (dealer)
router.patch('/dealer/:orderId/status', roleMiddleware(['dealer']), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['placed', 'assigned', 'ready', 'in_transit', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      dealerId: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you do not have access'
      });
    }

    const oldStatus = order.status;
    
    // If order is being cancelled, restore stock
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      // Restore product quantities (both visible stock and warehouse stock)
      for (const item of order.products) {
        const product = await Product.findById(item.productId);
        if (product) {
          const restoredQty = item.quantity;
          
          // Restore visible stock (quantity)
          product.quantity += restoredQty;
          
          // Restore warehouse stock
          if (typeof product.warehouseQuantity === 'number') {
            product.warehouseQuantity += restoredQty;
          }
          
          // Make product available again if stock is restored
          if (product.quantity > 0) {
            product.isAvailable = true;
          }
          
          await product.save();
          
          console.log(`Stock restored (dealer cancelled order) for product ${product.productName}: quantity=${product.quantity}, warehouseQuantity=${product.warehouseQuantity}`);
        }
      }
    }
    
    order.status = status;
    order.updatedAt = Date.now();
    await order.save();

    // Create notification for farmer
    const farmerNotification = new Notification({
      userId: order.farmerId,
      type: 'order',
      message: `Your order #${order._id.toString().slice(-6)} status changed from ${oldStatus} to ${status}`,
      read: false
    });
    await farmerNotification.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all orders (admin)
router.get('/admin/all', roleMiddleware(['admin']), async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const orders = await Order.find(query)
      .populate('farmerId', 'name email mobile')
      .populate('dealerId', 'name email mobile')
      .populate('shopId', 'shopName location')
      .populate('products.productId', 'productName category price unit productImage')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

module.exports = router;

