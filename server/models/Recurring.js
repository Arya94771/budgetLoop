const mongoose = require('mongoose');
const { CATEGORIES } = require('../utils/constants');

const recurringSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, enum: CATEGORIES, default: 'Other' },
    frequency: { type: String, enum: ['weekly', 'monthly'], required: true },
    nextDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recurring', recurringSchema);