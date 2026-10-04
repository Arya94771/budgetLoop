const mongoose = require('mongoose');
const Budget = require('../models/budget');
const Expense = require('../models/Expense');
const { CATEGORIES } = require('../utils/constants');
const { monthRange } = require('../utils/period');

exports.setBudget = async (req, res) => {
  const { category, limit } = req.body;
  if (!category || !(Number(limit) > 0)) {
    return res.status(400).json({ message: 'Valid category and limit required' });
  }
  if (![...CATEGORIES, 'All'].includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
    
  }
  
  const budget = await Budget.findOneAndUpdate(
    { user: req.user._id, category },
    { limit: Number(limit) },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(201).json(budget);
};

exports.getBudgets = async (req, res) => {
  const range = monthRange(req.query.month);
  if (!range) return res.status(400).json({ message: 'month must be YYYY-MM' });

  const [budgets, rows] = await Promise.all([
    Budget.find({ user: req.user._id }).lean(),
    Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: range.start, $lt: range.end } } },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]),
  ]);

  const byCat = Object.fromEntries(rows.map((r) => [r._id, r.spent]));
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);

  res.json(
    budgets.map((b) => {
      const spent = b.category === 'All' ? totalSpent : byCat[b.category] || 0;
      const percent = Math.round((spent / b.limit) * 100);
      const status = percent >= 100 ? 'exceeded' : percent >= 80 ? 'warning' : 'ok';
      return { ...b, spent, percent, status };
    })
  );
};

exports.deleteBudget = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  const b = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!b) return res.status(404).json({ message: 'Budget not found' });
  res.json({ message: 'Deleted' });
};