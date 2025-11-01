// routes/addressRoutes.js
const express = require('express');
const Address = require('../models/Address');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all addresses for logged-in user (farmer)
router.get('/list', roleMiddleware(['farmer']), async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses'
    });
  }
});

// Get single address
router.get('/:addressId', roleMiddleware(['farmer']), async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.addressId,
      userId: req.user._id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      address
    });
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch address'
    });
  }
});

// Add new address
router.post('/add', roleMiddleware(['farmer']), async (req, res) => {
  try {
    const { label, fullName, mobile, addressLine1, addressLine2, landmark, city, state, pincode, isDefault } = req.body;

    // Validation
    if (!fullName || !mobile || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Full name, mobile, address line 1, city, state, and pincode are required'
      });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await Address.updateMany(
        { userId: req.user._id },
        { $set: { isDefault: false } }
      );
    }

    const address = new Address({
      userId: req.user._id,
      label: label || 'Home',
      fullName,
      mobile,
      addressLine1,
      addressLine2: addressLine2 || '',
      landmark: landmark || '',
      city,
      state,
      pincode,
      isDefault: isDefault || false
    });

    await address.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add address'
    });
  }
});

// Update address
router.put('/:addressId', roleMiddleware(['farmer']), async (req, res) => {
  try {
    const { label, fullName, mobile, addressLine1, addressLine2, landmark, city, state, pincode, isDefault } = req.body;

    const address = await Address.findOne({
      _id: req.params.addressId,
      userId: req.user._id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Update fields
    if (label) address.label = label;
    if (fullName) address.fullName = fullName;
    if (mobile) address.mobile = mobile;
    if (addressLine1) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (landmark !== undefined) address.landmark = landmark;
    if (city) address.city = city;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode;

    // Handle default address
    if (isDefault !== undefined) {
      address.isDefault = isDefault;
      if (isDefault) {
        await Address.updateMany(
          { userId: req.user._id, _id: { $ne: address._id } },
          { $set: { isDefault: false } }
        );
      }
    }

    await address.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      address
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address'
    });
  }
});

// Delete address
router.delete('/:addressId', roleMiddleware(['farmer']), async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.addressId,
      userId: req.user._id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address'
    });
  }
});

// Set default address
router.patch('/:addressId/set-default', roleMiddleware(['farmer']), async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.addressId,
      userId: req.user._id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Unset all other defaults
    await Address.updateMany(
      { userId: req.user._id, _id: { $ne: address._id } },
      { $set: { isDefault: false } }
    );

    // Set this as default
    address.isDefault = true;
    await address.save();

    res.json({
      success: true,
      message: 'Default address updated successfully',
      address
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default address'
    });
  }
});

module.exports = router;

