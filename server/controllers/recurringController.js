const mongoose = require('mongoose');
const Recurring = require('../models/Recurring');
const Expense = require('../models/Expense');
const { CATEGORIES } = require('../utils/constants');

const addPeriod = (date, freq) => {
  const d = new Date(date);
  if (freq === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else {
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay)); // 31 Jan -> 28 Feb jaisa edge case
  }
  return d;
};

exports.createRecurring = async (req, res) => {
  const { title, amount, category, frequency, startDate } = req.body;
  if (!title || !(Number(amount) > 0) || !['weekly', 'monthly'].includes(frequency)) {
    return res.status(400).json({ message: 'title, amount and frequency (weekly/monthly) required' });
  }
  if (category && !CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }
  const start = startDate ? new Date(startDate) : new Date();
  if (isNaN(start)) return res.status(400).json({ message: 'Invalid start date' });

  const item = await Recurring.create({
    user: req.user._id, title, amount: Number(amount), category, frequency, nextDate: start,
  });
  res.status(201).json(item);
};

exports.getRecurring = async (req, res) => {
  res.json(await Recurring.find({ user: req.user._id }).sort({ nextDate: 1 }));
};

exports.toggleRecurring = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  const item = await Recurring.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { active: Boolean(req.body.active) },
    { returnDocument: 'after' }
  );
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
};

exports.deleteRecurring = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  const item = await Recurring.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
};

// Jo recurring due ho chuki hain unke expenses bana deta hai
exports.processDue = async (req, res) => {
  const now = new Date();
  const list = await Recurring.find({ user: req.user._id, active: true, nextDate: { $lte: now } });
  let created = 0;

  for (const r of list) {
    let current = r.nextDate;
    for (let i = 0; i < 12 && current <= now; i++) {
      const next = addPeriod(current, r.frequency);
      // pehle "claim" karo, taaki do requests ek hi expense do baar na bana dein
      const claimed = await Recurring.findOneAndUpdate(
        { _id: r._id, nextDate: current },
        { nextDate: next }
      );
      if (!claimed) break;
      await Expense.create({
        user: r.user, title: r.title, amount: r.amount,
        category: r.category, date: current, note: 'Recurring',
      });
      created++;
      current = next;
    }
  }
  res.json({ created });
};