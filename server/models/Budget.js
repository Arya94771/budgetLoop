const mongoose = require('mongoose');
const { CATEGORIES } = require('../utils/constants');

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true, enum: [...CATEGORIES, 'All'] },
    limit: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);
budgetSchema.index({ user: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);