const express = require('express');
const router = express.Router();
const { getWheel, markSpun } = require('../controllers/gameController');

router.get('/wheel/:code', getWheel);
router.post('/mark-spun', markSpun);

module.exports = router;
