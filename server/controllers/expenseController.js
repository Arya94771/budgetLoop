const mongoose = require('mongoose');
const Expense = require('../models/Expense');

const FIELDS = ['title', 'amount', 'category', 'date', 'note'];

const pick = (body) =>
  Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

exports.createExpense = async (req, res) => {
  const { title, amount } = req.body;
  if (!title || amount == null) {
    return res.status(400).json({ message: 'Title and amount are required' });
  }
  const expense = await Expense.create({ ...pick(req.body), user: req.user._id });
  res.status(201).json(expense);
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORTS = ['date', '-date', 'amount', '-amount'];

exports.getExpenses = async (req, res) => {
  const { category, search, from, to, minAmount, maxAmount } = req.query;
  const sort = SORTS.includes(req.query.sort) ? req.query.sort : '-date';
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

  const filter = { user: req.user._id };

  if (category) filter.category = String(category);
  if (search) filter.title = { $regex: escapeRegex(String(search)), $options: 'i' };

  if (from || to) {
    filter.date = {};
    if (from) {
      const start = new Date(from);
      if (isNaN(start)) return res.status(400).json({ message: 'Invalid from date' });
      filter.date.$gte = start;
    }
    if (to) {
      const end = new Date(to);
      if (isNaN(end)) return res.status(400).json({ message: 'Invalid to date' });
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }

  const [data, total] = await Promise.all([
    Expense.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    Expense.countDocuments(filter),
  ]);

  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
};

exports.updateExpense = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    pick(req.body),
    { new: true, runValidators: true }
  );
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  res.json(expense);
};

exports.deleteExpense = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  res.json({ message: 'Deleted' });
};
const csvCell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s)) s = "'" + s; // CSV injection se bachav
  return `"${s.replace(/"/g, '""')}"`;
};

exports.exportCsv = async (req, res) => {
  const list = await Expense.find({ user: req.user._id }).sort({ date: -1 }).lean();
  const rows = [['Date', 'Title', 'Category', 'Amount', 'Note'].join(',')];
  for (const e of list) {
    rows.push([e.date.toISOString().slice(0, 10), e.title, e.category, e.amount, e.note].map(csvCell).join(','));
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
  res.send(rows.join('\n'));
};