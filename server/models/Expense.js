const mongoose = require('mongoose');
const { CATEGORIES } = require('../utils/constants');

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'Other',
    },
    date: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 300 },
    recurring: { type: mongoose.Schema.Types.ObjectId, ref: 'Recurring' },
    occurrenceDate: { type: Date },
  },
  { timestamps: true }
);

expenseSchema.index(
  { user: 1, recurring: 1, occurrenceDate: 1 },
  { unique: true, partialFilterExpression: { recurring: { $exists: true } } }
);

module.exports = mongoose.model('Expense', expenseSchema);