// routes/organicFarmingRoutes.js
const express = require('express');
const router = express.Router();
const OrganicFarmingRecord = require('../models/OrganicFarmingRecord');
const { roleMiddleware } = require('../middleware/auth');

router.use(roleMiddleware(['farmer', 'admin']));

// Farmer: GET their certification records
router.get('/', async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { farmerId: req.user._id };
  const records = await OrganicFarmingRecord.find(filter);
  res.json({ records });
});

// Farmer: POST add new certification application
router.post('/', async (req, res) => {
  const { certificationType, certificationNumber, validityStart, validityEnd, documents } = req.body;
  if (!certificationType || !validityStart || !validityEnd) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  const record = new OrganicFarmingRecord({
    farmerId: req.user._id,
    certificationType,
    certificationNumber,
    validityStart,
    validityEnd,
    documents,
    status: 'pending',
  });
  await record.save();
  res.json({ message: 'Certification application submitted', record });
});

// Admin: Approve or reject certification
router.patch('/:id/status', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

  const record = await OrganicFarmingRecord.findById(req.params.id);
  if (!record) return res.status(404).json({ message: 'Record not found' });

  record.status = status;
  record.updatedAt = new Date();
  await record.save();
  res.json({ message: `Certification ${status}`, record });
});

module.exports = router;