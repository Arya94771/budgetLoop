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

exports.getExpenses = async (req, res) => {
  const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
  res.json(expenses);
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