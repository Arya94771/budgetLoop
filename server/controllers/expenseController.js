const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const { CATEGORIES } = require('../utils/constants');
const { isPlainObject, parseDate, parseMoney } = require('../utils/validation');

const FIELDS = ['title', 'amount', 'category', 'date', 'note'];
const SORTS = ['date', '-date', 'amount', '-amount'];

const normalizeExpense = (body, partial = false) => {
  if (!isPlainObject(body) || Object.keys(body).some((key) => !FIELDS.includes(key))) return null;
  const normalized = {};
  if (!partial && (typeof body.title !== 'string' || !body.title.trim())) return null;
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 100) return null;
    normalized.title = body.title.trim();
  }
  if (!partial && body.amount === undefined) return null;
  if (body.amount !== undefined) {
    const amount = parseMoney(body.amount);
    if (amount === null) return null;
    normalized.amount = amount;
  }
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) return null;
    normalized.category = body.category;
  }
  if (body.date !== undefined) {
    const date = parseDate(body.date);
    if (!date) return null;
    normalized.date = date;
  }
  if (body.note !== undefined) {
    if (typeof body.note !== 'string' || body.note.length > 300) return null;
    normalized.note = body.note.trim();
  }
  if (partial && Object.keys(normalized).length === 0) return null;
  return normalized;
};

exports.createExpense = async (req, res) => {
  const expenseData = normalizeExpense(req.body);
  if (!expenseData) {
    return res.status(400).json({ message: 'Provide a valid title, amount, and expense details' });
  }
  const expense = await Expense.create({ ...expenseData, user: req.user._id });
  return res.status(201).json(expense);
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const parseQueryInteger = (value, fallback, min, max) => {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
};

exports.getExpenses = async (req, res) => {
  const { category, search, from, to, minAmount, maxAmount, sort } = req.query;
  if (sort !== undefined && !SORTS.includes(sort)) {
    return res.status(400).json({ message: 'Invalid sort order' });
  }
  const page = parseQueryInteger(req.query.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = parseQueryInteger(req.query.limit, 10, 1, 100);
  if (page === null || limit === null) {
    return res.status(400).json({ message: 'Invalid page or limit' });
  }
  if (category !== undefined && !CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }
  if (search !== undefined && (typeof search !== 'string' || search.length > 100)) {
    return res.status(400).json({ message: 'Search must be at most 100 characters' });
  }

  const filter = { user: req.user._id };
  if (category) filter.category = category;
  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };

  if (from || to) {
    filter.date = {};
    const start = from ? parseDate(from) : null;
    const end = to ? parseDate(to) : null;
    if ((from && !start) || (to && !end) || (start && end && start > end)) {
      return res.status(400).json({ message: 'Invalid date range' });
    }
    if (start) filter.date.$gte = start;
    if (end) {
      const exclusiveEnd = new Date(end);
      exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
      filter.date.$lt = exclusiveEnd;
    }
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    filter.amount = {};
    const minimum = minAmount === undefined ? null : parseMoney(minAmount, 0);
    const maximum = maxAmount === undefined ? null : parseMoney(maxAmount);
    if ((minAmount !== undefined && minimum === null) ||
        (maxAmount !== undefined && maximum === null) ||
        (minimum !== null && maximum !== null && minimum > maximum)) {
      return res.status(400).json({ message: 'Invalid amount range' });
    }
    if (minimum !== null) filter.amount.$gte = minimum;
    if (maximum !== null) filter.amount.$lte = maximum;
  }

  const [data, total] = await Promise.all([
    Expense.find(filter).sort(sort || '-date').skip((page - 1) * limit).limit(limit),
    Expense.countDocuments(filter),
  ]);
  return res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
};

exports.updateExpense = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  const updates = normalizeExpense(req.body, true);
  if (!updates) return res.status(400).json({ message: 'Provide valid expense fields to update' });

  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { returnDocument: 'after', runValidators: true }
  );
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  return res.json(expense);
};

exports.deleteExpense = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  return res.json({ message: 'Deleted' });
};

const csvCell = (value) => {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

exports.exportCsv = async (req, res) => {
  const list = await Expense.find({ user: req.user._id }).sort({ date: -1 }).lean();
  const rows = ['Date,Title,Category,Amount,Note'];
  for (const expense of list) {
    const date = expense.date instanceof Date && !Number.isNaN(expense.date.getTime())
      ? expense.date.toISOString().slice(0, 10)
      : '';
    rows.push([
      date,
      expense.title,
      expense.category,
      Number(expense.amount),
      expense.note,
    ].map(csvCell).join(','));
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
  return res.send(`${rows.join('\r\n')}\r\n`);
};
