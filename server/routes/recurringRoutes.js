const express = require('express');
const protect = require('../middleware/auth');
const c = require('../controllers/recurringController');

const router = express.Router();
router.use(protect);

router.post('/process', c.processDue);
router.route('/').post(c.createRecurring).get(c.getRecurring);
router.route('/:id').patch(c.toggleRecurring).delete(c.deleteRecurring);

module.exports = router;