const express = require('express');
const rateLimit = require('express-rate-limit');
const protect = require('../middleware/auth');
const {
  createExpense, getExpenses, updateExpense, deleteExpense, exportCsv,
} = require('../controllers/expenseController');
const { parseExpense } = require('../controllers/aiController');

const router = express.Router();
router.use(protect);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  message: { message: 'Too many AI requests, wait a minute' },
});

router.get('/export', exportCsv);
router.post('/parse', aiLimiter, parseExpense);
router.route('/').post(createExpense).get(getExpenses);
router.route('/:id').put(updateExpense).delete(deleteExpense);

module.exports = router;