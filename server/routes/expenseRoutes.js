const express = require('express');
const protect = require('../middleware/auth');
const { createExpense, getExpenses, updateExpense, deleteExpense } = require('../controllers/expenseController');

const router = express.Router();
router.use(protect);

router.route('/').post(createExpense).get(getExpenses);
router.route('/:id').put(updateExpense).delete(deleteExpense);

module.exports = router;