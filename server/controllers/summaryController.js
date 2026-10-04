const Expense = require('../models/Expense');
const { monthRange } = require('../utils/period');

exports.getSummary = async (req, res) => {
  const range = monthRange(req.query.month);
  if (!range) return res.status(400).json({ message: 'month must be YYYY-MM' });

  const trendStart = new Date(range.start.getFullYear(), range.start.getMonth() - 5, 1);

  const [byCategory, trend] = await Promise.all([
    Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: range.start, $lt: range.end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: trendStart, $lt: range.end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date', timezone: 'Asia/Kolkata' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    total: byCategory.reduce((s, c) => s + c.total, 0),
    byCategory: byCategory.map((c) => ({ category: c._id, total: c.total, count: c.count })),
    trend: trend.map((t) => ({ month: t._id, total: t.total })),
  });
};