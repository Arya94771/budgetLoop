const express = require('express');
const protect = require('../middleware/auth');
const { setBudget, getBudgets, deleteBudget } = require('../controllers/budgetController');

const router = express.Router();
router.use(protect);
router.route('/').post(setBudget).get(getBudgets);
router.delete('/:id', deleteBudget);

module.exports = router;