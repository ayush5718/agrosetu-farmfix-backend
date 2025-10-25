// models/OrganicFarmingRecord.js
const mongoose = require('mongoose');

const organicFarmingRecordSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  certificationType: { type: String, enum: ['PGS-India', 'NPOP', 'Other'], required: true },
  certificationNumber: String,
  validityStart: Date,
  validityEnd: Date,
  documents: [String], // URLs to scanned certificates
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

module.exports = mongoose.model('OrganicFarmingRecord', organicFarmingRecordSchema);