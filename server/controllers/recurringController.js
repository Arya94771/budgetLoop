const mongoose = require('mongoose');
const Recurring = require('../models/Recurring');
const Expense = require('../models/Expense');
const { CATEGORIES } = require('../utils/constants');
const { isPlainObject, parseDate, parseMoney } = require('../utils/validation');
const { addPeriod } = require('../utils/recurrence');

exports.createRecurring = async (req, res) => {
  if (!isPlainObject(req.body)) {
    return res.status(400).json({ message: 'Valid recurring expense details required' });
  }
  const { title, amount, category, frequency, startDate } = req.body;
  const parsedAmount = parseMoney(amount);
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 100 ||
      parsedAmount === null || !['weekly', 'monthly'].includes(frequency)) {
    return res.status(400).json({ message: 'title, amount and frequency (weekly/monthly) required' });
  }
  if (category !== undefined && !CATEGORIES.includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }
  const start = startDate === undefined
    ? new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()))
    : parseDate(startDate);
  if (!start) return res.status(400).json({ message: 'Invalid start date' });

  const item = await Recurring.create({
    user: req.user._id,
    title: title.trim(),
    amount: parsedAmount,
    category: category || 'Other',
    frequency,
    nextDate: start,
    scheduleDay: start.getUTCDate(),
  });
  return res.status(201).json(item);
};

exports.getRecurring = async (req, res) => {
  return res.json(await Recurring.find({ user: req.user._id }).sort({ nextDate: 1 }));
};

exports.toggleRecurring = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  if (!isPlainObject(req.body) || typeof req.body.active !== 'boolean') {
    return res.status(400).json({ message: 'active must be a boolean' });
  }
  const item = await Recurring.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { active: req.body.active },
    { returnDocument: 'after', runValidators: true }
  );
  if (!item) return res.status(404).json({ message: 'Not found' });
  return res.json(item);
};

exports.deleteRecurring = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  const item = await Recurring.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!item) return res.status(404).json({ message: 'Not found' });
  return res.json({ message: 'Deleted' });
};

exports.processDue = async (req, res) => {
  const now = new Date();
  const dueItems = await Recurring.find({
    user: req.user._id,
    active: true,
    nextDate: { $lte: now },
  });
  let created = 0;

  for (const recurring of dueItems) {
    let current = recurring.nextDate;
    const scheduleDay = recurring.scheduleDay || current.getUTCDate();
    for (let occurrence = 0; occurrence < 12 && current <= now; occurrence += 1) {
      const next = addPeriod(current, recurring.frequency, scheduleDay);
      let wasCreated = false;
      try {
        await Expense.create({
          user: req.user._id,
          title: recurring.title,
          amount: Number(recurring.amount),
          category: recurring.category,
          date: current,
          note: 'Recurring',
          recurring: recurring._id,
          occurrenceDate: current,
        });
        wasCreated = true;
      } catch (err) {
        if (err.code !== 11000) throw err;
      }

      const claimed = await Recurring.findOneAndUpdate(
        {
          _id: recurring._id,
          user: req.user._id,
          active: true,
          nextDate: current,
        },
        { nextDate: next, scheduleDay },
        { returnDocument: 'after', runValidators: true }
      );
      if (!claimed) break;
      if (wasCreated) created += 1;
      current = next;
    }
  }
  return res.json({ created });
};
