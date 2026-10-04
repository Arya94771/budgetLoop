const express = require('express');
const protect = require('../middleware/auth');
const { getSummary } = require('../controllers/summaryController');

const router = express.Router();
router.get('/', protect, getSummary);

module.exports = router;