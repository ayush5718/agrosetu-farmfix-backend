// models/CarbonCredit.js
const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['earn', 'redeem'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  certificateId: String,
});

const carbonCreditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalCredits: { type: Number, default: 0 },
  transactions: [creditTransactionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

module.exports = mongoose.model('CarbonCredit', carbonCreditSchema);