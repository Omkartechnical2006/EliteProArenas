const express = require('express');
const router  = express.Router();
const { getWheel, getMystery, markSpun } = require('../controllers/gameController');

router.get('/wheel/:code',   getWheel);
router.get('/mystery/:code', getMystery);
router.post('/mark-spun',    markSpun);

module.exports = router;
