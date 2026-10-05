const mongoose = require('mongoose');
const Budget = require('../models/budget');
const Expense = require('../models/Expense');
const { CATEGORIES } = require('../utils/constants');
const { isPlainObject, parseMoney } = require('../utils/validation');
const { monthRange } = require('../utils/period');

exports.setBudget = async (req, res) => {
  if (!isPlainObject(req.body)) {
    return res.status(400).json({ message: 'Valid category and limit required' });
  }
  const { category, limit } = req.body;
  const parsedLimit = parseMoney(limit);
  if (!CATEGORIES.includes(category) && category !== 'All') {
    return res.status(400).json({ message: 'Invalid category' });
  }
  if (parsedLimit === null) {
    return res.status(400).json({ message: 'Valid category and limit required' });
  }

  const budget = await Budget.findOneAndUpdate(
    { user: req.user._id, category },
    { limit: parsedLimit },
    { returnDocument: 'after', upsert: true, runValidators: true }
  );
  return res.status(201).json(budget);
};

exports.getBudgets = async (req, res) => {
  const range = monthRange(req.query.month);
  if (!range) return res.status(400).json({ message: 'month must be YYYY-MM' });

  const [budgets, rows] = await Promise.all([
    Budget.find({ user: req.user._id }).lean(),
    Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: range.start, $lt: range.end } } },
      {
        $group: {
          _id: '$category',
          spentCents: {
            $sum: { $round: [{ $multiply: ['$amount', 100] }, 0] },
          },
        },
      },
    ]),
  ]);

  const byCategory = Object.fromEntries(rows.map((row) => [row._id, row.spentCents / 100]));
  const totalSpent = rows.reduce((sum, row) => sum + Number(row.spentCents), 0) / 100;

  return res.json(
    budgets.map((budget) => {
      const spent = budget.category === 'All' ? totalSpent : byCategory[budget.category] || 0;
      const limitValue = Number(budget.limit);
      const percent = limitValue > 0 ? Math.round((spent / limitValue) * 100) : 0;
      const status = percent >= 100 ? 'exceeded' : percent >= 80 ? 'warning' : 'ok';
      return { ...budget, spent, percent, status };
    })
  );
};

exports.deleteBudget = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!budget) return res.status(404).json({ message: 'Budget not found' });
  return res.json({ message: 'Deleted' });
};
