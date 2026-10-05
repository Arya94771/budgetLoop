const Expense = require('../models/Expense');
const { monthRange } = require('../utils/period');

exports.getSummary = async (req, res) => {
  const range = monthRange(req.query.month);
  if (!range) return res.status(400).json({ message: 'month must be YYYY-MM' });

  const trendStart = new Date(Date.UTC(
    range.start.getUTCFullYear(),
    range.start.getUTCMonth() - 5,
    1
  ));
  const totalCentsExpression = {
    $round: [{ $multiply: ['$amount', 100] }, 0],
  };

  const [byCategory, trend] = await Promise.all([
    Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: range.start, $lt: range.end } } },
      {
        $group: {
          _id: '$category',
          totalCents: { $sum: totalCentsExpression },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalCents: -1 } },
    ]),
    Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: trendStart, $lt: range.end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date', timezone: 'UTC' } },
          totalCents: { $sum: totalCentsExpression },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const categories = byCategory.map((category) => ({
    category: category._id,
    total: Number(category.totalCents) / 100,
    count: Number(category.count),
  }));
  return res.json({
    total: categories.reduce((sum, category) => sum + category.total, 0),
    byCategory: categories,
    trend: trend.map((item) => ({
      month: item._id,
      total: Number(item.totalCents) / 100,
    })),
  });
};
